// Bind handlers once so repeated selections do not create duplicate orders.
toys.forEach(function(toy) {
  var option = document.createElement("option"); option.value = toy.id; option.textContent = toy.toy_name;
  document.getElementById("toy-select").appendChild(option);
});
[
  { id: "order-button", text: "Add to order", action: handleOrder },
  { id: "order-summary-button", text: "Order summary", action: handleSummary },
  { id: "rating-button", text: "Rate toy", action: handleRatings }
].forEach(function(item) {
  var button = document.createElement("button"); button.id = item.id; button.textContent = item.text;
  button.addEventListener("click", item.action); document.getElementById("button-div").appendChild(button);
});
document.getElementById("toy-select").addEventListener("change", showToy);
document.getElementById("start-ar").addEventListener("click", startPreview);
document.getElementById("stop-ar").addEventListener("click", stopPreview);
document.getElementById("pay-button").addEventListener("click", function() {
  if (!cartTotal()) return;
  store.lastOrder = {
    id: "order-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10),
    items: toys.filter(function(toy) { return store.cart[toy.id] > 0; }).map(function(toy) { return store.cart[toy.id] + " × " + toy.toy_name; }).join(", "),
    total: cartTotal(), date: new Date().toISOString()
  };
  store.cart = {}; closeModal(); showLastOrder();
  showMessage("Demo order placed! No payment was taken."); saveStore();
  saveCloudOrder(store.lastOrder);
});
document.getElementById("rating-form").addEventListener("submit", function(event) {
  event.preventDefault();
  store.ratings[selectedToy.id] = { rating: Number(document.getElementById("rating-input").value), feedback: document.getElementById("feedback-input").value.trim() };
  saveCloudRating(selectedToy.id, store.ratings[selectedToy.id]);
  closeRatingModal(); showToy(); showMessage("Thanks for rating this toy!"); saveStore();
});
showToy(); showLastOrder();

document.getElementById("retry-cloud").addEventListener("click", async function() {
  if (store.lastOrder && cloudReady) { this.hidden = true; await saveCloudOrder(store.lastOrder); }
});
