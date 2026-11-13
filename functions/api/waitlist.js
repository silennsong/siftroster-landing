const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCorsHeaders(env, request) {
  const allowedOrigin = (env && env.ALLOWED_ORIGIN) || "*";
  const reqOrigin = request && request.headers ? request.headers.get("Origin") : null;
  const origin =
    allowedOrigin === "*"
      ? "*"
      : allowedOrigin
          .split(",")
          .map((s) => s.trim())
          .includes(reqOrigin)
        ? reqOrigin
        : allowedOrigin.split(",")[0].trim();

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

function clampString(val, maxLen) {
  return String(val || "").trim().slice(0, maxLen);
}

async function sendToFeishuWebhook(webhookUrl, record) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Feishu webhook error (${res.status}): ${errText.slice(0, 200)}`);
  }

  // Some Feishu webhook endpoints return HTTP 200 with { code: <non-zero> }
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.code === "number" && parsed.code !== 0) {
        throw new Error(`Feishu webhook returned code ${parsed.code}: ${parsed.msg || "unknown"}`);
      }
    } catch (e) {
      if (e.message && e.message.startsWith("Feishu webhook returned code")) {
        throw e;
      }
    }
  }
}

async function sendToFeishuBitableApi(env, record) {
  const apiBase = (env.FEISHU_API_BASE || "https://open.feishu.cn").replace(/\/+$/, "");

  const tokenRes = await fetch(`${apiBase}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET
    })
  });

  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || tokenData.code !== 0 || !tokenData.tenant_access_token) {
    throw new Error(`Feishu auth failed: ${tokenData.msg || tokenRes.status}`);
  }

  const fields = {
    Email: record.email,
    Name: record.name,
    Role: record.role,
    Platforms: record.platforms,
    Monthly_Volume: record.monthly_volume,
    Preferred_Plan: record.preferred_plan,
    Needs: record.needs,
    Source_URL: record.source_url,
    Submitted_At: record.submitted_at
  };

  const insertRes = await fetch(
    `${apiBase}/open-apis/bitable/v1/apps/${encodeURIComponent(env.FEISHU_APP_TOKEN)}/tables/${encodeURIComponent(env.FEISHU_TABLE_ID)}/records`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.tenant_access_token}`
      },
      body: JSON.stringify({ fields })
    }
  );

  const insertData = await insertRes.json().catch(() => ({}));
  if (!insertRes.ok || insertData.code !== 0) {
    throw new Error(`Feishu Bitable insert failed: ${insertData.msg || insertRes.status}`);
  }
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(env, request)
  });
}

export async function onRequestPost({ request, env }) {
  const cors = getCorsHeaders(env, request);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON payload." }, 400, cors);
  }

  if (!body || typeof body !== "object") {
    return jsonResponse({ ok: false, error: "Request body must be a JSON object." }, 400, cors);
  }

  // Honeypot spam filter: silently succeed without forwarding to Feishu
  if (clampString(body.website_hp, 100) !== "") {
    return jsonResponse(
      { ok: true, message: "You're on the Founding Member Waitlist!" },
      200,
      cors
    );
  }

  const email = clampString(body.email, 254).toLowerCase();
  const needs = clampString(body.needs, 2000);

  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ ok: false, error: "Please provide a valid work email address." }, 400, cors);
  }

  if (needs.length < 8) {
    return jsonResponse(
      { ok: false, error: "Please briefly describe your creator sourcing needs (at least 8 characters)." },
      400,
      cors
    );
  }

  const record = {
    email,
    name: clampString(body.name, 120),
    role: clampString(body.role, 120),
    platforms: clampString(body.platforms, 120),
    monthly_volume: clampString(body.monthly_volume, 120),
    preferred_plan: clampString(body.preferred_plan, 120),
    needs,
    source_url: clampString(body.source_url, 500),
    submitted_at: clampString(body.submitted_at, 64) || new Date().toISOString()
  };

  try {
    if (env && env.FEISHU_WEBHOOK_URL) {
      await sendToFeishuWebhook(env.FEISHU_WEBHOOK_URL, record);
    } else if (
      env &&
      env.FEISHU_APP_ID &&
      env.FEISHU_APP_SECRET &&
      env.FEISHU_APP_TOKEN &&
      env.FEISHU_TABLE_ID
    ) {
      await sendToFeishuBitableApi(env, record);
    } else {
      return jsonResponse(
        { ok: false, error: "Waitlist destination is not configured yet on the server." },
        503,
        cors
      );
    }
  } catch (err) {
    return jsonResponse(
      { ok: false, error: "Could not record your submission right now. Please try again shortly." },
      502,
      cors
    );
  }

  return jsonResponse(
    {
      ok: true,
      message: "You're on the Founding Member Waitlist! We've logged your workflow needs and reserved your 40% early-bird rate."
    },
    200,
    cors
  );
}
