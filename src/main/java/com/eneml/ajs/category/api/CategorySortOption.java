package com.eneml.ajs.category.api;

public enum CategorySortOption {
    DATE_PUBLISHED_DESC("date_published_desc"),
    DATE_PUBLISHED_ASC("date_published_asc"),
    TITLE_ASC("title_asc"),
    MANUAL("manual");

    private final String dbValue;

    CategorySortOption(String dbValue) {
        this.dbValue = dbValue;
    }

    public String dbValue() {
        return dbValue;
    }

    public static CategorySortOption ofDbValue(String value) {
        for (CategorySortOption o : values()) {
            if (o.dbValue.equals(value)) return o;
        }
        return DATE_PUBLISHED_DESC;
    }
}
