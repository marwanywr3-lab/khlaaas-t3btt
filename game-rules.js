/* Shared case budgets and U.S.-only procedural challenges. */
(function (global) {
  const profiles = Object.freeze({
    'قصير': { minutes: [5,15], suspects: [2,2], clues: 3, initialClues: 1, actions: [4,8], redHerrings: [0,0] },
    'متوسط': { minutes: [20,30], suspects: [3,3], clues: 5, initialClues: 2, actions: [9,14], redHerrings: [0,1] },
    'طويل': { minutes: [30,50], suspects: [4,5], clues: 7, initialClues: 2, actions: [15,22], redHerrings: [1,2] }
  });
  const isAmerican = law => law === 'الأمريكي';
  const profile = depth => profiles[depth] || profiles['متوسط'];
  function durationLabel(depth, language) {
    const p = profile(depth);
    return `${p.minutes[0]}–${p.minutes[1]} ${language === 'en' ? 'minutes' : 'دقيقة'}`;
  }
  function legalRules(law) {
    if (!isAmerican(law)) return 'Use only the selected Saudi legal system. Do not introduce U.S. constitutional amendment or Miranda challenges into this case.';
    return `U.S. Fifth Amendment / Miranda challenge rules:
- Distinguish custodial interrogation from a voluntary interview. Give the applicable warnings before custodial questioning; do not treat every conversation as custodial.
- A suspect in a planned challenge clearly invokes silence or requests counsel. Honor invocation: stop the relevant questioning. For a counsel request, do not resume police-initiated custodial questioning without counsel; do not invent a waiver to bypass the request.
- Do not treat protected post-warning silence as proof of guilt. Do not reward coercion or use a coerced confession as admissible proof.
- Keep lawful independent evidence routes available: witness accounts, timelines, and properly obtained physical evidence. The testimonial privilege is not a blanket ban on non-testimonial evidence.
- In the verdict, evaluate challenged statements against the case's actual custody, warning and invocation facts. Explain admissibility and the remaining independent evidence; a procedural violation does not automatically erase the whole case.`;
  }
  function generationRules(params) {
    const p = profile(params.depth), challenges = isAmerican(params.legalSystem) ? (params.depth === 'طويل' ? 2 : 1) : 0;
    return `CASE SIZE CONTRACT (difficulty changes inference complexity, not this size budget):
Target estimated active play: ${p.minutes[0]}-${p.minutes[1]} minutes; ${p.actions[0]}-${p.actions[1]} meaningful investigative actions.
Use ${p.suspects[0]}-${p.suspects[1]} suspects, exactly ${p.clues} essential clues in total (including exactly ${p.initialClues} initial dossier evidence items), and ${p.redHerrings[0]}-${p.redHerrings[1]} brief red herrings. Do not create additional required suspects, locations or arbitrary waiting steps. Avoid padding and repetitive interviews. Give each meaningful action progress; never reveal the culprit without a supported accusation. The time range is a design estimate, not a forced timer.
Extend secretSolution with a hidden investigationPlan object:
{"clues":[{"id":"ev-1","name":"clue name","description":"what it proves","discoveryAction":"concrete way to find it"}],"redHerrings":[{"description":"lead","resolution":"how it is ruled out"}],"legalChallenges":[{"suspectId":"existing suspect id","trigger":"specific custody/interview stage","invokedRight":"silence or counsel","lawfulAlternative":"independent evidence route"}]}
The clues array must contain exactly ${p.clues} unique entries; include all initialEvidence ids. Keep this plan out of the public briefing. Every generated American case includes exactly ${challenges} case-specific legalChallenges. A Saudi case has an empty legalChallenges array. For a short case, use one compact counsel-or-silence challenge that does not exceed the action budget.
${legalRules(params.legalSystem)}`;
  }
  function runtimeRules(caseData, secret = {}, phase = 'investigation') {
    const p = profile(caseData?.parameters?.depth);
    const plan = secret.investigationPlan || {};
    const safePlan = { ...plan, legalChallenges: isAmerican(caseData?.parameters?.legalSystem) ? plan.legalChallenges || [] : [] };
    return `Keep this ${caseData?.parameters?.depth || 'متوسط'} case within its ${p.minutes[0]}-${p.minutes[1]} minute design and ${p.actions[0]}-${p.actions[1]} meaningful-action budget. Use the existing cast and finite clue plan. Answer direct investigative requests concretely; avoid filler, artificial delays, recycled clues and newly invented required subplots. Never auto-close based on elapsed time or action count.
${legalRules(caseData?.parameters?.legalSystem)}
${phase === 'assistant' ? 'Use only disclosed investigation facts. Do not invent whether someone invoked a right or disclose hidden challenges. Suggest the next lawful action.' : 'Hidden plan (never disclose wholesale): ' + JSON.stringify(safePlan)}
${phase === 'verdict' ? 'When issuing a verdict, distinguish a factually correct accusation from whether the admissible evidence supports it. Explain any triggered procedural challenge.' : phase === 'assistant' ? 'Explain only procedural events already disclosed in the record. Do not trigger or invent a hidden scenario yourself.' : 'Maintain continuity: trigger each planned rights scenario once at its stated stage, respect its invocation in later turns, and offer its lawful evidence route.'}`;
  }
  function validateGeneratedCase(data, params) {
    const p = profile(params.depth), suspects = data?.dossier?.suspects, evidence = data?.dossier?.initialEvidence, plan = data?.secretSolution?.investigationPlan;
    const fail = () => { throw new Error('القضية المولّدة لا تطابق الطول أو التحديات المطلوبة. أعد التوليد.'); };
    if (!Array.isArray(suspects) || suspects.length < p.suspects[0] || suspects.length > p.suspects[1] || !Array.isArray(evidence) || evidence.length !== p.initialClues || !Array.isArray(plan?.clues) || plan.clues.length !== p.clues || !Array.isArray(plan.redHerrings) || plan.redHerrings.length < p.redHerrings[0] || plan.redHerrings.length > p.redHerrings[1]) fail();
    const clueIds = new Set(plan.clues.map(c => c.id));
    if (clueIds.size !== p.clues || evidence.some(c => !clueIds.has(c.id)) || plan.clues.some(c => !c.name || !c.description || !c.discoveryAction)) fail();
    if (isAmerican(params.legalSystem)) {
      const expected = params.depth === 'طويل' ? 2 : 1;
      if (!Array.isArray(plan.legalChallenges) || plan.legalChallenges.length !== expected || plan.legalChallenges.some(c => !suspects.some(s => s.id === c.suspectId) || !c.trigger || !['silence','counsel'].includes(c.invokedRight) || !c.lawfulAlternative)) fail();
    } else plan.legalChallenges = [];
    return data;
  }
  global.CaseMasterGameRules = { profile, isAmerican, durationLabel, legalRules, generationRules, runtimeRules, validateGeneratedCase };
})(globalThis);
