/* Paper Daily 图解 (2026-10-28). Optional: panels are expanded by default; without JS 收起 (#vzc-id) / the chip (#vz-id) collapse / reopen via CSS.
   Adds: in-place toggle without a jump, live slider (interpolates precomputed samples, never evaluates a formula),
   strip arrows + k/N (arrows step from the target step, k/N updates on click). Changes nothing on load (no layout shift); collapse = .shut, reopen = .open. */
(function(){
function set(c,p,o){p.classList.toggle('open',o);p.classList.toggle('shut',!o);c.setAttribute('aria-expanded',o?'true':'false')}
function tidy(c,p){if(location.hash=='#'+p.id||location.hash=='#'+c.id)history.replaceState(null,'',location.pathname+location.search)}
document.querySelectorAll('[data-vz-chip]').forEach(function(c){var p=document.getElementById(c.getAttribute('aria-controls'));if(!p)return;
 if(getComputedStyle(p).display=='none')c.setAttribute('aria-expanded','false');
 c.addEventListener('click',function(e){e.preventDefault();var o=getComputedStyle(p).display=='none';tidy(c,p);set(c,p,o)});
 var x=p.querySelector('.vz-close');x&&x.addEventListener('click',function(e){e.preventDefault();tidy(c,p);set(c,p,false);c.focus({preventScroll:true});
  if(c.getBoundingClientRect().top<0)c.scrollIntoView({block:'center'})})});
document.querySelectorAll('.vz-ctl input[data-vz]').forEach(function(r){var d=JSON.parse(r.dataset.vz),box=r.closest('.vz-fig'),out=box.querySelector('.vz-out'),n=d.ys[0].length-1;
 function at(s,x){var f=(x-d.x0)/(d.x1-d.x0)*n,i=Math.max(0,Math.min(n-1,Math.floor(f))),t=f-i;return d.ys[s][i]*(1-t)+d.ys[s][i+1]*t}
 function upd(){var x=+r.value,v={x:x.toFixed(d.xd)};d.ys.forEach(function(_,s){v['y'+s]=at(s,x)});
  box.querySelectorAll('svg').forEach(function(g){var vb=g.viewBox.baseVal,L=+g.dataset.l,pw=vb.width-L-g.dataset.r,T=+g.dataset.t,ph=vb.height-T-g.dataset.b;
   g.querySelectorAll('.vz-lc').forEach(function(c){var y=Math.max(d.y0,Math.min(d.y1,v['y'+c.dataset.s]));
    c.setAttribute('cx',(L+(x-d.x0)/(d.x1-d.x0)*pw).toFixed(1));c.setAttribute('cy',(T+(1-(y-d.y0)/(d.y1-d.y0))*ph).toFixed(1))})});
  d.ys.forEach(function(_,s){v['y'+s]=v['y'+s].toFixed(d.yd)});
  var h=d.fmt.replace(/\{(\w+)\}/g,function(_,k){return v[k]}).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  out.innerHTML=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[/g,'<em>').replace(/\]/g,'</em>')}
 r.addEventListener('input',upd)});
document.querySelectorAll('.vz-steps').forEach(function(s){var tr=s.querySelector('.vz-track'),n=+s.dataset.n,pv=s.querySelector('.vz-prev'),nx=s.querySelector('.vz-next'),
 ind=s.querySelector('.vz-n'),dots=s.querySelectorAll('.vz-dots i'),ti=0,til=0;
 /* ti = the step the strip shows or is scrolling to. Arrows step from ti (not from the mid-animation scrollLeft, which
    swallowed a quick second click) and update k/N at once; a finished scroll (swipe, snap) re-reads it. */
 function W(){return tr.clientWidth+12}
 function sync(i){ti=i;ind.textContent=(i+1)+'/'+n;pv.disabled=i==0;nx.disabled=i==n-1;dots.forEach(function(d,j){d.classList.toggle('on',j==i)})}
 function go(k){var i=Math.max(0,Math.min(n-1,ti+k));if(i==ti)return;sync(i);til=Date.now()+1000;
  tr.scrollTo({left:i*W(),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
 function settle(){if(Date.now()<til&&Math.abs(tr.scrollLeft-ti*W())>2){tr._t=setTimeout(settle,100);return}til=0;sync(Math.round(tr.scrollLeft/W()))}
 pv.addEventListener('click',function(){go(-1)});nx.addEventListener('click',function(){go(1)});
 tr.addEventListener('scroll',function(){clearTimeout(tr._t);tr._t=setTimeout(settle,60)},{passive:true});
 tr.addEventListener('keydown',function(e){if(e.key=='ArrowRight'){go(1);e.preventDefault()}if(e.key=='ArrowLeft'){go(-1);e.preventDefault()}})});
})();
