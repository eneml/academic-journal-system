package com.eneml.ajs.issue;

import com.eneml.ajs.issue.api.IssueCreated;
import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssuePublished;
import com.eneml.ajs.issue.api.IssueUnpublished;
import com.eneml.ajs.issue.internal.application.IssueService;
import com.eneml.ajs.issue.internal.web.dto.IssueUpsertRequest;
import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.shared.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class IssueModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired IssueService issues;
    @Autowired IssueLookup issueLookup;
    @Autowired ApplicationEvents events;

    @Test
    void createPersistsAndEmitsEvent() {
        events.clear();
        var i = issues.create(req(12, "3", 2026, "Spring 2026", "v12-n3"));

        assertThat(i.getId()).isNotNull();
        assertThat(i.isPublished()).isFalse();
        assertThat(events.stream(IssueCreated.class)).hasSize(1);
    }

    @Test
    void cannotReuseUrlPath() {
        issues.create(req(1, "1", 2026, "First", "first-issue"));

        assertThatThrownBy(() -> issues.create(req(1, "2", 2026, "Second", "first-issue")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void publishMovesIssueAndEmits() {
        var i = issues.create(req(1, "1", 2026, "T", "t-1"));
        events.clear();

        issues.publish(i.getId());

        var refreshed = issueLookup.findById(i.getId()).orElseThrow();
        assertThat(refreshed.published()).isTrue();
        assertThat(refreshed.datePublished()).isNotNull();
        assertThat(events.stream(IssuePublished.class)).hasSize(1);
    }

    @Test
    void cannotDeletePublishedIssue() {
        var i = issues.create(req(1, "1", 2026, "T", "t-2"));
        issues.publish(i.getId());

        assertThatThrownBy(() -> issues.delete(i.getId()))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void unpublishEmitsEvent() {
        var i = issues.create(req(1, "1", 2026, "T", "t-3"));
        issues.publish(i.getId());
        events.clear();

        issues.unpublish(i.getId());

        assertThat(events.stream(IssueUnpublished.class)).hasSize(1);
    }

    @Test
    void lookupCurrentReturnsLatestPublished() {
        var i1 = issues.create(req(1, "1", 2026, "Older", "older"));
        issues.publish(i1.getId());
        var i2 = issues.create(req(1, "2", 2026, "Newer", "newer"));
        issues.publish(i2.getId());

        var current = issueLookup.findCurrent().orElseThrow();
        assertThat(current.id()).isEqualTo(i2.getId());
    }

    @Test
    void identificationFormatsHumanReadable() {
        var i = issues.create(req(7, "2", 2026, "Spring", "i-7-2"));
        issues.publish(i.getId());

        var summary = issueLookup.findById(i.getId()).orElseThrow();
        assertThat(summary.identification()).isEqualTo("Vol. 7 No. 2 (2026)");
    }

    private static IssueUpsertRequest req(int volume, String number, int year, String title, String urlPath) {
        return new IssueUpsertRequest(
                volume, number, year,
                Map.of("en", title),
                Map.of(),
                null,
                urlPath,
                true, true, true, true,
                AccessStatus.OPEN);
    }
}
