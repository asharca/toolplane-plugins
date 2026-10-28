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

async function validateMember(directory, resource) {
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

const registry = await json(path.join(root, "registry.json"));
object(registry, ["schemaVersion", "packages"]);
assert.equal(registry.schemaVersion, 2);
assert(Array.isArray(registry.packages) && registry.packages.length <= 200);
const ids = new Set();
for (const entry of registry.packages) {
  object(entry, ["id", "version", "path"], ["source"]);
  assert(typeof entry.id === "string" && /^[a-z0-9][a-z0-9._-]{0,99}$/.test(entry.id));
  assert(!ids.has(entry.id), `Duplicate id: ${entry.id}`);
  ids.add(entry.id);
  text(entry.version, 128);
  assert(semver.test(entry.version), "Version must be SemVer");
  relativeDirectory(entry.path);
  if (entry.source !== undefined) {
    object(entry.source, ["repository", "commit", "path"]);
    assert(typeof entry.source.repository === "string" && repository.test(entry.source.repository));
    assert(!entry.source.repository.endsWith(".git") && !entry.source.repository.endsWith("/.."));
    assert(typeof entry.source.commit === "string" && /^[a-f0-9]{40}$/.test(entry.source.commit));
    relativeDirectory(entry.source.path);
    // Remote content is validated by ToolPlane at the exact pinned commit, not fetched or executed in CI.
    continue;
  }
  const packageDirectory = path.join(root, entry.path);
  await safeTree(packageDirectory);
  assert((await realpath(packageDirectory)).startsWith(`${root}${path.sep}`), "Package escapes repository");
  const packageDescriptor = await json(path.join(packageDirectory, "resource.json"));
  object(packageDescriptor, ["schemaVersion", "kind", "listing", "members"]);
  assert.equal(packageDescriptor.schemaVersion, 1);
  assert.equal(packageDescriptor.kind, "resource-package");
  listing(packageDescriptor.listing);
  assert(Array.isArray(packageDescriptor.members) && packageDescriptor.members.length >= 1 && packageDescriptor.members.length <= 64, "Package must contain 1–64 members");
  const memberIds = new Set();
  const memberPaths = [];
  for (const resource of packageDescriptor.members) {
    object(resource, ["id", "kind", "path"]);
    assert(typeof resource.id === "string" && /^[a-z0-9][a-z0-9._-]{0,99}$/.test(resource.id));
    assert(!memberIds.has(resource.id), `Duplicate member id: ${resource.id}`);
    memberIds.add(resource.id);
    assert(kinds.includes(resource.kind), "Unsupported member kind");
    relativeDirectory(resource.path);
    const normalizedPath = resource.path.toLowerCase();
    assert(!memberPaths.some((other) => other === normalizedPath || other.startsWith(`${normalizedPath}/`) || normalizedPath.startsWith(`${other}/`)), "Member directories must not overlap");
    memberPaths.push(normalizedPath);
    const directory = path.join(packageDirectory, resource.path);
    assert((await lstat(directory)).isDirectory(), "Member must be a directory");
    await validateMember(directory, resource);
  }
}
console.log(`Validated registry index, ${ids.size} resource package(s), and their local member descriptors.`);
