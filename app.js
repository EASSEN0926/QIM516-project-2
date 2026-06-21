function $(selector, root = document) { return root.querySelector(selector); }
function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

const modules = window.CMSK_MODULES || [];
const quizData = window.CMSK_QUIZ || [];

function activeNav() {
  const page = document.body.dataset.page;
  $all(".nav a").forEach(a => {
    if (a.dataset.nav === page) a.classList.add("active");
  });
}

function setupNav() {
  const toggle = $(".nav-toggle");
  const nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem("cmsk-progress-v3") || "[]"); }
  catch { return []; }
}

function setProgress(list) {
  localStorage.setItem("cmsk-progress-v3", JSON.stringify([...new Set(list)]));
  renderProgressWidgets();
}

function markComplete(id) {
  const list = getProgress();
  if (!list.includes(id)) {
    list.push(id);
    setProgress(list);
  }
}

function getQuizState() {
  try { return JSON.parse(localStorage.getItem("cmsk-quiz-v3") || '{"score":0,"answered":0}'); }
  catch { return {score:0, answered:0}; }
}

function setQuizState(state) {
  localStorage.setItem("cmsk-quiz-v3", JSON.stringify(state));
  renderProgressWidgets();
}

function playTTS(text) {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support text-to-speech. You can add local MP3 files in an audio folder.");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ms-MY";
  u.rate = 0.86;
  u.pitch = 1;
  speechSynthesis.speak(u);
}

function playPhrase(phrase) {
  // The website first tries local MP3: audio/[phrase-id].mp3.
  // If the file does not exist, it uses browser Malay TTS.
  const src = phrase.audio;
  if (!src) {
    playTTS(phrase.ms);
    return;
  }
  let started = false;
  const audio = new Audio(src);
  const fallback = () => {
    if (!started) {
      started = true;
      playTTS(phrase.ms);
    }
  };
  audio.onplaying = () => { started = true; };
  audio.onerror = fallback;
  audio.play().catch(fallback);
  setTimeout(() => {
    if (!started && audio.readyState === 0) fallback();
  }, 700);
}

function phraseFromButton(btn) {
  const id = btn.dataset.phraseId;
  for (const m of modules) {
    const found = m.phrases.find(p => p.id === id);
    if (found) return found;
  }
  return null;
}

function attachListenButtons(root = document) {
  $all("[data-phrase-id]", root).forEach(btn => {
    btn.addEventListener("click", () => {
      const phrase = phraseFromButton(btn);
      if (phrase) playPhrase(phrase);
    });
  });
  $all("[data-say]", root).forEach(btn => {
    btn.addEventListener("click", () => playTTS(btn.dataset.say));
  });
}

function phraseObj(arr) {
  return { id: arr[0], ms: arr[1], en: arr[2], zh: arr[3], note: arr[4], audio: arr[5] };
}

function moduleCardHTML(m) {
  return `<a class="card module-card" href="module.html?m=${m.id}">
    <span class="icon-badge">${m.icon}</span>
    <p class="ms-title">${m.titleMs}</p>
    <h3>${m.titleEn}<br><span style="font-size:.92rem;color:#667773">${m.titleZh}</span></h3>
    <p>${m.summaryEn}<br>${m.summaryZh}</p>
    <div class="module-meta">
      <span class="pill">${m.level}</span>
      <span class="pill orange-pill">Open →</span>
    </div>
  </a>`;
}

function renderModuleCards() {
  const container = $("#moduleCards");
  if (!container) return;
  container.innerHTML = modules.map(moduleCardHTML).join("");
}

function renderHomePreview() {
  const container = $("#homeModulePreview");
  if (!container) return;
  container.innerHTML = modules.slice(0, 3).map(moduleCardHTML).join("");
}

function getModuleIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("m") || "canteen";
}

function renderModulePage() {
  const root = $("[data-module-page]");
  if (!root) return;
  const id = getModuleIdFromUrl();
  const m = modules.find(item => item.id === id);
  if (!m) {
    root.innerHTML = `<section class="section"><h1>Module not found</h1><p>Please return to the modules page.</p><a class="btn primary" href="modules.html">Back to Modules</a></section>`;
    return;
  }

  document.title = `${m.titleEn} | Campus Malay Survival Kit`;
  root.innerHTML = `
    <div class="breadcrumbs"><a href="index.html">Home</a><span>/</span><a href="modules.html">Modules</a><span>/</span><span>${m.titleEn}</span></div>
    <section class="module-hero">
      <div class="module-hero-box">
        <span class="big-icon">${m.icon}</span>
        <div>
          <p class="eyebrow">${m.titleMs}</p>
          <h1 style="font-size:clamp(2.8rem,7vw,5rem)">${m.titleEn}</h1>
          <div class="lang-line">
            <span class="lang-chip"><strong>EN</strong> ${m.titleEn}</span>
            <span class="lang-chip"><strong>中文</strong> ${m.titleZh}</span>
            <span class="lang-chip"><strong>BM</strong> ${m.titleMs}</span>
          </div>
          <p class="lead">${m.summaryEn}<br>${m.summaryZh}</p>
          <div class="actions">
            <a href="#phrases" class="btn primary">Learn phrases</a>
            <a href="#dialogue" class="btn secondary">Dialogue practice</a>
            <button class="btn secondary" id="markDone">Mark module completed</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:30px">
      <div class="grid cols-3">
        ${m.objectives.map(o => `<article class="card tight"><span class="pill">Objective</span><h3>${o.en}</h3><p>${o.zh}</p></article>`).join("")}
      </div>
    </section>

    <section class="section" id="phrases">
      <div class="section-head">
        <p class="eyebrow">Phrase Cards</p>
        <h2>Malay phrase · English meaning · 中文解释</h2>
        <p>Click Listen to hear the phrase. The page can play your local MP3 files, and it also has a Malay text-to-speech fallback.</p>
      </div>
      <div class="phrase-grid">
        ${m.phrases.map(p0 => {
          const p = phraseObj(p0);
          return `<article class="phrase-card">
            <h3>${p.ms}</h3>
            <p class="en">${p.en}</p>
            <p class="zh">${p.zh}</p>
            <div class="phrase-note">${p.note}</div>
            <button class="btn primary small" data-phrase-id="${p.id}">▶ Listen</button>
          </article>`;
        }).join("")}
      </div>
    </section>

    <section class="section">
      <div class="grid cols-2">
        <article class="card">
          <p class="eyebrow">Vocabulary</p>
          <h2>Key words</h2>
          <table class="vocab-table">
            <thead><tr><th>Malay</th><th>English</th><th>中文</th></tr></thead>
            <tbody>${m.vocab.map(v => `<tr><td>${v[0]}</td><td>${v[1]}</td><td>${v[2]}</td></tr>`).join("")}</tbody>
          </table>
        </article>
        <article class="card">
          <p class="eyebrow">Campus Culture Tip</p>
          <h2>Use it naturally</h2>
          <p>${m.cultureTipEn}</p>
          <p>${m.cultureTipZh}</p>
          <div class="notice"><strong>Practical note:</strong> If pronunciation is difficult, students can show the phrase card directly to staff or local students.</div>
        </article>
      </div>
    </section>

    <section class="section" id="dialogue">
      <div class="grid cols-2">
        <article class="card">
          <p class="eyebrow">Dialogue Simulation</p>
          <h2>Practice a short conversation</h2>
          <div class="dialogue">
            ${m.dialogue.map(line => `<div class="bubble ${line.role === "Student" ? "student" : ""}">
              <strong>${line.role}</strong>
              <span>${line.ms}</span>
              <small>${line.en}<br>${line.zh}</small>
            </div>`).join("")}
          </div>
        </article>
        <article class="card">
          <p class="eyebrow">Mini Quiz</p>
          <h2>Check this module</h2>
          <div class="quick-check" data-answer="${m.quickCheck.answer}">
            <h3>${m.quickCheck.question}</h3>
            <p>${m.quickCheck.questionZh}</p>
            <div class="option-list">
              ${m.quickCheck.options.map(opt => `<button class="option">${opt}</button>`).join("")}
            </div>
            <div class="feedback" aria-live="polite"></div>
          </div>
        </article>
      </div>
    </section>

    <section class="section" style="padding-top:20px">
      <div class="actions">
        <a class="btn secondary" href="modules.html">← Back to all modules</a>
        <a class="btn primary" href="practice.html">Go to full practice →</a>
      </div>
    </section>
  `;

  $("#markDone")?.addEventListener("click", () => {
    markComplete(m.id);
    $("#markDone").textContent = "Completed ✓";
  });
  attachListenButtons(root);
  setupQuickChecks(root);
  markComplete(m.id);
}

function setupQuickChecks(root = document) {
  $all(".quick-check", root).forEach(box => {
    const answer = box.dataset.answer;
    const feedback = $(".feedback", box);
    $all(".option", box).forEach(btn => {
      btn.addEventListener("click", () => {
        $all(".option", box).forEach(o => {
          o.disabled = true;
          if (o.textContent.trim() === answer) o.classList.add("correct");
        });
        if (btn.textContent.trim() === answer) {
          feedback.textContent = "Correct. 很好，这个场景可以这样说。";
          feedback.className = "feedback good";
        } else {
          btn.classList.add("wrong");
          feedback.textContent = `Not quite. Correct answer: ${answer}`;
          feedback.className = "feedback bad";
        }
      });
    });
  });
}

let qIndex = 0;
let liveScore = 0;
let completedNow = 0;

function renderPractice() {
  const card = $("#practiceCard");
  if (!card) return;
  const item = quizData[qIndex];
  const progress = Math.round((qIndex / quizData.length) * 100);
  card.innerHTML = `
    <div class="quiz-top">
      <span class="pill">${item.moduleTitle}</span>
      <span class="score">Current score: ${liveScore} / ${completedNow}</span>
    </div>
    <div class="progress-bar"><span style="width:${progress}%"></span></div>
    <p class="eyebrow">Question ${qIndex + 1} / ${quizData.length}</p>
    <h2 style="font-size:clamp(1.7rem,3vw,2.6rem)">${item.question}</h2>
    <p>${item.questionZh}</p>
    <div class="option-list">
      ${shuffle([...item.options]).map(opt => `<button class="option">${opt}</button>`).join("")}
    </div>
    <div class="feedback" aria-live="polite"></div>
    <div class="actions">
      <button class="btn secondary" id="nextQ">Next</button>
      <button class="btn danger" id="resetLiveQuiz">Reset this attempt</button>
    </div>
  `;
  const feedback = $(".feedback", card);
  $all(".option", card).forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      completedNow++;
      $all(".option", card).forEach(o => {
        o.disabled = true;
        if (o.textContent.trim() === item.answer) o.classList.add("correct");
      });
      if (btn.textContent.trim() === item.answer) {
        liveScore++;
        feedback.textContent = `Correct. ${item.explanation}`;
        feedback.className = "feedback good";
      } else {
        btn.classList.add("wrong");
        feedback.textContent = `Not quite. ${item.explanation}`;
        feedback.className = "feedback bad";
      }
      const saved = getQuizState();
      setQuizState({score: saved.score + (btn.textContent.trim() === item.answer ? 1 : 0), answered: saved.answered + 1});
    });
  });
  $("#nextQ").addEventListener("click", () => {
    qIndex = (qIndex + 1) % quizData.length;
    renderPractice();
  });
  $("#resetLiveQuiz").addEventListener("click", () => {
    qIndex = 0; liveScore = 0; completedNow = 0; renderPractice();
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - .5);
}

function renderPhraseBank() {
  const list = $("#bankList");
  const search = $("#phraseSearch");
  const filter = $("#moduleFilter");
  if (!list || !search || !filter) return;

  filter.innerHTML = `<option value="all">All modules</option>` + modules.map(m => `<option value="${m.id}">${m.titleEn}</option>`).join("");

  function update() {
    const term = search.value.trim().toLowerCase();
    const selected = filter.value;
    const phrases = modules.flatMap(m => m.phrases.map(p0 => ({...phraseObj(p0), moduleId:m.id, moduleTitle:m.titleEn, moduleZh:m.titleZh, icon:m.icon})));
    const filtered = phrases.filter(p => {
      const hay = `${p.ms} ${p.en} ${p.zh} ${p.note} ${p.moduleTitle} ${p.moduleZh}`.toLowerCase();
      return (selected === "all" || p.moduleId === selected) && hay.includes(term);
    });
    list.innerHTML = filtered.length ? filtered.map(p => `<article class="bank-item">
      <div>
        <strong>${p.icon} ${p.ms}</strong>
        <small>${p.en}<br><span style="color:#8a5b00">${p.zh}</span><br>${p.moduleTitle}</small>
      </div>
      <button class="btn primary small" data-phrase-id="${p.id}">▶ Listen</button>
    </article>`).join("") : `<article class="card"><h3>No phrase found</h3><p>Try another keyword, such as clinic, price, office, help, Grab, or direction.</p></article>`;
    attachListenButtons(list);
  }

  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  update();
}

function renderProgressWidgets() {
  const progress = getProgress();
  const percent = Math.round((progress.length / modules.length) * 100);
  $all("[data-progress-percent]").forEach(el => el.textContent = `${percent}%`);
  $all("[data-ring-fill]").forEach(el => {
    const c = 314;
    el.style.strokeDashoffset = c - (c * percent / 100);
  });
  const completed = $("#completedModules");
  if (completed) {
    completed.innerHTML = progress.length ? progress.map(id => {
      const m = modules.find(x => x.id === id);
      return m ? `<span class="pill">${m.icon} ${m.titleEn}</span>` : "";
    }).join("") : `<p>No modules completed yet. Open a module to start progress tracking.</p>`;
  }
  const quizState = getQuizState();
  $all("[data-quiz-total]").forEach(el => el.textContent = quizState.answered);
  $all("[data-quiz-score]").forEach(el => el.textContent = quizState.score);
}

function setupProgressPage() {
  if (!$("#resetProgress")) return;
  $("#resetProgress").addEventListener("click", () => {
    localStorage.removeItem("cmsk-progress-v3");
    renderProgressWidgets();
  });
  $("#resetQuizStats").addEventListener("click", () => {
    localStorage.removeItem("cmsk-quiz-v3");
    renderProgressWidgets();
  });
  $("#completeAll").addEventListener("click", () => {
    setProgress(modules.map(m => m.id));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  activeNav();
  renderHomePreview();
  renderModuleCards();
  renderModulePage();
  renderPractice();
  renderPhraseBank();
  renderProgressWidgets();
  setupProgressPage();
  attachListenButtons();
});
