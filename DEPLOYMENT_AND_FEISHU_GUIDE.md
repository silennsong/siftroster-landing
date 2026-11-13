# CreatorSift 英文 SEO 落地页：飞书多维表格 + Cloudflare Pages + GitHub Pages 部署指南

> 本目录（`creatorsift-landing`）与内部主项目完全物理隔离，**不含任何内部代码、API Key 或联系人数据**，可安全部署为公开的英文 SEO 落地页。

---

## 第一步：1 分钟配置飞书多维表格（Feishu Base）接收 Waitlist

推荐采用**方式 A（自动化 Webhook，无需写应用权限）**，步骤如下：

1. 在飞书新建一个**多维表格**（例如命名为 `CreatorSift Waitlist`），建议建以下列（均为文本或单选列）：
   - `Email`（邮箱）
   - `Name`（姓名/公司）
   - `Role`（身份角色）
   - `Platforms`（目标平台）
   - `Monthly_Volume`（月需红人量）
   - `Preferred_Plan`（意向订阅档位）
   - `Needs`（当前痛点与需求）
   - `Source_URL`（来源页面 URL，可区分是 Cloudflare 还是 GitHub 流量）
   - `Submitted_At`（提交时间）

2. 点击多维表格右上角 **「自动化」→「创建自动化流程」**：
   - **触发条件**：选择 **「当收到 Webhook 请求时」**，复制生成的 Webhook 地址（形如 `https://www.feishu.cn/flow/api/trigger-webhook/xxxxxx`）。
   - 先用一条测试 JSON 触发一次或直接粘贴结构体定义字段：
     ```json
     {
       "email": "test@agency.com",
       "name": "Alex",
       "role": "Boutique / Solo Agency",
       "platforms": "Both YouTube & TikTok",
       "monthly_volume": "50 - 200 creators/mo",
       "preferred_plan": "Boutique Agency ($79/mo Early Bird)",
       "needs": "Looking for home decor creators on YouTube",
       "source_url": "https://creatorsift.pages.dev/",
       "submitted_at": "2026-11-13T10:00:00.000Z"
     }
     ```
   - **执行操作**：选择 **「新增记录」**，将 Webhook 参数里的 9 个字段一一映射到上方表格列中，保存并开启流程。

> 备用方式 B（飞书开放平台 Bitable API）：如果你更习惯使用自建应用 App ID/Secret，也可以在 Cloudflare Pages 环境变量中改为配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_APP_TOKEN`、`FEISHU_TABLE_ID`（如用国际版 Lark，可额外设置 `FEISHU_API_BASE=https://open.larksuite.com`）。

---

## 第二步：推送到独立的 GitHub 仓库并开启 GitHub Pages

在 PowerShell 中运行本目录下的脚本（已确认本机 `gh` CLI 已登录账号 `silennsong`）：

```powershell
cd "C:\Users\16358\Downloads\vibe vibe\creatorsift-landing"
.\publish_github.ps1 -RepoName "creatorsift-landing" -Visibility public
```

脚本会自动完成：
1. 在 GitHub 创建独立仓库 `creatorsift-landing`（仅含落地页，绝不包含原项目）。
2. 推送 `main` 分支，自动触发 `.github/workflows/deploy-pages.yml`。
3. 开启 GitHub Pages（使用 GitHub Actions 构建，自动隔离 `functions/` 和脚本，仅发布静态网页）。

完成后你的 GitHub 页面地址为：`https://silennsong.github.io/creatorsift-landing/`

---

## 第三步：部署到 Cloudflare Pages 并打通 Waitlist 接口

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选择刚才创建的 `creatorsift-landing` 仓库：
   - **Production branch**: `main`
   - **Build command**: 留空（纯静态 + Pages Functions，无需构建）
   - **Build output directory**: `/`（或 `.`）
3. 部署后进入 **Settings → Environment variables（环境变量）**，添加：
   - 变量名：`FEISHU_WEBHOOK_URL`
   - 变量值：第一步复制的飞书多维表格 Webhook 地址
   - （建议 Production 和 Preview 都配置，保存后点击 **Retry deployment** 让变量生效）
4. Cloudflare 会自动把 `functions/api/waitlist.js` 挂载为 `https://<你的项目名>.pages.dev/api/waitlist`。

---

## 第四步：让 GitHub Pages 页面也写入同一个飞书表格

GitHub Pages 是纯静态托管，没有服务端函数。为了让 **GitHub Pages** 和 **Cloudflare Pages** 的访客提交 Waitlist 后都能进入同一个飞书多维表格：

1. 记下 Cloudflare Pages 分配给你的域名（例如 `https://creatorsift-landing.pages.dev`）。
2. 打开 `assets/app.js` 顶部，将 `apiEndpoint` 改为 Cloudflare 的完整接口地址：
   ```js
   window.CREATORSIFT_CONFIG = window.CREATORSIFT_CONFIG || {
     apiEndpoint: "https://creatorsift-landing.pages.dev/api/waitlist"
   };
   ```
3. 同时建议把 `robots.txt` 和 `sitemap.xml` 里的域名更新为你最终用于 SEO 主收录的域名（Cloudflare 页面或自定义域名），然后 `git add . && git commit -m "chore: link Cloudflare waitlist endpoint" && git push` 即可两边同时生效！

---

## 本地或上线验证建议

- 在 Cloudflare 页面打开网页，填写测试邮箱与需求并点击 **Join Founding Waitlist**，确认飞书多维表格立即新增一行，且 `Source_URL` 显示提交来源。
- 在 GitHub Pages 页面同样提交一条测试记录，确认跨域（CORS）请求正常写入同一个飞书多维表格。
