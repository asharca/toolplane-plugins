# ToolPlane Resources

GitHub-backed resource packages for ToolPlane's Resource Center. The default
registry is `asharca/toolplane-resources` on `main`. Each package has a stable
identity and one version for all its Skill, MCP, Pi package, Agent template and
Assistant template members. The current package is `ocrplane-cli`.

## Registry protocol

`registry.json` is required:

```json
{
  "schemaVersion": 2,
  "packages": [
    {
      "id": "ocrplane-cli",
      "version": "1.1.0",
      "path": "packages/ocrplane-cli"
    }
  ]
}
```

- Package IDs are unique, stable lowercase identifiers (`a-z`, digits, `.`, `_`, `-`).
  Renaming a directory does not rename a package or member ID.
- Versions follow SemVer. Bump the whole package's version whenever any member
  content or descriptor changes; never reuse a version for different bytes.
- Paths are safe relative directories without absolute paths, `.` or `..`
  segments, empty segments, backslashes, or symlinks.
- Every package directory contains `resource.json`:

```json
{
  "schemaVersion": 1,
  "kind": "resource-package",
  "listing": {
    "slug": "example",
    "name": "Example package",
    "summary": null,
    "iconUrl": null,
    "tags": [],
    "author": "Author"
  },
  "members": [
    { "id": "instructions", "kind": "skill", "path": "skills/example" },
    { "id": "tools", "kind": "mcp", "path": "mcp/example" }
  ]
}
```

The example describes the layout, not bundled executable resources. A package
contains 1–64 members with unique stable IDs and non-overlapping directories.
Member kinds are `skill`, `mcp`, `pi-package`, `agent`, and `assistant`; each
member directory has its own typed `resource.json` as described below. Member
paths are relative to the package directory, not the repository root. Members
have no independent registry versions or public listings.

ToolPlane resolves the registry branch to one full commit SHA and reads all
package bytes at that commit. External sources are also fixed to a commit.
Installation selects members explicitly; updates display changes without
silently installing new members, expanding authorization or updating Agent and
conversation pins. Existing immutable releases retain their original provenance.

An entry may instead add a fixed external source:

```json
"source": {
  "repository": "owner/repository",
  "commit": "0123456789abcdef0123456789abcdef01234567",
  "path": "packages/example"
}
```

This is an illustrative SHA, not an available resource. External references must
use a real 40-character lowercase commit SHA, never a branch, tag, or moving URL.
The entry's `path` remains required; `source.path` selects the external directory.
Do not assume registering private content permits publishing it publicly.

## Authoring package members

A Skill member descriptor contains only portable metadata:

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
MCP and Assistant descriptors use ToolPlane's existing portable release schemas,
with `mcp` or `assistant` payloads respectively. An Agent descriptor instead uses
a **flat portable graph**: `schemaVersion`, `kind: "agent"`, `listing`,
`rootAgentKey`, `agents`, `deployments`, `skills`, and `toolkits` are root fields;
there is no nested `agent` payload. `agents` contains 1–64 definitions; the other
graph arrays allow up to 512 entries, but `toolkits` and each Agent's `toolkitKeys`
must be empty. Agent templates support only Pi (`runtime: {"kind": "pi"}`);
omitting runtime selects Pi. Existing non-Pi execution is not restored.

Never include workspace/user credential IDs, API keys, access tokens, private
environment values, unsafe skill paths, unpinned MCP recipes, or other secrets.
Runtime authorization and credentials are configured inside ToolPlane, not in
this public repository. Imported Agents are Pi drafts requiring explicit
reauthorization before execution; importing a graph does not grant access.
Every Agent deployment's `publicEnv` must be exactly `{}`. Declare environment
variable names only in `requiredEnv`; never embed any environment values,
including opaque values that do not match a known token pattern. This admission
rule applies to new GitHub descriptors, not a rewrite of historical releases.

GitHub package descriptors are the only new catalog authoring path, including
Agent and Assistant templates. New registry sync accepts version 2 only; the
former standalone-resource index is no longer a publication path. Existing
immutable releases and installations remain available without rewriting their
bytes. Creating or editing a workspace Skill, MCP, Agent or Assistant is a
separate activity and does not publish it to the Resource Center.

## Maintaining and syncing

1. Edit a package's members and descriptor, preserving stable package/member IDs.
2. Increase the package version in `registry.json`; all its members share this release.
3. Run `node scripts/validate-registry.mjs`, then submit a pull request.
4. After merge, a ToolPlane workspace owner/admin requests a GitHub registry
   sync through the Resource Center. Registration requires the repository,
   branch, and intended visibility; private repositories require authorized
   credentials supplied privately to ToolPlane.

The dependency-free Node validator and GitHub Actions check the root index,
unique package/member IDs, pinned external references, non-overlapping safe
member directories, all listing headers, complete Skill metadata, and Pi package
manifest name/version. ToolPlane ingestion is authoritative for full portable
schemas, remote source access, byte limits, secret checks and immutable release
creation. CI does not execute member instructions, install dependencies, or
fetch external package content.

## Migration provenance and licensing

This repository continues the complete Git history of
[`asharca/tp-skills`](https://github.com/asharca/tp-skills), whose migration source
commit is `290dbb26ded67d0054c3ca468f1ad1aec09f4951`. That commit remains an
ancestor of this repository's `main`; the original README and old registry
format are available in its tree. `migration-provenance.json` records every
original skill file's source Git blob ID and SHA-256 digest. Those file bytes
were retained unchanged when descriptors were added.

The version-2 migration moves OCR content under
`packages/ocrplane-cli/skills/ocrplane-cli/`, preserving its bytes. The provenance
file retains the original paths as historical evidence, not current import paths.

The source contained no license file or declared GitHub license at migration.
Migration does not grant a new license or change any existing rights. Preserve
any future resource-specific license and attribution files alongside content.

GitHub repository settings and metadata were exported privately before
migration; they are not published here. The old production webhook was not
copied: it targets the retired skill-registry endpoint and its secret cannot be
recovered from GitHub. No old-repository deletion is performed by this registry
or its CI. Deletion requires separate approval after end-to-end ToolPlane
verification and confirmation that callers no longer depend on the old URL.
