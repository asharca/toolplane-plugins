# OcrPlane CLI

通过 OcrPlane CLI 技能，从 PDF、图片、Office 文档和 CSV 中提取文本、Markdown、表格、公式及结构化文档内容。

## 使用方法

将插件添加到工作区，在 Pi Agent 中选择插件，审核并应用修订后新建会话。向 Agent 提供文档并描述处理要求。[技能指令](skills/ocrplane-cli/SKILL.md)包含可用性检查、预检、同步解析及异步任务流程。

## 运行要求与权限

- Pi 运行时，以及已授权的 shell 和文件访问。
- 沙箱 PATH 中可用的 `ocrplane`，或明确授予通过 `uv` 安装它的权限。
- 通过已授权的运行时配置提供 `OCRPLANE_BASE_URL`、`OCRPLANE_API_KEY`，不得将密钥值写入插件或会话。
- 访问所配置 OcrPlane 服务的网络权限；安装还需要访问上游 CLI 仓库和依赖源。

安装插件不会安装 CLI、创建凭据、开放网络或授予额外工具。处理文档会把文件发送到配置的服务，处理敏感数据前须取得授权。

## 插件内容与限制

仅包含一个原生 Pi 技能：`skills/ocrplane-cli/SKILL.md`，不包含 MCP 连接或 JavaScript 扩展。CLI 失败或配置缺失必须如实报告，插件安装成功不代表文档处理链路可用。

## 版本与署名

2.0.2 将说明文档改为中文，技能执行指令不变。ToolPlane 按固定 Git 提交捕获版本，现有会话继续使用原快照。

技能来源于 `asharca/tp-skills`；仓库的 `migration-provenance.json` 记录原始文件。上游内容没有声明许可证，本文档不授予该内容的新使用权。
