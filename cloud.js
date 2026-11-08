// Optional cloud persistence. The store works even when Firebase is unavailable.
var cloudUser = null;
var cloudDatabase = null;
var cloudReady = false;
var guestStorageKey = storageKey;
function cloudStatus(message) { document.getElementById("cloud-status").textContent = message; }
function loadCloudScript(url) {
  return new Promise(function(resolve, reject) {
    var script = document.createElement("script"); script.src = url;
    script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
  });
}
function switchLocalStore(key) {
  storageKey = key;
  store = readStore(key);
  showToy(); showLastOrder();
}
async function loadCloudData(user) {
  cloudReady = false;
  cloudUser = user;
  document.getElementById("retry-cloud").hidden = true;
  document.getElementById("sign-in").hidden = !!user;
  document.getElementById("sign-out").hidden = !user;
  switchLocalStore(user ? guestStorageKey + ":" + user.uid : guestStorageKey);
  if (!user) { cloudStatus("Local mode — sign in to save new orders and ratings across devices."); return; }
  cloudStatus("Loading your cloud saves…");
  try {
    var results = await Promise.all([
      cloudDatabase.collection("users").doc(user.uid).collection("ratings").get(),
      cloudDatabase.collection("users").doc(user.uid).collection("orders").orderBy("date", "desc").limit(1).get()
    ]);
    if (!cloudUser || cloudUser.uid !== user.uid) return;
    // Cloud is authoritative for signed-in ratings; guest data is kept separately.
    store.ratings = {};
    results[0].forEach(function(doc) {
      var data = doc.data();
      if (toys.some(function(toy) { return toy.id === doc.id; }) && Number.isInteger(data.rating) && data.rating >= 1 && data.rating <= 5 && typeof data.feedback === "string") store.ratings[doc.id] = data;
    });
    if (!results[1].empty) store.lastOrder = results[1].docs[0].data();
    cloudReady = true; saveStore(); showToy(); showLastOrder();
    cloudStatus("Signed in as " + (user.displayName || user.email || "a Google user") + ". New demo orders and ratings save to your account. Your cart stays on this device.");
  } catch (error) {
    cloudStatus("Cloud saves unavailable. Sign out and retry after checking your connection and Firebase rules. Changes currently save on this device only.");
  }
}
async function saveCloudRating(toyId, rating) {
  if (!cloudUser || !cloudReady) return;
  try {
    await cloudDatabase.collection("users").doc(cloudUser.uid).collection("ratings").doc(toyId).set(rating);
  } catch (error) { cloudStatus("Rating saved on this device, but cloud upload failed. Reconnect and submit the rating again to retry."); }
}
async function saveCloudOrder(order) {
  if (!cloudUser || !cloudReady) return;
  try {
    // Stable ID makes retries idempotent and prevents duplicate orders.
    await cloudDatabase.collection("users").doc(cloudUser.uid).collection("orders").doc(order.id).set(order);
  } catch (error) { cloudStatus("Order saved on this device, but cloud upload failed. No payment was taken. You can retry the cloud save below."); document.getElementById("retry-cloud").hidden = false; }
}
async function initializeCloud() {
  if (!window.toyFirebaseConfig) return;
  cloudStatus("Connecting to Firebase…");
  try {
    await loadCloudScript("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
    await loadCloudScript("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js");
    await loadCloudScript("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js");
    firebase.initializeApp(window.toyFirebaseConfig);
    cloudDatabase = firebase.firestore();
    document.getElementById("sign-in").addEventListener("click", async function() {
      try { await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
      catch (error) { cloudStatus("Sign-in did not finish. Allow popups and check that Google sign-in and this site's domain are enabled in Firebase, then retry."); }
    });
    document.getElementById("sign-out").addEventListener("click", async function() {
      try { await firebase.auth().signOut(); }
      catch (error) { cloudStatus("Could not sign out. Check your connection and retry."); }
    });
    firebase.auth().onAuthStateChanged(loadCloudData);
  } catch (error) { cloudStatus("Firebase could not load. Local mode is still available. Check the web configuration and internet connection, then reload."); }
}
initializeCloud();
