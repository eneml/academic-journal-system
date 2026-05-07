package com.eneml.ajs.journal.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record IndexingMembershipDto(
        Long id,

        @NotBlank @Size(max = 32)
        String code,

        @NotBlank @Size(max = 128)
        String label,

        @URL @Size(max = 2048)
        String url,

        @Size(max = 16)
        String quartile,

        int sortOrder,

        boolean active
) {
}
