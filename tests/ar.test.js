var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var handlers = {};
var stopped = 0;
var status = {textContent:''};
var track = {stop:function(){stopped++;}};
var stream = {getTracks:function(){return [track];}};
var context = vm.createContext({
  window: {isSecureContext:true, parent:{postMessage:function(){}}, addEventListener:function(type,fn){handlers[type]=fn;}},
  navigator:{mediaDevices:{getUserMedia:function(){return Promise.resolve(stream);}}},
  location:{origin:'http://localhost:8000'},
  document:{getElementById:function(){return status;},querySelectorAll:function(){return [{srcObject:stream}];},createElement:function(){return {};},head:{appendChild:function(){}}},
  clearTimeout:function(){}, setTimeout:function(){}
});
vm.runInContext(fs.readFileSync('ar-preview.js','utf8'),context);
handlers['camera-init']({detail:null});
assert.ok(status.textContent.includes('Camera ready'),'legacy AR.js null detail does not crash');
vm.runInContext('lastCameraError = {name:"NotAllowedError"}',context);
handlers['camera-error']({detail:null});
assert.ok(status.textContent.includes('denied'),'permission error survives legacy event');
handlers.pagehide(); assert.ok(stopped>0,'tracks stopped on navigation');
console.log('Passed: legacy camera events, permission recovery, camera teardown.');
