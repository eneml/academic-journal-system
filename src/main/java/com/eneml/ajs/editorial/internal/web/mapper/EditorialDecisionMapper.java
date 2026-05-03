package com.eneml.ajs.editorial.internal.web.mapper;

import com.eneml.ajs.editorial.api.EditorialDecisionSummary;
import com.eneml.ajs.editorial.internal.domain.EditorialDecision;
import com.eneml.ajs.editorial.internal.web.dto.EditorialDecisionResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface EditorialDecisionMapper {

    EditorialDecisionResponse toResponse(EditorialDecision entity);

    List<EditorialDecisionResponse> toResponses(List<EditorialDecision> entities);

    EditorialDecisionSummary toSummary(EditorialDecision entity);

    List<EditorialDecisionSummary> toSummaries(List<EditorialDecision> entities);
}
