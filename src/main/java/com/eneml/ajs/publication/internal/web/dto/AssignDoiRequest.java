package com.eneml.ajs.publication.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssignDoiRequest(

        @NotBlank @Size(max = 255)
        @Pattern(regexp = "^10\\.\\d{4,9}/[-._;()/:A-Za-z0-9]+$",
                message = "DOI must follow the format 10.XXXX/suffix")
        String doi
) {
}
