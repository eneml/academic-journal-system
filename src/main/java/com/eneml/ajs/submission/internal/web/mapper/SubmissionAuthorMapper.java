package com.eneml.ajs.submission.internal.web.mapper;

import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.internal.domain.SubmissionAuthor;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorResponse;
import com.eneml.ajs.submission.internal.web.dto.SubmissionAuthorUpsertRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface SubmissionAuthorMapper {

    SubmissionAuthorResponse toResponse(SubmissionAuthor entity);

    List<SubmissionAuthorResponse> toResponses(List<SubmissionAuthor> entities);

    SubmissionAuthorSummary toSummary(SubmissionAuthor entity);

    List<SubmissionAuthorSummary> toSummaries(List<SubmissionAuthor> entities);

    @Mapping(target = "id",            ignore = true)
    @Mapping(target = "submissionId",  ignore = true)
    @Mapping(target = "seq",           ignore = true)
    @Mapping(target = "createdAt",     ignore = true)
    @Mapping(target = "updatedAt",     ignore = true)
    @Mapping(target = "version",       ignore = true)
    SubmissionAuthor toEntity(SubmissionAuthorUpsertRequest src);

    @Mapping(target = "id",            ignore = true)
    @Mapping(target = "submissionId",  ignore = true)
    @Mapping(target = "seq",           ignore = true)
    @Mapping(target = "createdAt",     ignore = true)
    @Mapping(target = "updatedAt",     ignore = true)
    @Mapping(target = "version",       ignore = true)
    void applyUpdate(SubmissionAuthorUpsertRequest src, @MappingTarget SubmissionAuthor dst);
}
