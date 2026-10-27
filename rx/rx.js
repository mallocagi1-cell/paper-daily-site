/* Paper Daily reactions -- generated into OUT/rx/ by src/reactions.py. No login, no cookies. The reader's own picks and a
   random anonymous token live in localStorage; counts come from the Worker at data-api (rx.paper-daily.com). If the counter
   is unreachable the row still works locally and simply hides the numbers. Counts are fetched only when the row comes
   within 600px of the viewport (a reader who never scrolls there causes no request). */
(function(){var R=document.getElementById('pd-rx');if(!R||R.__rx)return;R.__rx=1;
var S=R.getAttribute('data-s'),API=R.getAttribute('data-api'),L=R.getAttribute('data-lang')==='en',
BS=[].slice.call(R.querySelectorAll('.pd-rx-b')),TOT=R.querySelector('.pd-rx-tot'),THX=R.querySelector('.pd-rx-thx'),
KEY='pd-rx:'+S,C=null,mine={},busy={},asked=false;
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){return null}}
function tok(){var t=ls('pd-rx-t');if(t&&/^[A-Za-z0-9_-]{16,40}$/.test(t))return t;var a=new Uint8Array(16),s='',c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
 (window.crypto||window.msCrypto).getRandomValues(a);for(var i=0;i<a.length;i++)s+=c[a[i]&63];s+=c[a[0]>>6]+c[a[1]>>6];ls('pd-rx-t',s);return s}
try{(JSON.parse(ls(KEY)||'[]')||[]).forEach(function(k){mine[k]=1})}catch(e){}
function save(){var a=Object.keys(mine).filter(function(k){return mine[k]});ls(KEY,a.length?JSON.stringify(a):null)}
function paint(){var t=0;BS.forEach(function(b){var k=b.getAttribute('data-k'),on=!!mine[k],n=C?Math.max(C[k]||0,on?1:0):0;
  b.setAttribute('aria-pressed',on?'true':'false');b.querySelector('.pd-rx-n').textContent=C&&n?String(n):'';t+=n;});
  TOT.textContent=C&&t?(L?(t+(t===1?' reaction':' reactions')):('已有 '+t+' 次反馈')):'';}
function get(){if(asked||!API||!window.fetch)return;asked=true;var ac=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ac)ac.abort()},6000);
 fetch(API+'/c?s='+encodeURIComponent(S),{mode:'cors',credentials:'omit',signal:ac?ac.signal:undefined}).then(function(r){if(!r.ok)throw 0;return r.json()})
 .then(function(d){clearTimeout(tm);if(d&&d.c){C=d.c;paint();}}).catch(function(){clearTimeout(tm);C=null;paint();});}
function post(k,on){if(!API||!window.fetch)return;busy[k]=(busy[k]||0)+1;
 fetch(API+'/r',{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({s:S,k:k,on:on,t:tok()})})
 .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){busy[k]--;if(d&&d.c&&!busy[k]){C=d.c;paint();}})
 .catch(function(){busy[k]--;C=null;paint();});}
BS.forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-k'),on=!mine[k];
  if(on)mine[k]=1;else delete mine[k];if(C)C[k]=Math.max(0,(C[k]||0)+(on?1:-1));save();paint();
  if(THX)THX.hidden=!Object.keys(mine).length;post(k,on);});});
paint();
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++)if(es[i].isIntersecting){io.disconnect();get();break;}},{rootMargin:'600px 0px'});io.observe(R);}
else get();
})();
