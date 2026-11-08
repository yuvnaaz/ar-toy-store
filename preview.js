// Shared status messages between the camera frame and store page.
function setARStatus(text) { document.getElementById("ar-status").textContent = text; }
window.addEventListener("message", function(event) {
  var frame = document.querySelector("#ar-preview iframe");
  if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
  if (event.data && event.data.type === "toy-ar-status" && typeof event.data.text === "string") setARStatus(event.data.text);
});
window.addEventListener("pagehide", stopPreview);
var viewer = document.getElementById("toy-viewer");
viewer.addEventListener("load", function() { document.getElementById("model-status").textContent = "Drag to rotate. Pinch or scroll to zoom."; });
viewer.addEventListener("error", function() { document.getElementById("model-status").textContent = "The 3D preview could not load. You can still browse and order toys. Check your connection and reload to retry."; });
setTimeout(function() {
  if (!customElements.get("model-viewer")) document.getElementById("model-status").textContent = "3D viewer unavailable. Check your internet connection and reload. The store still works.";
}, 12000);
