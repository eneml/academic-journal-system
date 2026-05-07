package com.eneml.ajs.library.internal.persistence;

import com.eneml.ajs.library.internal.domain.UserLibraryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLibraryRepository extends JpaRepository<UserLibraryItem, Long> {

    Page<UserLibraryItem> findByUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    Optional<UserLibraryItem> findByUserIdAndPublicationId(Long userId, Long publicationId);

    boolean existsByUserIdAndPublicationId(Long userId, Long publicationId);

    long deleteByUserIdAndPublicationId(Long userId, Long publicationId);
}
