# ToolPlane 官方插件仓库

本仓库为 [ToolPlane 插件中心](https://github.com/asharca/toolplane-plugins)提供官方 Pi 插件。一个插件对应一个原生 Pi 包，不是多个独立安装资源的组合。此仓库是普通 GitHub 仓库，不启用模板功能。

## 创建自己的插件市场

Fork 本仓库，在自己的仓库中维护插件。官方与工作区市场使用相同的目录结构、校验器和 CI，没有官方专属发布格式。

```bash
node scripts/create-plugin.mjs my-review
node scripts/validate-registry.mjs
```

创建命令会生成一个可用的只读代码评审提示、插件 README 和索引项。修改插件后提交到自己的 GitHub 仓库，在 ToolPlane **插件中心 → 来源**登记仓库与分支并同步。公开仓库不需要令牌；私有仓库需明确配置只读凭据。

内置 OCR 插件作为官方实例；不需要时可从自己的 `registry.json` 删除其条目。保留的内容必须遵守原有署名与许可要求。Fork 不会使你的仓库成为官方来源。

向官方贡献时，在 Fork 中创建分支并提交 Pull Request。详细流程见[贡献指南](CONTRIBUTING.md)。贡献者不会获得直接推送官方分支的权限。

## 注册表协议 v3

```json
{
  "schemaVersion": 3,
  "plugins": [{ "id": "ocrplane-cli", "path": "plugins/ocrplane-cli" }]
}
```

ID 须满足 `^[a-z0-9][a-z0-9-]{0,63}$`，ID 与目录路径均不得重复。路径必须是安全的相对目录，禁止绝对路径、越界、反斜杠和软链接。

每个插件目录包含 Pi `package.json`，其 SemVer `version` 即插件版本，索引中不再填写版本。根目录的 `README.md` 应说明用法、依赖、权限、配置、限制和许可。任何文件变化（包括 README）都必须递增版本，不得用不同内容覆盖已发布的同一 ID／版本。

单插件仓库可以省略 `registry.json`，直接在根目录提供 `package.json`；ToolPlane 从包名派生插件 ID。

## 资源声明与元数据

```json
{
  "name": "@toolplane/ocrplane-cli",
  "version": "2.0.2",
  "description": "通过 OcrPlane CLI 技能进行 OCR 和文档理解。",
  "keywords": ["pi-package", "ocr", "documents"],
  "pi": { "skills": ["./skills"] }
}
```

技能指令位于 `skills/ocrplane-cli/SKILL.md`。Pi 包也可声明 prompts、extensions 和 themes；需要构建的扩展应包含可直接加载的产物。不得提交凭据、工作区 ID 或环境密钥值。CLI 和凭据属于运行前提，同步市场不会安装或授权它们。

可选的 `toolplane.plugin.json` 提供 `name`、`summary`、`iconUrl` 和 `tags`。省略时使用包的 `displayName`、`description` 与 `keywords`。不使用 `resource.json`、跨仓库下载索引或独立 Skill／MCP／Agent／Assistant 发布条目。

## 维护与同步

1. 修改插件文件，保持插件 ID 稳定。
2. 递增 `package.json` 版本。
3. 运行 `node scripts/validate-registry.mjs`，提交 Pull Request。
4. 合并后通过已配置的 GitHub push Webhook 或“立即同步”更新目录。

无依赖校验器和 CI 检查 v3 结构、安全路径、Pi 声明、资源路径、非空且不超过 256 KiB 的 README 及元数据，不执行插件代码、不安装依赖。平台隔离捕获和密钥扫描仍是最终准入检查。同步解析固定提交；失败保留上一成功目录。v2 索引会被拒绝。删除索引项只移除发现入口，不改变现有固定安装。

部署者配置全局只读官方来源：

| 环境变量 | 用途 |
| --- | --- |
| `TOOLPLANE_OFFICIAL_PLUGIN_REPOSITORY` | 默认 `asharca/toolplane-plugins`；空值禁用 |
| `TOOLPLANE_OFFICIAL_PLUGIN_BRANCH` | 默认 `main` |
| `TOOLPLANE_OFFICIAL_PLUGIN_TOKEN` | 可选读取令牌；同步时读取，不写入数据库 |

官方来源对所有工作区可见，只有平台管理员可手动同步。工作区 owner／admin 可登记自己的公开或私有仓库；私有 PAT 加密保存。即使仓库公开，工作区来源也只对该工作区可见。

自动同步需配置服务端 `TOOLPLANE_RESOURCE_REGISTRY_WEBHOOK_SECRET`，将来源派生的 Secret 和 `/api/v1/resource-registries/{registryId}/webhook` 地址填入 GitHub JSON push Webhook，不能把服务端主密钥直接交给 GitHub。没有轮询更新机制；同步产生“有更新”标记，由管理员明确升级安装。

Agent 跟随后续发布新修订；新增 MCP 要求、工具或执行代码变化会暂停并要求权限审核。已有会话保持原快照。GitHub 索引不能覆盖管理员撤下或安全撤销。

## 迁移来源与许可

本仓库延续 [`asharca/tp-skills`](https://github.com/asharca/tp-skills) 的历史，来源提交为 `290dbb26ded67d0054c3ca468f1ad1aec09f4951`。`migration-provenance.json` 保留原始 blob ID、SHA-256 和路径，技能文件迁至 `plugins/ocrplane-cli/skills/ocrplane-cli/`，其指令内容未变。原内容没有声明许可证，本仓库不替原作者授予新许可。

迁移前的仓库设置备份不公开。旧生产 Webhook 指向已退役接口，未复制；其密钥无法从 GitHub 恢复。本仓库及 CI 不会删除旧仓库，删除仍需单独批准和端到端验证。
