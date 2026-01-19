import { QUESTIONS } from "./questions.js";

const STORAGE_ANSWERS = "brwom_answers";
const STORAGE_INDEX = "brwom_index";
const STORAGE_SCALE_VERSION = "brwom_scale_version";
const SCALE_VERSION = "3-point";
const app = document.querySelector("#app");

const LIKERT_OPTIONS = [
  { value: 3, label: "Ja" },
  { value: 2, label: "Vielleicht" },
  { value: 1, label: "Nein" },
];

const CATEGORY_LABELS = {
  Motivation: "Motivation/Antrieb",
  Zeit: "Zeit & Belastbarkeit",
  Kommunikation: "Kommunikation & Empathie",
  Konflikt: "Konfliktfähigkeit & Mut",
  Rückhalt: "Team/Rückhalt & Vernetzung",
};

// Zentrale App-Statestruktur: aktueller Index + Antworten.
const state = {
  index: 0,
  answers: {},
};

// Speichert Antworten und Index in localStorage.
function saveState() {
  localStorage.setItem(STORAGE_ANSWERS, JSON.stringify(state.answers));
  localStorage.setItem(STORAGE_INDEX, String(state.index));
  localStorage.setItem(STORAGE_SCALE_VERSION, SCALE_VERSION);
}

// Lädt gespeicherten Zustand (falls vorhanden).
function loadState() {
  const storedScaleVersion = localStorage.getItem(STORAGE_SCALE_VERSION);
  if (storedScaleVersion && storedScaleVersion !== SCALE_VERSION) {
    clearState();
    return;
  }
  const storedAnswers = localStorage.getItem(STORAGE_ANSWERS);
  const storedIndex = localStorage.getItem(STORAGE_INDEX);
  if (storedAnswers) {
    state.answers = JSON.parse(storedAnswers);
  }
  if (storedIndex) {
    state.index = Number.parseInt(storedIndex, 10) || 0;
  }
  if (Object.values(state.answers).some((value) => value > 3)) {
    clearState();
    return;
  }
  if (state.index >= QUESTIONS.length) {
    state.index = QUESTIONS.length - 1;
  }
}

// Setzt den Zustand zurück und entfernt gespeicherte Daten.
function clearState() {
  localStorage.removeItem(STORAGE_ANSWERS);
  localStorage.removeItem(STORAGE_INDEX);
  localStorage.removeItem(STORAGE_SCALE_VERSION);
  state.answers = {};
  state.index = 0;
}

function renderStart() {
  const hasSaved = Object.keys(state.answers).length > 0;
  app.innerHTML = `
    <h1>BR-Wahl-O-Mat</h1>
    <p class="muted">Soll ich mich zur Betriebsratswahl aufstellen lassen?</p>
    <p>Dieser Selbstcheck hilft dir, deine Motivation, Belastbarkeit und Kommunikationsstärke einzuschätzen.</p>
    <p class="muted">Keine Rechtsberatung. Nur ein Selbstcheck.</p>
    ${
      hasSaved
        ? `
        <div class="button-row">
          <button id="continue">Fortsetzen</button>
          <button class="secondary" id="reset">Neu starten</button>
        </div>
      `
        : `
        <div class="button-row">
          <button id="start">Start</button>
        </div>
      `
    }
  `;

  if (hasSaved) {
    app.querySelector("#continue").addEventListener("click", () => {
      renderQuestion();
    });
    app.querySelector("#reset").addEventListener("click", () => {
      clearState();
      renderStart();
    });
  } else {
    app.querySelector("#start").addEventListener("click", () => {
      renderQuestion();
    });
  }
}

// Rendert die aktuelle Frage inkl. Fortschritt und Likert-Skala.
function renderQuestion() {
  const question = QUESTIONS[state.index];
  const total = QUESTIONS.length;
  const selectedValue = state.answers[question.id];
  const progressPercent = Math.round(((state.index + 1) / total) * 100);

  app.innerHTML = `
    <div class="progress">
      <div class="muted">Frage ${state.index + 1}/${total}</div>
      <div class="progress-bar" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
        <span style="width: ${progressPercent}%"></span>
      </div>
    </div>
    <div class="question">${question.text}</div>
    <form class="likert" id="likert-form">
      ${LIKERT_OPTIONS.map(
        (option) => `
        <label>
          <input type="radio" name="likert" value="${option.value}" ${
            Number(selectedValue) === option.value ? "checked" : ""
          } />
          <span>${option.label}</span>
        </label>
      `
      ).join("")}
    </form>
    <div class="button-row">
      <button class="secondary" id="back" ${state.index === 0 ? "disabled" : ""}>Zurück</button>
      <button class="ghost" id="save">Speichern</button>
      <button id="next" ${selectedValue ? "" : "disabled"}>
        ${state.index === total - 1 ? "Auswerten" : "Weiter"}
      </button>
    </div>
  `;

  const form = app.querySelector("#likert-form");
  const nextButton = app.querySelector("#next");

  form.addEventListener("change", (event) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      state.answers[question.id] = value;
      nextButton.disabled = false;
      saveState();
    }
  });

  app.querySelector("#back").addEventListener("click", () => {
    if (state.index > 0) {
      state.index -= 1;
      saveState();
      renderQuestion();
    }
  });

  app.querySelector("#save").addEventListener("click", () => {
    saveState();
  });

  nextButton.addEventListener("click", () => {
    if (!state.answers[question.id]) {
      return;
    }
    if (state.index < total - 1) {
      state.index += 1;
      saveState();
      renderQuestion();
    } else {
      saveState();
      renderResult();
    }
  });
}

// Berechnet Gesamt- und Kategorie-Scores (jeweils 0–100).
function calculateScores() {
  const categoryStats = {};
  let points = 0;
  let minPoints = 0;
  let maxPoints = 0;

  QUESTIONS.forEach((question) => {
    if (!categoryStats[question.category]) {
      categoryStats[question.category] = { points: 0, min: 0, max: 0 };
    }
    const rawValue = state.answers[question.id] || 1;
    const adjustedValue = question.reverseScoring ? 4 - rawValue : rawValue;
    const weighted = adjustedValue * question.weight;
    points += weighted;
    minPoints += 1 * question.weight;
    maxPoints += 3 * question.weight;

    categoryStats[question.category].points += weighted;
    categoryStats[question.category].min += 1 * question.weight;
    categoryStats[question.category].max += 3 * question.weight;
  });

  const normalized = Math.round(((points - minPoints) / (maxPoints - minPoints)) * 100);

  const categoryScores = Object.entries(categoryStats).reduce((acc, [key, stats]) => {
    acc[key] = Math.round(((stats.points - stats.min) / (stats.max - stats.min)) * 100);
    return acc;
  }, {});

  return { total: normalized, categories: categoryScores };
}

// Liefert das Label für die Ergebnis-Kategorie.
function scoreLabel(score) {
  if (score <= 35) return "Eher nicht";
  if (score <= 55) return "Unentschlossen";
  if (score <= 75) return "Gute Voraussetzungen";
  return "Sehr passend";
}

// Erstellt personalisierte Hinweise basierend auf den Scores.
function buildHints(totalScore, categoryScores) {
  const hints = [];

  if (categoryScores.Zeit < 45) {
    hints.push(
      "Der Zeitaufwand kann erheblich sein. Plane realistisch, sprich mit deinem Umfeld und nutze Team-Unterstützung."
    );
  }
  if (categoryScores.Konflikt < 45) {
    hints.push(
      "Konflikte gehören zum Amt. Schulungen, Gesprächsführung und Unterstützung im Gremium können helfen."
    );
  }
  if (categoryScores.Kommunikation < 45) {
    hints.push(
      "Aktives Zuhören, Moderation und Feedback-Methoden stärken deine Kommunikationswirkung."
    );
  }
  if (categoryScores.Motivation >= 70 && categoryScores.Rückhalt < 50) {
    hints.push(
      "Deine Motivation ist stark. Baue gezielt Rückhalt auf, sprich mit Kolleginnen/Kollegen und suche Verbündete."
    );
  }
  if (totalScore >= 76) {
    hints.push(
      "Sehr gute Basis – informiere dich jetzt über Kandidatur, Listen und Fristen im Unternehmen."
    );
  }
  if (totalScore <= 35) {
    hints.push(
      "Vielleicht ist gerade nicht der richtige Zeitpunkt. Prüfe Alternativen wie unterstützende Rollen im Umfeld des Betriebsrats."
    );
  }

  if (hints.length < 3) {
    hints.push(
      "Suche das Gespräch mit erfahrenen Betriebsratsmitgliedern, um ein realistisches Bild vom Alltag zu bekommen."
    );
    hints.push(
      "Halte dir Zeit für Qualifizierung frei – Schulungen helfen beim Einstieg."
    );
  }

  return hints.slice(0, 5);
}

// Erzeugt den kopierbaren Ergebnistext.
function buildResultText(totalScore, label, categoryScores, hints) {
  const categoryLines = Object.entries(categoryScores)
    .map(([key, value]) => `${CATEGORY_LABELS[key]}: ${value}/100`)
    .join("\n");

  return `BR-Wahl-O-Mat Ergebnis\nGesamtscore: ${totalScore}/100 (${label})\n\n${categoryLines}\n\nHinweise:\n- ${hints.join(
    "\n- "
  )}`;
}

// Rendert die Ergebnisansicht inkl. Accordion und Aktionen.
function renderResult() {
  const { total, categories } = calculateScores();
  const label = scoreLabel(total);
  const hints = buildHints(total, categories);

  app.innerHTML = `
    <h2>Dein Ergebnis</h2>
    <div class="badge">${label}</div>
    <div class="result-score">${total}/100</div>
    <p class="muted">Deine Einstufung basiert auf den Antworten im Fragebogen.</p>

    <div class="details-list">
      ${Object.entries(categories)
        .map(
          ([key, value]) => `
          <details open>
            <summary>${CATEGORY_LABELS[key]}</summary>
            <div class="muted">${value}/100</div>
            <div class="category-bar"><span style="width:${value}%"></span></div>
          </details>
        `
        )
        .join("")}
    </div>

    <h3>Persönliche Hinweise</h3>
    <ul class="hints">
      ${hints.map((hint) => `<li>${hint}</li>`).join("")}
    </ul>

    <div class="button-row">
      <button id="copy">Ergebnis als Text kopieren</button>
      <button class="secondary" id="restart">Neu starten</button>
    </div>
  `;

  const copyButton = app.querySelector("#copy");
  const restartButton = app.querySelector("#restart");

  copyButton.addEventListener("click", async () => {
    const text = buildResultText(total, label, categories, hints);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    copyButton.textContent = "Kopiert!";
    setTimeout(() => {
      copyButton.textContent = "Ergebnis als Text kopieren";
    }, 2000);
  });

  restartButton.addEventListener("click", () => {
    clearState();
    renderStart();
  });
}

loadState();
renderStart();
