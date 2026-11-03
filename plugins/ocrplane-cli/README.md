# OcrPlane CLI

Extract text, Markdown, tables, formulas, and structured document content from
PDFs, images, Office documents, and CSV files using the OcrPlane CLI skill.

## Usage

Add this plugin to your workspace, select it in a Pi Agent, review and apply the
revision, then start a new conversation. Ask the Agent to process a document and
supply the file. The [skill instructions](skills/ocrplane-cli/SKILL.md) describe
availability checks, dry runs, synchronous parsing, and asynchronous jobs.

## Requirements

- Pi runtime with authorized shell and file access.
- `ocrplane` on the sandbox PATH, or permission to install it using `uv`.
- `OCRPLANE_BASE_URL` and `OCRPLANE_API_KEY` supplied through authorized runtime
  configuration. Never put credential values in this package or conversation.
- Network access to the configured OcrPlane service; installation additionally
  contacts the upstream CLI repository and package dependencies.

Installing this plugin does not install the CLI, provision credentials, authorize
network access, or grant extra tools. Document processing sends the supplied file
to the configured service; obtain authorization before processing sensitive data.

## Contents

One native Pi skill: `skills/ocrplane-cli/SKILL.md`. No MCP connection or JavaScript
extension is bundled. CLI failures and missing configuration must be reported;
installation success alone does not establish that document processing works.

## Versions and attribution

Version 2.0.1 adds this README; the skill instructions are unchanged. ToolPlane
captures each version at a fixed Git commit and existing sessions stay pinned.

The skill originated in `asharca/tp-skills`; repository
`migration-provenance.json` records the original blobs. The upstream content has
no declared license. This README does not grant new rights to that content.
