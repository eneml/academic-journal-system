package com.eneml.ajs.issue.internal.web;

import com.eneml.ajs.issue.internal.application.IssueGalleyService;
import com.eneml.ajs.issue.internal.domain.IssueGalley;
import com.eneml.ajs.issue.internal.web.dto.IssueGalleyResponse;
import com.eneml.ajs.issue.internal.web.dto.IssueGalleyUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/galleys")
@RequiredArgsConstructor
@Tag(name = "Issue galleys")
class IssueGalleyController {

    private final IssueGalleyService service;

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

    private static IssueGalleyResponse toResponse(IssueGalley g) {
        return new IssueGalleyResponse(
                g.getId(), g.getIssueId(), g.getStoredFileId(), g.getRemoteUrl(),
                g.getLocale(), g.getLabel(), g.getSeq(), g.isApproved(),
                g.getDoiId(), g.getVersion(), g.getUpdatedAt());
    }
}
