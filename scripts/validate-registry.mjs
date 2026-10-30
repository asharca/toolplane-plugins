import assert from "node:assert/strict";
import { lstat, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;
async function safePath(base, value, allowRoot = false) {
  assert.equal(typeof value, "string", "path must be a string");
  const normalized = value.replace(/^\.\//, "");
  assert(allowRoot && normalized === "" || normalized.length > 0, "empty path");
  assert(!isAbsolute(normalized) && !normalized.includes("\\"), "path must be relative");
  assert(!normalized || normalized.split("/").every((part) => part && part !== "." && part !== ".."), "unsafe path");
  let path = base;
  for (const part of normalized.split("/").filter(Boolean)) {
    path = resolve(path, part);
    assert(!(await lstat(path)).isSymbolicLink(), `symlink: ${value}`);
  }
  const target = await realpath(path);
  const rel = relative(base, target);
  assert(!rel.startsWith("..") && !isAbsolute(rel), "path escapes package");
  return target;
}
async function validatePlugin(entry) {
  const directory = await safePath(root, entry.path, true);
  assert((await lstat(directory)).isDirectory(), "plugin path must be a directory");
  const manifest = await json(await safePath(directory, "package.json"));
  assert(object(manifest) && typeof manifest.name === "string" && manifest.name.length, "package name required");
  assert(typeof manifest.version === "string" && semver.test(manifest.version), "package version must be SemVer");
  assert(object(manifest.pi), "explicit Pi resource declarations required by this repository");
  let count = 0;
  for (const kind of ["skills", "prompts", "extensions", "themes"]) {
    if (manifest.pi[kind] === undefined) continue;
    assert(Array.isArray(manifest.pi[kind]), `pi.${kind} must be an array`);
    for (const path of manifest.pi[kind]) {
      await safePath(directory, path);
      count++;
    }
  }
  assert(count > 0, "at least one declared Pi resource required");
  const metadataPath = resolve(directory, "toolplane.plugin.json");
  const metadataStat = await lstat(metadataPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (metadataStat) {
    const metadata = await json(await safePath(directory, "toolplane.plugin.json"));
    assert(object(metadata), "metadata must be an object");
    assert(Object.keys(metadata).every((key) => ["name", "summary", "iconUrl", "tags"].includes(key)), "unknown metadata field");
    for (const key of ["name", "summary"]) assert(typeof metadata[key] === "string" && metadata[key].trim(), `${key} required`);
    if (metadata.iconUrl !== undefined) assert(typeof metadata.iconUrl === "string" && /^https?:\/\//.test(metadata.iconUrl), "invalid iconUrl");
    if (metadata.tags !== undefined) assert(Array.isArray(metadata.tags) && metadata.tags.every((tag) => typeof tag === "string" && tag.trim()), "invalid tags");
  }
}
const indexPath = resolve(root, "registry.json");
const exists = await lstat(indexPath).catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return null;
});
let plugins;
if (exists) {
  const registry = await json(await safePath(root, "registry.json"));
  assert(registry.schemaVersion === 3, "registry.json v2 is no longer supported; migrate to v3");
  assert(Object.keys(registry).every((key) => ["schemaVersion", "plugins"].includes(key)), "unknown registry field");
  assert(Array.isArray(registry.plugins), "plugins must be an array");
  plugins = registry.plugins;
  const ids = new Set();
  const paths = new Set();
  for (const entry of plugins) {
    assert(object(entry) && Object.keys(entry).every((key) => ["id", "path"].includes(key)), "invalid plugin entry");
    assert(typeof entry.id === "string" && /^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.id), "invalid plugin ID");
    assert(!ids.has(entry.id) && !paths.has(entry.path), "duplicate plugin ID/path");
    assert(typeof entry.path === "string" && entry.path.length && !entry.path.startsWith("./"), "index path must be relative without dot segments");
    ids.add(entry.id);
    paths.add(entry.path);
  }
} else {
  plugins = [{ path: "" }];
}
for (const plugin of plugins) await validatePlugin(plugin);
console.log(`Validated ${plugins.length} Pi plugin(s).`);
