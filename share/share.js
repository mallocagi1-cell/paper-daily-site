/* Paper Daily share module (deep-dive pages only). Generated into share/share.js by src/share.py.
   Page data: <script type="application/json" id="pd-share-data"> (built per page). The poster code (share/poster.js)
   and its fonts load only when a reader asks for the share image. */
(function(){
var el=document.getElementById('pd-share-data');if(!el)return;
var D;try{D=JSON.parse(el.textContent)}catch(e){return}
var T=D.t,doc=document,nav=navigator,UA=nav.userAgent||'';
var WX=/MicroMessenger/i.test(UA);
function mq(q){return window.matchMedia&&matchMedia(q).matches}
function touch(){return mq('(pointer: coarse)')}
function mobile(){return mq('(max-width: 640px)')||(touch()&&mq('(max-width: 1023px)'))}
function canSys(){return !!nav.share&&touch()}
var IC={
 link:'<svg class="pd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>',
 x:'<svg class="pd-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z"/></svg>',
 wx:'<svg class="pd-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.1 4C5.2 4 2 6.6 2 9.9c0 1.9 1.1 3.6 2.8 4.7l-.7 2.1 2.5-1.3c.8.2 1.6.3 2.5.3h.5a5.3 5.3 0 0 1-.2-1.4c0-3.2 3.1-5.8 6.9-5.8h.5C16 5.7 12.9 4 9.1 4Zm-2.4 3.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"/><path d="M22 14.3c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l2 1.1-.5-1.8c1.5-.9 2.5-2.3 2.5-3.9Zm-8-.9a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm4 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"/></svg>',
 img:'<svg class="pd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="m21 15-4.5-4.5L7 20"/></svg>',
 share:'<svg class="pd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 dl:'<svg class="pd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>'};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ga(m){try{if(typeof window.gtag==='function')window.gtag('event','share',{method:m,content_type:'deep_dive'})}catch(e){}}
/* QR: module matrix built at build time (hex rows); drawn here as one SVG path */
function qrSvg(){var n=D.qr.n,h=D.qr.d,p='',bits='';for(var i=0;i<h.length;i++)bits+=('000'+parseInt(h[i],16).toString(2)).slice(-4);
 for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(bits[y*n+x]==='1')p+='M'+x+' '+y+'h1v1h-1z';
 return '<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges" role="img" aria-label="QR '+esc(D.url)+'"><path d="'+p+'" fill="currentColor"/></svg>'}
var tt=null;
function toast(msg){var t=doc.querySelector('.pd-toast');if(!t){t=doc.createElement('div');t.className='pd-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');doc.body.appendChild(t)}
 t.textContent=msg;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},2400)}
function copyFallback(){var a=doc.createElement('textarea');a.value=D.url;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0';
 doc.body.appendChild(a);a.select();var ok=false;try{ok=doc.execCommand('copy')}catch(e){}doc.body.removeChild(a);return ok}
function copy(){ga('copy');close();
 function done(){toast('\u2713 '+T.copied)}
 function fb(){if(copyFallback())done();else{window.prompt(T.copyManual,D.url)}}
 if(nav.clipboard&&window.isSecureContext)nav.clipboard.writeText(D.url).then(done,fb);else fb()}
function sys(){close();if(nav.share){nav.share({title:D.title,url:D.url}).then(function(){ga('system')},function(){})}
 else if(WX){toast(T.wxHint)}else copy()}
var cur=null;
function close(){if(!cur)return;var c=cur;cur=null;c.nodes.forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n)});
 if(c.btn){c.btn.setAttribute('aria-expanded','false');if(c.focus)try{c.btn.focus({preventScroll:true})}catch(e){}}}
function items(qrOnly){var h='';if(!qrOnly){
 h+='<button type="button" class="pd-sh-it" data-pd-act="copy">'+IC.link+esc(T.copy)+'</button>';
 h+='<a class="pd-sh-it" data-pd-act="x" href="'+esc(D.x)+'" target="_blank" rel="noopener">'+IC.x+esc(T.x)+'</a>';
 h+='<button type="button" class="pd-sh-it" data-pd-act="poster">'+IC.img+esc(T.poster)+'</button>'}
 return h+'<div class="pd-pop-wx"><div class="pd-qr">'+qrSvg()+'</div><div><b>'+IC.wx+esc(T.scan)+'</b><small>'+esc(T.scan2)+'</small></div></div>'}
function openPop(btn,qrOnly){close();var p=doc.createElement('div');p.className='pd-pop'+(qrOnly?' qr-only':'');p.setAttribute('role','dialog');p.setAttribute('aria-label',qrOnly?T.scan:T.head);
 p.innerHTML=items(qrOnly);doc.body.appendChild(p);var r=btn.getBoundingClientRect(),w=p.offsetWidth,sx=window.pageXOffset,sy=window.pageYOffset;
 var left=Math.max(12,Math.min(r.left+r.width/2-w/2,doc.documentElement.clientWidth-w-12));
 var h=p.offsetHeight,up=r.bottom+10+h>window.innerHeight-8&&r.top-10-h>8;/* sidebar C card sits low: open upward */
 if(up)p.className+=' up';p.style.left=(left+sx)+'px';p.style.top=(up?r.top+sy-10-h:r.bottom+sy+10)+'px';p.style.setProperty('--ax',(r.left+r.width/2-left-5)+'px');
 btn.setAttribute('aria-expanded','true');cur={nodes:[p],btn:btn,focus:true};if(qrOnly)ga('wechat_qr');
 var f=p.querySelector('.pd-sh-it');if(f)f.focus({preventScroll:true})}
function openSheet(btn){close();var dim=doc.createElement('div');dim.className='pd-dim';dim.setAttribute('data-pd-act','close');
 var s=doc.createElement('div');s.className='pd-bs';s.setAttribute('role','dialog');s.setAttribute('aria-modal','true');s.setAttribute('aria-label',T.head);
 var third=canSys()?'<button type="button" data-pd-act="system"><i>'+IC.share+'</i>'+esc(T.sys)+'</button>':'<button type="button" data-pd-act="wechat"><i>'+IC.wx+'</i>'+esc(T.wx)+'</button>';
 s.innerHTML='<div class="pd-bs-grab"></div><p class="pd-bs-h">'+esc(T.head)+'</p><p class="pd-bs-sub">'+esc(D.title)+'</p><div class="pd-bs-g">'
  +'<button type="button" data-pd-act="copy"><i>'+IC.link+'</i>'+esc(T.copy)+'</button>'
  +'<a data-pd-act="x" href="'+esc(D.x)+'" target="_blank" rel="noopener"><i>'+IC.x+'</i>'+esc(T.x)+'</a>'+third
  +'<button type="button" class="pri" data-pd-act="poster"><i>'+IC.img+'</i>'+esc(T.poster)+'</button></div>'
  +'<button type="button" class="pd-bs-x" data-pd-act="close">'+esc(T.cancel)+'</button>';
 doc.body.appendChild(dim);doc.body.appendChild(s);if(btn)btn.setAttribute('aria-expanded','true');cur={nodes:[dim,s],btn:btn,focus:false}}
/* WeChat action: desktop -> QR popover; touch with system share -> system sheet; WeChat in-app -> hint */
function wechat(btn){if(canSys())return sys();if(mobile()){close();if(WX)toast(T.wxHint);else copy();return}openPop(btn,true)}
/* poster: lazy-load share/poster.js (+ its fonts) on first use.
   Speed (Felix 2026-10-30): show the modal shell immediately, paint one frame before heavy work, cache the
   generated PNG so reopen is instant, prefetch script/fonts/fig on idle or poster-button hover, and show a
   blob: <img> as soon as the canvas is ready (iOS still upgrades to data: for long-press "Save image"). */
var pj=null,blobUrl=null,posterBlob=null,posterCache=null,warming=false;
/* iOS (every iOS browser is WebKit): <a download> only drops the PNG into Files, so 下载图片 opens the share sheet
   ("Save Image") when it can carry files, else the PNG in a new tab where long-press saves it */
var IOS=/iP(hone|ad|od)/.test(UA)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
function iosSave(){if(!posterBlob)return false;var f=null;try{f=new File([posterBlob],D.file,{type:'image/png'})}catch(e){}
 if(f&&nav.canShare&&nav.share&&nav.canShare({files:[f]})){nav.share({files:[f]}).then(function(){ga('download_ios_share')},function(){});return true}
 var w=window.open(blobUrl,'_blank');if(!w)location.href=blobUrl;ga('download_ios_tab');return true}
function loadPoster(){if(pj)return pj;pj=new Promise(function(res,rej){var s=doc.createElement('script');s.src=D.js;s.async=true;
 s.onload=function(){window.PDPoster?res(window.PDPoster):rej(new Error('poster.js'))};s.onerror=function(){pj=null;rej(new Error('poster.js'))};doc.head.appendChild(s)});return pj}
function paintPoster(o,blob,dataUrl){if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(blob);posterBlob=blob;
 /* desktop/Android: blob: is enough to show + download. iOS long-press "Save image" needs data:; show blob first, swap when ready. */
 var src=(IOS&&dataUrl)?dataUrl:blobUrl;
 o.innerHTML='<button type="button" class="pd-ps-x" data-pd-act="close" aria-label="'+esc(T.close)+'">\u00d7</button>'
  +'<img class="pd-ps-img" src="'+src+'" alt="'+esc(D.title)+'"><p>'+esc(mobile()||WX?T.save:T.saveDesk)+'</p>'
  +(WX?'':'<div class="pd-ps-acts"><a href="'+blobUrl+'" download="'+esc(D.file)+'" data-pd-act="download">'+IC.dl+esc(T.dl)+'</a></div>');
 if(IOS&&!dataUrl){var img=o.querySelector('.pd-ps-img'),r=new FileReader();
  r.onload=function(){posterCache={blob:blob,dataUrl:r.result};if(img&&img.parentNode===o)img.src=r.result};
  r.onerror=function(){posterCache={blob:blob,dataUrl:null}};r.readAsDataURL(blob)}
 else posterCache={blob:blob,dataUrl:dataUrl||null}}
function genPoster(){return loadPoster().then(function(P){return P(D)}).then(function(blob){
 if(!IOS)return[blob,null];
 return new Promise(function(res){var r=new FileReader();r.onload=function(){res([blob,r.result])};r.onerror=function(){res([blob,null])};r.readAsDataURL(blob)})})}
function warmPoster(){if(posterCache||warming)return;warming=true;
 /* prefetch poster.js + fonts + figure/logos via a real generate; result is cached for the first tap */
 genPoster().then(function(bd){posterCache={blob:bd[0],dataUrl:bd[1]};if(!blobUrl){blobUrl=URL.createObjectURL(bd[0]);posterBlob=bd[0]}})
 .catch(function(){}).then(function(){warming=false})}
function poster(){close();ga('poster');var o=doc.createElement('div');o.className='pd-ps';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',T.poster);
 o.innerHTML='<button type="button" class="pd-ps-x" data-pd-act="close" aria-label="'+esc(T.close)+'">\u00d7</button><div class="pd-ps-ld" role="status"><div class="pd-spin"></div>'+esc(T.loading)+'</div>';
 doc.body.appendChild(o);cur={nodes:[o],btn:null,focus:false};var me=cur;
 if(posterCache&&posterCache.blob){paintPoster(o,posterCache.blob,posterCache.dataUrl);return}
 /* double rAF: let the loading shell paint before poster.js / FontFace / 2x canvas / planA block the main thread */
 function go(){if(cur!==me)return;
  /* if warm finished while we waited a frame, use it */
  if(posterCache&&posterCache.blob){paintPoster(o,posterCache.blob,posterCache.dataUrl);return}
  genPoster().then(function(bd){if(cur!==me)return;paintPoster(o,bd[0],bd[1])})
  .catch(function(){if(cur!==me)return;
   o.innerHTML='<button type="button" class="pd-ps-x" data-pd-act="close" aria-label="'+esc(T.close)+'">\u00d7</button><p role="alert">'+esc(T.fail)+'</p>'
    +'<div class="pd-ps-acts"><button type="button" data-pd-act="retry">'+esc(T.retry)+'</button></div>'})}
 requestAnimationFrame(function(){requestAnimationFrame(go)})}
if(window.requestIdleCallback)requestIdleCallback(function(){warmPoster()},{timeout:4000});
else setTimeout(warmPoster,2000);
doc.addEventListener('pointerenter',function(ev){var t=ev.target.closest&&ev.target.closest('[data-pd-share="poster"]');if(t)warmPoster()},true);
/* B card: on touch devices with a system share sheet, the WeChat button becomes 系统分享 */
if(canSys())[].forEach.call(doc.querySelectorAll('[data-pd-share=wechat]'),function(b){b.setAttribute('data-pd-share','system');b.innerHTML=IC.share+esc(T.sys)});
doc.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('[data-pd-share],[data-pd-act]');
 /* backdrop: .pd-ps IS the dimmed overlay (unlike .pd-bs which has a separate .pd-dim). Click on the overlay
    element itself closes; clicks on the card (img / hint / acts / X) do not. Esc already closes below. */
 if(!t){if(cur){if(ev.target.classList&&ev.target.classList.contains('pd-ps'))close();
  else if(!ev.target.closest('.pd-pop,.pd-bs,.pd-ps'))close()}return}
 var a=t.getAttribute('data-pd-share')||t.getAttribute('data-pd-act');
 if(a==='x'){ga('x');setTimeout(close,0);return}
 if(a==='download'){if(IOS&&iosSave()){ev.preventDefault();return}ga('download');return}
 ev.preventDefault();
 if(a==='menu'){if(cur&&cur.btn===t){close();return}mobile()?openSheet(t):openPop(t,false)}
 else if(a==='copy')copy();else if(a==='system')sys();else if(a==='wechat'){if(cur&&cur.btn===t){close();return}wechat(t)}
 else if(a==='retry'){posterCache=null;poster()}else if(a==='poster')poster();else if(a==='close')close()});
/* capture phase + preventDefault: the site's keyboard nav (js/search.js) maps Esc to "back" on deep pages and skips handled events */
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&cur){e.preventDefault();e.stopPropagation();close()}},true);
window.addEventListener('resize',function(){if(cur&&cur.nodes[0].className.indexOf('pd-pop')===0)close()});
})();
