// Store money as cents while calculating totals.
var storageKey = "toy-store-demo-v1";
function readStore(key) {
  var clean = { cart: {}, ratings: {}, lastOrder: null };
  try {
    var saved = JSON.parse(localStorage.getItem(key));
    if (!saved || typeof saved !== "object") return clean;
    toys.forEach(function(toy) {
      var quantity = saved.cart && saved.cart[toy.id];
      if (Number.isInteger(quantity) && quantity > 0 && quantity <= 99) clean.cart[toy.id] = quantity;
      var rating = saved.ratings && saved.ratings[toy.id];
      if (rating && Number.isInteger(rating.rating) && rating.rating >= 1 && rating.rating <= 5 && typeof rating.feedback === "string") clean.ratings[toy.id] = { rating: rating.rating, feedback: rating.feedback.slice(0,500) };
    });
    var order = saved.lastOrder;
    if (order && typeof order.items === "string" && Number.isSafeInteger(order.total) && order.total > 0 && !isNaN(Date.parse(order.date))) clean.lastOrder = order;
  } catch (error) { /* Corrupt or unavailable storage starts a clean session. */ }
  return clean;
}
var store = readStore(storageKey);
function money(value) { return "$" + value.toFixed(2); }
function saveStore() {
  try { localStorage.setItem(storageKey, JSON.stringify(store)); return true; }
  catch (error) { showMessage("Browser storage is unavailable. Changes will last only for this session."); return false; }
}
function showMessage(message) { document.getElementById("message").textContent = message; }
function cartTotal() {
  return toys.reduce(function(total, toy) { return total + Math.round(toy.price * 100) * (store.cart[toy.id] || 0); }, 0);
}
function handleOrder() {
  if ((store.cart[selectedToy.id] || 0) >= 99) { showMessage("Maximum quantity is 99 per toy."); return; }
  store.cart[selectedToy.id] = (store.cart[selectedToy.id] || 0) + 1;
  showMessage(selectedToy.toy_name + " added to your order.");
  saveStore();
}
function handleSummary() {
  var body = document.getElementById("bill-user-body");
  body.replaceChildren();
  toys.forEach(function(toy) {
    var quantity = store.cart[toy.id] || 0;
    if (!quantity) return;
    var row = document.createElement("tr");
    [toy.toy_name, money(toy.price), quantity, money(Math.round(toy.price * 100) * quantity / 100)].forEach(function(value) {
      var cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell);
    });
    var action = document.createElement("td");
    var remove = document.createElement("button"); remove.textContent = "Remove one";
    remove.setAttribute("aria-label", "Remove one " + toy.toy_name);
    remove.onclick = function() { store.cart[toy.id] -= 1; saveStore(); handleSummary(); };
    action.appendChild(remove); row.appendChild(action); body.appendChild(row);
  });
  var total = cartTotal();
  document.getElementById("total-bill").textContent = total ? "Total: " + money(total / 100) : "Your order is empty.";
  document.getElementById("pay-button").disabled = !total;
  var modal = document.getElementById("modal-div");
  if (!modal.open) modal.showModal();
}
function closeModal() { document.getElementById("modal-div").close(); }
function closeRatingModal() { document.getElementById("rating-modal-div").close(); }
function handleRatings() {
  var rating = store.ratings[selectedToy.id];
  document.getElementById("rating-title").textContent = "Rate " + selectedToy.toy_name;
  document.getElementById("rating-input").value = rating ? rating.rating : "5";
  document.getElementById("feedback-input").value = rating ? rating.feedback : "";
  document.getElementById("rating-modal-div").showModal();
}
function showLastOrder() {
  if (!store.lastOrder) { document.getElementById("last-order").textContent = "No orders placed yet."; return; }
  document.getElementById("last-order").textContent = store.lastOrder.items + " — " + money(store.lastOrder.total / 100) + " (demo order, " + new Date(store.lastOrder.date).toLocaleString() + ")";
}
