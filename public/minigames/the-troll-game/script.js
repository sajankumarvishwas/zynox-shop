(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const startView = $('startView');
  const loadingView = $('loadingView');
  const resultView = $('resultView');
  const startBtn = $('startBtn');
  const startLabel = $('startLabel');
  const clickMsg = $('clickMsg');
  const startStatus = $('startStatus');
  const loadingStatus = $('loadingStatus');
  const loadingHint = $('loadingHint');
  const loadingClick = $('loadingClick');
  const loadingToast = $('loadingToast');
  const friendBanner = $('friendBanner');
  const soundBtn = $('soundBtn');
  const fsBtn = $('fsBtn');
  const retryBtn = $('retryBtn');
  const shareBtn = $('shareBtn');
  const shareNote = $('shareNote');
  const statClicks = $('statClicks');
  const statTime = $('statTime');
  const statLevel = $('statLevel');
  const particles = $('particles');

  const calmMessages = [
    'INITIALIZING...', 'PREPARING GAME...', 'STARTING SYSTEM...', 'PLEASE WAIT...', 'CHECKING SYSTEM...',
    'LOADING CORE...', 'PREPARING EXPERIENCE...', 'CONNECTING...', 'VERIFYING...', 'GETTING THINGS READY...'
  ];
  const irritated = [
    'WHY ARE YOU CLICKING?', "BRO, IT'S LOADING.", 'PLEASE WAIT.', 'YOU CAN JUST WAIT.', 'STOP CLICKING.',
    'IT IS CURRENTLY LOADING.', 'WHY DID YOU CLICK AGAIN?', 'JUST WAIT.', 'SERIOUSLY?', 'THE BUTTON IS ALREADY WORKING.'
  ];
  const angry = [
    'I SAID WAIT.', 'BRO.', 'ARE YOU SERIOUS?', 'STOP CLICKING.', "THAT DOESN'T MAKE IT LOAD FASTER.",
    'YOU REALLY KEEP DOING THAT?', 'WHY?', 'PLEASE STOP.', 'THIS IS GETTING ANNOYING.', 'BRO, RELAX.'
  ];
  const strong = [
    'WHAT THE FUCK ARE YOU DOING?', "YOU REALLY WON'T STOP.", 'STOP FUCKING CLICKING.', 'GET YOUR ASS OFF THAT BUTTON.',
    "BRO, I'M SERIOUS.", 'WHY ARE YOU STILL CLICKING?', 'YOU HAD ONE JOB.', 'LET IT LOAD.', "FOR FUCK'S SAKE.", "YOU'RE MAKING THIS WORSE."
  ];
  const aggressive = [
    'BRO WHAT THE FUCK.', "YOU'RE ACTUALLY OBSESSED WITH THIS BUTTON.", 'GET YOUR ASS OFF IT.', 'THIS SHIT IS LOADING.',
    'WHY THE FUCK ARE YOU STILL HERE?', 'YOU REALLY THOUGHT CLICKING AGAIN WOULD HELP?', 'STOP BEING A DUMBASS.', 'BRO, ENOUGH.',
    "THIS IS FUCKING EMBARRASSING.", 'YOU ARE NOT WINNING THIS.'
  ];
  const dark = [
    "BRO, YOU'RE FUCKING COMMITTED.", "YOU STILL HAVEN'T LEARNED.", 'WHAT THE FUCK IS WRONG WITH YOU?', "YOU'RE STILL CLICKING THIS SHIT?",
    "I'M BEGGING YOU TO STOP.", 'BRO, THIS IS SAD.', "YOU'RE FIGHTING A BUTTON.", 'THE BUTTON IS WINNING.', "YOU'RE LOSING TO THE UI.", 'THIS IS YOUR LIFE NOW.'
  ];
  const hostile = [
    'YOU ARE ACTUALLY UNSTOPPABLE.', 'STOP FUCKING TOUCHING IT.', 'BRO, GO OUTSIDE.', "YOU'VE LOST THE PLOT.",
    "YOU'RE CLICKING A FUCKING BUTTON FOR FUN.", 'HOW ARE YOU STILL DOING THIS?', 'THE ADMIN IS WATCHING.', "YOU KNOW THIS ISN'T GOING ANYWHERE.",
    "YOU'RE GETTING FUCKING COOKED.", 'THIS IS PATHETIC 💀'
  ];
  const psychological = [
    "YOU'RE NOT GETTING OUT OF THIS.", 'YOU COULD HAVE STOPPED.', 'YOU CHOSE THIS.', 'BRO REALLY ACCEPTED HIS FATE.',
    "YOU'RE STILL HERE.", 'WHY?', 'THIS IS GETTING WEIRD.', 'YOU HAVE BEEN WARNED.', 'YOU REFUSE TO LEARN.', 'THE BUTTON OWNS YOU NOW.'
  ];
  const nearFinal = [
    "YOU'RE ACTUALLY FUCKING INSANE.", 'BRO, THIS IS YOUR 84TH CLICK.', 'WHAT ARE YOU EXPECTING?', 'YOU KNOW EXACTLY WHAT\'S HAPPENING.',
    'YOU COULD WALK AWAY.', "YOU WON'T.", 'THIS SHIT IS NOT STARTING.', "YOU'RE STILL TRYING.", 'ADMIN STATUS: AMUSED.', 'KEEP GOING, IDIOT.'
  ];
  const finalTen = [
    'NINETY SOMETHING CLICKS.', 'YOU MADE IT THIS FAR.', "DON'T STOP NOW.", 'YOU REALLY WANT THIS, HUH?', 'ONE MORE...', 'KEEP GOING.',
    'THIS IS ALMOST OVER.', "YOU'VE COME TOO FAR.", 'THE ADMIN KNOWS.', "YOU HAVE NO IDEA WHAT'S COMING.", '99.'
  ];
  const loadingInitial = ['INITIALIZING...', 'LOADING...', 'PREPARING GAME...', 'CONNECTING...', 'VERIFYING...', 'PREPARING EXPERIENCE...', 'FINAL CHECK...', 'OPTIMIZING...', 'STARTING SYSTEM...', 'PLEASE WAIT...'];
  const loadingMid = ['STILL WORKING...', 'THIS IS TAKING A WHILE.', 'PLEASE CONTINUE WAITING.', 'PROCESSING...', 'ALMOST THERE...', 'PLEASE BE PATIENT.', 'FINALIZING...', 'STILL LOADING...'];
  const loadingLate = ['BRO...', 'WHY ARE YOU STILL WAITING?', 'THIS IS TAKING A WHILE.', "YOU'VE BEEN HERE FOR A MINUTE.", 'STILL LOADING 💀', 'BRO, SERIOUSLY?', 'YOU REALLY WAITED THIS LONG.', 'NAH.', 'STILL LOADING.'];
  const loadingClickMsgs = ['STOP CLICKING.', "BRO, IT'S STILL LOADING.", 'WHY ARE YOU CLICKING?', "THAT DOESN'T HELP.", "YOU'RE STILL DOING IT?", 'BRO 💀', 'JUST WAIT.', 'YOU REALLY THOUGHT THAT WOULD WORK?'];
  const roasts = [
    'NAH BRO, YOU ACTUALLY FELL FOR THAT 💀', 'BRO REALLY WAITED THAT LONG.', 'YOU CLICKED ALL THAT FOR NOTHING.', 'THE ADMIN GOT YOUR ASS.',
    'YOU REALLY THOUGHT IT WAS LOADING.', 'YOU JUST GOT PLAYED.', '60 SECONDS FOR ABSOLUTELY FUCKING NOTHING.'
  ];

  const state = {
    phase: 'START', clickCount: 0, startTime: 0, loadingStart: 0, loadingDuration: 0, loadingTimer: 0,
    loadingClicks: 0, sound: true, raf: 0, toastTimer: 0, lastMessage: '', shareFallback: false, recentClicks: [], aggression: 0, lastAggressionAt: 0, lastLoadingMsg: -1, nextLoadingMsgAt: 0, autoRevealTimer: 0
  };

  const milestoneSet = new Set([5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]);

  function escapeUrlText(value) { return String(value).replace(/[\r\n]+/g, ' ').trim(); }
  function stagePool(c) {
    if (c <= 10) return calmMessages;
    if (c <= 20) return irritated;
    if (c <= 30) return angry;
    if (c <= 40) return strong;
    if (c <= 50) return aggressive;
    if (c <= 60) return dark;
    if (c <= 70) return hostile;
    if (c <= 80) return psychological;
    if (c <= 90) return nearFinal;
    return finalTen;
  }
  function pickDifferent(pool) {
    const uniquePool = [...new Set(pool)];
    let available = uniquePool.filter(message => !state.usedMessages.has(message));

    if (!available.length) {
      available = uniquePool.filter(message => message !== state.lastMessage);
    }

    const pick = available[Math.floor(Math.random() * available.length)] || uniquePool[0];
    state.usedMessages.add(pick);
    state.lastMessage = pick;
    return pick;
  }

  function speakButtonMessage(text) {
    if (!state.sound || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      const c = state.clickCount;
      u.rate = Math.min(1.25, 0.92 + c * 0.0025);
      u.pitch = Math.max(0.62, 1.08 - c * 0.0035);
      u.volume = 0.72;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
      if (preferred) u.voice = preferred;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

function playTone(kind='click') {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!playTone.ctx) playTone.ctx = new Ctx();
      const ctx = playTone.ctx;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      const now = ctx.currentTime;
      const freq = kind === 'reveal' ? 92 : kind === 'glitch' ? 150 : Math.max(90, 260 - state.clickCount * 1.4);
      osc.type = kind === 'glitch' ? 'sawtooth' : 'sine'; osc.frequency.setValueAtTime(freq, now);
      if (kind === 'reveal') osc.frequency.exponentialRampToValueAtTime(38, now + .55);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(kind==='reveal' ? .12 : .045, now+.012); gain.gain.exponentialRampToValueAtTime(.0001, now + (kind==='reveal'? .6 : .12));
      osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + (kind==='reveal'? .62 : .14));
    } catch (_) {}
  }
  function createParticles() {
    const count = Math.min(55, Math.max(26, Math.floor(window.innerWidth / 26)));
    particles.replaceChildren();
    for (let i=0;i<count;i++) {
      const p=document.createElement('i'); p.className='particle';
      p.style.left=(Math.random()*100).toFixed(2)+'%'; p.style.top=(70+Math.random()*45).toFixed(2)+'%';
      p.style.setProperty('--dur',(9+Math.random()*11).toFixed(2)+'s'); p.style.animationDelay=(-Math.random()*14).toFixed(2)+'s';
      p.style.opacity=(.12+Math.random()*.22).toFixed(2); particles.appendChild(p);
    }
  }
  function setPhase(next) {
    state.phase = next;
    [startView, loadingView, resultView].forEach(v => v.classList.add('hidden'));
    if (next === 'START' || next === 'COUNTING' || next === 'FINAL_EXPANSION') startView.classList.remove('hidden');
    if (next === 'ADMIN' || next === 'LOADING') loadingView.classList.remove('hidden');
    if (next === 'RESULT') resultView.classList.remove('hidden');
  }
  function tempLevel(c) {
    if (c < 20) return 'calm'; if (c < 40) return 'warm'; if (c < 60) return 'angry'; if (c < 80) return 'dark'; return 'final';
  }
  function applyTemper() {
    app.classList.remove('angry','dark','final-temper');
    const level=tempLevel(state.clickCount);
    if (level === 'angry') app.classList.add('angry');
    if (level === 'dark' || level === 'final') app.classList.add('dark');
    if (level === 'final') app.classList.add('final-temper');
  }
  function scaleForClicks(c) {
    if(c <= 1) return 1;
    const t=Math.min(1,c/99);
    return 1 + Math.pow(t,1.22)*0.58;
  }
  function renderClick() {
    const c=state.clickCount;
    const scale=scaleForClicks(c);
    startBtn.style.setProperty('--btn-scale', scale.toFixed(3));
    clickMsg.textContent=pickDifferent(stagePool(c));
    if(c>=5) speakButtonMessage(clickMsg.textContent);
    startLabel.textContent='';
    applyTemper();

    const intensity=Math.min(1,c/100);
    const aggression=Math.min(1,state.aggression/10);
    const shake=Math.min(18,1+intensity*16+aggression*7);

    startBtn.animate([
      {transform:`perspective(900px) rotateX(7deg) scale(${Math.max(1,scale-.035)}) rotate(0deg)`},
      {transform:`perspective(900px) rotateX(7deg) scale(${scale+0.03}) rotate(${(Math.random()-.5)*shake}deg)`},
      {transform:`perspective(900px) rotateX(7deg) scale(${scale}) rotate(${(Math.random()-.5)*shake*.4}deg)`}
    ],{duration:360+Math.random()*120,easing:'cubic-bezier(.2,.8,.2,1)'});

    clickMsg.animate(
      [{opacity:.25,transform:'translateY(7px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],
      {duration:420,easing:'cubic-bezier(.2,.8,.2,1)'}
    );

    if(c>=30 || aggression>.1) playTone('glitch'); else playTone('click');
    if(milestoneSet.has(c)) {
      clickMsg.animate([{opacity:.3,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'ease-out'});
    }
    if(c===100) beginFinalExpansion();
  }

  const startStatusMessages=[
    'INITIALIZING',
    'MAKING YOUR EXPERIENCE BETTER',
    'PREPARING GAME FILES',
    'CHECKING SYSTEM',
    'LOADING GAME MODULES',
    'PREPARING YOUR SESSION',
    'VERIFYING CONFIGURATION',
    'OPTIMIZING EXPERIENCE',
    'CONNECTING TO GAME CORE',
    'SETTING THINGS UP',
    'ALLOCATING RESOURCES',
    'PREPARING INPUT SYSTEM',
    'CHECKING COMPATIBILITY',
    'SYNCING GAME DATA',
    'BUILDING YOUR SESSION',
    'WARMING UP THE GAME ENGINE',
    'VERIFYING PLAYER CONFIG',
    'FINALIZING SETUP',
    'PLEASE WAIT',
    'ALMOST READY',
    'PREPARING FINAL COMPONENTS',
    'RUNNING PRE-START CHECKS',
    'LOADING EXPERIENCE DATA',
    'GETTING EVERYTHING READY',
    'STARTUP SEQUENCE ACTIVE',
    'FINAL SYSTEM CHECK',
    'GAME CORE STANDING BY',
    'READYING LAUNCH SEQUENCE'
  ];

  let startStatusIndex=0;
  let startStatusRunning=false;
  let startStatusTimer=0;
  let startStatusDotTimer=0;

  function updateStartStatus(){
    if(!startStatus || !startStatusRunning || state.phase!=='COUNTING') return;

    if(startStatusDotTimer) window.clearInterval(startStatusDotTimer);

    const base=startStatusMessages[startStatusIndex];
    let dots=1;

    const paint=()=>{
      if(!startStatusRunning || state.phase!=='COUNTING') return;
      startStatus.textContent=base+'.'.repeat(dots);
      startStatus.animate(
        [{opacity:.4},{opacity:1}],
        {duration:180,easing:'ease-out'}
      );
      dots=dots===3?1:dots+1;
    };

    paint();
    startStatusDotTimer=window.setInterval(paint,520);

    if(startStatusTimer) window.clearTimeout(startStatusTimer);
    startStatusTimer=window.setTimeout(()=>{
      if(!startStatusRunning || state.phase!=='COUNTING') return;
      startStatusIndex=(startStatusIndex+1)%startStatusMessages.length;
      updateStartStatus();
    },2850);
  }

  function beginStartStatus(){
    if(startStatusRunning) return;
    startStatusRunning=true;
    startStatusIndex=0;
    updateStartStatus();
  }

  function stopStartStatus(){
    startStatusRunning=false;
    if(startStatusTimer) window.clearTimeout(startStatusTimer);
    if(startStatusDotTimer) window.clearInterval(startStatusDotTimer);
    startStatusTimer=0;
    startStatusDotTimer=0;
  }

  function startClick() {
    if(state.phase!=='START' && state.phase!=='COUNTING') return;

    const now=performance.now();
    state.recentClicks=state.recentClicks.filter(t=>now-t<=2000);
    state.recentClicks.push(now);

    if(state.recentClicks.length>=3){
      state.aggression=Math.min(10,state.aggression+1);
      state.lastAggressionAt=now;
    }

    if(state.phase==='START'){
      state.phase='COUNTING';
      state.clickCount=1;
      state.startTime=now;
      beginStartStatus();
      renderClick();

      state.autoRevealTimer = window.setTimeout(() => {
        state.autoRevealTimer = 0;
        if(state.phase==='COUNTING'){
          beginFinalExpansion();
        }
      }, 60000);

      return;
    }

    if(state.clickCount<100){
      state.clickCount+=1;
      renderClick();
    }
  }
  function beginFinalExpansion() {
    if(state.phase!=='COUNTING') return;
    if(state.autoRevealTimer){
      clearTimeout(state.autoRevealTimer);
      state.autoRevealTimer=0;
    }
    state.phase='FINAL_EXPANSION';
    startBtn.disabled=true;
    clickMsg.textContent='100.';
    playTone('reveal');
    startBtn.animate([
      {transform:`scale(${scaleForClicks(100)})`,filter:'brightness(1)'},
      {transform:'scale(18)',filter:'brightness(1.55)'},
      {transform:'scale(38)',filter:'brightness(2.4)'}
    ],{duration:1350,easing:'cubic-bezier(.16,.78,.12,1)',fill:'forwards'});
    app.animate([{filter:'brightness(1)'},{filter:'brightness(1.7)'},{filter:'brightness(.18)'}],{duration:1350,easing:'ease-in-out',fill:'forwards'});
    setTimeout(() => {
      app.style.filter=''; setPhase('ADMIN');
      loadingStatus.textContent='ADMIN IS COOKING...'; loadingHint.textContent='';
      loadingStatus.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.2,.8,.2,1)'});
      playTone('glitch');
      setTimeout(startLoading,1450);
    },1420);
  }
  function startLoading() {
    state.phase='LOADING';
    state.loadingStart=performance.now();
    state.loadingDuration=45000+Math.random()*15000;
    state.loadingClicks=0;
    state.loadingTimer=0;
    state.lastLoadingMsg=-1;
    state.nextLoadingMsgAt=0;
    loadingHint.textContent='INITIALIZING...';
    loopLoading();
  }
  function loopLoading() {
    if(state.phase!=='LOADING') return;

    const now=performance.now();
    const elapsed=now-state.loadingStart;
    const p=Math.min(1,elapsed/state.loadingDuration);
    const pool=p<.42?loadingInitial:p<.74?loadingMid:loadingLate;

    if(now>=state.nextLoadingMsgAt){
      let index=Math.floor(Math.random()*pool.length);
      if(pool.length>1 && index===state.lastLoadingMsg) index=(index+1)%pool.length;
      state.lastLoadingMsg=index;
      loadingHint.textContent=pool[index];
      loadingHint.animate(
        [{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:450,easing:'ease-out'}
      );
      state.nextLoadingMsgAt=now+2200;
    }

    if(now-state.lastAggressionAt>2600 && state.aggression>0)
      state.aggression=Math.max(0,state.aggression-1);

    if(elapsed>=state.loadingDuration){
      finishTroll();
      return;
    }

    state.raf=requestAnimationFrame(loopLoading);
  }
  function loadingInteract() {
    if (state.phase!=='LOADING') return;
    state.loadingClicks += 1;
    const index=Math.min(loadingClickMsgs.length-1,Math.floor((state.loadingClicks-1)/2));
    loadingToast.textContent=loadingClickMsgs[index];
    loadingToast.classList.add('show');
    clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>loadingToast.classList.remove('show'),900);
    loadingClick.animate([{transform:'scale(1)'},{transform:'scale(.985)'},{transform:'scale(1)'}],{duration:180});
    playTone('click');
  }
  function finishTroll() {
    if (state.phase!=='LOADING') return;
    cancelAnimationFrame(state.raf);
    state.phase='FINAL_REVEAL';
    playTone('reveal');
    loadingStatus.textContent=''; loadingHint.textContent=''; loadingToast.classList.remove('show');
    loadingView.animate([{filter:'brightness(1)'},{filter:'brightness(2.2)'},{filter:'brightness(0)'}],{duration:900,easing:'ease-in',fill:'forwards'});
    setTimeout(showResult,950);
  }
  function showResult() {
    const elapsed=Math.max(0,(state.loadingStart+state.loadingDuration)-state.startTime)/1000;
    const totalClicks=100+state.loadingClicks;
    const roast=roasts[Math.floor(Math.random()*roasts.length)];
    statClicks.textContent=String(totalClicks);
    statTime.textContent=elapsed.toFixed(1)+'s';
    statLevel.textContent=totalClicks>=130?'CERTIFIED VICTIM 💀':totalClicks>=115?'ABSOLUTE VICTIM 💀':'PROFESSIONAL VICTIM 💀';
    $('resultRoast').textContent=roast;
    setPhase('RESULT');
    resultView.style.animation='none'; void resultView.offsetWidth; resultView.style.animation='';
    resultView.animate([{opacity:0,transform:'scale(1.03)'},{opacity:1,transform:'scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
  }
  function resetGame() {
    cancelAnimationFrame(state.raf); clearTimeout(state.toastTimer);
    if(state.autoRevealTimer){
      clearTimeout(state.autoRevealTimer);
      state.autoRevealTimer=0;
    }
    state.phase='START'; state.clickCount=0; state.startTime=0; state.loadingClicks=0; state.usedMessages=new Set(); state.lastMessage=''; state.recentClicks=[]; state.aggression=0; state.lastAggressionAt=0; state.lastLoadingMsg=-1; state.nextLoadingMsgAt=0; stopStartStatus();
    startBtn.disabled=false; startBtn.style.setProperty('--btn-scale','1'); startBtn.style.transform=''; startLabel.textContent='START GAME'; clickMsg.textContent='';
    loadingToast.classList.remove('show'); app.style.filter=''; app.classList.remove('angry','dark','final-temper');
    setPhase('START');
    const fromShare=new URLSearchParams(location.search).get('troll')==='friend'; friendBanner.classList.toggle('hidden',!fromShare);
  }
  async function shareGame() {
    const url=location.href.split('#')[0];
    const clicks=statClicks.textContent; const time=statTime.textContent;
    const variants=[
      `I survived ${clicks} clicks. You won't. 💀`,
      `I wasted ${time} on this shit. Your turn.`,
      `I clicked this ${clicks} times like an idiot. Beat that. 💀`,
      `The admin got me. Now it's your turn. 💀`,
      `I just wasted ${time} on The Troll Game. Your turn.`
    ];
    const text=escapeUrlText(variants[Math.floor(Math.random()*variants.length)]);
    try {
      if (navigator.share) {
        await navigator.share({title:'THE TROLL GAME 💀',text,url:url+'?troll=friend'});
        shareNote.textContent='SENT. NOW LET THEM SUFFER. 💀';
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url+'?troll=friend'); shareNote.textContent='LINK COPIED 💀'; return;
      }
      shareNote.textContent='COPY THIS: '+url+'?troll=friend';
    } catch (err) {
      if (err?.name !== 'AbortError') shareNote.textContent='THE LINK IS: '+url+'?troll=friend';
    }
  }
  function toggleSound(){state.sound=!state.sound;soundBtn.textContent=state.sound?'SOUND ON':'SOUND OFF';if(state.sound)playTone('click')}
  async function toggleFullscreen(){
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen();
    } catch (_) {}
  }

  startBtn.addEventListener('click', startClick);
  loadingClick.addEventListener('click', loadingInteract);
  retryBtn.addEventListener('click', resetGame);
  shareBtn.addEventListener('click', shareGame);
  soundBtn.addEventListener('click', toggleSound);
  fsBtn.addEventListener('click', toggleFullscreen);
  addEventListener('resize', createParticles, {passive:true});
  createParticles(); resetGame();
})();
