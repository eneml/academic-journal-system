package com.eneml.ajs.issue.internal.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record IssueGalleyUpsertRequest(
        Long storedFileId,

        @Size(max = 2048)
        String remoteUrl,

        @Size(min = 2, max = 8)
        String locale,

        @NotNull
        Map<String, String> label,

        int seq,

        boolean approved
) {
}
