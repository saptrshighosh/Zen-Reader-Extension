(() => {
  // A variable to store the currently active reading mode.
  let currentMode = 'off';
  let breakOverlay = null; // To hold the break overlay element.
  let chime = null; // To hold the audio element.

  /**
   * Applies the specified reading mode by adding a class to the HTML element.
   * The actual styling is handled in content.css.
   * @param {string} mode - The mode to apply ('off', 'night', 'bw', 'paper').
   */
  const applyMode = (mode) => {
    // Remove any existing mode classes.
    document.documentElement.classList.remove('zen-mode-night', 'zen-mode-bw', 'zen-mode-paper');

    // Add the new mode class if it's not 'off'.
    if (mode !== 'off') {
      document.documentElement.classList.add(`zen-mode-${mode}`);
    }
    currentMode = mode;
  };

  /**
   * Creates and displays the overlay for the 20-20-20 break rule.
   */
  const takeBreak = () => {
    // If an overlay already exists, don't create another one.
    if (document.getElementById('zen-reader-break-overlay')) {
      return;
    }

    // Create the overlay element.
    breakOverlay = document.createElement('div');
    breakOverlay.id = 'zen-reader-break-overlay';
    breakOverlay.innerHTML = `
      <div class="zen-reader-break-message">
        <h1>Time for a break!</h1>
        <p>Look 20 feet away for 20 seconds to protect your eyes.</p>
        <p>The screen will return automatically.</p>
      </div>
    `;
    document.body.appendChild(breakOverlay);

    // Play a chime sound.
    if (!chime) {
      const chimeURL = chrome.runtime.getURL('assets/sounds/chime.mp3');
      chime = new Audio(chimeURL);
    }
    chime.play().catch(e => console.error("Audio playback failed:", e));

    // After 20 seconds, remove the overlay.
    setTimeout(() => {
      if (breakOverlay) {
        breakOverlay.remove();
        breakOverlay = null;
      }
    }, 20000); // 20 seconds
  };

  /**
   * Listens for messages from the popup or the background script.
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHANGE_MODE') {
      applyMode(message.mode);
    } else if (message.type === 'TAKE_BREAK') {
      takeBreak();
    }
  });

  /**
   * Immediately on load, check storage for the saved reading mode and apply it.
   * This ensures that new tabs or reloaded pages respect the current setting.
   */
  chrome.storage.sync.get('readingMode', (result) => {
    if (result.readingMode) {
      applyMode(result.readingMode);
    }
  });

})();
