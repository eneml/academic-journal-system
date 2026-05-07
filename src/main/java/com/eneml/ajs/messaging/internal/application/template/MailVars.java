package com.eneml.ajs.messaging.internal.application.template;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Builder for the variable map handed to {@link MailRenderer}. Keeps insertion
 * order so previewing in the admin UI lists variables in a predictable shape,
 * and accepts dotted keys ({@code "submission.title"}) which the renderer
 * unflattens into nested maps so Mustache's {@code {{submission.title}}}
 * resolves correctly.
 *
 * <p>Loose by design — templates that reference a missing key render as the
 * empty string, so adding new variables doesn't break old templates.
 */
public final class MailVars {

    private final Map<String, Object> map = new LinkedHashMap<>();

    private MailVars() {}

    public static MailVars create() {
        return new MailVars();
    }

    public MailVars put(String dottedKey, Object value) {
        map.put(dottedKey, value);
        return this;
    }

    /**
     * Returns the flat dotted-key map. The renderer is responsible for
     * unflattening into nested {@link Map}s so Mustache resolves dotted paths.
     */
    public Map<String, Object> asFlatMap() {
        return Collections.unmodifiableMap(map);
    }
}
