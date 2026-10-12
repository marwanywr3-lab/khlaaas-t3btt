const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const base=__dirname,html=fs.readFileSync(path.join(base,'index.html'),'utf8'),memory=new Map();
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k),key:i=>[...memory.keys()][i],get length(){return memory.size;}};
const document={readyState:'loading',addEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,documentElement:{lang:'ar',dir:'rtl',dataset:{},setAttribute:()=>{}},body:{}};
const ctx={document,localStorage,navigator:{userAgent:'',maxTouchPoints:0},location:{protocol:'file:',hostname:''},setTimeout,clearTimeout,console,URL,AbortController,TextEncoder,atob:s=>Buffer.from(s,'base64').toString(),btoa:s=>Buffer.from(s).toString('base64'),addEventListener:()=>{},matchMedia:()=>({matches:false,addEventListener:()=>{}})};ctx.window=ctx;vm.createContext(ctx);
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 if(m[1].includes('src='))vm.runInContext(fs.readFileSync(path.join(base,m[1].match(/src="([^"]+)"/)[1]),'utf8'),ctx);
 else if(m[2].includes('Shared Arabic')||m[2].includes('Local drafts')||m[2].includes('Shared case budgets')||m[2].includes('Safe Storage'))vm.runInContext(m[2],ctx);
}
(async()=>{
await vm.runInContext(`(async()=>{
 render=()=>{};
 const check=(v,msg)=>{if(!v)throw new Error(msg)};
 const secret={culpritName:'سامي',motive:'SECRET-MOTIVE',weaponOrMethod:'SECRET-METHOD',keyEvidence:'SECRET-EVIDENCE',flawInAlibi:'SECRET-ALIBI',fullNarrative:'SECRET-NARRATIVE',investigationPlan:{clues:[{id:'clue',name:'Public clue',description:'Public description',discoveryAction:'inspect'}],redHerrings:[],legalChallenges:[]}};
 const make=id=>({id,title:'Case '+id,briefingSummary:'Public briefing',parameters:{legalSystem:'السعودي',depth:'قصير',difficulty:'سهل'},dossier:{victimName:'Victim',crimeSceneLocation:'Room',suspects:[{id:'a',name:'سامي',role:'Friend',alibi:'Home'},{id:'b',name:'ليلى',role:'Witness',alibi:'Work'}]},evidenceList:[],investigationChat:[{id:'init-1',sender:'game_master',text:'Initial briefing',timestamp:'10:00'}],assistantChat:[],encryptedSecretSolution:btoa(encodeURIComponent(JSON.stringify(secret))),isSolved:false});
 const a=make('one'),b=make('two');state.cases=[a,b];state.activeCaseId=a.id;
 const rooms=['office','interrogation','detective','legal'];
 for(const room of rooms){CaseRooms.openRoom(room);check(a.sceneRoom===room,'room selection');const markup=CaseRooms.render(a);check(markup.includes('room-main-action'),'hotspot missing');check(markup.includes('room-navigation'),'navigation missing');check(!markup.includes('SECRET-'),'hidden solution in room');}
 check(ClueMeInFeatures.getPreferences().advisorMode==='legal','legal room mode');
 CaseRooms.openRoom('detective');check(ClueMeInFeatures.getPreferences().advisorMode==='detective','detective room mode');
 CaseRooms.openRoom('interrogation');CaseRooms.openPanel('suspects');check(CaseRooms.render(a).includes('ليلى'),'suspect list');CaseRooms.chooseSuspect(0);
 check(CaseRooms.interviewSuspectId()==='a','selected suspect context');
 let captured;callGemini=async(contents,prompt)=>{captured={contents,prompt};return 'Interview reply';};
 await sendInvestigationAction('Where were you?',{suspectId:CaseRooms.interviewSuspectId()});
 check(captured.prompt.includes('Current interview'),'missing named interview instructions');check(captured.contents.at(-1).parts[0].text.includes('سامي'),'missing interview name');
 check(a.investigationChat.at(-1).suspectId==='a','reply attribution');
 CaseRooms.chooseSuspect(1);check(CaseRooms.investigationMessages(a).length===1,'other suspect transcript leaked');
 CaseRooms.openPanel('log');check(CaseRooms.interviewSuspectId()===undefined,'log routes to suspect');check(CaseRooms.investigationMessages(a).length===3,'full log missing');
 CaseRooms.openRoom('office');CaseRooms.openPanel('book');check(CaseRooms.render(a).includes('dossier-closed.png'),'closed cover');CaseRooms.openBook();
 for(const tab of ['overview','evidence','suspects','notes','record']){CaseRooms.setBookTab(tab);const markup=CaseRooms.render(a);check(markup.includes('case-book'),'book missing');check(!markup.includes('SECRET-'),'secret leaked in dossier');}
 updateNotepad('Notes for case one');check(loadNotepad(a.id)==='Notes for case one','notes persistence');
 state.isIndictmentOpen=true;check(!CaseRooms.render(a).includes('room-overlay'),'room overlay covers accusation');state.isIndictmentOpen=false;
 state.activeCaseId=b.id;CaseRooms.sync(b);check(!CaseRooms.render(b).includes('room-overlay'),'cross-case panel');check(loadNotepad(b.id)!=='Notes for case one','cross-case notes');
 state.activeCaseId=a.id;CaseRooms.sync(a);check(a.sceneRoom==='office','case room persistence');
 const stored=JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES_LIST));check(stored[0].sceneRoom==='office','room not saved');
 ClueMeInI18n.setLanguage('en');CaseRooms.openRoom('legal');check(CaseRooms.render(a).includes('Legal advisor'),'English scene');
 a.dossier.suspects.push({name:'Legacy suspect',role:'Other'});CaseRooms.chooseSuspect(2);check(CaseRooms.interviewSuspectId().startsWith('legacy-scene-'),'legacy suspect migration');
 a.title='<img src=x onerror=alert(1)>';check(!CaseRooms.render(a).includes('<img src=x'),'unsafe user title');
})()`,ctx);
const assets=['interrogation-desktop.jpg','interrogation-mobile.jpg','advisor-desktop.jpg','advisor-mobile.jpg','investigator-desktop.jpg','investigator-mobile.jpg','dossier-closed.png','dossier-open.png'];for(const file of assets)assert(fs.statSync(path.join(base,'assets/rooms',file)).size>0);
const sw=fs.readFileSync(path.join(base,'service-worker.js'),'utf8');for(const f of [...assets.map(x=>'assets/rooms/'+x),'case-rooms.js','case-rooms.css'])assert(sw.includes(f),'offline asset missing '+f);
assert(!html.includes('onboarding.js'));assert(html.includes('case-rooms.js'));
console.log('PASS: four scene routes, separate advisor modes, per-suspect interviews, full case log, safe book tabs, private solution exclusion, per-case notes, modal precedence, persistence, legacy suspect IDs, Arabic/English, all eight images and offline shell. Mock API, no live key.');
})().catch(e=>{console.error(e);process.exitCode=1});
