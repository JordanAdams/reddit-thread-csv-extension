export default defineContentScript({
  matches: ['*://*.reddit.com/*'],
  main() {
    console.log('Hello content.');
  },
});
