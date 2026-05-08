package com.eneml.ajs.invitation.internal.persistence;

import com.eneml.ajs.invitation.api.InvitationStatus;
import com.eneml.ajs.invitation.internal.domain.UserInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserInvitationRepository extends JpaRepository<UserInvitation, Long> {

    Optional<UserInvitation> findByKeyHash(String keyHash);

    List<UserInvitation> findByStatus(InvitationStatus status);

    List<UserInvitation> findByStatusAndExpiresAtBefore(InvitationStatus status, Instant before);

    List<UserInvitation> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
}
