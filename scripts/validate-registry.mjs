import assert from "node:assert/strict";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const kinds = ["skill", "mcp", "pi-package", "agent", "assistant"];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const repository = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/;

function object(value, required, optional = []) {
  assert(value && typeof value === "object" && !Array.isArray(value), "Expected an object");
  for (const key of required) assert(Object.hasOwn(value, key), `Missing ${key}`);
  for (const key of Object.keys(value)) assert([...required, ...optional].includes(key), `Unexpected ${key}`);
}
function text(value, maximum, minimum = 1) {
  assert(typeof value === "string" && value.length >= minimum && value.length <= maximum, "Invalid text field");
}
function nullableText(value, maximum) {
  if (value !== null) text(value, maximum, 0);
}
function relativeDirectory(value) {
  text(value, 240);
  assert(!/[\\\x00-\x1f\x7f]/.test(value), "Unsafe resource path");
  assert(!value.startsWith("/"), "Absolute resource path");
  assert(value.split("/").every((part) => part && part !== "." && part !== ".."), "Unsafe resource path segment");
}
function listing(value) {
  object(value, ["slug", "name", "summary", "iconUrl", "tags", "author"]);
  text(value.slug, 100);
  text(value.name, 240);
  text(value.author, 240);
  nullableText(value.summary, 4000);
  nullableText(value.iconUrl, 2000);
  assert(Array.isArray(value.tags) && value.tags.length <= 20, "Invalid tags");
  for (const tag of value.tags) text(tag, 40);
}
async function safeTree(directory) {
  const info = await lstat(directory);
  assert(info.isDirectory() && !info.isSymbolicLink(), "Resource must be a real directory");
  for (const name of await readdir(directory)) {
    const filename = path.join(directory, name);
    const item = await lstat(filename);
    assert(!item.isSymbolicLink(), `Symlinks are not portable: ${filename}`);
    if (item.isDirectory()) await safeTree(filename);
    else assert(item.isFile(), `Unsupported file: ${filename}`);
  }
}
async function json(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

const registry = await json(path.join(root, "registry.json"));
object(registry, ["schemaVersion", "resources"]);
assert.equal(registry.schemaVersion, 1);
assert(Array.isArray(registry.resources) && registry.resources.length <= 200);
const ids = new Set();
for (const resource of registry.resources) {
  object(resource, ["id", "kind", "version", "path"], ["source"]);
  assert(typeof resource.id === "string" && /^[a-z0-9][a-z0-9._-]{0,99}$/.test(resource.id));
  assert(!ids.has(resource.id), `Duplicate id: ${resource.id}`);
  ids.add(resource.id);
  assert(kinds.includes(resource.kind), "Unsupported resource kind");
  text(resource.version, 128);
  assert(semver.test(resource.version), "Version must be SemVer");
  relativeDirectory(resource.path);
  if (resource.source !== undefined) {
    object(resource.source, ["repository", "commit", "path"]);
    assert(typeof resource.source.repository === "string" && repository.test(resource.source.repository));
    assert(!resource.source.repository.endsWith(".git") && !resource.source.repository.endsWith("/.."));
    assert(typeof resource.source.commit === "string" && /^[a-f0-9]{40}$/.test(resource.source.commit));
    relativeDirectory(resource.source.path);
    // Remote content is validated by ToolPlane at the exact pinned commit, not fetched or executed in CI.
    continue;
  }
  const directory = path.join(root, resource.path);
  await safeTree(directory);
  assert((await realpath(directory)).startsWith(`${root}${path.sep}`), "Resource escapes repository");
  const descriptor = await json(path.join(directory, "resource.json"));
  const payload = resource.kind === "pi-package" ? [] : resource.kind === "agent"
    ? ["rootAgentKey", "agents", "deployments", "skills", "toolkits"] : [resource.kind];
  object(descriptor, ["schemaVersion", "kind", "listing", ...payload]);
  assert.equal(descriptor.schemaVersion, 1);
  assert.equal(descriptor.kind, resource.kind);
  listing(descriptor.listing);
  if (resource.kind === "skill") {
    const skill = descriptor.skill;
    object(skill, ["name", "slug", "description", "userInvocable", "agentInvocable", "effort"]);
    text(skill.name, 240);
    text(skill.slug, 120);
    nullableText(skill.description, 4000);
    text(skill.effort, 64);
    assert.equal(typeof skill.userInvocable, "boolean");
    assert.equal(typeof skill.agentInvocable, "boolean");
    assert((await readFile(path.join(directory, "SKILL.md"))).length > 0, "Missing skill content");
  } else if (resource.kind === "pi-package") {
    const manifest = await json(path.join(directory, "package.json"));
    text(manifest.name, 214);
    text(manifest.version, 128);
    assert(semver.test(manifest.version), "Package version must be SemVer");
  } else if (resource.kind === "agent") {
    text(descriptor.rootAgentKey, 80);
    assert(Array.isArray(descriptor.agents) && descriptor.agents.length >= 1 && descriptor.agents.length <= 64);
    for (const key of ["deployments", "skills", "toolkits"]) {
      assert(Array.isArray(descriptor[key]) && descriptor[key].length <= 512, `Invalid ${key}`);
    }
    assert.equal(descriptor.toolkits.length, 0, "Toolkit composites are not accepted");
    for (const deployment of descriptor.deployments) {
      assert(deployment && typeof deployment === "object" && !Array.isArray(deployment));
      object(deployment.publicEnv, []);
      assert(Array.isArray(deployment.requiredEnv) && deployment.requiredEnv.length <= 256, "Invalid environment requirements");
      for (const name of deployment.requiredEnv) {
        assert(typeof name === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name), "Environment requirements contain names only");
      }
    }
    for (const agent of descriptor.agents) {
      assert(agent && typeof agent === "object" && !Array.isArray(agent));
      assert(Array.isArray(agent.toolkitKeys) && agent.toolkitKeys.length === 0, "Toolkit bindings are not accepted");
      if (agent.runtime !== undefined) {
        object(agent.runtime, ["kind"]);
        assert.equal(agent.runtime.kind, "pi", "Only Pi Agent templates are accepted");
      }
    }
    // Complete portable graph validation and explicit runtime reauthorization happen in ToolPlane.
  } else {
    const value = descriptor[resource.kind];
    assert(value && typeof value === "object" && !Array.isArray(value), "Missing portable payload");
    // ToolPlane applies the complete portable release schema and credential checks on ingestion.
  }
}
console.log(`Validated registry index, ${ids.size} resource header(s), and local skill/package descriptors.`);
