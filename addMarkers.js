// Local toy catalogue. Replace these entries with real product data when ready.
var toys = [
  { id: "crane", toy_name: "Hydraulic Crane", description: "A construction truck with a rotating crane and movable arm.", age_group: "8–10 years", price: 24.99 },
  { id: "train", toy_name: "Toy Train", description: "A colourful engine for imaginative railway adventures.", age_group: "3–6 years", price: 19.99 },
  { id: "robot", toy_name: "Toy Robot", description: "A friendly robot for space and science adventures.", age_group: "6–10 years", price: 29.99 }
];
var selectedToy = toys[0];
function showToy() {
  selectedToy = toys.find(function(toy) { return toy.id === document.getElementById("toy-select").value; }) || toys[0];
  document.getElementById("toy-name").textContent = selectedToy.toy_name;
  document.getElementById("toy-description").textContent = selectedToy.description;
  document.getElementById("toy-age").textContent = "Age: " + selectedToy.age_group;
  document.getElementById("toy-price").textContent = "Price: " + money(selectedToy.price);
  var rating = store.ratings[selectedToy.id];
  document.getElementById("toy-rating").textContent = rating ? "Your rating: " + rating.rating + "/5" + (rating.feedback ? " — " + rating.feedback : "") : "No rating yet.";
  var viewer = document.getElementById("toy-viewer");
  var modelPath = "./assets/" + selectedToy.id + ".gltf";
  if (viewer.getAttribute("src") !== modelPath) {
    viewer.src = modelPath;
    document.getElementById("model-status").textContent = "Loading 3D preview…";
  }
  viewer.alt = "3D model of " + selectedToy.toy_name;
  if (document.querySelector("#ar-preview iframe")) startPreview();
}
function startPreview() {
  if (!window.isSecureContext) { setARStatus("Camera requires HTTPS or localhost. Use the deployed HTTPS link on your phone."); return; }
  var frame = document.createElement("iframe");
  frame.title = "AR toy camera preview";
  frame.allow = "camera";
  frame.src = "./ar.html?v=4&toy=" + selectedToy.id;
  document.getElementById("ar-preview").replaceChildren(frame);
  document.getElementById("stop-ar").hidden = false;
  document.getElementById("start-ar").hidden = true;
  document.getElementById("ar-status").textContent = "Allow camera access when prompted, then scan the Hiro marker. Internet is required for AR libraries. If the preview stays blank, check camera permissions or stop and retry.";
}
function stopPreview() {
  document.getElementById("ar-preview").replaceChildren();
  document.getElementById("stop-ar").hidden = true;
  document.getElementById("start-ar").hidden = false;
  document.getElementById("ar-status").textContent = "Camera preview stopped.";
}
