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
  "package.json": `${JSON.stringify({ name: id, version: "1.0.0", description: "依据证据进行只读代码评审的 Pi 提示。", keywords: ["pi-package", "review"], pi: { prompts: ["./prompts"] } }, null, 2)}\n`,
  "README.md": `# ${id}\n\n用于只读代码评审的 Pi 提示。\n\n## 使用方法\n\n添加到工作区，在 Pi Agent 中选择插件，审核并应用修订后新建会话，调用 review 提示并提供待评审文件或变更。\n\n## 行为\n\n根据证据报告正确性与安全问题，附文件引用和验证建议。不修改文件、不安装依赖、不发布变更。\n\n## 运行要求与权限\n\n需要 Pi 运行时及 Agent 已授权的只读工具，不需要 MCP、网络、凭据或可执行插件代码。\n\n## 版本管理\n\n修改包内任何文件（包括本文档）都须递增 package.json 版本，已有会话保持固定版本。\n\n## 许可\n\n生成的包不自动授予许可，分发前请为自己拥有的内容选择并附上许可证。\n`,
  "prompts/review.md": "---\ndescription: 只读评审代码变更，不修改文件。\n---\n\n仅使用已经授权的只读工具评审提供的变更或文件。不得编辑文件、安装依赖、使用网络或发布内容。按严重程度报告可执行的正确性和安全问题，为每项提供文件引用与证据。区分已验证事实和不确定性，给出针对性的验证建议。没有证据支持问题时明确说明，并列出验证缺口。\n",
};
for (const [name, content] of Object.entries(files)) {
  await writeFile(resolve(directory, name), content, { flag: "wx" });
}
registry.plugins.push({ id, path });
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Created ${path}. Customize it, then run node scripts/validate-registry.mjs.`);
