/* Paper Daily 划词分享 (select-to-share, Felix 2026-10-28: direction B "Hoot toolbar"). Generated into selshare/ss.js by
   src/selshare.py; deep-dive pages only. Select text in the article ->
     desktop: a cream toolbar above the selection (Hoot head; 「划得好！」 only on the first selection of a page load)
     touch:   a bottom card (never near the selection, so the native iOS / Android menu keeps working)
   Actions: 复制引用 (quote + title + deep link) / 分享到 X / 微信 (QR -> article) / 金句卡片 (canvas card, selshare/card.js,
   loaded only when asked). Too long -> cut silently at a sentence end within the limit (else hard cut) + "…", the same text
   for copy, X and card. Deep link = page URL + "#q<block>.<offset>.<chars>.<sum>" (own anchor, highlighted by this file
   with the 「来自分享的引用 · 清除」 chip) + ":~:text=" (native text fragment). Ctrl/Cmd+C is never touched. */
(function(){
var doc=document,S=doc.currentScript,dEl=doc.getElementById('pd-share-data'),A=doc.getElementById('article');
if(!S||!dEl||!A||!window.getSelection)return;
var D;try{D=JSON.parse(dEl.textContent)}catch(e){return}
var ZH=D.lang!=='en',CARD=S.getAttribute('data-card'),nav=navigator,UA=nav.userAgent||'',WX=/MicroMessenger/i.test(UA);
var T=ZH?{copy:'复制引用',x:'分享到 X',wx:'微信',sys:'系统分享',card:'金句卡片',say:'划得好！',bar:'划词分享',copied:'已复制引用，含原文链接',
  scan:'微信扫码阅读',scan2:'用微信扫一扫，在手机上打开本文',land:'来自分享的引用',clear:'清除',close:'关闭',
  st:['米白','夜读','批注'],dl:'下载图片',cimg:'复制图片',cimgd:'图片已复制',save:'长按图片保存，或发送给朋友',saveDesk:'点击下载，或右键复制图片',
  loading:'正在生成金句卡片…',fail:'卡片生成失败，请重试',retry:'重试',from:'摘自深度解读',dive:'深度解读'}
 :{copy:'Copy quote',x:'Post on X',wx:'WeChat',sys:'Share',card:'Quote card',say:'Nice pick!',bar:'Share selection',copied:'Quote copied, with a link to the source',
  scan:'Scan with WeChat',scan2:'Opens this deep dive on your phone',land:'Shared quote',clear:'Clear',close:'Close',
  st:['Cream','Ink','Note'],dl:'Download',cimg:'Copy image',cimgd:'Image copied',save:'Long-press the image to save or send it',saveDesk:'Download it, or right-click to copy the image',
  loading:'Drawing the quote card…',fail:'Could not draw the card, please retry',retry:'Retry',from:'From the deep dive',dive:'deep dive'};
var MIN=ZH?6:15,MINW=3,MAX=ZH?140:280;
var SKIP='pre,code,.katex-mathml,table,figure,figcaption,.toc-m,.r-narrow,.pd-rx,.pd-shB,.pd-shC,.rmeta,.pd-ss,.pd-ss-m,#discussion,button,svg,img,script,style';
var BLK='p,li,blockquote,h2,h3,h4,dd,dt';
var IC={
 q:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.6 6C6.5 7.3 4.5 9.9 4.5 13.4V18h6v-6H7.4c.1-2 1.3-3.6 3.2-4.4L9.6 6Zm9 0c-3.1 1.3-5.1 3.9-5.1 7.4V18h6v-6h-3.1c.1-2 1.3-3.6 3.2-4.4L18.6 6Z"/></svg>',
 x:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z"/></svg>',
 wx:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.1 4C5.2 4 2 6.6 2 9.9c0 1.9 1.1 3.6 2.8 4.7l-.7 2.1 2.5-1.3c.8.2 1.6.3 2.5.3h.5a5.3 5.3 0 0 1-.2-1.4c0-3.2 3.1-5.8 6.9-5.8h.5C16 5.7 12.9 4 9.1 4Zm-2.4 3.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"/><path d="M22 14.3c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l2 1.1-.5-1.8c1.5-.9 2.5-2.3 2.5-3.9Zm-8-.9a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm4 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"/></svg>',
 sh:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 c:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8.5h1.5M8 12h8M8 15.5h5"/></svg>',
 dl:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
 cp:'<svg class="pd-ss-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'};
var HOOT="<svg class=\"pd-ss-hs\" viewBox=\"8 0 53 57\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g transform=\"rotate(-6 32 34)\"><path class=\"o c\" d=\"M13 9.5 22.5 18.2C25.3 16.9 28.6 16.2 32 16.2S38.7 16.9 41.5 18.2L51 9.5 49 24.6C51 28 52 31.4 52 35.2 52 42.8 43 48 32 48S12 42.8 12 35.2C12 31.4 13 28 15 24.6Z\" stroke-width=\"3\"/><circle class=\"c\" cx=\"24.3\" cy=\"31.5\" r=\"6.8\"/><circle class=\"c\" cx=\"39.7\" cy=\"31.5\" r=\"6.8\"/><path d=\"M31.1 30.9Q32 29.3 32.9 30.9\" stroke-width=\"2.2\"/><path d=\"M19.8 33.6Q24.3 26.6 28.8 33.6M35.2 33.6Q39.7 26.6 44.2 33.6\" stroke-width=\"3\"/><path class=\"rk\" d=\"M24.6 38.6H39.4Q39 47.4 32 47.4 25 47.4 24.6 38.6Z\" stroke-width=\"2\"/><path class=\"h\" d=\"M27.5 39.4h9l-1 1.8h-7z\"/></g><path class=\"w\" d=\"M46.6 51V39c0-1.3 1-2.2 2.2-2.2h1.4L51.8 27c.3-1.7 1.6-2.7 3.1-2.5 1.5.2 2.4 1.6 2.1 3.2l-1 8.5h2.8c1.7 0 2.9 1.5 2.6 3.2L60 47.8c-.3 1.7-1.6 3-3.2 3Z\" stroke-width=\"2.4\"/><path d=\"M51.2 42.2h7.6M51.2 46.2h7\" stroke-width=\"1.9\"/></svg>";
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function mq(q){return !!(window.matchMedia&&matchMedia(q).matches)}
function touch(){return mq('(pointer: coarse)')||mq('(max-width: 640px)')}
function ga(m){try{if(typeof window.gtag==='function')window.gtag('event','select_share',{method:m,content_type:'deep_dive'})}catch(e){}}
function mk(h){var t=doc.createElement('div');t.innerHTML=h;return t.firstChild}
/* ---- visible text of the article: text nodes outside SKIP (KaTeX MathML twins, UI blocks) */
function ok(n){var e=n.nodeType===1?n:n.parentNode;return !!e&&A.contains(e)&&!(e.closest&&e.closest(SKIP))}
function walker(root){return doc.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return ok(n)?1:3}})}
function blockOf(n){var e=n.nodeType===1?n:n.parentNode;e=e&&e.closest?e.closest(BLK):null;return e&&A.contains(e)?e:null}
function blocks(){return [].filter.call(A.querySelectorAll(BLK),function(b){return ok(b)&&!b.querySelector(BLK)})}
function rangeText(r){var w=walker(A),n,out='',last=null;
 while((n=w.nextNode())){if(!r.intersectsNode(n))continue;var s=n.data,a=0,b=s.length;
  if(n===r.startContainer)a=r.startOffset;if(n===r.endContainer)b=r.endOffset;
  var bl=blockOf(n);if(last&&bl!==last&&out)out+=ZH?'':' ';last=bl;out+=s.slice(a,b)}
 return out}
function norm(s){s=s.replace(/\s+/g,' ').trim();if(ZH)s=s.replace(/([^\x00-\xff]) (?=[^\x00-\xff])/g,'$1');return s}
function cps(s){return Array.from?Array.from(s):s.split('')}
function nws(s){return s.replace(/\s+/g,'')}
function sum(s){var h=5381,t=nws(s);for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))>>>0;return (h%46656).toString(36)}
function tooShort(s){return ZH?nws(s).length<MIN:(s.split(/\s+/).length<MINW||s.length<MIN)}
/* too long: whole sentences within MAX, else a hard cut (en: at a word), then "…" -- the one text for copy, X and card */
var END=ZH?/[。！？；!?;](?:[”」』）)]*)/g:/[.!?;](?:["”’)]*)(?=\s|$)/g;
function cut(s,max){var c=cps(s);if(c.length<=max)return {t:s,cut:false};
 var head=c.slice(0,max).join(''),m,b=-1;END.lastIndex=0;while((m=END.exec(head)))if(m.index+m[0].length>=max*0.3)b=m.index+m[0].length;
 var t=b>0?head.slice(0,b):head;if(b<0&&!ZH){var sp=t.lastIndexOf(' ');if(sp>max*0.6)t=t.slice(0,sp)}
 t=t.replace(/[\s,，、;；:：。．.!！?？—–\-]+$/,'');return {t:t+(ZH?'…':' …'),raw:t,cut:true}}
/* X counts CJK as 2 and any URL as 23; shrink the quote (then the title to its short name) until it fits 280 */
function xw(s){var n=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c>=0xD800&&c<0xDC00)i++;n+=(c<=4351||(c>=8192&&c<=8205)||(c>=8208&&c<=8223)||(c>=8242&&c<=8247))?1:2}return n}
function short(t){var m=/^(.{2,40}?)\s*[:：]\s*(.+)$/.exec(t);return m?[m[1],m[2]]:[t,'']}
function xText(q){var ti=D.title,fmt=function(q,ti){return ZH?'「'+q+'」—— 《'+ti+'》':'"'+q+'" — '+ti};
 var s=fmt(q,ti);if(xw(s)+24>280){ti=short(D.title)[0];s=fmt(q,ti)}
 var c=cps(q.replace(/\s*…$/,''));while(xw(s)+24>280&&c.length>4){c=c.slice(0,-1);s=fmt(c.join('').replace(/[\s,，、;；:：。.]+$/,'')+'…',ti)}return s}
/* deep link: own anchor (always works with this script) + native text fragment */
function enc(s){return encodeURIComponent(s).replace(/-/g,'%2D').replace(/,/g,'%2C').replace(/&/g,'%26')}
function frag(raw){var c=cps(raw.trim());if(c.length<=24)return enc(c.join(''));
 if(!ZH){var w=raw.trim().split(/\s+/);if(w.length>8)return enc(w.slice(0,4).join(' '))+','+enc(w.slice(-4).join(' '));return enc(raw.trim())}
 return enc(c.slice(0,10).join(''))+','+enc(c.slice(-10).join(''))}
function anchor(r,raw){var b=blockOf(r.startContainer),bs=blocks(),i=bs.indexOf(b);if(i<0)return '';
 var pre=doc.createRange();pre.setStart(b,0);pre.setEnd(r.startContainer,r.startOffset);var off=rangeText(pre).length;
 return 'q'+i+'.'+off+'.'+nws(raw).length+'.'+sum(raw)}
var cur=null; /* {r, quote, raw, cut, link, sec, before, after} */
function capture(){var sel=getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return null;var r=sel.getRangeAt(0);
 if(!ok(r.startContainer)||!ok(r.endContainer)||!A.contains(r.commonAncestorContainer))return null;
 var t=norm(rangeText(r));if(!t||tooShort(t))return null;var c=cut(t,MAX),raw=c.cut?c.raw:t;
 var an=anchor(r,raw),link=D.url+'#'+(an?an+':~:text=':':~:text=')+frag(raw);
 var h=null,b=blockOf(r.startContainer);[].forEach.call(A.querySelectorAll('h2[id]'),function(x){if(x.compareDocumentPosition(r.startContainer)&4)h=x});
 var sec='';if(h){var ht=norm(h.textContent),m=/^(\d+)[.、．\s]+(.*)$/.exec(ht);sec=m?'§'+m[1]+' '+m[2]:ht}
 var br=doc.createRange();br.setStart(b||A,0);br.setEnd(r.startContainer,r.startOffset);
 var ar=doc.createRange(),eb=blockOf(r.endContainer)||A;ar.setStart(r.endContainer,r.endOffset);ar.setEnd(eb,eb.childNodes.length);
 return {r:r.cloneRange(),quote:c.t,raw:raw,cut:c.cut,link:link,sec:sec,before:norm(rangeText(br)),after:norm(rangeText(ar))}}
function copyText(q){return ZH?'「'+q.quote+'」\n—— 《'+D.title+'》'+T.dive+' · Paper Daily\n'+q.link:'"'+q.quote+'"\n— '+D.title+', '+T.dive+' · Paper Daily\n'+q.link}
function copyHtml(q){return '<blockquote>'+esc(q.quote)+'</blockquote><p>'+(ZH?'—— 《':'— ')+'<a href="'+esc(q.link)+'">'+esc(D.title)+'</a>'+(ZH?'》'+T.dive:', '+T.dive)+' · Paper Daily</p>'}
function xUrl(q){return 'https://x.com/intent/post?text='+encodeURIComponent(xText(q.quote))+'&url='+encodeURIComponent(q.link)}
var tt=null;
function toast(m){var t=doc.querySelector('.pd-toast');if(!t){t=doc.createElement('div');t.className='pd-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');doc.body.appendChild(t)}
 t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},2400)}
function doCopy(q){ga('copy');var txt=copyText(q);
 function fb(){var a=doc.createElement('textarea');a.value=txt;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0';doc.body.appendChild(a);a.select();var k=false;try{k=doc.execCommand('copy')}catch(e){}doc.body.removeChild(a);if(k)toast('\u2713 '+T.copied);else window.prompt(T.copy,txt)}
 var c=nav.clipboard;if(c&&window.isSecureContext){var p=(window.ClipboardItem&&c.write)?c.write([new ClipboardItem({'text/plain':new Blob([txt],{type:'text/plain'}),'text/html':new Blob([copyHtml(q)],{type:'text/html'})})]):c.writeText(txt);
  p.then(function(){toast('\u2713 '+T.copied)},function(){c.writeText(txt).then(function(){toast('\u2713 '+T.copied)},fb)})}else fb()}
function qrSvg(){var n=D.qr.n,h=D.qr.d,p='',bits='';for(var i=0;i<h.length;i++)bits+=('000'+parseInt(h[i],16).toString(2)).slice(-4);
 for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(bits[y*n+x]==='1')p+='M'+x+' '+y+'h1v1h-1z';
 return '<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges" aria-hidden="true"><path d="'+p+'" fill="currentColor"/></svg>'}
/* ---- UI: one toolbar (desktop) or bottom card (touch) at a time */
var ui=null,said=false,busy=0,wxPop=null;
function hide(){if(wxPop){wxPop.remove();wxPop=null}if(ui){ui.remove();ui=null}}
function sayHtml(){if(said)return '';said=true;return '<span class="pd-ss-say" aria-hidden="true">'+esc(T.say)+'</span>'}
function sysOk(){return !!nav.share&&touch()}
function btns(q,m){var w=sysOk()?'<button type="button" data-ss="sys">'+(m?'<span>'+IC.sh+'</span>':IC.sh)+esc(T.sys)+'</button>':'<button type="button" data-ss="wx">'+(m?'<span>'+IC.wx+'</span>':IC.wx)+esc(T.wx)+'</button>';
 var x='<a data-ss="x" href="'+esc(xUrl(q))+'" target="_blank" rel="noopener">'+(m?'<span>'+IC.x+'</span>':IC.x)+esc(T.x)+'</a>';
 if(m)return '<button type="button" data-ss="copy"><span>'+IC.q+'</span>'+esc(T.copy)+'</button>'+x+w+'<button type="button" class="pri" data-ss="card"><span>'+IC.c+'</span>'+esc(T.card)+'</button>';
 return '<button type="button" data-ss="copy">'+IC.q+esc(T.copy)+'</button>'+x+w+'<button type="button" class="pri" data-ss="card">'+IC.c+esc(T.card)+'</button>'}
function showDesk(q){hide();var rs=q.r.getClientRects(),f=null,l=null;for(var i=0;i<rs.length;i++)if(rs[i].width>1){if(!f)f=rs[i];l=rs[i]}if(!f)return;
 var t=mk('<div class="pd-ss" role="toolbar" aria-label="'+esc(T.bar)+'"><span class="pd-ss-hh" aria-hidden="true">'+HOOT+'</span>'+sayHtml()+btns(q,false)+'</div>');
 doc.body.appendChild(t);ui=t;var w=t.offsetWidth,h=t.offsetHeight,sx=pageXOffset,sy=pageYOffset,ar=A.getBoundingClientRect(),vw=doc.documentElement.clientWidth;
 var cx=f===l?(f.left+f.right)/2:(f.left+Math.min(f.right,ar.right))/2,left=Math.max(Math.max(8,ar.left-24),Math.min(cx-w/2,Math.min(vw-8,ar.right+24)-w));
 var top=f.top-h-12,below=top<64;if(below){top=l.bottom+12;t.className+=' below'}
 t.style.left=(left+sx)+'px';t.style.top=(top+sy)+'px';t.style.setProperty('--ax',Math.max(18,Math.min(w-18,cx-left))+'px')}
function showMob(q){hide();var t=mk('<div class="pd-ss-m" role="toolbar" aria-label="'+esc(T.bar)+'"><span class="pd-ss-hh" aria-hidden="true">'+HOOT+'</span>'+sayHtml()
  +'<button type="button" class="pd-ss-x" data-ss="close" aria-label="'+esc(T.close)+'">\u00d7</button><p class="pd-ss-pv">'+esc(q.quote)+'</p><div class="pd-ss-g">'+btns(q,true)+'</div></div>');
 doc.body.appendChild(t);ui=t;var rs=q.r.getClientRects(),l=rs.length?rs[rs.length-1]:null,top=t.getBoundingClientRect().top;
 if(l&&l.bottom>top-12){var dy=l.bottom-top+24,f=rs[0];if(f.top-dy>70)window.scrollBy(0,dy)}}
var tm=0;
function check(){var q=capture();if(!q){if(!busy||Date.now()-busy>800)hide();cur=null;return}
 if(cur&&ui&&cur.raw===q.raw&&cur.link===q.link)return;cur=q;touch()?showMob(q):showDesk(q)}
function later(ms){clearTimeout(tm);tm=setTimeout(check,ms)}
doc.addEventListener('mouseup',function(e){if(e.target.closest&&e.target.closest('.pd-ss,.pd-ss-m,.pd-ss-ps,.pd-ss-wx'))return;later(10)});
doc.addEventListener('keyup',function(e){if(e.shiftKey||/^(Shift|Arrow)/.test(e.key))later(120)});
doc.addEventListener('selectionchange',function(){if(touch())later(420);else if(ui){var s=getSelection();if(!s||s.isCollapsed)later(60)}});
doc.addEventListener('mousedown',function(e){if(e.target.closest&&e.target.closest('.pd-ss,.pd-ss-m,.pd-ss-wx'))e.preventDefault()});
doc.addEventListener('pointerdown',function(e){if(e.target.closest&&e.target.closest('.pd-ss-m'))busy=Date.now()},true);
window.addEventListener('resize',function(){if(ui&&!touch())hide()});
window.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(ps){e.preventDefault();e.stopPropagation();closeSheet();return}
 if(ui){e.preventDefault();e.stopPropagation();hide()}},true);
function openWx(btn){if(wxPop){wxPop.remove();wxPop=null;return}var p=mk('<div class="pd-ss-wx" role="dialog" aria-label="'+esc(T.scan)+'"><div class="pd-ss-qr">'+qrSvg()+'</div><div><b>'+esc(T.scan)+'</b><small>'+esc(T.scan2)+'</small></div></div>');
 doc.body.appendChild(p);wxPop=p;var r=btn.getBoundingClientRect(),u=ui.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
 var left=Math.max(8,Math.min(r.left+r.width/2-w/2,doc.documentElement.clientWidth-w-8)),top=u.top-h-12;if(top<8)top=u.bottom+12;
 p.style.left=(left+pageXOffset)+'px';p.style.top=(top+pageYOffset)+'px';p.style.setProperty('--ax',(r.left+r.width/2-left)+'px');ga('wechat_qr')}
doc.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-ss]');if(!b)return;var a=b.getAttribute('data-ss'),q=cur;
 if(a==='x'){ga('x');setTimeout(hide,0);return}
 e.preventDefault();if(a==='close'){hide();return}
 if(a==='st'){renderCard(+b.getAttribute('data-i'));return}
 if(a==='psx'){closeSheet();return}
 if(a==='cimg'){copyImg();return}
 if(a==='save'){saveImg();return}
 if(a==='retry'){renderCard(ps&&ps.style_);return}
 if(!q)return;
 if(a==='copy'){doCopy(q);hide()}
 else if(a==='wx'){if(touch()){hide();if(WX)toast(D.t.wxHint);else doCopy(q)}else openWx(b)}
 else if(a==='sys'){hide();nav.share({title:D.title,text:ZH?'「'+q.quote+'」':'"'+q.quote+'"',url:q.link}).then(function(){ga('system')},function(){})}
 else if(a==='card'){hide();openSheet(q)}});
/* ---- quote card sheet (canvas drawing in selshare/card.js, fetched on first use) */
var cj=null,ps=null,blobs={};
function loadCard(){if(cj)return cj;cj=new Promise(function(res,rej){var s=doc.createElement('script');s.src=CARD;s.async=true;
 s.onload=function(){window.PDQuoteCard?res(window.PDQuoteCard):rej(new Error('card.js'))};s.onerror=function(){cj=null;rej(new Error('card.js'))};doc.head.appendChild(s)});return cj}
function dark(){return doc.documentElement.getAttribute('data-theme')==='dark'}
var STY=['cream','ink','note'];
function openSheet(q){closeSheet();ga('card');var o=mk('<div class="pd-ss-ps" role="dialog" aria-modal="true" aria-label="'+esc(T.card)+'"><button type="button" class="pd-ss-psx" data-ss="psx" aria-label="'+esc(T.close)+'">\u00d7</button>'
  +'<div class="pd-ss-sw" role="tablist">'+T.st.map(function(s,i){return '<button type="button" role="tab" data-ss="st" data-i="'+i+'">'+esc(s)+'</button>'}).join('')+'</div>'
  +'<div class="pd-ss-im"></div><p class="pd-ss-hint"></p><div class="pd-ss-acts"></div></div>');
 doc.body.appendChild(o);ps=o;ps.q=q;blobs={};renderCard(dark()?1:0)}
function closeSheet(){if(ps){ps.remove();ps=null}}
function opts(q,st){var p=D.p||{};return {style:st,lang:D.lang,quote:q.quote,before:q.before,after:q.after,title:D.title,kicker:p.kicker||'',issue:(p.chips&&p.chips[0])||p.issue||'',
 sec:q.sec,durl:p.durl||'',scan:p.scan||'',tag:p.tag||'',qr:D.qr,from:T.from}}
function renderCard(i){if(!ps)return;i=i||0;ps.style_=i;var me=ps,st=STY[i],im=ps.querySelector('.pd-ss-im'),acts=ps.querySelector('.pd-ss-acts'),hint=ps.querySelector('.pd-ss-hint');
 [].forEach.call(ps.querySelectorAll('[data-ss=st]'),function(b,j){b.setAttribute('aria-selected',j===i?'true':'false')});
 acts.innerHTML='';hint.textContent='';im.innerHTML='<div class="pd-ss-ld" role="status"><i></i>'+esc(T.loading)+'</div>';
 var go=blobs[st]?Promise.resolve(blobs[st]):loadCard().then(function(C){return C(opts(ps.q,st))}).then(function(b){return new Promise(function(res){var r=new FileReader();r.onload=function(){res({blob:b,url:r.result})};r.onerror=function(){res({blob:b,url:URL.createObjectURL(b)})};r.readAsDataURL(b)})});
 go.then(function(x){if(ps!==me||ps.style_!==i)return;blobs[st]=x;ps.cur=x;
  im.innerHTML='<img class="pd-ss-img" alt="'+esc(ps.q.quote)+'" src="'+x.url+'">';hint.textContent=touch()||WX?T.save:T.saveDesk;
  acts.innerHTML=WX?'':'<a class="pri" href="'+x.url+'" download="paper-daily-quote-'+esc((D.file||'card.png').replace(/^paper-daily-/,''))+'" data-ss="save">'+IC.dl+esc(T.dl)+'</a>'
   +(!touch()&&window.ClipboardItem&&nav.clipboard&&nav.clipboard.write?'<button type="button" data-ss="cimg">'+IC.cp+esc(T.cimg)+'</button>':'')})
 .catch(function(){if(ps!==me)return;im.innerHTML='<p role="alert">'+esc(T.fail)+'</p>';acts.innerHTML='<button type="button" data-ss="retry">'+esc(T.retry)+'</button>'})}
var IOS=/iP(hone|ad|od)/.test(UA)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
function saveImg(){if(!ps||!ps.cur)return;ga('card_download');var b=ps.cur.blob,name='paper-daily-quote.png',f=null;
 if(IOS){try{f=new File([b],name,{type:'image/png'})}catch(e){}if(f&&nav.canShare&&nav.canShare({files:[f]})){nav.share({files:[f]}).catch(function(){});return}window.open(ps.cur.url,'_blank');return}
 var a=doc.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=ps.querySelector('[data-ss=save]').getAttribute('download');doc.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)}
function copyImg(){if(!ps||!ps.cur)return;nav.clipboard.write([new ClipboardItem({'image/png':ps.cur.blob})]).then(function(){toast('\u2713 '+T.cimgd)},function(){toast(T.fail)})}
doc.addEventListener('click',function(e){if(ps&&e.target===ps)closeSheet()});
/* ---- landing from a shared link: #q<block>.<offset>.<chars>.<sum> -> brand highlight + chip */
function land(){var m=/^#q(\d+)\.(\d+)\.(\d+)\.([0-9a-z]+)/.exec(location.hash);if(!m)return;var b=blocks()[+m[1]];if(!b)return;
 var w=walker(b),n,pos=0,off=+m[2],need=+m[3],r=doc.createRange(),started=false,got='';
 for(var blk=b;blk&&!(started&&need<=0);){while((n=w.nextNode())){var s=n.data,i=0;if(!started){if(pos+s.length<off){pos+=s.length;continue}i=off-pos;r.setStart(n,i);started=true}
   for(;i<s.length&&need>0;i++){if(!/\s/.test(s[i])){need--;got+=s[i]}}if(need<=0){r.setEnd(n,i);break}}
  if(need<=0||!started)break;var bs=blocks(),k=bs.indexOf(blk);blk=bs[k+1];if(!blk)break;w=walker(blk)}
 if(need>0||sum(got)!==m[4])return;
 if(window.CSS&&CSS.highlights&&window.Highlight)CSS.highlights.set('pd-ss-land',new Highlight(r));
 doc.documentElement.classList.add('pd-ss-landed');
 var c=mk('<div class="pd-ss-chip" role="status">'+IC.q+'<span>'+esc(T.land)+'</span><button type="button">'+esc(T.clear)+' \u00d7</button></div>');doc.body.appendChild(c);
 function place(){var rs=r.getClientRects();if(!rs.length)return;var f=rs[0];if(touch()){c.classList.add('m');return}
  c.style.left=(Math.max(8,Math.min(f.left,doc.documentElement.clientWidth-c.offsetWidth-8))+pageXOffset)+'px';c.style.top=(f.top+pageYOffset-c.offsetHeight-10)+'px'}
 function go(){var rr=r.getBoundingClientRect();if(rr.top<80||rr.bottom>innerHeight-80)window.scrollTo(0,rr.top+pageYOffset-innerHeight*0.38);place()}
 go();setTimeout(go,350);window.PDSelShare.landed={ok:true,text:got};
 c.querySelector('button').addEventListener('click',function(){if(window.CSS&&CSS.highlights)CSS.highlights.delete('pd-ss-land');doc.documentElement.classList.remove('pd-ss-landed');doc.documentElement.classList.add('pd-ss-cleared');c.remove();
  try{history.replaceState(history.state,'',location.pathname+location.search)}catch(e){}})}
window.PDSelShare={capture:capture,cut:cut,xText:xText,xw:xw,copyText:copyText,xUrl:xUrl,MAX:MAX,MIN:MIN,card:function(st){return loadCard().then(function(C){return C(opts(cur||capture(),st))})},landed:null};
if(doc.readyState==='complete')land();else window.addEventListener('load',land);
})();
