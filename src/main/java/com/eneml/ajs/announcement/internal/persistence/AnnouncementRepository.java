package com.eneml.ajs.announcement.internal.persistence;

import com.eneml.ajs.announcement.internal.domain.Announcement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("""
            SELECT a FROM Announcement a
            WHERE a.visible = true
              AND (a.dateExpires IS NULL OR a.dateExpires > :now)
            ORDER BY a.pinned DESC, a.datePosted DESC, a.id DESC
            """)
    List<Announcement> findVisible(Instant now, Pageable pageable);

    List<Announcement> findAllByOrderByPinnedDescDatePostedDescIdDesc();
}
