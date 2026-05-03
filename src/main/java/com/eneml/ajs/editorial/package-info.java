/**
 * Editorial module — workflow engine + decision history. Each
 * {@link com.eneml.ajs.editorial.api.DecisionType} has a stateless
 * handler that validates preconditions and returns the desired
 * state-transition outcome; the engine writes through the public
 * submission and review ports.
 *
 * <p>Owns: EditorialDecision.
 * <br>Emits: DecisionMade.
 * <br>Consumes: nothing.
 */
@org.springframework.modulith.ApplicationModule(
    displayName = "Editorial",
    allowedDependencies = { "shared", "identity::api", "submission::api", "review::api" }
)
package com.eneml.ajs.editorial;
