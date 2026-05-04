// Workspace-level flat config. ESLint resolves this from any sub-package
// when you run `eslint src` because flat config walks up from the cwd.
// All apps and packages share the same baseline rules.
import baseConfig from "@ajs/eslint-config";

export default baseConfig;
