import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestOptions, onRequestPost } from "../functions/api/waitlist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

// 1. De-identification, sensitive-term, and old-brand-name scan
const forbiddenTerms = [
  "print" + "kk",
  "api_" + "key.txt",
  "candi" + "dates.csv",
  "outreach_" + "db.py",
  "persona_" + "rules_v",
  "creator" + "sift"
];
const files = walkFiles(rootDir);
assert.ok(files.length >= 10, "Expected landing page files to exist");

for (const file of files) {
  const content = fs.readFileSync(file, "utf8").toLowerCase();
  for (const term of forbiddenTerms) {
    assert.equal(
      content.includes(term),
      false,
      `Forbidden term "${term}" found in ${path.relative(rootDir, file)}`
    );
  }
}
console.log("PASS: De-identification & old-brand scan (0 leaks)");

// 2. SEO & HTML integrity check
const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
assert.match(html, /<title>SiftRoster[\s\S]*?<\/title>/);
assert.match(html, /<meta name="description" content="[^"]{50,}"/);
assert.match(html, /<meta property="og:title" content="[^"]+"/);
assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);

const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(ldMatch, "JSON-LD script block missing");
const ldJson = JSON.parse(ldMatch[1]);
assert.ok(Array.isArray(ldJson["@graph"]), "JSON-LD @graph missing");
const types = ldJson["@graph"].map((n) => n["@type"]);
assert.ok(types.includes("Organization"));
assert.ok(types.includes("SoftwareApplication"));
assert.ok(types.includes("FAQPage"));
const faqNode = ldJson["@graph"].find((n) => n["@type"] === "FAQPage");
assert.equal(faqNode.mainEntity.length, 6, "Expected 6 FAQ items in JSON-LD");

for (const price of ["$29", "$79", "$179"]) {
  assert.ok(html.includes(price), `Missing pricing tier ${price}`);
}

const feishuFormUrl = "https://my.feishu.cn/share/base/shrcnoUmhzE1rCBTRPEELe0YQ9f";
assert.ok(html.includes(feishuFormUrl), "Missing Feishu Form Collection URL in index.html");
assert.ok(html.includes('id="feishu-waitlist-iframe"'), "Missing Feishu iframe embed in index.html");
const appJs = fs.readFileSync(path.join(rootDir, "assets/app.js"), "utf8");
assert.ok(appJs.includes(feishuFormUrl), "Missing Feishu Form Collection URL in assets/app.js");

console.log("PASS: SEO metadata, JSON-LD schema, pricing tiers, and Feishu Form embed verified");

// 3. Waitlist Cloudflare Function unit tests
const originalFetch = globalThis.fetch;

try {
  // 3a. CORS OPTIONS
  {
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "OPTIONS",
      headers: { Origin: "https://silennsong.github.io" }
    });
    const res = await onRequestOptions({ request: req, env: {} });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    assert.match(res.headers.get("Access-Control-Allow-Methods"), /POST/);
  }

  // 3b. Invalid email -> 400
  {
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", needs: "Need YouTube creators" })
    });
    const res = await onRequestPost({ request: req, env: { FEISHU_WEBHOOK_URL: "https://example.com/hook" } });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
  }

  // 3c. Short needs -> 400
  {
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@agency.com", needs: "hi" })
    });
    const res = await onRequestPost({ request: req, env: { FEISHU_WEBHOOK_URL: "https://example.com/hook" } });
    assert.equal(res.status, 400);
  }

  // 3d. Honeypot spam drop -> 200 without fetch
  {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response("{}");
    };
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bot@spam.com", needs: "spam message", website_hp: "http://spam.link" })
    });
    const res = await onRequestPost({ request: req, env: { FEISHU_WEBHOOK_URL: "https://example.com/hook" } });
    assert.equal(res.status, 200);
    assert.equal(fetchCalled, false, "Honeypot submission should not forward to Feishu");
  }

  // 3e. Unconfigured env -> 503
  {
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@agency.com", needs: "Looking for 50 craft YouTubers per month." })
    });
    const res = await onRequestPost({ request: req, env: {} });
    assert.equal(res.status, 503);
  }

  // 3f. Mode A: Feishu Webhook success -> 200
  {
    let capturedUrl = "";
    let capturedPayload = null;
    globalThis.fetch = async (url, init) => {
      capturedUrl = url;
      capturedPayload = JSON.parse(init.body);
      return new Response(JSON.stringify({ code: 0, msg: "success" }), { status: 200 });
    };
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "Alex@Agency.COM ",
        name: "Alex Rivera",
        role: "Boutique / Solo Agency",
        platforms: "Both YouTube & TikTok",
        monthly_volume: "50 - 200 creators/mo",
        preferred_plan: "Boutique Agency ($79/mo Early Bird)",
        needs: "Sourcing home-decor YouTubers for 3 DTC clients.",
        source_url: "https://silennsong.github.io/siftroster-landing/"
      })
    });
    const res = await onRequestPost({
      request: req,
      env: { FEISHU_WEBHOOK_URL: "https://www.feishu.cn/flow/api/trigger-webhook/test123" }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(capturedUrl, "https://www.feishu.cn/flow/api/trigger-webhook/test123");
    assert.equal(capturedPayload.email, "alex@agency.com");
    assert.equal(capturedPayload.preferred_plan, "Boutique Agency ($79/mo Early Bird)");
    assert.equal(capturedPayload.source_url, "https://silennsong.github.io/siftroster-landing/");
  }

  // 3g. Mode B: Feishu Open API Bitable insert -> 200
  {
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
      if (url.includes("tenant_access_token")) {
        return new Response(JSON.stringify({ code: 0, tenant_access_token: "t-token-123" }), { status: 200 });
      }
      return new Response(JSON.stringify({ code: 0, data: { record: { record_id: "rec123" } } }), { status: 200 });
    };
    const req = new Request("https://siftroster.pages.dev/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "founder@brand.co",
        name: "Brand Co",
        role: "SMB / DTC Brand",
        platforms: "YouTube Primarily",
        monthly_volume: "Under 50 creators/mo",
        preferred_plan: "Solo / Brand ($29/mo Early Bird)",
        needs: "Need micro YouTubers doing unboxing tutorials."
      })
    });
    const res = await onRequestPost({
      request: req,
      env: {
        FEISHU_APP_ID: "cli_123",
        FEISHU_APP_SECRET: "sec_456",
        FEISHU_APP_TOKEN: "app_789",
        FEISHU_TABLE_ID: "tbl_abc"
      }
    });
    assert.equal(res.status, 200);
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, /\/apps\/app_789\/tables\/tbl_abc\/records$/);
    assert.equal(calls[1].headers.Authorization, "Bearer t-token-123");
    assert.equal(calls[1].body.fields.Email, "founder@brand.co");
  }

  console.log("PASS: Cloudflare Pages /api/waitlist unit tests (CORS, validation, honeypot, Mode A & Mode B)");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("ALL CHECKS PASSED");
