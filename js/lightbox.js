/* Paper Daily lightbox: click a figure to view it full-screen. Vanilla JS, no deps. */
(function(){
  if (window.__pdLightbox) return; window.__pdLightbox = 1;
  var css = 'main img,article img,figure img,.dr-fig img,.long img,.report img{cursor:zoom-in}' +
    '.pd-lb{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 12px 12px;box-sizing:border-box;cursor:zoom-out;touch-action:pinch-zoom}' +
    '.pd-lb[hidden],.pd-lb a[hidden]{display:none}' +
    '.pd-lb img{max-width:100%;max-height:calc(100% - 3.5em);min-height:0;width:auto;height:auto;object-fit:contain;background:#fff;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.5);cursor:zoom-out}' +
    '.pd-lb figcaption{color:#eee;font-size:14px;line-height:1.5;max-width:900px;max-height:25%;overflow:auto;text-align:center;margin-top:10px}' +
    '.pd-lb a{color:#fff;padding:10px;flex-shrink:0;cursor:pointer;text-decoration:underline}' +
    '.pd-lb button{position:absolute;top:8px;right:12px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:26px;line-height:40px;cursor:pointer}' +
    '.pd-lb button:hover{background:rgba(255,255,255,.3)}' +
    'body.pd-lb-open{overflow:hidden}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var box, im, cap, original, button, last, shownImage, shownLink, closing;
  var entry = { pdImageViewer: true };
  var placeX = 0, placeY = 0, prevRestoration;
  var zh = document.documentElement.lang.toLowerCase().indexOf('zh') === 0;
  function build(){
    box = document.createElement('div'); box.className = 'pd-lb'; box.hidden = true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label',zh ? '图片查看器' : 'Image viewer');
    button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label',zh ? '关闭' : 'Close'); button.innerHTML = '&times;';
    im = document.createElement('img'); im.alt = '';
    cap = document.createElement('figcaption');
    original = document.createElement('a'); original.target = '_blank'; original.rel = 'noopener';
    box.appendChild(button); box.appendChild(im); box.appendChild(cap); box.appendChild(original);
    box.addEventListener('click', function(e){ if (!e.target.closest('a')) close(); });
    document.body.appendChild(box);
  }
  function show(){
    if (!box) build();
    var img = shownImage, link = shownLink;
    im.src = link ? link.href : (img.currentSrc || img.src); im.alt = img.alt || '';
    var fig = img.closest('figure'), fc = fig && fig.querySelector('figcaption');
    var t = (fc ? fc.textContent : img.alt || '').trim();
    cap.textContent = t; cap.style.display = t ? '' : 'none';
    original.hidden = !link;
    if (link) { original.href = link.href; original.textContent = link.dataset.lightbox; }
    placeX = window.scrollX; placeY = window.scrollY;
    prevRestoration = history.scrollRestoration;
    try { history.scrollRestoration = 'manual'; } catch (err) {}
    box.hidden = false; document.body.classList.add('pd-lb-open');
    button.focus({preventScroll:true});
  }
  function restorePlace(){
    if (typeof window.scrollTo === 'function') window.scrollTo(placeX, placeY);
    if (last && last.isConnected && last.focus) last.focus({preventScroll:true});
  }
  function restoreScrollMode(){
    try { if (prevRestoration) history.scrollRestoration = prevRestoration; } catch (err) {}
  }
  function hide(){
    if (!box || box.hidden) return;
    box.hidden = true; document.body.classList.remove('pd-lb-open'); im.removeAttribute('src');
    restorePlace();
    // Keep scrollRestoration=manual until after Back would apply a :target hash scroll.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function(){
        restorePlace();
        requestAnimationFrame(function(){
          restorePlace();
          restoreScrollMode();
        });
      });
    } else restoreScrollMode();
  }
  function close(){
    if (!box || box.hidden || closing) return;
    if (history.state && history.state.pdImageViewer) {
      closing = true;
      history.back();
    } else hide();
  }
  window.addEventListener('popstate', function(e){
    closing = false;
    if (e.state && e.state.pdImageViewer && shownImage && shownImage.isConnected) show();
    else {
      hide();
      // Back can also scroll to a Hoot :target hash; re-apply after that.
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restorePlace);
    }
  });
  function eligible(img){
    if (img.closest('a,button,.pd-lb,header,nav,.logo,[data-no-lightbox]')) return false;
    var r = img.getBoundingClientRect();
    return r.width >= 80 || img.naturalWidth >= 160;
  }
  document.addEventListener('click', function(e){
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (box && !box.hidden) return;
    var link = e.target.closest && e.target.closest('a[data-lightbox]');
    var img = link ? link.querySelector('img') : e.target.closest && e.target.closest('img');
    if (!img || (link ? img.closest('[data-no-lightbox]') : !eligible(img))) return;
    try {
      history.pushState(entry, '');
    } catch (err) {
      // A plain link still opens the original when history is unavailable.
      if (link) return;
    }
    e.preventDefault();
    last = link || document.activeElement;
    shownImage = img; shownLink = link;
    show();
  });
  document.addEventListener('keydown', function(e){
    if (!box || box.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      (original.hidden || document.activeElement === original ? button : original).focus({preventScroll:true});
    }
  });
})();
