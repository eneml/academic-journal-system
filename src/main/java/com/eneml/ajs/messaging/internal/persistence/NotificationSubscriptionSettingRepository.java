package com.eneml.ajs.messaging.internal.persistence;

import com.eneml.ajs.messaging.internal.domain.NotificationSubscriptionSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationSubscriptionSettingRepository extends
        JpaRepository<NotificationSubscriptionSetting, NotificationSubscriptionSetting.PK> {

    Optional<NotificationSubscriptionSetting> findByUserIdAndSettingKey(Long userId, String settingKey);

    List<NotificationSubscriptionSetting> findAllByUserId(Long userId);

    /**
     * Bulk lookup so the dispatcher can answer "is any of these keys blocked
     * for this user?" without N round-trips. Only persisted (i.e. blocked)
     * rows come back; absent keys are implicitly allowed.
     */
    List<NotificationSubscriptionSetting> findAllByUserIdAndSettingKeyIn(
            Long userId, Collection<String> settingKeys);

    void deleteByUserIdAndSettingKey(Long userId, String settingKey);
}
