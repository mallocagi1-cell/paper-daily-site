(function () {
  // Display order everywhere on the static site (user preference). data.json "tracks"
  // (written by the builder in the same order) overrides this at boot.
  let TRACKS = ["personalization", "generative", "retrieval", "agentic", "infra"];
  let TRACK_LABELS = {
    personalization: "Personalization",
    generative: "Generative",
    retrieval: "Retrieval",
    agentic: "Agentic",
    infra: "Infra",
  };
  const SOURCE_LABELS = {
    arxiv: "arXiv",
    huggingface: "HuggingFace",
    semantic_scholar: "Semantic Scholar",
    conference_papers: "Conference",
    github: "GitHub",
    web_search: "Web Search",
  };
  const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];

  let DATA = { days: [], day_count: 0, latest_date: null, generated_at: "" };
  let reportCache = {};

  function weekdayChinese(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    if (Number.isNaN(d.getTime())) return "";
    return "周" + WEEKDAY_ZH[d.getDay()];
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badgeClass(score) {
    const v = Number(score);
    if (v >= 4.0) return "badge-green";
    if (v >= 3.0) return "badge-orange";
    return "badge-red";
  }

  function formatScore(score) {
    const v = Number(score);
    if (Number.isNaN(v)) return "0.00";
    return v.toFixed(2);
  }

  function sourceLabel(src) {
    return SOURCE_LABELS[src] || src || "Unknown";
  }

  function truncate(text, n) {
    const t = String(text || "");
    return t.length <= n ? t : t.slice(0, n) + "...";
  }


  function renderDeepRead(paper) {
    const dr = paper && paper.deep_reading;
    if (!dr || dr.status !== "completed") return "";
    const htmlBody = dr.content_html || "";
    if (!htmlBody) return "";
    const rawPid = paper.id || dr.paper_id || "";
    const pid = escapeHtml(rawPid);
    const domId = String(rawPid).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "x";
    const pageLink = dr.slug
      ? '<a class="deep-read-page-link" href="deep-readings/' +
        encodeURIComponent(dr.slug) +
        '.html">独立页面阅读 &#8599;</a>'
      : "";
    return (
      '<div class="deep-read-inline deep-read-has-content" data-deep-read data-paper-id="' +
      pid +
      '" id="dr-' +
      escapeHtml(domId) +
      '">' +
      '<div class="deep-read-toggle-row">' +
      '<button type="button" class="deep-read-trigger completed" data-deep-toggle aria-expanded="false">' +
      '<span class="deep-read-trigger-icon">&#9660;</span>' +
      "<span>&#128214; 展开深度解读</span>" +
      "</button>" +
      pageLink +
      "</div>" +
      '<div class="deep-read-section" hidden>' +
      '<div class="deep-read-header-bar">' +
      '<button type="button" class="deep-read-trigger expanded" data-deep-collapse>' +
      '<span class="deep-read-trigger-icon">&#9650;</span>' +
      "<span>收起深度解读</span>" +
      "</button></div>" +
      '<div class="deep-read-content">' +
      htmlBody +
      "</div></div></div>"
    );
  }

  function setDeepReadExpanded(root, open) {
    if (!root) return;
    const btn = root.querySelector("[data-deep-toggle]");
    const section = root.querySelector(".deep-read-section");
    if (!btn || !section) return;
    const row = btn.closest(".deep-read-toggle-row") || btn;
    if (open) {
      row.hidden = true;
      section.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    } else {
      row.hidden = false;
      section.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      const card = root.closest(".card");
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top < 60) window.scrollTo(0, window.scrollY + rect.top - 64);
      }
    }
  }


  // Routes (all render the native-style report view; "#/" = latest day, default track):
  //   #/  |  #/reports  |  #/view/<date>/<track>  |  #/view/<date>  |  #/<date>/<track>
  //   #/reports/<date>[/<track>]  (native-style alias)
  function parseRoute() {
    const raw = (location.hash || "#/").replace(/^#/, "").split("?")[0] || "/";
    const parts = raw.split("/").filter(Boolean);
    const isDate = function (s) {
      return /^\d{4}-\d{2}-\d{2}$/.test(s || "");
    };
    if ((parts[0] === "view" || parts[0] === "reports") && isDate(parts[1])) {
      return { date: parts[1], track: parts[2] || null };
    }
    if (isDate(parts[0])) {
      return { date: parts[0], track: parts[1] || null };
    }
    return { date: null, track: null };
  }
  function reportDataHref(date, track) {
    return "reports/" + date + "/" + track + "/report_data.json";
  }

  function reportHtmlHref(date, track) {
    return "reports/" + date + "/" + track + "/report.html";
  }

  function viewHash(date, track) {
    return "#/view/" + date + "/" + track;
  }

  function renderPaperCard(paper, idx) {
    const rank = paper.rank || idx + 1;
    const title = paper.title || "Untitled";
    const url = paper.url || "#";
    const score = paper.total_score;
    const scores = paper.scores || {};
    const pid = paper.id || "p" + idx;

    let scoreDetail = "";
    if (paper.scores) {
      scoreDetail =
        '<div class="score-detail">' +
        "Relevance " +
        escapeHtml(scores.business_relevance != null ? scores.business_relevance : "-") +
        " | Novelty " +
        escapeHtml(scores.technical_novelty != null ? scores.technical_novelty : "-") +
        " | Practical " +
        escapeHtml(scores.practicality != null ? scores.practicality : "-") +
        " | Evidence " +
        escapeHtml(scores.evidence_quality != null ? scores.evidence_quality : "-") +
        " | Timely " +
        escapeHtml(scores.timeliness != null ? scores.timeliness : "-") +
        "</div>";
    }

    const bodyParts = [];
    if (paper.summary) {
      bodyParts.push(
        "<p><strong>Summary:</strong> " + escapeHtml(paper.summary) + "</p>"
      );
    }
    if (paper.key_insight) {
      bodyParts.push(
        "<p><strong>Key insight:</strong> " + escapeHtml(paper.key_insight) + "</p>"
      );
    }
    if (paper.business_connection) {
      bodyParts.push(
        "<p><strong>Business connection:</strong> " +
          escapeHtml(paper.business_connection) +
          "</p>"
      );
    }
    if (paper.evidence) {
      bodyParts.push(
        "<p><strong>Evidence:</strong> " + escapeHtml(paper.evidence) + "</p>"
      );
    }
    const body = bodyParts.length
      ? '<div class="paper-body" style="margin-top: 12px;">' + bodyParts.join("") + "</div>"
      : "";

    let companies = paper.company || [];
    if (typeof companies === "string") companies = [companies];
    const companyHtml = companies
      .filter(Boolean)
      .map(function (c) {
        return '<span class="company-tag">' + escapeHtml(c) + "</span>";
      })
      .join("");

    let meta =
      '<div class="paper-meta">' +
      '<span class="source-tag">' +
      escapeHtml(sourceLabel(paper.source)) +
      "</span>" +
      companyHtml;
    if (paper.published) {
      meta +=
        '<span style="font-size: 12px; color: var(--text-muted);">' +
        escapeHtml(paper.published) +
        "</span>";
    }
    if (paper.authors) {
      meta +=
        '<span style="font-size: 12px; color: var(--text-muted);">' +
        escapeHtml(truncate(paper.authors, 80)) +
        "</span>";
    }
    meta += "</div>";

    return (
      '<div class="card" data-paper-id="' +
      escapeHtml(pid) +
      '" id="paper-' +
      escapeHtml(pid) +
      '">' +
      '<div class="card-with-radar"><div class="card-content">' +
      '<div class="card-header">' +
      '<div class="card-title"><a href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(rank) +
      ". " +
      escapeHtml(title) +
      "</a></div>" +
      '<div class="card-actions"><span class="badge ' +
      badgeClass(score) +
      '">' +
      escapeHtml(formatScore(score)) +
      "</span></div></div>" +
      scoreDetail +
      body +
      renderDeepRead(paper) +
      meta +
      "</div></div></div>"
    );
  }

  function renderCodeProject(project, idx) {
    const rank = project.rank || idx + 1;
    const title = project.title || "Untitled";
    const url = project.url || "#";
    const stars = project.stars || 0;
    const pid = project.id || "code" + idx;
    const detailBits = [project.language, project.created_at].filter(Boolean);
    const detail = detailBits.length
      ? '<div class="score-detail">' + escapeHtml(detailBits.join(" | ")) + "</div>"
      : "";
    const desc = project.description
      ? '<div class="paper-body" style="margin-top: 12px;"><p><strong>项目简介：</strong><span>' +
        escapeHtml(project.description) +
        "</span></p></div>"
      : "";
    const srcLabel =
      project.source === "huggingface" || String(pid).indexOf("hf_") === 0
        ? "HuggingFace"
        : "GitHub";
    const created = project.created_at
      ? '<span style="font-size: 12px; color: var(--text-muted);">' +
        escapeHtml(project.created_at) +
        "</span>"
      : "";

    return (
      '<div class="card code-project-card" data-paper-id="' +
      escapeHtml(pid) +
      '" style="border-left: 4px solid var(--green);">' +
      '<div class="card-header"><div class="card-title"><a href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(rank) +
      ". " +
      escapeHtml(title) +
      '</a></div><span class="badge badge-green">' +
      escapeHtml(stars) +
      "</span></div>" +
      detail +
      desc +
      '<div class="paper-meta"><span class="source-tag">' +
      escapeHtml(srcLabel) +
      "</span>" +
      created +
      "</div></div>"
    );
  }

  function renderReportBody(report) {
    const papers = report.papers || [];
    const projects = report.code_projects || [];
    const stats = report.stats || {};
    const track = report.track || "-";

    const statsBits = ["Track: " + escapeHtml(track), papers.length + " papers"];
    if (projects.length) statsBits.push(projects.length + " repos");
    if (stats.score_max != null) {
      const smin = Number(stats.score_min || 0);
      const smax = Number(stats.score_max);
      if (!Number.isNaN(smax)) {
        statsBits.push("Score: " + smin.toFixed(2) + " – " + smax.toFixed(2));
      }
    }

    const scenario = report.scenario
      ? '<div class="scenario-card"><strong>Scenario:</strong> ' +
        escapeHtml(report.scenario) +
        "</div>"
      : "";

    const outline = papers
      .map(function (paper, i) {
        const pid = paper.id || "p" + i;
        const title = paper.title || "Untitled";
        return (
          '<a class="outline-paper" href="#paper-' +
          escapeHtml(pid) +
          '" title="' +
          escapeHtml(title) +
          '"><span>' +
          escapeHtml(i + 1) +
          ". " +
          escapeHtml(title) +
          "</span></a>"
        );
      })
      .join("");

    const cards = papers.length
      ? papers.map(renderPaperCard).join("")
      : '<div class="empty-state"><h3>No papers</h3><p>This track has no selected papers for the day.</p></div>';

    let codeSection = "";
    if (projects.length) {
      codeSection =
        '<section class="code-projects-section" style="margin-top: 28px;">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">' +
        '<h3 style="margin: 0; font-family: Inter, sans-serif; font-size: 18px;">热门开源项目</h3>' +
        '<span style="font-family: Inter, sans-serif; font-size: 13px; color: var(--text-muted);">' +
        projects.length +
        " projects</span></div>" +
        projects.map(renderCodeProject).join("") +
        "</section>";
    }

    return (
      '<div class="native-report">' +
      '<div style="text-align: center; margin-bottom: 16px;">' +
      '<span style="font-family: Inter, sans-serif; font-size: 13px; color: var(--text-muted);">' +
      statsBits.join(" | ") +
      "</span></div>" +
      scenario +
      '<div class="content-with-outline">' +
      (outline
        ? '<nav class="outline-sidebar"><div class="outline-title">Papers</div>' +
          outline +
          "</nav>"
        : "") +
      '<div class="outline-main">' +
      cards +
      codeSection +
      "</div></div></div>"
    );
  }

  // ---------- Native-style report view (date navigator + track tabs) ----------
  // Mirrors web/static/index.html "Reports (merged list + detail)": ‹ date (周X) ▼ › with a
  // dropdown (date input + Go, list of report dates with track badges), then track tabs.

  const state = { date: null, track: null, pickerOpen: false, notice: "" };

  function orderTracks(list) {
    return (list || []).slice().sort(function (a, b) {
      const ia = TRACKS.indexOf(a), ib = TRACKS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }

  function trackLabel(t) {
    return TRACK_LABELS[t] || t;
  }

  function dayIndex(date) {
    for (let i = 0; i < DATA.days.length; i++) if (DATA.days[i].date === date) return i;
    return -1;
  }

  function nearestDayIndex(date) {
    const target = new Date(date + "T00:00:00").getTime();
    if (Number.isNaN(target)) return 0;
    let best = 0, bestDiff = Infinity;
    DATA.days.forEach(function (d, i) {
      const diff = Math.abs(new Date(d.date + "T00:00:00").getTime() - target);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });
    return best;
  }

  // Resolve a (possibly partial / stale) route to an existing date + track.
  function resolve(route) {
    let idx = 0, notice = "";
    if (route.date) {
      idx = dayIndex(route.date);
      if (idx < 0) {
        idx = nearestDayIndex(route.date);
        notice = route.date + " 没有日报，已显示最近的 " + DATA.days[idx].date;
      }
    }
    const day = DATA.days[idx];
    const tracks = orderTracks(day.tracks);
    let track = tracks[0] || "";
    if (route.track) {
      if (tracks.indexOf(route.track) !== -1) track = route.track;
      else if (!notice) notice = day.date + " 没有 " + trackLabel(route.track) + " 日报，已显示 " + trackLabel(track);
    }
    return { idx: idx, date: day.date, tracks: tracks, track: track, notice: notice };
  }

  function go(date, track) {
    const h = viewHash(date, track);
    if (location.hash === h) render();
    else location.hash = h; // pushes history entry -> hashchange -> render (no reload)
  }

  function renderDateNav(r) {
    const n = DATA.days.length;
    const oldest = DATA.days[n - 1].date;
    const latest = DATA.days[0].date;
    const items = DATA.days.map(function (d) {
      const badges = orderTracks(d.tracks)
        .map(function (t) {
          return '<span class="dp-track-badge">' + escapeHtml(trackLabel(t)) + "</span>";
        })
        .join("");
      return (
        '<li class="date-picker-item' + (d.date === r.date ? " active" : "") +
        '" data-date="' + escapeHtml(d.date) + '" tabindex="0" role="option">' +
        '<span class="dp-date">' + escapeHtml(d.date) + "</span>" +
        '<span class="dp-weekday">' + escapeHtml(weekdayChinese(d.date)) + "</span>" +
        '<span class="dp-tracks">' + badges + "</span></li>"
      );
    }).join("");
    return (
      '<div class="date-nav" id="date-nav">' +
      '<button class="date-nav-btn" type="button" data-date-prev title="前一天 (更早)"' +
      (r.idx >= n - 1 ? " disabled" : "") + ">&#8249;</button>" +
      '<div class="date-label" id="date-label" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="' +
      (state.pickerOpen ? "true" : "false") + '" title="选择日期">' +
      "<span>" + escapeHtml(r.date) + "</span>" +
      '<span class="date-weekday">(' + escapeHtml(weekdayChinese(r.date)) + ")</span>" +
      '<span class="date-caret' + (state.pickerOpen ? " open" : "") + '">&#9660;</span>' +
      (r.idx === 0 ? '<span class="date-latest-tag">最新</span>' : "") +
      "</div>" +
      '<button class="date-nav-btn" type="button" data-date-next title="后一天 (更新)"' +
      (r.idx <= 0 ? " disabled" : "") + ">&#8250;</button>" +
      '<div class="date-picker-dropdown" id="date-picker"' + (state.pickerOpen ? "" : " hidden") + ">" +
      '<div class="date-picker-jump">' +
      '<input type="date" id="date-jump" value="' + escapeHtml(r.date) + '" min="' + escapeHtml(oldest) +
      '" max="' + escapeHtml(latest) + '">' +
      '<button type="button" data-date-go>Go</button></div>' +
      '<div class="date-picker-count">' + n + " 天有日报</div>" +
      '<ul class="date-picker-list" role="listbox">' + items + "</ul></div>" +
      "</div>"
    );
  }

  function renderShell(r) {
    const main = document.getElementById("main");
    main.classList.add("viewer-mode");
    const tabs = r.tracks.map(function (t) {
      return (
        '<a class="track-tab' + (t === r.track ? " active" : "") + '" href="' +
        viewHash(r.date, t) + '">' + escapeHtml(trackLabel(t)) + "</a>"
      );
    }).join("");
    main.innerHTML =
      '<div class="viewer-shell">' +
      '<div class="viewer-toolbar">' +
      renderDateNav(r) +
      '<div class="track-tabs">' + tabs + "</div>" +
      (r.notice ? '<div class="pages-notice">' + escapeHtml(r.notice) + "</div>" : "") +
      "</div>" +
      '<div class="viewer-report-body" id="report-body">' +
      '<div class="empty-state"><span class="spinner"></span></div>' +
      "</div>" +
      '<div class="viewer-foot"><a class="open-raw" href="' + reportHtmlHref(r.date, r.track) +
      '" target="_blank" rel="noopener">Open standalone report.html ↗</a>' +
      '<a class="open-raw" href="deep-readings/index.html">&#128214; 深度解读' +
      (DATA.deep_reading_entries ? " " + DATA.deep_reading_entries + " 篇" : "") + " →</a></div>" +
      "</div>";
  }

  function loadReport(date, track) {
    const key = date + "/" + track;
    if (reportCache[key]) {
      return Promise.resolve(reportCache[key]);
    }
    return fetch(reportDataHref(date, track), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("report_data.json " + res.status);
      return res.json().then(function (json) {
        reportCache[key] = json;
        return json;
      });
    });
  }

  let renderSeq = 0;
  function render() {
    const nav = document.getElementById("nav-reports");
    if (nav) nav.classList.add("active");
    if (!DATA.days.length) {
      document.getElementById("main").innerHTML =
        '<div class="empty-state"><span class="icon">📰</span><h3>No reports yet</h3><p>No report_data.json files found.</p></div>';
      return;
    }
    const r = resolve(parseRoute());
    state.date = r.date;
    state.track = r.track;
    state.pickerOpen = false;
    renderShell(r);
    const seq = ++renderSeq;
    loadReport(r.date, r.track)
      .then(function (report) {
        if (seq !== renderSeq) return; // user switched again meanwhile
        document.getElementById("report-body").innerHTML = renderReportBody(report);
      })
      .catch(function (err) {
        if (seq !== renderSeq) return;
        document.getElementById("report-body").innerHTML =
          '<div class="empty-state"><h3>Failed to load report</h3><p>' +
          escapeHtml(String(err)) +
          '</p><p><a class="open-raw" href="' +
          escapeHtml(reportHtmlHref(r.date, r.track)) +
          '">Try standalone report.html</a></p></div>';
      });
    // Warm the cache for the neighbouring (older) day so prev-clicks feel instant.
    const older = DATA.days[r.idx + 1];
    if (older) loadReport(older.date, orderTracks(older.tracks)[0]).catch(function () {});
  }

  function setPicker(open) {
    state.pickerOpen = open;
    const dd = document.getElementById("date-picker");
    const label = document.getElementById("date-label");
    if (!dd || !label) return;
    dd.hidden = !open;
    label.setAttribute("aria-expanded", open ? "true" : "false");
    const caret = label.querySelector(".date-caret");
    if (caret) caret.classList.toggle("open", open);
    if (open) {
      const active = dd.querySelector(".date-picker-item.active");
      if (active) dd.scrollTop = Math.max(0, active.offsetTop - dd.clientHeight / 2);
    }
  }

  function goToDayIndex(i) {
    const d = DATA.days[i];
    if (!d) return;
    // Keep the current track if the target day has it, else its first track (native resets to first).
    const tracks = orderTracks(d.tracks);
    go(d.date, tracks.indexOf(state.track) !== -1 ? state.track : tracks[0]);
  }

  function jumpTo(value) {
    if (!value) return;
    const i = dayIndex(value);
    goToDayIndex(i >= 0 ? i : nearestDayIndex(value));
  }

  function boot() {
    fetch("data.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("data.json " + res.status);
        return res.json();
      })
      .then(function (json) {
        DATA = json;
        DATA.days = DATA.days || [];
        if (Array.isArray(DATA.tracks) && DATA.tracks.length) TRACKS = DATA.tracks.slice();
        if (DATA.track_labels) TRACK_LABELS = Object.assign({}, TRACK_LABELS, DATA.track_labels);
        const badge = document.getElementById("pages-badge");
        if (badge && DATA.latest_date) {
          badge.textContent = "Static · 最新 " + DATA.latest_date;
        }
        render();
        window.addEventListener("hashchange", render);
      })
      .catch(function (err) {
        document.getElementById("main").innerHTML =
          '<div class="empty-state"><h3>Failed to load data.json</h3><p>' +
          escapeHtml(String(err)) +
          "</p></div>";
      });
  }

  document.addEventListener("click", function (ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    const toggle = t.closest("[data-deep-toggle]");
    if (toggle) {
      setDeepReadExpanded(toggle.closest("[data-deep-read]"), true);
      return;
    }
    const collapse = t.closest("[data-deep-collapse]");
    if (collapse) {
      setDeepReadExpanded(collapse.closest("[data-deep-read]"), false);
      return;
    }
    const ol = t.closest('a.outline-paper[href^="#paper-"]');
    if (ol) {
      // In-page anchor: scroll without touching the route hash.
      ev.preventDefault();
      const el = document.getElementById(decodeURIComponent(ol.getAttribute("href").slice(1)));
      if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 64, behavior: "smooth" });
      return;
    }
    if (t.closest("[data-date-prev]")) { goToDayIndex(dayIndex(state.date) + 1); return; }
    if (t.closest("[data-date-next]")) { goToDayIndex(dayIndex(state.date) - 1); return; }
    if (t.closest("#date-label")) { setPicker(!state.pickerOpen); return; }
    if (t.closest("[data-date-go]")) {
      const inp = document.getElementById("date-jump");
      jumpTo(inp && inp.value);
      return;
    }
    const item = t.closest(".date-picker-item");
    if (item) { jumpTo(item.getAttribute("data-date")); return; }
    if (state.pickerOpen && !t.closest("#date-picker")) setPicker(false);
  });

  document.addEventListener("keydown", function (ev) {
    const t = ev.target;
    if (ev.key === "Escape" && state.pickerOpen) { setPicker(false); return; }
    if (t && t.id === "date-jump" && ev.key === "Enter") { jumpTo(t.value); return; }
    if (t && t.classList && (t.classList.contains("date-picker-item") || t.id === "date-label") &&
        (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      if (t.id === "date-label") setPicker(!state.pickerOpen);
      else jumpTo(t.getAttribute("data-date"));
    }
  });

  boot();
})();
