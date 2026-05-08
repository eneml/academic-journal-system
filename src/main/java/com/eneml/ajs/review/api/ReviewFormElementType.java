package com.eneml.ajs.review.api;

/**
 * Input shapes the form builder offers. {@code SMALL_TEXT} is a one-line
 * input meant for short answers; {@code TEXT} is a wider one-line input;
 * {@code TEXTAREA} is multi-line. Choice types — {@code CHECKBOXES},
 * {@code RADIO}, {@code DROPDOWN} — read their options from the
 * element's {@code possibleResponses} JSON.
 */
public enum ReviewFormElementType {
    SMALL_TEXT,
    TEXT,
    TEXTAREA,
    CHECKBOXES,
    RADIO,
    DROPDOWN;

    public boolean isMultipleChoice() {
        return this == CHECKBOXES;
    }

    public boolean isChoice() {
        return this == CHECKBOXES || this == RADIO || this == DROPDOWN;
    }
}
