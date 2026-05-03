package com.eneml.ajs.journal;

import com.eneml.ajs.journal.api.GenreCategory;
import com.eneml.ajs.journal.api.GenreCreated;
import com.eneml.ajs.journal.api.GenreLookup;
import com.eneml.ajs.journal.api.GenreToggled;
import com.eneml.ajs.journal.api.JournalConfigUpdated;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.journal.api.SectionCreated;
import com.eneml.ajs.journal.api.SectionDeactivated;
import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionUpdated;
import com.eneml.ajs.journal.internal.application.GenreService;
import com.eneml.ajs.journal.internal.application.JournalConfigService;
import com.eneml.ajs.journal.internal.application.SectionService;
import com.eneml.ajs.journal.internal.web.dto.GenreCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.JournalConfigUpdateRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionCreateRequest;
import com.eneml.ajs.journal.internal.web.dto.SectionUpdateRequest;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
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

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@RecordApplicationEvents
@Transactional
class JournalModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired SectionService sectionService;
    @Autowired GenreService genreService;
    @Autowired JournalConfigService journalConfigService;

    @Autowired SectionLookup sectionLookup;
    @Autowired GenreLookup genreLookup;
    @Autowired JournalLookup journalLookup;

    @Autowired ApplicationEvents events;

    // ------------------------------------------------------------------
    // Section
    // ------------------------------------------------------------------

    @Test
    void seedDataIsPresent() {
        // V20 migration seeds three default sections
        assertThat(sectionLookup.listActive())
                .extracting(s -> s.code())
                .containsExactlyInAnyOrder("articles", "reviews", "editorials");
    }

    @Test
    void createsSectionAndEmitsEvent() {
        var request = sampleSectionCreate("interviews");

        var created = sectionService.create(request);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getCode()).isEqualTo("interviews");
        assertThat(events.stream(SectionCreated.class))
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.sectionId()).isEqualTo(created.getId());
                    assertThat(e.code()).isEqualTo("interviews");
                });
    }

    @Test
    void rejectsDuplicateSectionCode() {
        sectionService.create(sampleSectionCreate("commentary"));

        assertThatThrownBy(() -> sectionService.create(sampleSectionCreate("commentary")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("commentary");
    }

    @Test
    void deactivateHidesFromActiveListAndEmitsEvent() {
        var section = sectionService.create(sampleSectionCreate("symposium"));

        sectionService.deactivate(section.getId());

        assertThat(sectionLookup.listActive())
                .extracting(s -> s.code())
                .doesNotContain("symposium");
        assertThat(events.stream(SectionDeactivated.class))
                .anyMatch(e -> e.sectionId().equals(section.getId()));
    }

    @Test
    void updateChangesMutableFieldsButNotCode() {
        var section = sectionService.create(sampleSectionCreate("notes"));

        var update = new SectionUpdateRequest(
                42, null, true, false, false, false, false, false, 250,
                Map.of("en", "Notes & Comments"),
                Map.of("en", "N&C"),
                Map.of("en", "Short notes only"),
                Map.of()
        );
        var updated = sectionService.update(section.getId(), update);

        assertThat(updated.getCode()).isEqualTo("notes"); // immutable
        assertThat(updated.getSeq()).isEqualTo(42);
        assertThat(updated.getTitle()).containsEntry("en", "Notes & Comments");
        assertThat(updated.isEditorRestricted()).isTrue();
        assertThat(events.stream(SectionUpdated.class))
                .anyMatch(e -> e.sectionId().equals(section.getId()));
    }

    @Test
    void reorderAssignsSequentialSeqValues() {
        var a = sectionService.create(sampleSectionCreate("alpha"));
        var b = sectionService.create(sampleSectionCreate("beta"));
        var c = sectionService.create(sampleSectionCreate("gamma"));

        sectionService.reorder(List.of(c.getId(), a.getId(), b.getId()));

        assertThat(sectionService.get(c.getId()).getSeq()).isEqualTo(10);
        assertThat(sectionService.get(a.getId()).getSeq()).isEqualTo(20);
        assertThat(sectionService.get(b.getId()).getSeq()).isEqualTo(30);
    }

    @Test
    void reorderFailsForUnknownIds() {
        var a = sectionService.create(sampleSectionCreate("delta"));

        assertThatThrownBy(() -> sectionService.reorder(List.of(a.getId(), 999_999L)))
                .isInstanceOf(NotFoundException.class);
    }

    // ------------------------------------------------------------------
    // Genre
    // ------------------------------------------------------------------

    @Test
    void seededGenresIncludeArticleText() {
        assertThat(genreLookup.findByCode("article-text"))
                .get()
                .satisfies(g -> {
                    assertThat(g.category()).isEqualTo(GenreCategory.DOCUMENT);
                    assertThat(g.required()).isTrue();
                });
    }

    @Test
    void disablingAGenreRemovesItFromEnabledListing() {
        var g = genreService.create(new GenreCreateRequest(
                "supplementary-video", 200, GenreCategory.SUPPLEMENTARY,
                false, true, false,
                Map.of("en", "Supplementary Video")));

        events.clear();
        genreService.setEnabled(g.getId(), false);

        assertThat(genreLookup.listEnabled())
                .extracting(s -> s.code())
                .doesNotContain("supplementary-video");
        assertThat(events.stream(GenreToggled.class))
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.genreId()).isEqualTo(g.getId());
                    assertThat(e.enabled()).isFalse();
                });
    }

    @Test
    void togglingAlreadyDisabledGenreIsNoOp() {
        var g = genreService.create(new GenreCreateRequest(
                "audio-clip", 210, GenreCategory.SUPPLEMENTARY,
                false, true, false,
                Map.of("en", "Audio Clip")));
        genreService.setEnabled(g.getId(), false);
        events.clear();

        genreService.setEnabled(g.getId(), false);

        assertThat(events.stream(GenreToggled.class)).isEmpty();
    }

    @Test
    void genreCreatedEventCarriesIdAndCode() {
        events.clear();
        var g = genreService.create(new GenreCreateRequest(
                "video-abstract", 300, GenreCategory.SUPPLEMENTARY,
                false, true, false,
                Map.of("en", "Video Abstract")));

        assertThat(events.stream(GenreCreated.class))
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.genreId()).isEqualTo(g.getId());
                    assertThat(e.code()).isEqualTo("video-abstract");
                });
    }

    // ------------------------------------------------------------------
    // JournalConfig (singleton)
    // ------------------------------------------------------------------

    @Test
    void singletonConfigIsAvailableImmediatelyAfterMigration() {
        var cfg = journalLookup.getConfig();

        assertThat(cfg.defaultLocale()).isEqualTo("en");
        assertThat(cfg.supportedLocales()).contains("en");
        assertThat(cfg.submissionsOpen()).isTrue();
    }

    @Test
    void updatingConfigPersistsAndEmitsEvent() {
        events.clear();

        journalConfigService.update(new JournalConfigUpdateRequest(
                Map.of("en", "AJS Quarterly", "ro", "Trimestrial AJS"),
                "1234-567X",
                null,
                "en",
                Set.of("en", "ro"),
                "editor@journal.test",
                Map.of("en", "Published quarterly"),
                Map.of("en", "© 2026 AJS"),
                "https://creativecommons.org/licenses/by/4.0/",
                Map.of("en", "About this journal..."),
                false));

        var refreshed = journalLookup.getConfig();
        assertThat(refreshed.name()).containsEntry("en", "AJS Quarterly");
        assertThat(refreshed.supportedLocales()).containsExactlyInAnyOrder("en", "ro");
        assertThat(refreshed.submissionsOpen()).isFalse();
        assertThat(events.stream(JournalConfigUpdated.class)).hasSize(1);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private static SectionCreateRequest sampleSectionCreate(String code) {
        return new SectionCreateRequest(
                code, 100, null, false, true, true, true, false, false, null,
                Map.of("en", code),
                Map.of("en", code.toUpperCase()),
                Map.of(),
                Map.of());
    }
}
