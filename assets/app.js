/**
 * SiftRoster Landing Page Configuration
 *
 * Waitlist submissions go directly to the public Feishu Base Form Collection Page,
 * so both GitHub Pages and Cloudflare Pages work identically with zero backend config.
 */
window.SIFTROSTER_CONFIG = window.SIFTROSTER_CONFIG || {
  feishuFormUrl: "https://my.feishu.cn/share/base/shrcnoUmhzE1rCBTRPEELe0YQ9f",
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

  const AGENT_PROMPTS = {
    pod: '"Find 40 active YouTube & TikTok POD creators (>10K median views), score persona fit & stage 1-to-1 drafts"',
    saas: '"Run SaaS workflow creator discovery via MCP, filter Shorts-only noise & queue High-confidence emails for approval"',
    home: '"Source 30 home & craft creators with active sponsor history, exclude 60+ day inactive channels & prep human review batch"'
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
    const cmdText = document.getElementById("agent-cmd-text");
    if (cmdText && AGENT_PROMPTS[key]) {
      cmdText.textContent = AGENT_PROMPTS[key];
    }
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
    const banner = document.getElementById("selected-plan-banner");
    const buttons = document.querySelectorAll(".select-plan");
    if (!banner || !buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = btn.dataset.plan;
        if (chosen) {
          banner.hidden = false;
          banner.textContent = `Selected plan: ${chosen} — pick this option in the "Preferred Founding Member Plan" question below.`;
        }
      });
    });
  }

  function initFeishuForm() {
    const url =
      (window.SIFTROSTER_CONFIG && window.SIFTROSTER_CONFIG.feishuFormUrl) ||
      "https://my.feishu.cn/share/base/shrcnoUmhzE1rCBTRPEELe0YQ9f";
    const iframe = document.getElementById("feishu-waitlist-iframe");
    const openBtn = document.getElementById("feishu-open-btn");
    if (iframe && iframe.src !== url) {
      iframe.src = url;
    }
    if (openBtn && openBtn.href !== url) {
      openBtn.href = url;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initPreviewTabs();
    initRoiCalculator();
    initPlanSelection();
    initFeishuForm();
  });
})();
