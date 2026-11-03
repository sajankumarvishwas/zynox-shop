/* ZYNOXIFY MUSIC - player logic. One audio instance; local library plus provider search. */
(function(){
"use strict";

const songs=[
"295 (Official Audio) _ Sidhu Moose Wala _ The Kidd _ Moosetape(MP3_160K).mp3",
  "Alan Walker - The Spectre(MP3_160K).mp3",
  "Alan Walker_ K-391_ Tungevaag_ Mangoo - PLAY (Alan Walker_s Video)(MP3_160K).mp3",
  "Alan Walker_ Sabrina Carpenter _ Farruko  - On My Way(MP3_160K).mp3",
  "Angreji Beat (Original Video)_ Yo Yo Honey Singh _ Gippy Grewal _ Rimpy Prince _ Veet Baljit(MP3_160K).mp3",
  "Avicii - The Nights(MP3_160K).mp3",
  "Avicii - Waiting For Love(MP3_160K).mp3",
  "Avicii - Wake Me Up (Official Video)(MP3_160K).mp3",
  "BROWN MUNDE - AP DHILLON _ GURINDER GILL _ SHINDA KAHLON (Official Music Video)(MP3_160K).mp3",
  "Badshah - DJ Waley Babu _ feat Aastha Gill _ Party Anthem _ DJ Wale Babu(MP3_160K).mp3",
  "Badshah - Jugnu (Official Video) _ Nikhita Gandhi _ Akanksha Sharma(MP3_160K).mp3",
  "Badtameez Dil Full Song HD Yeh Jawaani Hai Deewani _ PRITAM _ Ranbir Kapoor_ Deepika Padukone(MP3_160K).mp3",
  "Blue Eyes Full Video Song Yo Yo Honey Singh _ Blockbuster Song Of 2013(MP3_160K).mp3",
  "Bolo Ta Ra Ra (Lyrical) Daler Mehndi _ Punjabi Pop Song _ Superhit Punjabi Party Song(MP3_160K).mp3",
  "Brown Rang (8K Video) _ Yo Yo Honey Singh _ Full Song _ Latest Punjabi Song 2026(MP3_160K).mp3",
  "Clean Bandit - Rockabye (feat. Sean Paul _ Anne-Marie) [Official Video](MP3_160K).mp3",
  "Coolio - Gangsta_s Paradise (feat. L.V.) [Official Music Video](MP3_160K).mp3",
  "DJ Snake - Magenta Riddim(MP3_160K).mp3",
  "DJ Snake_ Lil Jon - Turn Down for What(MP3_160K).mp3",
  "Daddy Yankee - Gasolina (Video Oficial)(MP3_160K).mp3",
  "Dangal - Title Track _ Lyrical Video _ Dangal _ Aamir Khan _ Pritam _ Amitabh B _ Daler Mehndi(MP3_160K).mp3",
  "Dhan Te Nan Full Video Song _ Kaminey _ Shahid Kapoor_ Priyanka Chopra _ Vishal Bharadwaj(MP3_160K).mp3",
  "Diljit Dosanjh _ Lemonade _ Intense _ Raj Ranjodh _ Drive Thru(MP3_160K).mp3",
  "Diljit Dosanjh_ Born To Shine (Official Music Video) G.O.A.T(MP3_160K).mp3",
  "Diljit Dosanjh_ LOVER (Official Music Video) Intense _ Raj Ranjodh _ MoonChild Era(MP3_160K).mp3",
  "Divya Kumar जी ने दी _Jee Karda_ Song पर Powerful Performance _ Indian Idol Season 11 _ Full Episode(MP3_160K).mp3",
  "Dope Shope (Official Video) _ Yo Yo Honey Singh _ Deep Money _ International Villager _ Superhit(MP3_160K).mp3",
  "Ed Sheeran - Shape of You (Official Music Video)(MP3_160K).mp3",
  "Eminem - Lose Yourself(MP3_160K).mp3",
  "Eminem - Till I Collapse [HD](MP3_160K).mp3",
  "Eminem - Without Me (Official Music Video)(MP3_160K).mp3",
  "Exclusive_ LOVE DOSE Full Video Song _ Yo Yo Honey Singh_ Urvashi Rautela _ Desi Kalakaar(MP3_160K).mp3",
  "Excuses (Official Video) _ AP Dhillon _ Gurinder Gill _ Intense(MP3_160K).mp3",
  "Full Video_ Mauja Hi Mauja _ Jab We Met _ Shahid kapoor_ Kareena Kapoor _ Mika Singh _  Pritam(MP3_160K).mp3",
  "Full Video_ Naatu Naatu Song (Telugu) _ RRR Songs _ NTR_Ram Charan _ MM Keeravaani _ SS Rajamouli(MP3_160K).mp3",
  "Gandi Baat - 8K_4K Music Video _ Shahid Kapoor _ Sonakshi Sinha _ Pritam _ R...Rajkumar(MP3_160K).mp3",
  "HIGH HEELS TE NACHCHE Video Song _ KI _ KA _ Meet Bros ft. Jaz Dhami _ Yo Yo Honey Singh _ T-Series(MP3_160K).mp3",
  "Imagine Dragons - Believer (Official Music Video)(MP3_160K).mp3",
  "Imagine Dragons - Bones (Official Music Video)(MP3_160K).mp3",
  "Imagine Dragons x J.I.D - Enemy (from the series Arcane League of Legends)(MP3_160K).mp3",
  "J Balvin_ Willy William - Mi Gente (Official Video)(MP3_160K).mp3",
  "Jason Derulo - Swalla (feat. Nicki Minaj _ Ty Dolla _ign) [Official Music Video](MP3_160K).mp3",
  "Kala Chashma - Full Video_ Baar Baar Dekho_ Sidharth Katrina _ Prem Hardeep Kam Badshah Neha Indeep(MP3_160K).mp3",
  "Kar Gayi Chull - Kapoor _ Sons _ Sidharth Malhotra_ Alia Bhatt _ Badshah _ Amaal Mallik _ Fazilpuria(MP3_160K).mp3",
  "Lil Nas X_ Jack Harlow - INDUSTRY BABY (Official Video)(MP3_160K).mp3",
  "Luis Fonsi - Despacito ft. Daddy Yankee(MP3_160K).mp3",
  "Lyrical_ Chammak Challo _ Ra One _ ShahRukh Khan _ Kareena Kapoor(MP3_160K).mp3",
  "MILLIONAIRE SONG (Full Video)_ _YoYoHoneySingh  _ GLORY _ BHUSHAN KUMAR(MP3_160K).mp3",
  "Major Lazer _ DJ Snake - Lean On (feat. MØ) [Official 4K Music Video](MP3_160K).mp3",
  "Malhari - Full Video Song _ Bajirao Mastani _ Ranveer Singh _ Vishal Dadlani _ Sanjay Leela Bhansali(MP3_160K).mp3",
  "Martin Garrix - Animals (Official Video)(MP3_160K).mp3",
  "Masked Wolf - Astronaut In The Ocean (Official Music Video)(MP3_160K).mp3",
  "Måneskin - Beggin_ (Lyrics_Testo)(MP3_160K).mp3",
  "Naina _ Crew _ Diljit Dosanjh_ Ft. Badshah _ Tabu_ Kareena Kapoor Khan_ Kriti Sanon _ Raj Ranjodh(MP3_160K).mp3",
  "OFFICIAL_ Abhi Toh Party Shuru Hui Hai VIDEO Song _ Khoobsurat _ Badshah _ Aastha _ Sonam Kapoor(MP3_160K).mp3",
  "OH Ho Ho Ho _ ORIGINAL SONG _ Ishq Tera Tadpave _ Sukhbir _ Original Video(MP3_160K).mp3",
  "OLD SKOOL (Full Video) Prem Dhillon ft Sidhu Moose Wala _ The Kidd _ Nseeb _ Rahul Chahal _GoldMedia(MP3_160K).mp3",
  "Oo Antava Mawa..Oo Oo Antava Video Song (Telugu) _ Pushpa Songs _ Allu Arjun_ DSP _Sukumar _Samantha(MP3_160K).mp3",
  "Padmaavat_ Khalibali - Ranveer Singh _ Deepika Padukone _ Shahid Kapoor _ Shivam Pathak(MP3_160K).mp3",
  "Sam Smith_ Kim Petras - Unholy (Official Music Video)(MP3_160K).mp3",
  "Sauda Khara Khara _Good Newwz_ Akshay Kumar _ Kareena _ Diljit _ Kiara_ Sukhbir_Dhvani_Lijo_DjChetas(MP3_160K).mp3",
  "Shiv Tandav Stotram _ Shankar Mahadevan _ रावण रचित शिव तांडव स्तोत्र _ Shiv Bhajan _ Shiva Bhakti(MP3_160K).mp3",
  "Shubh - Baller (Official Music Video)(MP3_160K).mp3",
  "Shubh - Cheques (Official Music Video)(MP3_160K).mp3",
  "Shubh - Elevated (Official Music Video)(MP3_160K).mp3",
  "Shubh - King Shit (Official Audio)(MP3_160K).mp3",
  "Shubh - One Love (Official Audio)(MP3_160K).mp3",
  "Sia - Cheap Thrills (Official Lyric Video) ft. Sean Paul(MP3_160K).mp3",
  "Sia - Unstoppable (Official Video - Live from the Nostalgic For The Present Tour)(MP3_160K).mp3",
  "Sultan Title Song _ Salman Khan_ Anushka Sharma _ Sukhwinder Singh_ Shadab Faridi_ Vishal _ Shekhar(MP3_160K).mp3",
  "THE LAST RIDE - Offical Video _  Sidhu Moose Wala _ Wazir Patar(MP3_160K).mp3",
  "Tauba Tauba _ Bad Newz _ Vicky Kaushal _ Triptii Dimri _ Karan Aujla(MP3_160K).mp3",
  "The Chainsmokers - Closer (Official Video) ft. Halsey(MP3_160K).mp3",
  "The Chainsmokers - Don_t Let Me Down (Official Video) ft. Daya(MP3_160K).mp3",
  "The Weeknd - Blinding Lights (Official Video)(MP3_160K).mp3",
  "The Weeknd - Starboy ft. Daft Punk (Official Video) ft. Daft Punk(MP3_160K).mp3",
  "The Weeknd - The Hills(MP3_160K).mp3",
  "Tokyo Drift - Teriyaki Boyz [ MUSIC VIDEO ] HD(MP3_160K).mp3",
  "Tunak Tunak Tun Video _ Daler Mehndi _ Full Song _ Daler Mehndi Music(MP3_160K).mp3",
  "White Brown Black - Avvy Sra _ Karan Aujla _ Jaani _ Amanninder Singh _ Desi Melodies(MP3_160K).mp3",
  "Winning Speech (Music Video) Karan Aujla _ Mxrci _ Latest Punjabi Songs 2024(MP3_160K).mp3",
  "Yo Yo Honey Singh_ MAKHNA Video Song _ Neha Kakkar_ Singhsta_ TDO _ Bhushan Kumar(MP3_160K).mp3",
  "Zingaat Hindi _ Dhadak _ Ishaan _ Janhvi _ Ajay-Atul _ Amitabh Bhattacharya(MP3_160K).mp3",
  "_Criminal (Full Song) Ra.One_ _ ShahRukh Khan _ Kareena Kapoor(MP3_160K).mp3",
  "_Gallan Goodiyaan_ Full VIDEO Song _ Dil Dhadakne Do _ T-Series(MP3_160K).mp3",
  "_Sooraj Dooba Hain_ FULL VIDEO SONG _ Arijit singh Aditi Singh Sharma _ T-SERIES(MP3_160K).mp3",
  "_Subha Hone Na De Full Song__ Desi Boyz _ Akshay Kumar _John Abraham _ Pritam _  Mika Singh_ Kumaar(MP3_160K).mp3",
  "aarambh-hai-prachand.mp3",
  "chaiyya-chaiyya.mp3",
  "dil-dhadakne-do.mp3",
  "goat.mp3",
  "no-love.mp3"
];
const MUSIC_BASE="/assets/zynoxify/music/";
const NS="http://www.w3.org/2000/svg";
const $=(id)=>document.getElementById(id);
const root=$("zyx-root");
if(!root||!songs.length)return;

const ids=["stage","scene","art","source","title","artist","live","cur","dur","seek","shuffle","prev","play","play-use","next","repeat","repeat-badge","fav","mute","mute-use","vol","list","lib-empty","filter","count","form","q","disc-status","results","embed","queue","queue-reset","led","status-text","scrim","close","sheet","vid","vid-label","mode-switch","mode-cover","mode-video"];
const el={};
ids.forEach((k)=>{el[k]=$("zyx-"+k)});
const missing=ids.filter((k)=>!el[k]);
if(missing.length){console.error("Zynoxify: missing elements: "+missing.join(", "));return}

const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
const desktop=window.matchMedia("(min-width: 960px)");

/* ---------- helpers ---------- */
function h(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function svgIcon(id,solid){
  const s=document.createElementNS(NS,"svg");
  s.setAttribute("class","zyx-ic"+(solid?" zyx-ic--solid":""));
  s.setAttribute("aria-hidden","true");
  const u=document.createElementNS(NS,"use");
  u.setAttribute("href","#"+id);
  s.appendChild(u);
  return s;
}
function fmt(t){
  if(!isFinite(t)||t<0)t=0;
  const m=Math.floor(t/60),s=Math.floor(t%60);
  return m+":"+String(s).padStart(2,"0");
}
function isHttps(u){return typeof u==="string"&&/^https:\/\//i.test(u)}
function setFill(input){
  const min=Number(input.min)||0,max=Number(input.max)||100;
  input.style.setProperty("--zx-fill",((Number(input.value)-min)/(max-min)*100)+"%");
}
function announce(text){el.live.textContent="";setTimeout(()=>{el.live.textContent=text},30)}
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
function hashStr(s){let x=0;for(const c of s)x=(x*31+c.codePointAt(0))>>>0;return x}

function nameOf(file){
  let n=file.replace(/\.[^.]+$/,"").replace(/\(MP3_160K\)/gi,"").replace(/\(MP3_128K\)/gi,"");
  n=n.replace(/\s*\([^)]*(Official|Lyric|Video|Audio)[^)]*\)/gi,"").replace(/\s*\[[^\]]*(Official|Lyric|Video|Audio)[^\]]*\]/gi,"");
  n=n.replace(/^Eminem\s*-\s*/i,"").replace(/^The Weeknd\s*-\s*/i,"").replace(/^Avicii\s*-\s*/i,"").replace(/^Alan Walker\s*-\s*/i,"");
  return n.replace(/_/g," ").replace(/\s+/g," ").trim();
}
function parseMeta(file){
  let raw=file.replace(/\.[^.]+$/,"").replace(/\(MP3_160K\)/gi,"").replace(/\(MP3_128K\)/gi,"");
  raw=raw.replace(/\s*\([^)]*(Official|Lyric|Video|Audio|Full Song)[^)]*\)/gi,"").replace(/\s*\[[^\]]*(Official|Lyric|Video|Audio)[^\]]*\]/gi,"");
  const title=nameOf(file);
  let artist="Zynoxify Gaming Mix";
  if(raw.indexOf(" - ")>0){
    const parts=raw.split(" - ");
    const c0=parts[0].replace(/_/g," ").trim();
    const c1=parts.slice(1).join(" - ").replace(/_/g," ").trim();
    if(c0&&c1){
      if(title.toLowerCase().indexOf(c0.toLowerCase())===0&&c1.length<48)artist=c1;
      else artist=c0;
    }
  }else if(raw.indexOf(" _ ")>0){
    const parts=raw.split(" _ ").map((s)=>s.replace(/_/g," ").trim()).filter(Boolean);
    if(parts.length>1)artist=parts[1];
  }
  return {title:title,artist:artist};
}
const metas=songs.map(parseMeta);
const titles=metas.map((m)=>m.title);
const artists=metas.map((m)=>m.artist);

/* ---------- preferences and favourites (this device only) ---------- */
const prefs={vol:80,muted:false,shuffle:false,repeat:"all",video:false};
(function(){
  const s=store.get("zynoxify:prefs",{});
  if(s&&typeof s==="object"){
    if(Number.isFinite(s.vol))prefs.vol=Math.min(100,Math.max(0,s.vol));
    if(typeof s.muted==="boolean")prefs.muted=s.muted;
    if(typeof s.shuffle==="boolean")prefs.shuffle=s.shuffle;
    if(["off","all","one"].indexOf(s.repeat)>=0)prefs.repeat=s.repeat;
    if(typeof s.video==="boolean")prefs.video=s.video;
  }
})();
const favRaw=store.get("zynoxify:favs",[]);
const favs=new Set(Array.isArray(favRaw)?favRaw.filter((f)=>songs.indexOf(f)>=0):[]);
function saveFavs(){store.set("zynoxify:favs",Array.from(favs))}

/* ---------- state ---------- */
const audio=new Audio();
audio.preload="metadata";
audio.volume=prefs.vol/100;
audio.muted=prefs.muted;

let cur=null;                 /* {kind:"local"|"stream"|"embed", idx?, item?} */
let order=songs.map((_,i)=>i);
let pos=0;
let shuffleOn=false;
let repeat=prefs.repeat;
let activeTab="library";
let scrubbing=false;
let sourceBase="",sourceSuffix="";
let onlineAvailable=null;
let markedRow=null;
let lastOpener=null;
let ytPlayer=null,ytApi=null,ytTimer=0;
let videoMode=prefs.video;
const upNext=[];
let quietOpen=false;
let roomApplying=false;
let roomHold=false;
let roomPrimeStage=0;
let roomBlob={key:"",url:"",ready:false};
function roomBlocks(kind,payload){
  if(roomApplying)return false;
  const g=window.ZynoxifyRoom;
  return !!(g&&g.active&&typeof g.intercept==="function"&&g.intercept(kind,payload));
}

function savePrefs(){store.set("zynoxify:prefs",{vol:Math.round(audio.volume*100),muted:audio.muted,shuffle:shuffleOn,repeat:repeat,video:videoMode})}

/* ---------- now-playing display ---------- */
function renderSource(){el.source.textContent=sourceBase+(sourceSuffix?" \u00b7 "+sourceSuffix:"")}
function setArt(meta){
  const hVal=hashStr(meta.title||"Zynoxify");
  const hue=(330+(hVal%65))%360;
  root.style.setProperty("--zx-glow-hue",String(hue));
  el.art.replaceChildren();
  el.art.style.setProperty("--zx-art-a","hsl("+hue+" 58% 34%)");
  el.art.style.setProperty("--zx-art-b","hsl("+((hue+24)%360)+" 42% 11%)");
  const letter=Array.from(meta.title||"").find((c)=>/[\p{L}\p{N}]/u.test(c))||"Z";
  el.art.appendChild(h("span","zyx-mono",letter.toUpperCase()));
  if(isHttps(meta.artUrl)){
    const img=document.createElement("img");
    img.alt="";
    img.decoding="async";
    img.referrerPolicy="no-referrer";
    img.addEventListener("error",()=>img.remove());
    img.src=meta.artUrl;
    el.art.appendChild(img);
  }
  if(meta.idxText)el.art.appendChild(h("span","zyx-art-idx",meta.idxText));
}
function setMediaSession(meta){
  if(!("mediaSession" in navigator)||typeof MediaMetadata==="undefined")return;
  try{navigator.mediaSession.metadata=new MediaMetadata({title:meta.title,artist:meta.artist||"Zynoxify",album:meta.album||""})}catch(e){}
}
function setInfo(meta){
  sourceBase=meta.source;
  sourceSuffix="";
  renderSource();
  el.title.textContent=meta.title;
  el.artist.textContent=meta.artist||"Zynoxify Studio";
  setArt(meta);
  setMediaSession(meta);
}
function setPlaying(on){
  root.classList.toggle("is-playing",on);
  el["play-use"].setAttribute("href",on?"#zi-pause":"#zi-play");
  el.play.setAttribute("aria-label",on?"Pause":"Play");
}
function syncTime(){
  let d=audio.duration,t=audio.currentTime||0;
  if(cur&&cur.kind==="embed"){d=0;t=0;if(ytPlayer&&ytPlayer.getDuration){try{d=ytPlayer.getDuration();t=ytPlayer.getCurrentTime()}catch(e){}}}
  const ok=!!cur&&isFinite(d)&&d>0;
  el.seek.disabled=!ok;
  el.seek.value=ok?String(Math.round(t/d*1000)):"0";
  setFill(el.seek);
  el.cur.textContent=fmt(ok?t:0);
  el.dur.textContent=ok?fmt(d):"0:00";
  el.seek.setAttribute("aria-valuetext",ok?fmt(t)+" of "+fmt(d):"Not available");
}
function syncVolume(){
  el.vol.value=String(Math.round(audio.volume*100));
  setFill(el.vol);
  const muted=audio.muted||audio.volume===0;
  el.mute.setAttribute("aria-pressed",String(muted));
  el["mute-use"].setAttribute("href",muted?"#zi-mute":"#zi-volume");
}
function syncFav(){
  const local=!!cur&&cur.kind==="local";
  const online=!!cur&&cur.kind==="embed"&&!!cur.item;
  const hooks=window.ZynoxifyHooks||{};
  const on=local?favs.has(songs[cur.idx]):(online&&typeof hooks.isLiked==="function"?!!hooks.isLiked(cur.item):false);
  el.fav.disabled=!(local||online);
  el.fav.setAttribute("aria-pressed",String(on));
  el.fav.setAttribute("aria-label",!(local||online)?"Nothing to like yet":on?"Remove from favourites":(online?"Like this song":"Save to favourites"));
}
function updateMarks(){
  if(markedRow){
    markedRow.btn.removeAttribute("aria-current");
    markedRow.mark.replaceChildren();
    markedRow=null;
  }
  if(cur&&cur.kind==="local"){
    const r=rows[cur.idx];
    if(r){
      r.btn.setAttribute("aria-current","true");
      r.mark.appendChild(svgIcon("zi-bars"));
      markedRow=r;
    }
  }
}
function updateAll(){
  applyVideoMode();
  updateMarks();
  syncFav();
  syncTime();
  if(activeTab==="queue")renderQueue();
}

/* ---------- loading and playing ---------- */
function stopEmbed(){
  clearInterval(ytTimer);ytTimer=0;
  if(ytPlayer){try{ytPlayer.destroy()}catch(e){}ytPlayer=null}
  el.embed.replaceChildren();
  el.embed.hidden=true;
  root.classList.remove("is-video","is-yt");
}
function applyVideoMode(){
  const isEmbed=!!cur&&cur.kind==="embed";
  const showVideo=isEmbed&&videoMode;
  root.classList.toggle("is-video",showVideo);
  root.classList.toggle("is-yt",isEmbed);
  el.vid.hidden=!isEmbed;
  el["mode-switch"].hidden=!isEmbed;
  el.embed.hidden=!isEmbed;
  el.vid.setAttribute("aria-pressed",String(showVideo));
  el.vid.setAttribute("aria-label",showVideo?"Show cover instead of video":"Show video");
  el["vid-label"].textContent=showVideo?"Cover":"Video";
  el["mode-cover"].setAttribute("aria-pressed",String(!videoMode));
  el["mode-video"].setAttribute("aria-pressed",String(videoMode));
}
function setVideoMode(on){
  videoMode=!!on;
  applyVideoMode();
  savePrefs();
  announce(videoMode?"Video mode active":"Cover mode active");
}
function loadYtApi(){
  if(ytApi)return ytApi;
  ytApi=new Promise((resolve,reject)=>{
    if(window.YT&&window.YT.Player){resolve();return}
    const prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){if(typeof prev==="function")prev();resolve()};
    const s=document.createElement("script");
    s.src="https://www.youtube.com/iframe_api";
    s.async=true;
    s.onerror=()=>{ytApi=null;reject(new Error("yt_api"))};
    document.head.appendChild(s);
  });
  return ytApi;
}
function embedPoll(){
  clearInterval(ytTimer);
  ytTimer=setInterval(()=>{if(!scrubbing)syncTime()},500);
}
function applyEmbedVolume(){
  if(!ytPlayer||!ytPlayer.setVolume)return;
  try{
    ytPlayer.setVolume(Math.round(audio.volume*100));
    if(audio.muted)ytPlayer.mute();else ytPlayer.unMute();
  }catch(e){}
}
function embedToggle(){
  if(!ytPlayer||!ytPlayer.getPlayerState)return;
  try{if(ytPlayer.getPlayerState()===1)ytPlayer.pauseVideo();else ytPlayer.playVideo()}catch(e){}
}
function embedSeek(){
  if(!ytPlayer||!ytPlayer.getDuration)return;
  try{
    const d=ytPlayer.getDuration();
    setFill(el.seek);
    if(d>0){const t=Number(el.seek.value)/1000*d;ytPlayer.seekTo(t,true);el.cur.textContent=fmt(t)}
  }catch(e){}
}
function embedFail(msg){
  setPlaying(false);
  sourceSuffix=msg;
  renderSource();
  announce(msg);
}
function loadLocal(idx){
  stopEmbed();
  cur={kind:"local",idx:idx};
  audio.src=MUSIC_BASE+encodeURIComponent(songs[idx]);
  try{localStorage.setItem("zyf-last-song",String(idx))}catch(e){}
  setInfo({
    source:"Local collection",
    title:titles[idx],
    artist:artists[idx],
    album:"Gaming Vibe",
    idxText:String(idx+1).padStart(2,"0")+" / "+songs.length
  });
  setPlaying(false);
  updateAll();
}
function fail(){
  setPlaying(false);
  sourceSuffix="Unavailable";
  renderSource();
  announce("This track could not be played.");
}
function tryPlay(){
  const p=audio.play();
  if(p&&p.catch)p.catch((err)=>{
    if(err&&err.name==="AbortError")return;
    if(err&&err.name==="NotAllowedError"){setPlaying(false);return}
    fail();
  });
}
function playLocalIdx(idx){if(roomBlocks("play",{kind:"local",idx:idx}))return;loadLocal(idx);tryPlay();announce("Now playing "+titles[idx])}
function playStream(item){
  if(roomBlocks("play",{kind:"stream",item:item}))return;
  if(!isHttps(item.streamUrl)){announce("This track has no permitted stream.");return}
  stopEmbed();
  cur={kind:"stream",item:item};
  audio.src=item.streamUrl;
  setInfo({
    source:(item.providerAttribution||item.provider||"Online")+" \u00b7 direct stream",
    title:item.title,
    artist:item.artist||"Independent Artist",
    artUrl:item.artworkUrl,
    idxText:String(item.providerAttribution||item.provider||"").toUpperCase()
  });
  setPlaying(false);
  updateAll();
  tryPlay();
  announce("Now playing "+item.title);
}
function playEmbed(item){
  if(roomBlocks("play",{kind:"online",item:item}))return;
  const holdPlayback=roomHold;
  if(!holdPlayback)roomPrimeStage=2;
  const m=typeof item.embedUrl==="string"&&item.embedUrl.match(/^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})$/);
  if(!m){announce("This item has no embedded player.");return}
  audio.pause();
  stopEmbed();
  cur={kind:"embed",item:item};
  if(!quietOpen)root.classList.add("is-player-open");
  setInfo({source:"YouTube",title:item.title,artist:item.artist||"YouTube Music",artUrl:item.artworkUrl,idxText:"YOUTUBE"});
  setPlaying(false);
  root.classList.add("is-yt");
  el.embed.hidden=false;
  updateAll();
  if(!desktop.matches)closeSheet();
  sourceSuffix="Loading player";
  renderSource();
  const mount=document.createElement("div");
  el.embed.appendChild(mount);
  loadYtApi().then(()=>{
    if(!cur||cur.item!==item)return;
    ytPlayer=new YT.Player(mount,{
      width:"100%",height:"100%",videoId:m[1],
      playerVars:{playsinline:1,rel:0,autoplay:(holdPlayback?0:1),controls:0,fs:0,disablekb:1,modestbranding:1,iv_load_policy:3,cc_load_policy:0,origin:location.origin},
      events:{
        onReady:()=>{applyEmbedVolume();embedPoll();sourceSuffix="";renderSource()},
        onStateChange:(ev)=>{
          const s=ev.data;
          if(s===1){setPlaying(true);sourceSuffix="";renderSource()}
          else if(s===2){setPlaying(false)}
          else if(s===3){sourceSuffix="Buffering";renderSource()}
          else if(s===0){
            setPlaying(false);
            if(repeat==="one"){try{ytPlayer.seekTo(0,true);ytPlayer.playVideo()}catch(e){}}
            else advance(1,true);
          }
          syncTime();
        },
        onError:()=>embedFail("This video cannot be played here")
      }
    });
  }).catch(()=>{embedFail("YouTube player could not load")});
  announce("Loading YouTube player");
}
function togglePlay(){
  if(roomBlocks("toggle"))return;
  if(!cur)return;
  if(cur.kind==="embed"){embedToggle();return}
  if(audio.paused)tryPlay();else audio.pause();
}
function advance(dir,auto){
  if(roomBlocks(dir>0?"next":"prev",{auto:!!auto}))return;
  const len=order.length;
  if(!len)return;
  if(auto&&repeat==="one"&&cur&&cur.kind!=="embed"){audio.currentTime=0;tryPlay();return}
  if(dir>0&&upNext.length){playEntry(upNext.shift());renderUpNextIfOpen();return}
  if(!auto&&dir<0&&cur&&cur.kind!=="embed"&&audio.currentTime>3){audio.currentTime=0;return}
  let np=pos+dir;
  if(np>=len){
    if(auto&&repeat==="off"){audio.pause();audio.currentTime=0;setPlaying(false);return}
    np=0;
  }else if(np<0){np=len-1}
  pos=np;
  playLocalIdx(order[pos]);
}

/* ---------- audio events ---------- */
audio.addEventListener("play",()=>setPlaying(true));
audio.addEventListener("pause",()=>setPlaying(false));
audio.addEventListener("ended",()=>advance(1,true));
audio.addEventListener("timeupdate",()=>{if(!scrubbing)syncTime()});
audio.addEventListener("durationchange",syncTime);
audio.addEventListener("loadedmetadata",syncTime);
audio.addEventListener("waiting",()=>{sourceSuffix="Buffering";renderSource()});
const clearBuffer=()=>{if(sourceSuffix==="Buffering"){sourceSuffix="";renderSource()}};
audio.addEventListener("playing",clearBuffer);
audio.addEventListener("canplay",clearBuffer);
audio.addEventListener("error",fail);
audio.addEventListener("volumechange",()=>{syncVolume();savePrefs();applyEmbedVolume()});

/* ---------- transport controls ---------- */
el.play.addEventListener("click",togglePlay);
el.prev.addEventListener("click",()=>advance(-1,false));
el.next.addEventListener("click",()=>advance(1,false));

el.seek.addEventListener("pointerdown",()=>{scrubbing=true});
["pointerup","pointercancel","change","blur"].forEach((ev)=>el.seek.addEventListener(ev,()=>{scrubbing=false}));
el.seek.addEventListener("input",()=>{
  if(cur&&cur.kind==="embed"){embedSeek();return}
  const d=audio.duration;
  setFill(el.seek);
  if(isFinite(d)&&d>0){
    audio.currentTime=Number(el.seek.value)/1000*d;
    el.cur.textContent=fmt(audio.currentTime);
    el.seek.setAttribute("aria-valuetext",fmt(audio.currentTime)+" of "+fmt(d));
  }
});

el.vol.addEventListener("input",()=>{
  const v=Number(el.vol.value)/100;
  audio.volume=v;
  if(v>0&&audio.muted)audio.muted=false;
  setFill(el.vol);
});
el.mute.addEventListener("click",()=>{
  if(audio.muted||audio.volume===0){
    audio.muted=false;
    if(audio.volume===0)audio.volume=.5;
  }else{audio.muted=true}
});

function updateShuffleUI(){el.shuffle.setAttribute("aria-pressed",String(shuffleOn))}
function setShuffle(on,say){
  const curIdx=order[pos];
  shuffleOn=on;
  if(on){
    const rest=order.filter((i)=>i!==curIdx);
    shuffleArr(rest);
    order=[curIdx].concat(rest);
    pos=0;
  }else{
    order=songs.map((_,i)=>i);
    pos=Math.max(0,order.indexOf(curIdx));
  }
  updateShuffleUI();
  savePrefs();
  if(activeTab==="queue")renderQueue();
  if(say)announce(on?"Shuffle on":"Shuffle off");
}
el.shuffle.addEventListener("click",()=>setShuffle(!shuffleOn,true));

function updateRepeatUI(){
  const label={off:"Repeat off",all:"Repeat all",one:"Repeat one"}[repeat];
  el.repeat.setAttribute("aria-label",label);
  el.repeat.setAttribute("aria-pressed",String(repeat!=="off"));
  el["repeat-badge"].hidden=repeat!=="one";
  return label;
}
el.repeat.addEventListener("click",()=>{
  repeat={off:"all",all:"one",one:"off"}[repeat];
  announce(updateRepeatUI());
  savePrefs();
});

el.fav.addEventListener("click",()=>{
  if(cur&&cur.kind==="embed"&&cur.item){const hk=window.ZynoxifyHooks||{};if(typeof hk.toggleLike==="function")hk.toggleLike(cur.item);return}
  if(!cur||cur.kind!=="local")return;
  const f=songs[cur.idx];
  if(favs.has(f)){favs.delete(f);announce("Removed from favourites")}
  else{favs.add(f);announce("Saved to favourites on this device")}
  saveFavs();
  syncFav();
  applyFilter();
});

if("mediaSession" in navigator){
  const acts={play:()=>{if(audio.paused)togglePlay()},pause:()=>audio.pause(),previoustrack:()=>advance(-1,false),nexttrack:()=>advance(1,false)};
  Object.keys(acts).forEach((a)=>{try{navigator.mediaSession.setActionHandler(a,acts[a])}catch(e){}});
}

el.vid.addEventListener("click",()=>setVideoMode(!videoMode));
el["mode-cover"].addEventListener("click",()=>setVideoMode(false));
el["mode-video"].addEventListener("click",()=>setVideoMode(true));

/* ---------- 3D deck tilt ---------- */
(function(){
  let dragging=false,raf=0,nx=0,ny=0;
  function apply(){
    raf=0;
    el.scene.style.setProperty("--zx-tilt-y",(nx*14).toFixed(2)+"deg");
    el.scene.style.setProperty("--zx-tilt-x",(-ny*10).toFixed(2)+"deg");
    el.scene.style.setProperty("--zx-gx",(nx*40).toFixed(1));
  }
  function reset(){
    dragging=false;
    el.scene.classList.remove("is-dragging");
    nx=0;ny=0;
    if(!raf)raf=requestAnimationFrame(apply);
  }
  el.stage.addEventListener("pointerdown",(e)=>{
    if(e.target&&e.target.closest&&e.target.closest("#zyx-embed"))return;
    if(e.pointerType==="mouse"||reduceMotion.matches)return;
    dragging=true;
    el.scene.classList.add("is-dragging");
  });
  el.stage.addEventListener("pointermove",(e)=>{
    if(reduceMotion.matches)return;
    if(e.pointerType!=="mouse"&&!dragging)return;
    const r=el.stage.getBoundingClientRect();
    nx=Math.max(-.5,Math.min(.5,(e.clientX-r.left)/r.width-.5));
    ny=Math.max(-.5,Math.min(.5,(e.clientY-r.top)/r.height-.5));
    if(!raf)raf=requestAnimationFrame(apply);
  });
  ["pointerup","pointercancel","pointerleave"].forEach((ev)=>el.stage.addEventListener(ev,reset));
})();

/* ---------- library ---------- */
const rows=[];
(function(){
  const frag=document.createDocumentFragment();
  songs.forEach((f,i)=>{
    const li=document.createElement("li");
    const btn=h("button","zyx-row");
    btn.type="button";
    btn.dataset.i=String(i);
    const numBadge=h("span","zyx-row-n",String(i+1).padStart(2,"0"));
    const hue=(325+(hashStr(titles[i])%70))%360;
    numBadge.style.setProperty("--zx-row-hue","hsl("+hue+" 45% 28%)");
    const metaBox=h("span","zyx-row-meta");
    metaBox.appendChild(h("span","zyx-row-t",titles[i]));
    metaBox.appendChild(h("span","zyx-row-sub",artists[i]));
    const mark=h("span","zyx-row-m");
    btn.appendChild(numBadge);
    btn.appendChild(metaBox);
    btn.appendChild(mark);
    li.appendChild(btn);
    frag.appendChild(li);
    rows.push({li:li,btn:btn,mark:mark});
  });
  el.list.appendChild(frag);
})();
function applyFilter(){
  const q=el.filter.value.trim().toLowerCase();
  const savedChecked=root.querySelector("input[name=\"zyx-show\"]:checked");
  const savedOnly=!!savedChecked&&savedChecked.value==="saved";
  let visible=0;
  rows.forEach((r,i)=>{
    const matchText=!q||titles[i].toLowerCase().indexOf(q)>=0||artists[i].toLowerCase().indexOf(q)>=0;
    const show=matchText&&(!savedOnly||favs.has(songs[i]));
    r.li.hidden=!show;
    if(show)visible++;
  });
  el.count.textContent=visible+(visible===1?" song":" songs");
  el["lib-empty"].replaceChildren();
  el["lib-empty"].hidden=visible!==0;
  if(visible===0){
    if(savedOnly&&!q){
      el["lib-empty"].appendChild(h("strong","","No saved songs yet"));
      el["lib-empty"].appendChild(document.createTextNode("Use the heart key while a local song plays. Saved on this device only."));
    }else{
      el["lib-empty"].appendChild(h("strong","","No matches"));
      el["lib-empty"].appendChild(document.createTextNode("Try a different song title or artist name."));
    }
  }
}
el.filter.addEventListener("input",applyFilter);
root.querySelectorAll("input[name=\"zyx-show\"]").forEach((r)=>r.addEventListener("change",applyFilter));
el.list.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-i]");
  if(!b)return;
  const i=Number(b.dataset.i);
  let p=order.indexOf(i);
  if(p<0){order.splice(pos+1,0,i);p=pos+1}
  pos=p;
  playLocalIdx(i);
  if(!desktop.matches)closeSheet();
});

/* ---------- queue ---------- */
let pendingFocus=null;
function playEntry(e){
  if(!e)return;
  if(e.kind==="local"){
    let p=order.indexOf(e.idx);
    if(p<0){order.splice(pos+1,0,e.idx);p=pos+1}
    pos=p;
    playLocalIdx(e.idx);
  }else if(e.kind==="online"&&e.item){
    quietOpen=true;
    try{playEmbed(e.item)}finally{quietOpen=false}
  }
}
function entryTitle(e){return e.kind==="local"?titles[e.idx]:((e.item&&e.item.title)||"Online track")}
function entryArtist(e){return e.kind==="local"?(artists[e.idx]||""):((e.item&&e.item.artist)||"")}
function validEntry(e){
  if(!e||typeof e!=="object")return false;
  if(e.kind==="local")return Number.isInteger(e.idx)&&e.idx>=0&&e.idx<songs.length;
  if(e.kind==="online"){const it=e.item;return !!it&&typeof it.embedUrl==="string"&&/^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{11}$/.test(it.embedUrl)}
  return false;
}
function renderUpNextIfOpen(){if(activeTab==="queue")renderQueue()}
function enqueue(e,front){
  if(roomBlocks("queue",{entry:e,front:!!front}))return true;
  if(!validEntry(e)){announce("This track cannot be queued.");return false}
  if(front)upNext.unshift(e);else upNext.push(e);
  announce((front?"Playing next: ":"Added to queue: ")+entryTitle(e));
  renderUpNextIfOpen();
  return true;
}
function renderUpNextBlock(){
  if(!upNext.length)return;
  const box=h("div","zyx-unext");
  const head=h("div","zyx-unext-head");
  head.appendChild(h("strong","","Playing next"));
  const clr=h("button","zyx-unext-clear","Clear");
  clr.type="button";
  clr.dataset.unact="clear";
  head.appendChild(clr);
  box.appendChild(head);
  const ul=h("ul","zyx-list");
  upNext.forEach((e,i)=>{
    const li=h("li","zyx-qrow");
    const b=h("button","zyx-row");
    b.type="button";
    b.dataset.unact="play";
    b.dataset.i=String(i);
    b.appendChild(h("span","zyx-row-n",String(i+1).padStart(2,"0")));
    const meta=h("span","zyx-row-meta");
    meta.appendChild(h("span","zyx-row-t",entryTitle(e)));
    meta.appendChild(h("span","zyx-row-sub",entryArtist(e)));
    b.appendChild(meta);
    li.appendChild(b);
    const tools=h("div","zyx-qtools");
    const rm=h("button","zyx-icon-btn");
    rm.type="button";
    rm.dataset.unact="remove";
    rm.dataset.i=String(i);
    rm.setAttribute("aria-label","Remove from Playing next: "+entryTitle(e));
    rm.appendChild(svgIcon("zi-close"));
    tools.appendChild(rm);
    li.appendChild(tools);
    ul.appendChild(li);
  });
  box.appendChild(ul);
  el.queue.appendChild(box);
}
el.queue.addEventListener("click",(ev)=>{
  const b=ev.target.closest("[data-unact]");
  if(!b)return;
  const act=b.dataset.unact,i=Number(b.dataset.i);
  if(act==="clear")upNext.length=0;
  else if(act==="remove")upNext.splice(i,1);
  else if(act==="play"){const e=upNext.splice(i,1)[0];renderQueue();playEntry(e);if(!desktop.matches)closeSheet();return}
  renderQueue();
});
function renderQueue(){
  el.queue.replaceChildren();
  renderUpNextBlock();
  if(!order.length){
    const s=h("div","zyx-state");
    s.appendChild(h("strong","","Queue is empty"));
    s.appendChild(document.createTextNode("Reset the order to bring every song back."));
    el.queue.appendChild(s);
    return;
  }
  const ul=h("ul","zyx-list");
  order.forEach((si,p)=>{
    const li=h("li","zyx-qrow");
    const b=h("button","zyx-row");
    b.type="button";
    b.dataset.act="jump";
    b.dataset.p=String(p);
    if(p===pos)b.setAttribute("aria-current","true");
    b.appendChild(h("span","zyx-row-n",String(p+1).padStart(2,"0")));
    const metaBox=h("span","zyx-row-meta");
    metaBox.appendChild(h("span","zyx-row-t",titles[si]));
    metaBox.appendChild(h("span","zyx-row-sub",artists[si]));
    b.appendChild(metaBox);
    li.appendChild(b);
    const tools=h("div","zyx-qtools");
    [["up","zi-up","Move up: ",p===0],["down","zi-down","Move down: ",p===order.length-1],["remove","zi-close","Remove from queue: ",p===pos]].forEach((spec)=>{
      const t=h("button","zyx-icon-btn");
      t.type="button";
      t.dataset.act=spec[0];
      t.dataset.p=String(p);
      t.disabled=spec[3];
      t.setAttribute("aria-label",spec[2]+titles[si]);
      t.appendChild(svgIcon(spec[1]));
      tools.appendChild(t);
    });
    li.appendChild(tools);
    ul.appendChild(li);
  });
  el.queue.appendChild(ul);
  if(pendingFocus){
    const pf=pendingFocus;
    pendingFocus=null;
    const target=el.queue.querySelector("[data-act=\""+pf.act+"\"][data-p=\""+pf.p+"\"]:not(:disabled)")||el.queue.querySelector("[data-act=\"jump\"][data-p=\""+pf.p+"\"]");
    if(target)target.focus();
  }
}
function swapOrder(a,b){
  const t=order[a];order[a]=order[b];order[b]=t;
  if(pos===a)pos=b;else if(pos===b)pos=a;
}
el.queue.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]");
  if(!b||b.disabled)return;
  const act=b.dataset.act,p=Number(b.dataset.p);
  if(act==="jump"){
    pos=p;
    playLocalIdx(order[p]);
    if(!desktop.matches)closeSheet();
  }else if(act==="up"&&p>0){
    swapOrder(p,p-1);
    pendingFocus={act:"up",p:p-1};
    renderQueue();
    announce("Moved to position "+p);
  }else if(act==="down"&&p<order.length-1){
    swapOrder(p,p+1);
    pendingFocus={act:"down",p:p+1};
    renderQueue();
    announce("Moved to position "+(p+2));
  }else if(act==="remove"&&p!==pos){
    order.splice(p,1);
    if(p<pos)pos--;
    pendingFocus={act:"remove",p:Math.min(p,order.length-1)};
    renderQueue();
    announce("Removed from queue");
  }
});
el["queue-reset"].addEventListener("click",()=>{
  const curIdx=order[pos];
  order=songs.map((_,i)=>i);
  pos=Math.max(0,order.indexOf(curIdx));
  shuffleOn=false;
  updateShuffleUI();
  savePrefs();
  renderQueue();
  announce("Queue order reset");
});

/* ---------- sheet and tabs ---------- */
const tabs=Array.prototype.slice.call(root.querySelectorAll("[data-zyx-tab]"));
const navBtns=Array.prototype.slice.call(root.querySelectorAll("[data-zyx-open]"));
function selectTab(name){
  activeTab=name;
  tabs.forEach((t)=>{
    const on=t.dataset.zyxTab===name;
    t.setAttribute("aria-selected",String(on));
    t.tabIndex=on?0:-1;
  });
  ["library","discover","queue"].forEach((n)=>{$("zyx-pane-"+n).hidden=n!==name});
  if(name==="queue")renderQueue();
}
function openSheet(name,opener){
  selectTab(name);
  root.classList.add("is-sheet-open");
  lastOpener=opener||null;
  navBtns.forEach((b)=>b.setAttribute("aria-expanded",String(b.dataset.zyxOpen===name)));
  requestAnimationFrame(()=>{const t=tabs.filter((x)=>x.dataset.zyxTab===name)[0];if(t)t.focus()});
}
function closeSheet(){
  if(!root.classList.contains("is-sheet-open"))return;
  root.classList.remove("is-sheet-open");
  navBtns.forEach((b)=>b.setAttribute("aria-expanded","false"));
  if(lastOpener&&lastOpener.focus)lastOpener.focus();
}
navBtns.forEach((b)=>b.addEventListener("click",()=>openSheet(b.dataset.zyxOpen,b)));
tabs.forEach((t)=>t.addEventListener("click",()=>selectTab(t.dataset.zyxTab)));
root.querySelector(".zyx-tabs").addEventListener("keydown",(e)=>{
  const k=e.key;
  if(k!=="ArrowRight"&&k!=="ArrowLeft"&&k!=="Home"&&k!=="End")return;
  e.preventDefault();
  let i=tabs.findIndex((t)=>t.getAttribute("aria-selected")==="true");
  if(k==="ArrowRight")i=(i+1)%tabs.length;
  else if(k==="ArrowLeft")i=(i-1+tabs.length)%tabs.length;
  else if(k==="Home")i=0;
  else i=tabs.length-1;
  selectTab(tabs[i].dataset.zyxTab);
  tabs[i].focus();
});
el.close.addEventListener("click",closeSheet);
el.scrim.addEventListener("click",closeSheet);
document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&!desktop.matches)closeSheet()});

/* ---------- provider health ---------- */
function setLed(state,text){
  el.led.dataset.state=state;
  el["status-text"].textContent=text;
}
async function loadHealth(){
  const ctl=new AbortController();
  const t=setTimeout(()=>ctl.abort(),8000);
  try{
    const r=await fetch("/api/music/health",{signal:ctl.signal,cache:"no-store",headers:{Accept:"application/json"}});
    if(!r.ok)throw new Error("health_"+r.status);
    const d=await r.json();
    const p=(d&&d.providers)||{};
    const jam=!!(p.jamendo&&p.jamendo.configured&&p.jamendo.enabled);
    const yt=!!(p.youtube&&p.youtube.configured);
    onlineAvailable=jam||yt;
    setLed(onlineAvailable?"ok":"off",onlineAvailable?"Online sources ready":"Local collection only");
  }catch(e){
    onlineAvailable=null;
    setLed("off","Online status unknown");
  }finally{clearTimeout(t)}
  if(!searchActive)showIdle("idle");
}

/* ---------- online search ---------- */
const providerLabel={jamendo:"Independent",youtube:"Mainstream"};
let abortCtl=null,lastItems=[],debounceT=0,searchActive=false;
function clearResults(){el.results.replaceChildren();lastItems=[]}
function stateBox(title,body,opts){
  opts=opts||{};
  const d=h("div","zyx-state"+(opts.error?" zyx-state--err":""));
  d.appendChild(h("strong","",title));
  if(body)d.appendChild(document.createTextNode(body));
  (opts.lines||[]).forEach((l)=>d.appendChild(h("p","zyx-notice",l)));
  if(opts.retry){
    const b=h("button","zyx-btn","Try again");
    b.type="button";
    b.dataset.act="retry";
    d.appendChild(b);
  }
  return d;
}
function showIdle(kind){
  searchActive=false;
  clearResults();
  if(kind==="short"){
    el.results.appendChild(stateBox("Keep typing","Searches need at least 2 characters."));
  }else if(onlineAvailable===false){
    el.results.appendChild(stateBox("Online sources are not set up","No online provider is configured on this server yet, so only the local library is available. Your local songs work normally."));
  }else{
    el.results.appendChild(stateBox("Search online sources","Results either play in an approved player or open on the provider\u2019s own site."));
  }
}
function provider(){const r=root.querySelector("input[name=\"zyx-provider\"]:checked");return r?r.value:"all"}
function providerLines(data){
  const out=[];
  if(data&&Array.isArray(data.providers)){
    data.providers.forEach((p)=>{
      if(p&&p.status!=="ok")out.push((providerLabel[p.provider]||String(p.provider))+": "+(p.message||p.status));
    });
  }
  return out;
}
function link(href,label,accent){
  const a=h("a","zyx-btn"+(accent?" zyx-btn--accent":""),label);
  a.href=href;
  a.target="_blank";
  a.rel="noopener noreferrer";
  a.appendChild(svgIcon("zi-external"));
  return a;
}
function card(item,i){
  const wrap=h("div","zyx-result");
  if(cur&&cur.item===item)wrap.classList.add("is-selected");
  if(isHttps(item.artworkUrl)){
    const img=document.createElement("img");
    img.className="zyx-result-art";
    img.alt="";
    img.loading="lazy";
    img.referrerPolicy="no-referrer";
    img.addEventListener("error",()=>{const ph=h("div","zyx-result-art");img.replaceWith(ph)});
    img.src=item.artworkUrl;
    wrap.appendChild(img);
  }else{wrap.appendChild(h("div","zyx-result-art"))}
  const body=h("div");
  body.appendChild(h("h3","zyx-result-title",item.title));
  const bits=[item.artist,item.providerAttribution||item.provider];
  if(Number.isFinite(item.durationSeconds)&&item.durationSeconds>0)bits.push(fmt(item.durationSeconds));
  body.appendChild(h("p","zyx-result-by",bits.filter(Boolean).join(" \u00b7 ")));
  wrap.appendChild(body);
  const actions=h("div","zyx-result-actions");
  if(item.playbackType==="direct-stream"&&isHttps(item.streamUrl)){
    const b=h("button","zyx-btn zyx-btn--accent","Play");
    b.type="button";b.dataset.act="play";b.dataset.idx=String(i);
    actions.appendChild(b);
  }
  if(item.playbackType==="youtube-embed"&&typeof item.embedUrl==="string"&&item.embedUrl.indexOf("https://www.youtube.com/embed/")===0){
    const b=h("button","zyx-btn zyx-btn--accent","Play in YouTube");
    b.type="button";b.dataset.act="embed";b.dataset.idx=String(i);
    actions.appendChild(b);
  }
  if(isHttps(item.externalUrl)){
    const label=item.playbackType==="external-link"?"Open on "+(item.providerAttribution||"provider"):"Open";
    actions.appendChild(link(item.externalUrl,label,item.playbackType==="external-link"));
  }
  if(isHttps(item.licenseUrl))actions.appendChild(link(item.licenseUrl,"Licence",false));
  wrap.appendChild(actions);
  return wrap;
}
function renderSearch(res,data){
  clearResults();
  const lines=providerLines(data);
  const s=res.status;
  if(s===400){
    el.results.appendChild(stateBox("Check your search",(data&&data.error&&data.error.message)||"The search could not be understood."));
    return;
  }
  if(s===429){
    const ra=Number(res.headers.get("Retry-After"));
    el.results.appendChild(stateBox("Too many searches",ra>0?"Wait about "+ra+" seconds, then try again.":"Wait a moment, then try again.",{retry:true}));
    return;
  }
  if(s===503){
    el.results.appendChild(stateBox("Online sources unavailable","No online provider is available on this server right now. Your local library still works.",{lines:lines}));
    return;
  }
  if(!res.ok||!data||!Array.isArray(data.items)){
    el.results.appendChild(stateBox("Search failed","The music providers did not respond correctly.",{error:true,retry:true,lines:lines}));
    return;
  }
  if(lines.length)el.results.appendChild(stateBox("Some sources are unavailable","",{lines:lines}));
  if(!data.items.length){
    el.results.appendChild(stateBox("No results","Nothing matched \u201c"+(data.query||"")+"\u201d."));
    return;
  }
  lastItems=data.items;
  const frag=document.createDocumentFragment();
  data.items.forEach((it,i)=>frag.appendChild(card(it,i)));
  el.results.appendChild(frag);
  if(data.notice)el.results.appendChild(h("p","zyx-notice",data.notice));
}
async function runSearch(){
  clearTimeout(debounceT);
  const q=el.q.value.trim().replace(/\s+/g," ");
  if(abortCtl){abortCtl.abort();abortCtl=null}
  el["disc-status"].textContent="";
  el.results.removeAttribute("aria-busy");
  if(q.length<2){showIdle(q.length?"short":"idle");return}
  const ctl=new AbortController();
  abortCtl=ctl;
  searchActive=true;
  el["disc-status"].textContent="Searching\u2026";
  el.results.setAttribute("aria-busy","true");
  let res=null,data=null;
  try{
    res=await fetch("/api/music/search?q="+encodeURIComponent(q)+"&provider="+encodeURIComponent(provider()),{signal:ctl.signal,cache:"no-store",headers:{Accept:"application/json"}});
    try{data=await res.json()}catch(e){data=null}
  }catch(err){
    if(ctl!==abortCtl)return;
    el["disc-status"].textContent="";
    el.results.removeAttribute("aria-busy");
    clearResults();
    el.results.appendChild(stateBox("Could not reach the server","Check your connection and try again.",{error:true,retry:true}));
    return;
  }
  if(ctl!==abortCtl)return;
  el["disc-status"].textContent="";
  el.results.removeAttribute("aria-busy");
  renderSearch(res,data);
}
el.form.addEventListener("submit",(e)=>{e.preventDefault();runSearch()});
el.form.addEventListener("change",(e)=>{if(e.target&&e.target.name==="zyx-provider"&&el.q.value.trim().length>=2)runSearch()});
el.q.addEventListener("input",()=>{clearTimeout(debounceT);debounceT=setTimeout(runSearch,450)});
el.results.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]");
  if(!b)return;
  if(b.dataset.act==="retry"){runSearch();return}
  const item=lastItems[Number(b.dataset.idx)];
  if(!item)return;
  if(b.dataset.act==="play")playStream(item);
  else if(b.dataset.act==="embed")playEmbed(item);
});

/* ---------- start-up ---------- */
let start=Math.floor(Math.random()*songs.length);
try{
  const last=Number(localStorage.getItem("zyf-last-song"));
  if(songs.length>1&&start===last)start=(start+1)%songs.length;
}catch(e){}
pos=start;
loadLocal(start);
if(prefs.shuffle)setShuffle(true,false);else updateShuffleUI();
el.shuffle.setAttribute("aria-label","Shuffle");
updateRepeatUI();
syncVolume();
selectTab("library");
applyFilter();
showIdle("idle");
loadHealth();

window.ZynoxifyMusic = {
  getSongs: function () {
    return songs.map(function (file, index) {
      return { index: index, file: file, title: titles[index], artist: artists[index] };
    });
  },
  getState: function () {
    let currentTime = audio.currentTime || 0;
    let duration = audio.duration || 0;
    if (cur && cur.kind === "embed" && ytPlayer) {
      try { currentTime = ytPlayer.getCurrentTime() || 0; duration = ytPlayer.getDuration() || 0; } catch (e) {}
    }
    return {
      title: el.title.textContent || "Choose a song",
      artist: el.artist.textContent || "",
      source: el.source.textContent || "",
      playing: root.classList.contains("is-playing"),
      kind: cur ? cur.kind : null,
      idx: cur && cur.kind === "local" ? cur.idx : null,
      artUrl: cur && cur.item ? cur.item.artworkUrl : null,
      currentTime: currentTime,
      duration: duration
    };
  },
  playLocal: function (index) {
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= songs.length) return;
    let p = order.indexOf(idx);
    if (p < 0) { order.splice(pos + 1, 0, idx); p = pos + 1; }
    pos = p;
    playLocalIdx(idx);
  },
  togglePlay: function () { togglePlay(); },
  next: function () { advance(1, false); },
  shufflePlay: function () {
    if (!shuffleOn) setShuffle(true, false);
    else {
      const anchor = order[pos];
      const rest = order.filter(function (i) { return i !== anchor; });
      shuffleArr(rest);
      order = [anchor].concat(rest);
      pos = 0;
      savePrefs();
      if (activeTab === "queue") renderQueue();
    }
    pos = Math.floor(Math.random() * order.length);
    playLocalIdx(order[pos]);
  },
  playOnline: function (item) {
    if (!item || typeof item !== "object") return;
    root.classList.add("is-player-open");
    if (item.playbackType === "youtube-embed") {
      playEmbed(item);
    } else if (item.playbackType === "direct-stream") {
      playStream(item);
    } else if (item.playbackType === "external-link" &&
               typeof item.externalUrl === "string" &&
               /^https:\/\//i.test(item.externalUrl)) {
      window.open(item.externalUrl, "_blank", "noopener,noreferrer");
    } else {
      announce("This online result has no supported playback action.");
    }
  },
  openSearch: function (query) {
    openSheet("discover", null);
    if (typeof query === "string" && query.trim()) {
      el.q.value = query.trim();
      el.q.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.q.value = "";
      showIdle("idle");
    }
  },
  openLibrary: function (savedOnly) {
    openSheet("library", null);
    const target = root.querySelector('input[name="zyx-show"][value="' + (savedOnly ? "saved" : "all") + '"]');
    if (target) {
      target.checked = true;
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  },
  openQueue: function () { openSheet("queue", null); },
  closeSheet: function () { closeSheet(); },
  refreshLike: function () { syncFav(); },
  playNext: function (e) { return enqueue(e, true); },
  addToQueue: function (e) { return enqueue(e, false); },
  playEntries: function (list) {
    const ok = (Array.isArray(list) ? list : []).filter(validEntry);
    if (!ok.length) return false;
    if (roomBlocks("playlist", { entries: ok })) return true;
    upNext.length = 0;
    ok.slice(1).forEach(function (x) { upNext.push(x); });
    playEntry(ok[0]);
    if (ok[0].kind === "online") root.classList.add("is-player-open");
    renderUpNextIfOpen();
    return true;
  },
  isFav: function (idx) { return Number.isInteger(idx) && idx >= 0 && idx < songs.length && favs.has(songs[idx]); },
  toggleFav: function (idx) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= songs.length) return false;
    const f = songs[idx];
    if (favs.has(f)) favs.delete(f); else favs.add(f);
    saveFavs(); syncFav(); applyFilter();
    return favs.has(f);
  },
  getCurrentEntry: function () {
    if (!cur) return null;
    if (cur.kind === "local") return { kind: "local", idx: cur.idx };
    if (cur.kind === "embed" && cur.item) return { kind: "online", item: cur.item };
    return null;
  },
  getSearchItems: function () { return typeof lastItems !== "undefined" ? lastItems.slice() : []; },
  roomPlay: function (e) { roomApplying = true; try { audio.playbackRate = 1; playEntry(e); } finally { roomApplying = false; } },
  roomSeek: function (p) {
    if (!cur) return;
    try { if (cur.kind === "embed") { if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(p, true); } else { audio.currentTime = p; } } catch (e) {}
  },
  roomPause: function () {
    if (!cur) return;
    try { if (cur.kind === "embed") { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } else { audio.pause(); } } catch (e) {}
  },
  roomResume: function () {
    if (!cur) return;
    try { if (cur.kind === "embed") { if (ytPlayer && ytPlayer.playVideo) ytPlayer.playVideo(); } else { tryPlay(); } } catch (e) {}
  },
  roomInfo: function () {
    const info = { key: "", kind: null, playing: root.classList.contains("is-playing"), buffering: sourceSuffix === "Buffering", ready: false, loaded: false, needsPrime: false, priming: false, ended: false, time: 0, rate: audio.playbackRate };
    if (!cur) return info;
    info.kind = cur.kind;
    if (cur.kind === "local") {
      info.key = "local:" + songs[cur.idx];
      const blobbed = roomBlob.key === songs[cur.idx];
      info.ready = audio.readyState >= 2;
      info.loaded = blobbed ? (roomBlob.ready && audio.readyState >= 2) : audio.readyState >= 3;
      info.ended = !!audio.ended;
      info.time = audio.currentTime || 0;
    } else if (cur.kind === "embed" && cur.item) {
      const m = typeof cur.item.embedUrl === "string" && cur.item.embedUrl.match(/\/embed\/([A-Za-z0-9_-]{11})$/);
      info.key = m ? "yt:" + m[1] : "";
      try {
        if (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getCurrentTime) {
          const st = ytPlayer.getPlayerState();
          info.ready = true;
          info.ended = st === 0;
          info.time = ytPlayer.getCurrentTime() || 0;
          info.needsPrime = roomPrimeStage === 0;
          info.priming = roomPrimeStage === 1;
          info.loaded = roomPrimeStage === 2;
        }
      } catch (e) {}
    }
    return info;
  },
  roomLoad: function (e) {
    roomApplying = true;
    try {
      audio.playbackRate = 1;
      if (e.kind === "local" && Number.isInteger(e.idx) && songs[e.idx] !== undefined) {
        loadLocal(e.idx);
        const idx = e.idx, key = songs[idx], src = audio.src;
        roomBlob.key = key; roomBlob.ready = false;
        fetch(src).then(function (r) { if (!r.ok) throw new Error("load"); return r.blob(); }).then(function (b) {
          if (roomBlob.key !== key || !cur || cur.kind !== "local" || cur.idx !== idx) return;
          if (roomBlob.url) URL.revokeObjectURL(roomBlob.url);
          roomBlob.url = URL.createObjectURL(b);
          audio.src = roomBlob.url;
          roomBlob.ready = true;
        }).catch(function () { if (roomBlob.key === key) roomBlob.ready = true; });
      } else if (e.kind === "online" && e.item) {
        roomHold = true; quietOpen = true; roomPrimeStage = 0;
        try { playEmbed(e.item); } finally { roomHold = false; quietOpen = false; }
      }
    } finally { roomApplying = false; }
  },
  roomPrime: function () {
    if (!cur || cur.kind !== "embed" || !ytPlayer) return;
    roomPrimeStage = 1;
    try { ytPlayer.mute(); ytPlayer.playVideo(); } catch (e) {}
  },
  roomUnprime: function () {
    if (!cur || cur.kind !== "embed" || !ytPlayer) return;
    roomPrimeStage = 2;
    try { ytPlayer.pauseVideo(); ytPlayer.seekTo(0, true); applyEmbedVolume(); } catch (e) {}
  },
  roomRate: function (r) { try { audio.playbackRate = r; } catch (e) {} }
};

})();
