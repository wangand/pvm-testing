const fs = require('node:fs');

const data = fs.readFileSync('test5.json','utf8');
var newcode = JSON.parse(data);

const bytecode = Uint8Array.fromBase64(newcode.code);

console.log(bytecode);
