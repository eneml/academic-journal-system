package com.eneml.ajs.library.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "user_library_item")
@Getter
@Setter
public class UserLibraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt = Instant.now();

    @Column(columnDefinition = "text")
    private String note;
}
