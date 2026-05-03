package com.eneml.ajs.identity.api;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserDirectoryService {

    Optional<UserSummary> findById(Long userId);

    Optional<UserSummary> findByKeycloakSub(String keycloakSub);

    Optional<UserSummary> findByEmail(String email);

    /**
     * Bulk lookup useful for inflating lists of user references from other
     * modules (e.g. masthead entries) without N+1 round-trips.
     *
     * @return map keyed by user id; missing ids are absent from the map
     */
    Map<Long, UserSummary> findByIds(Collection<Long> userIds);

    List<UserSummary> findActiveWithRole(Role role);
}
