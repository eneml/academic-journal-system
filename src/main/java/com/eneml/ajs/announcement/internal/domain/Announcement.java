package com.eneml.ajs.announcement.internal.domain;

import com.eneml.ajs.announcement.api.AnnouncementType;
import com.eneml.ajs.shared.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "announcement")
@Getter
@Setter
public class Announcement extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AnnouncementType type = AnnouncementType.GENERAL;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> body = new HashMap<>();

    @Column(name = "url_path", length = 255, unique = true)
    private String urlPath;

    @Column(name = "date_posted", nullable = false)
    private Instant datePosted = Instant.now();

    @Column(name = "date_expires")
    private Instant dateExpires;

    @Column(nullable = false)
    private boolean pinned = false;

    @Column(nullable = false)
    private boolean visible = true;
}
