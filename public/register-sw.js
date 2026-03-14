if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  }).then(function(reg) {
    console.log('SW registered from inline script');
  }).catch(function(err) {
    console.error('SW inline reg failed:', err);
  });
}
