/**
 * Background Service Worker
 * Used for lifecycle events and background processing.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Authenticator Pro: Background Service Worker initialized.');
});
