/* 时光机 / Time Machine (2026-10-30). Topic page: map <-> panel split, stop cards, transfer lines, inline reader of
   the canonical deep-dive page, pushState per stop (?stop=<arXiv id>&line=X&read=1). Overview: Hoot flies to the
   island you pick. No third-party requests. */
(function () {
  "use strict";
  var root = document.getElementById("tm");
  if (!root) return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = function () { return window.matchMedia && matchMedia("(max-width:760px)").matches; };

  if (root.getAttribute("data-mode") === "overview") {
    var oh = document.getElementById("tm-ohoot"), box = oh && oh.parentNode;
    var cards = root.querySelectorAll("a.tm-isl");
    var place = function (el) {
      if (!oh || !el) return;
      var b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
      oh.style.transform = "translate(" + Math.round(r.right - b.left - 64) + "px," + Math.round(r.top - b.top + 4) + "px)";
    };
    var last = null;
    try { last = localStorage.getItem("pd-tm-last"); } catch (e) {}
    var home = root.querySelector('a.tm-isl[data-topic="' + last + '"]') || cards[0];
    if (oh) { oh.style.transition = "none"; place(home); oh.offsetWidth; oh.style.transition = ""; }
    window.addEventListener("resize", function () { place(home); });
    [].forEach.call(cards, function (a) {
      a.addEventListener("click", function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0 || RM || mobile() || !oh) return;
        ev.preventDefault();
        place(a);
        setTimeout(function () { location.href = a.href; }, 820);
      });
    });
    return;
  }

  var D = JSON.parse(document.getElementById("tm-data").textContent);
  var T = D.t, S = D.stops, N = S.length;
  try { localStorage.setItem("pd-tm-last", D.topic); } catch (e) {}
  var svg = document.getElementById("tm-svg"), hoot = document.getElementById("tm-hoot");
  var scroller = document.getElementById("tm-scroll");
  var sts = [].slice.call(svg.querySelectorAll(".tm-st"));
  var cardsEl = document.getElementById("tm-cards"), reader = document.getElementById("tm-reader");
  var rbody = document.getElementById("tm-rbody"), toc = document.getElementById("tm-toc");
  var st = { i: N - 1, line: "", mode: "map" };
  var pos = sts.map(function (a) { var c = a.querySelector(".tm-core"); return [+c.getAttribute("cx"), +c.getAttribute("cy")]; });
  var hpos = sts.map(function (a, k) { return [pos[k][0], pos[k][1] + (a.getAttribute("data-side") === "up" ? 40 : -40)]; });

  function idx(id) { for (var k = 0; k < N; k++) if (S[k].id === id) return k; var n = parseInt(id, 10); return n >= 1 && n <= N && String(n) === id ? n - 1 : -1; }
  function onLine(k) { return !st.line || S[k].lines.indexOf(st.line) !== -1; }
  function step(d) { var k = st.i; do { k += d; } while (k >= 0 && k < N && !onLine(k)); return k >= 0 && k < N ? k : -1; }

  function url() {
    var q = "?stop=" + S[st.i].id + (st.line ? "&line=" + st.line : "") + (st.mode === "read" ? "&read=1" : st.mode === "map" ? "&view=map" : "");
    return location.pathname + q;
  }
  function push(replace) {
    var u = url(), s = { i: st.i, line: st.line, mode: st.mode };
    try { (replace ? history.replaceState : history.pushState).call(history, s, "", u); } catch (e) {}
  }

  function render(fly) {
    var s = S[st.i];
    root.setAttribute("data-mode", st.mode);
    sts.forEach(function (a, k) {
      a.classList.toggle("cur", k === st.i);
      a.classList.toggle("on", onLine(k));
      if (k === st.i) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
    });
    [].forEach.call(svg.querySelectorAll(".tm-line"), function (p) { p.classList.toggle("on", !st.line || p.getAttribute("data-line") === st.line); });
    svg.classList.toggle("tm-dim", !!st.line);
    [].forEach.call(svg.querySelectorAll(".tm-trail path"), function (p) { p.classList.toggle("off", +p.getAttribute("data-k") > st.i); });
    if (!fly || RM) hoot.style.transition = "none";
    hoot.style.transform = "translate(" + hpos[st.i][0] + "px," + hpos[st.i][1] + "px)";
    if (!fly || RM) { hoot.getBoundingClientRect(); hoot.style.transition = ""; }
    [].forEach.call(cardsEl.querySelectorAll(".tm-card"), function (c) { c.hidden = +c.getAttribute("data-i") !== st.i; });
    var card = document.getElementById("stop-" + s.id);
    [].forEach.call(card.querySelectorAll(".tm-xb"), function (b) { b.classList.toggle("on", b.getAttribute("data-line") === st.line); });
    document.getElementById("tm-hname").textContent = s.label;
    var onl = []; for (var k = 0; k < N; k++) if (onLine(k)) onl.push(k);
    document.getElementById("tm-pos").textContent = (onl.indexOf(st.i) + 1) + " / " + onl.length;
    document.getElementById("tm-prev").disabled = step(-1) < 0;
    var nx = step(1);
    document.getElementById("tm-next").disabled = nx < 0;
    ["tm-nextb", "tm-rnext"].forEach(function (id) {
      var b = document.getElementById(id);
      b.hidden = nx < 0;
      if (nx >= 0) b.textContent = T.next + " · " + S[nx].label + " →";
    });
    var fl = document.getElementById("tm-follow");
    if (st.line) {
      fl.hidden = false;
      fl.textContent = T.follow.replace("{l}", D.lines[st.line]) + " ";
      var lb = document.createElement("button"); lb.type = "button"; lb.textContent = T.leave.replace("{l}", D.lines[st.line]);
      lb.addEventListener("click", function () { st.line = ""; render(false); push(true); });
      fl.appendChild(lb);
    } else fl.hidden = true;
    document.getElementById("tm-handle").setAttribute("aria-expanded", st.mode === "map" ? "false" : "true");
    cardsEl.hidden = st.mode === "read";
    reader.hidden = st.mode !== "read";
    if (st.mode !== "read") cardsEl.scrollTop = 0;
    centre(fly);
  }
  function centre(smooth) {
    var x = pos[st.i][0] * (svg.getBoundingClientRect().width / +svg.getAttribute("width"));
    var off = svg.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    var to = Math.max(0, off + x - scroller.clientWidth / 2);
    if (smooth && !RM && scroller.scrollTo) scroller.scrollTo({ left: to, behavior: "smooth" });
    else { scroller.style.scrollBehavior = "auto"; scroller.scrollLeft = to; scroller.style.scrollBehavior = ""; }
  }

  var fitb = document.getElementById("tm-fit");
  if (fitb) fitb.addEventListener("click", function () {
    var on = !svg.classList.contains("tm-fitall");
    svg.classList.toggle("tm-fitall", on); fitb.setAttribute("aria-pressed", on ? "true" : "false");
    centre(false);
  });

  function go(k, mode, opts) {
    if (k < 0 || k >= N) return;
    opts = opts || {};
    if (!onLine(k) && !opts.keepLine) st.line = "";
    st.i = k;
    st.mode = mode || st.mode;
    render(true);
    if (st.mode === "read") openReader();
    if (!opts.nopush) push(false);
  }

  /* ---- inline reader: the canonical deep-dive page's <article>, fetched same-origin ---- */
  var cache = {};
  function openReader() {
    var card = document.getElementById("stop-" + S[st.i].id), b = card.querySelector(".tm-read");
    if (!b) { st.mode = "detail"; render(false); return; }
    var href = b.getAttribute("data-dive"), abs = new URL(href, location.href).href;
    document.getElementById("tm-ropen").setAttribute("href", href);
    toc.hidden = true; document.getElementById("tm-toc-b").setAttribute("aria-expanded", "false");
    rbody.innerHTML = '<p class="tm-loading">' + T.loading + "</p>";
    rbody.scrollTop = 0; prog();
    var p = cache[abs] || (cache[abs] = fetch(abs, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.text();
    }));
    var want = st.i;
    p.then(function (html) {
      if (st.i !== want || st.mode !== "read") return;
      var doc = new DOMParser().parseFromString(html, "text/html");
      var art = doc.getElementById("article"), h1 = doc.querySelector("main h1");
      if (!art) throw new Error("no article");
      art = art.cloneNode(true);
      [].forEach.call(art.querySelectorAll("script,style,.toc-m,.r-narrow,aside,.pd-shB,.pd-shC,.pd-rx,.pd-cm,#discussion,.pd-sh-acts,.vz-chip,.vz"), function (n) { n.remove(); });
      [].forEach.call(art.querySelectorAll("[src],[href]"), function (n) {
        ["src", "href"].forEach(function (a) {
          var v = n.getAttribute(a);
          if (v && v.charAt(0) !== "#" && !/^(https?:|mailto:|data:)/.test(v)) n.setAttribute(a, new URL(v, abs).href.replace(location.origin, ""));
        });
      });
      [].forEach.call(art.querySelectorAll("[id]"), function (n) { n.id = "tmr-" + n.id; });
      [].forEach.call(art.querySelectorAll('a[href^="#"]'), function (n) { n.setAttribute("href", "#tmr-" + n.getAttribute("href").slice(1)); });
      art.removeAttribute("id");
      rbody.innerHTML = "";
      if (h1) { var t = document.createElement("h1"); t.className = "tm-rt"; t.textContent = h1.textContent; rbody.appendChild(t); }
      rbody.appendChild(art);
      var hs = [].slice.call(art.querySelectorAll("h2[id]"));
      if (hs.length < 2) {  // older dives: one h2 + numbered h3 sections
        hs = [].slice.call(art.querySelectorAll("h2,h3"));
        hs.forEach(function (h, k) { if (!h.id) h.id = "tmr-h" + k; });
      }
      toc.innerHTML = "";
      hs.forEach(function (h) {
        var a = document.createElement("a"); a.href = "#" + h.id; a.textContent = h.textContent;
        a.addEventListener("click", function (e) { e.preventDefault(); rbody.scrollTop = h.offsetTop - rbody.offsetTop - 8; if (mobile()) setToc(false); });
        toc.appendChild(a);
      });
      document.getElementById("tm-toc-b").hidden = !hs.length;
      prog();
    }).catch(function () {
      if (st.i !== want) return;
      rbody.innerHTML = '<p class="tm-loading">' + T.fail + ' <a href="' + href + '">' + T.open + " →</a></p>";
    });
  }
  function setToc(on) { toc.hidden = !on; document.getElementById("tm-toc-b").setAttribute("aria-expanded", on ? "true" : "false"); }
  function prog() {
    var max = rbody.scrollHeight - rbody.clientHeight, f = max > 0 ? rbody.scrollTop / max : 0;
    document.getElementById("tm-prog").style.width = (f * 100).toFixed(1) + "%";
    var as = toc.querySelectorAll("a"), on = -1;
    [].forEach.call(as, function (a, k) { var h = document.getElementById(a.getAttribute("href").slice(1)); if (h && h.offsetTop - rbody.offsetTop - 40 <= rbody.scrollTop) on = k; });
    [].forEach.call(as, function (a, k) { a.classList.toggle("on", k === on); });
  }
  rbody.addEventListener("scroll", prog, { passive: true });

  /* ---- events ---- */
  sts.forEach(function (a, k) {
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      go(k, "detail", { keepLine: false });
    });
  });
  cardsEl.addEventListener("click", function (e) {
    var r = e.target.closest(".tm-read");
    if (r) { st.mode = "read"; render(false); openReader(); push(false); return; }
    var x = e.target.closest(".tm-xb");
    if (x) { var l = x.getAttribute("data-line"); st.line = st.line === l ? "" : l; render(false); push(false); }
  });
  function next() { var k = step(1); if (k >= 0) go(k, "detail", { keepLine: true }); }
  document.getElementById("tm-nextb").addEventListener("click", next);
  document.getElementById("tm-rnext").addEventListener("click", next);
  document.getElementById("tm-next").addEventListener("click", function () { var k = step(1); if (k >= 0) go(k, st.mode === "read" ? "detail" : st.mode, { keepLine: true }); });
  document.getElementById("tm-prev").addEventListener("click", function () { var k = step(-1); if (k >= 0) go(k, st.mode === "read" ? "detail" : st.mode, { keepLine: true }); });
  document.getElementById("tm-close").addEventListener("click", function () { st.mode = st.mode === "read" ? "detail" : "map"; render(false); push(false); });
  document.getElementById("tm-handle").addEventListener("click", function () { st.mode = st.mode === "map" ? "detail" : "map"; render(false); push(false); });
  document.getElementById("tm-rback").addEventListener("click", function () { st.mode = "detail"; render(false); push(false); });
  document.getElementById("tm-toc-b").addEventListener("click", function () { setToc(toc.hidden); });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea,[contenteditable]")) return;
    if (document.querySelector(".pd-search-overlay:not([hidden]), [role=dialog]:not([hidden])")) return;
    if (e.key === "ArrowRight" && st.mode !== "read") { var k = step(1); if (k >= 0) { e.preventDefault(); go(k, st.mode === "map" ? "map" : "detail", { keepLine: true }); } }
    else if (e.key === "ArrowLeft" && st.mode !== "read") { var j = step(-1); if (j >= 0) { e.preventDefault(); go(j, st.mode === "map" ? "map" : "detail", { keepLine: true }); } }
    else if (e.key === "Escape" && st.mode !== "map") { st.mode = st.mode === "read" ? "detail" : "map"; render(false); push(false); }
  });
  window.addEventListener("popstate", function (e) {
    var s = e.state;
    if (!s) { fromUrl(); render(false); if (st.mode === "read") openReader(); return; }
    st.i = s.i; st.line = s.line; st.mode = s.mode; render(true);
    if (st.mode === "read") openReader();
  });
  window.addEventListener("resize", function () { centre(false); });

  function fromUrl() {
    var q = new URLSearchParams(location.search), k = idx(q.get("stop") || "");
    st.i = k >= 0 ? k : N - 1;
    var l = q.get("line") || "";
    st.line = D.lines[l] && S[st.i].lines.indexOf(l) !== -1 ? l : "";
    st.mode = q.get("read") === "1" ? "read" : (k >= 0 && q.get("view") !== "map" ? "detail" : "map");
  }
  fromUrl();
  render(false);
  // first load: keep Hoot's station in view once fonts / layout settle (mobile scrolled away before)
  window.addEventListener("load", function () { centre(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { centre(false); });
  if (st.mode === "read") openReader();
  try { history.replaceState({ i: st.i, line: st.line, mode: st.mode }, "", location.pathname + location.search); } catch (e) {}
})();
