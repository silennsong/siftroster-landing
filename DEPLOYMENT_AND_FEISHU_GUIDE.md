# SiftRoster 英文 SEO 落地页：飞书多维表格 + Cloudflare Pages + GitHub Pages 部署指南

> 本目录（`siftroster-landing`）与内部主项目完全物理隔离，**不含任何内部代码、API Key 或联系人数据**，可安全部署为公开的英文 SEO 落地页。

---

## 第一步：打开已建好的飞书多维表格并复制 Webhook 地址（30 秒）

系统已自动为您在飞书创建好 **SiftRoster Waitlist** 多维表格、全部 10 个字段、1 条验证记录，以及公开表单视图：

- **多维表格地址**：https://my.feishu.cn/base/WqcBbVlMga6qoTsn8RGc81p6nbe
- **App Token (`FEISHU_APP_TOKEN`)**：`WqcBbVlMga6qoTsn8RGc81p6nbe`
- **数据表 (`Waitlist Submissions`) Table ID**：`tbliP1HDXKqEcU5F`
- **公开表单视图链接（备用）**：https://my.feishu.cn/share/base/shrcnoUmhzE1rCBTRPEELe0YQ9f

### 获取 Webhook 地址（方式 A，推荐）

1. 打开多维表格：https://my.feishu.cn/base/WqcBbVlMga6qoTsn8RGc81p6nbe
2. 点击右上角 **「自动化」→「创建自动化流程」**：
   - **触发条件**：选择 **「当收到 Webhook 请求时」**，复制生成的 Webhook 地址（`FEISHU_WEBHOOK_URL`）。
   - 用下方测试 JSON 触发一次或粘贴结构体定义字段：
     ```json
     {
       "email": "test@agency.com",
       "name": "Alex",
       "role": "Boutique / Solo Agency",
       "platforms": "Both YouTube & TikTok",
       "monthly_volume": "50 - 200 creators/mo",
       "preferred_plan": "Boutique Agency ($79/mo Early Bird)",
       "needs": "Looking for home decor creators on YouTube",
       "source_url": "https://siftroster.pages.dev/",
       "submitted_at": "2026-11-13T10:00:00.000Z"
     }
     ```
   - **执行操作**：选择 **「新增记录」**（目标表 `Waitlist Submissions`），将 Webhook 里的 9 个字段对应到表格里的 `Email`、`Name`、`Role`、`Platforms`、`Monthly_Volume`、`Preferred_Plan`、`Needs`、`Source_URL`、`Submitted_At`（`Status` 会自动默认为 `New`），保存并开启流程。

> 备用方式 B（飞书开放平台 Bitable API）：如果你不建自动化 Webhook，也可以直接在 Cloudflare Pages 环境变量中配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_APP_TOKEN=WqcBbVlMga6qoTsn8RGc81p6nbe`、`FEISHU_TABLE_ID=tbliP1HDXKqEcU5F`（请确保该应用已开通 `bitable:app` 权限并被添加为该多维表格协作者）。

---

## 第二步：推送到独立的 GitHub 仓库并开启 GitHub Pages

在 PowerShell 中运行本目录下的脚本（或由 AI 助手代为执行）：

```powershell
cd "C:\Users\16358\Downloads\vibe vibe\siftroster-landing"
.\publish_github.ps1 -RepoName "siftroster-landing" -Visibility public
```

脚本会自动完成：
1. 在 GitHub 创建独立仓库 `siftroster-landing`（仅含落地页，绝不包含原项目）。
2. 推送 `main` 分支，自动触发 `.github/workflows/deploy-pages.yml`。
3. 开启 GitHub Pages（仅发布静态网页，自动隔离 `functions/` 和脚本）。

完成后你的 GitHub 页面地址为：`https://silennsong.github.io/siftroster-landing/`

---

## 第三步：部署到 Cloudflare Pages 并填入 `FEISHU_WEBHOOK_URL`

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选择 `siftroster-landing` 仓库：
   - **Production branch**: `main`
   - **Build command**: 留空
   - **Build output directory**: `/`（或 `.`）
3. 进入 **Settings → Environment variables（环境变量）**，添加：
   - 变量名：`FEISHU_WEBHOOK_URL`
   - 变量值：第一步从飞书多维表格「自动化」复制的 Webhook 地址
   - 保存后点击 **Retry deployment** 让环境变量生效。
4. Cloudflare 会自动把 `functions/api/waitlist.js` 挂载为 `https://<你的项目名>.pages.dev/api/waitlist`。

---

## 第四步：让 GitHub Pages 页面也写入同一个飞书表格

1. 拿到 Cloudflare Pages 的域名（例如 `https://siftroster-landing.pages.dev`）。
2. 打开 `assets/app.js` 顶部，将 `apiEndpoint` 改为 Cloudflare 的完整接口地址：
   ```js
   window.SIFTROSTER_CONFIG = window.SIFTROSTER_CONFIG || {
     apiEndpoint: "https://siftroster-landing.pages.dev/api/waitlist"
   };
   ```
3. 同步更新 `robots.txt` 和 `sitemap.xml` 里的域名后提交推送，GitHub Pages 与 Cloudflare Pages 即可同时写入同一张飞书多维表格！
