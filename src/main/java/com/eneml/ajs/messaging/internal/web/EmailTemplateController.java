package com.eneml.ajs.messaging.internal.web;

import com.eneml.ajs.messaging.internal.application.template.MailRenderer;
import com.eneml.ajs.messaging.internal.domain.EmailTemplate;
import com.eneml.ajs.messaging.internal.domain.EmailTemplateLocale;
import com.eneml.ajs.messaging.internal.persistence.EmailTemplateRepository;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateLocaleResponse;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateLocaleUpsertRequest;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateRenderRequest;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateRenderResponse;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateResponse;
import com.eneml.ajs.shared.exception.NotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
class EmailTemplateController {

    private static final Pattern LOCALE_TAG = Pattern.compile("^[a-z]{2,3}(-[A-Z]{2})?$");

    private final EmailTemplateRepository repository;
    private final MailRenderer renderer;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> list() {
        return repository.findAllByOrderByKeyAsc().stream()
                .map(EmailTemplateController::toResponse)
                .toList();
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public EmailTemplateResponse one(@PathVariable String key) {
        return toResponse(load(key));
    }

    /**
     * Pre-render a template against the supplied vars. Open to anyone in an
     * editorial role so the decision wizard can show the editor what the
     * default email body will look like before they edit it.
     */
    @PostMapping("/{key}/render")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR','SECTION_EDITOR')")
    @Transactional(readOnly = true)
    public EmailTemplateRenderResponse render(@PathVariable String key,
                                               @RequestBody @Valid EmailTemplateRenderRequest body) {
        validateLocale(body.locale());
        EmailTemplate template = load(key);
        EmailTemplateLocale row = template.getLocales().get(body.locale());
        if (row == null) {
            // Fall back to any locale we have so the editor at least sees something.
            row = template.getLocales().values().stream()
                    .min(Comparator.comparing(EmailTemplateLocale::getLocale))
                    .orElse(null);
        }
        if (row == null) {
            return new EmailTemplateRenderResponse(key, body.locale(), false, "", "");
        }
        Map<String, Object> vars = body.vars() == null ? Map.of() : body.vars();
        String subject = renderer.render(row.getSubject(), vars);
        String renderedBody = renderer.render(row.getBody(), vars);
        return new EmailTemplateRenderResponse(key, row.getLocale(), true, subject, renderedBody);
    }

    @PutMapping("/{key}/locales/{locale}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<EmailTemplateResponse> upsertLocale(
            @PathVariable String key,
            @PathVariable String locale,
            @RequestBody @Valid EmailTemplateLocaleUpsertRequest body) {
        validateLocale(locale);
        EmailTemplate template = load(key);
        boolean isNew = !template.getLocales().containsKey(locale);
        EmailTemplateLocale row = template.getLocales().computeIfAbsent(locale, l -> {
            EmailTemplateLocale fresh = new EmailTemplateLocale();
            fresh.setTemplate(template);
            fresh.setLocale(l);
            return fresh;
        });
        row.setSubject(body.subject());
        row.setBody(body.body());
        template.setCustom(true);
        repository.save(template);
        return ResponseEntity
                .status(isNew ? HttpStatus.CREATED : HttpStatus.OK)
                .body(toResponse(template));
    }

    @DeleteMapping("/{key}/locales/{locale}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Void> deleteLocale(
            @PathVariable String key,
            @PathVariable String locale) {
        validateLocale(locale);
        EmailTemplate template = load(key);
        EmailTemplateLocale removed = template.getLocales().remove(locale);
        if (removed == null) {
            return ResponseEntity.notFound().build();
        }
        if (template.getLocales().isEmpty()) {
            template.setCustom(false);
        }
        repository.save(template);
        return ResponseEntity.noContent().build();
    }

    private EmailTemplate load(String key) {
        return repository.findByKey(key)
                .orElseThrow(() -> new NotFoundException("email template not found: " + key));
    }

    private static void validateLocale(String locale) {
        if (locale == null || !LOCALE_TAG.matcher(locale).matches()) {
            throw new IllegalArgumentException("locale must be a BCP-47 tag like 'en' or 'en-US'");
        }
    }

    private static EmailTemplateResponse toResponse(EmailTemplate t) {
        List<EmailTemplateLocaleResponse> rows = t.getLocales().values().stream()
                .sorted(Comparator.comparing(EmailTemplateLocale::getLocale))
                .map(l -> new EmailTemplateLocaleResponse(l.getLocale(), l.getSubject(), l.getBody()))
                .toList();
        return new EmailTemplateResponse(
                t.getKey(),
                t.getDescription(),
                t.isEnabled(),
                t.isCustom(),
                rows);
    }
}
