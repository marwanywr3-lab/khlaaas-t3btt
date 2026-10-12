/* Per-case scene navigation. Reuses the existing evidence, advisor and verdict engines. */
(function () {
  'use strict';
  const rooms = ['office','interrogation','detective','legal'];
  let panel = null, bookTab = 'overview', bookOpen = false, returnFocus = null;
  const english = () => ClueMeInI18n.getLanguage() === 'en';
  const tr = (ar,en) => english() ? en : ar;
  const label = room => ({office:tr('مكتب التحقيق','Investigation office'),interrogation:tr('غرفة الاستجواب','Interview room'),detective:tr('مكتب مساعد المحقق','Detective assistant'),legal:tr('مكتب المستشار القانوني','Legal advisor')})[room];
  function roomOf(c) { return rooms.includes(c?.sceneRoom) ? c.sceneRoom : 'office'; }
  function suspectOf(c) { return (c?.dossier?.suspects || []).find(s=>s.id === c.sceneSuspectId) || null; }
  function sync(c) {
    if (panel && panel.caseId !== c?.id) {panel=null;bookOpen=false;}
    const room=roomOf(c);
    if(c && ['detective','legal'].includes(room) && ClueMeInFeatures.getPreferences().advisorMode !== room) {
      ClueMeInFeatures.setPreferences({advisorMode:room});
    }
  }
  function openRoom(room) {
    const c=getActiveCase();if(!c||!rooms.includes(room))return;
    captureDraftFields();document.getElementById('assistant-input')?.removeAttribute('data-draft-key');
    panel=null;bookOpen=false;c.sceneRoom=room;
    if(['detective','legal'].includes(room))ClueMeInFeatures.setPreferences({advisorMode:room});
    saveCases();render();document.querySelector(`[data-room="${room}"]`)?.focus();
  }
  function openPanel(type) {
    const c=getActiveCase();if(!c)return;
    captureDraftFields();returnFocus=document.activeElement?.id;
    panel={caseId:c.id,type};bookOpen=false;if(type==='book')bookTab='overview';
    render();
  }
  function closePanel() {
    captureDraftFields();panel=null;bookOpen=false;render();
    document.getElementById(returnFocus || 'room-main-action')?.focus();
  }
  function chooseSuspect(index) {
    const c=getActiveCase(),s=c?.dossier?.suspects?.[index];if(!s)return;
    captureDraftFields();if(!s.id)s.id='legacy-scene-'+c.id+'-'+index;c.sceneSuspectId=s.id;c.sceneRoom='interrogation';saveCases();
    panel={caseId:c.id,type:'investigation'};render();
  }
  function investigationMessages(c) {
    const s=panel?.type==='investigation' && panel.caseId===c.id?suspectOf(c):null;
    return s ? c.investigationChat.filter(m=>m.suspectId===s.id || m.id==='init-1') : c.investigationChat;
  }
  function interviewSuspectId() {
    const c=getActiveCase();return panel?.caseId===c?.id && panel.type==='investigation' ? suspectOf(c)?.id : undefined;
  }
  function investigate(action) {
    const c=getActiveCase();if(!c||c.isSolved)return;
    captureDraftFields();c.sceneSuspectId=null;saveCases();panel={caseId:c.id,type:'investigation'};
    render();sendInvestigationAction(action);
  }
  function nameFor(room) {
    const name=ClueMeInFeatures.getPreferences().advisorName;
    return name || label(room);
  }
  function renderScene(c) {
    const room=roomOf(c),image=room==='office'?'investigator':room==='interrogation'?'interrogation':'advisor';
    const person=suspectOf(c);
    const action=room==='office'?tr('ملف القضية','Case file'):room==='interrogation'?tr('استجواب المشتبه به','Interview a suspect'):tr('تحدث مع ','Talk to ')+nameFor(room);
    const positions={
      office:{x:52,y:52,mobileY:50},
      interrogation:{x:50,y:57,mobileY:55},
      detective:{x:52,y:50,mobileY:52},
      legal:{x:52,y:50,mobileY:52}
    };
    const pos=positions[room]||positions.office;
    const x=pos.x,y=pos.y;
    const mobileY=pos.mobileY;
    return `<section class="case-scenes" aria-label="${escapeHtml(label(room))}">
      <div class="room-stage"><div class="room-frame">
        <picture><source media="(max-width: 700px)" srcset="assets/rooms/${image}-mobile.jpg"><img class="room-background" src="assets/rooms/${image}-desktop.jpg" alt="${escapeHtml(label(room))}" /></picture>
        <div class="room-caption"><h2>${escapeHtml(label(room))}</h2>${room==='interrogation' && person ? `<p data-user-content>${tr('المختار: ','Selected: ')}${escapeHtml(person.name)}</p>`:''}</div>
        <button id="room-main-action" class="scene-hotspot" data-x="${x}" data-y="${y}" data-mobile-y="${mobileY}" onclick="CaseRooms.openPanel('${room==='office'?'book':room==='interrogation'?'suspects':'advisor'}');">${escapeHtml(action)}</button>
        <div class="room-tools">
          ${room==='interrogation'?`<button onclick="CaseRooms.openPanel('log');">${tr('سجل التحقيق','Investigation log')}</button>${!c.isSolved?`<button onclick="CaseRooms.investigate('أريد فحص مسرح الجريمة بحثاً عن آثار أقدام أو بصمات أو دلائل مادية جديدة.');">${tr('فحص المسرح','Inspect the scene')}</button><button onclick="CaseRooms.investigate('اطلب تقرير الطب الشرعي المفصل حول وقت وطريقة الوفاة بدقة.');">${tr('تقرير الطب الشرعي','Medical report')}</button>`:''}`:''}
          ${room==='office'?`<button onclick="CaseRooms.openPanel('log');">${tr('سجل التحقيق والتلميحات','Investigation log and hints')}</button>`:''}
          ${c.isSolved?`<button onclick="CaseRooms.openPanel('log');">${tr('الحكم والتقييم','Verdict and evaluation')}</button>`:`<button onclick="state.isIndictmentOpen=true;render();">${tr('تقديم لائحة الاتهام','Submit accusation')}</button>`}
        </div>
      </div></div>
      <nav class="room-navigation" aria-label="${tr('أماكن القضية','Case locations')}">${rooms.map(r=>`<button type="button" data-room="${r}" aria-current="${room===r?'page':'false'}" onclick="CaseRooms.openRoom('${r}');"><span aria-hidden="true">${({office:'📁',interrogation:'🔍',detective:'💬',legal:'⚖️'})[r]}</span><span>${escapeHtml(label(r))}</span></button>`).join('')}</nav>
      ${panel?.caseId===c.id && !state.isIndictmentOpen && !state.isSettingsOpen && !state.isNewCaseOpen && !state.caseAction?renderPanel(c):''}
    </section>`;
  }
  function renderPanel(c) {
    let content='',title='';
    if(panel.type==='suspects'){
      title=tr('اختر الشخص الذي تريد استجوابه','Choose a person to interview');
      content=`<div class="suspect-list">${(c.dossier?.suspects||[]).map((s,i)=>`<button class="suspect-choice" data-suspect-index="${i}" onclick="CaseRooms.chooseSuspect(${i});"><strong data-user-content>${escapeHtml(s.name)}</strong><span data-user-content>${escapeHtml(s.role||'')}</span></button>`).join('')||`<p>${tr('لا يوجد مشتبه بهم مسجلون في هذه القضية.','No suspects are recorded in this case.')}</p>`}</div>`;
    }else if(panel.type==='investigation' || panel.type==='log'){
      title=panel.type==='investigation' && suspectOf(c)?tr('استجواب: ','Interview: ')+suspectOf(c).name:tr('سجل التحقيق والأدلة','Investigation log and evidence');
      content=renderInvestigationColumn(c);
    }else if(panel.type==='advisor'){
      title=label(roomOf(c))+' · '+nameFor(roomOf(c));content=renderAssistantColumn(c);
    }else{
      title=tr('ملف القضية','Case file');
      content=bookOpen?renderBook(c):`<button class="dossier-cover" onclick="CaseRooms.openBook();"><img src="assets/rooms/dossier-closed.png" alt="${tr('ملف مغلق','Closed dossier')}" /><span>${tr('فتح ملف القضية','Open case file')}</span><strong data-user-content>${escapeHtml(c.title)}</strong></button>`;
    }
    return `<div class="workspace-modal room-overlay" onclick="if(event.target===this)CaseRooms.closePanel();"><section class="room-dialog ${panel.type==='book'?'book-dialog':panel.type==='suspects'?'picker-dialog':'room-chat'}" role="dialog" aria-modal="true" aria-labelledby="room-dialog-title"><header class="room-dialog-header"><h2 id="room-dialog-title" data-user-content>${escapeHtml(title)}</h2><button id="room-close" type="button" onclick="CaseRooms.closePanel();" aria-label="${tr('إغلاق','Close')}">✕</button></header><div class="room-dialog-body">${content}</div></section></div>`;
  }
  const bookLabels=()=>({overview:tr('البلاغ','Briefing'),evidence:tr('الأدلة','Evidence'),suspects:tr('المشتبه بهم','Suspects'),notes:tr('الملاحظات','Notes'),record:tr('سجل التحقيق','Investigation log')});
  function openBook(){bookOpen=true;render();}
  function setBookTab(tab){if(!Object.hasOwn(bookLabels(),tab))return;captureDraftFields();bookTab=tab;render();document.querySelector(`[data-book-tab="${tab}"]`)?.focus();}
  function renderBook(c){
    const d=c.dossier||{},tabs=bookLabels();
    let text='';
    if(bookTab==='overview')text=`<dl class="book-facts"><dt>${tr('الضحية','Victim')}</dt><dd data-user-content>${escapeHtml(d.victimName||'—')}</dd><dt>${tr('العمر والمهنة','Age and occupation')}</dt><dd data-user-content>${escapeHtml(String(d.victimAge||'—'))} · ${escapeHtml(d.victimOccupation||'—')}</dd><dt>${tr('المكان','Location')}</dt><dd data-user-content>${escapeHtml(d.crimeSceneLocation||'—')}</dd><dt>${tr('التوقيت','Time')}</dt><dd data-user-content>${escapeHtml(d.timeOfIncident||'—')}</dd></dl><p class="book-text" data-user-content>${escapeHtml(c.briefingSummary||'')}</p>`;
    if(bookTab==='evidence')text=(c.evidenceList||[]).map(e=>`<article class="book-entry"><h4 data-user-content>${escapeHtml(e.name)}</h4><small data-user-content>${escapeHtml(e.type||'')}</small><p data-user-content>${escapeHtml(e.description||'')}</p></article>`).join('')||`<p>${tr('لم تُكتشف أدلة بعد.','No evidence discovered yet.')}</p>`;
    if(bookTab==='suspects')text=(d.suspects||[]).map((s,i)=>`<article class="book-entry"><h4 data-user-content>${escapeHtml(s.name)}</h4><small data-user-content>${escapeHtml(s.role||'')}</small><p data-user-content>${escapeHtml(s.alibi||'')}</p><button onclick="CaseRooms.chooseSuspect(${i});">${tr('استجواب','Interview')}</button></article>`).join('');
    if(bookTab==='notes')text=`<div class="book-note-tools"><span id="notepad-save-status" role="status">${tr(storageFailures.has(notepadKey(c.id))?'تعذر الحفظ الدائم؛ انسخ ملاحظاتك':'حفظ تلقائي ✓',storageFailures.has(notepadKey(c.id))?'Persistent save failed; copy your notes':'Auto saved ✓')}</span><button onclick="copyNotepad();">${tr('نسخ','Copy')}</button><button onclick="CaseRooms.confirmClearNotes();">${tr('مسح','Clear')}</button></div><textarea id="notepad-textarea" oninput="updateNotepad(this.value);" placeholder="${tr('دوّن استنتاجاتك هنا…','Record your conclusions…')}">${escapeHtml(state.notepadContent)}</textarea>`;
    if(bookTab==='record')text=(c.investigationChat||[]).map(m=>`<article class="book-entry"><h4 data-user-content>${escapeHtml(m.sender==='user'?tr('المحقق','Investigator'):m.suspectName||tr('إدارة التحقيق','Investigation engine'))} · ${escapeHtml(m.timestamp||'')}</h4><p data-user-content>${escapeHtml(m.text)}</p></article>`).join('');
    return `<div class="case-book"><div class="book-summary"><h3 data-user-content>${escapeHtml(c.title)}</h3><p>${escapeHtml(tr('النظام: ','System: ')+ClueMeInI18n.t(c.parameters?.legalSystem||'السعودي'))}</p><p>${tr('المدة التقديرية: ','Estimated length: ')}${ClueMeInGameRules.durationLabel(c.parameters?.depth,english()?'en':'ar')}</p><p>${c.isSolved?tr('قضية مغلقة','Closed case'):tr('التحقيق جارٍ','Investigation in progress')}</p><nav aria-label="${tr('أقسام الملف','Dossier sections')}">${Object.entries(tabs).map(([key,title])=>`<button data-book-tab="${key}" aria-pressed="${bookTab===key}" onclick="CaseRooms.setBookTab('${key}');">${title}${key==='evidence'?` (${c.evidenceList.length})`:''}</button>`).join('')}</nav></div><section class="book-page" aria-label="${tabs[bookTab]}"><h3>${tabs[bookTab]}</h3><div class="book-page-content">${text}</div></section></div>`;
  }
  function confirmClearNotes(){if(window.confirm(tr('مسح ملاحظات هذه القضية؟','Clear notes for this case?')))clearNotepad();}
  function afterRender(){
    document.getElementById('app')?.classList.toggle('has-case-scenes',!!getActiveCase() && state.currentView==='workspace');
    const image=document.querySelector('.room-background');if(image){image.addEventListener('load',positionHotspot,{once:true});positionHotspot();}
    const dialog=document.querySelector('.room-dialog');if(dialog && !state.isIndictmentOpen && !state.isSettingsOpen && !state.isNewCaseOpen) document.getElementById('room-close')?.focus();
    const input=document.getElementById('investigation-input');const s=panel?.type==='investigation'?suspectOf(getActiveCase()):null;if(input && s)input.placeholder=tr('اسأل ','Ask ')+s.name+'…';
  }
  function positionHotspot(){
    const image=document.querySelector('.room-background'),frame=document.querySelector('.room-frame'),button=document.querySelector('.scene-hotspot');
    if(!image||!frame||!button||!image.naturalWidth)return;
    const w=frame.clientWidth,h=frame.clientHeight,scale=Math.min(w/image.naturalWidth,h/image.naturalHeight),rw=image.naturalWidth*scale,rh=image.naturalHeight*scale;
    const mobile=window.matchMedia('(max-width: 700px)').matches;
    button.style.left=((w-rw)/2+rw*Number(button.dataset.x)/100)+'px';
    button.style.top=((h-rh)/2+rh*Number(mobile?button.dataset.mobileY:button.dataset.y)/100)+'px';
  }
  document.addEventListener('keydown',event=>{
    if(!panel || state.isSettingsOpen || state.isNewCaseOpen || state.isIndictmentOpen)return;
    if(event.key==='Escape'){event.preventDefault();closePanel();}
  });
  window.addEventListener('resize',positionHotspot);
  window.CaseRooms={render:renderScene,sync,afterRender,openRoom,openPanel,closePanel,chooseSuspect,interviewSuspectId,investigationMessages,investigate,openBook,setBookTab,confirmClearNotes};
})();
