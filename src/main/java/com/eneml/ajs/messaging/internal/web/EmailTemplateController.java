package com.eneml.ajs.messaging.internal.web;

import com.eneml.ajs.messaging.internal.domain.EmailTemplate;
import com.eneml.ajs.messaging.internal.domain.EmailTemplateLocale;
import com.eneml.ajs.messaging.internal.persistence.EmailTemplateRepository;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateLocaleResponse;
import com.eneml.ajs.messaging.internal.web.dto.EmailTemplateLocaleUpsertRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
class EmailTemplateController {

    private static final Pattern LOCALE_TAG = Pattern.compile("^[a-z]{2,3}(-[A-Z]{2})?$");

    private final EmailTemplateRepository repository;

    @GetMapping
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> list() {
        return repository.findAllByOrderByKeyAsc().stream()
                .map(EmailTemplateController::toResponse)
                .toList();
    }

    @GetMapping("/{key}")
    @Transactional(readOnly = true)
    public EmailTemplateResponse one(@PathVariable String key) {
        return toResponse(load(key));
    }

    @PutMapping("/{key}/locales/{locale}")
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
