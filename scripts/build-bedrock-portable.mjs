import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Arch, Platform, build } from "electron-builder";

const projectDir = fileURLToPath(new URL("../apps/desktop/", import.meta.url));
const metadata = JSON.parse(await readFile(new URL("../apps/desktop/package.json", import.meta.url), "utf8"));

// Use structured options: Windows shells can split dotted CLI overrides.
await build({
  projectDir,
  targets: Platform.WINDOWS.createTarget("portable", Arch.x64),
  publish: "never",
  config: {
    ...metadata.build,
    extraMetadata: { ...metadata.build.extraMetadata, piDistribution: "portable" },
    portable: { ...metadata.build.portable, artifactName: "PI-Desktop-Bedrock-Portable-0.21.0.exe" },
  },
});
