package com.eneml.ajs.integration;

import com.eneml.ajs.identity.api.JwtClaims;
import com.eneml.ajs.identity.api.UserProvisioning;
import com.eneml.ajs.integration.internal.application.JatsGenerator;
import com.eneml.ajs.publication.api.AccessStatus;
import com.eneml.ajs.publication.internal.application.DoiService;
import com.eneml.ajs.publication.internal.application.PublicationService;
import com.eneml.ajs.publication.internal.web.dto.PublicationUpsertRequest;
import com.eneml.ajs.submission.internal.application.SubmissionService;
import com.eneml.ajs.submission.internal.web.dto.SubmissionStartRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import java.io.StringReader;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Transactional
class IntegrationModuleIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired JatsGenerator jatsGenerator;
    @Autowired PublicationService publications;
    @Autowired SubmissionService submissionService;
    @Autowired DoiService doiService;
    @Autowired UserProvisioning provisioning;
    @Autowired com.eneml.ajs.journal.api.SectionLookup sectionLookup;

    @Test
    void generatesJatsXmlForPublishedArticle() throws Exception {
        Long actor = provisionUser("kc-jats1", "j1@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "Phenomenology Today"));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest(
                "Phenomenology Today",
                "phen-today",
                Map.of("en", "An exploration of perception."),
                List.of("phenomenology", "perception")));
        publications.publish(draft.getId());

        String xml = jatsGenerator.generate(draft.getId());

        assertThat(xml).startsWith("<?xml version=\"1.0\"");
        assertThat(xml).contains("<article-title>Phenomenology Today</article-title>");
        assertThat(xml).contains("<kwd>phenomenology</kwd>");
        assertThat(xml).contains("An exploration of perception.");
        // Make sure it's well-formed XML, not just stringly-typed.
        Document doc = parseXml(xml);
        assertThat(doc.getDocumentElement().getNodeName()).isEqualTo("article");
    }

    @Test
    void includesDoiAsArticleIdWhenAssigned() throws Exception {
        Long actor = provisionUser("kc-jats2", "j2@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "DOI Demo"));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest(
                "DOI Demo", "doi-demo", Map.of(), List.of()));
        publications.publish(draft.getId());

        doiService.assignToPublication(draft.getId(), "10.1234/demo.42");

        String xml = jatsGenerator.generate(draft.getId());
        assertThat(xml).contains(
                "<article-id pub-id-type=\"doi\">10.1234/demo.42</article-id>");
        parseXml(xml); // well-formed
    }

    @Test
    void escapesXmlMetacharactersInTitleAndAbstract() throws Exception {
        Long actor = provisionUser("kc-jats3", "j3@test.local");
        Long submissionId = aSubmission(actor, Map.of("en", "T < & > \"quoted\""));
        var draft = publications.draftFirstVersion(submissionId);
        publications.update(draft.getId(), upsertRequest(
                "T < & > \"quoted\"", "esc-1",
                Map.of("en", "<script>alert(1)</script>"),
                List.of()));
        publications.publish(draft.getId());

        String xml = jatsGenerator.generate(draft.getId());
        assertThat(xml).doesNotContain("<script>alert");
        assertThat(xml).contains("&lt;script&gt;alert(1)&lt;/script&gt;");
        parseXml(xml); // well-formed
    }

    private Document parseXml(String xml) throws Exception {
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        f.setNamespaceAware(true);
        // Don't try to fetch the JATS DTD over the network during tests.
        f.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        f.setFeature("http://xml.org/sax/features/external-general-entities", false);
        f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        DocumentBuilder b = f.newDocumentBuilder();
        return b.parse(new InputSource(new StringReader(xml)));
    }

    private Long aSubmission(Long submitterId, Map<String, String> title) {
        Long sectionId = articlesSectionId();
        var draft = submissionService.start(
                new SubmissionStartRequest(sectionId, "en"), submitterId);
        var s = submissionService.get(draft.getId());
        s.setTitle(title);
        return submissionService.submit(draft.getId(), submitterId).getId();
    }

    private Long articlesSectionId() {
        return sectionLookup.findByCode("articles").orElseThrow().id();
    }

    private Long provisionUser(String sub, String email) {
        return provisioning.ensureProvisioned(new JwtClaims(
                sub, email, sub, "Test", "User", "en", null, Set.of()));
    }

    private PublicationUpsertRequest upsertRequest(
            String title,
            String urlPath,
            Map<String, String> abstractText,
            List<String> keywords) {
        return new PublicationUpsertRequest(
                AccessStatus.OPEN,
                articlesSectionId(),
                null,
                null,
                urlPath,
                null,
                null,
                null,
                null,
                Map.of("en", title),
                abstractText,
                keywords,
                List.of(),
                "en");
    }
}
