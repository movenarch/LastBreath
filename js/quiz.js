
const QUESTIONS = [
  {
    question: "What is the best element ?",
    answers: [
      "[Fire]",
      "[Water]",
      "[Earth]",
      "[Air]",
    ],
    correct: 3,
    messages: {
      0: "That's not true.",
      1: "Almost.",
      2: "No.",
      3: "Indeed. N ",
    },
    allowRetry: true,
  },
  {
    question: "What is the best flower ?",
    answers: [
      "[Roses]",
      "[Peonies]",
      "[Tulips]",
      "[Sunflowers]",
    ],
    correct: 3,
    messages: {
      0: "That's just not true.",
      1: "I know..",
      2: "No.",
      3: "Exactly. I ",
    },
    allowRetry: true,
  },
  {
    question: "Do you want to be here ?",
    answers: [
      "[Yes..]",
      "[No..]",
    ],
    correct: 0,
    messages: {
      0: "Why ? L ",
      1: "I thought so",
    },
    allowRetry: true,
  },
  {
    question: "What is the best color ?",
    answers: [
      "[Blue]",
      "[Red]",
      "[black]",
      "[None]",
    ],
    correct: 0,
    messages: {
      0: "Right. A",
      1: "Nope",
      2: "No.",
      3: "Try again.",
    },
    allowRetry: true,
  },
  {
    question: "Do you wish to continue ?",
    answers: [
      "[Yes]",
      "[No]",
    ],
    correct: 0,
    messages: {
      0: "...  Y ",
      1: "Then go.. Please..",
    },
    allowRetry: true,
  },
  {
    question: "Are you sure ?",
    answers: [
      "[Yes]",
      "[No]",
    ],
    correct: 0,
    messages: {
      0: "...  Y ",
      1: "I won't hold you goodbye.",
    },
    allowRetry: true,
    allowRetry: true,
  },
];

/* ------------------------------------------------------------------------
   2) LE CODE SECRET À REMPLACER
   ------------------------------------------------------------------------
   - "enabled"      : mets à false pour passer directement à poem.html
                       une fois le quiz terminé, sans étape de code.
   - "answer"       : le code attendu (comparaison insensible à la casse
                       et aux espaces autour).
   - "wrongMessage" : message affiché si le code est incorrect.
   ------------------------------------------------------------------------ */
const CODE_CONFIG = {
  enabled: true,
  answer: "NILAY",
  wrongMessage: "You're not supposed to be here.",
};

/* Où envoyer la personne si elle échoue et choisit de quitter. */
const EXIT_URL = "index.html";

/* ========================================================================
   MOTEUR — pas besoin de modifier ce qui suit pour personnaliser le quiz.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (!ARG.progress.require(ARG.progress.STEPS.ENTERED, "index.html")) return;

  ARG.audio.init("bg-music");

  const state = {
    index: 0,
    locked: false,
  };

  const questionEl = document.getElementById("quiz-question");
  const answersEl = document.getElementById("quiz-answers");
  const messageEl = document.getElementById("quiz-message");
  const actionsEl = document.getElementById("quiz-actions");
  const dotsEl = document.getElementById("progress-dots");
  const codePanel = document.getElementById("code-panel");
  const quizPanel = document.getElementById("quiz-panel");

  renderDots();
  renderQuestion();

  function renderDots() {
    dotsEl.innerHTML = "";
    QUESTIONS.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.setAttribute("data-done", i < state.index ? "true" : "false");
      dotsEl.appendChild(dot);
    });
  }

  function renderQuestion() {
    const q = QUESTIONS[state.index];
    state.locked = false;
    messageEl.textContent = "";
    actionsEl.innerHTML = "";
    questionEl.textContent = q.question;
    answersEl.innerHTML = "";

    q.answers.forEach((answerText, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "quiz-answer";
      btn.type = "button";
      btn.textContent = answerText;
      btn.addEventListener("click", () => handleAnswer(i, btn));
      li.appendChild(btn);
      answersEl.appendChild(li);
    });
  }

  function handleAnswer(selectedIndex, btnEl) {
    if (state.locked) return;
    state.locked = true;

    const q = QUESTIONS[state.index];
    const isCorrect = selectedIndex === q.correct;

    // Désactive tous les boutons et marque la sélection.
    Array.from(answersEl.querySelectorAll(".quiz-answer")).forEach((b) => {
      b.disabled = true;
    });
    btnEl.setAttribute("data-selected", "true");

    const customMessage = q.messages && q.messages[selectedIndex];

    if (isCorrect) {
      messageEl.textContent = customMessage || "...";
      window.setTimeout(advance, 900);
    } else {
      messageEl.textContent = customMessage || "Tu n'es pas la personne attendue.";
      showFailureActions(q.allowRetry !== false);
    }
  }

  function showFailureActions(allowRetry) {
    actionsEl.innerHTML = "";

    if (allowRetry) {
      const retry = document.createElement("button");
      retry.className = "ghost-button";
      retry.type = "button";
      retry.textContent = "Réessayer";
      retry.addEventListener("click", renderQuestion);
      actionsEl.appendChild(retry);
    }

    const leave = document.createElement("button");
    leave.className = "ghost-button";
    leave.type = "button";
    leave.textContent = "Quitter";
    leave.addEventListener("click", () => {
      ARG.transition.go(EXIT_URL);
    });
    actionsEl.appendChild(leave);
  }

  function advance() {
    state.index += 1;
    renderDots();

    if (state.index >= QUESTIONS.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  function finishQuiz() {
    ARG.progress.unlock(ARG.progress.STEPS.QUIZ_DONE);
    questionEl.textContent = "Vérification terminée.";
    answersEl.innerHTML = "";
    messageEl.textContent = "Tu peux continuer.";
    actionsEl.innerHTML = "";

    window.setTimeout(() => {
      if (CODE_CONFIG.enabled) {
        quizPanel.classList.add("hidden-step");
        codePanel.classList.remove("hidden-step");
        setupCodePanel();
      } else {
        ARG.progress.unlock(ARG.progress.STEPS.CODE_DONE);
        ARG.transition.go("poem.html");
      }
    }, 1400);
  }

  function setupCodePanel() {
    const input = document.getElementById("code-input");
    const submit = document.getElementById("code-submit");
    const codeMessage = document.getElementById("code-message");

    input.focus();

    function trySubmit() {
      const value = input.value.trim().toLowerCase();
      const expected = CODE_CONFIG.answer.trim().toLowerCase();

      if (value.length === 0) return;

      if (value === expected) {
        ARG.progress.unlock(ARG.progress.STEPS.CODE_DONE);
        codeMessage.textContent = "";
        ARG.transition.go("poem.html");
      } else {
        codeMessage.textContent = CODE_CONFIG.wrongMessage;
        input.select();
      }
    }

    submit.addEventListener("click", trySubmit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") trySubmit();
    });
  }
});