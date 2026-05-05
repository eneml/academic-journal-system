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

    /**
     * {@code coverImageUrl} is intentionally ignored here — it isn't
     * persisted, it's resolved at controller-level by minting a presigned
     * URL from {@link Issue#getCoverFileId()}. {@code coverFileId}
     * itself maps cleanly from the entity.
     */
    @Mapping(target = "coverImageUrl", ignore = true)
    IssueResponse toResponse(Issue entity);

    List<IssueResponse> toResponses(List<Issue> entities);

    IssueSummary toSummary(Issue entity);

    List<IssueSummary> toSummaries(List<Issue> entities);

    @Mapping(target = "id",              ignore = true)
    @Mapping(target = "coverFileId",     ignore = true)
    @Mapping(target = "published",       ignore = true)
    @Mapping(target = "datePublished",   ignore = true)
    @Mapping(target = "openAccessDate",  ignore = true)
    @Mapping(target = "doiId",           ignore = true)
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    @Mapping(target = "version",         ignore = true)
    Issue toEntity(IssueUpsertRequest src);

    @Mapping(target = "id",              ignore = true)
    @Mapping(target = "coverFileId",     ignore = true)
    @Mapping(target = "published",       ignore = true)
    @Mapping(target = "datePublished",   ignore = true)
    @Mapping(target = "openAccessDate",  ignore = true)
    @Mapping(target = "doiId",           ignore = true)
    @Mapping(target = "createdAt",       ignore = true)
    @Mapping(target = "updatedAt",       ignore = true)
    @Mapping(target = "version",         ignore = true)
    void applyUpdate(IssueUpsertRequest src, @MappingTarget Issue dst);
}
