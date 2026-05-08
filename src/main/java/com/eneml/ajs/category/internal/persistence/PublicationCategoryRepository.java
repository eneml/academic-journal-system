package com.eneml.ajs.category.internal.persistence;

import com.eneml.ajs.category.internal.domain.PublicationCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicationCategoryRepository extends
        JpaRepository<PublicationCategory, PublicationCategory.PK> {

    List<PublicationCategory> findByPublicationId(Long publicationId);

    List<PublicationCategory> findByCategoryId(Long categoryId);

    void deleteByPublicationId(Long publicationId);

    void deleteByPublicationIdAndCategoryId(Long publicationId, Long categoryId);
}
