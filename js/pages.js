(function () {
  const TRACKS = ["retrieval", "personalization", "generative", "agentic", "infra"];
  const TRACK_LABELS = {
    retrieval: "Retrieval",
    personalization: "Personalization",
    generative: "Generative",
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
    const pid = escapeHtml(paper.id || dr.paper_id || "");
    return (
      '<div class="deep-read-inline" data-deep-read data-paper-id="' +
      pid +
      '">' +
      '<button type="button" class="deep-read-trigger completed" data-deep-toggle aria-expanded="false">' +
      '<span class="deep-read-trigger-icon">&#9660;</span>' +
      "<span>展开深度解读</span>" +
      "</button>" +
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
    if (open) {
      btn.hidden = true;
      section.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    } else {
      btn.hidden = false;
      section.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      const card = root.closest(".card");
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top < 60) window.scrollTo(0, window.scrollY + rect.top - 64);
      }
    }
  }


  function parseRoute() {
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    const parts = raw.split("/").filter(Boolean);
    if (parts[0] === "view" && parts[1] && parts[2]) {
      return { view: "viewer", date: parts[1], track: parts[2] };
    }
    if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
      return { view: "viewer", date: parts[0], track: parts[1] };
    }
    return { view: "list" };
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

  function renderList() {
    const main = document.getElementById("main");
    main.classList.remove("viewer-mode");
    const latest = DATA.latest_date || (DATA.days[0] && DATA.days[0].date) || "";
    const generated = DATA.generated_at
      ? DATA.generated_at.replace("T", " ").slice(0, 16)
      : "";

    const cards = DATA.days
      .map(function (day) {
        const isLatest = day.date === latest;
        const chips = TRACKS.map(function (t) {
          if (day.tracks.indexOf(t) !== -1) {
            return (
              '<a class="track-chip" href="' +
              viewHash(day.date, t) +
              '">' +
              escapeHtml(TRACK_LABELS[t]) +
              "</a>"
            );
          }
          return (
            '<span class="track-chip missing" title="No report">' +
            escapeHtml(TRACK_LABELS[t]) +
            "</span>"
          );
        }).join("");

        return (
          '<article class="day-card' +
          (isLatest ? " is-latest" : "") +
          '">' +
          '<div class="day-date-block">' +
          '<h2 class="day-date">' +
          escapeHtml(day.date) +
          "</h2>" +
          '<div class="day-weekday">' +
          escapeHtml(weekdayChinese(day.date)) +
          "</div>" +
          (isLatest ? '<span class="day-latest-tag">Latest</span>' : "") +
          "</div>" +
          '<div class="track-chips">' +
          chips +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    main.innerHTML =
      '<div class="pages-hero">' +
      "<h1>Reports</h1>" +
      "<p>每日论文追踪 · Retrieval / Personalization / Generative / Agentic / Infra</p>" +
      '<p class="pages-meta">共 <strong>' +
      DATA.day_count +
      "</strong> 天 · 最新 <strong>" +
      escapeHtml(latest) +
      "</strong>" +
      (generated ? " · 生成于 " + escapeHtml(generated) : "") +
      "</p>" +
      "</div>" +
      (DATA.days.length
        ? '<section class="day-list" aria-label="日报列表">' + cards + "</section>"
        : '<div class="empty-state"><span class="icon">📰</span><h3>No reports yet</h3><p>No report_data.json files found.</p></div>') +
      '<footer class="pages-footer">Static GitHub Pages preview · native-style cards from report_data.json</footer>';
  }

  function renderViewerShell(date, track, bodyHtml) {
    const main = document.getElementById("main");
    main.classList.add("viewer-mode");
    const day = DATA.days.find(function (d) {
      return d.date === date;
    });
    const available = day ? day.tracks : [];
    const safeTrack = available.indexOf(track) !== -1 ? track : available[0] || track;

    const tabs = TRACKS.map(function (t) {
      const has = available.indexOf(t) !== -1;
      if (!has) {
        return (
          '<button class="track-tab missing" type="button" disabled>' +
          escapeHtml(TRACK_LABELS[t]) +
          "</button>"
        );
      }
      return (
        '<a class="track-tab' +
        (t === safeTrack ? " active" : "") +
        '" href="' +
        viewHash(date, t) +
        '">' +
        escapeHtml(TRACK_LABELS[t]) +
        "</a>"
      );
    }).join("");

    const raw = reportHtmlHref(date, safeTrack);
    main.innerHTML =
      '<div class="viewer-shell">' +
      '<div class="viewer-toolbar">' +
      '<a class="viewer-back" href="#/">‹ Back to Reports</a>' +
      '<div class="date-nav">' +
      '<div class="date-label">' +
      escapeHtml(date) +
      '<span class="date-weekday">(' +
      escapeHtml(weekdayChinese(date)) +
      ")</span>" +
      "</div>" +
      "</div>" +
      '<div class="track-tabs">' +
      tabs +
      "</div>" +
      '<div style="text-align:center;margin:-8px 0 12px">' +
      '<a class="open-raw" href="' +
      raw +
      '" target="_blank" rel="noopener">Open standalone report.html ↗</a>' +
      "</div>" +
      "</div>" +
      '<div class="viewer-report-body" id="report-body">' +
      bodyHtml +
      "</div>" +
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

  function renderViewer(date, track) {
    const day = DATA.days.find(function (d) {
      return d.date === date;
    });
    const available = day ? day.tracks : [];
    const safeTrack = available.indexOf(track) !== -1 ? track : available[0] || track;

    renderViewerShell(
      date,
      safeTrack,
      '<div class="empty-state"><span class="spinner"></span></div>'
    );

    loadReport(date, safeTrack)
      .then(function (report) {
        // Ensure route still matches (user may have switched tabs quickly)
        const route = parseRoute();
        if (route.view !== "viewer" || route.date !== date) return;
        const curTrack =
          DATA.days.find(function (d) {
            return d.date === date;
          }) || day;
        const avail = curTrack ? curTrack.tracks : available;
        const still =
          avail.indexOf(route.track) !== -1 ? route.track : safeTrack;
        if (still !== safeTrack) return;
        renderViewerShell(date, safeTrack, renderReportBody(report));
      })
      .catch(function (err) {
        renderViewerShell(
          date,
          safeTrack,
          '<div class="empty-state"><h3>Failed to load report</h3><p>' +
            escapeHtml(String(err)) +
            "</p><p><a class=\"open-raw\" href=\"" +
            escapeHtml(reportHtmlHref(date, safeTrack)) +
            '">Try standalone report.html</a></p></div>'
        );
      });
  }

  function render() {
    const route = parseRoute();
    const nav = document.getElementById("nav-reports");
    if (nav) nav.classList.add("active");
    if (route.view === "viewer") renderViewer(route.date, route.track);
    else renderList();
  }

  function boot() {
    fetch("data.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("data.json " + res.status);
        return res.json();
      })
      .then(function (json) {
        DATA = json;
        const badge = document.getElementById("pages-badge");
        if (badge && DATA.latest_date) {
          badge.textContent = "Static · " + DATA.latest_date;
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
    }
  });

  boot();
})();
