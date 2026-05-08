package com.eneml.ajs.review.internal.web;

import com.eneml.ajs.review.internal.application.ReviewFormService;
import com.eneml.ajs.review.internal.domain.ReviewForm;
import com.eneml.ajs.review.internal.domain.ReviewFormElement;
import com.eneml.ajs.review.internal.web.dto.ReviewFormElementReorderRequest;
import com.eneml.ajs.review.internal.web.dto.ReviewFormElementResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewFormElementUpsertRequest;
import com.eneml.ajs.review.internal.web.dto.ReviewFormResponse;
import com.eneml.ajs.review.internal.web.dto.ReviewFormUpsertRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
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
@RequestMapping("/api/v1/review-forms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Review forms")
class ReviewFormController {

    private final ReviewFormService service;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ReviewFormResponse> list() {
        return service.listAll().stream().map(ReviewFormController::toResponse).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ReviewFormResponse one(@PathVariable Long id) {
        return toResponse(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ReviewFormResponse> create(@Valid @RequestBody ReviewFormUpsertRequest body) {
        ReviewForm created = service.create(body.code(), body.title(), body.description(), body.active());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @PutMapping("/{id}")
    public ReviewFormResponse update(@PathVariable Long id,
                                      @Valid @RequestBody ReviewFormUpsertRequest body) {
        return toResponse(service.update(id, body.title(), body.description(), body.active()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/elements")
    public ResponseEntity<ReviewFormElementResponse> addElement(
            @PathVariable Long id,
            @Valid @RequestBody ReviewFormElementUpsertRequest body) {
        ReviewFormElement created = service.addElement(id,
                body.elementType(),
                body.included(),
                body.required(),
                body.question(),
                body.description(),
                body.possibleResponses());
        return ResponseEntity.status(HttpStatus.CREATED).body(toElementResponse(created));
    }

    @PutMapping("/{id}/elements/{elementId}")
    public ReviewFormElementResponse updateElement(
            @PathVariable Long id,
            @PathVariable Long elementId,
            @Valid @RequestBody ReviewFormElementUpsertRequest body) {
        return toElementResponse(service.updateElement(id, elementId,
                body.elementType(),
                body.included(),
                body.required(),
                body.question(),
                body.description(),
                body.possibleResponses()));
    }

    @DeleteMapping("/{id}/elements/{elementId}")
    public ResponseEntity<Void> deleteElement(@PathVariable Long id,
                                                @PathVariable Long elementId) {
        service.deleteElement(id, elementId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/elements/reorder")
    public ReviewFormResponse reorder(@PathVariable Long id,
                                       @Valid @RequestBody ReviewFormElementReorderRequest body) {
        return toResponse(service.reorderElements(id, body.orderedElementIds()));
    }

    static ReviewFormResponse toResponse(ReviewForm f) {
        return new ReviewFormResponse(
                f.getId(),
                f.getCode(),
                f.getTitle(),
                f.getDescription(),
                f.isActive(),
                f.getCompleteCount(),
                f.getElements().stream()
                        .map(ReviewFormController::toElementResponse)
                        .toList());
    }

    static ReviewFormElementResponse toElementResponse(ReviewFormElement e) {
        return new ReviewFormElementResponse(
                e.getId(),
                e.getSeq(),
                e.getElementType(),
                e.isIncluded(),
                e.isRequired(),
                e.getQuestion(),
                e.getDescription(),
                e.getPossibleResponses());
    }
}
