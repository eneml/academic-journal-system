package com.eneml.ajs.invitation.internal.application;

import com.eneml.ajs.invitation.api.InvitationCreated;
import com.eneml.ajs.invitation.api.InvitationStatus;
import com.eneml.ajs.invitation.api.InvitationType;
import com.eneml.ajs.invitation.internal.domain.UserInvitation;
import com.eneml.ajs.invitation.internal.persistence.UserInvitationRepository;
import com.eneml.ajs.invitation.internal.web.dto.InvitationCreateRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InvitationService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int DEFAULT_EXPIRY_DAYS = 14;
    private static final int MAX_EXPIRY_DAYS = 90;

    private final UserInvitationRepository repository;
    private final ApplicationEventPublisher events;

    public List<UserInvitation> listAll() {
        return repository.findAll();
    }

    public UserInvitation get(Long id) {
        return repository.findById(id).orElseThrow(() ->
                NotFoundException.of("UserInvitation", id));
    }

    public UserInvitation findByKey(String key) {
        String hash = sha256(key);
        return repository.findByKeyHash(hash).orElseThrow(() ->
                NotFoundException.of("UserInvitation", "key=" + abbrev(key)));
    }

    @Transactional
    public Result create(InvitationCreateRequest request, Long invitedByUserId) {
        if (request.email() == null || request.email().isBlank()) {
            throw new ConflictException("Invitation email is required");
        }
        int days = request.expiresInDays() == null
                ? DEFAULT_EXPIRY_DAYS
                : Math.min(MAX_EXPIRY_DAYS, request.expiresInDays());
        String secret = randomSecret();

        UserInvitation inv = new UserInvitation();
        inv.setType(request.type());
        inv.setEmail(request.email());
        inv.setPayload(request.payload() == null ? new HashMap<>() : new HashMap<>(request.payload()));
        inv.setKeyHash(sha256(secret));
        inv.setInvitedByUserId(invitedByUserId);
        inv.setExpiresAt(Instant.now().plus(days, ChronoUnit.DAYS));
        UserInvitation saved = repository.save(inv);

        events.publishEvent(InvitationCreated.of(saved.getId(), saved.getType(),
                saved.getEmail(), secret, saved.getExpiresAt(), invitedByUserId));
        log.info("invitation: created {} for {} (id={}, expires={})",
                saved.getType(), saved.getEmail(), saved.getId(), saved.getExpiresAt());
        return new Result(saved, secret);
    }

    @Transactional
    public UserInvitation cancel(Long id) {
        UserInvitation inv = get(id);
        if (inv.getStatus() == InvitationStatus.PENDING) {
            inv.setStatus(InvitationStatus.CANCELLED);
        }
        return inv;
    }

    @Transactional
    public UserInvitation accept(String key, Long acceptedUserId) {
        UserInvitation inv = findByKey(key);
        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new ConflictException(
                    "Invitation %d cannot be accepted (status=%s)".formatted(inv.getId(), inv.getStatus()));
        }
        if (inv.isExpired()) {
            inv.setStatus(InvitationStatus.EXPIRED);
            throw new ConflictException("Invitation %d is expired".formatted(inv.getId()));
        }
        inv.setStatus(InvitationStatus.ACCEPTED);
        inv.setAcceptedUserId(acceptedUserId);
        inv.setAcceptedAt(Instant.now());
        return inv;
    }

    @Transactional
    public UserInvitation decline(String key) {
        UserInvitation inv = findByKey(key);
        if (inv.getStatus() == InvitationStatus.PENDING) {
            inv.setStatus(InvitationStatus.DECLINED);
        }
        return inv;
    }

    /**
     * Marks PENDING rows past their {@code expiresAt} as EXPIRED. Called
     * by the scheduling job on a daily cron.
     */
    @Transactional
    public int sweepExpired() {
        int count = 0;
        for (UserInvitation inv : repository.findByStatusAndExpiresAtBefore(
                InvitationStatus.PENDING, Instant.now())) {
            inv.setStatus(InvitationStatus.EXPIRED);
            count++;
        }
        return count;
    }

    private static String randomSecret() {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String abbrev(String s) {
        return s == null || s.length() < 8 ? "<short>" : s.substring(0, 6) + "…";
    }

    public record Result(UserInvitation invitation, String secret) {}
}
