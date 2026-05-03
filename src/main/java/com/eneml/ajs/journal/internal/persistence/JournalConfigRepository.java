package com.eneml.ajs.journal.internal.persistence;

import com.eneml.ajs.journal.internal.domain.JournalConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalConfigRepository extends JpaRepository<JournalConfig, Long> {
}
