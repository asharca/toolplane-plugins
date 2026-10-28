---
name: ocrplane-cli
description: Use the OcrPlane CLI when the user uploads PDFs, images, DOCX, XLSX, PPTX, CSV, or asks to extract OCR text, markdown, tables, formulas, or structured document content.
author: ToolPlane
---

# OcrPlane CLI Skill

Use this skill for OCR and document understanding.

The primary tool is the `ocrplane` command. Install it with `uv`:

```bash
uv tool install "git+https://github.com/asharca/ocrplane-cli.git"
```

## Authentication

Never print, ask for, or hard-code API keys in commands or responses.

The runtime must provide:

```txt
OCRPLANE_BASE_URL
OCRPLANE_API_KEY
```

If credentials are missing, explain that the OcrPlane environment variables are
not configured.

## Availability Check

Before OCR work, verify the CLI exists:

```bash
ocrplane --help
```

If `ocrplane` is missing, use `uv` first. Check whether `uv` exists:

```bash
uv --version
```

If `uv` is missing, install `uv` with the official standalone installer:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

After installing `uv`, ensure its bin directory is on `PATH`. In most shells,
reloading the shell profile or exporting `PATH="$HOME/.local/bin:$PATH"` is
enough:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Then install or upgrade `ocrplane`:

```bash
uv tool install "git+https://github.com/asharca/ocrplane-cli.git"
```

If `ocrplane` is already installed but seems stale, upgrade it:

```bash
uv tool upgrade ocrplane-cli
```

For one-off use without persistent installation:

```bash
uvx --from "git+https://github.com/asharca/ocrplane-cli.git" ocrplane --help
```

## Recommended Flow

1. Resolve the actual file path.
2. Validate the request without sending it when path or options are uncertain:

   ```bash
   ocrplane parse path/to/report.pdf --json --dry-run
   ```

3. For small documents, submit and wait:

   ```bash
   ocrplane parse path/to/report.pdf --json
   ```

4. For large files, submit asynchronously:

   ```bash
   ocrplane parse path/to/large.pdf --json --no-wait
   ```

5. Poll until complete:

   ```bash
   ocrplane status <task_id> --json
   ```

6. Read results in bounded chunks:

   ```bash
   ocrplane markdown <task_id> --json --offset 0 --max-length 12000
   ocrplane blocks <task_id> --json --offset 0 --limit 50
   ```

## Parameter Guidance

- Chinese documents: `--lang ch`
- Mixed Chinese/English: `--lang ch,en`
- English-only documents: `--lang en`
- Start with `--backend pipeline` for speed.
- Use VLM or hybrid backends only when layout quality matters more than latency.
- Keep `--formula` and `--table` enabled for papers, invoices, reports, and
  spreadsheets.
- For large PDFs, split work with `--start-page` and `--end-page`.

Example:

```bash
ocrplane parse path/to/a.pdf \
  --backend pipeline \
  --lang ch \
  --parse-method auto \
  --formula \
  --table \
  --json
```

## Large Result Handling

Do not ask for unbounded full results for large documents.

- Use `markdown --offset --max-length` for markdown paging.
- Use `blocks --offset --limit` for structured extraction.
- Use `result --max-markdown-length --max-blocks` only for small documents or
  previews.
- Use `--save-dir path/to/ocr-output` when the user needs durable artifacts.

Artifact example:

```bash
ocrplane parse path/to/report.pdf --save-dir path/to/ocr-report
```

This can create `summary.json`, `result.md`, `content_blocks.json`, and
`pages.json`.

## Structured Blocks

`content_list` blocks may include `bbox`, `page_idx`, `text`, `table_body`,
`list_items`, image paths, and other fields. For DOCX/Office inputs, some blocks
may not have `bbox`; that is normal because the source document may not provide
page coordinates.

## Error Handling

- If `ocrplane parse` times out while waiting, use `status <task_id>` to check
  whether the server is still processing.
- If the server reports a MineRU timeout, tell the user the backend timed out and
  suggest a smaller page range, `--parse-method txt` for text PDFs, or a faster
  backend.
- If `--json` output is needed for automation, parse stdout as JSON and do not
  rely on Rich human output.

## Response Guidance

Return the useful extracted answer first. Mention the task id and any output
files only when they help the user continue. For uncertain OCR or failed tasks,
state the failure plainly and suggest the next command to retry.
