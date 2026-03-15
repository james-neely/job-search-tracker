const DEFAULT_APP_ORIGIN = "http://localhost:3001";
const OVERLAY_ID = "job-search-tracker-companion-overlay";

const DESCRIPTION_SELECTORS = [
  ".jobs-description__container .jobs-box__html-content",
  ".jobs-description__container .jobs-description-content__text",
  ".jobs-description-content .jobs-box__html-content",
  ".jobs-description-content__text",
  ".jobs-box__html-content",
  ".jobs-description__content",
  ".show-more-less-html__markup",
  ".jobs-search__job-details--container",
];

const TITLE_SELECTORS = [
  ".job-details-jobs-unified-top-card__job-title h1",
  ".top-card-layout__title",
  ".job-details-jobs-unified-top-card__job-title",
];

const COMPANY_SELECTORS = [
  ".job-details-jobs-unified-top-card__company-name a",
  ".job-details-jobs-unified-top-card__company-name",
  ".topcard__org-name-link",
  ".topcard__flavor",
];

function encodeImportPayload(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getCleanLinkedInUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getFirstText(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text) return text;
  }
  return "";
}

function getJobDescription() {
  for (const selector of DESCRIPTION_SELECTORS) {
    const element = document.querySelector(selector);
    const text = element?.innerText?.trim();
    if (text) {
      return text.replace(/\n{3,}/g, "\n\n");
    }
  }

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const json = JSON.parse(script.textContent || "");
      const records = Array.isArray(json) ? json : [json];
      for (const record of records) {
        if (record?.["@type"] === "JobPosting" && typeof record.description === "string") {
          const html = document.createElement("div");
          html.innerHTML = record.description;
          const text = html.textContent?.trim();
          if (text) {
            return text.replace(/\n{3,}/g, "\n\n");
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }

  return "";
}

function getJobData() {
  const supported = window.location.hostname === "www.linkedin.com" &&
    window.location.pathname.startsWith("/jobs/view/");

  if (!supported) {
    return { supported: false };
  }

  return {
    supported: true,
    cleanUrl: getCleanLinkedInUrl(),
    jobTitle: getFirstText(TITLE_SELECTORS),
    companyName: getFirstText(COMPANY_SELECTORS),
    jobDescription: getJobDescription(),
  };
}

async function getTargetServerUrl() {
  const stored = await chrome.storage.sync.get(["selectedServerUrl", "settingsOrigin"]);
  return stored.selectedServerUrl || stored.settingsOrigin || DEFAULT_APP_ORIGIN;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function ensureOverlayRoot() {
  let host = document.getElementById(OVERLAY_ID);
  if (host) return host;

  host = document.createElement("div");
  host.id = OVERLAY_ID;
  host.style.position = "fixed";
  host.style.top = "88px";
  host.style.right = "20px";
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .panel {
        width: 220px;
        border-radius: 16px;
        padding: 14px;
        background: rgba(24, 35, 15, 0.95);
        color: #f8f6ef;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.24);
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        display: grid;
        gap: 10px;
      }
      .title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .meta {
        font-size: 12px;
        color: #d2e3c8;
        line-height: 1.45;
      }
      .actions {
        display: grid;
        gap: 8px;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 9px 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .primary {
        background: #d2e3c8;
        color: #18230f;
      }
      .secondary {
        background: #2f4f4f;
        color: #fff;
      }
      .ghost {
        background: transparent;
        color: #d2e3c8;
        border: 1px solid rgba(210, 227, 200, 0.35);
      }
      .feedback {
        min-height: 18px;
        font-size: 12px;
        color: #fff8bf;
      }
    </style>
    <div class="panel">
      <div class="title">Job Capture</div>
      <div class="meta" id="meta">Waiting for job details…</div>
      <div class="actions">
        <button class="primary" id="copy-url">Copy Clean URL</button>
        <button class="secondary" id="copy-description">Copy Job Description</button>
        <button class="ghost" id="open-app">Open in App</button>
        <button class="ghost" id="dismiss">Hide</button>
      </div>
      <div class="feedback" id="feedback"></div>
    </div>
  `;

  return host;
}

function updateOverlay(data) {
  const host = ensureOverlayRoot();
  const shadow = host.shadowRoot;
  const meta = shadow.getElementById("meta");
  meta.textContent = data.supported
    ? `${data.jobTitle || "Untitled role"} at ${data.companyName || "Unknown company"}`
    : "Open a LinkedIn job page to use this companion.";
}

function setOverlayFeedback(message, isError) {
  const host = ensureOverlayRoot();
  const feedback = host.shadowRoot.getElementById("feedback");
  feedback.textContent = message;
  feedback.style.color = isError ? "#ffb4b4" : "#fff8bf";
}

async function openInApp(data) {
  const appOrigin = await getTargetServerUrl();
  const payload = encodeImportPayload({
    source: "LinkedIn Chrome extension",
    companyName: data.companyName || "",
    jobTitle: data.jobTitle || "",
    jobDescriptionUrl: data.cleanUrl || "",
    jobDescription: data.jobDescription || "",
    applicationMedium: "LinkedIn",
  });

  window.open(`${appOrigin.replace(/\/$/, "")}/applications/new#import=${payload}`, "_blank", "noopener,noreferrer");
}

async function wireOverlay() {
  const host = ensureOverlayRoot();
  const shadow = host.shadowRoot;

  shadow.getElementById("copy-url").onclick = async () => {
    const data = getJobData();
    if (!data.supported || !data.cleanUrl) return;
    await copyText(data.cleanUrl);
    setOverlayFeedback("Copied clean URL.", false);
  };

  shadow.getElementById("copy-description").onclick = async () => {
    const data = getJobData();
    if (!data.supported || !data.jobDescription) {
      setOverlayFeedback("No job description found.", true);
      return;
    }
    await copyText(data.jobDescription);
    setOverlayFeedback("Copied job description.", false);
  };

  shadow.getElementById("open-app").onclick = async () => {
    const data = getJobData();
    if (!data.supported) return;
    await openInApp(data);
    setOverlayFeedback("Opened Job Search Tracker.", false);
  };

  shadow.getElementById("dismiss").onclick = () => {
    host.remove();
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "getJobData") {
    sendResponse(getJobData());
  }
});

let lastHref = "";

function refresh() {
  const data = getJobData();
  if (data.supported) {
    updateOverlay(data);
    wireOverlay();
  } else {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
  }
}

refresh();

setInterval(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
    refresh();
  }
}, 1000);
