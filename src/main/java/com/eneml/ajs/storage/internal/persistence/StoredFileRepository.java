package com.eneml.ajs.storage.internal.persistence;

import com.eneml.ajs.storage.internal.domain.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    Optional<StoredFile> findBySha256(String sha256);

    @Query("SELECT f FROM StoredFile f WHERE f.id = :id AND f.deletedAt IS NULL")
    Optional<StoredFile> findActiveById(Long id);

    @Query("SELECT f FROM StoredFile f WHERE f.deletedAt IS NOT NULL ORDER BY f.deletedAt")
    List<StoredFile> findPendingDeletion();
}
