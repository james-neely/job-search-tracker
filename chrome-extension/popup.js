const DEFAULT_APP_ORIGIN = "http://localhost:3001";

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

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function sendToActiveTab(type) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }

  return chrome.tabs.sendMessage(tab.id, { type });
}

async function getStoredConfig() {
  const stored = await chrome.storage.sync.get([
    "settingsOrigin",
    "selectedServerUrl",
    "companionServers",
  ]);

  return {
    settingsOrigin: stored.settingsOrigin || DEFAULT_APP_ORIGIN,
    selectedServerUrl: stored.selectedServerUrl || "",
    companionServers: Array.isArray(stored.companionServers) ? stored.companionServers : [],
  };
}

function setFeedback(message, isError) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.classList.remove("hidden");
  feedback.style.background = isError ? "#8a1c1c" : "#18230f";
}

function setPageState(data) {
  const status = document.getElementById("page-status");
  const meta = document.getElementById("job-meta");
  const title = document.getElementById("job-title");
  const company = document.getElementById("job-company");
  const actionIds = ["copy-clean-url", "copy-description", "open-app"];

  if (!data?.supported) {
    status.textContent = "Open a LinkedIn job page to use these actions.";
    meta.classList.add("hidden");
    actionIds.forEach((id) => {
      document.getElementById(id).disabled = true;
    });
    return;
  }

  status.textContent = "LinkedIn job page detected.";
  title.textContent = data.jobTitle || "Untitled role";
  company.textContent = data.companyName || "Unknown company";
  meta.classList.remove("hidden");
  actionIds.forEach((id) => {
    document.getElementById(id).disabled = false;
  });
}

function renderServerOptions(servers, selectedServerUrl) {
  const serverSelect = document.getElementById("server-select");
  serverSelect.innerHTML = "";

  if (servers.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved servers found";
    serverSelect.appendChild(option);
    serverSelect.disabled = true;
    return;
  }

  serverSelect.disabled = false;

  servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server.url;
    option.textContent = `${server.label} - ${server.url}`;
    option.selected = server.url === selectedServerUrl;
    serverSelect.appendChild(option);
  });
}

async function fetchServers(settingsOrigin) {
  const response = await fetch(
    `${settingsOrigin.replace(/\/$/, "")}/api/extension/servers`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load server list.");
  }

  const servers = Array.isArray(data.servers) && data.servers.length > 0
    ? data.servers
    : [{ id: "default", label: "This server", url: settingsOrigin.replace(/\/$/, "") }];

  return {
    servers,
    selectedServerUrl: data.defaultServerUrl || servers[0].url,
  };
}

async function loadPageData() {
  try {
    const data = await sendToActiveTab("getJobData");
    setPageState(data);
    return data;
  } catch (error) {
    setPageState({ supported: false });
    setFeedback(error instanceof Error ? error.message : "Unable to connect to the page.", true);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const settingsOriginInput = document.getElementById("settings-origin");
  const saveOriginButton = document.getElementById("save-origin");
  const serverSelect = document.getElementById("server-select");
  const copyCleanUrlButton = document.getElementById("copy-clean-url");
  const copyDescriptionButton = document.getElementById("copy-description");
  const openAppButton = document.getElementById("open-app");

  const stored = await getStoredConfig();
  settingsOriginInput.value = stored.settingsOrigin;
  let pageData = await loadPageData();
  let selectedServerUrl = stored.selectedServerUrl;
  let servers = stored.companionServers;

  if (servers.length === 0) {
    try {
      const fetched = await fetchServers(stored.settingsOrigin);
      servers = fetched.servers;
      selectedServerUrl = fetched.selectedServerUrl;
      await chrome.storage.sync.set({
        companionServers: servers,
        selectedServerUrl,
      });
    } catch {
      servers = [{ id: "default", label: "This server", url: stored.settingsOrigin }];
      selectedServerUrl = stored.settingsOrigin;
    }
  }

  renderServerOptions(servers, selectedServerUrl);

  saveOriginButton.addEventListener("click", async () => {
    const nextOrigin = settingsOriginInput.value.trim() || DEFAULT_APP_ORIGIN;

    try {
      const fetched = await fetchServers(nextOrigin);
      servers = fetched.servers;
      selectedServerUrl = fetched.selectedServerUrl;
      renderServerOptions(servers, selectedServerUrl);
      await chrome.storage.sync.set({
        settingsOrigin: nextOrigin,
        companionServers: servers,
        selectedServerUrl,
      });
      setFeedback("Loaded companion servers.", false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load companion servers.", true);
    }
  });

  serverSelect.addEventListener("change", async () => {
    selectedServerUrl = serverSelect.value;
    await chrome.storage.sync.set({ selectedServerUrl });
  });

  copyCleanUrlButton.addEventListener("click", async () => {
    pageData = pageData ?? await loadPageData();
    if (!pageData?.cleanUrl) return;
    await navigator.clipboard.writeText(pageData.cleanUrl);
    setFeedback("Copied clean job URL.", false);
  });

  copyDescriptionButton.addEventListener("click", async () => {
    pageData = pageData ?? await loadPageData();
    if (!pageData?.jobDescription) {
      setFeedback("No job description found on this page.", true);
      return;
    }
    await navigator.clipboard.writeText(pageData.jobDescription);
    setFeedback("Copied job description.", false);
  });

  openAppButton.addEventListener("click", async () => {
    pageData = pageData ?? await loadPageData();
    if (!pageData?.supported) return;
    if (!selectedServerUrl) {
      setFeedback("Pick a destination server first.", true);
      return;
    }

    const payload = encodeImportPayload({
      source: "LinkedIn Chrome extension",
      companyName: pageData.companyName || "",
      jobTitle: pageData.jobTitle || "",
      jobDescriptionUrl: pageData.cleanUrl || "",
      jobDescription: pageData.jobDescription || "",
      applicationMedium: "LinkedIn",
    });

    await chrome.tabs.create({
      url: `${selectedServerUrl.replace(/\/$/, "")}/applications/new#import=${payload}`,
    });
    setFeedback("Opened Job Search Tracker with imported data.", false);
  });
});
