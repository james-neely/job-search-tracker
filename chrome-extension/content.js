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

const TOP_CARD_SELECTORS = [
  ".job-details-jobs-unified-top-card__primary-description-container",
  ".job-details-jobs-unified-top-card__job-insight-view-model-secondary",
  ".job-details-jobs-unified-top-card",
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

function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getElementText(element) {
  const text = element?.innerText?.trim() || element?.textContent?.trim() || "";
  return normalizeText(text);
}

function getHeadingScopedDescription() {
  const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
  const aboutHeading = headings.find((heading) =>
    heading.textContent?.trim().toLowerCase() === "about the job"
  );

  if (!aboutHeading) {
    return "";
  }

  const containerCandidates = [
    aboutHeading.parentElement?.parentElement,
    aboutHeading.parentElement,
    aboutHeading.closest("section"),
    aboutHeading.closest("main"),
  ].filter(Boolean);

  for (const candidate of containerCandidates) {
    if (!(candidate instanceof HTMLElement)) continue;

    const clone = candidate.cloneNode(true);
    if (!(clone instanceof HTMLElement)) continue;

    clone.querySelectorAll("button, script, style, svg").forEach((node) => node.remove());

    const text = getElementText(clone);
    if (!text) continue;

    const normalizedHeading = "About the job";
    if (text.startsWith(normalizedHeading)) {
      const trimmed = text.slice(normalizedHeading.length).trim();
      if (trimmed) {
        return trimmed;
      }
    }

    if (text.toLowerCase().includes("about the job")) {
      const parts = text.split(/about the job/i);
      const trimmed = parts.slice(1).join(" ").trim();
      if (trimmed) {
        return normalizeText(trimmed);
      }
    }
  }

  return "";
}

function getJobDescription() {
  for (const selector of DESCRIPTION_SELECTORS) {
    const element = document.querySelector(selector);
    const text = getElementText(element);
    if (text) {
      return text;
    }
  }

  const headingScopedDescription = getHeadingScopedDescription();
  if (headingScopedDescription) {
    return headingScopedDescription;
  }

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const json = JSON.parse(script.textContent || "");
      const records = Array.isArray(json) ? json : [json];
      for (const record of records) {
        if (record?.["@type"] === "JobPosting" && typeof record.description === "string") {
          const html = document.createElement("div");
          html.innerHTML = record.description;
          const text = getElementText(html);
          if (text) {
            return text;
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }

  return "";
}

function getMetadataLineText() {
  for (const selector of TOP_CARD_SELECTORS) {
    const root = document.querySelector(selector);
    const text = getElementText(root);
    if (text) {
      return text;
    }
  }

  const fallbackParagraphs = Array.from(document.querySelectorAll("p"))
    .map((paragraph) => getElementText(paragraph))
    .filter(Boolean);

  return fallbackParagraphs.find((text) =>
    /applicants|reposted|promoted by hirer|actively reviewing applicants/i.test(text)
  ) || "";
}

function extractLocation(metadataText) {
  const firstSegment = metadataText.split("·").map((part) => part.trim()).find(Boolean) || "";
  return /applicants|reposted|promoted/i.test(firstSegment) ? "" : firstSegment;
}

function extractApplicantsCount(metadataText) {
  const match = metadataText.match(/(\d+)\s+applicants/i);
  return match ? Number(match[1]) : null;
}

function extractRelativePosted(metadataText) {
  const match = metadataText.match(/(reposted\s+.+?|posted\s+.+?)(?:·|$)/i);
  return match ? match[1].trim() : "";
}

function extractTopCardBadges() {
  const badges = Array.from(document.querySelectorAll("a span, button span, div span"))
    .map((node) => getElementText(node))
    .filter(Boolean);

  const unique = Array.from(new Set(badges));
  return {
    easyApply: unique.some((text) => /^easy apply$/i.test(text)),
    remote: unique.some((text) => /^remote$/i.test(text)),
    employmentType:
      unique.find((text) => /^(full-time|part-time|contract|temporary|internship)$/i.test(text)) || "",
    salaryText:
      unique.find((text) => /\$\d[\d,]*(?:k|K)?(?:\/yr|\/hr)?\s*-\s*\$\d/i.test(text)) || "",
  };
}

function parseSalaryRange(salaryText) {
  const match = salaryText.match(/\$([\d,.]+)\s*([kK])?(?:\/yr|\/hr)?\s*-\s*\$([\d,.]+)\s*([kK])?(\/yr|\/hr)?/);
  if (!match) {
    return {
      compensationType: "",
      salaryMin: "",
      salaryMax: "",
    };
  }

  const toNumber = (value, suffix) => {
    const numeric = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(numeric)) return "";
    return String(suffix ? numeric * 1000 : numeric);
  };

  const unit = match[5] || "";
  return {
    compensationType: unit.toLowerCase() === "/hr" ? "hourly" : "salary",
    salaryMin: toNumber(match[1], match[2]),
    salaryMax: toNumber(match[3], match[4]),
  };
}

function splitCityState(location) {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return { city: location, state: "" };
  }

  return {
    city: parts.slice(0, -1).join(", "),
    state: parts[parts.length - 1],
  };
}

function getApplicationUrl() {
  const easyApplyLink = Array.from(document.querySelectorAll('a[href*="/jobs/view/"]'))
    .find((link) => /easy apply/i.test(getElementText(link)));

  return easyApplyLink?.href || getCleanLinkedInUrl();
}

function buildImportedNotes(metadata) {
  const noteLines = [
    metadata.relativePosted ? `LinkedIn posted status: ${metadata.relativePosted}` : "",
    metadata.applicantsCount !== null ? `LinkedIn applicants: ${metadata.applicantsCount}` : "",
    metadata.easyApply ? "LinkedIn apply flow: Easy Apply" : "",
    metadata.remote ? "LinkedIn workplace hint: Remote" : "",
    metadata.promoted ? "LinkedIn promotion: Promoted by hirer" : "",
    metadata.activelyReviewing ? "LinkedIn review status: Actively reviewing applicants" : "",
  ].filter(Boolean);

  return noteLines.join("\n");
}

function getJobData() {
  const supported = window.location.hostname === "www.linkedin.com" &&
    window.location.pathname.startsWith("/jobs/view/");

  if (!supported) {
    return { supported: false };
  }

  const metadataText = getMetadataLineText();
  const location = extractLocation(metadataText);
  const badges = extractTopCardBadges();
  const salary = parseSalaryRange(badges.salaryText);
  const splitLocation = location && !/^remote$/i.test(location) ? splitCityState(location) : { city: "", state: "" };
  const applicantsCount = extractApplicantsCount(metadataText);
  const relativePosted = extractRelativePosted(metadataText);
  const promoted = /promoted by hirer/i.test(metadataText);
  const activelyReviewing = /actively reviewing applicants/i.test(metadataText);

  return {
    supported: true,
    cleanUrl: getCleanLinkedInUrl(),
    jobTitle: getFirstText(TITLE_SELECTORS),
    companyName: getFirstText(COMPANY_SELECTORS),
    jobDescription: getJobDescription(),
    jobApplicationUrl: getApplicationUrl(),
    workplaceType: badges.remote || /^remote$/i.test(location) ? "remote" : location ? "on_site" : "",
    workLocationCity: splitLocation.city,
    workLocationState: splitLocation.state,
    employmentType:
      badges.employmentType.toLowerCase() === "part-time" ? "part_time"
      : badges.employmentType.toLowerCase() === "contract" ? "contract"
      : badges.employmentType ? "full_time"
      : "",
    compensationType: salary.compensationType,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    applicantsCount,
    relativePosted,
    easyApply: badges.easyApply,
    promoted,
    activelyReviewing,
    notes: buildImportedNotes({
      relativePosted,
      applicantsCount,
      easyApply: badges.easyApply,
      remote: badges.remote || /^remote$/i.test(location),
      promoted,
      activelyReviewing,
    }),
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
    jobApplicationUrl: data.jobApplicationUrl || "",
    jobDescription: data.jobDescription || "",
    applicationMedium: "LinkedIn",
    workplaceType: data.workplaceType || "",
    workLocationCity: data.workLocationCity || "",
    workLocationState: data.workLocationState || "",
    employmentType: data.employmentType || "",
    compensationType: data.compensationType || "",
    salaryMin: data.salaryMin || "",
    salaryMax: data.salaryMax || "",
    notes: data.notes || "",
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
