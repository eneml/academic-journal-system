/**
 * Public API of the {@code journal} module — the only types other
 * modules may reference. Holds:
 * <ul>
 *   <li>Lookup services for cross-module reads (no JPA repository leaks)</li>
 *   <li>Summary DTOs returned by lookups</li>
 *   <li>Domain events published by the module</li>
 *   <li>Stable enums shared across the system</li>
 * </ul>
 */
@org.springframework.modulith.NamedInterface("api")
package com.eneml.ajs.journal.api;
