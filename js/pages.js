(function () {
  "use strict";
  // Paper Daily static SPA — design direction C "Newsletter / magazine" (2026-10-10).
  // Display order everywhere (user preference); data.json "tracks" overrides at boot.
  let TRACKS = ["personalization", "generative", "retrieval", "agentic", "infra"];
  let TRACK_LABELS = {
    personalization: "Personalization", generative: "Generative", retrieval: "Retrieval",
    agentic: "Agentic", infra: "Infra",
  };
  let TRACK_ZH = {
    personalization: "个性化推荐", generative: "生成式推荐", retrieval: "检索与RAG",
    agentic: "智能体搜索", infra: "系统与索引",
  };
  const SOURCE_LABELS = {
    arxiv: "arXiv", huggingface: "HuggingFace", semantic_scholar: "Semantic Scholar",
    conference_papers: "Conference", github: "GitHub", web_search: "Web Search", blog_rss: "Blog",
  };
  const DIMS = [
    ["business_relevance", "Relevance", "相关"], ["technical_novelty", "Novelty", "新颖"],
    ["practicality", "Practical", "实用"], ["evidence_quality", "Evidence", "证据"],
    ["timeliness", "Timely", "时效"],
  ];
  const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];

  let DATA = { days: [], day_count: 0, latest_date: null, generated_at: "" };
  let reportCache = {};

  // ---------- small helpers ----------
  // ==text== -> key-info highlight (bold + accent); apply after escaping
  function hlText(s) { return String(s).replace(/==(?=\S)(.+?)(?<=\S)==/g, '<strong class="hl">$1</strong>'); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function num(v) {
    const n = Number(v);
    return v === null || v === undefined || v === "" || !isFinite(n) ? null : n;
  }
  function fmt2(v) { const n = num(v); return n === null ? "-" : n.toFixed(2); }
  function pad2(v) { const n = parseInt(v, 10); return isNaN(n) ? escapeHtml(v) : (n < 10 ? "0" + n : String(n)); }
  function weekdayChinese(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return Number.isNaN(d.getTime()) ? "" : "周" + WEEKDAY_ZH[d.getDay()];
  }
  function dateLine(d) {
    if (!d || d.length !== 10) return escapeHtml(d || "");
    return d.slice(0, 4) + " 年 " + d.slice(5, 7) + " 月 " + d.slice(8, 10) + " 日 " + weekdayChinese(d);
  }
  function trackClass(t) { return "t-" + String(t || "").toLowerCase().replace(/[^a-z0-9_-]/g, ""); }
  function trackLabel(t) { return TRACK_LABELS[t] || t; }
  function sourceLabel(src) { return SOURCE_LABELS[src] || src || "Unknown"; }
  function truncate(text, n) { const t = String(text || ""); return t.length <= n ? t : t.slice(0, n) + "..."; }
  function companiesOf(p) {
    let c = p.company || [];
    if (typeof c === "string") c = [c];
    return c.filter(Boolean).map(String);
  }
  function compHtml(p, max) {
    const L = (p.company_logos && p.company_logos.length) ? p.company_logos
      : companiesOf(p).map(function (n) { return { name: n, logo: null, hue: 210 }; });
    return L.slice(0, max || 99).map(function (c) {
      const icon = c.logo
        ? '<img class="clogo" src="' + escapeHtml(c.logo) + '" alt="" width="16" height="16" loading="lazy" decoding="async" onerror="this.remove()">'
        : '<span class="clogo mono" style="--h:' + (Number(c.hue) || 0) + '" aria-hidden="true">' + escapeHtml(String(c.name || "?").trim().charAt(0).toUpperCase()) + "</span>";
      return '<span class="cname">' + icon + escapeHtml(c.name) + "</span>";
    });
  }
  function linkLabel(p) {
    const url = String(p.url || "");
    if (url.indexOf("arxiv.org") !== -1) return "arXiv";
    return p.source ? sourceLabel(p.source) : "原文";
  }
  function dots(v) {
    const r = Math.round(num(v) || 0);
    let s = '<span class="dots" aria-hidden="true">';
    for (let i = 1; i <= 5; i++) s += '<i class="' + (i <= r ? "" : "e") + '"></i>';
    return s + "</span>";
  }
  function dimLine(sc) {
    if (!sc || typeof sc !== "object" || !Object.keys(sc).length) return "";
    return DIMS.map(function (d) { return d[1] + " " + escapeHtml(sc[d[0]] != null ? sc[d[0]] : "-"); }).join(" · ");
  }
  // 5-dim radar from the paper's real 1–5 scores (same geometry as magazine.radar_svg).
  function radarSvg(sc, size) {
    if (!sc || typeof sc !== "object" || !DIMS.some(function (d) { return num(sc[d[0]]) !== null; })) return "";
    const c = size / 2, r = size / 2 - 22;
    const pt = function (i, v) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      return [Math.round((c + Math.cos(a) * r * v) * 100) / 100, Math.round((c + Math.sin(a) * r * v) * 100) / 100];
    };
    let g = "";
    [0.4, 0.6, 0.8, 1].forEach(function (v) {
      g += '<polygon class="rg" points="' + [0, 1, 2, 3, 4].map(function (i) { return pt(i, v).join(","); }).join(" ") + '"/>';
    });
    const poly = DIMS.map(function (d, i) {
      const v = num(sc[d[0]]);
      return pt(i, Math.max(0, Math.min(5, v || 0)) / 5).join(",");
    }).join(" ");
    const lab = DIMS.map(function (d, i) {
      const p = pt(i, 1.22);
      return '<text x="' + p[0] + '" y="' + (Math.round((p[1] + 3) * 100) / 100) + '" text-anchor="middle">' + d[2] + " " +
        escapeHtml(sc[d[0]] != null ? sc[d[0]] : "-") + "</text>";
    }).join("");
    const aria = DIMS.map(function (d) { return d[1] + " " + (sc[d[0]] != null ? sc[d[0]] : "-"); }).join("，");
    return '<svg class="radar" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size +
      '" role="img" aria-label="五维评分：' + escapeHtml(aria) + '">' + g + '<polygon class="rp" points="' + poly + '"/>' + lab + "</svg>";
  }
  function xpBlock(inner, cls) {
    return '<div class="xp ' + (cls || "") + '"><div class="xp-body">' + inner +
      '</div><button type="button" class="xp-btn" aria-expanded="false">展开全文 &#9662;</button></div>';
  }
  function measureXp(root) {
    (root || document).querySelectorAll(".xp").forEach(function (x) {
      if (x.classList.contains("open")) return;
      const b = x.querySelector(".xp-body");
      if (b) x.classList.toggle("can", b.scrollHeight > b.clientHeight + 2);
    });
  }
  function readingMinutes(dr) {
    if (dr.minutes) return dr.minutes;
    const t = String(dr.content_html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
    return t.length ? Math.ceil(t.length / 400) : 0;
  }

  // ---------- inline deep reading (expand / collapse + 独立页面阅读) ----------

  function fixFigs(html) {
    const root = (document.documentElement.getAttribute("data-root") || "");
    if (!root) return html;
    return String(html).replace(/(<img data-fig="1" src=")(figs\/)/g, "$1" + root + "$2");
  }

  function renderDeepRead(paper) {
    const dr = paper && paper.deep_reading;
    if (!dr || dr.status !== "completed") return "";
    const htmlBody = fixFigs(dr.content_html || "");
    if (!htmlBody) return "";
    const rawPid = paper.id || dr.paper_id || "";
    const domId = String(rawPid).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "x";
    const pageLink = dr.slug
      ? '<a class="deep-read-page-link" href="deep-readings/' + encodeURIComponent(dr.slug) + '.html">独立页面阅读 &#8599;</a>'
      : "";
    const mins = readingMinutes(dr);
    return (
      '<div class="deep-read-inline deep-read-has-content" data-deep-read data-paper-id="' + escapeHtml(rawPid) +
      '" id="dr-' + escapeHtml(domId) + '">' +
      '<div class="deep-read-toggle-row">' +
      '<button type="button" class="deep-read-trigger completed" data-deep-toggle aria-expanded="false">' +
      '<span class="deep-read-trigger-icon">&#9660;</span><span>&#128214; 展开深度解读' + (mins ? " · " + mins + " 分钟" : "") + "</span>" +
      "</button>" + pageLink + "</div>" +
      '<div class="deep-read-section" hidden><div class="deep-read-header-bar">' +
      '<button type="button" class="deep-read-trigger expanded" data-deep-collapse>' +
      '<span class="deep-read-trigger-icon">&#9650;</span><span>收起深度解读</span></button>' + pageLink + "</div>" +
      '<div class="deep-read-content">' + htmlBody + "</div></div></div>"
    );
  }

  function setDeepReadExpanded(root, open) {
    if (!root) return;
    const btn = root.querySelector("[data-deep-toggle]");
    const section = root.querySelector(".deep-read-section");
    if (!btn || !section) return;
    const row = btn.closest(".deep-read-toggle-row") || btn;
    const card = root.closest("[data-card]");
    if (open) {
      row.hidden = true;
      section.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      if (card) card.classList.add("dr-open");
    } else {
      row.hidden = false;
      section.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (card) {
        card.classList.remove("dr-open");
        const rect = card.getBoundingClientRect();
        if (rect.top < 60) window.scrollTo(0, window.scrollY + rect.top - 64);
      }
    }
  }

  // ---------- routes ----------
  //   #/  |  #/reports  |  #/view/<date>/<track>  |  #/view/<date>  |  #/<date>/<track>
  //   #/reports/<date>[/<track>]  (native-style alias)   |  #/archive  (往期: latest day, picker open)
  //   #/weekly  |  #/weekly/<week-monday>  |  #/weekly/<week-monday>/<track>  |  #/weekly/<track>
  //   optional "?p=<paper id>" on a day view scrolls to / highlights that paper card.
  function parseRoute() {
    const full = (location.hash || "#/").replace(/^#/, "");
    const qi = full.indexOf("?");
    const raw = (qi >= 0 ? full.slice(0, qi) : full) || "/";
    let focus = null;
    if (qi >= 0) {
      full.slice(qi + 1).split("&").forEach(function (kv) {
        const i = kv.indexOf("=");
        if (i > 0 && kv.slice(0, i) === "p") {
          try { focus = decodeURIComponent(kv.slice(i + 1)); } catch (e) { focus = kv.slice(i + 1); }
        }
      });
    }
    const parts = raw.split("/").filter(Boolean);
    const isDate = function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ""); };
    if (parts[0] === "weekly") {
      return { weekly: true, week: isDate(parts[1]) ? parts[1] : null, track: (isDate(parts[1]) ? parts[2] : parts[1]) || null };
    }
    if (parts[0] === "archive") return { date: null, track: null, archive: true };
    if ((parts[0] === "view" || parts[0] === "reports") && isDate(parts[1])) {
      return { date: parts[1], track: parts[2] || null, focus: focus };
    }
    if (isDate(parts[0])) return { date: parts[0], track: parts[1] || null, focus: focus };
    return { date: null, track: null };
  }
  function reportDataHref(date, track) { return "reports/" + date + "/" + track + "/report_data.json"; }
  function reportHtmlHref(date, track) { return "reports/" + date + "/" + track + "/report.html"; }
  function viewHash(date, track) { return "#/view/" + date + "/" + track; }

  // ---------- day report body (lead story + cards + other tracks + 开源雷达) ----------
  function pidOf(p, i) { return String(p.id || "p" + i); }

  function insightInner(p) {
    let s = "";
    if (p.key_insight) s += '<p><b class="lab">INSIGHT</b>' + hlText(escapeHtml(p.key_insight)) + "</p>";
    if (p.business_connection) s += '<p><b class="lab">业务关联</b>' + escapeHtml(p.business_connection) + "</p>";
    if (p.evidence) s += '<p><b class="lab">证据</b>' + escapeHtml(p.evidence) + "</p>";
    return s;
  }

  function renderLead(p, i, track) {
    const pid = pidOf(p, i);
    const comp = companiesOf(p);
    const dr = p.deep_reading && p.deep_reading.status === "completed" ? p.deep_reading : null;
    let btns = "";
    if (dr && dr.slug) {
      const m = readingMinutes(dr);
      btns += '<a class="btn w" href="deep-readings/' + encodeURIComponent(dr.slug) + '.html">&#128214; 深度解读' + (m ? " · " + m + " 分钟" : "") + "</a>";
    }
    if (p.url) btns += '<a class="btn ghost" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(linkLabel(p)) + " &#8599;</a>";
    const adj = num(p.adjusted_score);
    let more = "";
    if (p.business_connection) more += '<span class="more"><b>业务关联</b> ' + escapeHtml(p.business_connection) + "</span>";
    if (p.evidence) more += '<span class="more"><b>证据</b> ' + escapeHtml(p.evidence) + "</span>";
    const pq = p.key_insight || more
      ? '<div class="pq"><small>KEY INSIGHT · 对业务意味着什么</small>' + hlText(escapeHtml(p.key_insight || "")) + more + "</div>" : "";
    const foot = [truncate(p.authors, 90), p.published, sourceLabel(p.source)].filter(Boolean).map(escapeHtml).join(" · ");
    const deep = dr ? renderDeepRead(p) : "";
    return (
      '<section class="lead ' + trackClass(track) + '" id="paper-' + escapeHtml(pid) + '" data-paper-id="' + escapeHtml(pid) + '" data-card>' +
      '<div class="art" data-n="' + pad2(p.rank || i + 1) + '"><div>' +
      '<div class="k">LEAD STORY · 今日必读' + (comp.length ? " · " + compHtml(p, 3).join(" / ") : "") + "</div>" +
      '<h2><a href="' + escapeHtml(p.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(p.title || "Untitled") + "</a></h2>" +
      "<p>" + hlText(escapeHtml(p.summary || "")) + "</p></div>" +
      '<div class="btns">' + btns + "</div></div>" +
      '<div class="side"><div class="ring">' + radarSvg(p.scores, 170) +
      '<div><div class="big">' + fmt2(p.total_score) + '</div><div class="lbl">综合分 / 5' + (adj !== null ? "<br>偏好调整 " + fmt2(adj) : "") + "</div></div></div>" +
      pq + '<div class="foot">' + foot + "</div></div>" +
      (deep ? '<div class="lead-dr">' + deep + "</div>" : "") +
      "</section>"
    );
  }

  function renderCard(p, i, track) {
    const pid = pidOf(p, i);
    const dr = p.deep_reading && p.deep_reading.status === "completed" ? p.deep_reading : null;
    let chips = compHtml(p).map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
    if (dr) { const m = readingMinutes(dr); chips += '<span class="chip deep">&#128214; 有深读' + (m ? " · " + m + " 分钟" : "") + "</span>"; }
    const ins = insightInner(p);
    let foot = "<span>" + escapeHtml(sourceLabel(p.source)) + "</span>";
    if (p.published) foot += "<span>·</span><span>" + escapeHtml(p.published) + "</span>";
    const dl = dimLine(p.scores);
    if (dl) foot += '<span>·</span><span class="score-detail">' + dl + "</span>";
    return (
      '<article class="card ' + trackClass(track) + '" id="paper-' + escapeHtml(pid) + '" data-paper-id="' + escapeHtml(pid) + '" data-card>' +
      '<div class="top"><span class="n">' + pad2(p.rank || i + 1) + '</span><span class="sb" title="综合分">' + dots(p.total_score) + " " + fmt2(p.total_score) + "</span></div>" +
      '<h4><a href="' + escapeHtml(p.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(p.title || "Untitled") + "</a></h4>" +
      (chips ? "<div>" + chips + "</div>" : "") +
      (p.summary ? "<p>" + hlText(escapeHtml(p.summary)) + "</p>" : "") +
      (ins ? '<div class="ins">' + xpBlock(ins) + "</div>" : "") +
      (p.authors ? '<div class="foot">' + escapeHtml(truncate(p.authors, 100)) + "</div>" : "") +
      '<div class="foot">' + foot + "</div>" +
      renderDeepRead(p) +
      "</article>"
    );
  }

  function renderCode(project) {
    const rm = project.retrieval_meta && typeof project.retrieval_meta === "object" ? project.retrieval_meta : {};
    const name = rm.full_name || project.title || project.name || "Untitled";
    const desc = project.description || "";
    const pid = String(project.id || "");
    const src = project.source === "huggingface" || pid.indexOf("hf_") === 0 ? "HuggingFace" : "GitHub";
    const bits = [project.language, project.stars != null ? "★ " + project.stars : "", project.created_at, src].filter(Boolean);
    return '<a href="' + escapeHtml(project.url || "#") + '" target="_blank" rel="noopener" title="' + escapeHtml(desc) + '"><b>' +
      escapeHtml(name) + '</b><span class="cd">' + escapeHtml(desc) + '</span><span class="foot">' + bits.map(escapeHtml).join(" · ") + "</span></a>";
  }

  function renderOther(r) {
    const day = DATA.days[r.idx];
    const meta = day.meta || {};
    const others = r.tracks.filter(function (t) { return t !== r.track; });
    if (!others.length) return "";
    return '<div class="secT"><h3>其他赛道今日</h3><span>点击切换</span></div><div class="other">' +
      others.map(function (t) {
        const c = meta[t] && meta[t].papers_selected != null ? meta[t].papers_selected : "-";
        return '<a class="ot ' + trackClass(t) + '" data-track="' + escapeHtml(t) + '" href="' + viewHash(r.date, t) + '"><b>' + escapeHtml(trackLabel(t)) +
          "</b><div>" + escapeHtml(c) + '</div><span class="os">' + escapeHtml(TRACK_ZH[t] || "") + " · 篇入选</span></a>";
      }).join("") + "</div>";
  }

  function renderReportBody(report, r) {
    const papers = report.papers || [];
    const projects = report.code_projects || [];
    const stats = report.stats || {};
    const track = r.track;
    let out = "";
    const st = [];
    if (stats.papers_scored != null) st.push("评分 " + escapeHtml(stats.papers_scored) + " 篇");
    st.push("入选 " + papers.length + " 篇");
    if (stats.score_max != null) st.push("分数 " + fmt2(stats.score_min) + " – " + fmt2(stats.score_max));
    out += '<p class="scen"><b>今日场景</b>' + escapeHtml(report.scenario || "") + ' <span class="sc-stat">— ' + st.join("，") + "</span></p>";
    if (papers.length > 1) {
      out += '<details class="issue-toc"><summary>本期目录 · ' + papers.length + " 篇</summary><ol>" +
        papers.map(function (p, i) {
          return '<li><a class="outline-paper" href="#paper-' + escapeHtml(pidOf(p, i)) + '" title="' + escapeHtml(p.title) + '"><i>' +
            pad2(i + 1) + "</i><span>" + escapeHtml(p.title || "Untitled") + "</span></a></li>";
        }).join("") + "</ol></details>";
    }
    if (!papers.length) {
      out += '<div class="empty-state"><span class="icon">&#128237;</span><h3>本期无入选论文</h3><p>该方向当日没有入选论文。</p></div>';
    } else {
      out += renderLead(papers[0], 0, track);
      if (papers.length > 1) {
        out += '<div class="secT"><h3>今日其余入选</h3><span>' + (papers.length - 1) + " 篇 · 按综合排名</span></div>" +
          '<div class="grid">' + papers.slice(1).map(function (p, i) { return renderCard(p, i + 1, track); }).join("") + "</div>";
      }
    }
    out += renderOther(r);
    if (projects.length) {
      out += '<div class="secT"><h3>开源雷达</h3><span>GitHub / HuggingFace 热门 · ' + projects.length + " 个项目</span></div>" +
        '<div class="codes">' + projects.map(renderCode).join("") + "</div>";
    }
    return out;
  }

  // ---------- day view (往期 date navigator + track ribbon) ----------
  const state = { view: "daily", date: null, week: null, track: null, pickerOpen: false };

  function orderTracks(list) {
    return (list || []).slice().sort(function (a, b) {
      const ia = TRACKS.indexOf(a), ib = TRACKS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
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
  function issueNo(idx) { return DATA.days.length - idx; } // counted from the oldest day; latest = day_count

  function setMast(left, right) {
    const a = document.getElementById("mast-issue"), b = document.getElementById("mast-date");
    if (a) a.textContent = left;
    if (b) b.textContent = right;
  }
  function setBodyTrack(track) {
    document.body.className = document.body.className.replace(/\bt-[a-z0-9_-]+\b/g, "").trim() + " " + trackClass(track);
  }

  function renderDateNav(r) {
    const n = DATA.days.length;
    const oldest = DATA.days[n - 1].date;
    const latest = DATA.days[0].date;
    const items = DATA.days.map(function (d) {
      const badges = orderTracks(d.tracks).map(function (t) {
        return '<span class="dp-track-badge ' + trackClass(t) + '">' + escapeHtml(trackLabel(t)) + "</span>";
      }).join("");
      return '<li class="date-picker-item' + (d.date === r.date ? " active" : "") + '" data-date="' + escapeHtml(d.date) +
        '" tabindex="0" role="option"><span class="dp-date">' + escapeHtml(d.date) + '</span><span class="dp-weekday">' +
        escapeHtml(weekdayChinese(d.date)) + '</span><span class="dp-tracks">' + badges + "</span></li>";
    }).join("");
    return (
      '<div class="date-nav" id="date-nav">' +
      '<button class="date-nav-btn" type="button" data-date-prev title="前一天 (更早)" aria-label="前一天"' + (r.idx >= n - 1 ? " disabled" : "") + ">&#8249;</button>" +
      '<div class="date-label" id="date-label" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="' +
      (state.pickerOpen ? "true" : "false") + '" title="往期：选择日期">' +
      "<span>" + escapeHtml(r.date) + "</span>" +
      '<span class="date-weekday">(' + escapeHtml(weekdayChinese(r.date)) + ")</span>" +
      '<span class="date-caret' + (state.pickerOpen ? " open" : "") + '">&#9660;</span>' +
      (r.idx === 0 ? '<span class="date-latest-tag">最新</span>' : "") + "</div>" +
      '<button class="date-nav-btn" type="button" data-date-next title="后一天 (更新)" aria-label="后一天"' + (r.idx <= 0 ? " disabled" : "") + ">&#8250;</button>" +
      '<div class="date-picker-dropdown" id="date-picker"' + (state.pickerOpen ? "" : " hidden") + ">" +
      '<div class="date-picker-jump"><input type="date" id="date-jump" value="' + escapeHtml(r.date) + '" min="' + escapeHtml(oldest) +
      '" max="' + escapeHtml(latest) + '" aria-label="跳转日期"><button type="button" data-date-go>Go</button></div>' +
      '<div class="date-picker-count">往期 · ' + n + " 天有日报（无日报的日期自动跳到最近一期）</div>" +
      '<ul class="date-picker-list" role="listbox">' + items + "</ul></div></div>"
    );
  }

  function renderShell(r) {
    const main = document.getElementById("main");
    const day = DATA.days[r.idx];
    const meta = day.meta || {};
    const tabs = r.tracks.map(function (t) {
      const c = meta[t] && meta[t].papers_selected != null ? meta[t].papers_selected : "-";
      return '<a class="track-tab ' + trackClass(t) + (t === r.track ? " active" : "") + '" data-track="' + escapeHtml(t) +
        '" href="' + viewHash(r.date, t) + '"' + (t === r.track ? ' aria-current="page"' : "") + "><b>" + escapeHtml(trackLabel(t)) +
        '</b><span class="rs">' + escapeHtml(TRACK_ZH[t] || "") + " · <em>" + escapeHtml(c) + "</em> 篇</span></a>";
    }).join("");
    main.innerHTML =
      '<div class="issue-bar"><div class="ib-info"><b>第 ' + issueNo(r.idx) + " 期</b> · " + escapeHtml(dateLine(r.date)) +
      " · " + r.tracks.length + " 个方向</div>" + renderDateNav(r) + "</div>" +
      (r.notice ? '<div class="pages-notice">' + escapeHtml(r.notice) + "</div>" : "") +
      '<div class="ribbon track-tabs" role="tablist">' + tabs + "</div>" +
      '<div id="report-body"><div class="empty-state"><span class="spinner"></span></div></div>' +
      '<div class="weekly-rule"><a class="open-raw" href="' + reportHtmlHref(r.date, r.track) +
      '" target="_blank" rel="noopener">独立报告页 report.html &#8599;</a> · <a class="open-raw" href="deep-readings/index.html">&#128214; 深度解读' +
      (DATA.deep_reading_entries ? " " + DATA.deep_reading_entries + " 篇" : "") + " &#8594;</a></div>";
    setMast("第 " + issueNo(r.idx) + " 期", dateLine(r.date));
    setBodyTrack(r.track);
  }

  function loadReport(date, track) {
    const key = date + "/" + track;
    if (reportCache[key]) return Promise.resolve(reportCache[key]);
    return fetch(reportDataHref(date, track), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("report_data.json " + res.status);
      return res.json().then(function (json) { reportCache[key] = json; return json; });
    });
  }

  let renderSeq = 0;
  function setNavActive(which) {
    [["nav-reports", "reports"], ["nav-weekly", "weekly"], ["nav-archive", "archive"]].forEach(function (x) {
      const el = document.getElementById(x[0]);
      if (el) el.classList.toggle("active", which === x[1]);
    });
  }

  // Per-view document title / description (hash routes share one URL; static tags describe the home page).
  const HOME_TITLE = document.title;
  const descEl = document.querySelector('meta[name="description"]');
  const HOME_DESC = descEl ? descEl.getAttribute("content") : "";
  function setDocMeta(route) {
    let t = HOME_TITLE, d = HOME_DESC;
    if (route.weekly) {
      t = "周榜 Weekly Top " + (DATA.weekly_top_n || 10) + (route.week ? " · " + route.week + " 周" : "") + " | Paper Daily";
      d = "Paper Daily 周榜：按周汇总搜索、推荐与 GenAI 各方向日报入选论文，按偏好调整分排序、去重后的每周 Top " +
        (DATA.weekly_top_n || 10) + "，附深度解读链接。";
    } else if (route.archive) {
      t = "往期日报 · " + (DATA.days || []).length + " 期 | Paper Daily";
    } else if (route.date) {
      t = route.date + (route.track ? " " + trackLabel(route.track) : "") + " 论文日报 | Paper Daily";
    }
    document.title = t;
    if (descEl) descEl.setAttribute("content", d);
  }

  function render() {
    const route = parseRoute();
    try { setDocMeta(route); } catch (e) { /* never block rendering */ }
    if (route.weekly) {
      setNavActive("weekly");
      renderWeekly(route);
      return;
    }
    setNavActive(route.archive ? "archive" : "reports");
    if (!DATA.days.length) {
      document.getElementById("main").innerHTML =
        '<div class="empty-state"><span class="icon">📰</span><h3>No reports yet</h3><p>No report_data.json files found.</p></div>';
      return;
    }
    const r = resolve(route);
    state.view = "daily";
    state.date = r.date;
    state.track = r.track;
    state.pickerOpen = false;
    renderShell(r);
    if (route.archive) setPicker(true);
    const seq = ++renderSeq;
    loadReport(r.date, r.track)
      .then(function (report) {
        if (seq !== renderSeq) return; // user switched again meanwhile
        const body = document.getElementById("report-body");
        body.innerHTML = renderReportBody(report, r);
        measureXp(body);
        if (route.focus) focusPaper(route.focus);
      })
      .catch(function (err) {
        if (seq !== renderSeq) return;
        document.getElementById("report-body").innerHTML =
          '<div class="empty-state"><h3>Failed to load report</h3><p>' + escapeHtml(String(err)) +
          '</p><p><a class="open-raw" href="' + escapeHtml(reportHtmlHref(r.date, r.track)) + '">Try standalone report.html</a></p></div>';
      });
    // Warm the cache for the neighbouring (older) day so prev-clicks feel instant.
    const older = DATA.days[r.idx + 1];
    if (older) loadReport(older.date, orderTracks(older.tracks)[0]).catch(function () {});
  }

  // Scroll to (and briefly highlight) a paper card on a day view: #/view/<date>/<track>?p=<id>
  function focusPaper(pid) {
    const el = document.getElementById("paper-" + pid);
    if (!el) return;
    el.classList.add("weekly-focus");
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 72);
    setTimeout(function () { el.classList.remove("weekly-focus"); }, 2400);
  }

  // ---------- 周榜 (weekly ranking) ----------
  // Precomputed at build time (weekly/<monday>.json, index in data.json "weeks"):
  // Mon–Sun weeks, per track dedupe by arXiv id / URL / title, adjusted_score desc then
  // total_score desc, top N papers. Top 3 = gold/silver/bronze podium, then ranked list.
  let weekCache = {};
  function todayShanghai() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function weekInProgress(w) { const today = todayShanghai(); return w.week_start <= today && today <= w.week_end; }
  function weekRangeLabel(w) {
    const end = w.week_end.slice(0, 4) === w.week_start.slice(0, 4) ? w.week_end.slice(5) : w.week_end;
    return w.week_start + " ~ " + end;
  }
  function weekIndex(monday) {
    const ws = DATA.weeks || [];
    for (let i = 0; i < ws.length; i++) if (ws[i].week_start === monday) return i;
    return -1;
  }
  function weekIndexForDate(dateStr) {
    const ws = DATA.weeks || [];
    for (let i = 0; i < ws.length; i++) if (ws[i].week_start <= dateStr && dateStr <= ws[i].week_end) return i;
    const target = new Date(dateStr + "T00:00:00").getTime();
    let best = 0, bestDiff = Infinity;
    ws.forEach(function (w, i) {
      const diff = Math.abs(new Date(w.week_start + "T00:00:00").getTime() - target);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });
    return best;
  }
  function weeklyHash(monday, track) { return "#/weekly/" + monday + "/" + track; }
  function goWeek(i) {
    const w = (DATA.weeks || [])[i];
    if (!w) return;
    const h = weeklyHash(w.week_start, state.track && TRACKS.indexOf(state.track) !== -1 ? state.track : TRACKS[0]);
    if (location.hash === h) render();
    else location.hash = h;
  }
  function resolveWeek(route) {
    const ws = DATA.weeks || [];
    let idx = 0, notice = "";
    if (route.week) {
      idx = weekIndex(route.week);
      if (idx < 0) {
        idx = weekIndexForDate(route.week);
        notice = route.week + " 所在周没有日报，已显示 " + weekRangeLabel(ws[idx]);
      }
    }
    let track = TRACKS[0];
    if (route.track) {
      if (TRACKS.indexOf(route.track) !== -1) track = route.track;
      else if (!notice) notice = "未知方向 " + route.track + "，已显示 " + trackLabel(track);
    }
    return { idx: idx, week: ws[idx], track: track, notice: notice };
  }

  function renderWeekNav(r) {
    const ws = DATA.weeks;
    const n = ws.length;
    const w = r.week;
    const items = ws.map(function (x) {
      const live = weekInProgress(x);
      return '<li class="date-picker-item' + (x.week_start === w.week_start ? " active" : "") + '" data-week="' + escapeHtml(x.week_start) +
        '" tabindex="0" role="option"><span class="dp-date">' + escapeHtml(weekRangeLabel(x)) + '</span><span class="dp-weekday">第' +
        escapeHtml(x.iso_week) + '周</span><span class="dp-tracks"><span class="dp-track-badge">' + escapeHtml(x.day_count) + " 天日报</span>" +
        (live ? '<span class="dp-track-badge weekly-live-badge">进行中</span>' : "") + "</span></li>";
    }).join("");
    const live = weekInProgress(w);
    return (
      '<div class="date-nav weekly-nav" id="date-nav">' +
      '<button class="date-nav-btn" type="button" data-week-prev title="上一周 (更早)" aria-label="上一周"' + (r.idx >= n - 1 ? " disabled" : "") + ">&#8249;</button>" +
      '<div class="date-label" id="date-label" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="' +
      (state.pickerOpen ? "true" : "false") + '" title="选择周">' +
      '<span class="weekly-range">' + escapeHtml(weekRangeLabel(w)) + "</span>" +
      '<span class="date-weekday">(第' + escapeHtml(w.iso_week) + "周)</span>" +
      '<span class="date-caret' + (state.pickerOpen ? " open" : "") + '">&#9660;</span>' +
      (live ? '<span class="date-latest-tag weekly-live-tag">进行中</span>' : r.idx === 0 ? '<span class="date-latest-tag">最新</span>' : "") +
      "</div>" +
      '<button class="date-nav-btn" type="button" data-week-next title="下一周 (更新)" aria-label="下一周"' + (r.idx <= 0 ? " disabled" : "") + ">&#8250;</button>" +
      '<div class="date-picker-dropdown" id="date-picker"' + (state.pickerOpen ? "" : " hidden") + ">" +
      '<div class="date-picker-jump"><input type="date" id="week-jump" value="' + escapeHtml(w.week_start) + '" min="' +
      escapeHtml(ws[n - 1].week_start) + '" max="' + escapeHtml(ws[0].week_end) + '" aria-label="跳转到某天所在周"><button type="button" data-week-go>Go</button></div>' +
      '<div class="date-picker-count">' + n + " 周有日报 · 周一至周日</div>" +
      '<ul class="date-picker-list" role="listbox">' + items + "</ul></div></div>"
    );
  }

  function renderWeeklyShell(r) {
    const main = document.getElementById("main");
    const counts = r.week.unique_counts || {};
    const tabs = TRACKS.map(function (t) {
      const c = counts[t] || 0;
      return '<a class="track-tab ' + trackClass(t) + (t === r.track ? " active" : "") + (c ? "" : " weekly-empty-tab") + '" data-track="' +
        escapeHtml(t) + '" href="' + weeklyHash(r.week.week_start, t) + '"><b>' + escapeHtml(trackLabel(t)) +
        '</b><span class="rs">本周去重 <em>' + escapeHtml(c) + "</em> 篇</span></a>";
    }).join("");
    const w = r.week;
    main.innerHTML =
      '<div class="wkhead"><div class="k">Weekly Top ' + escapeHtml(DATA.weekly_top_n || 10) + " · 第" + escapeHtml(w.iso_week) + "周</div>" +
      "<h2>" + escapeHtml(w.week_start.slice(5).replace("-", ".")) + "–" + escapeHtml(w.week_end.slice(5).replace("-", ".")) + "</h2>" +
      '<div class="wk-sel">' + renderWeekNav(r) + "</div>" +
      '<p id="wk-stats">' + escapeHtml(w.day_count) + " 期日报 · " + escapeHtml(trackLabel(r.track)) + " 本周去重 " + escapeHtml(counts[r.track] || 0) + " 篇 · 按偏好调整分</p></div>" +
      (r.notice ? '<div class="pages-notice">' + escapeHtml(r.notice) + "</div>" : "") +
      '<div class="ribbon track-tabs" role="tablist">' + tabs + "</div>" +
      '<div id="report-body"><div class="empty-state"><span class="spinner"></span></div></div>' +
      '<div class="weekly-rule">排序：adjusted_score（含偏好加分）降序，其次 total_score；按 arXiv id / URL / 标题去重 · ' +
      '<a class="open-raw" href="#/">今日 &#8594;</a> · <a class="open-raw" href="deep-readings/index.html">&#128214; 深度解读 &#8594;</a></div>';
    setMast("第 " + (DATA.days.length || DATA.day_count || "") + " 期", dateLine(DATA.latest_date || ""));
    setBodyTrack(r.track);
  }

  function shortDay(d) { return d.slice(5) + " " + weekdayChinese(d); }

  function weeklyParts(paper, track) {
    const pid = paper.id || "w" + paper.weekly_rank;
    let scoreLine = "Total " + fmt2(paper.total_score);
    if (paper.adjusted_score != null) {
      const bonus = num(paper.preference_bonus);
      scoreLine += " · 偏好 " + (bonus === null ? "-" : (bonus >= 0 ? "+" : "") + bonus.toFixed(2)) + " · Adjusted " + fmt2(paper.adjusted_score);
    }
    const apps = (paper.appearances || []).map(function (a) {
      return '<a href="' + viewHash(a.date, track) + "?p=" + encodeURIComponent(a.id || pid) + '">' + escapeHtml(shortDay(a.date)) +
        (a.rank != null ? " · 当日 #" + escapeHtml(a.rank) : "") + "</a>";
    }).join("");
    const dr = paper.deep_reading && paper.deep_reading.status === "completed" ? paper.deep_reading : null;
    let chips = compHtml(paper, 3).map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
    if (dr) { const m = readingMinutes(dr); chips += '<span class="chip deep">&#128214; 有深读' + (m ? " · " + m + " 分钟" : "") + "</span>"; }
    const dl = dimLine(paper.scores);
    const first = paper.best_date ? "首见 " + escapeHtml(shortDay(paper.best_date)) : "";
    return {
      pid: pid,
      chips: chips,
      scoreLine: '<div class="weekly-score-line">' + escapeHtml(scoreLine) + "</div>",
      meta: '<div class="foot">' + [first, escapeHtml(sourceLabel(paper.source)), paper.published ? escapeHtml(paper.published) : ""]
        .filter(Boolean).join(" · ") + (dl ? ' · <span class="score-detail">' + dl + "</span>" : "") + "</div>",
      apps: '<div class="dr-appearances weekly-appearances">出现于日报：' + apps + "</div>",
      title: '<a href="' + escapeHtml(paper.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(paper.title || "Untitled") + "</a>",
    };
  }

  function renderPodium(paper, track) {
    const k = weeklyParts(paper, track);
    const n = paper.weekly_rank;
    const ins = insightInner(paper);
    const sum = paper.summary ? (n === 1 ? "<p>" + hlText(escapeHtml(paper.summary)) + "</p>" : xpBlock("<p>" + hlText(escapeHtml(paper.summary)) + "</p>", "sum")) : "";
    return (
      '<div class="pod g' + n + " weekly-card " + trackClass(track) + '" id="paper-' + escapeHtml(k.pid) + '" data-paper-id="' + escapeHtml(k.pid) + '" data-card>' +
      '<div class="ph"><span class="medal m' + n + ' weekly-rank weekly-rank-' + n + '">' + n + '</span><span class="big badge" title="周榜排序分 (adjusted_score，缺失时为 total_score)">' +
      fmt2(paper.rank_score) + "</span></div>" +
      '<h4 class="card-title">' + k.title + "</h4>" +
      (k.chips ? "<div>" + k.chips + "</div>" : "") +
      '<div class="paper-body">' + sum + "</div>" +
      (ins ? '<div class="ins">' + xpBlock(ins) + "</div>" : "") +
      k.scoreLine + k.meta + k.apps + renderDeepRead(paper) + "</div>"
    );
  }

  function renderRow(paper, track) {
    const k = weeklyParts(paper, track);
    const ins = insightInner(paper);
    const body = (paper.summary ? "<p>" + hlText(escapeHtml(paper.summary)) + "</p>" : "") + ins;
    return (
      '<div class="rr weekly-card ' + trackClass(track) + '" id="paper-' + escapeHtml(k.pid) + '" data-paper-id="' + escapeHtml(k.pid) + '" data-card>' +
      '<span class="weekly-rank weekly-rank-' + escapeHtml(paper.weekly_rank) + '">' + escapeHtml(paper.weekly_rank) + "</span>" +
      '<div class="rr-body"><h5 class="card-title">' + k.title + "</h5>" +
      (k.chips ? "<div>" + k.chips + "</div>" : "") + k.meta +
      (body ? '<div class="paper-body">' + xpBlock(body, "sum") + "</div>" : "") +
      k.scoreLine + k.apps + renderDeepRead(paper) + "</div>" +
      '<span class="s badge" title="周榜排序分">' + fmt2(paper.rank_score) + "</span></div>"
    );
  }

  function renderWeeklyBody(r, wk) {
    const td = (wk.tracks || {})[r.track] || { papers: [], raw_count: 0, unique_count: 0, days: [] };
    const papers = td.papers || [];
    const stats = document.getElementById("wk-stats");
    if (stats) {
      stats.textContent = (td.days || []).length + " 期日报 · " + trackLabel(r.track) + " " + td.raw_count + " 条入选 → 去重 " +
        td.unique_count + " 篇 · 显示 Top " + papers.length + " · 按偏好调整分";
    }
    const dayLinks = (td.days || []).map(function (d) { return '<a href="' + viewHash(d, r.track) + '">' + escapeHtml(shortDay(d)) + "</a>"; }).join(" · ");
    const head = dayLinks ? '<div class="wkhead" style="margin:12px 0 0"><div class="weekly-days">当周日报：' + dayLinks + "</div></div>" : "";
    if (!papers.length) {
      const msg = (td.days || []).length
        ? "本周该方向的日报没有入选论文。"
        : "本周 " + escapeHtml(weekRangeLabel(r.week)) + " 没有 " + escapeHtml(trackLabel(r.track)) + " 日报" +
          (r.week.days.length ? "（本周日报日期：" + r.week.days.map(shortDay).map(escapeHtml).join("、") + "）" : "") + "。";
      return head + '<div class="empty-state"><span class="icon">📭</span><h3>暂无周榜数据</h3><p>' + msg + "</p></div>";
    }
    const top = papers.slice(0, 3), rest = papers.slice(3);
    return head +
      '<div class="podium">' + top.map(function (p) { return renderPodium(p, r.track); }).join("") + "</div>" +
      (rest.length ? '<div class="secT"><h3>第 4 – ' + papers.length + ' 名</h3><span>&#128214; = 已有深度解读 · 点击日期回到当日日报</span></div>' +
        '<div class="rest">' + rest.map(function (p) { return renderRow(p, r.track); }).join("") + "</div>" : "");
  }

  function loadWeek(monday) {
    if (weekCache[monday]) return Promise.resolve(weekCache[monday]);
    const wi = weekIndex(monday);
    const h = wi >= 0 && DATA.weeks[wi].hash ? DATA.weeks[wi].hash : DATA.asset_version;
    return fetch("weekly/" + monday + ".json" + (h ? "?v=" + h : ""), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("weekly/" + monday + ".json " + res.status);
      return res.json().then(function (json) { weekCache[monday] = json; return json; });
    });
  }

  function renderWeekly(route) {
    if (!DATA.weeks || !DATA.weeks.length) {
      document.getElementById("main").innerHTML = '<div class="empty-state"><span class="icon">🏆</span><h3>暂无周榜</h3><p>还没有任何日报数据。</p></div>';
      return;
    }
    const r = resolveWeek(route);
    state.view = "weekly";
    state.week = r.week.week_start;
    state.track = r.track;
    state.pickerOpen = false;
    renderWeeklyShell(r);
    const seq = ++renderSeq;
    loadWeek(r.week.week_start)
      .then(function (wk) {
        if (seq !== renderSeq) return;
        const body = document.getElementById("report-body");
        body.innerHTML = renderWeeklyBody(r, wk);
        measureXp(body);
      })
      .catch(function (err) {
        if (seq !== renderSeq) return;
        document.getElementById("report-body").innerHTML = '<div class="empty-state"><h3>周榜加载失败</h3><p>' + escapeHtml(String(err)) + "</p></div>";
      });
    const older = DATA.weeks[r.idx + 1];
    if (older) loadWeek(older.week_start).catch(function () {});
  }

  function jumpWeek(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    goWeek(weekIndexForDate(value));
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
    if (state.view === "daily") {
      const route = parseRoute();
      setNavActive(open || route.archive ? "archive" : "reports");
    }
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

  // 往期 nav item: open the date picker on the day view (navigating there first if needed).
  function openArchive() {
    if (state.view === "daily" && document.getElementById("date-label")) {
      const nav = document.getElementById("date-nav");
      if (nav && nav.getBoundingClientRect().top < 0) window.scrollTo(0, 0);
      setPicker(!state.pickerOpen);
      return;
    }
    location.hash = "#/archive";
  }

  // ---------- theme (light / dark, persisted; follows prefers-color-scheme until chosen) ----------
  function themeLabel() {
    const b = document.getElementById("theme-toggle");
    if (!b) return;
    const d = document.documentElement.getAttribute("data-theme") === "dark";
    b.innerHTML = (d ? "&#9681;" : "&#9680;") + '<span class="tg-l"> ' + (d ? "浅色模式" : "深色模式") + "</span>";
    b.setAttribute("aria-pressed", d ? "true" : "false");
  }
  function setTheme(t, store) {
    document.documentElement.setAttribute("data-theme", t);
    if (store) { try { localStorage.setItem("pd-theme", t); } catch (e) { /* private mode */ } }
    themeLabel();
  }
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      let s = null;
      try { s = localStorage.getItem("pd-theme"); } catch (x) { /* ignore */ }
      if (s !== "light" && s !== "dark") setTheme(e.matches ? "dark" : "light", false);
    });
  } catch (e) { /* old browsers */ }

  function boot() {
    themeLabel();
    fetch("data.json", { cache: "no-store" })
      .then(function (res) { if (!res.ok) throw new Error("data.json " + res.status); return res.json(); })
      .then(function (json) {
        DATA = json;
        DATA.days = DATA.days || [];
        if (Array.isArray(DATA.tracks) && DATA.tracks.length) TRACKS = DATA.tracks.slice();
        if (DATA.track_labels) TRACK_LABELS = Object.assign({}, TRACK_LABELS, DATA.track_labels);
        if (DATA.track_labels_zh) TRACK_ZH = Object.assign({}, TRACK_ZH, DATA.track_labels_zh);
        const foot = document.getElementById("site-foot");
        if (foot && DATA.latest_date) {
          const counter = document.getElementById("busuanzi_container_site_pv"); // 不蒜子 counter: keep the live node
          foot.innerHTML = "<span>Paper Daily · 静态站</span><span>·</span><span>数据最新 " + escapeHtml(DATA.latest_date) +
            "</span><span>·</span><span>共 " + escapeHtml(DATA.days.length) + " 期</span><span>·</span><span>" +
            escapeHtml(DATA.deep_reading_entries || 0) + " 篇深度解读</span>";
          if (counter) foot.appendChild(counter);
        }
        render();
        window.addEventListener("hashchange", render);
      })
      .catch(function (err) {
        document.getElementById("main").innerHTML = '<div class="empty-state"><h3>Failed to load data.json</h3><p>' + escapeHtml(String(err)) + "</p></div>";
      });
  }

  document.addEventListener("click", function (ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest("#theme-toggle")) {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
      return;
    }
    if (t.closest("#nav-archive")) { ev.preventDefault(); openArchive(); return; }
    const xb = t.closest(".xp-btn");
    if (xb) {
      const x = xb.closest(".xp");
      const o = !x.classList.contains("open");
      x.classList.toggle("open", o);
      xb.innerHTML = o ? "收起 &#9652;" : "展开全文 &#9662;";
      xb.setAttribute("aria-expanded", o ? "true" : "false");
      return;
    }
    const toggle = t.closest("[data-deep-toggle]");
    if (toggle) { setDeepReadExpanded(toggle.closest("[data-deep-read]"), true); return; }
    const collapse = t.closest("[data-deep-collapse]");
    if (collapse) { setDeepReadExpanded(collapse.closest("[data-deep-read]"), false); return; }
    const ol = t.closest('a.outline-paper[href^="#paper-"]');
    if (ol) {
      // In-page anchor: scroll without touching the route hash.
      ev.preventDefault();
      const el = document.getElementById(decodeURIComponent(ol.getAttribute("href").slice(1)));
      if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 64, behavior: "smooth" });
      return;
    }
    if (t.closest("[data-week-prev]")) { goWeek(weekIndex(state.week) + 1); return; }
    if (t.closest("[data-week-next]")) { goWeek(weekIndex(state.week) - 1); return; }
    if (t.closest("[data-week-go]")) { const winp = document.getElementById("week-jump"); jumpWeek(winp && winp.value); return; }
    const witem = t.closest(".date-picker-item[data-week]");
    if (witem) { goWeek(weekIndex(witem.getAttribute("data-week"))); return; }
    if (t.closest("[data-date-prev]")) { goToDayIndex(dayIndex(state.date) + 1); return; }
    if (t.closest("[data-date-next]")) { goToDayIndex(dayIndex(state.date) - 1); return; }
    if (t.closest("#date-label")) { setPicker(!state.pickerOpen); return; }
    if (t.closest("[data-date-go]")) { const inp = document.getElementById("date-jump"); jumpTo(inp && inp.value); return; }
    const item = t.closest(".date-picker-item");
    if (item) { jumpTo(item.getAttribute("data-date")); return; }
    if (state.pickerOpen && !t.closest("#date-picker")) setPicker(false);
  });

  document.addEventListener("keydown", function (ev) {
    const t = ev.target;
    if (ev.key === "Escape" && state.pickerOpen) { setPicker(false); return; }
    if (t && t.id === "date-jump" && ev.key === "Enter") { jumpTo(t.value); return; }
    if (t && t.id === "week-jump" && ev.key === "Enter") { jumpWeek(t.value); return; }
    if (t && t.classList && (t.classList.contains("date-picker-item") || t.id === "date-label") && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      if (t.id === "date-label") setPicker(!state.pickerOpen);
      else if (t.hasAttribute("data-week")) goWeek(weekIndex(t.getAttribute("data-week")));
      else jumpTo(t.getAttribute("data-date"));
    }
  });

  let rz;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { measureXp(); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureXp(); });

  boot();
})();
