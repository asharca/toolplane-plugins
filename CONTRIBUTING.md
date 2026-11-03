# 贡献指南

本仓库是 ToolPlane 官方插件仓库。你可以 Fork 后维护自己的市场，也可以通过 Pull Request 向官方贡献插件。

## 维护自己的市场

1. Fork `asharca/toolplane-plugins`，保留 `scripts/` 和 CI 工作流。不需要官方 OCR 插件时，从 `registry.json` 删除其条目；保留内容需遵守原署名和许可要求。
2. 克隆自己的仓库，运行 `node scripts/create-plugin.mjs my-review`。命令生成可用的只读 Pi 代码评审提示、中文 README 和索引项。按用途修改包名、说明、提示内容，并为自己拥有的内容选择许可证。
3. 运行 `node scripts/validate-registry.mjs` 后提交并推送。启用 GitHub Actions，使 Pull Request 执行相同检查。CI 不安装依赖、不运行插件代码。
4. 在 ToolPlane **插件中心 → 来源 → 添加来源**填写自己的 `owner/repository` 和分支。公开仓库无需令牌，私有仓库需明确配置读取令牌。同步后检查插件内容，再添加到工作区。

Fork 不授予官方身份，来源继续遵守工作区可见性和授权边界。

## 向官方贡献

1. Fork 官方仓库，在自己的 Fork 中创建功能分支。
2. 添加插件目录及 `registry.json` 条目，使用唯一 ID。每个条目对应一个原生 Pi 包，不接受外部下载指针、ZIP 上传、凭据或机器私有路径。
3. 提供中文 `README.md`，说明用法、运行时、依赖、工具与网络权限、配置键（不得包含密钥值）、限制和许可。声明扩展时应包含可加载产物。
4. 运行 `node scripts/validate-registry.mjs`，并在 PR 中写明实际运行验收结果。结构检查通过不代表运行安全或行为正确。
5. 向官方默认分支提交 Pull Request，维护者审核许可、行为、权限和版本后合并。合并后还需官方来源同步才能出现在目录中。

贡献者没有直接推送官方分支或自动批准权限。禁止公开私人 OMP 导出和会话状态。GitHub 市场目前捕获 Pi 包，OMP 私有导入不会自动转换成可公开发布的 Pi 插件。

## 不可变版本与说明文档

插件 ID 保持稳定，`package.json` 使用 SemVer。任何包内文件变化，包括仅改 README，都必须递增版本，不能覆盖已发布 ID／版本。

平台从固定 Git 提交捕获内容，README 随版本保存，不读取浮动分支代替旧文档。包内文档可使用相对链接；GitHub 来源链接固定到对应提交。README 不超过 256 KiB 才能内联显示。文档不是执行权限，已有安装和会话不会因文档修改自动升级。

## 许可

历史 OCR 技能没有声明许可证；本仓库不替原作者授予新权利。查看 `migration-provenance.json` 并保留上游署名。对自己拥有的贡献内容明确声明许可。
