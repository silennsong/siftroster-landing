# SiftRoster 英文 SEO 落地页：飞书表单收集 + Cloudflare Pages + GitHub Pages 部署指南

> 本目录（`siftroster-landing`）与内部主项目完全物理隔离，**不含任何内部代码、API Key 或联系人数据**，可安全部署为公开的英文 SEO 落地页。

---

## 一、飞书多维表格与表单收集页（已自动建好并生效）

- **多维表格后台**：https://my.feishu.cn/base/WqcBbVlMga6qoTsn8RGc81p6nbe
- **数据表**：`Waitlist Submissions`（Table ID：`tbliP1HDXKqEcU5F`）
- **公开收集表单（已内嵌到落地页 + 支持新标签打开）**：https://my.feishu.cn/share/base/shrcnoUmhzE1rCBTRPEELe0YQ9f
- **已配置好 7 个英文收集问题**：
  1. `Work Email`（必填）
  2. `Your Name / Agency or Brand`
  3. `Who are you sourcing creators for?`（单选，必填）
  4. `Primary Creator Platforms`（单选，必填）
  5. `Monthly Creators Needed`（单选，必填）
  6. `Preferred Founding Member Plan`（单选）
  7. `Current Creator Matching Needs & Biggest Bottleneck`（必填）
- **自动记录字段**：`Created_At`（提交时间自动记录）、`Status`（默认 `New`，含 `New / Contacted / Onboarded`）。

> 由于免费版飞书不含自动化 Webhook 触发器，落地页现已直接内嵌并关联上述官方飞书表单收集页，**零接口费用、无需任何 Webhook 或环境变量**，所有提交都会直接进入您的飞书多维表格。

---

## 二、GitHub Pages（已推送并自动部署）

- **GitHub 仓库**：`https://github.com/silennsong/siftroster-landing`
- **GitHub Pages 地址**：`https://silennsong.github.io/siftroster-landing/`
- 每次推送 `main` 分支，`.github/workflows/deploy-pages.yml` 会自动将纯静态 SEO 页面部署到 GitHub Pages。

---

## 三、Cloudflare Pages 部署步骤（无需填环境变量）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选择 `silennsong/siftroster-landing` 仓库：
   - **Production branch**: `main`
   - **Build command**: 留空
   - **Build output directory**: `/`（或 `.`）
3. **Environment variables（环境变量）**：**留空无需填写**，直接点击 **Save and Deploy**！
4. 部署完成后即获得 `https://<你的项目名>.pages.dev`（如需要把 Cloudflare 域名绑定为自定义域名，也可在 Cloudflare Pages 的 Custom domains 中添加，并同步更新 `robots.txt` 和 `sitemap.xml`）。
