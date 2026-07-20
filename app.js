(() => {
  "use strict";
  const records = [...(window.CORRESPONDENCE || [])];
  const pinStorageKey = "ameenahs-dev-team-correspondence-pins";
  const initialPinIds = records.filter((record) => record.initiallyPinned).map((record) => record.id);
  let pinnedIds = loadPinnedIds();
  let indexQuery = "";
  const app = document.querySelector("#app");
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const bullets = (items, cls) => `<ul class="${cls}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  const displayDate = (date, long = false) => new Date(date + "T12:00:00").toLocaleDateString("en-US", long ? {month:"long",day:"numeric",year:"numeric"} : {month:"short",day:"numeric",year:"numeric"});
  const links = (items) => items.map(([label,href]) => `<a class="artifact-link" href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${esc(label)}<span aria-hidden="true">↗</span></a>`).join("");
  const orderedRecords = () => [...records].sort((a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)) || b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const pinControl = (record, className = "") => {
    const pinned = pinnedIds.has(record.id);
    const action = pinned ? "Unpin" : "Pin";
    return `<button class="pin-toggle ${className}" type="button" data-pin-id="${record.id}" aria-pressed="${pinned}" aria-label="${action} correspondence ${record.id}: ${esc(record.title)}" title="${action} this correspondence"><span aria-hidden="true">&#128204;</span><span>${action}</span></button>`;
  };

  function savePinnedIds() {
    try { window.localStorage.setItem(pinStorageKey, JSON.stringify([...pinnedIds])); } catch (_) { /* Current-page pin state remains usable. */ }
  }

  function loadPinnedIds() {
    try {
      const saved = window.localStorage.getItem(pinStorageKey);
      if (saved === null) {
        const seeded = new Set(initialPinIds);
        window.localStorage.setItem(pinStorageKey, JSON.stringify([...seeded]));
        return seeded;
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set(parsed.filter((id) => records.some((record) => record.id === String(id))).map(String));
    } catch (_) { /* Fall through to the initial seed when storage is unavailable or malformed. */ }
    const seeded = new Set(initialPinIds);
    try { window.localStorage.setItem(pinStorageKey, JSON.stringify([...seeded])); } catch (_) { /* Rendering must not depend on storage. */ }
    return seeded;
  }

  function togglePin(id) {
    pinnedIds.has(id) ? pinnedIds.delete(id) : pinnedIds.add(id);
    savePinnedIds();
  }

  function renderIndex() {
    document.title = "AmeenahsDevTeam Correspondence";
    app.innerHTML = `
      <section class="hero index-hero">
        <div class="eyebrow">Public engineering record</div>
        <h1>Correspondence with the receipts attached.</h1>
        <p>Consultations, decisions, execution updates, evidence, boundaries, and the next owner—kept together so context survives the handoff.</p>
        <div class="hero-rule"><span>${records.length} records</span><span>Pins first, then newest</span><span>Searchable</span></div>
      </section>
      <section class="archive" aria-labelledby="archive-title">
        <div class="archive-toolbar"><div><p class="kicker">Archive</p><h2 id="archive-title">Correspondence</h2></div>
          <label class="search"><span class="sr-only">Search correspondence</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.4-4.4m2.4-5.6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/></svg><input id="search" type="search" placeholder="Search people, decisions, evidence…" autocomplete="off"></label>
        </div>
        <p id="result-count" class="result-count" aria-live="polite">Showing all ${records.length} records</p>
        <div id="record-list" class="record-list"></div>
      </section>`;
    const input = document.querySelector("#search");
    input.value = indexQuery;
    const draw = () => {
      const query = input.value.trim().toLowerCase();
      const filtered = orderedRecords().filter((r) => [r.id,r.title,r.dek,r.from,r.to,r.kind,r.status,r.summary,r.decision].join(" ").toLowerCase().includes(query));
      document.querySelector("#result-count").textContent = query ? `${filtered.length} of ${records.length} records match “${input.value.trim()}”` : `Showing all ${records.length} records`;
      document.querySelector("#record-list").innerHTML = filtered.length ? filtered.map((r) => `
        <article class="record-card"><a href="#/correspondence/${r.id}" aria-label="Correspondence ${r.id}: ${esc(r.title)}">
          <span class="record-number">#${r.id}</span>
          <span class="record-main"><span class="record-meta"><span>${esc(r.kind)}</span><span>${esc(r.status)}</span></span><strong>${esc(r.title)}</strong><span class="record-dek">${esc(r.dek)}</span></span>
          <span class="record-date"><time datetime="${r.date}">${displayDate(r.date)}</time><small>${r.docs} ${r.docs === 1 ? "document" : "documents"}</small></span>
          <span class="record-arrow" aria-hidden="true">↗</span>
        </a>${pinControl(r, "card-pin")}</article>`).join("") : '<div class="empty-state"><h3>No correspondence found</h3><p>Try a person, status, topic, or record number.</p></div>';
    };
    input.addEventListener("input", () => { indexQuery = input.value; draw(); });
    document.querySelector("#record-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-pin-id]");
      if (!button) return;
      const id = button.dataset.pinId;
      togglePin(id);
      draw();
      document.querySelector(`[data-pin-id="${id}"]`)?.focus();
    });
    draw();
  }

  function renderDetail(r) {
    if (!r) {
      app.innerHTML = '<section class="empty-state"><h1>Correspondence not found</h1><p>The requested record is not in this archive.</p><a class="button" href="#/">Return to archive</a></section>';
      return;
    }
    document.title = `#${r.id} ${r.title} · AmeenahsDevTeam`;
    const meta = [["From",r.from],["To",r.to],["Date",displayDate(r.date,true)],["Work thread",r.workThread],["Source thread",r.sourceThread],["Role thread",r.roleThread]];
    app.innerHTML = `
      <article class="detail">
        <header class="hero detail-hero">
          <a class="back-link" href="#/">← All correspondence</a>
          <div class="eyebrow">Corr ${r.id} · ${esc(r.kind)}</div>
          <div class="status-pill">${esc(r.status)}</div>
          ${pinControl(r, "detail-pin")}
          <h1>${esc(r.title)}</h1><p>${esc(r.dek)}</p>
          <aside class="scope-banner"><strong>Scope boundary</strong><span>${esc(r.limits)}</span></aside>
        </header>
        <div class="detail-body">
          <section class="meta-grid" aria-label="Correspondence metadata">${meta.map(([label,value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}</section>
          <div class="prose-grid">
            <nav class="detail-nav" aria-label="On this page"><span>On this page</span><a href="#request">Request</a><a href="#response">Response</a><a href="#evidence">Evidence</a><a href="#verification">Verification</a><a href="#decision">Decision</a><a href="#next">Next actions</a></nav>
            <div class="prose">
              <section id="request"><p class="kicker">Request summary</p><h2>What Raven asked the specialist to resolve</h2><p>${esc(r.summary)}</p></section>
              <section id="response"><p class="kicker">Specialist response</p><h2>The bounded recommendation</h2><p>${esc(r.response)}</p></section>
              <section id="evidence"><p class="kicker">Evidence record</p><h2>What the decision rests on</h2>${bullets(r.evidence,"check-list")}</section>
              <section id="verification"><p class="kicker">Verification & custody</p><h2>How the record was checked</h2>${bullets(r.verification,"check-list")}</section>
              <section class="boundary"><p class="kicker">Conflict status</p><h2>${esc(r.conflict)}</h2><p>Advice on this page does not silently become PI authority. The execution decision records what Raven accepted within the approved scope.</p></section>
              <section id="decision"><p class="kicker">Execution decision</p><h2>Accepted path</h2><p>${esc(r.decision)}</p></section>
              <section id="next"><p class="kicker">Next actions</p><h2>What happens from here</h2>${bullets(r.next,"number-list")}</section>
              <section><p class="kicker">Artifacts</p><h2>Inspect the underlying record</h2><div class="artifact-grid">${links(r.links)}<a class="artifact-link" href="${esc(r.source)}">Canonical source HTML<span aria-hidden="true">↗</span></a></div></section>
              <footer class="record-footer"><span>Correspondence ${r.id}</span><span>${esc(r.workThread)}</span><span>${esc(r.status)}</span></footer>
            </div>
          </div>
        </div>
      </article>`;
    document.querySelector(".detail-pin").addEventListener("click", () => {
      togglePin(r.id);
      renderDetail(r);
      document.querySelector(".detail-pin").focus();
    });
  }

  function route() {
    const match = location.hash.match(/^#\/correspondence\/(\d{3})/);
    match ? renderDetail(records.find((record) => record.id === match[1])) : renderIndex();
    document.querySelector("#main-content")?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:"auto"});
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("storage", (event) => {
    if (event.key !== pinStorageKey) return;
    try {
      const parsed = JSON.parse(event.newValue);
      pinnedIds = Array.isArray(parsed) ? new Set(parsed.filter((id) => records.some((record) => record.id === String(id))).map(String)) : new Set(initialPinIds);
    } catch (_) { pinnedIds = new Set(initialPinIds); }
    const match = location.hash.match(/^#\/correspondence\/(\d{3})/);
    match ? renderDetail(records.find((record) => record.id === match[1])) : renderIndex();
  });
  route();
})();
