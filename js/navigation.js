
window.ARG = (function () {
  "use strict";

  /* ---------------------- stockage sécurisé (try/catch) ---------------------- */

  const storage = {
    get(key) {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        /* sessionStorage indisponible (navigation privée stricte, etc.) :
           l'ARG continue de fonctionner, simplement sans mémorisation. */
      }
    },
  };

  /* ---------------------- progression de l'ARG ---------------------- */

  const STEPS = {
    ENTERED: "arg_entered",
    QUIZ_DONE: "arg_quiz_done",
    CODE_DONE: "arg_code_done",
    POEM_UNLOCKED: "arg_poem_unlocked",
  };

  const progress = {
    unlock(step) {
      storage.set(step, "true");
    },
    has(step) {
      return storage.get(step) === "true";
    },
    /**
     * Si l'étape requise n'est pas complétée, renvoie discrètement la
     * personne vers la page appropriée au lieu d'afficher une erreur.
     */
    require(step, redirectTo) {
      if (!progress.has(step)) {
        window.location.replace(redirectTo);
        return false;
      }
      return true;
    },
    STEPS,
  };

  /* ---------------------- transition visuelle entre pages ---------------------- */

  const transition = {
    /**
     * Affiche un voile qui s'assombrit puis navigue vers l'URL donnée.
     * Donne l'impression d'une vraie transition de scène plutôt qu'un
     * changement de page brut.
     */
    go(url, delay = 700) {
      const veil = document.createElement("div");
      veil.className = "veil";
      document.body.appendChild(veil);
      requestAnimationFrame(() => veil.classList.add("active"));
      window.setTimeout(() => {
        window.location.href = url;
      }, delay);
    },
  };

  /* ---------------------- musique de fond ---------------------- */

  const AUDIO_KEYS = {
    STARTED: "arg_audio_started",
    TIME: "arg_audio_time",
    MUTED: "arg_audio_muted",
  };

  const audio = {
    el: null,
    _saveInterval: null,

    /**
     * À appeler sur chaque page qui contient <audio id="bg-music">.
     * Restaure l'état précédent (position, muet) et tente de reprendre
     * la lecture si la musique avait déjà été démarrée par la personne
     * sur une page précédente.
     */
    init(elementId = "bg-music") {
      const el = document.getElementById(elementId);
      if (!el) return;
      this.el = el;
      el.volume = 0.35;
      el.loop = true;

      // Gestion propre de l'absence du fichier audio.
      el.addEventListener("error", () => {
        console.warn(
          "ARG: fichier audio introuvable ou illisible (assets/music/musique.mp3)."
        );
      });

      const wasStarted = storage.get(AUDIO_KEYS.STARTED) === "true";
      const wasMuted = storage.get(AUDIO_KEYS.MUTED) === "true";
      const savedTime = parseFloat(storage.get(AUDIO_KEYS.TIME) || "0");

      el.muted = wasMuted;
      this._updateToggleUI(wasMuted);

      if (wasStarted) {
        const resumePlayback = () => {
          if (savedTime > 0 && isFinite(savedTime)) {
            try {
              el.currentTime = savedTime;
            } catch (e) {
              /* certaines valeurs peuvent être invalides avant metadata */
            }
          }
          const playPromise = el.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              // Autoplay bloqué par le navigateur : on propose un léger
              // rappel discret plutôt que de forcer quoi que ce soit.
              this._showResumePrompt();
            });
          }
        };

        if (el.readyState >= 1) {
          resumePlayback();
        } else {
          el.addEventListener("loadedmetadata", resumePlayback, { once: true });
        }
      }

      this._bindToggle();
      this._bindPersistence();
    },

    /**
     * À appeler uniquement depuis le bouton "ENTRER" de index.html :
     * c'est le geste utilisateur qui autorise le navigateur à démarrer
     * un son non coupé.
     */
    start() {
      if (!this.el) return;
      storage.set(AUDIO_KEYS.STARTED, "true");
      const alreadyMuted = storage.get(AUDIO_KEYS.MUTED) === "true";
      this.el.muted = alreadyMuted;
      this.el.currentTime = 0;
      const playPromise = this.el.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          console.warn("ARG: lecture audio impossible pour le moment.", err);
        });
      }
    },

    toggleMute() {
      if (!this.el) return;
      this.el.muted = !this.el.muted;
      storage.set(AUDIO_KEYS.MUTED, this.el.muted ? "true" : "false");
      this._updateToggleUI(this.el.muted);
    },

    _bindToggle() {
      const btn = document.getElementById("sound-toggle");
      if (!btn) return;
      btn.addEventListener("click", () => {
        this.toggleMute();
        btn.classList.remove("pulse");
        // force reflow pour rejouer l'animation
        void btn.offsetWidth;
        btn.classList.add("pulse");
      });
    },

    _updateToggleUI(isMuted) {
      const btn = document.getElementById("sound-toggle");
      if (!btn) return;
      btn.textContent = isMuted ? "🔇" : "🔊";
      btn.setAttribute("data-state", isMuted ? "muted" : "unmuted");
      btn.setAttribute(
        "aria-label",
        isMuted ? "Réactiver le son" : "Couper le son"
      );
    },

    _showResumePrompt() {
      const prompt = document.getElementById("resume-audio");
      if (!prompt) return;
      prompt.classList.add("visible");
      const resume = () => {
        this.el.play().catch(() => {});
        prompt.classList.remove("visible");
        document.removeEventListener("click", resume);
      };
      prompt.addEventListener("click", resume, { once: true });
    },

    _bindPersistence() {
      const save = () => {
        if (!this.el) return;
        storage.set(AUDIO_KEYS.TIME, String(this.el.currentTime || 0));
      };
      // Sauvegarde périodique légère (pas à chaque frame).
      this._saveInterval = window.setInterval(save, 2000);
      window.addEventListener("pagehide", save);
      window.addEventListener("beforeunload", save);
    },
  };

  return { storage, progress, transition, audio };
})();