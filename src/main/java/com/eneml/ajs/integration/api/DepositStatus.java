package com.eneml.ajs.integration.api;

/**
 * Lifecycle of an outbound deposit:
 * <pre>
 *   PENDING ──► SENT ──► ACCEPTED   (success)
 *                  └──► FAILED      (transient or permanent error)
 *   PENDING ──► SKIPPED              (config disabled / missing prerequisites)
 * </pre>
 */
public enum DepositStatus {
    PENDING,
    SENT,
    ACCEPTED,
    FAILED,
    SKIPPED
}
