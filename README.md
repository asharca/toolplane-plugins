# ToolPlane Resources

GitHub-backed resources for ToolPlane's Resource Center. The default registry is
`asharca/toolplane-resources` on `main`. Skills, MCP definitions, Pi packages,
Agent templates, and Assistant templates share one index; each resource has an
independent version and stable identity. The current resource is `ocrplane-cli`.

## Registry protocol

`registry.json` is required:

```json
{
  "schemaVersion": 1,
  "resources": [
    {
      "id": "ocrplane-cli",
      "kind": "skill",
      "version": "1.0.0",
      "path": "skills/ocrplane-cli"
    }
  ]
}
```

- IDs are unique, stable lowercase identifiers (`a-z`, digits, `.`, `_`, `-`).
  Renaming a directory does not rename a resource ID.
- Kinds are `skill`, `mcp`, `pi-package`, `agent`, or `assistant`.
- Versions follow SemVer. Bump the resource's version whenever its released
  content or descriptor changes; never reuse a version for different bytes.
- Paths are safe relative directories without absolute paths, `.` or `..`
  segments, empty segments, backslashes, or symlinks. Each directory contains
  `resource.json` with `schemaVersion: 1`, matching `kind`, and `listing` metadata.
- ToolPlane resolves this registry's branch to one full commit SHA, then reads
  every local resource from that commit. Existing immutable releases and pins
  retain their original source and identity.

An entry may instead add a fixed external source:

```json
"source": {
  "repository": "owner/repository",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "path": "skills/example"
}
```

This is an illustrative SHA, not an available resource. External references must
use a real 40-character lowercase commit SHA, never a branch, tag, or moving URL.
The entry's `path` remains required; `source.path` selects the external directory.
Do not assume registering private content permits publishing it publicly.

## Authoring resources

A skill descriptor contains only portable metadata:

```json
{
  "schemaVersion": 1,
  "kind": "skill",
  "listing": {
    "slug": "example",
    "name": "Example",
    "summary": null,
    "iconUrl": null,
    "tags": [],
    "author": "Author"
  },
  "skill": {
    "name": "Example",
    "slug": "example",
    "description": null,
    "userInvocable": true,
    "agentInvocable": true,
    "effort": "default"
  }
}
```

Store actual instructions in `SKILL.md` and keep supporting references, scripts,
and other files beside it. Do not duplicate `content`, `files`, or `source` in the
skill descriptor: ToolPlane builds those from the pinned Git tree. Ingestion
reads instructions as data and does not execute skill scripts.

For `pi-package`, `resource.json` contains the schema header and listing only;
the actual pinned directory and `package.json` are captured as the package.
MCP, Agent, and Assistant descriptors use ToolPlane's existing portable release
schemas, with `mcp`, `agent`, or `assistant` payloads respectively. Never include
workspace/user credential IDs, API keys, access tokens, private environment
values, or other secrets. Runtime authorization and credentials are configured
inside ToolPlane, not in this public repository.

## Maintaining and syncing

1. Edit a resource's files and descriptor, preserving its stable ID.
2. Increase its version in `registry.json` independently of other resources.
3. Run `node scripts/validate-registry.mjs`, then submit a pull request.
4. After merge, a ToolPlane workspace owner/admin requests a GitHub registry
   sync through the Resource Center. Registration requires the repository,
   branch, and intended visibility; private repositories require authorized
   credentials supplied privately to ToolPlane.

The dependency-free Node validator and GitHub Actions check the root index,
unique IDs, pinned external references, local safe paths, all listing headers,
complete skill metadata, and package manifest name/version. ToolPlane ingestion
is authoritative for full MCP/Agent/Assistant schemas, remote source access,
content safety limits, secret checks, and immutable release creation. CI does
not execute resource instructions, install their dependencies, or fetch external
resource content.

## Migration provenance and licensing

This repository continues the complete Git history of
[`asharca/tp-skills`](https://github.com/asharca/tp-skills), whose migration source
commit is `290dbb26ded67d0054c3ca468f1ad1aec09f4951`. That commit remains an
ancestor of this repository's `main`; the original README and old registry
format are available in its tree. `migration-provenance.json` records every
original skill file's source Git blob ID and SHA-256 digest. Those file bytes
were retained unchanged when descriptors were added.

The source contained no license file or declared GitHub license at migration.
Migration does not grant a new license or change any existing rights. Preserve
any future resource-specific license and attribution files alongside content.

GitHub repository settings and metadata were exported privately before
migration; they are not published here. The old production webhook was not
copied: it targets the retired skill-registry endpoint and its secret cannot be
recovered from GitHub. No old-repository deletion is performed by this registry
or its CI. Deletion requires separate approval after end-to-end ToolPlane
verification and confirmation that callers no longer depend on the old URL.
