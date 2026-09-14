/* ==========================================================================
   main.js — logique propre à index.html
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialise le lecteur audio (au cas où la musique aurait déjà été
  // démarrée puis que la personne revient sur index.html).
  ARG.audio.init("bg-music");

  const enterButton = document.getElementById("enter-button");
  if (!enterButton) return;

  let entering = false;

  enterButton.addEventListener("click", () => {
    if (entering) return; // évite un double-clic
    entering = true;

    ARG.audio.start();

    ARG.progress.unlock(ARG.progress.STEPS.ENTERED);
    ARG.transition.go("quiz.html");
  });
});