(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mặt trời, hoa văn khung */
  var rays=$('#rays');
  for(var i=0;i<16;i++){var p=document.createElementNS(NS,'path');
    p.setAttribute('d',i%2===0?'M50 4 L55 26 L45 26 Z':'M50 12 L53.5 26 L46.5 26 Z');
    p.setAttribute('transform','rotate('+(i*22.5)+' 50 50)');rays.appendChild(p);}
  var rg=$('#roseG');
  (function(){
    var h='<g fill="url(#sg)" stroke="#5a3a0e" stroke-width=".7">';
    for(var k=0;k<8;k++)h+='<ellipse cx="0" cy="-11.5" rx="4.4" ry="8" transform="rotate('+(k*45)+')"/>';
    h+='<circle r="6.2"/></g><circle r="3.1" fill="#a3182b" stroke="#fbe7a3" stroke-width=".8"/><circle cx="-.9" cy="-1" r=".9" fill="#ffd6dc"/>';
    rg.innerHTML=h;
  })();

  var stars=$('#stars');
  for(var s=0;s<46;s++){var d=document.createElement('i'),sz=2+Math.random()*3;
    d.style.width=d.style.height=sz+'px';if(Math.random()<.3)d.className='g';
    d.style.left=(Math.random()*100)+'%';d.style.top=(Math.random()*78)+'%';
    d.style.animationDelay=(Math.random()*4)+'s';d.style.animationDuration=(3+Math.random()*3)+'s';stars.appendChild(d);}

  var hs=$('#hillSvg');
  function hill(base,amp,freq,ph,fill,stroke){
    var d='M0 120 L0 '+base;for(var x=0;x<=480;x+=10)d+=' L'+x+' '+(base+Math.sin(x*freq+ph)*amp).toFixed(1);
    d+=' L480 120 Z';var pa=document.createElementNS(NS,'path');pa.setAttribute('d',d);pa.setAttribute('fill',fill);
    if(stroke){pa.setAttribute('stroke',stroke);pa.setAttribute('stroke-width','1.2')}hs.appendChild(pa);}
  hill(52,12,.018,0,'#5f8672','#cdb46a');hill(70,10,.026,2,'#a7b98b','#cdb46a');hill(92,8,.034,4,'#d9d7a8',null);
  for(var f=0;f<50;f++){var c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',Math.random()*480);c.setAttribute('cy',72+Math.random()*44);c.setAttribute('r',1+Math.random()*1.5);
    c.setAttribute('fill',Math.random()<.5?'#fffbe8':'#f4c9d3');hs.appendChild(c);}

  /* =====================  RÈM NHUNG (canvas)  =====================
     Vải được mô hình hoá: u = 0 (đầu thanh treo, sát mép) → 1 (mép giữa).
     Giai đoạn 1: thắt dây ở lưng chừng; giai đoạn 2: kéo gom về hai bên.
     Các nếp gấp sâu dần khi vải được gom, phần chân rèm đi chậm hơn phần trên. */
  var stage=$('#stage'),cv=$('#cv'),ctx=cv.getContext('2d');
  var W=0,H=0,dpr=1;
  var TT=reduce?2.2:6.6, T=0, dir=0, lastTs=0, lastDraw=0, sceneShown=false;
  var COLS=72, FOLDS=7.5, YS=26, Td=0;
  function clamp(x){return x<0?0:x>1?1:x}
  function ease(x){x=clamp(x);return x*x*x*(x*(x*6-15)+10)}
  function mix(a,b,t){return a+(b-a)*t}
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,2);W=stage.clientWidth;H=stage.clientHeight;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);draw(performance.now());
  }
  var mv=0;
  function xAt(u,yn,a,b,side,now){
    var base=W*.505;
    var bump=Math.exp(-Math.pow((yn-.6)/.2,2));
    var tie=1-.6*a*bump;
    var bl=ease(b*1.4-.4*yn);                 /* chân rèm trễ hơn phần trên */
    var sl=1-.68*bl;
    var x=u*base*tie*sl;
    var sw=(b>.98?Math.sin(now/1500+side*1.9+u*2)*1.2*yn*yn*(1-u*.5):0);
    x+=sw+Math.sin(yn*4.2+u*6+now/520)*2.6*mv*u*(.4+yn)+Math.sin(yn*9-now/400)*.9*mv*u;   /* gợn nhẹ khi đang thắt */
    return side===0?x:W-x;
  }
  var DK=[52,4,13],MD=[150,22,38],BR=[214,58,76];
  function col(v,dim){
    var r,g,b,t;
    if(v<.5){t=v/.5;r=mix(DK[0],MD[0],t);g=mix(DK[1],MD[1],t);b=mix(DK[2],MD[2],t)}
    else{t=(v-.5)/.5;r=mix(MD[0],BR[0],t);g=mix(MD[1],BR[1],t);b=mix(MD[2],BR[2],t)}
    return 'rgb('+Math.round(r*dim)+','+Math.round(g*dim)+','+Math.round(b*dim)+')';
  }
  function draw(now){
    if(!W)return;
    var a=ease(Td/2.8), b=ease((Td-2.3)/(TT-2.4)); mv=4*a*(1-a)*(1-b)+4*b*(1-b);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    var amp=.5+.3*clamp(b*1.1+a*.25);
    for(var side=0;side<2;side++){
      for(var i=0;i<COLS;i++){
        var u0=i/COLS,u1=(i+1)/COLS;
        function vAt(uu){var th=uu*FOLDS*6.2832+Math.sin(uu*3.1+a*1.3)*.5+mv*.35*Math.sin(uu*5+now/700);
          var li=.5+.5*Math.cos(th);return .5+(Math.pow(li,1.2)-.5)*amp*2}
        ctx.beginPath();
        for(var k=0;k<=YS;k++){var yn=k/YS;ctx.lineTo(xAt(u0,yn,a,b,side,now),yn*H)}
        for(k=YS;k>=0;k--){yn=k/YS;ctx.lineTo(xAt(u1+.004,yn,a,b,side,now),yn*H)}
        ctx.closePath();
        var xa0=xAt(u0,.5,a,b,side,now),xb0=xAt(u1,.5,a,b,side,now);
        var gr=ctx.createLinearGradient(xa0,0,xb0===xa0?xa0+.01:xb0,0);
        gr.addColorStop(0,col(vAt(u0),1));gr.addColorStop(1,col(vAt(u1),1));
        ctx.fillStyle=gr;ctx.strokeStyle=gr;ctx.lineWidth=.8;ctx.fill();ctx.stroke();
      }
    }
    /* bóng đổ: trên – dưới – quanh chỗ thắt */
    ctx.globalCompositeOperation='source-atop';
    var g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(.2,'rgba(0,0,0,.05)');
    g.addColorStop(.58,'rgba(0,0,0,'+(.05+.33*a)+')');g.addColorStop(.64,'rgba(0,0,0,'+(.05+.22*a)+')');
    g.addColorStop(.8,'rgba(0,0,0,.08)');g.addColorStop(1,'rgba(0,0,0,.5)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
    /* đường nối giữa + mép trong */
    for(side=0;side<2;side++){
      ctx.beginPath();for(k=0;k<=YS;k++){yn=k/YS;ctx.lineTo(xAt(1,yn,a,b,side,now),yn*H)}
      ctx.strokeStyle='rgba(20,0,4,.55)';ctx.lineWidth=2.2;ctx.stroke();
      ctx.strokeStyle='rgba(255,190,150,.22)';ctx.lineWidth=1;ctx.translate(side?1.6:-1.6,0);ctx.stroke();ctx.translate(side?-1.6:1.6,0);
    }
    /* tua rua vàng chân rèm */
    for(side=0;side<2;side++){
      for(i=0;i<COLS;i++){
        var xa=xAt(i/COLS,1,a,b,side,now),xb=xAt((i+1)/COLS,1,a,b,side,now);
        ctx.fillStyle=i%2?'#d9ae52':'#8f6a22';
        ctx.fillRect(Math.min(xa,xb),H-13,Math.abs(xb-xa)+.5,13);
      }
      var xl=xAt(0,1,a,b,side,now),xr=xAt(1,1,a,b,side,now);
      ctx.fillStyle='#fbe7a3';ctx.fillRect(Math.min(xl,xr),H-14,Math.abs(xr-xl),1.5);
    }
    /* dây thắt + tua */
    if(a>.02){
      for(side=0;side<2;side++){
        var yt=H*.603;
        var xs=xAt(.04,.603,a,b,side,now),xe=xAt(.985,.603,a,b,side,now);
        var sagY=yt+7;
        ctx.globalAlpha=clamp(a*1.6);
        ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(xs,yt-3);ctx.quadraticCurveTo((xs+xe)/2,sagY,xe,yt+2);
        ctx.strokeStyle='#3a2606';ctx.lineWidth=10;ctx.stroke();
        ctx.strokeStyle='#d9ae52';ctx.lineWidth=7.5;ctx.stroke();
        ctx.strokeStyle='#fbe7a3';ctx.lineWidth=2.4;ctx.translate(0,-1.4);ctx.stroke();ctx.translate(0,1.4);
        /* tua */
        var sw2=Math.sin(now/900+side*2)*(b>.9?2.2:.6);
        ctx.fillStyle='#d9ae52';ctx.strokeStyle='#3a2606';ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(xe,yt+7,5.5,0,6.283);ctx.fill();ctx.stroke();
        for(var f2=-4;f2<=4;f2++){
          ctx.beginPath();ctx.moveTo(xe+f2*1.1,yt+11);ctx.lineTo(xe+f2*1.6+sw2,yt+46);
          ctx.strokeStyle=f2%2?'#8f6a22':'#fbe7a3';ctx.lineWidth=1.3;ctx.stroke();
        }
        ctx.globalAlpha=1;
      }
    }
  }
  function frame(ts){
    var dt=(ts-lastTs)/1000;lastTs=ts;if(dt>.05)dt=.05;if(dt<0)dt=0;
    Td+=(T-Td)*(1-Math.exp(-dt*5.5));if(Math.abs(T-Td)<.0008)Td=T;
    if(dir!==0){
      T+=dir*dt;
      if(dir>0&&!sceneShown&&T>=TT-.9){sceneShown=true;onOpened()}
      if(T>=TT){T=TT;dir=0}
      if(T<=0){T=0;dir=0;onClosed()}
      draw(ts);lastDraw=ts;
    }else if(Td!==T){draw(ts);lastDraw=ts}
    else if(T>=TT&&!reduce&&ts-lastDraw>33){draw(ts);lastDraw=ts}
    if(dir!==0||Td!==T||(T>=TT&&!reduce))requestAnimationFrame(frame);else running=false;
  }
  var running=false;
  function kick(){if(!running){running=true;lastTs=performance.now();requestAnimationFrame(frame)}}
  window.addEventListener('resize',function(){size();if(typeof layoutSlides==='function')layoutSlides();if(cur>=0&&scenes[cur].dataset.seq)camTo(famIdx<0?-1:famIdx,true)});

  /* =====================  CÁC MÀN  ===================== */
  var scenes=['scene2','scene3','scene4','scene5','scene6','scene7'].map(function(id){return document.getElementById(id)});
  var cur=-1,timers=[];
  function later(fn,ms){timers.push(setTimeout(fn,ms))}
  function clearTimers(){timers.forEach(clearTimeout);timers=[]}

  function reveal(sc){
    var seq=!!sc.dataset.seq;
    var lines=$$('.line',sc).filter(function(l){return !l.classList.contains('later')});
    lines.forEach(function(l){l.classList.remove('show')});
    var t=400;
    lines.forEach(function(l){
      var step=l.tagName==='P'?1000:(l.classList.contains('big')||l.classList.contains('gframe')?800:560);
      (function(el,delay){later(function(){el.classList.add('show')},delay)})(l,t);
      t+=step;
    });
    return t;
  }
  function show(i){
    clearTimers();
    if(cur>=0)scenes[cur].classList.remove('active');
    cur=i;var sc=scenes[i];sc.scrollTop=0;sc.classList.add('active');
    var tEnd=reveal(sc);
    if(sc.dataset.seq){resetFam();later(startFam,Math.max(tEnd-200,1500))}
    if(sc.dataset.slides){resetSlides();later(startSlides,Math.max(tEnd-100,1400))}
    if(i===scenes.length-1)startPetals();else stopPetals();
  }

  /* --- màn gia đình: bố, mẹ, chị cả, chị hai, chị ba, em út --- */
  var IW=1408,IH=768;
  var FAM=[
    {n:'Bố',      d:'Người đứng phía sau, luôn là chỗ dựa vững vàng.',      cx:700, cy:300, ch:560},
    {n:'Mẹ',      d:'Người thắp ngọn đèn ấm áp cho cả nhà.',                cx:892, cy:450, ch:500},
    {n:'Chị cả',  d:'Luôn yêu thương và che chở các em.',                   cx:452, cy:480, ch:470},
    {n:'Chị hai', d:'Tươi vui, luôn mang tiếng cười về cho cả nhà.',          cx:1085,cy:495, ch:430},
    {n:'Chị ba',  d:'Dịu dàng, luôn có mặt mỗi khi cả nhà cần.',            cx:570, cy:565, ch:300},
    {n:'Em út',   d:'Bé nhỏ của cả nhà, ai cũng muốn nâng niu.',            cx:722, cy:655, ch:250}
  ];
  var famIdx=-1,famTimers=[],cam=$('#cam'),pan=$('#pan'),nm=$('#whoNm'),ds=$('#whoDs'),dots=$$('#dots i');
  function camTo(i,noAnim){
    var VW=cam.clientWidth,VH=cam.clientHeight,s,tx,ty;
    if(i<0){s=Math.min(VW/IW,VH/IH);tx=(VW-IW*s)/2;ty=(VH-IH*s)/2;cam.classList.add('full')}
    else{var f=FAM[i];s=Math.min(VH*.86/f.ch,1.15);tx=VW/2-f.cx*s;ty=VH/2-f.cy*s;
      tx=Math.min(0,Math.max(VW-IW*s,tx));ty=Math.min(0,Math.max(VH-IH*s,ty));cam.classList.remove('full')}
    if(noAnim){pan.style.transition='none'}
    pan.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';
    if(noAnim){void pan.offsetWidth;pan.style.transition=''}
  }
  function setWho(i){
    nm.classList.add('o');ds.classList.add('o');
    famTimers.push(setTimeout(function(){
      if(i<0){nm.textContent='Cả nhà mình';ds.textContent='Cùng nhau trên một sân khấu ấm áp.'}
      else{nm.textContent=FAM[i].n;ds.textContent=FAM[i].d}
      nm.classList.remove('o');ds.classList.remove('o');
    },420));
    dots.forEach(function(d,k){d.classList.toggle('on',k===i)});
  }
  function resetFam(){
    famTimers.forEach(clearTimeout);famTimers=[];famIdx=-1;
    nm.innerHTML='&nbsp;';ds.innerHTML='&nbsp;';dots.forEach(function(d){d.classList.remove('on')});
    camTo(-1,true);
    var b=$('#scene4 .btn');b.style.display='none';b.classList.remove('show');
    var sk=$('#skipFam');sk.style.display='';
  }
  function startFam(){
    var step=reduce?2400:2900;
    FAM.forEach(function(_,i){
      famTimers.push(setTimeout(function(){famIdx=i;camTo(i);setWho(i)},i*step));
    });
    famTimers.push(setTimeout(endFam,FAM.length*step));
  }
  function endFam(){
    famIdx=-1;camTo(-1);setWho(-1);dots.forEach(function(d){d.classList.remove('on')});
    $('#skipFam').style.display='none';
    var b=$('#scene4 .btn');b.style.display='';
    famTimers.push(setTimeout(function(){b.classList.add('show')},900));
  }
  $('#skipFam').addEventListener('click',function(){famTimers.forEach(clearTimeout);famTimers=[];endFam()});


  /* --- màn cuối: ảnh của mẹ hiện lần lượt trong khung đỏ --- */
  var SLIDES=[{"s": "assets/img/anh-2.jpg", "w": 1000, "h": 750}, {"s": "assets/img/anh-3.jpg", "w": 750, "h": 1000}, {"s": "assets/img/anh-4.jpg", "w": 750, "h": 1000}, {"s": "assets/img/anh-5.jpg", "w": 1000, "h": 553}, {"s": "assets/img/anh-6.jpg", "w": 1000, "h": 1000}, {"s": "assets/img/anh-7.jpg", "w": 1000, "h": 750}];
  var slWrap=$('#slides'),dots7=$('#dots7'),slEls=[],slDots=[],slTimers=[],ROSE='<svg viewBox="-20 -20 40 40"><use href="#roseG"/></svg>';
  SLIDES.forEach(function(s,i){
    var el=document.createElement('div');el.className='gframe sl';
    el.innerHTML='<i class="gc top">'+ROSE+'</i><i class="gc tl">'+ROSE+'</i><i class="gc tr">'+ROSE+'</i><i class="gc bl">'+ROSE+'</i><i class="gc br">'+ROSE+'</i>'+
      '<div class="in"><div class="win"><img alt="Ảnh của mẹ Hoa ('+(i+1)+')" src="'+s.s+'"></div></div>'+
      (i===SLIDES.length-1?'<span class="plate">Gia đình mình · 20/10</span>':'');
    slWrap.appendChild(el);slEls.push(el);
    var d=document.createElement('i');dots7.appendChild(d);slDots.push(d);
  });
  function layoutSlides(){
    var aw=slWrap.clientWidth-8,ah=slWrap.clientHeight-8,chrome=28;
    if(aw<=0||ah<=0)return;
    SLIDES.forEach(function(s,i){
      var k=Math.min((aw-chrome)/s.w,(ah-chrome)/s.h),w=$('.win',slEls[i]);
      w.style.width=Math.round(s.w*k)+'px';w.style.height=Math.round(s.h*k)+'px';
    });
  }
  var slIdx=-1,slEnded=false;
  function updNav(){$('#slPrev').disabled=slIdx<=0;$('#slNext').disabled=slIdx>=SLIDES.length-1}
  function showSlide(i){
    slIdx=i;updNav();
    slEls.forEach(function(e,k){e.classList.toggle('on',k===i)});
    slDots.forEach(function(e,k){e.classList.toggle('on',k===i)});
  }
  function resetSlides(){
    slTimers.forEach(clearTimeout);slTimers=[];slEnded=false;showSlide(-1);layoutSlides();
    $$('#scene7 .later').forEach(function(e){e.classList.remove('show')});
  }
  function endSlides(){
    if(slEnded)return;slEnded=true;
    slTimers.push(setTimeout(function(){$('#finalMsg').classList.add('show')},800));
    slTimers.push(setTimeout(function(){$('#replay').classList.add('show')},1900));
  }
  function startSlides(){
    var step=reduce?2600:3300;
    SLIDES.forEach(function(_,i){slTimers.push(setTimeout(function(){showSlide(i)},i*step))});
    slTimers.push(setTimeout(endSlides,(SLIDES.length-1)*step+1200));
  }
  /* tự chuyển ảnh: mũi tên hoặc vuốt; chạm vào là dừng phát tự động */
  function goSlide(d){
    var n=slIdx+d;if(n<0||n>=SLIDES.length)return;
    slTimers.forEach(clearTimeout);slTimers=[];
    showSlide(n);
    if(n===SLIDES.length-1)slTimers.push(setTimeout(endSlides,600));
  }
  $('#slPrev').addEventListener('click',function(){goSlide(-1)});
  $('#slNext').addEventListener('click',function(){goSlide(1)});
  (function(){
    var x0=null,y0=0;
    slWrap.addEventListener('touchstart',function(e){var t=e.changedTouches[0];x0=t.clientX;y0=t.clientY},{passive:true});
    slWrap.addEventListener('touchend',function(e){
      if(x0===null)return;var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3)goSlide(dx<0?1:-1);
    },{passive:true});
    document.addEventListener('keydown',function(e){
      if(cur===scenes.length-1){if(e.key==='ArrowRight')goSlide(1);else if(e.key==='ArrowLeft')goSlide(-1)}
    });
  })();

  /* cánh hoa */
  var petalBox=$('#petals'),petalsOn=false;
  function startPetals(){
    if(petalsOn)return;petalsOn=true;petalBox.innerHTML='';
    var n=window.innerWidth<500?26:32;
    for(var k=0;k<n;k++){
      var p=document.createElement('div');p.className='petal';
      var size=9+Math.random()*12;
      p.style.width=size+'px';p.style.height=(size*1.25)+'px';p.style.left=(Math.random()*100)+'%';
      p.style.setProperty('--dx',((Math.random()>.5?1:-1)*(20+Math.random()*50))+'px');
      p.style.animationDuration=(8+Math.random()*7)+'s';p.style.animationDelay=(-Math.random()*14)+'s';
      var h=Math.random();
      if(h<.25)p.style.background='linear-gradient(135deg,#fff0f3,#f7a7bb 60%,#e06485)';
      else if(h<.4)p.style.background='linear-gradient(135deg,#ffe9b0,#f2c25b 60%,#d39a2a)';
      petalBox.appendChild(p);
    }
  }
  function stopPetals(){petalsOn=false;petalBox.innerHTML=''}

  /* mở / đóng màn */
  var intro=$('#intro'),busy=false;
  function onOpened(){show(0);busy=false}
  function onClosed(){intro.classList.remove('gone');busy=false}
  $('#openBtn').addEventListener('click',function(){
    if(busy)return;busy=true;sceneShown=false;intro.classList.add('gone');dir=1;kick();
  });
  $$('[data-next]').forEach(function(b){b.addEventListener('click',function(){if(cur<scenes.length-1)show(cur+1)})});
  $('#replay').addEventListener('click',function(){
    if(busy)return;busy=true;clearTimers();famTimers.forEach(clearTimeout);slTimers.forEach(clearTimeout);
    scenes[cur].classList.remove('active');cur=-1;stopPetals();dir=-1;kick();
  });

  
  /* =====================  NHẠC NỀN (tự tổng hợp bằng Web Audio)  =====================
     Giai điệu chậm, ấm, kiểu hộp nhạc + đàn gảy nhẹ, 8 ô nhịp lặp lại (Đô trưởng). */
  var Music=(function(){
    var BPM=66,beat=60/BPM,bar=beat*4;
    var mf=function(m){return 440*Math.pow(2,(m-69)/12)};
    var CH=[
      {b:36,a:[55,60,64,67]},{b:47,a:[50,55,59,62]},{b:45,a:[52,57,60,64]},{b:40,a:[55,59,64,67]},
      {b:41,a:[53,57,60,65]},{b:40,a:[55,60,64,67]},{b:38,a:[53,57,62,65]},{b:43,a:[50,55,59,62]}
    ];
    var MEL=[
      [[0,76,1.5],[1.5,74,.5],[2,72,1],[3,76,1]],
      [[0,74,2],[2,71,1],[3,74,1]],
      [[0,72,1.5],[1.5,71,.5],[2,69,1],[3,72,1]],
      [[0,71,2],[2,67,1],[3,71,1]],
      [[0,69,1.5],[1.5,67,.5],[2,65,1],[3,69,1]],
      [[0,67,2],[2,72,1],[3,76,1]],
      [[0,77,1.5],[1.5,76,.5],[2,74,1],[3,77,1]],
      [[0,74,2],[2,71,1],[3,67,1]]
    ];
    function impulse(c,sec,decay){
      var n=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,n,c.sampleRate);
      for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)}
      return b;
    }
    function graph(c){
      var master=c.createGain();master.gain.value=0;
      var comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.attack.value=.01;comp.release.value=.3;
      var lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;
      var dry=c.createGain();dry.gain.value=.85;
      var wet=c.createGain();wet.gain.value=.45;
      var verb=c.createConvolver();verb.buffer=impulse(c,2.8,2.4);
      dry.connect(lp);wet.connect(verb);verb.connect(lp);lp.connect(comp);comp.connect(master);master.connect(c.destination);
      var an=c.createAnalyser();an.fftSize=1024;master.connect(an);
      return {dry:dry,wet:wet,master:master,an:an};
    }
    function osc(c,type,f,t,end){var o=c.createOscillator();o.type=type;o.frequency.value=f;o.start(t);o.stop(end);return o}
    function send(c,bus,node,w){node.connect(bus.dry);var s=c.createGain();s.gain.value=w;node.connect(s);s.connect(bus.wet)}
    function box(c,bus,t,f,dur,vel){
      var end=t+Math.max(dur*1.6,1.8),g=c.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+.006);
      g.gain.exponentialRampToValueAtTime(vel*.35,t+.4);g.gain.exponentialRampToValueAtTime(.0001,end);
      [[1,1],[2,.26],[3,.08],[4.01,.035]].forEach(function(p){var og=c.createGain();og.gain.value=p[1];osc(c,'sine',f*p[0],t,end+.05).connect(og);og.connect(g)});
      send(c,bus,g,.8);
    }
    function pluck(c,bus,t,f,vel){
      var end=t+1.5,o=osc(c,'triangle',f,t,end+.05),fl=c.createBiquadFilter(),g=c.createGain();
      fl.type='lowpass';fl.frequency.setValueAtTime(2600,t);fl.frequency.exponentialRampToValueAtTime(700,t+.9);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+.01);g.gain.exponentialRampToValueAtTime(.0001,end);
      o.connect(fl);fl.connect(g);send(c,bus,g,.55);
    }
    function bass(c,bus,t,f,dur,vel){
      var end=t+dur+.3,g=c.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+.06);g.gain.exponentialRampToValueAtTime(vel*.5,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,end);
      osc(c,'sine',f,t,end+.05).connect(g);
      var o2=osc(c,'triangle',f*2,t,end+.05),g2=c.createGain();g2.gain.value=.45;o2.connect(g2);g2.connect(g);send(c,bus,g,.25);
    }
    function pad(c,bus,t,f,dur,vel){
      var end=t+dur+.8,g=c.createGain(),fl=c.createBiquadFilter();
      fl.type='lowpass';fl.frequency.value=850;
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vel,t+1.3);g.gain.setValueAtTime(vel,t+dur-.2);g.gain.linearRampToValueAtTime(.0001,end);
      [-5,5].forEach(function(d){var o=osc(c,'triangle',f,t,end+.05);o.detune.value=d;o.connect(fl)});
      fl.connect(g);send(c,bus,g,.7);
    }
    function scheduleBar(c,bus,n,t){
      var k=n%8,ch=CH[k],pat=[0,1,2,3,2,3,1,2];
      bass(c,bus,t,mf(ch.b),bar,.3);
      for(var j=0;j<3;j++)pad(c,bus,t,mf(ch.a[j]),bar,.05);
      for(var i=0;i<8;i++)pluck(c,bus,t+i*beat/2,mf(ch.a[pat[i]]),.13);
      MEL[k].forEach(function(m){box(c,bus,t+m[0]*beat,mf(m[1]+12),m[2]*beat,.24)});
    }
    var ctx=null,bus=null,timer=0,t0=0,nextBar=0,muted=false,LEVEL=.9,btn=null,silentEl=null,toastEl=null,toastT=0;
    function tick(){
      if(!ctx)return;
      while(t0+nextBar*bar<ctx.currentTime+1.4){scheduleBar(ctx,bus,nextBar,t0+nextBar*bar);nextBar++}
    }
    function running(){return !!ctx&&ctx.state==='running'}
    function paint(){if(btn){var on=running()&&!muted;btn.classList.toggle('off',!on);btn.setAttribute('aria-pressed',String(on))}}
    function say(msg,ms){
      if(!toastEl)return;toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastT);
      toastT=setTimeout(function(){toastEl.classList.remove('show')},ms||5000);
    }
    /* iPhone: Web Audio bị tắt tiếng khi gạt công tắc im lặng; phát một đoạn âm thanh rỗng bằng thẻ audio để chuyển sang kênh "phát nhạc" */
    function silentWav(){
      var n=8000,b=new Uint8Array(44+n),dv=new DataView(b.buffer),i;
      function s(o,str){for(var k=0;k<str.length;k++)dv.setUint8(o+k,str.charCodeAt(k))}
      s(0,'RIFF');dv.setUint32(4,36+n,true);s(8,'WAVE');s(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
      dv.setUint32(24,8000,true);dv.setUint32(28,8000,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);s(36,'data');dv.setUint32(40,n,true);
      for(i=0;i<n;i++)b[44+i]=128;
      var bin='';for(i=0;i<b.length;i++)bin+=String.fromCharCode(b[i]);
      return 'data:audio/wav;base64,'+btoa(bin);
    }
    function unlockIOS(){
      try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
      try{
        if(!silentEl){
          silentEl=document.createElement('audio');silentEl.src=silentWav();silentEl.loop=true;
          silentEl.setAttribute('playsinline','');silentEl.setAttribute('aria-hidden','true');silentEl.style.display='none';
          document.body.appendChild(silentEl);
        }
        var p=silentEl.play();if(p&&p.catch)p.catch(function(){});
      }catch(e){}
    }
    function init(){
      if(ctx)return true;
      var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      try{ctx=new AC()}catch(e){ctx=null;return false}
      bus=graph(ctx);
      try{var ub=ctx.createBuffer(1,1,22050),us=ctx.createBufferSource();us.buffer=ub;us.connect(ctx.destination);us.start(0)}catch(e){}
      t0=ctx.currentTime+.25;nextBar=0;
      bus.master.gain.setValueAtTime(0,ctx.currentTime);
      bus.master.gain.linearRampToValueAtTime(muted?0:LEVEL,ctx.currentTime+3.5);
      tick();timer=setInterval(tick,250);
      if(ctx.addEventListener)ctx.addEventListener('statechange',paint);
      return true;
    }
    function gesture(){
      if(muted)return;
      unlockIOS();
      if(!init())return;
      if(!running()){var p=ctx.resume();if(p&&p.then)p.then(after,after)}else after();
    }
    function after(){
      paint();
      setTimeout(function(){
        paint();
        if(!muted&&!running())say('Chạm vào biểu tượng loa để bật nhạc ♪',6000);
      },900);
    }
    function toggle(){
      if(!running()){muted=false;gesture();paint();return}
      muted=!muted;
      bus.master.gain.cancelScheduledValues(ctx.currentTime);
      bus.master.gain.setTargetAtTime(muted?0:LEVEL,ctx.currentTime,.35);
      paint();
    }
    function bind(b,toast){
      btn=b;toastEl=toast;
      b.addEventListener('click',function(e){e.stopPropagation();toggle()});
      ['click','touchend','pointerup','keydown'].forEach(function(ev){
        document.addEventListener(ev,function(){if(!muted&&!(running()&&silentEl&&!silentEl.paused))gesture()},{capture:true,passive:true});
      });
      document.addEventListener('visibilitychange',function(){
        if(!ctx)return;
        if(document.hidden){ctx.suspend()}else if(!muted){ctx.resume()}
      });
      paint();
    }
    function level(){
      if(!bus)return -1;var d=new Uint8Array(bus.an.fftSize);bus.an.getByteTimeDomainData(d);
      var s=0;for(var i=0;i<d.length;i++){var v=(d[i]-128)/128;s+=v*v}return Math.sqrt(s/d.length);
    }
    return {bind:bind,graph:graph,scheduleBar:scheduleBar,bar:bar,LEVEL:LEVEL,level:level,running:running};
  })();
  Music.bind($('#mute'),$('#toast'));
  
  size();
})();
