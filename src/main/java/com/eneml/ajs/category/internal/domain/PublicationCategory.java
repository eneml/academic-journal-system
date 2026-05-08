package com.eneml.ajs.category.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "publication_category")
@IdClass(PublicationCategory.PK.class)
@Getter
@Setter
public class PublicationCategory {

    @Id
    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    @Id
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    public static class PK implements Serializable {
        private Long publicationId;
        private Long categoryId;

        public PK() {}

        public PK(Long publicationId, Long categoryId) {
            this.publicationId = publicationId;
            this.categoryId = categoryId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(publicationId, pk.publicationId)
                    && Objects.equals(categoryId, pk.categoryId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(publicationId, categoryId);
        }
    }
}
