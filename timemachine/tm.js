/* 时光机 / Time Machine (2026-10-31, 航图 C3 port). Topic page: a paper chart that climbs SW -> NE; Hoot flies the
   dotted route on a broom (red trail = flown), stage islands light up as you go; the panel beside it resizes
   (map <-> detail <-> inline reader of the canonical deep-dive page); pushState per stop
   (?stop=<arXiv id>&line=X&read=1). Camera = SVG px size (--s) + the pane's scroll position: 全图 fits the whole chart,
   否则 follow Hoot. Overview: Hoot flies to the island you pick. No third-party requests. */
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
  var T = D.t, S = D.stops, N = S.length, W = D.W, H = D.H;
  try { localStorage.setItem("pd-tm-last", D.topic); } catch (e) {}
  var svg = document.getElementById("tm-svg"), hoot = document.getElementById("tm-hoot"), trail = document.getElementById("tm-trail");
  var rot = hoot.querySelector(".tm-rot");
  var scroller = document.getElementById("tm-scroll");
  var sts = [].slice.call(svg.querySelectorAll(".tm-st"));
  var isles = [].slice.call(svg.querySelectorAll(".tm-isle"));
  var segs = [].slice.call(svg.querySelectorAll(".tm-segs path"));
  var cardsEl = document.getElementById("tm-cards"), reader = document.getElementById("tm-reader");
  var rbody = document.getElementById("tm-rbody"), toc = document.getElementById("tm-toc");
  var st = { i: N - 1, line: "", mode: "map" };
  var pos = sts.map(function (a) { return [+a.getAttribute("data-x"), +a.getAttribute("data-y")]; });
  var hoff = sts.map(function (a) { return [+a.getAttribute("data-hx"), +a.getAttribute("data-hy")]; });
  var cum = [0];
  segs.forEach(function (p) { cum.push(cum[cum.length - 1] + p.getTotalLength()); });
  var LEN = cum[N - 1];

  function pointAt(L) {
    if (!segs.length || L <= 0) return { x: pos[0][0], y: pos[0][1] };
    var k = 0;
    while (k < segs.length - 1 && L > cum[k + 1]) k++;
    var p = segs[k].getPointAtLength(Math.min(Math.max(0, L - cum[k]), segs[k].getTotalLength()));
    return { x: p.x, y: p.y };
  }
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

  /* ---- camera: scale (SVG px size, screen-constant text via --s) + scroll position ---- */
  var S_MIN = 0.8, cam = { s: 1, user: mobile() ? "follow" : "fit" }, camRaf = null;
  function paneW() { return scroller.clientWidth || 1; }
  function paneH() { return scroller.clientHeight || 1; }
  function fitScale() { return Math.min(1.4, Math.max(S_MIN, Math.min(paneW() / W, paneH() / H))); }
  function followScale() { return mobile() ? 1 : (st.mode === "read" ? 1 : 1.3); }
  // cam.z = the user's own zoom (wheel / pinch / + -), kept across stops; null = automatic (fit / follow)
  function camMode() { return cam.z ? "follow" : st.mode === "map" ? cam.user : "follow"; }
  function targetScale() { return cam.z ? cam.z : camMode() === "fit" ? fitScale() : followScale(); }
  var Z_MAX = 3;
  function zMin() { return Math.min(S_MIN, fitScale()); }
  function applyScale(s) {
    cam.s = s;
    svg.style.width = (W * s).toFixed(1) + "px"; svg.style.height = (H * s).toFixed(1) + "px";
    svg.style.setProperty("--s", s.toFixed(4));
    svg.classList.toggle("tm-far", s < 0.68);
  }
  var hootL = cum[N - 1], hootOff = hoff[N - 1].slice();
  function hootPt() { var p = pointAt(hootL); return { x: p.x + hootOff[0], y: p.y + hootOff[1] }; }
  function centre(smooth) {
    var s = cam.s, fx, fy;
    if (camMode() === "fit") { fx = W / 2; fy = H / 2; } else { var p = hootPt(); fx = p.x; fy = p.y; }
    var x = fx * s - paneW() / 2, y = fy * s - paneH() / 2 + (mobile() && st.mode !== "map" ? paneH() * 0.28 : 0);
    if (smooth && !RM && scroller.scrollTo) scroller.scrollTo({ left: x, top: y, behavior: "smooth" });
    else { scroller.scrollLeft = x; scroller.scrollTop = y; }
  }
  function camTo(animate) {
    if (typeof gCommit === "function") gCommit();
    var to = targetScale();
    cancelAnimationFrame(camRaf); camRaf = null;
    if (!animate || RM || Math.abs(to - cam.s) < 1e-3) { applyScale(to); centre(animate && !RM); return; }
    var from = cam.s, t0 = performance.now(), dur = 480;
    var stepf = function (now) {
      var p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      applyScale(from + (to - from) * e); centre(false);
      if (p < 1) camRaf = requestAnimationFrame(stepf); else camRaf = null;
    };
    camRaf = requestAnimationFrame(stepf);
  }

  /* ---- Hoot: on the broom between stops, standing by the flag at the last one; red trail = flown ---- */
  var flying = false, raf = null;
  function drawTrail(L) {
    var d = "", stp = 6, n = Math.ceil(L / stp);
    for (var k = 0; k <= n; k++) { var q = pointAt(Math.min(L, k * stp)); d += (k ? "L" : "M") + q.x.toFixed(1) + " " + q.y.toFixed(1); }
    trail.setAttribute("d", L > 0 ? d : "");
  }
  function setHoot(L, off, ang, flip) {
    hootL = L; hootOff = off;
    var p = pointAt(L);
    hoot.style.transform = "translate(" + (p.x + off[0]).toFixed(1) + "px," + (p.y + off[1]).toFixed(1) + "px)";
    if (rot) rot.setAttribute("transform", "rotate(" + (ang || 0).toFixed(1) + ") scale(" + (flip ? -1 : 1) + " 1)");
    drawTrail(L);
  }
  function land(k) { hoot.classList.toggle("tm-landed", k === N - 1); placeFlag(k); }
  // 你在这里 follows the current stop: planted where Hoot lands, hidden while Hoot is in the air
  var flag = document.getElementById("tm-flag");
  function placeFlag(k) {
    if (!flag) return;
    var a = sts[k], fs = +a.getAttribute("data-fs") || 1, x0 = 16 * fs, ln = flag.querySelector("line"), tx = flag.querySelector("text");
    flag.setAttribute("transform", "translate(" + a.getAttribute("data-x") + " " + a.getAttribute("data-y") + ")");
    flag.setAttribute("data-i", k);
    ln.setAttribute("x1", x0); ln.setAttribute("x2", x0);
    flag.querySelector("path").setAttribute("d", "M" + x0 + " -60 h" + 38 * fs + " l" + -8 * fs + " 9 l" + 8 * fs + " 9 h" + -38 * fs + " z");
    tx.setAttribute("x", x0); tx.setAttribute("text-anchor", fs < 0 ? "end" : "start");
    flag.classList.remove("tm-away");
  }
  function fly(k, done) {
    var from = hootL, to = cum[k], dist = Math.abs(to - from), o0 = hootOff.slice(), o1 = hoff[k];
    cancelAnimationFrame(raf);
    hoot.classList.remove("tm-landed");
    if (flag && dist >= 1) flag.classList.add("tm-away");
    if (RM || dist < 1) { flying = false; hoot.classList.remove("tm-flying"); setHoot(to, o1, 0, false); land(k); if (done) done(); return; }
    var dur = Math.min(2200, 420 + dist * 0.55), t0 = performance.now(), dir = to >= from ? 1 : -1;
    flying = true; hoot.classList.add("tm-flying");
    var stepf = function (now) {
      var t = Math.min(1, (now - t0) / dur), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var L = from + (to - from) * e;
      var a = pointAt(L), b = pointAt(Math.max(0, Math.min(LEN, L + dir * 10)));
      var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, flip = dir < 0;
      if (flip) ang -= 180;
      var lift = Math.sin(Math.PI * t);
      var off = [o0[0] * (1 - e) + o1[0] * e, o0[1] * (1 - e) + o1[1] * e];
      off = [off[0] * (1 - lift), off[1] * (1 - lift) - 14 * lift];
      setHoot(L, off, ang * 0.8 * Math.sin(Math.PI * Math.min(1, t * 1.15)), flip);
      if (camMode() === "follow") centre(false);
      if (t < 1) raf = requestAnimationFrame(stepf);
      else { flying = false; hoot.classList.remove("tm-flying"); setHoot(to, o1, 0, false); land(k); if (done) done(); }
    };
    raf = requestAnimationFrame(stepf);
  }
  function jumpHoot() { cancelAnimationFrame(raf); flying = false; hoot.classList.remove("tm-flying"); setHoot(cum[st.i], hoff[st.i], 0, false); land(st.i); }

  function render(move) {
    var s = S[st.i];
    root.setAttribute("data-mode", st.mode);
    sts.forEach(function (a, k) {
      a.classList.toggle("cur", k === st.i);
      a.classList.toggle("on", onLine(k));
      if (k === st.i) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
    });
    // one marked stop only: keyboard focus on a station follows the current stop (roving focus), so a stop focused
    // earlier (e.g. by a right-click, then Esc + arrow keys) never keeps a focus ring after the current stop moves on
    var ae = document.activeElement;
    if (ae && ae !== sts[st.i] && sts.indexOf(ae) !== -1) { try { sts[st.i].focus({ preventScroll: true }); } catch (e) { ae.blur(); } }
    [].forEach.call(svg.querySelectorAll(".tm-line"), function (p) { p.classList.toggle("on", !st.line || p.getAttribute("data-line") === st.line); });
    svg.classList.toggle("tm-dim", !!st.line);
    [].forEach.call(document.querySelectorAll(".tm-lg"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-line") === st.line ? "true" : "false"); });
    var stage = sts[st.i].getAttribute("data-stage");
    isles.forEach(function (g) { g.classList.toggle("cur", g.getAttribute("data-stage") === stage); });
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
    fitb.setAttribute("aria-pressed", camMode() === "fit" ? "true" : "false");
    if (move === "fly") { camTo(true); fly(st.i); }
    else if (move === "jump") { jumpHoot(); camTo(false); }
    else camTo(true);
  }

  var fitb = document.getElementById("tm-fit");
  fitb.addEventListener("click", function () {
    if (st.mode !== "map") { st.mode = "map"; cam.user = "fit"; render(false); push(false); return; }
    cam.user = cam.z || cam.user !== "fit" ? "fit" : "follow"; cam.z = null;
    render(false);
  });

  /* ---- map-like pan / zoom: drag to pan, wheel / trackpad pinch / two-finger pinch zoom around the pointer ---- */
  function zoomAt(s, cx, cy) {  // cx, cy = client coords that stay fixed
    gCommit();
    s = Math.min(Z_MAX, Math.max(zMin(), s));
    if (Math.abs(s - cam.s) < 1e-4) return;
    cancelAnimationFrame(camRaf); camRaf = null;
    var r = svg.getBoundingClientRect(), px = (cx - r.left) / cam.s, py = (cy - r.top) / cam.s;
    cam.z = s; applyScale(s);
    var r2 = svg.getBoundingClientRect();
    scroller.scrollLeft += r2.left + px * s - cx; scroller.scrollTop += r2.top + py * s - cy;
    fitb.setAttribute("aria-pressed", "false");
    root.setAttribute("data-zoom", s.toFixed(3));
  }
  function paneMid() { var r = scroller.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  /* Live gesture (trackpad pinch, Safari gesture*, touch pinch): a CSS transform on the SVG, rAF-batched, committed
     to real size + scroll 140 ms after the last event (so no relayout per event). */
  var G = null, gRaf = null, gT = null, panQ = [0, 0], pRaf = null;
  function gBegin() {
    if (G) return;
    cancelAnimationFrame(camRaf); camRaf = null;
    var r = svg.getBoundingClientRect();
    G = { k: 1, tx: 0, ty: 0, ox: r.left, oy: r.top, cx: 0, cy: 0 };
    svg.style.transformOrigin = "0 0"; svg.style.willChange = "transform";
  }
  function zoomBy(f, cx, cy) {  // multiply the live scale by f, keeping client point (cx, cy) fixed
    gBegin();
    var k = Math.min(Z_MAX / cam.s, Math.max(zMin() / cam.s, G.k * f));
    f = k / G.k;
    G.tx = cx - G.ox - (cx - G.ox - G.tx) * f; G.ty = cy - G.oy - (cy - G.oy - G.ty) * f;
    G.k = k; G.cx = cx; G.cy = cy;
    if (!gRaf) gRaf = requestAnimationFrame(function () { gRaf = null; if (G) svg.style.transform = "translate(" + G.tx + "px," + G.ty + "px) scale(" + G.k + ")"; });
    clearTimeout(gT); gT = setTimeout(gCommit, 140);
  }
  function gCommit() {
    clearTimeout(gT); cancelAnimationFrame(gRaf); gRaf = null;
    if (!G) return;
    var g = G; G = null;
    svg.style.transform = "translate(" + g.tx + "px," + g.ty + "px) scale(" + g.k + ")";
    var r = svg.getBoundingClientRect(), s = cam.s * g.k, ux = (g.cx - r.left) / s, uy = (g.cy - r.top) / s;
    svg.style.transform = ""; svg.style.willChange = "";
    cam.z = s; applyScale(s);
    var r2 = svg.getBoundingClientRect();
    scroller.scrollLeft += r2.left + ux * s - g.cx; scroller.scrollTop += r2.top + uy * s - g.cy;
    fitb.setAttribute("aria-pressed", "false");
    root.setAttribute("data-zoom", s.toFixed(3));
  }
  function panBy(dx, dy) {
    if (G) { G.tx -= dx; G.ty -= dy; zoomBy(1, G.cx, G.cy); return; }
    panQ[0] += dx; panQ[1] += dy;
    if (!pRaf) pRaf = requestAnimationFrame(function () { pRaf = null; scroller.scrollLeft += panQ[0]; scroller.scrollTop += panQ[1]; panQ = [0, 0]; });
  }
  /* Wheel over the map (only there: the listener is on the pane, so page scroll elsewhere is never touched):
     - ctrlKey (Chrome/Firefox/Safari trackpad pinch, also ctrl+mouse wheel): zoom at the cursor, exp(-deltaY/100).
     - looks like a classic mouse wheel: zoom at the cursor. Heuristic: deltaMode 1/2 (line/page, Firefox mice), or
       pixel mode with deltaX == 0, an integer |deltaY| >= 50 (Chrome/Safari notch = 100/120/±4n px) AND no trackpad-looking
       event in the last 300 ms (trackpad streams: fractional or small deltas, usually some deltaX; momentum keeps it sticky).
     - otherwise (two-finger trackpad scroll): pan both ways, like Google Maps / Figma. preventDefault also stops the
       browser's back/forward swipe on horizontal scroll (plus overscroll-behavior: contain on the pane). */
  var padT = 0;
  scroller.addEventListener("wheel", function (e) {
    e.preventDefault();
    var u = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? paneH() : 1, dx = e.deltaX * u, dy = e.deltaY * u, now = performance.now();
    if (e.ctrlKey) { zoomBy(Math.exp(-Math.max(-50, Math.min(50, dy)) / 100), e.clientX, e.clientY); return; }
    var mouse = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && e.deltaY === Math.round(e.deltaY) && now - padT > 300);
    if (mouse) { zoomBy(Math.exp(-Math.max(-240, Math.min(240, dy)) * 0.0015), e.clientX, e.clientY); return; }
    padT = now;
    panBy(dx, dy);
  }, { passive: false });
  // Safari (macOS) pinch: gesture* events with a cumulative e.scale
  var gsc = 1;
  scroller.addEventListener("gesturestart", function (e) { e.preventDefault(); gsc = e.scale || 1; });
  scroller.addEventListener("gesturechange", function (e) { e.preventDefault(); var sc = e.scale || 1; zoomBy(sc / gsc, e.clientX, e.clientY); gsc = sc; });
  scroller.addEventListener("gestureend", function (e) { e.preventDefault(); gCommit(); });
  var drag = null, dragged = false;
  // a right / middle press neither drags nor focuses a station (the context menu still opens); Esc after it must not
  // leave a focus ring on a stop that is not the current one
  scroller.addEventListener("mousedown", function (e) { if (e.button !== 0 && e.target.closest && e.target.closest(".tm-st")) e.preventDefault(); });
  scroller.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" || e.button !== 0 || !e.isPrimary) return;  // touch: native one-finger scroll
    drag = { x: e.clientX, y: e.clientY, l: scroller.scrollLeft, t: scroller.scrollTop, id: e.pointerId, on: false };
    dragged = false;
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on && dx * dx + dy * dy < 36) return;  // 6px threshold: below it, it is a click
    if (!drag.on) { drag.on = true; dragged = true; cancelAnimationFrame(camRaf); camRaf = null; scroller.classList.add("tm-drag"); }
    e.preventDefault();
    var now = performance.now(), dt = Math.max(1, now - (drag.pt || now - 16));
    drag.vx = (e.clientX - (drag.px || e.clientX)) / dt; drag.vy = (e.clientY - (drag.py || e.clientY)) / dt;
    drag.px = e.clientX; drag.py = e.clientY; drag.pt = now;
    scroller.scrollLeft = drag.l - dx; scroller.scrollTop = drag.t - dy;
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; scroller.classList.remove("tm-drag"); drag = null; setTimeout(function () { dragged = false; }, 0);
    if (!d.on || RM || performance.now() - (d.pt || 0) > 80) return;
    var vx = d.vx || 0, vy = d.vy || 0, t0 = performance.now();  // short glide, ~16 px/frame decays in ~300 ms
    var glide = function (now) {
      var dt = Math.min(32, now - t0); t0 = now; vx *= Math.pow(0.92, dt / 16); vy *= Math.pow(0.92, dt / 16);
      if (Math.abs(vx) + Math.abs(vy) < 0.02 || drag) return;
      scroller.scrollLeft -= vx * dt; scroller.scrollTop -= vy * dt; requestAnimationFrame(glide);
    };
    requestAnimationFrame(glide);
  }
  window.addEventListener("pointerup", endDrag); window.addEventListener("pointercancel", endDrag);
  scroller.addEventListener("click", function (e) { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  scroller.addEventListener("dragstart", function (e) { e.preventDefault(); });
  var pinch = null;
  function tdist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1; }
  scroller.addEventListener("touchstart", function (e) { if (e.touches.length === 2) pinch = { d: tdist(e.touches), s: cam.s }; }, { passive: true });
  scroller.addEventListener("touchmove", function (e) {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    var t = e.touches;
    var d = tdist(t); zoomBy(d / pinch.d, (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2); pinch.d = d;
  }, { passive: false });
  scroller.addEventListener("touchend", function (e) { if (e.touches.length < 2 && pinch) { pinch = null; gCommit(); } }, { passive: true });
  document.getElementById("tm-zin").addEventListener("click", function () { var m = paneMid(); zoomAt(cam.s * 1.4, m[0], m[1]); });
  document.getElementById("tm-zout").addEventListener("click", function () { var m = paneMid(); zoomAt(cam.s / 1.4, m[0], m[1]); });
  document.getElementById("tm-zreset").addEventListener("click", function () {
    cam.z = null; cam.user = mobile() ? "follow" : "fit"; root.removeAttribute("data-zoom"); render(false);
  });

  /* ---- full screen: the map + reader container; Fullscreen API (webkit-prefixed for Safari), a fixed
     full-viewport fallback where element full screen does not exist (iOS Safari). Esc: the browser leaves real full
     screen itself; in the fallback our own Esc handler leaves it first, before Esc 收起. ---- */
  var app = root.querySelector(".tm-app"), fsb = document.getElementById("tm-fs");
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsOn() { return fsEl() === app || root.classList.contains("tm-fsx"); }
  function fsSync() {
    var on = fsOn(), lab = fsb.getAttribute(on ? "data-off" : "data-on");
    root.classList.toggle("tm-fs", on);
    fsb.setAttribute("aria-pressed", on ? "true" : "false"); fsb.setAttribute("aria-label", lab); fsb.setAttribute("title", lab);
    requestAnimationFrame(function () { camTo(false); });
  }
  function fsx(on) { root.classList.toggle("tm-fsx", on); document.documentElement.classList.toggle("tm-fsx-on", on); fsSync(); }
  function fsToggle() {
    if (fsOn()) {
      if (root.classList.contains("tm-fsx")) fsx(false);
      else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    var rq = app.requestFullscreen || app.webkitRequestFullscreen;
    if (!rq) { fsx(true); return; }
    try {
      var r = rq.call(app);
      if (r && r.catch) r.catch(function () { fsx(true); });
    } catch (e) { fsx(true); }
  }
  if (fsb && app) {
    fsb.addEventListener("click", fsToggle);
    document.addEventListener("fullscreenchange", fsSync);
    document.addEventListener("webkitfullscreenchange", fsSync);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("tm-fsx")) { e.stopImmediatePropagation(); fsx(false); }
    }, true);
  }

  function go(k, mode, opts) {
    if (k < 0 || k >= N) return;
    opts = opts || {};
    if (!onLine(k) && !opts.keepLine) st.line = "";
    st.i = k;
    st.mode = mode || st.mode;
    render("fly");
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
      [].forEach.call(art.querySelectorAll("script,style,.toc-m,.r-narrow,aside,.pd-shB,.pd-shC,.pd-rx,.pd-cm,#discussion,.pd-sh-acts"), function (n) { n.remove(); });
      [].forEach.call(art.querySelectorAll("[src],[href]"), function (n) {
        ["src", "href"].forEach(function (a) {
          var v = n.getAttribute(a);
          if (v && v.charAt(0) !== "#" && !/^(https?:|mailto:|data:)/.test(v)) n.setAttribute(a, new URL(v, abs).href.replace(location.origin, ""));
        });
      });
      // prefix every id AND every reference to one (aria-*, #href, SVG url(#..)), or 图解 chips and figure markers break
      [].forEach.call(art.querySelectorAll("[id]"), function (n) { n.id = "tmr-" + n.id; });
      [].forEach.call(art.querySelectorAll('a[href^="#"]'), function (n) { n.setAttribute("href", "#tmr-" + n.getAttribute("href").slice(1)); });
      [].forEach.call(art.querySelectorAll("[aria-controls],[aria-labelledby],[aria-describedby],[for]"), function (n) {
        ["aria-controls", "aria-labelledby", "aria-describedby", "for"].forEach(function (a) {
          var v = n.getAttribute(a); if (v) n.setAttribute(a, v.split(/\s+/).map(function (x) { return x && "tmr-" + x; }).join(" "));
        });
      });
      [].forEach.call(art.querySelectorAll("svg *"), function (n) {
        ["marker-start", "marker-mid", "marker-end", "fill", "stroke", "clip-path", "mask", "filter", "href", "xlink:href"].forEach(function (a) {
          var v = n.getAttribute(a); if (!v) return;
          if (/url\(#/.test(v)) n.setAttribute(a, v.replace(/url\(#/g, "url(#tmr-"));
          else if ((a === "href" || a === "xlink:href") && v.charAt(0) === "#" && v.indexOf("#tmr-") !== 0) n.setAttribute(a, "#tmr-" + v.slice(1));
        });
      });
      art.removeAttribute("id");
      return adopt(doc, abs).then(function () { if (st.i !== want || st.mode !== "read") return; place(doc, art, h1, abs); });
    }).catch(function () {
      if (st.i !== want) return;
      rbody.innerHTML = '<p class="tm-loading">' + T.fail + ' <a href="' + href + '">' + T.open + " →</a></p>";
    });
  }
  // The dive's own content stylesheets (KaTeX, Hoot 图解, ...) must be on this page, or figures fall back to UA styles
  // (black SVG fills, bare links). Everything the dive links except what this page already has / the widgets stripped
  // above (READER_SKIP in timemachine_check.py, keep in sync). Resolves once all are loaded, so nothing paints unstyled.
  var SKIP = ["css/pages.css", "fonts.googleapis.com", "selshare/", "share/", "rx/"];
  function adopt(doc, abs) {
    var have = {}, waits = [];
    [].forEach.call(document.querySelectorAll('link[rel~="stylesheet"]'), function (l) { have[new URL(l.href, location.href).pathname] = l; });
    [].forEach.call(doc.querySelectorAll('head link[rel~="stylesheet"]'), function (l) {
      var h = l.getAttribute("href"); if (!h || SKIP.some(function (k) { return h.indexOf(k) >= 0; })) return;
      var u = new URL(h, abs); if (u.origin !== location.origin) return;
      var e = have[u.pathname];
      if (!e) { e = document.createElement("link"); e.rel = "stylesheet"; e.href = u.pathname + u.search; e.setAttribute("data-tm-dive", "");
        have[u.pathname] = e; document.head.appendChild(e); }
      if (!e.sheet) waits.push(new Promise(function (ok) { e.addEventListener("load", ok); e.addEventListener("error", ok); setTimeout(ok, 4000); }));
    });
    return Promise.all(waits);
  }
  // the dive's enhancement scripts that act on its content (Hoot 图解 toggles / sliders): re-run on the new article
  var RUN = ["viz/viz.js"];
  function rerun(doc, abs) {
    [].forEach.call(doc.querySelectorAll("script[src]"), function (sc) {
      var h = sc.getAttribute("src"); if (!RUN.some(function (k) { return h.indexOf(k) >= 0; })) return;
      var u = new URL(h, abs); if (u.origin !== location.origin) return;
      var old = document.querySelector('script[data-tm-run="' + u.pathname + '"]'); if (old) old.remove();
      var e = document.createElement("script"); e.src = u.pathname + u.search; e.setAttribute("data-tm-run", u.pathname); document.body.appendChild(e);
    });
  }
  function place(doc, art, h1, abs) {
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
      rerun(doc, abs);
      prog();
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
  [].forEach.call(document.querySelectorAll(".tm-lg"), function (b) {
    b.addEventListener("click", function () {
      var l = b.getAttribute("data-line");
      if (st.line === l) st.line = "";
      else { st.line = l; if (S[st.i].lines.indexOf(l) === -1) { var k = -1; for (var j = 0; j < N; j++) if (S[j].lines.indexOf(l) !== -1) k = j; if (k >= 0) { st.i = k; render("fly"); push(false); return; } } }
      render(false); push(false);
    });
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
    else if (e.key === "Home" && st.mode !== "read") { e.preventDefault(); go(0, st.mode, { keepLine: true }); }
    else if (e.key === "End" && st.mode !== "read") { e.preventDefault(); go(N - 1, st.mode, { keepLine: true }); }
  });
  window.addEventListener("popstate", function (e) {
    var s = e.state;
    if (!s) { fromUrl(); render("jump"); if (st.mode === "read") openReader(); return; }
    st.i = s.i; st.line = s.line; st.mode = s.mode; render("fly");
    if (st.mode === "read") openReader();
  });
  window.addEventListener("resize", function () { camTo(false); });

  function fromUrl() {
    var q = new URLSearchParams(location.search), k = idx(q.get("stop") || "");
    st.i = k >= 0 ? k : N - 1;
    var l = q.get("line") || "";
    st.line = D.lines[l] && S[st.i].lines.indexOf(l) !== -1 ? l : "";
    st.mode = q.get("read") === "1" ? "read" : (k >= 0 && q.get("view") !== "map" ? "detail" : "map");
  }
  fromUrl();
  render("jump");
  // first load: keep Hoot's station in view once fonts / layout settle (mobile scrolled away before)
  window.addEventListener("load", function () { camTo(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { camTo(false); });
  if (st.mode === "read") openReader();
  try { history.replaceState({ i: st.i, line: st.line, mode: st.mode }, "", location.pathname + location.search); } catch (e) {}
})();
