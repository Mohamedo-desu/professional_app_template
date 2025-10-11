(function () {
  const cfg = window.APP_CONFIG;
  const currentPath = window.location.pathname + window.location.search;
  const deepLink = `${cfg.APP_URL_SCHEME}:/${currentPath}`;

  // === Fetch Latest APK + Version Info ===
  async function fetchLatestApk() {
    try {
      const res = await fetch(`${cfg.CONVEX_URL}/appVersions/latest`);
      if (!res.ok) throw new Error("Failed to fetch latest app version");
      const data = await res.json();

      const downloadBtn = document.getElementById("downloadApkBtn");
      const versionSpan = document.getElementById("version");
      const releaseNotesList = document.getElementById("release-notes");

      if (downloadBtn && data?.downloadUrl)
        downloadBtn.setAttribute("href", data.downloadUrl);
      if (versionSpan) versionSpan.textContent = data.version || "N/A";

      if (releaseNotesList) {
        releaseNotesList.innerHTML = "";
        const notes = (data.releaseNotes || "")
          .split("\n")
          .filter((n) => n.trim());
        if (notes.length > 0) {
          notes.forEach((note) => {
            const li = document.createElement("li");
            li.textContent = note.trim();
            releaseNotesList.appendChild(li);
          });
        } else {
          releaseNotesList.innerHTML = "<li>No release notes available.</li>";
        }
      }

      console.log(
        `✅ Found latest download for ${cfg.APP_NAME}:`,
        data.downloadUrl
      );
    } catch (err) {
      console.error(`⚠️ Could not fetch latest APK for ${cfg.APP_NAME}:`, err);
      document.getElementById("version").textContent = "Unavailable";
      document.getElementById("release-notes").innerHTML =
        "<li>Unable to load release notes.</li>";
    }
  }

  // === Try to Open App ===
  function openApp() {
    if (/Android/.test(navigator.userAgent)) {
      const intentUrl = `intent://#Intent;scheme=${cfg.APP_URL_SCHEME};package=${cfg.ANDROID_PACKAGE};end`;
      try {
        window.location.href = intentUrl;
      } catch {
        window.location.href = deepLink;
        setTimeout(() => {
          if (document.visibilityState === "visible")
            updateContent("app-not-installed");
        }, 2000);
      }
    } else {
      updateContent("desktop");
    }
  }

  // === Update Content State ===
  function updateContent(state) {
    const content = document.getElementById("content");
    const openAppBtn = document.getElementById("openAppBtn");
    if (state === "app-not-installed") {
      content.innerHTML = `
        <p>It looks like you don't have the ${cfg.APP_NAME} app installed.</p>
        <div class="loading">Download it below to continue!</div>`;
      openAppBtn.style.display = "none";
    } else if (state === "desktop") {
      content.innerHTML = `
        <p>${cfg.APP_NAME} is designed for mobile devices.</p>
        <div class="loading">Visit on your phone to get started!</div>`;
      openAppBtn.style.display = "none";
    }
  }

  // === Event Listeners ===
  const openAppBtn = document.getElementById("openAppBtn");
  if (openAppBtn) {
    openAppBtn.href = deepLink;
    openAppBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openApp();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden")
      console.log(`Page hidden — ${cfg.APP_NAME} likely opened`);
  });

  // === Init ===
  fetchLatestApk();
})();
