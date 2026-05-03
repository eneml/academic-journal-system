package com.eneml.ajs;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Verifies Spring Modulith bounded-context boundaries:
 * - no module depends on another module's internals (only ::api packages)
 * - no cyclic dependencies
 * - explicit allowedDependencies declared in package-info.java are honored
 *
 * Also generates C4 / PlantUML documentation under
 * {@code target/spring-modulith-docs/} on each test run.
 */
class ModularityTests {

    private static final ApplicationModules MODULES =
            ApplicationModules.of(JournalApplication.class);

    @Test
    void verifyModularStructure() {
        MODULES.verify();
    }

    @Test
    void writeDocumentation() {
        new Documenter(MODULES)
                .writeModulesAsPlantUml()
                .writeIndividualModulesAsPlantUml();
    }
}
