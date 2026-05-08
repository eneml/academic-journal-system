package com.eneml.ajs.category.internal.domain;

import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "category")
@Getter
@Setter
public class Category extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, unique = true, length = 255)
    private String path;

    @Column(nullable = false)
    private double sequence = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> description = new HashMap<>();

    @Column(name = "sort_option", nullable = false, length = 32)
    private String sortOption = "date_published_desc";

    @Column(name = "image_file_id")
    private Long imageFileId;
}
