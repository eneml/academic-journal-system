package com.eneml.ajs.dashboard.api;

/**
 * Read-only port other modules use to embed editorial KPIs in
 * cross-module flows (e.g. the monthly statistics-report email).
 */
public interface DashboardLookup {

    StatsOverview overview();
}
