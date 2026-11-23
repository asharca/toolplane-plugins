# OcrPlane CLI

通过 OcrPlane CLI 技能，从 PDF、图片、Office 文档和 CSV 中提取文本、Markdown、表格、公式及结构化文档内容。

## 使用方法

将插件添加到工作区，在 Pi Agent 中选择插件，审核并应用修订后新建会话。向 Agent 提供文档并描述处理要求。[技能指令](skills/ocrplane-cli/SKILL.md)包含可用性检查、预检、同步解析及异步任务流程。

## 配置 OcrPlane 服务

- **平台预设**：平台管理员在插件目录的 OcrPlane CLI 卡片配置 `OCRPLANE_BASE_URL` 和 `OCRPLANE_API_KEY`。预设配齐后，工作区新添加插件时默认使用预设，不需要查看或填写共享密钥。
- **自定义配置**：在工作区插件详情切换为自定义配置，填写自己的服务地址和 API Key。凭据缺失或失效时不会回退到平台预设。
- **从旧版本升级**：在「已添加」更新插件，确认配置来源，审核并应用 Agent 修订，再新建会话。既有会话继续使用固定快照。

ToolPlane 通过控制面代理调用 OcrPlane；沙箱收到的是代理地址和运行时令牌，而非上游密钥。不要把真实密钥写入插件、命令或会话。

## 运行要求与权限

- Pi 运行时，以及已授权的 shell 和文件访问。
- 沙箱 PATH 中可用的 `ocrplane`，或明确授予通过 `uv` 安装它的权限。
- 沙箱需能访问 ToolPlane 运行时代理，控制面需能访问配置的 OcrPlane 服务；安装 CLI 还需访问上游仓库和依赖源。

安装插件不会安装 CLI、创建凭据、开放网络或授予额外工具。处理文档会把文件发送到配置的服务，处理敏感数据前须取得授权。

## 插件内容与限制

仅包含一个原生 Pi 技能：`skills/ocrplane-cli/SKILL.md`，不包含 MCP 连接或 JavaScript 扩展。CLI 失败或配置缺失必须如实报告，插件安装成功不代表文档处理链路可用。

## 版本与署名

2.1.0 支持 ToolPlane 平台预设和工作区自定义配置。ToolPlane 按固定 Git 提交捕获版本，现有会话继续使用原快照。

技能来源于 `asharca/tp-skills`；仓库的 `migration-provenance.json` 记录原始文件。上游内容没有声明许可证，本文档不授予该内容的新使用权。
