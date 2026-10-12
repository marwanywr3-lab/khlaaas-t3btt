const fs=require('fs'),vm=require('vm'),assert=require('assert');
const memory=new Map();let blocked=false;
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k),key:i=>[...memory.keys()][i],get length(){return memory.size;}};
const document={readyState:'loading',addEventListener:()=>{},querySelectorAll:()=>[],getElementById:()=>null,documentElement:{lang:'ar',dir:'rtl',dataset:{},setAttribute:()=>{}},body:{}};
const ctx={document,localStorage,navigator:{userAgent:'',maxTouchPoints:0},location:{protocol:'file:',hostname:''},setTimeout,clearTimeout,console,URL,AbortController,TextEncoder,atob:s=>Buffer.from(s,'base64').toString(),btoa:s=>Buffer.from(s).toString('base64'),addEventListener:()=>{},matchMedia:()=>({matches:false,addEventListener:()=>{}})};ctx.window=ctx;vm.createContext(ctx);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 if(m[1].includes('src=')){const name=m[1].match(/src="([^"]+)"/)[1];vm.runInContext(fs.readFileSync(__dirname+'/'+name,'utf8'),ctx);}
 else if(m[2].includes('Shared Arabic')||m[2].includes('Local drafts')||m[2].includes('Shared case budgets')||m[2].includes('Safe Storage'))vm.runInContext(m[2],ctx);
}

(async()=>{
await vm.runInContext(`(async()=>{
 render=()=>{};
 const check=(v,s)=>{if(!v)throw Error(s);};
 const params={legalSystem:'الأمريكي',depth:'قصير',difficulty:'صعب',language:'ar'};
 const names=ClueMeInReferences.names.filter(n=>n.law===params.legalSystem).map(n=>n.name);
 const profile=ClueMeInGameRules.profile(params.depth);
 function fixture(story){
 const suspects=names.slice(1,1+profile.suspects[0]).map((name,i)=>({id:'s-'+i,name,role:'موظف',alibi:'ادعاء'}));
 const clues=Array.from({length:profile.clues},(_,i)=>({id:'ev-'+i,name:'دليل '+i,type:'سجل',description:'سجل ثابت '+i,discoveryAction:'فحص السجل'}));
 return {title:story.slice(0,20),briefingSummary:story,dossier:{victimName:names[0],victimAge:'30',victimOccupation:'موظف',crimeSceneLocation:'مكتب',timeOfIncident:'10',suspects,initialEvidence:clues.slice(0,profile.initialClues)},secretSolution:{culpritName:suspects[0].name,motive:'دافع '+story,weaponOrMethod:'طريقة '+story,flawInAlibi:'تناقض '+story,keyEvidence:'سجل',fullNarrative:story,investigationPlan:{clues,redHerrings:Array.from({length:profile.redHerrings[0]},()=>({description:'مضلل',resolution:'سبب'})),legalChallenges:[{suspectId:suspects[0].id,trigger:'استجواب',invokedRight:'counsel',lawfulAlternative:'سجل مستقل'}]}}};
 }
 const A=fixture('في مكتب النقل عدل موظف سجل الشحن بعد انتهاء الدوام ثم نقل الصندوق من المخزن وأخفى أثره في كشوفات التسليم السابقة.'+' '+names[1]);
 const B=fixture('شهد فندق المدينة حريقا متعمدا لإتلاف عقد التأمين واستعمل المشتبه مادة من ورشة الصيانة بينما كشف توقيت إنذار الطوارئ تناقض روايته.');
 const history=[ClueMeInVariety.summarize(A,params)];
 check(ClueMeInVariety.repeated(history[0],history),'identical case');
 const renamed=JSON.parse(JSON.stringify(A).split(names[1]).join(names[8]));
 check(ClueMeInVariety.repeated(ClueMeInVariety.summarize(renamed,params),history),'renamed repeat');
 ClueMeInVariety.validateNovel(B,params,history);
 const p1=ClueMeInVariety.plan(params,history,names),p2=ClueMeInVariety.plan(params,history,names);
 check(p1.requestId!==p2.requestId,'fresh nonce');check(JSON.stringify(p1.constraints)===JSON.stringify(p2.constraints),'constraints changed');
 check([...p1.names].sort().join('|')===[...names].sort().join('|'),'name pool');
 state.cases=[];state.archivedCases=[{draft:A,parameters:params}];state.draft=null;
 state.legalSystem=params.legalSystem;state.depth=params.depth;state.difficulty=params.difficulty;state.customSeed='';
 const archiveBefore=JSON.stringify(state.archivedCases);let calls=0,requests=[];
 callGemini=async(contents,prompt,options)=>{calls++;requests.push(JSON.stringify(contents));check(prompt.includes(params.difficulty)&&prompt.includes(params.depth)&&prompt.includes(params.legalSystem),'prompt constraints');check(!prompt.includes('referenceCaseTypeId'),'catalog schema remains');return JSON.stringify(calls===1?A:B);};
 await generateCaseDraft();check(calls===2,'duplicate retry');check(state.draft?.title===B.title,'fresh candidate not selected');check(requests[0]!==requests[1],'retry identical prompt');check(JSON.stringify(state.archivedCases)===archiveBefore,'archive modified');
 check(generationHistory().some(h=>h.story===history[0].story),'archive omitted');check(JSON.parse(safeStore.getItem(varietyHistoryKey)).length===1,'history not persisted');
 state.draft=null;calls=0;callGemini=async()=>{calls++;return JSON.stringify(B);};await generateCaseDraft();check(calls===3&&!state.draft&&state.newCaseError.includes('مكررة'),'exhaustion must reject');
 state.draft=null;calls=0;callGemini=async()=>{calls++;throw Error('network failed');};await generateCaseDraft();check(calls===1&&!state.draft&&state.newCaseError==='network failed','network failure invented case');
 console.log('PASS: new request ids, unchanged constraints/name pool, exact and renamed duplicate rejection, distinct case acceptance, real generation retries, persisted history/archive, retry exhaustion and network failure. Mock API only.');
})()`,ctx);
})().catch(e=>{console.error(e);process.exit(1)});
