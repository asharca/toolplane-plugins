# ToolPlane Plugins

Official Pi packages for the ToolPlane Plugin Center, indexed from
[`asharca/toolplane-plugins`](https://github.com/asharca/toolplane-plugins).
A plugin is one Pi package, not a composite of separately installable resources.

## Registry protocol v3

```json
{
  "schemaVersion": 3,
  "plugins": [{ "id": "ocrplane-cli", "path": "plugins/ocrplane-cli" }]
}
```

IDs must match `^[a-z0-9][a-z0-9-]{0,63}$` and be unique. Paths are unique,
safe relative directories: no absolute paths, traversal, backslashes or symlinks.
Each directory contains a Pi `package.json`; its SemVer `version` is the plugin
version. Never reuse the same ID/version for different bytes. Bump the package
version whenever its content changes; versions do not belong in the index.

A single-plugin repository can omit `registry.json` and put `package.json` at
the root. ToolPlane derives its ID from the slugified package name.

## Pi resources and metadata

The OCR plugin declares its native Pi skill resource in `package.json`:

```json
{
  "name": "@toolplane/ocrplane-cli",
  "version": "2.0.0",
  "description": "OCR and document understanding with the OcrPlane CLI skill.",
  "keywords": ["pi-package", "ocr", "documents"],
  "pi": { "skills": ["./skills"] }
}
```

Instructions live in `skills/ocrplane-cli/SKILL.md`. Pi packages can also declare
prompts, extensions and themes. Include built, loadable extension outputs where
needed. Do not include credentials, workspace IDs or environment secret values.
The skill's CLI and credentials are runtime prerequisites, not installed or
authorized by registry sync.

Optional `toolplane.plugin.json` supplies `name`, `summary`, `iconUrl` and
`tags` listing metadata. Without it, ToolPlane uses package `displayName`,
`description` and `keywords`. There are no `resource.json` member descriptors,
external-source index entries or standalone Skill/MCP/Agent/Assistant listings.

## Maintaining and syncing

1. Edit plugin files, retaining the stable plugin ID.
2. Bump `package.json` version.
3. Run `node scripts/validate-registry.mjs` and submit a pull request.
4. Merge, then use the configured GitHub push webhook or **Sync now**.

The dependency-free validator and CI check v3 structure, safe paths, Pi package
manifests, declared resource paths and metadata. They do not execute instructions,
install dependencies or capture packages. ToolPlane's isolated capture and secret
scan remain authoritative. Sync resolves a fixed commit and auto-approves scanned
releases. Failed sync retains the last successful catalog. v2 indexes are rejected.
Removed IDs disappear from discovery; existing immutable installs remain pinned.

Deployers configure the global, read-only official source using
`TOOLPLANE_OFFICIAL_PLUGIN_REPOSITORY` (default `asharca/toolplane-plugins`, empty
disables), `TOOLPLANE_OFFICIAL_PLUGIN_BRANCH` (default `main`) and optionally
`TOOLPLANE_OFFICIAL_PLUGIN_TOKEN` (read at sync time, never stored in the database).
All workspaces see it with an official badge; only platform admins manually sync
it. Workspace owners/admins can additionally register public GitHub repositories
without credentials, or private repositories with an encrypted PAT. Workspace
sources remain workspace-scoped, even if the GitHub repository is public.

Set server-side `TOOLPLANE_RESOURCE_REGISTRY_WEBHOOK_SECRET`, then configure the
registry's derived secret and `/api/v1/resource-registries/{registryId}/webhook`
URL as a GitHub JSON push webhook. Never put the master secret into GitHub. There
is no update polling or notification system: sync drives the **Update available**
badge, and a workspace admin explicitly updates the installation.

Selected agents then auto-follow by publishing a new revision. Added MCP
requirements/tools or changed executable code pause this in **Review required**;
an owner/admin must approve. Existing sessions keep their immutable snapshots.
Platform admins can withdraw listings or revoke unsafe releases; GitHub indexing
never overrides a safety take-down. There is no publication review queue or
external-client installer.

## Migration provenance and licensing

This repository continues the Git history of
[`asharca/tp-skills`](https://github.com/asharca/tp-skills), source commit
`290dbb26ded67d0054c3ca468f1ad1aec09f4951`.
`migration-provenance.json` preserves original blob IDs, SHA-256 hashes and source
paths while recording the current `plugins/ocrplane-cli/skills/ocrplane-cli/`
target. The skill bytes are unchanged; v3 replaces the v2 composite descriptors.
The source declared no license; migration grants no new rights. Preserve any
future resource-specific licenses and attribution.

GitHub repository settings and metadata were exported privately before
migration; they are not published here. The old production webhook was not
copied: it targets the retired skill-registry endpoint and its secret cannot be
recovered from GitHub. Neither this registry nor its CI deletes the old
repository. Deletion requires separate approval after end-to-end ToolPlane
verification and confirmation that callers no longer depend on the old URL.
