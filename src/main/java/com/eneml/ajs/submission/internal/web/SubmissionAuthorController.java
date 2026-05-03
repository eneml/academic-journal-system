package com.eneml.ajs.submission.internal.web;

import com.eneml.ajs.submission.internal.application.SubmissionAuthorService;
import com.eneml.ajs.submission.internal.domain.SubmissionAuthor;
import com.eneml.ajs.submission.internal.web.dto.ReorderRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorResponse;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorUpsertRequest;
import com.eneml.ajs.submission.internal.web.mapper.SubmissionAuthorMapper;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/authors")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Submission contributors")
class SubmissionAuthorController {

    private final SubmissionAuthorService service;
    private final SubmissionAuthorMapper mapper;

    @GetMapping
    @Operation(summary = "List authors on a submission")
    List<SubmissionAuthorResponse> list(@PathVariable Long submissionId) {
        return mapper.toResponses(service.list(submissionId));
    }

    @PostMapping
    @Operation(summary = "Add an author to the submission")
    ResponseEntity<SubmissionAuthorResponse> add(@PathVariable Long submissionId,
                                                  @Valid @RequestBody SubmissionAuthorUpsertRequest request) {
        SubmissionAuthor saved = service.add(submissionId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{authorId}").buildAndExpand(saved.getId()).toUri();
        return ResponseEntity.created(location).body(mapper.toResponse(saved));
    }

    @PutMapping("/{authorId}")
    @Operation(summary = "Update an author")
    SubmissionAuthorResponse update(@PathVariable Long submissionId,
                                    @PathVariable Long authorId,
                                    @Valid @RequestBody SubmissionAuthorUpsertRequest request) {
        return mapper.toResponse(service.update(submissionId, authorId, request));
    }

    @DeleteMapping("/{authorId}")
    @Operation(summary = "Remove an author from the submission")
    ResponseEntity<Void> remove(@PathVariable Long submissionId, @PathVariable Long authorId) {
        service.remove(submissionId, authorId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/order")
    @Operation(summary = "Reorder authors")
    ResponseEntity<Void> reorder(@PathVariable Long submissionId,
                                 @Valid @RequestBody ReorderRequest request) {
        service.reorder(submissionId, request.orderedIds());
        return ResponseEntity.noContent().build();
    }
}
