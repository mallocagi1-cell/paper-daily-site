/* Paper Daily site search (2026-10-26). Static, client-side: month-sharded JSON index from the builder
   (site_build/src/search_index.py). Substring matching on NFKC + lower-cased text, so Chinese works without
   word segmentation and English is case-insensitive. Filters live in URL params: q, range (7|30|90|all),
   from, to (YYYY-MM-DD), deep=1, track=<slug>. */
(function () {
  "use strict";
  var app = document.getElementById("sq-app");
  if (!app) return;
  var EN = app.getAttribute("data-lang") === "en";
  function TR(zh, en) { return EN ? en : zh; }
  var PAGE = 20;
  var $ = function (id) { return document.getElementById(id); };
  var qEl = $("sq-q"), fromEl = $("sq-from"), toEl = $("sq-to"), trackEl = $("sq-track"),
      statusEl = $("sq-status"), listEl = $("sq-results"), moreEl = $("sq-more"), subEl = $("sq-sub");
  var man = null, rows = [], loaded = {}, pending = 0, shown = PAGE, F = null, labels = {}, trackOrder = {};
  var state = readState();

  function norm(s) { s = String(s || ""); try { s = s.normalize("NFKC"); } catch (e) { /* old browsers */ } return s.toLowerCase(); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ""); }
  function addDays(d, n) {
    var t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) + n * 864e5;
    return new Date(t).toISOString().slice(0, 10);
  }

  function readState() {
    var u = new URLSearchParams(location.search);
    var s = { q: (u.get("q") || "").trim(), range: u.get("range") || "", from: u.get("from") || "", to: u.get("to") || "",
              deep: u.get("deep") === "1", track: u.get("track") || "" };
    if (!isDate(s.from)) s.from = "";
    if (!isDate(s.to)) s.to = "";
    if (["7", "30", "90", "all"].indexOf(s.range) < 0) s.range = (s.from || s.to) ? "" : "all";
    if (s.from || s.to) s.range = "";
    return s;
  }
  function writeState(push) {
    var u = new URLSearchParams();
    if (state.q) u.set("q", state.q);
    if (state.range && state.range !== "all") u.set("range", state.range);
    if (!state.range) { if (state.from) u.set("from", state.from); if (state.to) u.set("to", state.to); }
    if (state.deep) u.set("deep", "1");
    if (state.track) u.set("track", state.track);
    var qs = u.toString(), url = location.pathname + (qs ? "?" + qs : "");
    try { history[push ? "pushState" : "replaceState"](null, "", url); } catch (e) { /* file:// */ }
    var lt = document.querySelector(".nav .lang-tg");
    if (lt) {
      if (!lt.getAttribute("data-sq-base")) lt.setAttribute("data-sq-base", lt.getAttribute("href"));
      lt.setAttribute("href", lt.getAttribute("data-sq-base") + (qs ? "?" + qs : ""));
    }
    var zl = $("sq-zh-link");
    if (zl) zl.setAttribute("href", "../search.html" + (state.q ? "?q=" + encodeURIComponent(state.q) : ""));
    document.title = (state.q ? state.q + " · " : "") + TR("搜索 · Paper Daily", "Search · Paper Daily");
  }

  function window_() {  // effective [from, to] (inclusive), "" = open
    if (!man) return ["", ""];
    var last = man.latest_date;
    if (state.range === "7") return [addDays(last, -6), last];
    if (state.range === "30") return [addDays(last, -29), last];
    if (state.range === "90") return [addDays(last, -89), last];
    if (state.range === "all") return ["", ""];
    var a = state.from, b = state.to;
    if (a && b && a > b) { var t = a; a = b; b = t; }
    return [a, b];
  }

  function syncControls() {
    qEl.value = state.q;
    [].forEach.call(document.querySelectorAll(".sq-chip[data-range]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-range") === state.range ? "true" : "false");
    });
    [].forEach.call(document.querySelectorAll(".sq-chip[data-deep]"), function (b) {
      b.setAttribute("aria-pressed", (b.getAttribute("data-deep") === "1") === state.deep ? "true" : "false");
    });
    var w = window_();
    fromEl.value = state.range ? (state.range === "all" ? "" : w[0]) : state.from;
    toEl.value = state.range ? (state.range === "all" ? "" : w[1]) : state.to;
    fromEl.parentNode.parentNode.classList.toggle("sq-custom", !state.range);
    trackEl.value = state.track;
    if (trackEl.value !== state.track) { state.track = ""; trackEl.value = ""; }
  }

  // ---------- loading ----------
  function shardsNeeded() {
    var w = window_();
    return man.shards.filter(function (s) { return (!w[0] || s.to >= w[0]) && (!w[1] || s.from <= w[1]); });
  }
  function ensureShards() {
    shardsNeeded().forEach(function (s) {
      if (loaded[s.file]) return;
      loaded[s.file] = "loading";
      pending++;
      fetch(base + s.file + "?v=" + s.v).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (arr) {
          arr.forEach(function (a) {
            var o = {};
            F.forEach(function (k, i) { o[k] = a[i]; });
            if (o.url === "@") o.url = "https://arxiv.org/abs/" + String(o.id).slice(6);
            o.nt = norm(o.title); o.na = norm(o.authors); o.ns = norm(o.summary);
            rows.push(o);
          });
          loaded[s.file] = "ok";
        })
        .catch(function () { loaded[s.file] = "err"; })
        .then(function () { pending--; run(); });
    });
  }

  // ---------- search ----------
  // Short Latin terms ("id", "llm") match at word starts only, so "ID" doesn't hit "guided".
  function find(hay, t, from) {
    var p = hay.indexOf(t, from || 0);
    if (!/^[a-z0-9]{1,3}$/.test(t)) return p;
    while (p > 0 && /[a-z0-9]/.test(hay.charAt(p - 1))) p = hay.indexOf(t, p + 1);
    return p;
  }
  function terms() { return norm(state.q).split(/\s+/).filter(Boolean); }
  function count(hay, ts) { var n = 0; ts.forEach(function (t) { if (find(hay, t) >= 0) n++; }); return n; }
  function search() {
    var w = window_(), ts = terms(), out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (w[0] && r.date < w[0]) continue;
      if (w[1] && r.date > w[1]) continue;
      if (state.deep && !r.deep) continue;
      if (state.track && r.track !== state.track) continue;
      var th = 0;
      if (ts.length) {
        var ok = true;
        for (var j = 0; j < ts.length; j++) {
          var t = ts[j];
          if (find(r.nt, t) < 0 && find(r.na, t) < 0 && find(r.ns, t) < 0) { ok = false; break; }
        }
        if (!ok) continue;
        th = count(r.nt, ts);
      }
      out.push({ r: r, th: th });
    }
    out.sort(function (a, b) {
      return (b.th - a.th) || (a.r.date < b.r.date ? 1 : a.r.date > b.r.date ? -1 : 0) ||
        ((b.r.score || 0) - (a.r.score || 0)) || ((trackOrder[a.r.track] || 0) - (trackOrder[b.r.track] || 0));
    });
    // one result per paper (the same paper can be picked on several days / tracks): keep the best-ranked one
    var seen = {}, uniq = [];
    out.forEach(function (x) {
      var k = x.r.id || x.r.nt;
      if (seen[k]) { if (x.r.deep && !seen[k].r.deep) seen[k].r = Object.assign({}, seen[k].r, { deep: x.r.deep, minutes: x.r.minutes }); return; }
      seen[k] = x; uniq.push(x);
    });
    return uniq;
  }

  // highlight: map matches found in the normalised string back onto the original characters
  function mark(text, ts, maxLen, around) {
    text = String(text || "");
    var chars = Array.from(text), nstr = "", map = [];
    chars.forEach(function (c, i) { var n = norm(c); for (var k = 0; k < n.length; k++) map.push(i); nstr += n; });
    map.push(chars.length);
    var hit = new Array(chars.length + 1).join("0").split("").map(Number), first = -1;
    ts.forEach(function (t) {
      var p = find(nstr, t);
      while (p >= 0) {
        var a = map[p], b = map[p + t.length - 1];
        for (var x = a; x <= b; x++) hit[x] = 1;
        if (first < 0 || a < first) first = a;
        p = find(nstr, t, p + t.length);
      }
    });
    var s = 0, e = chars.length;
    if (maxLen && chars.length > maxLen) {
      s = around && first > 0 ? Math.max(0, first - Math.floor(maxLen / 3)) : 0;
      e = Math.min(chars.length, s + maxLen);
      if (e - s < maxLen) s = Math.max(0, e - maxLen);
    }
    var html = s > 0 ? "…" : "", open = false;
    for (var i = s; i < e; i++) {
      if (hit[i] && !open) { html += "<mark>"; open = true; }
      if (!hit[i] && open) { html += "</mark>"; open = false; }
      html += esc(chars[i]);
    }
    if (open) html += "</mark>";
    return html + (e < chars.length ? "…" : "");
  }

  function srcLabel(u) {
    if (/arxiv\.org\//i.test(u)) return "arXiv";
    if (/openreview\.net\//i.test(u)) return "OpenReview";
    return TR("原文", "Source");
  }
  function fmt2(v) { return v == null || isNaN(v) ? "-" : Number(v).toFixed(2); }

  function card(x) {
    var r = x.r, ts = terms();
    var report = "./#/" + r.date + "/" + r.track + (r.id ? "?p=" + encodeURIComponent(r.id) : "");
    var deepHref = r.deep ? "deep-readings/" + encodeURIComponent(r.deep) + ".html" : "";
    var href = deepHref || report;
    var badge = r.deep
      ? '<a class="chip deep sq-deep" href="' + esc(deepHref) + '">&#128214; ' + TR("深度解读", "Deep dive") +
        (r.minutes ? " · " + r.minutes + TR(" 分钟", " min") : "") + "</a>" : "";
    var src = r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + srcLabel(r.url) + " &#8599;</a>" : "";
    return '<li class="card sq-item t-' + esc(r.track) + '">' +
      '<div class="top"><span class="sq-meta"><span class="dr-track-tag">' + esc(labels[r.track] || r.track) + "</span>" +
      '<a class="sq-date" href="' + esc(report) + '">' + esc(r.date) + "</a></span>" +
      '<span class="sb" title="' + TR("综合分", "Score") + '">' + fmt2(r.score) + "</span></div>" +
      '<h4 class="card-title"><a href="' + esc(href) + '">' + mark(r.title, ts, 0) + "</a></h4>" +
      (r.authors ? '<div class="sq-authors">' + mark(r.authors, ts, 0) + "</div>" : "") +
      (r.summary ? '<p class="sq-snip">' + mark(r.summary, ts, 150, true) + "</p>" : "") +
      '<div class="foot">' + badge + '<a href="' + esc(report) + '">' + TR("在日报中查看", "View in the daily issue") + " &#8594;</a>" +
      (src ? "<span>·</span>" + src : "") + "</div></li>";
  }

  function describe(n) {
    var w = window_(), bits = [];
    if (state.range === "7") bits.push(TR("最近 7 天", "last 7 days"));
    else if (state.range === "30") bits.push(TR("最近 30 天", "last 30 days"));
    else if (state.range === "90") bits.push(TR("最近 90 天", "last 90 days"));
    else if (!state.range && (w[0] || w[1])) bits.push((w[0] || "…") + " – " + (w[1] || "…"));
    if (state.deep) bits.push(TR("只看深度解读", "deep dives only"));
    if (state.track) bits.push(labels[state.track] || state.track);
    var head = state.q
      ? TR("“" + esc(state.q) + "” 找到 " + n + " 篇论文", n + " paper" + (n === 1 ? "" : "s") + " for “" + esc(state.q) + "”")
      : TR("共 " + n + " 篇论文", n + " paper" + (n === 1 ? "" : "s"));
    var range = w[0] || w[1] ? "" : (man ? " · " + man.earliest_date + " – " + man.latest_date : "");
    return head + (bits.length ? " · " + esc(bits.join(" · ")) : range) +
      (pending ? ' <span class="sq-loading">' + TR("（正在加载更多期数…）", "(loading more issues…)") + "</span>" : "");
  }

  var lastKey = "";
  function run() {
    if (!man) return;
    var key = JSON.stringify(state);
    if (key !== lastKey) { shown = PAGE; lastKey = key; }
    var res = search();
    statusEl.innerHTML = describe(res.length);
    if (!res.length && !pending) {
      listEl.innerHTML = '<li class="empty-state sq-empty"><div class="icon">&#128269;</div><h3>' + TR("没有找到匹配的论文", "No matching papers") +
        "</h3><p>" + TR("试试更短的关键词、放宽时间范围或取消“只看深度解读”。", "Try a shorter keyword, a wider date range, or turn off “deep dives only”.") + "</p></li>";
    } else {
      listEl.innerHTML = res.slice(0, shown).map(card).join("");
    }
    var left = res.length - shown;
    moreEl.hidden = left <= 0;
    if (left > 0) moreEl.textContent = TR("加载更多（还有 " + left + " 篇）", "Load more (" + left + " more)");
  }

  function update(push) { syncControls(); writeState(push); ensureShards(); run(); }

  // ---------- events ----------
  var t0 = null;
  qEl.addEventListener("input", function () {
    clearTimeout(t0);
    t0 = setTimeout(function () { state.q = qEl.value.trim(); update(false); }, 160);
  });
  $("sq-form").addEventListener("submit", function (ev) { ev.preventDefault(); clearTimeout(t0); state.q = qEl.value.trim(); update(true); qEl.blur(); });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".sq-chip");
    if (!b) return;
    if (b.hasAttribute("data-range")) { state.range = b.getAttribute("data-range"); state.from = state.to = ""; }
    if (b.hasAttribute("data-deep")) state.deep = b.getAttribute("data-deep") === "1";
    update(true);
  });
  function onDate() { state.range = ""; state.from = fromEl.value; state.to = toEl.value; if (!state.from && !state.to) state.range = "all"; update(true); }
  fromEl.addEventListener("change", onDate);
  toEl.addEventListener("change", onDate);
  trackEl.addEventListener("change", function () { state.track = trackEl.value; update(true); });
  $("sq-reset").addEventListener("click", function () { state = { q: state.q, range: "all", from: "", to: "", deep: false, track: "" }; update(true); });
  moreEl.addEventListener("click", function () { shown += PAGE; run(); });
  window.addEventListener("popstate", function () { state = readState(); syncControls(); writeState(false); ensureShards(); run(); });

  // ---------- boot ----------
  var idx = app.getAttribute("data-index"), base = idx.replace(/[^/]*$/, "");
  qEl.value = state.q;
  if (!state.q && window.matchMedia && matchMedia("(min-width: 761px)").matches) qEl.focus();
  fetch(idx).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (m) {
    man = m; F = m.fields;
    m.tracks.forEach(function (t, i) { labels[t.slug] = t.label; trackOrder[t.slug] = i; });
    if (subEl) subEl.textContent = TR(m.count + " 篇论文 · " + m.deep_count + " 篇有深度解读 · " + m.earliest_date + " – " + m.latest_date,
      m.count + " papers · " + m.deep_count + " with deep dives · " + m.earliest_date + " – " + m.latest_date);
    update(false);
  }).catch(function () {
    statusEl.textContent = TR("索引加载失败，请刷新重试。", "Could not load the search index — please reload.");
  });
})();
