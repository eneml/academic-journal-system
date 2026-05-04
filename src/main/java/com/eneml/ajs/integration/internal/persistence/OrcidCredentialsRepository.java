package com.eneml.ajs.integration.internal.persistence;

import com.eneml.ajs.integration.internal.domain.OrcidCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrcidCredentialsRepository extends JpaRepository<OrcidCredentials, Long> {

    Optional<OrcidCredentials> findByOrcidId(String orcidId);
}
