package com.eneml.ajs.dashboard.internal.application;

import com.eneml.ajs.dashboard.api.DashboardLookup;
import com.eneml.ajs.dashboard.api.StatsOverview;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class DashboardLookupAdapter implements DashboardLookup {

    private final StatsService stats;

    @Override
    public StatsOverview overview() {
        return stats.overview();
    }
}
