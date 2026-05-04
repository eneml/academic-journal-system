package com.eneml.ajs.issue.internal.web.mapper;

import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.issue.internal.domain.Issue;
import com.eneml.ajs.issue.internal.web.dto.IssueResponse;
import com.eneml.ajs.issue.internal.web.dto.IssueUpsertRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface IssueMapper {

    IssueResponse toResponse(Issue entity);

    List<IssueResponse> toResponses(List<Issue> entities);

    IssueSummary toSummary(Issue entity);

    List<IssueSummary> toSummaries(List<Issue> entities);

    @Mapping(target = "id",              ignore = true)
    @Mapping(target = "published",       ignore = true)
    @Mapping(target = "datePublished",   ignore = true)
    @Mapping(target = "openAccessDate",  ignore = true)
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    @Mapping(target = "version",         ignore = true)
    Issue toEntity(IssueUpsertRequest src);

    @Mapping(target = "id",              ignore = true)
    @Mapping(target = "published",       ignore = true)
    @Mapping(target = "datePublished",   ignore = true)
    @Mapping(target = "openAccessDate",  ignore = true)
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    @Mapping(target = "version",         ignore = true)
    void applyUpdate(IssueUpsertRequest src, @MappingTarget Issue dst);
}
