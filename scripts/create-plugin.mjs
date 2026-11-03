import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, ...extra] = process.argv.slice(2);
assert(id && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id) && extra.length === 0,
  "Usage: node scripts/create-plugin.mjs <lowercase-plugin-id>");
const registryPath = resolve(root, "registry.json");
const registry = JSON.parse(await readFile(registryPath, "utf8"));
assert(registry.schemaVersion === 3 && Array.isArray(registry.plugins), "Expected registry v3");
const path = `plugins/${id}`;
assert(!registry.plugins.some((item) => item.id === id || item.path === path), "Plugin already registered");
const directory = resolve(root, path);
// Exclusive creation prevents overwriting an existing, unregistered package.
await mkdir(directory);
await mkdir(resolve(directory, "prompts"));
const files = {
  "package.json": `${JSON.stringify({ name: id, version: "1.0.0", description: "Read-only code review prompt with evidence-backed findings.", keywords: ["pi-package", "review"], pi: { prompts: ["./prompts"] } }, null, 2)}\n`,
  "README.md": `# ${id}\n\nA Pi prompt for a read-only code review.\n\n## Usage\n\nAdd this plugin to your workspace, select it in a Pi Agent, review and apply the Agent revision, then start a new conversation and invoke the review prompt. Supply the files or change to review.\n\n## Behavior\n\nReports correctness and security findings with file references and verification suggestions. It does not modify files, install dependencies, or publish changes.\n\n## Requirements and permissions\n\nPi runtime and the Agent's already-authorized read tools. No MCP connection, network access, credentials, or plugin executable code is required.\n\n## Versioning\n\nIncrement package.json version before changing any published package bytes, including this README. Existing sessions retain their pinned versions.\n\n## License\n\nNo license is granted by this generated package. Choose and include a license for your own content before distributing it.\n`,
  "prompts/review.md": "---\ndescription: Review a change without modifying files.\n---\n\nReview the supplied change or files using only already-authorized read tools. Do not edit files, install dependencies, use the network, or publish anything. Report actionable correctness and security findings, ordered by severity, with file references and the evidence for each finding. Separate verified facts from uncertainty. Suggest focused verification for each finding. If no findings are supported, say so and list any verification gaps.\n",
};
for (const [name, content] of Object.entries(files)) {
  await writeFile(resolve(directory, name), content, { flag: "wx" });
}
registry.plugins.push({ id, path });
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Created ${path}. Customize it, then run node scripts/validate-registry.mjs.`);
