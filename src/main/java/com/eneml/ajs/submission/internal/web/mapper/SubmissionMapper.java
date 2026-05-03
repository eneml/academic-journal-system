package com.eneml.ajs.submission.internal.web.mapper;

import com.eneml.ajs.submission.api.SubmissionSummary;
import com.eneml.ajs.submission.internal.domain.Submission;
import com.eneml.ajs.submission.internal.web.dto.SubmissionDetailsRequest;
import com.eneml.ajs.submission.internal.web.dto.SubmissionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface SubmissionMapper {

    SubmissionResponse toResponse(Submission entity);

    List<SubmissionResponse> toResponses(List<Submission> entities);

    SubmissionSummary toSummary(Submission entity);

    List<SubmissionSummary> toSummaries(List<Submission> entities);

    @Mapping(target = "id",                   ignore = true)
    @Mapping(target = "sectionId",            ignore = true)
    @Mapping(target = "stage",                ignore = true)
    @Mapping(target = "status",               ignore = true)
    @Mapping(target = "locale",               ignore = true)
    @Mapping(target = "submittedByUserId",    ignore = true)
    @Mapping(target = "dateSubmitted",        ignore = true)
    @Mapping(target = "dateLastActivity",     ignore = true)
    @Mapping(target = "createdAt",            ignore = true)
    @Mapping(target = "updatedAt",            ignore = true)
    @Mapping(target = "version",              ignore = true)
    void applyDetails(SubmissionDetailsRequest src, @MappingTarget Submission dst);
}
