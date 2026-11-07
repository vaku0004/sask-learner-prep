/* Practice test engine. Reads its settings from the #quiz element:
   data-bank="signs|rules", data-count="30", data-src="data/signs.json" */
(function(){
  const root = document.getElementById('quiz');
  if(!root) return;
  const BANK = root.dataset.bank, COUNT = +root.dataset.count || 20, SRC = root.dataset.src;
  const PASS = 0.8;
  const PDF = 'https://sgi.sk.ca/documents/37148/138037/drivers_handbook.pdf/cdd760de-a90c-401e-9a5e-f2d60b4041e2?t=1770740275621';
  const PDF_OFFSET = 10; // printed page number + 10 = PDF page
  const store = {
    get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},
    set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  };
  const SEEN_KEY = 'slp-seen-'+BANK, MODE_KEY = 'slp-mode';
  let ALL = [], seen = new Set(store.get(SEEN_KEY,[])), mode = store.get(MODE_KEY,'train')==='exam'?'exam':'train';
  const sessions = {}; let S, view;
  const $ = id => document.getElementById(id);
  const main = $('qmain');

  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  const item = k => ALL[S.order[k]];
  const isOk = k => S.chosen[k]===0;
  const qtext = it => it.q || 'What does this sign mean?';
  const srcLink = p => `<a href="${PDF}#page=${p+PDF_OFFSET}" target="_blank" rel="noopener">Handbook, p. ${p}</a>`;

  function pickRandom(){
    const idx = ALL.map((_,i)=>i);
    const unseen = shuffle(idx.filter(i=>!seen.has(ALL[i].id)));
    const rest = shuffle(idx.filter(i=>seen.has(ALL[i].id)));
    return shuffle(unseen.concat(rest).slice(0,COUNT));
  }
  function newSession(list){
    S = {order:list, idx:0, chosen:{}, pending:null, opts:list.map(i=>shuffle(ALL[i].o.map((_,k)=>k)))};
    sessions[mode] = S; render(); window.scrollTo({top:0});
  }
  function resume(){
    S = sessions[mode];
    if(!S) return newSession(pickRandom());
    S.idx>=S.order.length ? results() : render();
  }
  function drawChrome(){
    document.querySelectorAll('[data-m]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m===mode));
    $('seen').textContent = `${seen.size} of ${ALL.length} questions seen`;
    $('modehint').textContent = mode==='train'
      ? 'Practice mode: see the right answer and an explanation after each question.'
      : `Exam mode: ${COUNT} questions, answers revealed at the end. Pass mark ${Math.round(PASS*100)}%.`;
  }
  function drawBar(){
    $('track').innerHTML = S.order.map((_,k)=>{
      let c='';
      if(S.chosen[k]!==undefined) c = mode==='exam' && S.idx<S.order.length ? 'done' : (isOk(k)?'ok':'bad');
      else if(k===S.idx) c='cur';
      return `<i class="${c}"></i>`;
    }).join('');
    const ok = S.order.filter((_,k)=>isOk(k)).length, cur = Math.min(S.idx+1,S.order.length);
    $('score').innerHTML = mode==='exam' && S.idx<S.order.length
      ? `<b>${cur}</b>/${S.order.length}` : `<b>${cur}</b>/${S.order.length} · correct <b>${ok}</b>`;
  }
  function render(){
    view='q'; drawChrome(); drawBar(); $('hint').hidden=false;
    const it = item(S.idx), L=['A','B','C','D'];
    const plate = it.img ? `<div class="plate${BANK==='rules'?' wide':''}"><img src="${it.img}" alt="Illustration for question ${S.idx+1}"></div>` : '';
    main.innerHTML = `<article class="card">${plate}<div class="qbody">
      <div class="qnum">Question ${S.idx+1} of ${S.order.length}</div>
      <h2 class="q">${esc(qtext(it))}</h2>
      <div class="opts" role="group" aria-label="Answers">${S.opts[S.idx].map((o,k)=>`<button class="opt" id="opt${k}" data-k="${k}"><span class="k">${L[k]}</span><span>${esc(it.o[o])}</span></button>`).join('')}</div>
      <div id="feedback"></div></div></article>`;
    main.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.k)));
    if(mode==='exam') examControls(); else if(S.chosen[S.idx]!==undefined) feedback(false);
  }
  function commit(o){ S.chosen[S.idx]=o; seen.add(item(S.idx).id); store.set(SEEN_KEY,[...seen]); }
  function choose(k){
    if(view!=='q') return;
    const o = S.opts[S.idx][k]; if(o===undefined) return;
    if(mode==='exam'){ S.pending=o; examControls(); return; }
    if(S.chosen[S.idx]!==undefined) return;
    commit(o); feedback(true); drawBar();
  }
  function examControls(){
    const sel = S.chosen[S.idx]!==undefined ? S.chosen[S.idx] : S.pending;
    S.opts[S.idx].forEach((o,i)=>$('opt'+i).classList.toggle('sel',o===sel));
    const last = S.idx===S.order.length-1;
    $('feedback').innerHTML = `<div class="actions"><button class="btn primary" id="next" ${sel==null?'disabled':''}>${last?'Finish test':'Next question'}</button></div>`;
    $('next').addEventListener('click',next);
  }
  function feedback(focus){
    const it = item(S.idx), ok = isOk(S.idx);
    S.opts[S.idx].forEach((o,i)=>{const b=$('opt'+i); b.disabled=true;
      b.classList.add(o===0?'ok':(o===S.chosen[S.idx]?'bad':'dim'));});
    const last = S.idx===S.order.length-1;
    $('feedback').innerHTML = `<div class="ex ${ok?'':'wrong'}"><strong>${ok?'Correct.':'Incorrect.'}</strong><p>${esc(it.ex)}</p><span class="src">${srcLink(it.p)}</span></div>
      <div class="actions" style="margin-top:12px"><button class="btn primary" id="next">${last?'See your result':'Next question'}</button></div>`;
    $('next').addEventListener('click',next);
    if(focus) $('next').focus({preventScroll:true});
  }
  function next(){
    if(mode==='exam'){ if(S.chosen[S.idx]===undefined){ if(S.pending==null) return; commit(S.pending);} S.pending=null; }
    else if(S.chosen[S.idx]===undefined) return;
    if(S.idx<S.order.length-1){ S.idx++; render(); window.scrollTo({top:0,behavior:'smooth'}); }
    else { S.idx=S.order.length; results(); window.scrollTo({top:0}); }
  }
  function results(){
    view='r'; drawChrome(); drawBar(); $('hint').hidden=true;
    const total=S.order.length, ok=S.order.filter((_,k)=>isOk(k)).length, pct=Math.round(ok/total*100);
    const missed=S.order.map((_,k)=>k).filter(k=>!isOk(k)), passed=ok/total>=PASS, left=ALL.length-seen.size;
    const verdict = pct===100 ? 'A perfect score.' : passed ? 'Nice work. Review the questions you missed below.' : 'Not at the pass mark yet. Review your mistakes and try again.';
    main.innerHTML = `<article class="card"><div class="result">
      <div class="eyebrow">Your result · ${mode==='exam'?'exam mode':'practice mode'}</div>
      <div class="big">${ok}<small> / ${total} · ${pct}%</small></div>
      <div><span class="badge ${passed?'pass':'fail'}">${passed?'PASS':'FAIL'}</span> <span class="covered">pass mark ${Math.round(PASS*100)}% (${Math.ceil(total*PASS)} of ${total})</span></div>
      <p class="verdict">${verdict}</p>
      <p class="covered" id="cov">Questions seen: <b>${seen.size} of ${ALL.length}</b>. ${left>0?`Your next set starts with questions you haven't seen yet (${left} left).`:'You have seen every question in this test at least once.'}</p>
      <div class="stack"><div class="actions" style="justify-content:flex-start">
        ${missed.length?`<button class="btn primary" id="retry">Retry my mistakes (${missed.length})</button>`:''}
        <button class="btn ${missed.length?'':'primary'}" id="again">New ${COUNT} questions</button>
        <button class="btn" id="all">All ${ALL.length} in a row</button></div>
        <button class="linkbtn" id="reset">Reset my progress for this test</button></div>
      ${missed.length?`<div class="miss"><h2>Questions to review</h2>${missed.map(k=>{const it=item(k);return `
        <div class="mrow${it.img?'':' noimg'}">${it.img?`<div class="th"><img src="${it.img}" alt=""></div>`:''}
        <div><div class="mq">${esc(qtext(it))}</div><div class="right">${esc(it.o[0])}</div><div class="yours">Your answer: ${esc(it.o[S.chosen[k]])}</div>
        ${mode==='exam'?`<div class="mex">${esc(it.ex)} <span class="src">${srcLink(it.p)}</span></div>`:''}</div></div>`}).join('')}</div>`:''}
    </div></article>`;
    const r=$('retry'); if(r) r.addEventListener('click',()=>newSession(shuffle(missed.map(k=>S.order[k]))));
    $('again').addEventListener('click',()=>newSession(pickRandom()));
    $('all').addEventListener('click',()=>newSession(ALL.map((_,i)=>i)));
    $('reset').addEventListener('click',e=>{seen=new Set(); store.set(SEEN_KEY,[]); e.target.textContent='Progress reset'; e.target.disabled=true; drawChrome();
      $('cov').innerHTML=`Questions seen: <b>0 of ${ALL.length}</b>.`;});
  }
  document.querySelectorAll('[data-m]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.m===mode) return; mode=b.dataset.m; store.set(MODE_KEY,mode); resume();
  }));
  document.addEventListener('keydown',e=>{
    if(view!=='q' || e.target.closest('.seg,.nav,a')) return;
    if(['1','2','3','4'].includes(e.key)) choose(+e.key-1);
    else if(e.key==='Enter'){ e.preventDefault(); next(); }
  });
  fetch(SRC).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(d=>{ ALL=d; resume(); })
    .catch(()=>{ main.innerHTML = '<div class="note">The questions could not be loaded. Check your connection and reload the page.</div>'; });
})();
