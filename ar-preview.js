var cameraStream;
var cameraReady = false;
var cameraFailed = false;
var startupTimer;
var lastCameraError;
function report(text) {
  document.getElementById("status").textContent = text;
  window.parent.postMessage({ type: "toy-ar-status", text: text }, location.origin);
}
function stopCamera() {
  clearTimeout(startupTimer);
  if (cameraStream) cameraStream.getTracks().forEach(function(track) { track.stop(); });
  document.querySelectorAll("video").forEach(function(video) {
    if (video.srcObject) video.srcObject.getTracks().forEach(function(track) { track.stop(); });
  });
}
window.addEventListener("pagehide", stopCamera);
window.addEventListener("camera-init", function(event) {
  cameraReady = true;
  if (event.detail && event.detail.stream) cameraStream = event.detail.stream;
  if (cameraFailed) { stopCamera(); return; }
  clearTimeout(startupTimer);
  report("Camera ready. Point it at the Hiro marker.");
});
window.addEventListener("camera-error", function(event) {
  cameraFailed = true; stopCamera();
  var error = (event.detail && event.detail.error) || lastCameraError;
  var name = error && error.name;
  var text = "Camera could not start. Close other camera apps and retry.";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") text = "Camera access denied. Allow camera access in your browser settings, then stop and restart the preview.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") text = "No camera was found. Use the rotatable 3D preview instead.";
  report(text);
});
function loadScript(url) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement("script"); script.src = url;
    script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
  });
}
async function startAR() {
  if (!window.isSecureContext) { report("Camera requires HTTPS or localhost. Open the hosted HTTPS link on your phone."); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { report("This browser cannot access a camera. Open this page in Safari or Chrome, or use the 3D preview."); return; }
  // AR.js 3.4.5 omits CustomEvent.detail for camera errors and streams.
  // Capture the original API result here so permission messages remain useful.
  var getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(constraints) {
    return getUserMedia(constraints).then(function(stream) {
      cameraStream = stream;
      return stream;
    }).catch(function(error) { lastCameraError = error; throw error; });
  };
  try {
    await loadScript("https://aframe.io/releases/1.6.0/aframe.min.js");
    await loadScript("https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js");
    var toy = new URLSearchParams(location.search).get("toy");
    if (["crane", "train", "robot"].indexOf(toy) === -1) toy = "crane";
    var scene = document.createElement("a-scene");
    scene.setAttribute("embedded", ""); scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("renderer", "antialias: true; colorManagement: true");
    scene.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false;");
    var marker = document.createElement("a-marker"); marker.setAttribute("preset", "hiro");
    var model = document.createElement("a-entity");
    model.setAttribute("gltf-model", "./assets/" + toy + ".gltf");
    model.setAttribute("scale", "0.7 0.7 0.7");
    model.addEventListener("model-error", function() { report("The toy model could not load. Stop the preview and retry."); });
    marker.appendChild(model);
    marker.addEventListener("markerFound", function() { report("Marker found — move around it to explore the toy."); });
    marker.addEventListener("markerLost", function() { report("Marker lost. Keep the entire Hiro marker visible and well lit."); });
    scene.appendChild(marker);
    var camera = document.createElement("a-entity"); camera.setAttribute("camera", ""); scene.appendChild(camera);
    report("Starting camera. Allow camera access when prompted.");
    document.body.appendChild(scene);
    startupTimer = setTimeout(function() { if (!cameraReady && !cameraFailed) report("Still waiting for the camera. Check permission settings, or stop and retry in your phone’s browser."); }, 15000);
  } catch (error) { report("AR libraries could not load. Check your internet connection, then stop and retry."); }
}
startAR();
