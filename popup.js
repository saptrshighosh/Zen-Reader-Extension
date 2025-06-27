// Get references to the UI elements once the DOM is loaded.
const readingModeGroup = document.getElementById('reading-mode-group');
const timerSwitch = document.getElementById('timer-switch');
const timerDisplay = document.getElementById('timer-display');
let timerInterval = null; 

/**
 * Formats milliseconds into a MM:SS string.
 * @param {number} ms
 * @returns {string} 
 */
function formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `( ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} )`;
}

/**
 * Fetches the timer state from the background script and updates the display.
 */
function updateTimerDisplay() {
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
            timerDisplay.textContent = '';
            return;
        }

        if (response.timerEnabled) {
            timerDisplay.textContent = formatTime(response.timeLeft);
        } else {
            timerDisplay.textContent = '';
        }
    });
}


/**
 * Sends a message to the content script in the active tab.
 * @param {object} message - The message object to send.
 */
const sendMessageToContentScript = async (message) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url.startsWith('http')) {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(`Could not send message: ${chrome.runtime.lastError.message}`);
            }
        });
    }
};

/**
 * Event listener for the reading mode radio buttons.
 */
const handleModeChange = (event) => {
    const selectedMode = event.target.value;
    chrome.storage.sync.set({ readingMode: selectedMode });
    sendMessageToContentScript({ type: 'CHANGE_MODE', mode: selectedMode });
};

/**
 * Event listener for the timer switch.
 */
const handleTimerChange = (event) => {
    const isEnabled = event.target.checked;
    chrome.storage.sync.set({ timerEnabled: isEnabled });
    chrome.runtime.sendMessage({ type: 'TOGGLE_TIMER', enabled: isEnabled });
};

/**
 * Loads saved settings from chrome.storage and updates the UI.
 */
const loadSettings = () => {
    chrome.storage.sync.get(['readingMode', 'timerEnabled'], (result) => {
        const savedMode = result.readingMode || 'off';
        const radioToCheck = document.getElementById(`mode-${savedMode}`);
        if (radioToCheck) {
            radioToCheck.checked = true;
        }
        const savedTimerState = result.timerEnabled || false;
        timerSwitch.checked = savedTimerState;
    });
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    readingModeGroup.addEventListener('change', handleModeChange);
    timerSwitch.addEventListener('change', handleTimerChange);
    
    // Immediately update timer and then start the 1-second interval
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
});
