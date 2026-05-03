package com.eneml.ajs.identity.internal.web.mapper;

import com.eneml.ajs.identity.internal.domain.UserRoleAssignment;
import com.eneml.ajs.identity.internal.web.dto.UserRoleAssignmentResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface UserRoleAssignmentMapper {

    UserRoleAssignmentResponse toResponse(UserRoleAssignment entity);

    List<UserRoleAssignmentResponse> toResponses(List<UserRoleAssignment> entities);
}
