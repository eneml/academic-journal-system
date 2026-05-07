package com.eneml.ajs.editorial.internal.web;

import com.eneml.ajs.editorial.internal.application.DecisionPreviewService;
import com.eneml.ajs.editorial.internal.application.EditorialDecisionService;
import com.eneml.ajs.editorial.internal.engine.DecisionContext;
import com.eneml.ajs.editorial.internal.web.dto.DecisionEmailOverride;
import com.eneml.ajs.editorial.internal.web.dto.DecisionPreviewRequest;
import com.eneml.ajs.editorial.internal.web.dto.DecisionPreviewResponse;
import com.eneml.ajs.editorial.internal.web.dto.EditorialDecisionResponse;
import com.eneml.ajs.editorial.internal.web.dto.TakeDecisionRequest;
import com.eneml.ajs.editorial.internal.web.mapper.EditorialDecisionMapper;
import com.eneml.ajs.identity.api.UserDirectoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/decisions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EDITOR','SECTION_EDITOR','ADMIN')")
@Tag(name = "Editorial decisions")
class EditorialDecisionController {

    private final EditorialDecisionService service;
    private final DecisionPreviewService previewService;
    private final EditorialDecisionMapper mapper;
    private final UserDirectoryService userDirectory;

    @GetMapping
    @Operation(summary = "List the decision history for a submission")
    List<EditorialDecisionResponse> history(@PathVariable Long submissionId) {
        return mapper.toResponses(service.historyOf(submissionId));
    }

    @PostMapping("/preview")
    @Operation(summary = "Preview a decision without committing — returns the predicted outcome and email steps")
    DecisionPreviewResponse preview(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable Long submissionId,
                                     @Valid @RequestBody DecisionPreviewRequest request) {
        Long actor = resolveActor(jwt);
        return previewService.preview(submissionId, request.type(), actor, request.reviewRoundId());
    }

    @PostMapping
    @Operation(summary = "Take a decision; optional emailOverrides bypass the auto-render path")
    EditorialDecisionResponse take(@AuthenticationPrincipal Jwt jwt,
                                    @PathVariable Long submissionId,
                                    @Valid @RequestBody TakeDecisionRequest request) {
        Long actor = resolveActor(jwt);
        var decision = service.take(submissionId, request.type(),
                new DecisionContext(actor, request.reviewRoundId(), request.summary(),
                        toOverrides(request.emailOverrides())));
        return mapper.toResponse(decision);
    }

    private Long resolveActor(Jwt jwt) {
        return userDirectory.findByKeycloakSub(jwt.getSubject())
                .orElseThrow(() -> new IllegalStateException(
                        "User not provisioned for sub: " + jwt.getSubject()))
                .id();
    }

    private static List<DecisionContext.EmailOverride> toOverrides(List<DecisionEmailOverride> raw) {
        if (raw == null || raw.isEmpty()) return List.of();
        List<DecisionContext.EmailOverride> out = new ArrayList<>();
        for (DecisionEmailOverride o : raw) {
            if (o == null || o.skipped()) continue;
            if (o.recipientUserIds() == null) continue;
            for (Long recipientId : o.recipientUserIds()) {
                if (recipientId == null) continue;
                out.add(new DecisionContext.EmailOverride(
                        recipientId,
                        o.templateKey(),
                        o.subject(),
                        o.body()));
            }
        }
        return out;
    }
}
