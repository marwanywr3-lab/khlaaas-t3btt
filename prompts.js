import { gameRules } from './gameRules';
import { features } from './features';
// src/prompts.js
import rawSystemPrompt from '../SYSTEM_PROMPT.md?raw';

/**
 * Parses markdown sections demarcated by ## SECTION_NAME headers.
 */
function extractSection(markdownText, sectionName) {
  if (!markdownText) return '';
  const regex = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  const match = markdownText.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Replaces mustache style template tags {{key}} with runtime values.
 */
function interpolate(template, variables = {}) {
  let output = template;
  for (const [key, value] of Object.entries(variables)) {
    const val = value !== undefined && value !== null ? String(value) : '';
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), val);
  }
  return output;
}

export const SYSTEM_PROMPTS = {
  /**
   * 1. CASE GENERATOR
   * Reads ## CASE_GENERATOR from SYSTEM_PROMPT.md
   */
  caseGenerator: (params) => {
    const template = extractSection(rawSystemPrompt, 'CASE_GENERATOR');
    return interpolate(template, {
      difficulty: params.difficulty || 'متوسط',
      legalSystem: params.legalSystem || 'السعودي',
      depth: params.depth || 'متوسط',
      language: params.language === 'ar' ? 'العربية الفصحى الدقيقة' : 'الإنجليزية',
    }) + '\n' + gameRules.generationRules(params);
  },

  /**
   * 2. INVESTIGATION MASTER ENGINE
   * Reads ## INVESTIGATION_MASTER from SYSTEM_PROMPT.md
   */
  investigationMaster: ({ caseData, secretSolution = {}, legalSystem, phase = 'investigation' }) => {
    const template = extractSection(rawSystemPrompt, 'INVESTIGATION_MASTER');
    return interpolate(template, {
      caseTitle: caseData?.title || 'قضية جنائية',
      crimeSceneLocation: caseData?.dossier?.crimeSceneLocation || 'موقع غير محدد',
      legalSystem: legalSystem || caseData?.parameters?.legalSystem || 'السعودي',
      culpritName: secretSolution?.culpritName || 'غير محدد',
      motive: secretSolution?.motive || 'غير محدد',
      weaponOrMethod: secretSolution?.weaponOrMethod || 'غير محدد',
      keyEvidence: secretSolution?.keyEvidence || 'غير محدد',
      flawInAlibi: secretSolution?.flawInAlibi || 'غير محدد',
    }) + '\n' + gameRules.runtimeRules({ ...caseData, parameters: { ...caseData?.parameters, legalSystem: legalSystem || caseData?.parameters?.legalSystem } }, secretSolution, phase);
  },

  /**
   * 3. LEGAL & INVESTIGATION ASSISTANT ENGINE
   * Reads ## ASSISTANT_ENGINE from SYSTEM_PROMPT.md
   */
  assistantEngine: ({ caseData, legalSystem, depth, advisorMode = 'legal', advisorName = '' }) => {
    const template = extractSection(rawSystemPrompt, 'ASSISTANT_ENGINE');
    const isSaudi = legalSystem === 'السعودي';
    const legalSystemGuidelines = isSaudi
      ? '(ركز على: نظام الإجراءات الجزائية السعودي، حظر الإكراه، مشروعية الحصول على الدليل، شروط التلبس، وشهادات الشهود وقوة القرائن.)'
      : '(ركز على: القانون الجنائي الأمريكي، حقوق ميراندا (Miranda Rights)، التعديل الرابع (مشروعية التفتيش)، وسلسلة حيازة الدليل (Chain of Custody).)';

    return interpolate(template, {
      legalSystem: legalSystem || 'السعودي',
      depth: depth || 'متوسط',
      legalSystemGuidelines,
    }) + '\n' + features.assistantInstructions(advisorMode, advisorName) + '\n' + gameRules.runtimeRules({ ...caseData, parameters: { ...caseData?.parameters, legalSystem: legalSystem || caseData?.parameters?.legalSystem, depth: depth || caseData?.parameters?.depth } }, {}, 'assistant');
  },
};
