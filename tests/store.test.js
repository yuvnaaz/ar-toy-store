// Run with node tests/store.test.js. No test dependencies required.
var assert = require('assert');
var vm = require('vm');
var fs = require('fs');
var elements = {};
function element() {
  return { value: '', textContent: '', children: [], hidden: false, open: false,
    appendChild: function(child) { this.children.push(child); }, replaceChildren: function() { this.children = []; },
    setAttribute: function() {}, getAttribute: function() { return ""; }, addEventListener: function(type, fn) { this[type] = fn; },
    showModal: function() { this.open = true; }, close: function() { this.open = false; } };
}
var memory = {};
var context = vm.createContext({
  console: console, Date: Date, Math: Math, Number: Number, JSON: JSON,
  document: { getElementById: function(id) { return elements[id] || (elements[id] = element()); }, createElement: element, querySelector: function() { return null; } },
  localStorage: { getItem: function(key) { return memory[key] || null; }, setItem: function(key,value) { memory[key] = value; } },
  window: { toyFirebaseConfig: null },
  setARStatus: function() {}, saveCloudOrder: function() {}, saveCloudRating: function() {}
});
['addMarkers.js','markerHandler.js','addButtons.js','cloud.js'].forEach(function(file) { vm.runInContext(fs.readFileSync(file,'utf8'), context); });
function run(code) { return vm.runInContext(code,context); }
run('selectedToy = toys[0]; handleOrder(); handleOrder(); selectedToy = toys[1]; handleOrder()');
assert.equal(run('cartTotal()'),6997,'mixed cart totals use cents');
run('handleSummary()');
assert.equal(elements['bill-user-body'].children.length,2);
assert.equal(elements['total-bill'].textContent,'Total: $69.97');
// Remove one crane using its rendered action.
elements['bill-user-body'].children[0].children[4].children[0].onclick();
assert.equal(run('cartTotal()'),4498);
run('saveStore(); store = readStore(storageKey)');
assert.equal(run('cartTotal()'),4498,'cart persists');
elements['pay-button'].click();
assert.equal(run('cartTotal()'),0,'checkout clears cart');
assert.equal(run('store.lastOrder.total'),4498);
assert.ok(run('store.lastOrder.id').startsWith('order-'));
run('handleSummary()'); assert.equal(elements['pay-button'].disabled,true,'empty checkout disabled');
elements['toy-select'].value='train'; run('showToy(); handleRatings()');
elements['rating-input'].value='4'; elements['feedback-input'].value='<script>hello</script>';
elements['rating-form'].submit({preventDefault:function(){}});
run('store = readStore(storageKey); showToy()');
assert.equal(run('store.ratings.train.rating'),4);
assert.equal(run('store.ratings.train.feedback'),'<script>hello</script>','feedback remains plain text');
memory.bad = JSON.stringify({cart:{crane:-2, train:1.5, robot:100}, ratings:{crane:{rating:9,feedback:'bad'}},lastOrder:{total:'oops'}});
assert.equal(JSON.stringify(run('readStore("bad")')),JSON.stringify({cart:{},ratings:{},lastOrder:null}),'invalid data discarded');
memory.bad='{'; assert.equal(run('Object.keys(readStore("bad").cart).length'),0);
run('store.cart.crane = 99; selectedToy = toys[0]; handleOrder()');
assert.equal(run('store.cart.crane'),99,'quantity bounded');
// Signed-in caches are separate from guest data.
run('saveStore(); switchLocalStore(guestStorageKey + ":user-a")');
assert.equal(run('cartTotal()'),0);
run('switchLocalStore(guestStorageKey)'); assert.ok(run('cartTotal()')>0);
console.log('Passed: mixed totals, removal, persistence, checkout, ratings, corrupt data, quantity limits, account isolation.');
