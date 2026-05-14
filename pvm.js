const fs = require('node:fs');

if (process.argv.length < 3){
 console.log("no json code file. exiting");
 process.exit(1);	
}

const infile = process.argv[2];
const data = fs.readFileSync(infile,'utf8');
var newcode = JSON.parse(data);

const bytecode = Uint8Array.fromBase64(newcode.code);

console.log(bytecode);
