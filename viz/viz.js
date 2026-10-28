/* Paper Daily 图解 (2026-10-28). Optional: without JS the chip is a #link and the panel opens on :target.
   Adds: in-place toggle without a jump, live slider (interpolates precomputed samples, never evaluates a formula),
   strip arrows + k/N. Changes nothing on load (no layout shift). */
(function(){
function set(c,p,o){p.classList.toggle('open',o);c.setAttribute('aria-expanded',o?'true':'false')}
document.querySelectorAll('[data-vz-chip]').forEach(function(c){var p=document.getElementById(c.getAttribute('aria-controls'));if(!p)return;
 if(location.hash=='#'+p.id)c.setAttribute('aria-expanded','true');
 c.addEventListener('click',function(e){e.preventDefault();var o=!(p.classList.contains('open')||p.matches(':target'));
  if(!o&&p.matches(':target'))history.replaceState(null,'',location.pathname+location.search);set(c,p,o)});
 var x=p.querySelector('.vz-close');x&&x.addEventListener('click',function(e){e.preventDefault();
  if(p.matches(':target'))history.replaceState(null,'',location.pathname+location.search);set(c,p,false);c.focus({preventScroll:true});
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
 ind=s.querySelector('.vz-n'),dots=s.querySelectorAll('.vz-dots i');
 function cur(){return Math.round(tr.scrollLeft/(tr.clientWidth+12))}
 function sync(){var i=cur();ind.textContent=(i+1)+'/'+n;pv.disabled=i==0;nx.disabled=i==n-1;dots.forEach(function(d,j){d.classList.toggle('on',j==i)})}
 function go(k){tr.scrollTo({left:(cur()+k)*(tr.clientWidth+12),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
 pv.addEventListener('click',function(){go(-1)});nx.addEventListener('click',function(){go(1)});
 tr.addEventListener('scroll',function(){clearTimeout(tr._t);tr._t=setTimeout(sync,60)},{passive:true});
 tr.addEventListener('keydown',function(e){if(e.key=='ArrowRight'){go(1);e.preventDefault()}if(e.key=='ArrowLeft'){go(-1);e.preventDefault()}})});
})();
