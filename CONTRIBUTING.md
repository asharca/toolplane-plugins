# Contributing plugins

Use this repository as a GitHub template for your own marketplace, or submit a
pull request here to contribute to the official ToolPlane registry. Creating a
repository from a template does not preserve a fork relationship: fork the
official repository separately when contributing upstream.

## Your own marketplace

1. Select **Use this template → Create a new repository**. Keep the CI workflow
   and `scripts/` directory. The official OCR plugin is a working reference;
   remove its entry from `registry.json` if you do not want to distribute it.
   Preserve attribution for any content you retain.
2. Clone your repository and run `node scripts/create-plugin.mjs my-review`.
   This creates a working, read-only Pi review prompt, a package README, and an
   index entry. Edit the prompt, package name, description, and README for your
   plugin; choose a license for content you own.
3. Run `node scripts/validate-registry.mjs`, commit, and push. Enable GitHub
   Actions so pull requests run the same checks. No dependencies are installed
   and no plugin code is executed by this workflow.
4. In ToolPlane, open **Plugin Center → Sources → Add source** and enter your
   GitHub `owner/repository` and branch. Public sources need no token; private
   sources need an explicitly configured read token. Sync the source, inspect
   the captured plugin, and add it to your workspace.

Your repository is not an official source simply because it uses this template.
Workspace sources retain workspace-scoped visibility and authorization.

## Contributing to the official registry

1. Fork `asharca/toolplane-plugins` and create a feature branch in your fork.
2. Add the plugin directory and its `registry.json` entry. Use a unique ID;
   one entry represents one native Pi package. Do not add external download
   pointers, ZIP uploads, credentials, or machine-specific paths.
3. Include `README.md` with usage, runtime requirements, tools/network access,
   configuration (names only, never secret values), limitations, and licensing.
   Include loadable extension output when extensions are declared.
4. Run `node scripts/validate-registry.mjs` and provide actual runtime verification
   evidence in the pull request. CI validates structure, not runtime safety.
5. Open a pull request against the official repository's default branch. Maintainers
   review licensing, behavior, permissions, and versioning before merging.
   A merged change becomes discoverable only after the official source syncs.

No direct push or automatic approval is granted to template users. Do not include
private OMP exports or session state in a public contribution. The GitHub registry
currently captures Pi packages; private OMP imports are not silently converted
into publicly distributable Pi plugins.

## Immutable versions and documentation

Package IDs are stable. `package.json` uses SemVer. Increment the version for
**every** package content change, including README-only changes. Never overwrite
a published ID/version. ToolPlane resolves the repository to a fixed commit and
reads the README from that captured release, not from the current branch.

Use relative Markdown links for files inside the package; GitHub-origin document
links resolve against the captured commit. Keep README under 256 KiB for inline
ToolPlane display. README is documentation, not a grant of execution permission.
Existing installations and conversations remain pinned until explicitly updated.

## Licensing

The historical OCR skill has no declared license; this template does not invent
one or grant new rights over it. Check `migration-provenance.json` and retain
upstream attribution. Add explicit licensing for your own contributions.
