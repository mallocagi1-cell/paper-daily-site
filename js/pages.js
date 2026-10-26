(function () {
  "use strict";
  const IS_EN = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
  function TR(zh, en) { return IS_EN ? en : zh; }
  // Paper Daily static SPA — design direction C "Newsletter / magazine" (2026-10-10).
  // Display order everywhere (user preference); data.json "tracks" overrides at boot.
  let TRACKS = ["generative", "personalization", "retrieval", "agentic", "infra"];
  let TRACK_LABELS = {
    personalization: "Personalization", generative: "Generative", retrieval: "AI Search",
    agentic: "Agentic", infra: "Infra",
  };
  let TRACK_ZH = {
    personalization: TR("个性化推荐", ""), generative: TR("生成式推荐", ""), retrieval: TR("AI 搜索", ""),
    agentic: TR("智能体搜索", ""), infra: TR("系统与索引", ""),
  };
  // Track scope (redefined 2026-10-24): shown as a tooltip on the track tabs.
  const TRACK_DESC = {
    personalization: TR("推荐建模（非生成式）：长序列/用户兴趣建模、多目标/多任务、模型结构、特征交叉、CTR/CVR、位置偏差、校准，以及推荐模型 Scaling Law / Scaling Up",
      "Recsys modelling (non-generative): long user-behaviour sequences, user interest, multi-objective/multi-task, architecture, feature crossing, CTR/CVR, position bias, calibration, plus recsys scaling laws / scaling up"),
    generative: TR("生成式推荐：语义 ID、生成式召回/排序、端到端生成式链路，以及基于 LLM 的推荐（含对话式推荐）",
      "Generative recommendation: semantic IDs, generative retrieval/ranking, end-to-end generative pipelines, plus LLM-based recommenders incl. conversational recommendation"),
    retrieval: TR("AI 搜索：查询理解与改写、语义召回、多模态匹配、相关性与重排、RAG 链路、问答与深度研究；Agent 论文只收信息获取类，通用 Agent 不收（2026-10-24 起合并原检索与智能体搜索）",
      "AI Search: query understanding & rewriting, semantic retrieval, multimodal matching, relevance & reranking, RAG pipelines, QA & deep research; agent papers only when the task is information-seeking, generic agents excluded (merges the former Retrieval and Agentic tracks from 2026-10-24)"),
    agentic: TR("智能体搜索（旧方向，仅 2026-10-24 之前的日报；之后并入 AI 搜索）", "Agentic search (legacy track, issues before 2026-10-24; merged into AI Search afterwards)"),
  };
  // AI Search merge (2026-10-24): `retrieval` slug = AI Search; agentic -> retrieval alias from the cutover on.
  let AI = { cutover: "2026-10-24", track: "retrieval", alias: { agentic: "retrieval" }, subarea_labels: {
    query: { zh: "查询理解与改写", en: "Query Understanding & Rewriting" }, retrieval: { zh: "语义召回", en: "Semantic Retrieval" },
    multimodal: { zh: "多模态匹配", en: "Multimodal Matching" }, relevance: { zh: "相关性与重排", en: "Relevance & Reranking" },
    rag: { zh: "RAG 链路", en: "RAG Pipeline" }, qa: { zh: "问答与深度研究", en: "QA & Deep Research" } } };
  function aiMerged(date) { return !!date && date >= AI.cutover; }
  function aliasTrack(t, date, available) {
    const to = AI.alias && AI.alias[t];
    return to && aiMerged(date) && (!available || (available.indexOf(t) === -1 && available.indexOf(to) !== -1)) ? to : t;
  }
  function subareaHtml(p, track) {
    if (track !== AI.track || !p || !p.subarea) return "";
    const L = (AI.subarea_labels || {})[p.subarea];
    if (!L) return "";
    return '<span class="chip sub" title="' + escapeHtml(TR("AI 搜索子方向 · " + L.en, "AI Search sub-area · " + L.zh)) + '">' + escapeHtml(TR(L.zh, L.en)) + "</span>";
  }
  function trackTitle(t) { return TRACK_DESC[t] ? ' title="' + escapeHtml(TRACK_DESC[t]) + '"' : ""; }
  const SOURCE_LABELS = {
    arxiv: "arXiv", huggingface: "HuggingFace", semantic_scholar: "Semantic Scholar",
    conference_papers: "Conference", github: "GitHub", web_search: TR("网页来源", "Web source"), blog_rss: TR("技术博客", "Tech blog"),
  };
  const DIMS = [
    ["business_relevance", "Relevance", TR("相关", "Rel")], ["technical_novelty", "Novelty", TR("新颖", "Nov")],
    ["practicality", "Practical", TR("实用", "Prac")], ["evidence_quality", "Evidence", TR("证据", "Evid")],
    ["timeliness", "Timely", TR("时效", "Time")],
  ];
  const WEEKDAY_ZH = [TR("日", "Sun"), TR("一", "Mon"), TR("二", "Tue"), TR("三", "Wed"), TR("四", "Thu"), TR("五", "Fri"), TR("六", "Sat")];

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
    return Number.isNaN(d.getTime()) ? "" : TR("周", "") + WEEKDAY_ZH[d.getDay()];
  }
  function dateLine(d) {
    if (!d || d.length !== 10) return escapeHtml(d || "");
    return d.slice(0, 4) + TR(" 年 ", "-") + d.slice(5, 7) + TR(" 月 ", "-") + d.slice(8, 10) + TR(" 日 ", " ") + weekdayChinese(d);
  }
  function trackClass(t) { return "t-" + String(t || "").toLowerCase().replace(/[^a-z0-9_-]/g, ""); }
  function trackLabel(t) { return TRACK_LABELS[t] || t; }
  // Reader-facing provenance for web-fallback / blog sources (internal `source` values unchanged).
  const PROGRAM_RE = /(\/(session|sessions|program|programme|schedule|accepted|accepted-papers|proceedings|agenda)s?([-\/_#]|\d|$)|programs\.sigchi\.org\/|\/program\/content\/|openreview\.net\/(group|forum))/i;
  const BLOG_RE = /(\/blog|blog\.|\/engineering|\/research\/(blog|pubs?)|tech\.meituan|medium\.com|developer\.nvidia\.com|substack\.com|\/news\/|\/posts?\/|ai\.meta\.com|research\.google|openai\.com\/(index|research)|mp\.weixin\.qq\.com|zhuanlan\.zhihu|juejin\.cn|infoq\.)/i;
  function sourceLabel(src, url) {
    const s = String(src || "").toLowerCase(), u = String(url || "");
    const blogSrc = /_blog$/.test(s) || s === "blog_rss" || s === "industry_blog";
    const webSrc = s === "web_search" || s === "web" || s === "websearch";
    if (webSrc && /arxiv\.org\//i.test(u)) return "arXiv";
    if (webSrc && /openreview\.net\/forum/i.test(u)) return "OpenReview";
    if (webSrc && PROGRAM_RE.test(u)) return TR("会议日程", "Conference program");
    if (blogSrc || ((webSrc) && BLOG_RE.test(u))) return TR("技术博客", "Tech blog");
    if (webSrc) return TR("网页来源", "Web source");
    return SOURCE_LABELS[src] || src || "Unknown";
  }
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
        ? '<img class="clogo" src="' + escapeHtml((document.documentElement.getAttribute("data-root") || "") + c.logo) + '" alt="" width="16" height="16" loading="lazy" decoding="async" onerror="this.remove()">'
        : '<span class="clogo mono" style="--h:' + (Number(c.hue) || 0) + '" aria-hidden="true">' + escapeHtml(String(c.name || "?").trim().charAt(0).toUpperCase()) + "</span>";
      return '<span class="cname">' + icon + escapeHtml(c.name) + "</span>";
    });
  }
  function venueHtml(p) {
    const b = p.venue_badge;
    if (!b || !b.url || !/^https?:\/\//.test(b.url)) return "";
    const root = document.documentElement.getAttribute("data-root") || "";
    return '<a class="vbadge" href="' + escapeHtml(b.url) + '" target="_blank" rel="noopener" title="' +
      escapeHtml(TR("录用于 " + b.label, b.title || b.label)) + '"><img class="vlogo" src="' + escapeHtml(root + b.logo) +
      '" alt="" height="14" loading="lazy" decoding="async" onerror="this.remove()">' + TR("已录用 ", "") + escapeHtml(b.label) + "</a>";
  }
  function linkLabel(p) {
    const url = String(p.url || "");
    if (url.indexOf("arxiv.org") !== -1) return "arXiv";
    return p.source ? sourceLabel(p.source, p.url) : TR("原文", "Source");
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
    const aria = DIMS.map(function (d) { return d[1] + " " + (sc[d[0]] != null ? sc[d[0]] : "-"); }).join(TR("，", ", "));
    return '<svg class="radar" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size +
      TR('" role="img" aria-label="五维评分：', '" role="img" aria-label="Scores: ') + escapeHtml(aria) + '">' + g + '<polygon class="rp" points="' + poly + '"/>' + lab + "</svg>";
  }
  function xpBlock(inner, cls) {
    return '<div class="xp ' + (cls || "") + '"><div class="xp-body">' + inner +
      TR('</div><button type="button" class="xp-btn" aria-expanded="false">展开全文 &#9662;</button></div>', '</div><button type="button" class="xp-btn" aria-expanded="false">Read more &#9662;</button></div>');
  }
  function measureXp(root) {
    (root || document).querySelectorAll(".xp").forEach(function (x) {
      if (x.classList.contains("open")) return;
      const b = x.querySelector(".xp-body");
      if (b) x.classList.toggle("can", b.scrollHeight > b.clientHeight + 2);
    });
  }
  function readingMinutes(dr) {
    return dr.minutes || (dr.chars ? Math.ceil(dr.chars / 400) : 0);
  }

  // 📖 chip on cards / weekly rows: a link to the standalone deep-dive page when it exists (else a plain badge)
  function deepChip(dr) {
    const m = readingMinutes(dr);
    const label = TR("&#128214; 深度解读", "&#128214; Deep dive") + (m ? " · " + m + TR(" 分钟", " min") : "");
    return dr.slug
      ? '<a class="chip deep" href="' + deepPath(dr.slug) + '">' + label + " &#8594;</a>"
      : '<span class="chip deep">' + label + "</span>";
  }

  // ---------- routes (clean URLs, 2026-10-26) ----------
  // Real paths, relative to the shell's <base href> ("/" or "/en/"); every one is also a static page:
  //   ""  (latest day)  |  <date>/  (default = first track)  |  <date>/<track>/  |  archive/  (latest day, picker open)
  //   weekly/  (latest week)  |  weekly/<yyyy>-w<ww>/  |  weekly/<yyyy>-w<ww>/<track>/      (ISO week of the Monday)
  //   "#paper-<id>" on a day view scrolls to / highlights that paper card.
  // Legacy hash routes (#/view/<date>/<track>?p=<id>, #/<date>/<track>, #/reports/..., #/weekly[/<monday>][/<track>],
  // #/weekly/<track>, #/archive) are still parsed and replaced by their clean URL (history.replaceState) on render.
  const BASE = (function () { try { return new URL(document.baseURI).pathname; } catch (e) { return "/"; } })();
  const isDate = function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ""); };
  function relPath() {
    let p = location.pathname;
    p = p.indexOf(BASE) === 0 ? p.slice(BASE.length) : p.replace(/^\//, "");
    return p.replace(/(^|\/)index\.html$/, "$1");
  }
  function hashFocus() {
    const h = location.hash || "";
    if (h.indexOf("#paper-") !== 0) return null;
    try { return decodeURIComponent(h.slice(7)); } catch (e) { return h.slice(7); }
  }
  function parseLegacyHash(full) {
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
    if (parts[0] === "weekly") {
      return { weekly: true, week: isDate(parts[1]) ? parts[1] : null, track: (isDate(parts[1]) ? parts[2] : parts[1]) || null, legacy: true };
    }
    if (parts[0] === "archive") return { date: null, track: null, archive: true, legacy: true };
    if ((parts[0] === "view" || parts[0] === "reports") && isDate(parts[1])) {
      return { date: parts[1], track: parts[2] || null, focus: focus, legacy: true };
    }
    if (isDate(parts[0])) return { date: parts[0], track: parts[1] || null, focus: focus, legacy: true };
    return { date: null, track: null, legacy: true };
  }
  function parseRoute() {
    if ((location.hash || "").indexOf("#/") === 0) return parseLegacyHash(location.hash.slice(1));
    const parts = relPath().split("/").filter(Boolean);
    if (parts[0] === "weekly") {
      const m = /^(\d{4})-w(\d{2})$/.exec(parts[1] || "");
      return { weekly: true, weekLabel: m ? parts[1] : null, track: (m ? parts[2] : parts[1]) || null };
    }
    if (parts[0] === "archive") return { date: null, track: null, archive: true };
    if (isDate(parts[0])) return { date: parts[0], track: parts[1] || null, focus: hashFocus() };
    return { date: null, track: null, focus: hashFocus(), home: true };
  }
  function reportDataHref(date, track) { return "reports/" + date + "/" + track + "/report_data.json"; }
  function deepPath(slug) { return "papers/" + encodeURIComponent(slug) + "/"; }
  function dayPath(date, track) {
    const i = dayIndex(date);
    const ts = i >= 0 ? orderTracks(DATA.days[i].tracks) : [];
    return date + "/" + (track && ts.length && track !== ts[0] ? track + "/" : "");
  }
  function paperFrag(id) { return id ? "#paper-" + encodeURIComponent(id).replace(/%3A/gi, ":") : ""; }
  function weekLabel(w) { return w.iso_year + "-w" + ("0" + w.iso_week).slice(-2); }
  function weekPath(w, track) {
    const wt = weekTracks(w);
    return "weekly/" + weekLabel(w) + "/" + (track && track !== wt[0] ? track + "/" : "");
  }
  // in-app navigation: real URL in the address bar, no reload (the target is also a static page)
  function navigate(path, replace) {
    try {
      if (replace) history.replaceState(null, "", path || BASE);
      else history.pushState(null, "", path || BASE);
    } catch (e) { location.href = path || BASE; return; }
    render();
    if (!replace) window.scrollTo(0, 0);
  }
  // ---------- day report body (lead story + cards + other tracks + 开源雷达) ----------
  function pidOf(p, i) { return String(p.id || "p" + i); }

  function insightInner(p) {
    let s = "";
    if (p.key_insight) s += '<p><b class="lab">INSIGHT</b>' + hlText(escapeHtml(p.key_insight)) + "</p>";
    if (p.business_connection) s += TR('<p><b class="lab">业务关联</b>', '<p><b class="lab">Business link</b>') + escapeHtml(p.business_connection) + "</p>";
    if (p.evidence) s += TR('<p><b class="lab">证据</b>', '<p><b class="lab">Evidence</b>') + escapeHtml(p.evidence) + "</p>";
    return s;
  }

  function renderLead(p, i, track) {
    const pid = pidOf(p, i);
    const comp = companiesOf(p);
    const dr = p.deep_reading && p.deep_reading.status === "completed" ? p.deep_reading : null;
    let btns = "";
    if (dr && dr.slug) {
      const m = readingMinutes(dr);
      btns += '<a class="btn w" href="' + deepPath(dr.slug) + TR('">&#128214; 深度解读', '">&#128214; Deep dive') + (m ? " · " + m + TR(" 分钟", " min") : "") + "</a>";
    }
    if (p.url) btns += '<a class="btn ghost" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(linkLabel(p)) + " &#8599;</a>";
    const adj = num(p.adjusted_score);
    let more = "";
    if (p.business_connection) more += TR('<span class="more"><b>业务关联</b> ', '<span class="more"><b>Business link</b> ') + escapeHtml(p.business_connection) + "</span>";
    if (p.evidence) more += TR('<span class="more"><b>证据</b> ', '<span class="more"><b>Evidence</b> ') + escapeHtml(p.evidence) + "</span>";
    const pq = p.key_insight || more
      ? TR('<div class="pq"><small>KEY INSIGHT · 对业务意味着什么</small>', '<div class="pq"><small>KEY INSIGHT · What it means for the business</small>') + hlText(escapeHtml(p.key_insight || "")) + more + "</div>" : "";
    const foot = [truncate(p.authors, 90), p.published, sourceLabel(p.source, p.url)].filter(Boolean).map(escapeHtml).join(" · ");
    return (
      '<section class="lead ' + trackClass(track) + '" id="paper-' + escapeHtml(pid) + '" data-paper-id="' + escapeHtml(pid) + '" data-card>' +
      '<div class="art" data-n="' + pad2(p.rank || i + 1) + '"><div>' +
      TR('<div class="k">LEAD STORY · 今日必读', '<div class="k">LEAD STORY · Must-read today') + (comp.length ? " · " + compHtml(p, 3).join(" / ") : "") + "</div>" +
      '<h2><a href="' + escapeHtml(p.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(p.title || "Untitled") + "</a></h2>" +
      (venueHtml(p) || subareaHtml(p, track) ? '<div class="lead-venue">' + venueHtml(p) + subareaHtml(p, track) + "</div>" : "") +
      "<p>" + hlText(escapeHtml(p.summary || "")) + "</p></div>" +
      '<div class="btns">' + btns + "</div></div>" +
      '<div class="side"><div class="ring">' + radarSvg(p.scores, 170) +
      '<div><div class="big">' + fmt2(p.total_score) + TR('</div><div class="lbl">综合分 / 5', '</div><div class="lbl">Score / 5') + (adj !== null ? TR("<br>偏好调整 ", "<br>Adjusted ") + fmt2(adj) : "") + "</div></div></div>" +
      pq + '<div class="foot">' + foot + "</div></div>" +
      "</section>"
    );
  }

  function renderCard(p, i, track) {
    const pid = pidOf(p, i);
    const dr = p.deep_reading && p.deep_reading.status === "completed" ? p.deep_reading : null;
    let chips = venueHtml(p) + subareaHtml(p, track) + compHtml(p).map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
    if (dr) chips += deepChip(dr);
    const ins = insightInner(p);
    let foot = "<span>" + escapeHtml(sourceLabel(p.source, p.url)) + "</span>";
    if (p.published) foot += "<span>·</span><span>" + escapeHtml(p.published) + "</span>";
    const dl = dimLine(p.scores);
    if (dl) foot += '<span>·</span><span class="score-detail">' + dl + "</span>";
    return (
      '<article class="card ' + trackClass(track) + '" id="paper-' + escapeHtml(pid) + '" data-paper-id="' + escapeHtml(pid) + '" data-card>' +
      '<div class="top"><span class="n">' + pad2(p.rank || i + 1) + TR('</span><span class="sb" title="综合分">', '</span><span class="sb" title="Score">') + dots(p.total_score) + " " + fmt2(p.total_score) + "</span></div>" +
      '<h4><a href="' + escapeHtml(p.url || "#") + '" target="_blank" rel="noopener">' + escapeHtml(p.title || "Untitled") + "</a></h4>" +
      (chips ? "<div>" + chips + "</div>" : "") +
      (p.summary ? "<p>" + hlText(escapeHtml(p.summary)) + "</p>" : "") +
      (ins ? '<div class="ins">' + xpBlock(ins) + "</div>" : "") +
      (p.authors ? '<div class="foot">' + escapeHtml(truncate(p.authors, 100)) + "</div>" : "") +
      '<div class="foot">' + foot + "</div>" +
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
    return TR('<div class="secT"><h3>其他赛道今日</h3><span>点击切换</span></div><div class="other">', '<div class="secT"><h3>Other tracks today</h3><span>Click to switch</span></div><div class="other">') +
      others.map(function (t) {
        const c = meta[t] && meta[t].papers_selected != null ? meta[t].papers_selected : "-";
        return '<a class="ot ' + trackClass(t) + '" data-track="' + escapeHtml(t) + '" href="' + dayPath(r.date, t) + '"><b>' + escapeHtml(trackLabel(t)) +
          "</b><div>" + escapeHtml(c) + '</div><span class="os">' + escapeHtml(TRACK_ZH[t] || "") + TR(" · 篇入选</span></a>", " papers</span></a>");
      }).join("") + "</div>";
  }

  function renderReportBody(report, r) {
    const papers = report.papers || [];
    const projects = report.code_projects || [];
    const stats = report.stats || {};
    const track = r.track;
    let out = "";
    const st = [];
    if (stats.papers_scored != null) st.push(TR("评分 ", "Scored ") + escapeHtml(stats.papers_scored) + TR(" 篇", ""));
    st.push(TR("入选 ", "selected ") + papers.length + TR(" 篇", ""));
    if (stats.score_max != null) st.push(TR("分数 ", "scores ") + fmt2(stats.score_min) + " – " + fmt2(stats.score_max));
    out += TR('<p class="scen"><b>今日场景</b>', '<p class="scen"><b>Scenario</b>') + escapeHtml(report.scenario || "") + ' <span class="sc-stat">— ' + st.join(TR("，", ", ")) + "</span></p>";
    if (papers.length > 1) {
      out += TR('<details class="issue-toc"><summary>本期目录 · ', '<details class="issue-toc"><summary>In this issue · ') + papers.length + TR(" 篇</summary><ol>", " papers</summary><ol>") +
        papers.map(function (p, i) {
          return '<li><a class="outline-paper" href="#paper-' + escapeHtml(pidOf(p, i)) + '" title="' + escapeHtml(p.title) + '"><i>' +
            pad2(i + 1) + "</i><span>" + escapeHtml(p.title || "Untitled") + "</span></a></li>";
        }).join("") + "</ol></details>";
    }
    if (!papers.length) {
      out += TR('<div class="empty-state"><span class="icon">&#128237;</span><h3>本期无入选论文</h3><p>该方向当日没有入选论文。</p></div>', '<div class="empty-state"><span class="icon">&#128237;</span><h3>No papers selected</h3><p>No papers were selected for this track on this day.</p></div>');
    } else {
      out += renderLead(papers[0], 0, track);
      if (papers.length > 1) {
        out += TR('<div class="secT"><h3>今日其余入选</h3><span>', '<div class="secT"><h3>More picks today</h3><span>') + (papers.length - 1) + TR(" 篇 · 按综合排名</span></div>", " papers · by overall rank</span></div>") +
          '<div class="grid">' + papers.slice(1).map(function (p, i) { return renderCard(p, i + 1, track); }).join("") + "</div>";
      }
    }
    out += renderOther(r);
    if (projects.length) {
      out += TR('<div class="secT"><h3>开源雷达</h3><span>GitHub / HuggingFace 热门 · ', '<div class="secT"><h3>Open-source radar</h3><span>Trending on GitHub / HuggingFace · ') + projects.length + TR(" 个项目</span></div>", " projects</span></div>") +
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
        notice = route.date + TR(" 没有日报，已显示最近的 ", " has no issue; showing the nearest, ") + DATA.days[idx].date;
      }
    }
    const day = DATA.days[idx];
    const tracks = orderTracks(day.tracks);
    let track = tracks[0] || "";
    if (route.track) {
      const to = aliasTrack(route.track, day.date, tracks); // agentic -> AI Search from the cutover
      if (to !== route.track) {
        route.track = to;
      }
    }
    if (route.track) {
      if (tracks.indexOf(route.track) !== -1) track = route.track;
      else if (!notice) notice = day.date + TR(" 没有 ", " has no ") + trackLabel(route.track) + TR(" 日报，已显示 ", " issue; showing ") + trackLabel(track);
    }
    return { idx: idx, date: day.date, tracks: tracks, track: track, notice: notice };
  }
  function go(date, track) { navigate(dayPath(date, track)); }
  function issueNo(idx) { const d = DATA.days[idx]; return d && d.issue_no ? d.issue_no : DATA.days.length - idx; } // counted from the oldest day; latest = day_count

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
      TR('<button class="date-nav-btn" type="button" data-date-prev title="前一天 (更早)" aria-label="前一天"', '<button class="date-nav-btn" type="button" data-date-prev title="Previous day (older)" aria-label="Previous day"') + (r.idx >= n - 1 ? " disabled" : "") + ">&#8249;</button>" +
      '<div class="date-label" id="date-label" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="' +
      (state.pickerOpen ? "true" : "false") + TR('" title="往期：选择日期">', '" title="Archive: pick a date">') +
      "<span>" + escapeHtml(r.date) + "</span>" +
      '<span class="date-weekday">(' + escapeHtml(weekdayChinese(r.date)) + ")</span>" +
      '<span class="date-caret' + (state.pickerOpen ? " open" : "") + '">&#9660;</span>' +
      (r.idx === 0 ? TR('<span class="date-latest-tag">最新</span>', '<span class="date-latest-tag">Latest</span>') : "") + "</div>" +
      TR('<button class="date-nav-btn" type="button" data-date-next title="后一天 (更新)" aria-label="后一天"', '<button class="date-nav-btn" type="button" data-date-next title="Next day (newer)" aria-label="Next day"') + (r.idx <= 0 ? " disabled" : "") + ">&#8250;</button>" +
      '<div class="date-picker-dropdown" id="date-picker"' + (state.pickerOpen ? "" : " hidden") + ">" +
      '<div class="date-picker-jump"><input type="date" id="date-jump" value="' + escapeHtml(r.date) + '" min="' + escapeHtml(oldest) +
      '" max="' + escapeHtml(latest) + TR('" aria-label="跳转日期"><button type="button" data-date-go>Go</button></div>', '" aria-label="Jump to date"><button type="button" data-date-go>Go</button></div>') +
      TR('<div class="date-picker-count">往期 · ', '<div class="date-picker-count">Archive · ') + n + TR(" 天有日报（无日报的日期自动跳到最近一期）</div>", " English issues (dates without one jump to the nearest)</div>") +
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
        '" href="' + dayPath(r.date, t) + '"' + trackTitle(t) + (t === r.track ? ' aria-current="page"' : "") + "><b>" + escapeHtml(trackLabel(t)) +
        '</b><span class="rs">' + escapeHtml(TRACK_ZH[t] || "") + " · <em>" + escapeHtml(c) + TR("</em> 篇</span></a>", "</em> papers</span></a>");
    }).join("");
    main.innerHTML =
      TR('<div class="issue-bar"><div class="ib-info"><b>第 ', '<div class="issue-bar"><div class="ib-info"><b>Issue ') + issueNo(r.idx) + TR(" 期</b> · ", "</b> · ") + escapeHtml(dateLine(r.date)) +
      " · " + r.tracks.length + TR(" 个方向</div>", " tracks</div>") + renderDateNav(r) + "</div>" +
      (r.notice ? '<div class="pages-notice">' + escapeHtml(r.notice) + "</div>" : "") +
      '<div class="ribbon track-tabs" role="tablist">' + tabs + "</div>" +
      // 2026-10-26 (Felix: "存在的意义是什么"): the "standalone report ↗ · 深度解读 N 篇 →" row under the
      // report is gone; the old standalone report pages are now redirect stubs to /<date>/<track>/, 深度解读 is in the nav.
      '<div id="report-body"><div class="empty-state"><span class="spinner"></span></div></div>';
    setMast(TR("第 ", "Issue ") + issueNo(r.idx) + TR(" 期", ""), dateLine(r.date));
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
      t = TR("周榜 Weekly Top ", "Weekly Top ") + (DATA.weekly_top_n || 10) + (route.week ? " · " + route.week + TR(" 周", " week") : "") + " · Paper Daily";
      d = TR("Paper Daily 周榜：按周汇总搜索、推荐与 GenAI 各方向日报入选论文，按偏好调整分排序、去重后的每周 Top ", "Paper Daily weekly ranking: deduplicated top ") +
        (DATA.weekly_top_n || 10) + TR("，附深度解读链接。", " papers per track each week, with deep-dive links.");
    } else if (route.archive) {
      t = TR("往期日报 · ", "Archive · ") + (DATA.days || []).length + TR(" 期 · Paper Daily", " issues · Paper Daily");
    } else if (route.date) {
      t = route.date + (route.track ? " " + trackLabel(route.track) : "") + TR(" 论文日报 · Paper Daily", " papers · Paper Daily");
    }
    document.title = t;
    if (descEl) descEl.setAttribute("content", d);
  }

  // language toggle -> the same view in the other edition when it exists there, else its home
  function syncLangToggle(path) {
    const a = document.querySelector(".lang-tg[data-base]");
    if (!a) return;
    let p = path || "";
    if (!IS_EN) {
      const parts = p.split("/").filter(Boolean);
      const ed = DATA.en_dates || [], ew = DATA.en_weeks || [];
      if (isDate(parts[0]) && ed.indexOf(parts[0]) === -1) p = "";
      if (parts[0] === "weekly" && parts[1] && ew.indexOf(parts[1]) === -1) p = "weekly/";
    }
    a.setAttribute("href", a.getAttribute("data-base") + p);
  }
  // Same-site links to app views (home, <date>/..., weekly/..., archive/) render in place via pushState;
  // in-page "#..." anchors scroll without a reload (the <base href> would otherwise point them at the root).
  const APP_RE = /^(|\d{4}-\d{2}-\d{2}\/([a-z_-]+\/)?|weekly\/(\d{4}-w\d{2}\/([a-z_-]+\/)?)?|archive\/)$/;
  let lastHref = null;
  function renderIfMoved() { if (location.href !== lastHref) render(); }
  document.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.id === "nav-archive") return;
    const raw = a.getAttribute("href") || "";
    if (raw.charAt(0) === "#" && raw.indexOf("#/") !== 0) {
      ev.preventDefault();
      let id = raw.slice(1);
      try { id = decodeURIComponent(id); } catch (e) { /* keep */ }
      const el = id && document.getElementById(id);
      if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 64, behavior: "smooth" });
      return;
    }
    let u;
    try { u = new URL(raw, document.baseURI); } catch (e) { return; }
    if (u.origin !== location.origin || u.pathname.indexOf(BASE) !== 0) return;
    const rel = u.pathname.slice(BASE.length).replace(/(^|\/)index\.html$/, "$1");
    if (!APP_RE.test(rel)) return;
    ev.preventDefault();
    if (lastHref === null) { location.href = u.href; return; } // data.json not rendered yet
    navigate(u.pathname + u.search + u.hash);
  });
  // canonical clean URL of the resolved view (fixes legacy #/ routes, index.html, /<date>/<default track>/, aliases)
  function canonicalize(path, focus) {
    const want = BASE + path;
    const frag = focus ? paperFrag(focus) : (location.hash.indexOf("#/") === 0 ? "" : location.hash);
    if (location.pathname !== want || location.hash !== frag) {
      try { history.replaceState(history.state, "", want + location.search + frag); } catch (e) { /* ignore */ }
    }
  }
  function render() {
    const route = parseRoute();
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
    if (route.archive) canonicalize("archive/", null);
    else if (route.home && !route.focus) canonicalize("", null);
    else canonicalize(dayPath(r.date, r.track), route.focus);
    afterRoute(route.archive ? "archive/" : relPath(), Object.assign({}, route, { date: r.date, track: r.track }));
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
          '</p><p><a class="open-raw" href="' + escapeHtml(BASE + dayPath(r.date, r.track)) + '" onclick="location.reload();return false">Reload</a></p></div>';
      });
    // Warm the cache for the neighbouring (older) day so prev-clicks feel instant.
    const older = DATA.days[r.idx + 1];
    if (older) loadReport(older.date, orderTracks(older.tracks)[0]).catch(function () {});
  }

  function afterRoute(path, route) {
    lastHref = location.href;
    syncLangToggle(path);
    try { setDocMeta(route); } catch (e) { /* never block rendering */ }
    try { window.dispatchEvent(new Event("pd:navigate")); } catch (e) { /* old browsers */ }
  }

  // Scroll to (and briefly highlight) a paper card on a day view: /<date>/<track>/#paper-<id>
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
  // weeks whose Sunday is on/after the AI Search cutover have no Agentic tab (weekly.py pools its info-seeking papers into AI Search)
  function weekTracks(w) { return w && Array.isArray(w.tracks) && w.tracks.length ? orderTracks(w.tracks) : TRACKS; }
  function goWeek(i) {
    const w = (DATA.weeks || [])[i];
    if (!w) return;
    const wt = weekTracks(w), st = state.track ? aliasTrack(state.track, w.week_end, wt) : null;
    navigate(weekPath(w, st && wt.indexOf(st) !== -1 ? st : wt[0]));
  }
  function resolveWeek(route) {
    const ws = DATA.weeks || [];
    let idx = 0, notice = "";
    if (route.weekLabel) {
      idx = -1;
      for (let i = 0; i < ws.length; i++) if (weekLabel(ws[i]) === route.weekLabel) idx = i;
      if (idx < 0) { notice = route.weekLabel + TR(" 没有周榜，已显示最近一周", " has no ranking; showing the latest week"); idx = 0; }
    } else if (route.week) {
      idx = weekIndex(route.week);
      if (idx < 0) {
        idx = weekIndexForDate(route.week);
        notice = route.week + TR(" 所在周没有日报，已显示 ", " falls in a week without issues; showing ") + weekRangeLabel(ws[idx]);
      }
    }
    const wt = weekTracks(ws[idx]);
    let track = wt[0];
    if (route.track) route.track = aliasTrack(route.track, ws[idx].week_end, wt);
    if (route.track) {
      if (wt.indexOf(route.track) !== -1) track = route.track;
      else if (!notice) notice = TR("未知方向 ", "Unknown track ") + route.track + TR("，已显示 ", "; showing ") + trackLabel(track);
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
        '" tabindex="0" role="option"><span class="dp-date">' + escapeHtml(weekRangeLabel(x)) + TR('</span><span class="dp-weekday">第', '</span><span class="dp-weekday">W') +
        escapeHtml(x.iso_week) + TR('周</span><span class="dp-tracks"><span class="dp-track-badge">', '</span><span class="dp-tracks"><span class="dp-track-badge">') + escapeHtml(x.day_count) + TR(" 天日报</span>", " days</span>") +
        (live ? TR('<span class="dp-track-badge weekly-live-badge">进行中</span>', '<span class="dp-track-badge weekly-live-badge">In progress</span>') : "") + "</span></li>";
    }).join("");
    const live = weekInProgress(w);
    return (
      '<div class="date-nav weekly-nav" id="date-nav">' +
      TR('<button class="date-nav-btn" type="button" data-week-prev title="上一周 (更早)" aria-label="上一周"', '<button class="date-nav-btn" type="button" data-week-prev title="Previous week" aria-label="Previous week"') + (r.idx >= n - 1 ? " disabled" : "") + ">&#8249;</button>" +
      '<div class="date-label" id="date-label" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="' +
      (state.pickerOpen ? "true" : "false") + TR('" title="选择周">', '" title="Pick a week">') +
      '<span class="weekly-range">' + escapeHtml(weekRangeLabel(w)) + "</span>" +
      TR('<span class="date-weekday">(第', '<span class="date-weekday">(W') + escapeHtml(w.iso_week) + TR("周)</span>", ")</span>") +
      '<span class="date-caret' + (state.pickerOpen ? " open" : "") + '">&#9660;</span>' +
      (live ? TR('<span class="date-latest-tag weekly-live-tag">进行中</span>', '<span class="date-latest-tag weekly-live-tag">In progress</span>') : r.idx === 0 ? TR('<span class="date-latest-tag">最新</span>', '<span class="date-latest-tag">Latest</span>') : "") +
      "</div>" +
      TR('<button class="date-nav-btn" type="button" data-week-next title="下一周 (更新)" aria-label="下一周"', '<button class="date-nav-btn" type="button" data-week-next title="Next week" aria-label="Next week"') + (r.idx <= 0 ? " disabled" : "") + ">&#8250;</button>" +
      '<div class="date-picker-dropdown" id="date-picker"' + (state.pickerOpen ? "" : " hidden") + ">" +
      '<div class="date-picker-jump"><input type="date" id="week-jump" value="' + escapeHtml(w.week_start) + '" min="' +
      escapeHtml(ws[n - 1].week_start) + '" max="' + escapeHtml(ws[0].week_end) + TR('" aria-label="跳转到某天所在周"><button type="button" data-week-go>Go</button></div>', '" aria-label="Jump to the week of a date"><button type="button" data-week-go>Go</button></div>') +
      '<div class="date-picker-count">' + n + TR(" 周有日报 · 周一至周日</div>", " weeks · Mon–Sun</div>") +
      '<ul class="date-picker-list" role="listbox">' + items + "</ul></div></div>"
    );
  }

  function renderWeeklyShell(r) {
    const main = document.getElementById("main");
    const counts = r.week.unique_counts || {};
    const tabs = weekTracks(r.week).map(function (t) {
      const c = counts[t] || 0;
      return '<a class="track-tab ' + trackClass(t) + (t === r.track ? " active" : "") + (c ? "" : " weekly-empty-tab") + '" data-track="' +
        escapeHtml(t) + '" href="' + weekPath(r.week, t) + '"' + trackTitle(t) + '><b>' + escapeHtml(trackLabel(t)) +
        TR('</b><span class="rs">本周去重 <em>', '</b><span class="rs">unique this week <em>') + escapeHtml(c) + TR("</em> 篇</span></a>", "</em> papers</span></a>");
    }).join("");
    const w = r.week;
    main.innerHTML =
      '<div class="wkhead"><div class="k">Weekly Top ' + escapeHtml(DATA.weekly_top_n || 10) + TR(" · 第", " · W") + escapeHtml(w.iso_week) + TR("周</div>", "</div>") +
      "<h2>" + escapeHtml(w.week_start.slice(5).replace("-", ".")) + "–" + escapeHtml(w.week_end.slice(5).replace("-", ".")) + "</h2>" +
      '<div class="wk-sel">' + renderWeekNav(r) + "</div>" +
      '<p id="wk-stats">' + escapeHtml(w.day_count) + TR(" 期日报 · ", " issues · ") + escapeHtml(trackLabel(r.track)) + TR(" 本周去重 ", " unique this week: ") + escapeHtml(counts[r.track] || 0) + TR(" 篇 · 按偏好调整分</p></div>", " · by adjusted score</p></div>") +
      (r.notice ? '<div class="pages-notice">' + escapeHtml(r.notice) + "</div>" : "") +
      '<div class="ribbon track-tabs" role="tablist">' + tabs + "</div>" +
      '<div id="report-body"><div class="empty-state"><span class="spinner"></span></div></div>';
      // 2026-10-26 (Felix): the weekly sort-rule row (adjusted_score … · 今日 → · 深度解读 →) is gone
    setMast(TR("第 ", "Issue ") + (DATA.days.length || DATA.day_count || "") + TR(" 期", ""), dateLine(DATA.latest_date || ""));
    setBodyTrack(r.track);
  }

  function shortDay(d) { return d.slice(5) + " " + weekdayChinese(d); }

  function weeklyParts(paper, track) {
    const pid = paper.id || "w" + paper.weekly_rank;
    let scoreLine = "Total " + fmt2(paper.total_score);
    if (paper.adjusted_score != null) {
      const bonus = num(paper.preference_bonus);
      scoreLine += TR(" · 偏好 ", " · bonus ") + (bonus === null ? "-" : (bonus >= 0 ? "+" : "") + bonus.toFixed(2)) + " · Adjusted " + fmt2(paper.adjusted_score);
    }
    const apps = (paper.appearances || []).map(function (a) {
      return '<a href="' + dayPath(a.date, a.track || track) + paperFrag(a.id || pid) + '">' + escapeHtml(shortDay(a.date)) +
        (a.rank != null ? TR(" · 当日 #", " · #") + escapeHtml(a.rank) : "") + "</a>";
    }).join("");
    const dr = paper.deep_reading && paper.deep_reading.status === "completed" ? paper.deep_reading : null;
    let chips = venueHtml(paper) + subareaHtml(paper, track) + compHtml(paper, 3).map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
    if (dr) chips += deepChip(dr);
    const dl = dimLine(paper.scores);
    const first = paper.best_date ? TR("首见 ", "First seen ") + escapeHtml(shortDay(paper.best_date)) : "";
    return {
      pid: pid,
      chips: chips,
      scoreLine: '<div class="weekly-score-line">' + escapeHtml(scoreLine) + "</div>",
      meta: '<div class="foot">' + [first, escapeHtml(sourceLabel(paper.source, paper.url)), paper.published ? escapeHtml(paper.published) : ""]
        .filter(Boolean).join(" · ") + (dl ? ' · <span class="score-detail">' + dl + "</span>" : "") + "</div>",
      apps: TR('<div class="dr-appearances weekly-appearances">出现于日报：', '<div class="dr-appearances weekly-appearances">Appeared in: ') + apps + "</div>",
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
      '<div class="ph"><span class="medal m' + n + ' weekly-rank weekly-rank-' + n + '">' + n + TR('</span><span class="big badge" title="周榜排序分 (adjusted_score，缺失时为 total_score)">', '</span><span class="big badge" title="Weekly rank score (adjusted_score, else total_score)">') +
      fmt2(paper.rank_score) + "</span></div>" +
      '<h4 class="card-title">' + k.title + "</h4>" +
      (k.chips ? "<div>" + k.chips + "</div>" : "") +
      '<div class="paper-body">' + sum + "</div>" +
      (ins ? '<div class="ins">' + xpBlock(ins) + "</div>" : "") +
      k.scoreLine + k.meta + k.apps + "</div>"
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
      k.scoreLine + k.apps + "</div>" +
      TR('<span class="s badge" title="周榜排序分">', '<span class="s badge" title="Weekly rank score">') + fmt2(paper.rank_score) + "</span></div>"
    );
  }

  function renderWeeklyBody(r, wk) {
    const td = (wk.tracks || {})[r.track] || { papers: [], raw_count: 0, unique_count: 0, days: [] };
    const papers = td.papers || [];
    const stats = document.getElementById("wk-stats");
    if (stats) {
      stats.textContent = (td.days || []).length + TR(" 期日报 · ", " issues · ") + trackLabel(r.track) + " " + td.raw_count + TR(" 条入选 → 去重 ", " picks → ") +
        td.unique_count + TR(" 篇 · 显示 Top ", " unique · showing top ") + papers.length + TR(" · 按偏好调整分", " · by adjusted score");
    }
    const dayLinks = (td.days || []).map(function (d) { return '<a href="' + dayPath(d, r.track) + '">' + escapeHtml(shortDay(d)) + "</a>"; }).join(" · ");
    const head = dayLinks ? TR('<div class="wkhead" style="margin:12px 0 0"><div class="weekly-days">当周日报：', '<div class="wkhead" style="margin:12px 0 0"><div class="weekly-days">Issues this week: ') + dayLinks + "</div></div>" : "";
    if (!papers.length) {
      const msg = (td.days || []).length
        ? TR("本周该方向的日报没有入选论文。", "No papers selected for this track this week.")
        : TR("本周 ", "Week ") + escapeHtml(weekRangeLabel(r.week)) + TR(" 没有 ", " has no ") + escapeHtml(trackLabel(r.track)) + TR(" 日报", " issues") +
          (r.week.days.length ? TR("（本周日报日期：", " (issue dates: ") + r.week.days.map(shortDay).map(escapeHtml).join(TR("、", ", ")) + TR("）", ")") : "") + TR("。", ".");
      return head + TR('<div class="empty-state"><span class="icon">📭</span><h3>暂无周榜数据</h3><p>', '<div class="empty-state"><span class="icon">📭</span><h3>No weekly data</h3><p>') + msg + "</p></div>";
    }
    const top = papers.slice(0, 3), rest = papers.slice(3);
    return head +
      '<div class="podium">' + top.map(function (p) { return renderPodium(p, r.track); }).join("") + "</div>" +
      (rest.length ? TR('<div class="secT"><h3>第 4 – ', '<div class="secT"><h3>#4 – ') + papers.length + TR(' 名</h3><span>&#128214; = 已有深度解读 · 点击日期回到当日日报</span></div>', '</h3><span>&#128214; = has a deep dive · click a date to open that issue</span></div>') +
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
      document.getElementById("main").innerHTML = TR('<div class="empty-state"><span class="icon">🏆</span><h3>暂无周榜</h3><p>还没有任何日报数据。</p></div>', '<div class="empty-state"><span class="icon">🏆</span><h3>No weekly ranking</h3><p>No issues yet.</p></div>');
      return;
    }
    const r = resolveWeek(route);
    const latest = r.idx === 0 && r.track === weekTracks(r.week)[0] && !route.weekLabel && !route.week;
    canonicalize(latest ? "weekly/" : weekPath(r.week, r.track), null);
    afterRoute(relPath(), Object.assign({}, route, { week: r.week.week_start }));
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
        document.getElementById("report-body").innerHTML = TR('<div class="empty-state"><h3>周榜加载失败</h3><p>', '<div class="empty-state"><h3>Failed to load weekly ranking</h3><p>') + escapeHtml(String(err)) + "</p></div>";
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
    navigate("archive/");
  }

  // ---------- theme (light / dark, persisted; follows prefers-color-scheme until chosen) ----------
  function themeLabel() {
    const b = document.getElementById("theme-toggle");
    if (!b) return;
    const d = document.documentElement.getAttribute("data-theme") === "dark";
    b.innerHTML = (d ? "&#9681;" : "&#9680;") + '<span class="tg-l"> ' + (d ? TR("浅色模式", "Light") : TR("深色模式", "Dark")) + "</span>";
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
        if (DATA.ai_search) {
          AI = Object.assign({}, AI, DATA.ai_search);
          if (AI.desc) TRACK_DESC[AI.track] = TR(AI.desc.zh, AI.desc.en);
        }
        // footer is static now (magazine.site_footer, same on every page); nothing to rewrite here
        render();
        window.addEventListener("popstate", renderIfMoved);
        window.addEventListener("hashchange", function () { if ((location.hash || "").indexOf("#/") === 0) render(); });
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
      xb.innerHTML = o ? TR("收起 &#9652;", "Collapse &#9652;") : TR("展开全文 &#9662;", "Read more &#9662;");
      xb.setAttribute("aria-expanded", o ? "true" : "false");
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
