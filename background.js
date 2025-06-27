// A constant for our alarm name.
const EYE_CARE_ALARM_NAME = 'zen-reader-eye-care-alarm';

/**
 * Handles the initial setup of the extension when it's first installed.
 * It sets default values in storage to ensure the extension works correctly
 * from the start.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Zen Reader extension installed.');

  // Set default values for settings on installation.
  chrome.storage.sync.set({
    readingMode: 'off',
    timerEnabled: false
  });
});

/**
 * Listens for messages from other parts of the extension, like the popup.
 * This is used to start or stop the eye-care timer.
 */
/**
 * Listens for messages from other parts of the extension.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle toggling the timer on/off
  if (message.type === 'TOGGLE_TIMER') {
    if (message.enabled) {
      // Create a recurring alarm that fires every 1 minute for testing.
      chrome.alarms.create(EYE_CARE_ALARM_NAME, {
        delayInMinutes: 20,
        periodInMinutes: 20
      });
      console.log('Eye-care alarm created for 20 minute.');
    } else {
      // Clear the alarm if the timer is disabled.
      chrome.alarms.clear(EYE_CARE_ALARM_NAME);
      console.log('Eye-care alarm cleared.');
    }
  }
  // Handle requests from the popup to get the current timer state
  else if (message.type === 'GET_TIMER_STATE') {
    chrome.alarms.get(EYE_CARE_ALARM_NAME, (alarm) => {
      if (alarm) {
        const timeLeft = alarm.scheduledTime - Date.now();
        sendResponse({ timerEnabled: true, timeLeft: timeLeft });
      } else {
        sendResponse({ timerEnabled: false, timeLeft: 0 });
      }
    });
    // This is crucial! It keeps the message channel open for the async response.
    return true;
  }
});

/**
 * Listens for when any alarm is fired.
 * If it's our eye-care alarm, it notifies all active tabs.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === EYE_CARE_ALARM_NAME) {
    console.log('Eye-care alarm fired. Time for a break!');
    
    // Find all currently open tabs.
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
 
        if (tab.id) {
            try {
                 chrome.tabs.sendMessage(tab.id, { type: 'TAKE_BREAK' });
            } catch (e) {
                console.warn(`Could not send message to tab ${tab.id}: ${e.message}`);
            }
        }
      });
    });
  }
});
