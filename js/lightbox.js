/* Paper Daily lightbox: click a figure to view it full-screen. Vanilla JS, no deps. */
(function(){
  if (window.__pdLightbox) return; window.__pdLightbox = 1;
  var css = 'main img,article img,figure img,.dr-fig img,.long img,.report img{cursor:zoom-in}' +
    '.pd-lb{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 12px 12px;box-sizing:border-box;cursor:zoom-out;touch-action:pinch-zoom}' +
    '.pd-lb[hidden]{display:none}' +
    '.pd-lb img{max-width:100%;max-height:calc(100% - 3.5em);width:auto;height:auto;object-fit:contain;background:#fff;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.5);cursor:zoom-out}' +
    '.pd-lb figcaption{color:#eee;font-size:14px;line-height:1.5;max-width:900px;text-align:center;margin-top:10px}' +
    '.pd-lb button{position:absolute;top:8px;right:12px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:26px;line-height:40px;cursor:pointer}' +
    '.pd-lb button:hover{background:rgba(255,255,255,.3)}' +
    'body.pd-lb-open{overflow:hidden}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var box, im, cap, last;
  function build(){
    box = document.createElement('div'); box.className = 'pd-lb'; box.hidden = true;
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true'); box.setAttribute('aria-label','Image viewer');
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label','Close'); b.innerHTML = '&times;';
    im = document.createElement('img'); im.alt = '';
    cap = document.createElement('figcaption');
    box.appendChild(b); box.appendChild(im); box.appendChild(cap);
    box.addEventListener('click', close);
    document.body.appendChild(box);
  }
  function open(img){
    if (!box) build();
    last = document.activeElement;
    im.src = img.currentSrc || img.src; im.alt = img.alt || '';
    var fig = img.closest('figure'), fc = fig && fig.querySelector('figcaption');
    var t = (fc ? fc.textContent : img.alt || '').trim();
    cap.textContent = t; cap.style.display = t ? '' : 'none';
    box.hidden = false; document.body.classList.add('pd-lb-open');
    box.querySelector('button').focus();
  }
  function close(){
    if (!box || box.hidden) return;
    box.hidden = true; document.body.classList.remove('pd-lb-open'); im.removeAttribute('src');
    if (last && last.focus) last.focus();
  }
  function eligible(img){
    if (img.closest('a,button,.pd-lb,header,nav,.logo,[data-no-lightbox]')) return false;
    var r = img.getBoundingClientRect();
    return r.width >= 80 || img.naturalWidth >= 160;
  }
  document.addEventListener('click', function(e){
    var img = e.target.closest && e.target.closest('img');
    if (!img || !eligible(img)) return;
    e.preventDefault(); open(img);
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();
