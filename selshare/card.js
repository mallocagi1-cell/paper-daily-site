/* Paper Daily 金句卡片 (quote card) for 划词分享. Generated into selshare/card.js by src/selshare.py (Hoot ops from
   mascot.py); fetched by selshare/ss.js only when a reader asks for a card. window.PDQuoteCard(o) -> Promise<PNG Blob>.
   Styles: cream 米白 (360x480 units, the share poster's look), ink 夜读 (360x450, dark), note 批注 (360x480, quote inside
   faded context). Exported at SCALE 3 (1080x1440 / 1080x1350). Text uses the page's own fonts (Noto Serif SC /
   Noto Serif Display, already loaded by the article) with system fallbacks; the QR is the page's prebuilt matrix
   (canonical article URL); everything is vector -> the canvas is never tainted. window.PDQuoteCard.last reports
   {style, px, size, lines, fit, blank} for selshare_check.py. */
(function(){
var SCALE=3,ACC='#D9643A',INK='#141414',INK2='#4A4A4A',MUTE='#8C8C8C',LINE='#E2DDD6',BG='#FBF6EC',DK='#1E1A16';
var SERIF='"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC","Songti SC","Noto Serif",Georgia,serif';
var DISP='"Noto Serif Display","Noto Serif","Noto Serif SC","Noto Serif CJK SC",Georgia,serif';
var SANS='-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';
function F(w,px,fam){return w+' '+px+'px '+fam}
var MASCOT={point:[["p","M25 56.6 v2.6 M28 56.6 v2.6 M36 56.6 v2.6 M39 56.6 v2.6",0,"#D9643A",2.3],["p","M14.5 13.5 L22.5 18.2 C25.3 16.9 28.6 16.2 32 16.2 C35.4 16.2 38.7 16.9 41.5 18.2 L49.5 13.5 L49 24.6 C51 28 52 31.4 52 35.2 C52 48 43.4 57 32 57 C20.6 57 12 48 12 35.2 C12 31.4 13 28 15 24.6 Z","#FBF6EC","#1E1A16",2.6],["c",[24.3,31.5,6.6],"#FBF6EC","#1E1A16",2.4],["c",[39.7,31.5,6.6],"#FBF6EC","#1E1A16",2.4],["p","M30.9 30.6 Q32 29.2 33.1 30.6",0,"#1E1A16",2.2],["c",[26.5,32.7,2.5],"#1E1A16",0,0.0],["c",[41.9,32.7,2.5],"#1E1A16",0,0.0],["c",[27.4,31.8,0.8],"#FBF6EC",0,0.0],["c",[42.8,31.8,0.8],"#FBF6EC",0,0.0],["p","M29.8 38.6 H34.2 L32 42.2 Z","#D9643A","#D9643A",1.6],["p","M12.6 37 C16.5 39 18.4 44 17.6 49.5",0,"#1E1A16",2.2],["p","M50.2 39 C54.5 37.6 58.6 38 62 40.2 C60.8 41.2 59.4 41.7 58 41.7 C59 42.8 59.3 44 59 45.2 C57.6 45 56.4 44.6 55.4 43.8 C55.6 45.2 55.2 46.4 54.4 47.4 C52.8 46.6 51.6 45.8 50.4 44.8","#FBF6EC","#1E1A16",2.1],["p","M27.4 47 l1.8 1.8 l1.8 -1.8 M32.9 47 l1.8 1.8 l1.8 -1.8",0,"#1E1A16",1.6],["p","M30.2 51.2 l1.8 1.8 l1.8 -1.8",0,"#1E1A16",1.6]],reading:[["p","M14.5 13.5 L22.5 18.2 C25.3 16.9 28.6 16.2 32 16.2 C35.4 16.2 38.7 16.9 41.5 18.2 L49.5 13.5 L49 24.6 C51 28 52 31.4 52 35.2 C52 48 43.4 57 32 57 C20.6 57 12 48 12 35.2 C12 31.4 13 28 15 24.6 Z","#FBF6EC","#1E1A16",2.6],["c",[24.3,31.5,6.6],"#FBF6EC","#1E1A16",2.4],["c",[39.7,31.5,6.6],"#FBF6EC","#1E1A16",2.4],["p","M30.9 30.6 Q32 29.2 33.1 30.6",0,"#1E1A16",2.2],["c",[24.3,33.7,2.5],"#1E1A16",0,0.0],["c",[39.7,33.7,2.5],"#1E1A16",0,0.0],["c",[25.2,32.8,0.8],"#FBF6EC",0,0.0],["c",[40.6,32.8,0.8],"#FBF6EC",0,0.0],["p","M29.8 38.6 H34.2 L32 42.2 Z","#D9643A","#D9643A",1.6],["p","M10.5 46.5 Q21 43 32 47 Q43 43 53.5 46.5 L53.5 58.5 Q43 55.5 32 59 Q21 55.5 10.5 58.5 Z","#D9643A","#D9643A",2.0],["p","M13 45 Q22.5 42.2 32 46 L32 56.6 Q22.5 53.2 13 55.6 Z","#FBF6EC","#1E1A16",2.2],["p","M51 45 Q41.5 42.2 32 46 L32 56.6 Q41.5 53.2 51 55.6 Z","#FBF6EC","#1E1A16",2.2],["p","M17 48.6 Q22 47.2 28 48.8 M17 52 Q21 50.9 25 51.8",0,"#1E1A16",1.3],["p","M36 48.8 Q42 47.2 47 48.6 M36 52 Q41 51 46 52",0,"#1E1A16",1.3]]};
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function mark(c,x,y,s){var k=s/64;c.save();c.translate(x,y);c.scale(k,k);
 c.fillStyle=ACC;rr(c,0,0,64,64,14);c.fill();c.fillStyle=BG;rr(c,13,20,31,35,3.5);c.fill();
 c.fillStyle=ACC;rr(c,19,31,12,4,2);c.fill();c.fillStyle=DK;rr(c,19,39,19,4,2);c.fill();rr(c,19,47,12,4,2);c.fill();
 if(window.Path2D){var sp=new Path2D('M44 6Q46.08 16.92 57 19Q46.08 21.08 44 32Q41.92 21.08 31 19Q41.92 16.92 44 6Z');
  c.lineWidth=3.5;c.lineJoin='round';c.strokeStyle=ACC;c.stroke(sp);c.fillStyle='#FFF3D6';c.fill(sp);
  c.fill(new Path2D('M55 28.8Q55.672 32.328 59.2 33Q55.672 33.672 55 37.2Q54.328 33.672 50.8 33Q54.328 32.328 55 28.8Z'))}
 c.restore()}
function hoot(c,pose,x,y,s){if(!window.Path2D)return;var ops=MASCOT[pose],k=s/64;c.save();c.translate(x,y);c.scale(k,k);c.lineCap='round';c.lineJoin='round';
 for(var i=0;i<ops.length;i++){var o=ops[i],g;if(o[0]==='p')g=new Path2D(o[1]);else{g=new Path2D();g.arc(o[1][0],o[1][1],o[1][2],0,2*Math.PI)}
  if(o[2]){c.fillStyle=o[2];c.fill(g)}if(o[3]){c.strokeStyle=o[3];c.lineWidth=o[4];c.stroke(g)}}c.restore()}
var CJK=/[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/;
function tokens(s){var out=[],buf='';for(var i=0;i<s.length;i++){var ch=s[i];
 if(CJK.test(ch)){if(buf){out.push(buf);buf=''}out.push(ch)}else if(ch===' '){buf+=' ';out.push(buf);buf=''}else buf+=ch}if(buf)out.push(buf);return out}
function wrap(c,text,w,max){var t=tokens(text),lines=[],cur='';
 for(var i=0;i<t.length;i++){var nx=cur+t[i];
  if(c.measureText(nx.replace(/\s+$/,'')).width<=w){cur=nx;continue}
  if(!cur){var part='';for(var j=0;j<t[i].length;j++){if(c.measureText(part+t[i][j]).width>w){lines.push(part);part=''}part+=t[i][j]}cur=part;continue}
  if(/^[，。、；：！？）》」』”’,.;:!?)…]/.test(t[i])){if(c.measureText(nx).width<=w+c.measureText(t[i]).width){cur=nx;continue}}
  var ob=/[（《「『“‘(\[]+$/.exec(cur);if(ob&&ob[0].length<cur.length){cur=cur.slice(0,-ob[0].length);t[i]=ob[0]+t[i]}
  lines.push(cur.replace(/\s+$/,''));cur=t[i]}
 if(cur)lines.push(cur.replace(/\s+$/,''));
 if(max&&lines.length>max){var keep=lines.slice(0,max),l=keep[max-1];while(l.length&&c.measureText(l+'\u2026').width>w)l=l.slice(0,-1);
  keep[max-1]=l.replace(/[\s,，、;；:：。.]+$/,'')+'\u2026';return keep}
 return lines}
function ellip(c,s,w){if(c.measureText(s).width<=w)return s;while(s.length&&c.measureText(s+'\u2026').width>w)s=s.slice(0,-1);return s.replace(/[\s,，、;；:：·]+$/,'')+'\u2026'}
function spaced(c,s,x,y,sp){for(var i=0;i<s.length;i++){c.fillText(s[i],x,y);x+=c.measureText(s[i]).width+sp}return x}
function spacedW(c,s,sp){var w=0;for(var i=0;i<s.length;i++)w+=c.measureText(s[i]).width+sp;return w-sp}
function short(t){var m=/^(.{2,40}?)\s*[:：]\s*(.+)$/.exec(t);return m?[m[1],m[2]]:[t,'']}
function bits(q){var h=q.d,b='';for(var i=0;i<h.length;i++)b+=('000'+parseInt(h[i],16).toString(2)).slice(-4);return b}
/* footer = the poster's: ink rule, mark + "Paper Daily" + pointing Hoot, tagline, short URL, QR box (canonical URL) */
function footer(c,o,W,H,x0,dark){var n=o.qr.n,B=bits(o.qr),box=58,qx=W-28-box,qy=H-24-11-box,m=(box-9.2)/n;
 c.fillStyle=dark?'rgba(251,246,236,.22)':DK;c.fillRect(x0,qy-11,W-28-x0,0.67);
 c.fillStyle=dark?BG:'#fff';rr(c,qx,qy,box,box,3.3);c.fill();if(!dark){c.strokeStyle=LINE;c.lineWidth=0.67;rr(c,qx+.33,qy+.33,box-.67,box-.67,3.3);c.stroke()}
 c.fillStyle=INK;for(var yy=0;yy<n;yy++)for(var xx=0;xx<n;xx++)if(B[yy*n+xx]==='1')c.fillRect(qx+4.6+xx*m,qy+4.6+yy*m,m+0.02,m+0.02);
 c.font=F(400,6.7,SANS);c.fillStyle=dark?'rgba(251,246,236,.55)':MUTE;c.textBaseline='top';var sw=c.measureText(o.scan).width;c.fillText(o.scan,qx+(box-sw)/2,qy+box+4);
 var cy=qy+box/2;mark(c,x0,cy-14,28);var tx=x0+36,maxw=qx-10-tx;
 c.font=F(700,16.5,DISP);c.textBaseline='alphabetic';c.fillStyle=dark?BG:INK;c.fillText('Paper ',tx,cy-1);var pw=c.measureText('Paper ').width;c.fillStyle=ACC;c.fillText('Daily',tx+pw,cy-1);
 var we=tx+pw+c.measureText('Daily').width;if(we+30<qx-6)hoot(c,'point',we+3,cy-26,26);
 c.textBaseline='top';c.font=F(400,7.3,SANS);c.fillStyle=dark?'rgba(251,246,236,.55)':MUTE;c.fillText(ellip(c,o.tag,maxw),tx,cy+5);c.fillText(ellip(c,o.durl,maxw),tx,cy+15);
 return qy-11}
function qfont(zh,s,st){return st==='note'?F(zh?700:600,s,SERIF):F(zh?700:600,s,SERIF)}
function fitQuote(c,o,w,h,sizes,lhf){var zh=o.lang!=='en';for(var i=0;i<sizes.length;i++){var s=sizes[i];c.font=qfont(zh,s,o.style);var l=wrap(c,o.quote,w),lh=s*lhf(s);
  if(l.length*lh<=h||i===sizes.length-1){var mx=Math.max(1,Math.floor(h/lh));if(l.length>mx)l=wrap(c,o.quote,w,mx);return {s:s,l:l,lh:lh,fit:l.length*lh<=h+0.5}}}}
function cream(c,o,W,H){var zh=o.lang!=='en',sn=short(o.title);c.fillStyle=BG;c.fillRect(0,0,W,H);c.fillStyle=ACC;c.fillRect(0,0,W,4);
 c.textBaseline='top';c.font=F(700,8,SANS);c.fillStyle=ACC;spaced(c,o.kicker,28,26,1.2);
 c.font=F(400,7.5,SANS);c.fillStyle=MUTE;var iw=c.measureText(o.issue).width;c.fillText(o.issue,W-28-iw,26.5);
 var top=50,bot=footer(c,o,W,H,28,false)-12,w=W-56;
 /* source block height */
 c.font=F(700,9.6,DISP);var st=sn[1]?wrap(c,sn[1],w,2):[];var srcH=16+2.6+11+7+6+17+st.length*12.5+(o.sec?13:0);
 var q=fitQuote(c,o,w,bot-top-26-srcH,zh?[25,22.5,20,18,16.5,15,13.8,12.8]:[23,21,19,17.5,16,14.8,13.6,12.6],function(s){return zh?(s>20?1.55:1.7):(s>19?1.38:1.5)});
 var hh=26+q.l.length*q.lh+srcH,y=top+Math.max(0,(bot-top-hh)/2),y0=y;
 c.font=F(700,62,DISP);c.fillStyle=ACC;c.textBaseline='top';c.fillText('\u201c',25,y-4);y+=26;
 c.font=qfont(zh,q.s);c.fillStyle=DK;c.textBaseline='middle';q.l.forEach(function(l){c.fillText(l,28,y+q.lh/2);y+=q.lh});c.textBaseline='top';
 y+=16;c.fillStyle=ACC;c.fillRect(28,y,26,2.6);y+=2.6+11;
 c.font=F(700,7,SANS);c.fillStyle=MUTE;spaced(c,o.from,28,y,1);y+=13;
 c.font=F(700,15,DISP);c.fillStyle=INK;c.fillText(ellip(c,sn[0],w),28,y);y+=18;
 c.font=F(600,9.6,DISP);c.fillStyle=INK2;st.forEach(function(l){c.fillText(l,28,y);y+=12.5});
 if(o.sec){c.font=F(400,7.5,SANS);c.fillStyle=MUTE;c.fillText(ellip(c,o.sec,w),28,y+3);y+=13}
 return {size:q.s,lines:q.l.length,fit:q.fit&&y<=bot+1,box:[28,y0,w,y-y0]}}
function ink(c,o,W,H){var zh=o.lang!=='en',sn=short(o.title);c.fillStyle=DK;c.fillRect(0,0,W,H);
 var g=c.createRadialGradient(330,30,0,330,30,120);g.addColorStop(0,'rgba(217,100,58,.20)');g.addColorStop(.7,'rgba(217,100,58,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
 hoot(c,'reading',26,20,36);c.textBaseline='middle';c.font=F(500,8.5,SANS);c.fillStyle='rgba(251,246,236,.78)';c.fillText(o.pick,68,39);
 c.font=F(700,8,SANS);c.fillStyle=ACC;var kw=spacedW(c,o.kicker,1.2);spaced(c,o.kicker,W-28-kw,39,1.2);
 var top=72,bot=footer(c,o,W,H,28,true)-12,x=44.6,w=W-28-x;
 var q=fitQuote(c,o,w,bot-top-30,zh?[25,22.5,20,18,16.5,15,13.8,12.8]:[23,21,19,17.5,16,14.8,13.6,12.6],function(s){return zh?(s>20?1.55:1.7):(s>19?1.38:1.5)});
 var hh=q.l.length*q.lh+30,y=top+Math.max(0,(bot-top-hh)/2),y0=y;
 c.fillStyle=ACC;c.fillRect(28,y+2,2.6,q.l.length*q.lh-4);c.font=qfont(zh,q.s);c.fillStyle=BG;
 q.l.forEach(function(l){c.fillText(l,x,y+q.lh/2);y+=q.lh});y+=16;
 c.font=F(700,11,DISP);c.fillStyle=BG;var nm=ellip(c,sn[0],w*.6);c.fillText(nm,x+2,y+6);var nw=c.measureText(nm).width;
 c.font=F(500,8.4,SANS);c.fillStyle='rgba(251,246,236,.62)';c.fillText(ellip(c,o.sec||'',w-nw-8),x+2+nw+6,y+6.5);y+=14;
 return {size:q.s,lines:q.l.length,fit:q.fit&&y<=bot+1,box:[28,y0,W-56,y-y0]}}
function note(c,o,W,H){var zh=o.lang!=='en',sn=short(o.title);c.fillStyle=BG;c.fillRect(0,0,W,H);c.fillStyle=ACC;c.fillRect(0,0,6,H);
 c.textBaseline='middle';c.font=F(700,7.5,SANS);var tw=spacedW(c,o.noteL,.6);c.strokeStyle=ACC;c.lineWidth=.67;rr(c,30,26,tw+26,18,9);c.stroke();
 c.save();c.translate(38,31);c.strokeStyle=ACC;c.lineWidth=1.3;c.lineCap='round';c.beginPath();c.moveTo(1.6,7.2);c.lineTo(6.8,2);c.moveTo(5.2,.8);c.lineTo(8,3.6);c.stroke();c.restore();
 c.fillStyle=ACC;spaced(c,o.noteL,49,35,.6);
 c.font=F(400,7.5,SANS);c.fillStyle=MUTE;var r=o.kicker+(o.sec?' \u00b7 '+o.sec:''),rw;r=ellip(c,r,W-28-30-tw-40);rw=c.measureText(r).width;c.fillText(r,W-28-rw,35);
 var x=30,w=W-58,top=60,ft=footer(c,o,W,H,30,false);
 c.font=F(700,9.6,DISP);var st=sn[1]?wrap(c,sn[1],w,2):[],srcH=13+16+st.length*11.5,sy=ft-14-srcH,bot=sy-14;
 var cs=zh?10.5:10,clh=cs*(zh?1.85:1.6);c.font=F(400,cs,SERIF);
 var bl=o.before?wrap(c,o.before,w):[];if(bl.length>2){bl=bl.slice(-2);bl[0]='\u2026'+bl[0].replace(/^[\s,，、;；:：。.]+/,'')}else if(bl.length&&o.before.length>0)bl[0]=bl[0];
 var al=o.after?wrap(c,o.after,w,2):[];
 var q=fitQuote(c,o,w,bot-top-(bl.length+al.length)*clh-16,zh?[19,17,15.5,14,12.8,11.8,11]:[18,16.5,15,14,12.8,11.8,11],function(s){return zh?1.7:1.5});
 var hh=(bl.length+al.length)*clh+16+q.l.length*q.lh,y=top+Math.max(0,(bot-top-hh)/2),y0=y;
 c.textBaseline='middle';c.font=F(400,cs,SERIF);c.fillStyle='#A39C92';bl.forEach(function(l){c.fillText(l,x,y+clh/2);y+=clh});y+=8;
 c.font=qfont(zh,q.s,'note');q.l.forEach(function(l){var lw=c.measureText(l).width;c.fillStyle='rgba(217,100,58,.30)';c.fillRect(x-1,y+q.lh*.5,lw+2,q.lh*.36);c.fillStyle=DK;c.fillText(l,x,y+q.lh/2);y+=q.lh});y+=8;
 c.font=F(400,cs,SERIF);c.fillStyle='#A39C92';al.forEach(function(l){c.fillText(l,x,y+clh/2);y+=clh});
 c.textBaseline='top';var yy=sy;c.font=F(700,7,SANS);c.fillStyle=MUTE;spaced(c,o.from,x,yy,1);yy+=13;
 c.font=F(700,13,DISP);c.fillStyle=INK;c.fillText(ellip(c,sn[0],w),x,yy);yy+=16;c.font=F(600,8.6,DISP);c.fillStyle=INK2;st.forEach(function(l){c.fillText(l,x,yy);yy+=11.5});
 return {size:q.s,lines:q.l.length,fit:q.fit&&y<=bot+1,box:[x,y0,w,y-y0]}}
var fontsP={};
function fonts(o){var k=o.lang+o.quote;if(fontsP[k])return fontsP[k];if(!document.fonts||!document.fonts.load)return Promise.resolve();
 var txt=o.quote+o.before+o.after+o.title+o.from+o.sec,ls=[document.fonts.load('700 20px "Noto Serif SC"',txt),document.fonts.load('600 20px "Noto Serif SC"',txt),
  document.fonts.load('400 10px "Noto Serif SC"',o.before+o.after),document.fonts.load('700 20px "Noto Serif Display"','Paper Daily\u201c'+o.title)];
 fontsP[k]=Promise.race([Promise.all(ls).catch(function(){}),new Promise(function(r){setTimeout(r,3500)})]);return fontsP[k]}
window.PDQuoteCard=function(o){var zh=o.lang!=='en';o.pick=zh?'夜读鸮划了一句':"Hoot's pick";o.noteL=zh?'批注':'NOTE';o.from=zh?o.from:String(o.from).toUpperCase();
 o.before=o.before||'';o.after=o.after||'';o.sec=o.sec||'';
 return fonts(o).then(function(){var W=360,H=o.style==='ink'?450:480,cv=document.createElement('canvas');cv.width=W*SCALE;cv.height=H*SCALE;
  var c=cv.getContext('2d');try{c.textRendering='geometricPrecision'}catch(e){}c.scale(SCALE,SCALE);c.imageSmoothingQuality='high';
  var r=(o.style==='ink'?ink:o.style==='note'?note:cream)(c,o,W,H);
  window.PDQuoteCard.last={style:o.style,px:[cv.width,cv.height],size:r.size,lines:r.lines,fit:r.fit,box:r.box};
  return new Promise(function(res,rej){if(!cv.toBlob)return rej(new Error('toBlob'));cv.toBlob(function(b){b?res(b):rej(new Error('blob'))},'image/png')})})};
})();
