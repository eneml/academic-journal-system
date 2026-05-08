package com.eneml.ajs.category.internal.persistence;

import com.eneml.ajs.category.internal.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByCode(String code);

    Optional<Category> findByPath(String path);

    default List<Category> findAllOrdered() {
        // Spring Data doesn't synthesise NULLS FIRST, so we hand-sort below.
        List<Category> all = findAll();
        all.sort((a, b) -> {
            Long pa = a.getParentId();
            Long pb = b.getParentId();
            if (pa == null && pb != null) return -1;
            if (pa != null && pb == null) return 1;
            int cmp = pa == null ? 0 : Long.compare(pa, pb);
            if (cmp != 0) return cmp;
            return Double.compare(a.getSequence(), b.getSequence());
        });
        return all;
    }
}
