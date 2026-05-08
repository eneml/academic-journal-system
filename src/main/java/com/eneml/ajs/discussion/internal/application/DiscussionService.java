package com.eneml.ajs.discussion.internal.application;

import com.eneml.ajs.discussion.api.DiscussionMessagePosted;
import com.eneml.ajs.discussion.api.DiscussionMessageSummary;
import com.eneml.ajs.discussion.api.DiscussionStarted;
import com.eneml.ajs.discussion.api.DiscussionSummary;
import com.eneml.ajs.discussion.internal.domain.Discussion;
import com.eneml.ajs.discussion.internal.domain.DiscussionMessage;
import com.eneml.ajs.discussion.internal.domain.DiscussionParticipant;
import com.eneml.ajs.discussion.internal.persistence.DiscussionMessageRepository;
import com.eneml.ajs.discussion.internal.persistence.DiscussionParticipantRepository;
import com.eneml.ajs.discussion.internal.persistence.DiscussionRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussions;
    private final DiscussionMessageRepository messages;
    private final DiscussionParticipantRepository participants;
    private final ApplicationEventPublisher events;

    /**
     * Open a new thread on the submission. The opener and all initial
     * participants get added to the participant list; the opener's first
     * message is persisted in the same transaction.
     */
    @Transactional
    public DiscussionSummary open(Long submissionId,
                                   SubmissionStage stage,
                                   String subject,
                                   String firstMessage,
                                   Long openerUserId,
                                   Set<Long> initialParticipantIds) {
        Discussion d = new Discussion();
        d.setSubmissionId(submissionId);
        d.setStage(stage);
        d.setSubject(subject);
        d.setStartedByUserId(openerUserId);
        d.setSeq(discussions.findBySubmissionIdOrderBySeqAsc(submissionId).size());
        d.setDateStarted(Instant.now());
        d.setDateModified(Instant.now());
        d = discussions.save(d);

        Set<Long> userSet = new LinkedHashSet<>();
        userSet.add(openerUserId);
        if (initialParticipantIds != null) userSet.addAll(initialParticipantIds);
        for (Long userId : userSet) {
            DiscussionParticipant p = new DiscussionParticipant();
            p.setDiscussionId(d.getId());
            p.setUserId(userId);
            p.setAddedAt(Instant.now());
            participants.save(p);
        }

        if (firstMessage != null && !firstMessage.isBlank()) {
            DiscussionMessage m = new DiscussionMessage();
            m.setDiscussionId(d.getId());
            m.setAuthorUserId(openerUserId);
            m.setBody(firstMessage);
            m.setPostedAt(Instant.now());
            messages.save(m);
        }

        events.publishEvent(DiscussionStarted.of(
                d.getId(), submissionId, stage, subject, openerUserId, new ArrayList<>(userSet)));
        return summarise(d);
    }

    /**
     * Internal/admin shortcut — returns every thread on the submission
     * regardless of who's a participant. Only call from audit / admin
     * surfaces; reviewer/author UI should use the viewer-scoped overload.
     */
    @Transactional(readOnly = true)
    public List<DiscussionSummary> listForSubmissionUnsafe(Long submissionId, SubmissionStage stage) {
        List<Discussion> found = stage == null
                ? discussions.findBySubmissionIdOrderBySeqAsc(submissionId)
                : discussions.findBySubmissionIdAndStageOrderBySeqAsc(submissionId, stage);
        return found.stream().map(this::summarise).toList();
    }

    @Transactional(readOnly = true)
    public List<DiscussionSummary> listForSubmission(Long submissionId, SubmissionStage stage, Long viewerUserId) {
        List<Discussion> found = stage == null
                ? discussions.findBySubmissionIdOrderBySeqAsc(submissionId)
                : discussions.findBySubmissionIdAndStageOrderBySeqAsc(submissionId, stage);
        // Caller-side filter: viewers only see threads they participate in.
        // (Editors and admins are added as participants automatically by the
        // workflow listener; fallback when they aren't is to show no threads.)
        List<Long> myThreadIds = participants.findByUserId(viewerUserId).stream()
                .map(DiscussionParticipant::getDiscussionId)
                .toList();
        return found.stream()
                .filter(d -> myThreadIds.contains(d.getId()))
                .map(this::summarise)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiscussionMessageSummary> messagesOf(Long discussionId, Long viewerUserId) {
        ensureParticipant(discussionId, viewerUserId);
        return messages.findByDiscussionIdOrderByPostedAtAsc(discussionId).stream()
                .map(m -> new DiscussionMessageSummary(
                        m.getId(),
                        m.getDiscussionId(),
                        m.getAuthorUserId(),
                        m.getBody(),
                        m.getPostedAt(),
                        m.getEditedAt()))
                .toList();
    }

    @Transactional
    public DiscussionMessageSummary postMessage(Long discussionId, Long authorUserId, String body) {
        ensureParticipant(discussionId, authorUserId);
        Discussion d = discussions.findById(discussionId)
                .orElseThrow(() -> NotFoundException.of("Discussion", discussionId));
        if (d.isClosed()) {
            throw new IllegalStateException("Discussion is closed");
        }
        DiscussionMessage m = new DiscussionMessage();
        m.setDiscussionId(discussionId);
        m.setAuthorUserId(authorUserId);
        m.setBody(body);
        m.setPostedAt(Instant.now());
        DiscussionMessage saved = messages.save(m);
        d.setDateModified(Instant.now());

        List<Long> recipients = participants.findByDiscussionId(discussionId).stream()
                .map(DiscussionParticipant::getUserId)
                .filter(uid -> !uid.equals(authorUserId))
                .toList();
        events.publishEvent(DiscussionMessagePosted.of(
                discussionId, saved.getId(), d.getSubmissionId(), d.getStage(),
                d.getSubject(), authorUserId, recipients));
        return new DiscussionMessageSummary(
                saved.getId(),
                saved.getDiscussionId(),
                saved.getAuthorUserId(),
                saved.getBody(),
                saved.getPostedAt(),
                saved.getEditedAt());
    }

    @Transactional
    public void close(Long discussionId, Long actorUserId) {
        ensureParticipant(discussionId, actorUserId);
        Discussion d = discussions.findById(discussionId)
                .orElseThrow(() -> NotFoundException.of("Discussion", discussionId));
        d.setClosed(true);
        d.setClosedAt(Instant.now());
        d.setDateModified(Instant.now());
    }

    @Transactional
    public void addParticipant(Long discussionId, Long userId, Long actorUserId) {
        ensureParticipant(discussionId, actorUserId);
        if (participants.existsByDiscussionIdAndUserId(discussionId, userId)) return;
        DiscussionParticipant p = new DiscussionParticipant();
        p.setDiscussionId(discussionId);
        p.setUserId(userId);
        p.setAddedAt(Instant.now());
        participants.save(p);
    }

    @Transactional
    public void removeParticipant(Long discussionId, Long userId, Long actorUserId) {
        ensureParticipant(discussionId, actorUserId);
        participants.deleteByDiscussionIdAndUserId(discussionId, userId);
    }

    private DiscussionSummary summarise(Discussion d) {
        List<Long> participantIds = participants.findByDiscussionId(d.getId()).stream()
                .map(DiscussionParticipant::getUserId)
                .toList();
        long count = messages.countByDiscussionId(d.getId());
        return new DiscussionSummary(
                d.getId(),
                d.getSubmissionId(),
                d.getStage(),
                d.getSubject(),
                d.getStartedByUserId(),
                d.isClosed(),
                d.getClosedAt(),
                d.getDateStarted(),
                d.getDateModified(),
                (int) count,
                participantIds);
    }

    private void ensureParticipant(Long discussionId, Long userId) {
        if (!participants.existsByDiscussionIdAndUserId(discussionId, userId)) {
            throw new AccessDeniedException("You are not a participant of this discussion");
        }
    }

    /**
     * Cross-module read used by frontends + DiscussionLookup. Returns every
     * thread the user can see across submissions.
     */
    @Transactional(readOnly = true)
    public List<DiscussionSummary> listForUser(Long userId) {
        Set<Long> ids = new LinkedHashSet<>();
        for (DiscussionParticipant p : participants.findByUserId(userId)) {
            ids.add(p.getDiscussionId());
        }
        if (ids.isEmpty()) return List.of();
        Map<Long, Discussion> byId = discussions.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(Discussion::getId, d -> d));
        return ids.stream()
                .map(byId::get)
                .filter(java.util.Objects::nonNull)
                .map(this::summarise)
                .toList();
    }
}
