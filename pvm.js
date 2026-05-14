const fs = require('node:fs');

if (process.argv.length < 3){
 console.log("no json code file. exiting");
 process.exit(1);	
}

// Load from json file
const infile = process.argv[2];
const data = fs.readFileSync(infile,'utf8');
var newcode = JSON.parse(data);
const bytecode = Uint8Array.fromBase64(newcode.code);

const consts = newcode.consts;
const names = newcode.names;
const varnames = newcode.varnames;
const freevars = newcode.freevars;
const cellvars = newcode.cellvars;

// Program
var program = [];
var pc = 0;
for(var i=0; i<(bytecode.length-1); i+=2){
 var temp = [bytecode[i], bytecode[i+1]];
 program.push(temp);
}

// Stack and Globals etc.
var stack = [];
var globals = {};
var builtins = {};
pvm_load_builtins();

run();

// ***************
// functions below
function run(){
 while(pc<program.length){
  var op = program[pc][0];
  var arg = program[pc][1];
  var func = lookup(op);
  
  if(func!==undefined){
   func(arg);
  }
  
  console.log(op, arg, func);
  pc++;
 }
}

function lookup(op){
 const op_table = {
  0: undefined,
  31: undefined,
  33: undefined,
  35: undefined,
  52: undefined,
  82: undefined,
  93: undefined,
  128: pvm_RESUME,
 }
 return op_table[op];
}

function pvm_load_builtins(){
 builtins['print'] = (pvm_builtin_print);
}

function pvm_RESUME(arg){
 console.log("pvm_resume");
}

function pvm_builtin_print(){
 console.log("pvm builtin print");
}
