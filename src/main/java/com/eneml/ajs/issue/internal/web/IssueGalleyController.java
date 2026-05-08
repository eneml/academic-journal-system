package com.eneml.ajs.issue.internal.web;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.issue.internal.application.IssueGalleyService;
import com.eneml.ajs.issue.internal.domain.IssueGalley;
import com.eneml.ajs.issue.internal.web.dto.IssueGalleyResponse;
import com.eneml.ajs.issue.internal.web.dto.IssueGalleyUpsertRequest;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.FileUploadRequest;
import com.eneml.ajs.storage.api.StoredFileRef;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/galleys")
@RequiredArgsConstructor
@Tag(name = "Issue galleys")
class IssueGalleyController {

    private final IssueGalleyService service;
    private final FileStorageService storage;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List galleys for an issue")
    List<IssueGalleyResponse> list(@PathVariable Long issueId) {
        return service.listForIssue(issueId).stream().map(IssueGalleyController::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Add a galley (combined PDF, EPUB, …) to the issue")
    IssueGalleyResponse add(@PathVariable Long issueId,
                             @Valid @RequestBody IssueGalleyUpsertRequest request) {
        return toResponse(service.add(issueId, request));
    }

    @PutMapping("/{galleyId}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Update an issue galley")
    IssueGalleyResponse update(@PathVariable Long issueId,
                                @PathVariable Long galleyId,
                                @Valid @RequestBody IssueGalleyUpsertRequest request) {
        return toResponse(service.update(issueId, galleyId, request));
    }

    @DeleteMapping("/{galleyId}")
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Remove an issue galley")
    ResponseEntity<Void> remove(@PathVariable Long issueId, @PathVariable Long galleyId) {
        service.remove(issueId, galleyId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload + create in one step. Stores the file via storage::api and
     * persists a galley row pointing at the new storedFileId. The label
     * defaults to the file's name; the editor can rename via PUT later.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EDITOR','ADMIN')")
    @Operation(summary = "Upload a file and attach it as a new issue galley")
    IssueGalleyResponse upload(@AuthenticationPrincipal Jwt jwt,
                                @PathVariable Long issueId,
                                @RequestParam("file") MultipartFile file,
                                @RequestParam(value = "locale", required = false) String locale,
                                @RequestParam(value = "label", required = false) String label,
                                @RequestParam(value = "seq", defaultValue = "0") int seq) throws IOException {
        Long uploaderId = userDirectory.findByKeycloakSub(jwt.getSubject())
                .map(u -> u.id())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()));
        String filename = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        StoredFileRef ref = storage.store(new FileUploadRequest(
                file.getInputStream(),
                file.getContentType() == null
                        ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType(),
                filename,
                uploaderId));
        String displayLabel = (label != null && !label.isBlank()) ? label : filename;
        IssueGalleyUpsertRequest request = new IssueGalleyUpsertRequest(
                ref.id(), null, locale,
                java.util.Map.of(locale == null ? "en" : locale, displayLabel),
                seq, false);
        return toResponse(service.add(issueId, request));
    }

    private static IssueGalleyResponse toResponse(IssueGalley g) {
        return new IssueGalleyResponse(
                g.getId(), g.getIssueId(), g.getStoredFileId(), g.getRemoteUrl(),
                g.getLocale(), g.getLabel(), g.getSeq(), g.isApproved(),
                g.getDoiId(), g.getVersion(), g.getUpdatedAt());
    }
}
