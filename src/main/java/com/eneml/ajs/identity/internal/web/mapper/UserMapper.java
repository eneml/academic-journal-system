package com.eneml.ajs.identity.internal.web.mapper;

import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.identity.internal.domain.User;
import com.eneml.ajs.identity.internal.web.dto.UserAdminUpdateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserCreateRequest;
import com.eneml.ajs.identity.internal.web.dto.UserResponse;
import com.eneml.ajs.identity.internal.web.dto.UserSelfUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper
public interface UserMapper {

    UserResponse toResponse(User entity);

    List<UserResponse> toResponses(List<User> entities);

    UserSummary toSummary(User entity);

    List<UserSummary> toSummaries(List<User> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "biography", ignore = true)
    @Mapping(target = "affiliation", ignore = true)
    @Mapping(target = "publicUrl", ignore = true)
    @Mapping(target = "signature", ignore = true)
    @Mapping(target = "gossipNote", ignore = true)
    User toEntity(UserCreateRequest src);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakSub", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "gossipNote", ignore = true)
    void applySelfUpdate(UserSelfUpdateRequest src, @MappingTarget User dst);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakSub", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    void applyAdminUpdate(UserAdminUpdateRequest src, @MappingTarget User dst);
}
