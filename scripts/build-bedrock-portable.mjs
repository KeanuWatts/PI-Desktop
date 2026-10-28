import { fileURLToPath } from "node:url";
import { Arch, Platform, build } from "electron-builder";

const projectDir = fileURLToPath(new URL("../apps/desktop/", import.meta.url));
// Use structured options: Windows shells can split dotted CLI overrides.
// Only pass overrides: builder merges these with package.json itself.
const options = {
  projectDir,
  targets: Platform.WINDOWS.createTarget("portable", Arch.x64),
  publish: "never",
  config: {
    extraMetadata: { piDistribution: "portable" },
    portable: { artifactName: "PI-Desktop-Bedrock-Portable-0.21.0-costs.1.exe" },
  },
};

if (process.argv.includes("--check")) {
  const { getConfig, validateConfiguration } = await import("app-builder-lib/out/util/config/config.js");
  const { DebugLogger } = await import("builder-util");
  const config = await getConfig(projectDir, null, options.config);
  await validateConfiguration(config, new DebugLogger(false));
  console.log("Portable packaging configuration is valid");
} else {
  await build(options);
}
