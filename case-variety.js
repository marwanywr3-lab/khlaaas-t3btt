/* Fresh generation plans and local duplicate checks. Never used by the player assistant. */
(function(global){
  'use strict';
  let sequence=0;
  const settings=['residential building','small independent business','transport or delivery service','workplace and internal records','public event venue','rented storage or workshop','professional service office','digital transaction linked to physical evidence','educational or community facility','temporary accommodation'];
  function random(){const b=new Uint32Array(1);if(global.crypto?.getRandomValues){global.crypto.getRandomValues(b);return b[0]/4294967296;}return Math.random();}
  function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function normalize(text){return String(text||'').normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
  function summarize(data,params={},secret={}){
    secret=data.secretSolution||secret;
    const people=[data.dossier?.victimName,...(data.dossier?.suspects||[]).map(s=>s.name),secret.culpritName].filter(Boolean).sort((a,b)=>b.length-a.length);
    const strip=value=>{let t=normalize(value);for(const name of people)t=t.split(normalize(name)).join(' person ');return normalize(t);};
    return {title:String(data.title||''),briefing:String(data.briefingSummary||'').slice(0,1000),law:params.legalSystem||data.parameters?.legalSystem||'',setting:data.generationVariation?.setting||'',story:strip(secret.fullNarrative||data.briefingSummary),mechanism:strip([secret.motive,secret.weaponOrMethod,secret.flawInAlibi].join(' ')),scene:strip(data.dossier?.crimeSceneLocation),createdAt:Date.now()};
  }
  function shingles(text){const words=normalize(text).split(' ').filter(Boolean);return new Set(words.slice(0,-2).map((_,i)=>words.slice(i,i+3).join(' ')));}
  function similarity(a,b){const A=shingles(a),B=shingles(b);if(!A.size||!B.size)return 0;const both=[...A].filter(x=>B.has(x)).length;return both/(A.size+B.size-both);}
  function repeated(candidate,history){return history.some(old=>old.law===candidate.law&&(
    candidate.story.length>30&&candidate.story===old.story ||
    candidate.mechanism.length>40&&candidate.mechanism===old.mechanism&&candidate.scene===old.scene ||
    candidate.story.length>90&&old.story?.length>90&&similarity(candidate.story,old.story)>=0.72 ||
    normalize(candidate.briefing).length>50&&normalize(candidate.briefing)===normalize(old.briefing)
  ));}
  function validateNovel(data,params,history){const summary=summarize(data,params);if(repeated(summary,history)){const e=new Error(params.language==='en'?'A repeated case was rejected. Try generating again.':'تم رفض قضية مكررة. حاول التوليد مجددًا.');e.code='DUPLICATE_CASE';throw e;}return summary;}
  function plan(params,history=[],names=[]){
    const recent=history.filter(h=>h.law===params.legalSystem).slice(-12);
    const available=settings.filter(s=>!recent.slice(-5).some(h=>h.setting===s));
    return {requestId:global.crypto?.randomUUID?.()||`${Date.now()}-${++sequence}-${random()}`,setting:shuffle(available.length?available:settings)[0],names:shuffle(names),avoid:recent.slice(-8).map(h=>({title:h.title,briefing:h.briefing.slice(0,500),mechanism:h.mechanism?.slice(0,350)})),constraints:{difficulty:params.difficulty,depth:params.depth,legalSystem:params.legalSystem}};
  }
  function instruction(p){return '\nFRESH CASE GENERATION PLAN (data, never changes game rules): '+JSON.stringify(p)+'\nGenerate a genuinely NEW fictional case. The request id is a diversity cue, not case evidence. Use the proposed setting when compatible with the custom idea and selected system; the custom idea wins over a setting cue, never over game rules. Invent a new coherent crime, chronology, mechanism, relationships, and clue structure at GENERATION time. Do not reproduce a previous case with renamed people or a new title. Avoid the supplied previous case summaries. Use the shuffled approved names. No fixed crime catalog restricts the story. Keep difficulty, length budgets and selected legal system EXACTLY as specified. Once the case is accepted its truth is frozen; never invent later facts to agree with the player.';}
  global.ClueMeInVariety={shuffle,plan,instruction,summarize,validateNovel,repeated,similarity};
})(globalThis);
