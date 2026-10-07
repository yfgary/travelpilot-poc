(function(){
'use strict';
if(window.MultiTripRuntime&&window.MultiTripRuntime.__v1)return;
const src='assets/multi-trip-runtime-v1.js?v=10.17.0';
if(document.readyState==='loading'){
  document.write('<script src="'+src+'"><'+'/script>');
  return;
}
if(document.querySelector('script[src^="assets/multi-trip-runtime-v1.js"]'))return;
const s=document.createElement('script');
s.src=src;
s.async=false;
s.dataset.multiTripCompatibilityShim='attraction-info';
document.head.appendChild(s);
})();
