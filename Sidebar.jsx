import { features, useAdvisorPreferences } from '../features';
import { useTranslation } from '../i18n';
// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useCaseStore } from '../useCaseStore';
import { SUPPORTED_MODELS } from '../api';

export default function Sidebar() {
  const { t, language, setLanguage } = useTranslation();

  const {
    cases,
    activeCaseId,
    setActiveCaseId,
    deleteCase,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    setIsNewCaseModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useCaseStore();

  useEffect(() => {
    if (!isSidebarOpen || isSettingsModalOpen) return;
    const sidebar = document.getElementById('case-sidebar');
    sidebar?.querySelector('button[aria-label="إغلاق القائمة"]')?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsSidebarOpen(false);
        document.getElementById('sidebar-toggle')?.focus();
      }
      if (event.key === 'Tab') {
        const targets = sidebar?.querySelectorAll('button, [tabindex="0"]');
        const first = targets?.[0], last = targets?.[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isSidebarOpen, isSettingsModalOpen, setIsSidebarOpen]);

  const advisor = useAdvisorPreferences();
  const [advisorName, setAdvisorName] = useState(advisor.advisorName);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const handleOpenSettings = () => {
    setTempApiKey(apiKey);
    setAdvisorName(advisor.advisorName);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setApiKey(tempApiKey.trim());
    features.setPreferences({ advisorName });
    setSettingsSavedToast(true);
    setTimeout(() => {
      setSettingsSavedToast(false);
      setIsSettingsModalOpen(false);
    }, 900);
  };

  const handleClearKey = () => {
    setTempApiKey('');
    setApiKey('');
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm sidebar-backdrop transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed drawer on mobile/tablet, pinned column on desktop (lg+) */}
      <aside
        id="case-sidebar"
        aria-label={t("سجل القضايا والإعدادات")}
        hidden={!isSidebarOpen}
        className="case-sidebar flex flex-col select-none"
      >
        
        {/* Brand & App Title Header */}
        <div className="h-14 px-4 border-b border-noir-800 flex items-center justify-between bg-noir-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 font-bold text-sm shadow-sm">
              ⚖️
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wide text-slate-100 uppercase">
                CaseMaster <span className="text-red-500">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">{t("محاكي التحقيق الجنائي")}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenSettings}
              className={`p-2 rounded-lg border transition ${
                apiKey
                  ? 'text-slate-400 hover:text-white bg-noir-850 hover:bg-noir-800 border-noir-800'
                  : 'text-amber-400 bg-amber-950/40 border-amber-600/50 animate-pulse'
              }`}
              title={t("إعدادات الـ API والموديل")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label={t("إغلاق القائمة")}
              className="p-2 rounded-lg bg-noir-850 hover:bg-noir-800 text-slate-400 hover:text-white border border-noir-800 transition"
              title={t("إغلاق القائمة")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action Button: Open New Case Modal */}
        <div className="p-3 border-b border-noir-850">
          <button
            onClick={() => {
              setIsNewCaseModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className="w-full py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md hover:shadow-red-600/20 transition flex items-center justify-center gap-2 group min-h-[44px]"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>{t("فتح ملف قضية جديدة")}</span>
          </button>
        </div>

        {/* Previous Cases List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 overscroll-contain">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span>{t("سجل القضايا (")}{cases.length})</span>
            <span>STATUS</span>
          </div>

          {cases.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-600 text-xs">
              <div className="w-8 h-8 mx-auto mb-2 opacity-40">📂</div>{t("لا توجد قضايا سابقة. افتح قضية جديدة لبدء التحقيق.")}</div>
          ) : (
            cases.map((c) => {
              const isActive = c.id === activeCaseId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative p-3 rounded-lg cursor-pointer border transition text-right ${
                    isActive
                      ? 'bg-noir-850 border-red-500/60 shadow-sm'
                      : 'bg-noir-900/50 border-noir-850 hover:bg-noir-850 hover:border-noir-750 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {c.title}
                    </span>
                    {c.isSolved ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">{t("مغلقة")}</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-500/30 font-mono">{t("جارية")}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{t(c.parameters?.legalSystem || 'النظام')} • {t(c.parameters?.difficulty || 'متوسط')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCase(c.id);
                      }}
                      className="opacity-75 sm:opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition text-xs"
                      title={t("حذف القضية")}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Model and Status */}
        <div className="p-3 border-t border-noir-850 bg-noir-900/50 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-slate-400">{t(apiKey ? 'المحرك جاهز' : 'المفتاح مفقود')}</span>
          </div>
          <span className="text-[10px] text-slate-500 bg-noir-800 px-1.5 py-0.5 rounded border border-noir-750">
            {selectedModel === SUPPORTED_MODELS.FLASH ? '3.8-flash' : '3.5-lite'}
          </span>
        </div>
      </aside>

      {/* Settings Modal Overlay */}
      {isSettingsModalOpen && (
        <div className="workspace-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-noir-900 border border-noir-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-noir-800 bg-noir-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{t("إعدادات المحرك وربط Gemini API")}</h3>
                  <p className="text-[11px] text-slate-400">{t("تكوين النماذج ومفتاح الاتصال الخاص بك")}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
              <div><label htmlFor="advisor-name" className="block text-xs mb-1">{t('اسم المستشار')}</label><input id="advisor-name" maxLength={60} value={advisorName} onChange={e => setAdvisorName(e.target.value)} placeholder={t('المستشار')} className="w-full px-3 py-2 rounded border border-noir-800" /></div>
              
              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Google Gemini API Key:
                </label>
                <div className="relative">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-noir-850 border border-noir-800 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-red-500 transition pl-16"
                  />
                  <div className="absolute left-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="px-2 py-1 rounded text-[10px] bg-noir-800 text-slate-400 hover:text-white"
                    >
                      {t(showKeySecret ? 'إخفاء' : 'إظهار')}
                    </button>
                    {tempApiKey && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="p-1 rounded text-[10px] text-slate-400 hover:text-red-400"
                        title={t("مسح")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{t("يُحفظ المفتاح محلياً في متصفحك (`localStorage`) ولا يتم إرساله لأي خادم وسيط.")}</p>
              </div>

              {/* Model Selector: gemini-3.5-flash-lite vs gemini-3.8-flash */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">{t("النموذج المعتمد للتحقيق:")}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModel(SUPPORTED_MODELS.LITE)}
                    className={`p-3 rounded-lg text-right border transition ${
                      selectedModel === SUPPORTED_MODELS.LITE
                        ? 'bg-red-950/30 border-red-500 text-white'
                        : 'bg-noir-850 border-noir-800 text-slate-400 hover:border-noir-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">gemini-3.5-flash-lite</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t("الافتراضي (فائق السرعة وأقل استهلاكاً للحصة)")}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel(SUPPORTED_MODELS.FLASH)}
                    className={`p-3 rounded-lg text-right border transition ${
                      selectedModel === SUPPORTED_MODELS.FLASH
                        ? 'bg-red-950/30 border-red-500 text-white'
                        : 'bg-noir-850 border-noir-800 text-slate-400 hover:border-noir-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">gemini-3.8-flash</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t("أعلى في التحليل المنطقي والربط البوليسي")}</div>
                  </button>
                </div>
              </div>

              {/* AI Studio Info */}
              <div className="p-3.5 rounded-lg bg-noir-950 border border-noir-800 text-xs space-y-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <span>{t("💡 كيف تحصل على مفتاحك مجاناً خلال دقيقة؟")}</span>
                </span>
                <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>{t("توجه إلى موقع")}<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-red-400 underline hover:text-red-300">Google AI Studio</a>{t("وسجل بحسابك.")}</li>
                  <li>{t("اضغط على زر")}<strong>"Create API key"</strong>{t("في الزاوية.")}</li>
                  <li>{t("انسخ المفتاح المتولد والصقه في الخانة أعلاه ثم احفظ الإعدادات.")}</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-noir-800 flex items-center justify-between">
                {settingsSavedToast && (
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">{t("✓ تم الحفظ بنجاح")}</span>
                )}
                <div className="flex items-center gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >{t("إغلاق")}</button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition"
                  >{t("حفظ الإعدادات")}</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
