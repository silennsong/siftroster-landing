/**
 * SiftRoster Landing Page Configuration
 *
 * When deployed on Cloudflare Pages, `/api/waitlist` works automatically.
 * When deployed on GitHub Pages (static hosting), set `apiEndpoint` below
 * to your deployed Cloudflare Pages URL, e.g.:
 *   "https://siftroster.pages.dev/api/waitlist"
 * so both GitHub Pages and Cloudflare Pages write into the exact same Feishu Base table.
 */
window.SIFTROSTER_CONFIG = window.SIFTROSTER_CONFIG || {
  apiEndpoint: "/api/waitlist"
};

(function () {
  "use strict";

  const SAMPLES = {
    pod: [
      {
        platform: "YouTube",
        platformClass: "yt",
        name: "Studio Craft & Merch Lab",
        handle: "@studiocraftlab · 68.4K subs",
        score: "94% Fit",
        scoreClass: "high",
        rationale: "Publishes weekly tutorial reviews comparing supplier quality & margins; affiliate links present in 4 of last 6 uploads; median 14.2K views (active 4 days ago).",
        email: "High Confidence: collab@studiocraftlab.com (Channel + Linktree match)",
        draft: "Draft Ready"
      },
      {
        platform: "TikTok",
        platformClass: "tt",
        name: "Maya Designs Co",
        handle: "@mayadesignsco · 41.2K followers",
        score: "89% Fit",
        scoreClass: "high",
        rationale: "Original art merchandise workflow videos; 8 non-pinned recent clips averaging 6,800 views; zero agency conflict detected.",
        email: "High Confidence: maya@mayadesignsco.studio (Bio literal match)",
        draft: "Draft Ready"
      },
      {
        platform: "YouTube",
        platformClass: "yt",
        name: "MegaWholesale Machinery",
        handle: "@megawholesale · 120K subs",
        score: "Rejected · Gate 1",
        scoreClass: "rejected",
        rationale: "Rule Engine: Excluded automatically — B2B industrial equipment reseller, not an independent creator fit. Saved 4 mins of manual review.",
        muted: true
      }
    ],
    saas: [
      {
        platform: "YouTube",
        platformClass: "yt",
        name: "OpsFlow Automations",
        handle: "@opsflow · 34.8K subs",
        score: "92% Fit",
        scoreClass: "high",
        rationale: "Creates deep-dive workflow tutorials for Notion, Zapier, and lean agency ops; 90% English audience; high comment intent asking for tool stack links.",
        email: "High Confidence: partnerships@opsflow.io (About page + description match)",
        draft: "Draft Ready"
      },
      {
        platform: "TikTok",
        platformClass: "tt",
        name: "SamBuildsSystems",
        handle: "@sambuildssystems · 28.5K followers",
        score: "87% Fit",
        scoreClass: "high",
        rationale: "Short-form productivity breakdowns for agency owners; median 9.4K views across last 10 non-pinned videos; actively accepts SaaS sponsorships.",
        email: "Medium Confidence: sam@sambuilds.co (Bio link domain match)",
        draft: "Draft Ready"
      },
      {
        platform: "YouTube",
        platformClass: "yt",
        name: "Daily AI News Clips",
        handle: "@dailyainewsclips · 210K subs",
        score: "Rejected · Gate 2",
        scoreClass: "rejected",
        rationale: "AI Persona Vetting: Faceless news aggregator with Shorts-only spikes; low software adoption authority for B2B SaaS tutorials.",
        muted: true
      }
    ],
    home: [
      {
        platform: "YouTube",
        platformClass: "yt",
        name: "Warm Hearth Studio",
        handle: "@warmhearthstudio · 52.1K subs",
        score: "95% Fit",
        scoreClass: "high",
        rationale: "Long-form cozy apartment makeovers and DIY textile decor; consistent 18K median views; previous sponsor links show strong DTC conversion fit.",
        email: "High Confidence: hello@warmhearthstudio.com (Verified bio + video footer)",
        draft: "Draft Ready"
      },
      {
        platform: "TikTok",
        platformClass: "tt",
        name: "Clay & Linen Journal",
        handle: "@clayandlinen · 19.7K followers",
        score: "88% Fit",
        scoreClass: "high",
        rationale: "Tableware styling & handmade craft stories; uploaded 3 days ago; clean studio aesthetic aligned with mid-ticket home goods.",
        email: "High Confidence: bookings@clayandlinen.com (Bio literal match)",
        draft: "Draft Ready"
      },
      {
        platform: "TikTok",
        platformClass: "tt",
        name: "Inactive Craft Archive",
        handle: "@craftarchive99 · 84K followers",
        score: "Rejected · Gate 1",
        scoreClass: "rejected",
        rationale: "Rule Engine: Last upload 118 days ago (exceeds 60-day recency threshold). Filtered out before AI scoring.",
        muted: true
      }
    ]
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderPreview(key) {
    const container = document.getElementById("preview-cards");
    if (!container || !SAMPLES[key]) return;

    container.innerHTML = SAMPLES[key]
      .map((item) => {
        const footerHtml = item.muted
          ? ""
          : `<div class="creator-foot">
               <span class="email-badge verified">${escapeHtml(item.email)}</span>
               <span class="draft-status">${escapeHtml(item.draft)}</span>
             </div>`;
        return `
          <div class="creator-card ${item.muted ? "muted" : ""}">
            <div class="creator-head">
              <div>
                <span class="platform-tag ${escapeHtml(item.platformClass)}">${escapeHtml(item.platform)}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <span class="handle">${escapeHtml(item.handle)}</span>
              </div>
              <span class="fit-score ${escapeHtml(item.scoreClass)}">${escapeHtml(item.score)}</span>
            </div>
            <p class="evidence-line">
              <strong>${item.muted ? "Filtered:" : "AI Rationale:"}</strong> ${escapeHtml(item.rationale)}
            </p>
            ${footerHtml}
          </div>
        `;
      })
      .join("");
  }

  function initPreviewTabs() {
    const tabs = document.querySelectorAll(".preview-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        renderPreview(tab.dataset.sample);
      });
    });
  }

  function initRoiCalculator() {
    const campaignsEl = document.getElementById("campaigns-range");
    const creatorsEl = document.getElementById("creators-range");
    const rateEl = document.getElementById("rate-range");
    if (!campaignsEl || !creatorsEl || !rateEl) return;

    const campaignsVal = document.getElementById("campaigns-val");
    const creatorsVal = document.getElementById("creators-val");
    const rateVal = document.getElementById("rate-val");
    const roiDollars = document.getElementById("roi-dollars");
    const roiNet = document.getElementById("roi-net");
    const roiHours = document.getElementById("roi-hours");
    const roiCsHours = document.getElementById("roi-cs-hours");

    function update() {
      const campaigns = Number(campaignsEl.value);
      const creators = Number(creatorsEl.value);
      const rate = Number(rateEl.value);

      const totalMatched = campaigns * creators;
      // ~32 minutes manual research/vetting/email hunting per matched creator vs ~1.2 min human review in SiftRoster
      const manualHours = (totalMatched * 32) / 60;
      const csHours = (totalMatched * 1.2) / 60;
      const savedHours = Math.max(0, manualHours - csHours);
      const savedDollars = Math.round(savedHours * rate);
      const netSavings = savedDollars - 79;

      campaignsVal.textContent = `${campaigns} ${campaigns === 1 ? "campaign" : "campaigns"}`;
      creatorsVal.textContent = `${creators} creators`;
      rateVal.textContent = `$${rate} / hr`;
      roiDollars.textContent = `$${savedDollars.toLocaleString("en-US")}`;
      roiHours.textContent = `${savedHours.toFixed(1)} hrs/mo`;
      roiCsHours.textContent = `${csHours.toFixed(1)} hrs/mo`;
      roiNet.textContent =
        netSavings >= 0
          ? `Net savings after $79/mo Boutique Agency plan: $${netSavings.toLocaleString("en-US")}/mo`
          : `Compared against $29/mo Solo plan: $${(savedDollars - 29).toLocaleString("en-US")}/mo net`;
    }

    [campaignsEl, creatorsEl, rateEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function initPlanSelection() {
    const planSelect = document.getElementById("wl-plan");
    const buttons = document.querySelectorAll(".select-plan");
    if (!planSelect || !buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = btn.dataset.plan;
        if (chosen) {
          planSelect.value = chosen;
        }
      });
    });
  }

  function resolveApiEndpoint() {
    const configured = (window.SIFTROSTER_CONFIG && window.SIFTROSTER_CONFIG.apiEndpoint) || "/api/waitlist";
    return configured.trim();
  }

  function initWaitlistForm() {
    const form = document.getElementById("waitlist-form");
    const feedback = document.getElementById("form-feedback");
    const submitBtn = document.getElementById("wl-submit");
    if (!form || !feedback || !submitBtn) return;

    function showFeedback(type, message) {
      feedback.hidden = false;
      feedback.className = `form-feedback ${type}`;
      feedback.textContent = message;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      feedback.hidden = true;

      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const needs = String(formData.get("needs") || "").trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFeedback("error", "Please enter a valid work email address.");
        document.getElementById("wl-email").focus();
        return;
      }

      if (needs.length < 8) {
        showFeedback("error", "Please share a quick note on your creator niche or current bottleneck.");
        document.getElementById("wl-needs").focus();
        return;
      }

      const payload = {
        email,
        name: String(formData.get("name") || "").trim(),
        role: String(formData.get("role") || "").trim(),
        platforms: String(formData.get("platforms") || "").trim(),
        monthly_volume: String(formData.get("monthly_volume") || "").trim(),
        preferred_plan: String(formData.get("preferred_plan") || "").trim(),
        needs,
        website_hp: String(formData.get("website_hp") || "").trim(),
        source_url: window.location.href,
        submitted_at: new Date().toISOString()
      };

      const endpoint = resolveApiEndpoint();
      const origLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        let data = {};
        try {
          data = await response.json();
        } catch (_) {
          data = {};
        }

        if (!response.ok || data.ok === false) {
          throw new Error(data.error || `Request failed (${response.status})`);
        }

        form.reset();
        showFeedback(
          "success",
          data.message || "You're on the Founding Member Waitlist! We've logged your workflow needs and reserved your 40% early-bird rate."
        );
      } catch (err) {
        const isStaticNoBackend =
          window.location.hostname.endsWith("github.io") && endpoint.startsWith("/");
        if (isStaticNoBackend) {
          showFeedback(
            "error",
            "Waitlist API endpoint is not linked yet on this GitHub Pages mirror. Set SIFTROSTER_CONFIG.apiEndpoint in assets/app.js to your Cloudflare Pages /api/waitlist URL."
          );
        } else {
          showFeedback(
            "error",
            err.message || "Unable to submit right now. Please try again in a moment."
          );
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origLabel;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPreviewTabs();
    initRoiCalculator();
    initPlanSelection();
    initWaitlistForm();
  });
})();
