/* Paper Daily site search (2026-10-26, direction A). One static, client-side script loaded on every page:
   (1) a shared engine over the month-sharded JSON index built by site_build/src/search_index.py (substring
       matching on NFKC + lower-cased text, so Chinese works without segmentation; AND of terms; ranking =
       title hits, then date desc, score, track order; one result per paper);
   (2) the ⌘K / Ctrl+K / "/" search overlay opened from the nav pill (#nav-search) — DOM and index are only
       created/fetched on first open; a full-screen sheet on mobile;
   (3) the full results page app (/search.html, /en/search.html; only when #sq-app exists), whose state lives
       in URL params: q, range (7|30|90|all), from, to (YYYY-MM-DD), deep=1, track=<slug>. */
(function () {
  "use strict";
  if (window.__pdSearch) return;
  window.__pdSearch = 1;
  var me = document.currentScript, src = (me && me.src) || "";
  var ROOT = src ? src.replace(/js\/search\.js(\?.*)?$/, "") : "/";
  var EN = /^en/i.test(document.documentElement.getAttribute("lang") || "");
  var LROOT = ROOT + (EN ? "en/" : "");
  var MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
  function TR(zh, en) { return EN ? en : zh; }
  var $ = function (id) { return document.getElementById(id); };
  var app = $("sq-app");

  // ------------------------------------------------------------------ engine
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
  var D = { man: null, rows: [], loaded: {}, pending: 0, F: null, labels: {}, colors: {}, order: {}, subs: [], p: null, base: "", err: false };
  function onData(fn) { D.subs.push(fn); }
  function notify() { D.subs.forEach(function (fn) { fn(); }); }
  function loadMan() {
    if (D.p) return D.p;
    var idx = app ? app.getAttribute("data-index") : LROOT + "search-index/manifest.json";
    D.base = idx.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
    D.p = fetch(idx, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) {
        D.man = m; D.F = m.fields;
        m.tracks.forEach(function (t, i) { D.labels[t.slug] = t.label; D.colors[t.slug] = t.color || "#888"; D.order[t.slug] = i; });
        notify();
        return m;
      }, function (e) { D.err = true; notify(); throw e; });
    return D.p;
  }
  function win(st) {  // effective [from, to] (inclusive), "" = open
    if (!D.man) return ["", ""];
    var last = D.man.latest_date;
    if (st.range === "7") return [addDays(last, -6), last];
    if (st.range === "30") return [addDays(last, -29), last];
    if (st.range === "90") return [addDays(last, -89), last];
    if (st.range === "all") return ["", ""];
    var a = st.from, b = st.to;
    if (a && b && a > b) { var t = a; a = b; b = t; }
    return [a, b];
  }
  // shards overlapping the window, newest first; with no query only the newest one is needed for "latest papers"
  function ensure(st, onlyNewest) {
    if (!D.man) return;
    var w = win(st);
    var need = D.man.shards.filter(function (s) { return (!w[0] || s.to >= w[0]) && (!w[1] || s.from <= w[1]); })
      .sort(function (a, b) { return a.to < b.to ? 1 : -1; });
    if (onlyNewest) need = need.slice(0, 1);
    need.forEach(function (s) {
      if (D.loaded[s.file]) return;
      D.loaded[s.file] = "loading";
      D.pending++;
      fetch(D.base + s.file + "?v=" + s.v).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (arr) {
          arr.forEach(function (a) {
            var o = {};
            D.F.forEach(function (k, i) { o[k] = a[i]; });
            if (o.url === "@") o.url = "https://arxiv.org/abs/" + String(o.id).slice(6);
            o.nt = norm(o.title); o.na = norm(o.authors); o.ns = norm(o.summary);
            D.rows.push(o);
          });
          D.loaded[s.file] = "ok";
        })
        .catch(function () { D.loaded[s.file] = "err"; })
        .then(function () { D.pending--; notify(); });
    });
  }
  // Short Latin terms ("id", "llm") match at word starts only, so "ID" doesn't hit "guided".
  function find(hay, t, from) {
    var p = hay.indexOf(t, from || 0);
    if (!/^[a-z0-9]{1,3}$/.test(t)) return p;
    while (p > 0 && /[a-z0-9]/.test(hay.charAt(p - 1))) p = hay.indexOf(t, p + 1);
    return p;
  }
  function terms(q) { return norm(q).split(/\s+/).filter(Boolean); }
  function count(hay, ts) { var n = 0; ts.forEach(function (t) { if (find(hay, t) >= 0) n++; }); return n; }
  function search(st) {
    var w = win(st), ts = terms(st.q), out = [], rows = D.rows;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (w[0] && r.date < w[0]) continue;
      if (w[1] && r.date > w[1]) continue;
      if (st.deep && !r.deep) continue;
      if (st.track && r.track !== st.track) continue;
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
        ((b.r.score || 0) - (a.r.score || 0)) || ((D.order[a.r.track] || 0) - (D.order[b.r.track] || 0));
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
  function reportHref(r) { return LROOT + "#/" + r.date + "/" + r.track + (r.id ? "?p=" + encodeURIComponent(r.id) : ""); }
  function deepHref(r) { return r.deep ? LROOT + "deep-readings/" + encodeURIComponent(r.deep) + ".html" : ""; }
  function srcLabel(u) {
    if (/arxiv\.org\//i.test(u)) return "arXiv";
    if (/openreview\.net\//i.test(u)) return "OpenReview";
    return TR("原文", "Source");
  }
  function fmt2(v) { return v == null || isNaN(v) ? "-" : Number(v).toFixed(2); }
  function params(st) {
    var u = new URLSearchParams();
    if (st.q) u.set("q", st.q);
    if (st.range && st.range !== "all") u.set("range", st.range);
    if (!st.range) { if (st.from) u.set("from", st.from); if (st.to) u.set("to", st.to); }
    if (st.deep) u.set("deep", "1");
    if (st.track) u.set("track", st.track);
    return u.toString();
  }
  var RANGES = [["7", TR("7天", "7d")], ["30", TR("30天", "30d")], ["90", TR("90天", "90d")], ["all", TR("全部", "All")]];
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/></svg>';
  function editable(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  // ------------------------------------------------------------------ nav pill label (⌘K on Mac, Ctrl K elsewhere)
  if (!MAC) [].forEach.call(document.querySelectorAll(".kp-k"), function (k) { k.textContent = "Ctrl K"; });

  // ------------------------------------------------------------------ ⌘K overlay
  var OV = { el: null, st: null, sel: 0, res: [], open: false, y: 0, t: null, lastFocus: null };
  var MAXROWS = 10;
  function ovLoadState() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem("pd-search-" + (EN ? "en" : "zh")) || "null"); } catch (e) { /* private mode */ }
    s = s || {};
    return { q: typeof s.q === "string" ? s.q : "", range: ["7", "30", "90", "all"].indexOf(s.range) >= 0 ? s.range : "all",
             from: "", to: "", deep: !!s.deep, track: typeof s.track === "string" ? s.track : "" };
  }
  function ovSave() {
    try { sessionStorage.setItem("pd-search-" + (EN ? "en" : "zh"), JSON.stringify(OV.st)); } catch (e) { /* ignore */ }
  }
  function ovBuild() {
    var el = document.createElement("div");
    el.className = "pk";
    el.id = "pk";
    el.hidden = true;
    el.innerHTML =
      '<div class="pk-scrim" data-pk-close></div>' +
      '<div class="pk-pal" role="dialog" aria-modal="true" aria-label="' + TR("搜索论文", "Search papers") + '">' +
      '<div class="pk-in"><label class="pk-box">' + ICON +
      '<input id="pk-q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="pk-l" aria-autocomplete="list" placeholder="' +
      TR("搜索标题、摘要、作者…", "Search titles, summaries, authors…") + '" aria-label="' + TR("搜索论文", "Search papers") + '"></label>' +
      '<kbd class="pk-esc">esc</kbd><button type="button" class="pk-x" data-pk-close>' + TR("取消", "Cancel") + "</button></div>" +
      '<div class="pk-ch" role="toolbar" aria-label="' + TR("筛选", "Filters") + '"></div>' +
      '<div class="pk-body"><div class="pk-g" id="pk-g"></div><ul class="pk-l" id="pk-l" role="listbox"></ul></div>' +
      '<div class="pk-f"><span class="kb"><kbd>↑</kbd><kbd>↓</kbd>' + TR("选择", "select") + '</span><span class="kb"><kbd>↵</kbd>' +
      TR("打开", "open") + '</span><span class="kb"><kbd>esc</kbd>' + TR("关闭", "close") + '</span><a class="pk-all" id="pk-all" href="' +
      LROOT + 'search.html"></a></div></div>';
    document.body.appendChild(el);
    OV.el = el;
    var q = $("pk-q");
    q.addEventListener("input", function () {
      clearTimeout(OV.t);
      OV.t = setTimeout(function () { OV.st.q = q.value.trim(); OV.sel = 0; ovSave(); ovRun(); }, 120);
    });
    q.addEventListener("keydown", ovKey);
    el.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t.closest("[data-pk-close]")) { ev.preventDefault(); ovClose(); return; }
      var c = t.closest(".pc");
      if (c) {
        if (c.hasAttribute("data-range")) OV.st.range = c.getAttribute("data-range");
        if (c.hasAttribute("data-deep")) OV.st.deep = !OV.st.deep;
        if (c.hasAttribute("data-track")) OV.st.track = OV.st.track === c.getAttribute("data-track") ? "" : c.getAttribute("data-track");
        OV.sel = 0; ovSave(); ovChips(); ovRun(); q.focus();
        return;
      }
    });
    el.addEventListener("mousemove", function (ev) {
      var r = ev.target.closest && ev.target.closest(".pr");
      if (r) { var i = +r.getAttribute("data-i"); if (i !== OV.sel) { OV.sel = i; ovSel(false); } }
    });
    onData(function () { if (OV.open) ovRun(); });
  }
  function ovChips() {
    var st = OV.st, h = "";
    RANGES.forEach(function (r) { h += '<button type="button" class="pc' + (st.range === r[0] ? " on" : "") + '" data-range="' + r[0] + '" aria-pressed="' + (st.range === r[0]) + '">' + r[1] + "</button>"; });
    h += '<span class="sep"></span><button type="button" class="pc deep' + (st.deep ? " on" : "") + '" data-deep="1" aria-pressed="' + st.deep + '">&#128214; ' + TR("深度解读", "Deep dives") + "</button>";
    if (D.man) {
      h += '<span class="sep"></span>';
      D.man.tracks.forEach(function (t) {
        if (t.slug === "agentic") return;  // legacy track: reachable on the full results page
        h += '<button type="button" class="pc tr' + (st.track === t.slug ? " on" : "") + '" data-track="' + esc(t.slug) + '" style="--c:' + esc(t.color || "#888") +
          '" aria-pressed="' + (st.track === t.slug) + '"><i></i>' + esc(t.short || t.label) + "</button>";
      });
    }
    OV.el.querySelector(".pk-ch").innerHTML = h;
  }
  function ovRow(x, i) {
    var r = x.r, ts = terms(OV.st.q), href = deepHref(r) || reportHref(r);
    var yr = D.man && r.date.slice(0, 4) === D.man.latest_date.slice(0, 4);
    return '<li role="presentation"><a class="pr" role="option" id="pk-o' + i + '" data-i="' + i + '" href="' + esc(href) + '" style="--c:' + esc(D.colors[r.track] || "#888") + '"' +
      (i === OV.sel ? ' aria-selected="true"' : ' aria-selected="false"') + '>' +
      '<span class="d" aria-hidden="true"></span><span class="t">' + mark(r.title, ts, 0) + "</span>" +
      '<span class="r"><span>' + esc(yr ? r.date.slice(5) : r.date) + "</span>" +
      (r.deep ? '<span class="b" title="' + TR("深度解读", "Deep dive") + '">&#128214; ' + (r.minutes ? r.minutes + "′" : TR("深读", "deep")) + "</span>" : "") + "</span>" +
      '<span class="s">' + esc(D.labels[r.track] || r.track) + " · " + mark(r.summary || r.authors || "", ts, 90, true) + "</span></a></li>";
  }
  function ovRun() {
    if (!OV.el) return;
    var st = OV.st, g = $("pk-g"), l = $("pk-l"), all = $("pk-all");
    if (D.err && !D.man) { g.textContent = TR("索引加载失败，请刷新重试。", "Could not load the search index — please reload."); l.innerHTML = ""; return; }
    if (!D.man) { g.innerHTML = '<span class="pk-ld">' + TR("正在加载索引…", "Loading index…") + "</span>"; l.innerHTML = ""; return; }
    ensure(st, !st.q);
    var res = search(st);
    OV.res = res;
    if (OV.sel >= Math.min(res.length, MAXROWS)) OV.sel = 0;
    var busy = D.pending ? ' <span class="pk-ld">' + TR("加载中…", "loading…") + "</span>" : "";
    g.innerHTML = (st.q ? TR("论文 · ", "Papers · ") + res.length : TR("最新论文", "Latest papers")) + busy;
    l.innerHTML = res.length ? res.slice(0, MAXROWS).map(ovRow).join("")
      : (D.pending ? "" : '<li class="pk-empty">' + TR("没有找到匹配的论文 — 试试更短的关键词或放宽时间范围。", "No matching papers — try a shorter keyword or a wider range.") + "</li>");
    var qs = params(st);
    all.setAttribute("href", LROOT + "search.html" + (qs ? "?" + qs : ""));
    all.innerHTML = st.q ? TR("查看全部 " + res.length + " 条结果 →", "See all " + res.length + " results →") : TR("打开搜索页 →", "Open search page →");
    ovSel(false);
  }
  function ovSel(scroll) {
    var rows = OV.el.querySelectorAll(".pr"), q = $("pk-q");
    [].forEach.call(rows, function (a, i) { a.setAttribute("aria-selected", i === OV.sel ? "true" : "false"); a.classList.toggle("sel", i === OV.sel); });
    if (rows[OV.sel]) { q.setAttribute("aria-activedescendant", rows[OV.sel].id); if (scroll) rows[OV.sel].scrollIntoView({ block: "nearest" }); }
    else q.removeAttribute("aria-activedescendant");
  }
  function ovKey(ev) {
    if (ev.isComposing || ev.keyCode === 229) return;
    var n = Math.min(OV.res.length, MAXROWS);
    if (ev.key === "ArrowDown") { ev.preventDefault(); if (n) { OV.sel = (OV.sel + 1) % n; ovSel(true); } }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); if (n) { OV.sel = (OV.sel - 1 + n) % n; ovSel(true); } }
    else if (ev.key === "Enter") {
      ev.preventDefault();
      clearTimeout(OV.t);
      var q = $("pk-q").value.trim();
      if (q !== OV.st.q) { OV.st.q = q; OV.sel = 0; ovSave(); ovRun(); }
      var a = OV.el.querySelectorAll(".pr")[OV.sel];
      var href = a && OV.st.q ? a.getAttribute("href") : $("pk-all").getAttribute("href");
      if (a && !OV.st.q) href = a.getAttribute("href");
      if (ev.metaKey || ev.ctrlKey) window.open(href, "_blank", "noopener"); else { ovClose(true); location.href = href; }
    } else if (ev.key === "Escape") { ev.preventDefault(); ovClose(); }
    else if (ev.key === "Tab") {  // keep focus inside the dialog
      var f = [].slice.call(OV.el.querySelectorAll(".pk-pal input, .pk-pal button, .pk-pal a")).filter(function (x) { return x.offsetParent; });
      if (f.length) { ev.preventDefault(); var i = f.indexOf(document.activeElement); f[(i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    }
  }
  function ovOpen() {
    if (OV.open) { $("pk-q").focus(); return; }
    if (!OV.el) { OV.st = ovLoadState(); ovBuild(); }
    OV.open = true;
    OV.lastFocus = document.activeElement;
    OV.y = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("pk-open");
    document.body.style.top = -OV.y + "px";
    OV.el.hidden = false;
    var q = $("pk-q");
    q.value = OV.st.q;
    ovChips();
    ovRun();
    q.focus();
    try { q.select(); } catch (e) { /* ignore */ }
    loadMan().then(function () { ovChips(); ovRun(); }, function () { ovRun(); });
  }
  function ovClose(leaving) {
    if (!OV.open) return;
    OV.open = false;
    OV.el.hidden = true;
    document.documentElement.classList.remove("pk-open");
    document.body.style.top = "";
    if (!leaving) {
      window.scrollTo(0, OV.y);
      if (OV.lastFocus && OV.lastFocus.focus) try { OV.lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }
  function trigger() {
    if (app) {  // on the results page the page's own input is the search box
      var q = $("sq-q");
      window.scrollTo(0, 0);
      if (q) { q.focus(); try { q.select(); } catch (e) { /* ignore */ } }
      return;
    }
    ovOpen();
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("#nav-search");
    if (!a || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    trigger();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.defaultPrevented || ev.isComposing) return;
    var k = (ev.key || "").toLowerCase();
    if (k === "k" && (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey) {
      ev.preventDefault();
      if (OV.open) ovClose(); else trigger();
      return;
    }
    if (OV.open && ev.key === "Escape") { ev.preventDefault(); ovClose(); return; }
    if (ev.key === "/" && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !OV.open && !editable(ev.target)) {
      ev.preventDefault();
      trigger();
    }
  });
  window.addEventListener("pageshow", function (ev) { if (ev.persisted && OV.open) ovClose(true); });

  // ------------------------------------------------------------------ results page (/search.html)
  if (!app) return;
  var PAGE = 20;
  var qEl = $("sq-q"), fromEl = $("sq-from"), toEl = $("sq-to"), statusEl = $("sq-status"), listEl = $("sq-results"),
      moreEl = $("sq-more"), subEl = $("sq-sub"), chipsEl = $("sq-chips"), datesEl = $("sq-dates"), clearEl = $("sq-clear"),
      resetEl = $("sq-reset");
  var shown = PAGE, state = readState(), customOpen = !state.range;

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
    var qs = params(state), url = location.pathname + (qs ? "?" + qs : "");
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
  function chips() {
    var h = "";
    RANGES.forEach(function (r) {
      h += '<button type="button" class="mc' + (state.range === r[0] ? " on" : "") + '" data-range="' + r[0] + '" aria-pressed="' + (state.range === r[0]) + '">' + r[1] + "</button>";
    });
    h += '<button type="button" class="mc' + (!state.range ? " on" : "") + '" id="sq-custom" aria-expanded="' + customOpen + '" aria-controls="sq-dates">' +
      TR("自定义", "Custom") + ' <span class="cv" aria-hidden="true">▾</span></button>';
    h += '<span class="ms-sep" aria-hidden="true"></span><button type="button" class="mc deep' + (state.deep ? " on" : "") + '" data-deep="1" aria-pressed="' + state.deep + '">&#128214; ' +
      TR("深度解读", "Deep dives") + (state.deep ? " ✓" : "") + "</button>";
    if (D.man) {
      h += '<span class="ms-sep" aria-hidden="true"></span>';
      D.man.tracks.forEach(function (t) {
        h += '<button type="button" class="mc tr' + (state.track === t.slug ? " on" : "") + '" data-track="' + esc(t.slug) + '" style="--c:' + esc(t.color || "#888") +
          '" aria-pressed="' + (state.track === t.slug) + '"><span class="dot"></span>' + esc(t.short || t.label) + "</button>";
      });
    }
    chipsEl.innerHTML = h;
  }
  function syncControls() {
    qEl.value = state.q;
    clearEl.hidden = !state.q;
    if (D.man && state.track && !D.labels[state.track]) state.track = "";
    var w = win(state);
    fromEl.value = state.range ? (state.range === "all" ? "" : w[0]) : state.from;
    toEl.value = state.range ? (state.range === "all" ? "" : w[1]) : state.to;
    datesEl.hidden = !customOpen;
    resetEl.hidden = state.range === "all" && !state.deep && !state.track;
    chips();
  }
  function item(x) {
    var r = x.r, ts = terms(state.q), report = reportHref(r), dh = deepHref(r), href = dh || report;
    var src = r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + srcLabel(r.url) + " &#8599;</a>" : "";
    return '<li class="t-' + esc(r.track) + '" style="--c:' + esc(D.colors[r.track] || "#888") + '"><div class="meta"><span class="tk">' + esc(D.labels[r.track] || r.track) + "</span>" +
      '<a class="sq-date" href="' + esc(report) + '">' + esc(r.date) + '</a><span aria-hidden="true">·</span><span class="sc" title="' + TR("综合分", "Score") + '">' + fmt2(r.score) + "</span>" +
      (r.deep ? '<span aria-hidden="true">·</span><a class="dr" href="' + esc(dh) + '">&#128214; ' + TR("深度解读", "Deep dive") + (r.minutes ? " " + r.minutes + TR(" 分钟", " min") : "") + "</a>" : "") + "</div>" +
      '<h3><a href="' + esc(href) + '">' + mark(r.title, ts, 0) + "</a></h3>" +
      (r.summary ? "<p>" + mark(r.summary, ts, 220, true) + "</p>" : "") +
      (r.authors ? '<div class="au">' + mark(r.authors, ts, 140) + "</div>" : "") +
      '<div class="more"><a href="' + esc(report) + '">' + TR("在日报中查看", "View in the daily issue") + "</a>" + (src ? " · " + src : "") + "</div></li>";
  }
  function describe(n) {
    var w = win(state), bits = [];
    if (state.range === "7") bits.push(TR("最近 7 天", "last 7 days"));
    else if (state.range === "30") bits.push(TR("最近 30 天", "last 30 days"));
    else if (state.range === "90") bits.push(TR("最近 90 天", "last 90 days"));
    else if (!state.range && (w[0] || w[1])) bits.push((w[0] || "…") + " – " + (w[1] || "…"));
    if (state.deep) bits.push(TR("只看深度解读", "deep dives only"));
    if (state.track) bits.push(D.labels[state.track] || state.track);
    var head = "<b>" + TR(n + " 篇", n + " paper" + (n === 1 ? "" : "s")) + "</b>" + (state.q ? " · “" + esc(state.q) + "”" : "");
    return head + (bits.length ? " · " + esc(bits.join(" · ")) : "") +
      (D.pending ? ' <span class="sq-loading">' + TR("（正在加载更多期数…）", "(loading more issues…)") + "</span>" : "");
  }
  var lastKey = "";
  function run() {
    if (!D.man) return;
    var key = JSON.stringify(state);
    if (key !== lastKey) { shown = PAGE; lastKey = key; }
    var res = search(state);
    statusEl.innerHTML = describe(res.length);
    if (!res.length && !D.pending) {
      listEl.innerHTML = '<li class="sq-empty"><h3>' + TR("没有找到匹配的论文", "No matching papers") +
        "</h3><p>" + TR("试试更短的关键词、放宽时间范围或取消“深度解读”。", "Try a shorter keyword, a wider date range, or turn off “Deep dives”.") + "</p></li>";
    } else {
      listEl.innerHTML = res.slice(0, shown).map(item).join("");
    }
    var left = res.length - shown;
    moreEl.hidden = left <= 0;
    if (left > 0) moreEl.textContent = TR("加载更多（还有 " + left + " 篇）", "Load more (" + left + " more)");
  }
  function update(push) { syncControls(); writeState(push); ensure(state, false); run(); }

  var t0 = null;
  qEl.addEventListener("input", function () {
    clearTimeout(t0);
    clearEl.hidden = !qEl.value;
    t0 = setTimeout(function () { state.q = qEl.value.trim(); update(false); }, 160);
  });
  $("sq-form").addEventListener("submit", function (ev) { ev.preventDefault(); clearTimeout(t0); state.q = qEl.value.trim(); update(true); qEl.blur(); });
  clearEl.addEventListener("click", function () { state.q = ""; update(true); qEl.focus(); });
  chipsEl.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".mc");
    if (!b) return;
    if (b.id === "sq-custom") { customOpen = !customOpen; syncControls(); if (customOpen) fromEl.focus(); return; }
    if (b.hasAttribute("data-range")) { state.range = b.getAttribute("data-range"); state.from = state.to = ""; customOpen = false; }
    if (b.hasAttribute("data-deep")) state.deep = !state.deep;
    if (b.hasAttribute("data-track")) state.track = state.track === b.getAttribute("data-track") ? "" : b.getAttribute("data-track");
    update(true);
  });
  function onDate() { state.range = ""; state.from = fromEl.value; state.to = toEl.value; if (!state.from && !state.to) state.range = "all"; update(true); }
  fromEl.addEventListener("change", onDate);
  toEl.addEventListener("change", onDate);
  resetEl.addEventListener("click", function () { state = { q: state.q, range: "all", from: "", to: "", deep: false, track: "" }; customOpen = false; update(true); });
  moreEl.addEventListener("click", function () { shown += PAGE; run(); });
  window.addEventListener("popstate", function () { state = readState(); customOpen = !state.range; syncControls(); writeState(false); ensure(state, false); run(); });
  onData(run);

  qEl.value = state.q;
  clearEl.hidden = !state.q;
  chips();
  if (!state.q && window.matchMedia && matchMedia("(min-width: 761px)").matches) qEl.focus();
  loadMan().then(function (m) {
    if (subEl) subEl.textContent = TR("在 " + m.count.toLocaleString() + " 篇论文中搜索标题、摘要、作者 · " + m.deep_count + " 篇有深度解读 · " + m.earliest_date + " – " + m.latest_date,
      "Search " + m.count.toLocaleString() + " papers by title, summary and authors · " + m.deep_count + " deep dives · " + m.earliest_date + " – " + m.latest_date);
    update(false);
  }, function () {
    statusEl.textContent = TR("索引加载失败，请刷新重试。", "Could not load the search index — please reload.");
  });
})();
