package com.eneml.ajs.messaging.internal.application.template;

import com.eneml.ajs.messaging.internal.domain.NotificationSubscriptionSetting;
import com.eneml.ajs.messaging.internal.persistence.NotificationSubscriptionSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Read + write API for the per-user "skip the email for this category"
 * matrix. Absence of a row implies the user has not opted out — the
 * dispatcher uses {@link #isBlocked(Long, String)} on every send to decide.
 *
 * <p>Only blocked rows are persisted. Toggling a key from blocked back to
 * allowed deletes the row, keeping the table small.
 */
@Service
@RequiredArgsConstructor
public class NotificationSubscriptionService {

    private final NotificationSubscriptionSettingRepository repository;

    @Transactional(readOnly = true)
    public boolean isBlocked(Long userId, String settingKey) {
        if (userId == null || settingKey == null || settingKey.isBlank()) return false;
        return repository.findByUserIdAndSettingKey(userId, settingKey)
                .map(NotificationSubscriptionSetting::isBlocked)
                .orElse(false);
    }

    /**
     * Returns a key → blocked map covering every canonical email-template
     * key. Keys absent from the persisted rows surface as {@code false}
     * (allowed). Insertion order matches the enum order, which is the
     * natural reading order in the UI.
     */
    @Transactional(readOnly = true)
    public Map<String, Boolean> stateForUser(Long userId) {
        Set<String> blockedKeys = repository.findAllByUserId(userId).stream()
                .filter(NotificationSubscriptionSetting::isBlocked)
                .map(NotificationSubscriptionSetting::getSettingKey)
                .collect(Collectors.toSet());
        Map<String, Boolean> out = new LinkedHashMap<>();
        for (CanonicalEmailTemplateKey k : Arrays.stream(CanonicalEmailTemplateKey.values()).toList()) {
            out.put(k.key(), blockedKeys.contains(k.key()));
        }
        return out;
    }

    @Transactional
    public void setBlocked(Long userId, String settingKey, boolean blocked) {
        if (userId == null || settingKey == null || settingKey.isBlank()) return;
        if (!blocked) {
            repository.deleteByUserIdAndSettingKey(userId, settingKey);
            return;
        }
        NotificationSubscriptionSetting row = repository
                .findByUserIdAndSettingKey(userId, settingKey)
                .orElseGet(NotificationSubscriptionSetting::new);
        row.setUserId(userId);
        row.setSettingKey(settingKey);
        row.setBlocked(true);
        repository.save(row);
    }
}
