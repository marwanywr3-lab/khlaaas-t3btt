const fs=require('fs'),vm=require('vm'),assert=require('assert');const ctx={};vm.createContext(ctx);
for(const f of ['reference-data.js','system-prompts.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),ctx);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const rules=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('Shared case budgets'))[1];vm.runInContext(rules,ctx);
let count=0;
for(const law of ['السعودي','الأمريكي'])for(const depth of ['قصير','متوسط','طويل']){
 const params={legalSystem:law,depth,difficulty:'متوسط'},p=ctx.ClueMeInGameRules.profile(depth),names=ctx.ClueMeInReferences.names.filter(n=>n.law===law);
 const suspects=names.slice(1,1+p.suspects[0]).map((n,i)=>({id:'s-'+i,name:n.name,role:'موظف',alibi:'ادعاء'}));
 const clues=Array.from({length:p.clues},(_,i)=>({id:'ev-'+i,name:'اسم ثابت '+i,description:'الوصف المعتمد '+i,discoveryAction:'فحص السجل'}));
 const initialEvidence=clues.slice(0,p.initialClues).map(e=>({id:e.id,name:'صياغة ثانية للاسم',description:'وصف مختصر بصياغة مختلفة',type:'سجل'}));
 const draft={title:'Case',briefingSummary:'بلاغ',dossier:{victimName:names[0].name,victimAge:'30',victimOccupation:'موظف',crimeSceneLocation:'محل',timeOfIncident:'10',suspects,initialEvidence},secretSolution:{culpritName:suspects[0].name,motive:'دافع ثابت',weaponOrMethod:'طريقة',keyEvidence:'دليل',flawInAlibi:'تناقض',fullNarrative:'رواية ثابتة',investigationPlan:{clues,redHerrings:Array.from({length:p.redHerrings[0]},()=>({description:'مضلل',resolution:'سبب'})),legalChallenges:law==='الأمريكي'?Array.from({length:depth==='طويل'?2:1},()=>({suspectId:suspects[0].id,trigger:'استجواب',invokedRight:'counsel',lawfulAlternative:'سجل مستقل'})):[]}}};
 const original=JSON.stringify(draft),output=ctx.ClueMeInPolicy.validateNames(ctx.ClueMeInGameRules.validateGeneratedCase(draft,params),params);
 for(const e of output.dossier.initialEvidence){const canonical=clues.find(c=>c.id===e.id);assert.equal(e.name,canonical.name);assert.equal(e.description,canonical.description);}
 assert.equal(JSON.stringify(draft),original);assert.equal(JSON.stringify(output.secretSolution),JSON.stringify(draft.secretSolution));
 const bad=JSON.parse(JSON.stringify(draft));bad.dossier.initialEvidence[0].id='not-in-plan';assert.throws(()=>ctx.ClueMeInPolicy.validateNames(bad,params),/معرف الدليل/);
 count++;
}
console.log('PASS: generation normalization for Saudi/American and all three lengths ('+count+' cases); unknown ids rejected, input unchanged, frozen solution unchanged. Mock case fixtures, no live API requests.');
