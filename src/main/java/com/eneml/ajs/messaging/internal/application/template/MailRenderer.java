package com.eneml.ajs.messaging.internal.application.template;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Compiles + caches Mustache templates. Renders a (subject, body) pair against
 * a flat dotted-key variable map by unflattening into nested maps so
 * {@code {{submission.title}}} resolves the way authors expect.
 *
 * <p>Cache key is the source string itself — that way edits in the admin UI
 * naturally bypass the old compiled form on next render. Caffeine evicts
 * entries that haven't been hit in 30 minutes which is plenty given how rarely
 * email templates change.
 */
@Component
@Slf4j
public class MailRenderer {

    private final Cache<String, Template> compiled = Caffeine.newBuilder()
            .maximumSize(512)
            .expireAfterAccess(Duration.ofMinutes(30))
            .build();

    private final Mustache.Compiler mustache = Mustache.compiler()
            // missing keys render as "" rather than throwing — see class doc
            .nullValue("")
            .defaultValue("")
            .escapeHTML(false);

    public String render(String source, Map<String, Object> flatVars) {
        if (source == null || source.isBlank()) {
            return "";
        }
        try {
            Template tpl = compiled.get(source, mustache::compile);
            return tpl.execute(unflatten(flatVars));
        } catch (RuntimeException e) {
            // A bad template should never bring down the listener that fired
            // it — log and return the raw source so the operator notices the
            // unsubstituted braces in the email and goes fixes the template.
            log.warn("mustache render failed for template (len={}): {}",
                    source.length(), e.getMessage());
            return source;
        }
    }

    /**
     * Turns {@code {"submission.title": "X", "submission.id": 42}} into
     * {@code {"submission": {"title": "X", "id": 42}}}. Mustache requires the
     * nested form to resolve dotted paths.
     */
    @SuppressWarnings("unchecked")
    static Map<String, Object> unflatten(Map<String, Object> flat) {
        Map<String, Object> root = new LinkedHashMap<>();
        if (flat == null) return root;
        for (Map.Entry<String, Object> entry : flat.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            String[] parts = key.split("\\.");
            Map<String, Object> cursor = root;
            for (int i = 0; i < parts.length - 1; i++) {
                Object next = cursor.get(parts[i]);
                if (!(next instanceof Map<?, ?>)) {
                    Map<String, Object> child = new LinkedHashMap<>();
                    cursor.put(parts[i], child);
                    cursor = child;
                } else {
                    cursor = (Map<String, Object>) next;
                }
            }
            cursor.put(parts[parts.length - 1], value);
        }
        return root;
    }
}
