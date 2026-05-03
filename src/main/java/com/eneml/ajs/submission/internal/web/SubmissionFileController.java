package com.eneml.ajs.submission.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.submission.api.FileStage;
import com.eneml.ajs.submission.internal.application.SubmissionFileService;
import com.eneml.ajs.submission.internal.web.dto.SubmissionFileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/files")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Submission files")
class SubmissionFileController {

    private final SubmissionFileService service;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List files on a submission")
    List<SubmissionFileResponse> list(@PathVariable Long submissionId) {
        return service.list(submissionId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file (multipart) and attach to the submission")
    ResponseEntity<SubmissionFileResponse> upload(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long submissionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileStage") @NotNull FileStage fileStage,
            @RequestParam("genreId") @Positive Long genreId,
            @RequestParam(value = "locale", required = false) String locale) throws IOException {

        Long userId = userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
        SubmissionFileResponse saved = service.upload(
                submissionId, fileStage, genreId,
                file.getInputStream(),
                file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType(),
                file.getOriginalFilename(),
                locale,
                userId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{fileId}").buildAndExpand(saved.id()).toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @GetMapping("/{fileId}/download-url")
    @Operation(summary = "Get a short-lived presigned URL to download the file")
    DownloadUrlResponse downloadUrl(@PathVariable Long submissionId, @PathVariable Long fileId) {
        return new DownloadUrlResponse(service.downloadUrl(fileId).toString());
    }

    @DeleteMapping("/{fileId}")
    @Operation(summary = "Detach a file from the submission")
    ResponseEntity<Void> remove(@PathVariable Long submissionId, @PathVariable Long fileId) {
        service.remove(submissionId, fileId);
        return ResponseEntity.noContent().build();
    }

    record DownloadUrlResponse(String url) {}
}
