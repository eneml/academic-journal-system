/**
 * Shared kernel — cross-module utilities with NO domain logic.
 *
 * <p>Use sparingly: web error handling, base exceptions, common
 * value objects (Locale, OrcidId, Doi), Jackson configs. If something
 * leaks domain semantics, it belongs in a domain module instead.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Shared Kernel",
    type = org.springframework.modulith.ApplicationModule.Type.OPEN
)
package com.eneml.ajs.shared;
