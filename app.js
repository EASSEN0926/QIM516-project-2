function $(selector, root = document) { return root.querySelector(selector); }
function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

function sameAnswer(a, b) {
  return String(a || "").trim().normalize("NFC") === String(b || "").trim().normalize("NFC");
}

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
  console.warn("TTS is disabled. This website only uses recorded audio files.", text);
}

const CMSK_AUDIO_FILE_MAP = {
  "canteen-01": "audio/canteen-01.m4a",
  "canteen-02": "audio/canteen-02.m4a",
  "canteen-03": "audio/canteen-03.m4a",
  "canteen-04": "audio/canteen-04.m4a",
  "canteen-05": "audio/canteen-05.m4a",
  "canteen-06": "audio/canteen-06.m4a",
  "canteen-07": "audio/canteen-07.m4a",
  "canteen-08": "audio/canteen-08.m4a",
  "office-01": "audio/office-01.m4a",
  "office-02": "audio/office-02.m4a",
  "office-03": "audio/office-03.m4a",
  "office-04": "audio/office-04.m4a",
  "office-05": "audio/office-05.m4a",
  "office-06": "audio/office-06.m4a",
  "office-07": "audio/office-07.m4a",
  "office-08": "audio/office-08.m4a",
  "clinic-01": "audio/clinic-01.m4a",
  "clinic-02": "audio/clinic-02.m4a",
  "clinic-03": "audio/clinic-03.m4a",
  "clinic-04": "audio/clinic-04.m4a",
  "clinic-05": "audio/clinic-05.mp3",
  "clinic-06": "audio/clinic-06.mp3",
  "clinic-07": "audio/clinic-07.mp3",
  "clinic-08": "audio/clinic-08.mp3",
  "directions-01": "audio/directions-01.mp3",
  "directions-02": "audio/directions-02.mp3",
  "directions-03": "audio/directions-03.mp3",
  "directions-04": "audio/directions-04.mp3",
  "directions-05": "audio/directions-05.mp3",
  "directions-06": "audio/directions-06.mp3",
  "directions-07": "audio/directions-07.mp3",
  "directions-08": "audio/directions-08.mp3",
  "transport-01": "audio/transport-01.mp3",
  "transport-02": "audio/transport-02.mp3",
  "transport-03": "audio/transport-03.mp3",
  "transport-04": "audio/transport-04.mp3",
  "transport-05": "audio/transport-05.mp3",
  "transport-06": "audio/transport-06.mp3",
  "transport-07": "audio/transport-07.mp3",
  "transport-08": "audio/transport-08.mp3",
  "emergency-01": "audio/emergency-01.mp3",
  "emergency-02": "audio/emergency-02.mp3",
  "emergency-03": "audio/emergency-03.mp3",
  "emergency-04": "audio/emergency-04.mp3",
  "emergency-05": "audio/emergency-05.mp3",
  "emergency-06": "audio/emergency-06.mp3",
  "emergency-07": "audio/emergency-07.mp3",
  "emergency-08": "audio/emergency-08.mp3",
  "emergency-09": "audio/emergency-09.mp3",
  "emergency-10": "audio/emergency-10.mp3"
};

let currentPhraseAudio = null;

function normalizePhrase(raw) {
  if (Array.isArray(raw)) {
    return phraseObj(raw);
  }
  return raw || {};
}

function playPhrase(rawPhrase) {
  const phrase = normalizePhrase(rawPhrase);
  const phraseId = phrase.id || "";
  const exactSrc = CMSK_AUDIO_FILE_MAP[phraseId];

  if (!exactSrc) {
    console.error("No matching recorded audio file for phrase:", phraseId, phrase.ms || rawPhrase);
    return;
  }

  if (currentPhraseAudio) {
    currentPhraseAudio.pause();
    currentPhraseAudio.currentTime = 0;
    currentPhraseAudio = null;
  }

  const audio = new Audio();
  currentPhraseAudio = audio;

  audio.preload = "auto";
  audio.src = encodeURI(exactSrc);

  audio.onerror = () => {
    console.error("Recorded audio file could not be loaded:", exactSrc);
  };

  const playPromise = audio.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      // No pop-up alert. Some browsers may reject a play promise if another click interrupts it.
      // The user can simply click the Listen button again.
      console.warn("Audio play promise was rejected:", exactSrc, error);
    });
  }
}
function phraseFromButton(btn) {
  const id = btn.dataset.phraseId;

  for (const m of modules) {
    const found = m.phrases.find(p => {
      if (Array.isArray(p)) return p[0] === id;
      return p.id === id;
    });

    if (found) {
      return normalizePhrase(found);
    }
  }

  console.error("No phrase data found for button id:", id);
  return null;
}
function attachListenButtons(root = document) {
  $all("[data-phrase-id]", root).forEach(btn => {
    btn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const phrase = phraseFromButton(btn);
      if (phrase) playPhrase(phrase);
    };
  });

  // TTS is intentionally disabled. The website only uses recorded audio files.
  $all("[data-say]", root).forEach(btn => {
    btn.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.warn("TTS is disabled. Use recorded audio files only.");
    };
  });
}
function phraseObj(arr) {
  return { id: arr[0], ms: arr[1], en: arr[2], zh: arr[3], note: arr[4], audio: arr[5] };
}

const moduleImageMap = {
  canteen: "assets/canteen-scene.png",
  office: "assets/office-scene.png",
  clinic: "assets/clinic-scene.png",
  directions: "assets/directions-scene.png",
  transport: "assets/transport-scene.png",
  emergency: "assets/emergency-scene.png"
};

function moduleCardHTML(m) {
  const imageSrc = moduleImageMap[m.id] || "assets/hero-campus.png";

  return `<a class="card module-card" href="module.html?m=${m.id}">
    <div class="module-card-image">
      <img src="${imageSrc}" alt="${m.titleEn} scene" loading="lazy" onerror="this.parentElement.style.display='none'">
    </div>
    <div class="module-card-body">
      <span class="icon-badge">${m.icon}</span>
      <p class="ms-title">${m.titleMs}</p>
      <h3>${m.titleEn}<br><span style="font-size:.92rem;color:#667773">${m.titleZh}</span></h3>
      <p>${m.summaryEn}<br>${m.summaryZh}</p>
      <div class="module-meta">
        <span class="pill">${m.level}</span>
        <span class="pill orange-pill">Open →</span>
      </div>
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

    <section class="section module-scene-section">
      <div class="module-scene-wide">
        <img src="${moduleImageMap[m.id] || "assets/hero-campus.png"}" alt="${m.titleEn} scene" loading="lazy" onerror="this.parentElement.style.display='none'">
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
        <p>Click Listen to hear the recorded pronunciation for this phrase.</p>
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
        if (btn.disabled) return;

        const selected = btn.textContent;
        const isCorrect = sameAnswer(selected, answer);

        $all(".option", box).forEach(o => {
          o.disabled = true;
          if (sameAnswer(o.textContent, answer)) {
            o.classList.add("correct");
          }
        });

        if (isCorrect) {
          feedback.textContent = "Correct. Good job.";
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
  const displayedOptions = shuffle([...item.options]);
  const progress = Math.round(((qIndex + 1) / quizData.length) * 100);

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
      ${displayedOptions.map((opt, index) => `<button class="option" data-idx="${index}">${opt}</button>`).join("")}
    </div>
    <div class="feedback" aria-live="polite"></div>
    <div class="actions">
      <button class="btn secondary" id="nextQ" disabled>Next</button>
      <button class="btn danger" id="resetLiveQuiz">Reset this attempt</button>
    </div>
  `;

  const feedback = $(".feedback", card);

  $all(".option", card).forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const selected = displayedOptions[Number(btn.dataset.idx)];
      const isCorrect = sameAnswer(selected, item.answer);

      completedNow++;

      $all(".option", card).forEach(o => {
        o.disabled = true;
        const optionValue = displayedOptions[Number(o.dataset.idx)];
        if (sameAnswer(optionValue, item.answer)) {
          o.classList.add("correct");
        }
      });

      if (isCorrect) {
        liveScore++;
        feedback.textContent = `Correct. ${item.explanation}`;
        feedback.className = "feedback good";
      } else {
        btn.classList.add("wrong");
        feedback.textContent = `Not quite. Correct answer: ${item.answer}. ${item.explanation}`;
        feedback.className = "feedback bad";
      }

      const nextButton = $("#nextQ");
      if (nextButton) nextButton.disabled = false;

      const saved = getQuizState();
      setQuizState({
        score: saved.score + (isCorrect ? 1 : 0),
        answered: saved.answered + 1
      });
    });
  });

  $("#nextQ").addEventListener("click", () => {
    qIndex = (qIndex + 1) % quizData.length;
    renderPractice();
  });

  $("#resetLiveQuiz").addEventListener("click", () => {
    qIndex = 0;
    liveScore = 0;
    completedNow = 0;
    renderPractice();
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

console.log("Campus Malay audio app loaded: exact recorded audio only, no alerts, no TTS, v4");

console.log("Campus Malay practice restored v11: quiz card renders and answers are compared safely.");
