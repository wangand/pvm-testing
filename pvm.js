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

var consts = newcode.consts;
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

// Special Symbols
Py_None = {s:'Py_None'};

// Account for python language symbols
for (var i=0; i<consts.length; i++){
 if(consts[i]===null){
  consts[i] = Py_None;
 } 
}
console.log(consts);

// Stack and Globals etc.
var stack = [];
var globals = {};
var builtins = {};
pvm_load_builtins();

run();

pvm_builtin_print(['meow', 'meow'],2);

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

function pvm_builtin_print(objects, objects_length, sep, end, file, flush){
 // Defaults
 if(sep===undefined){
  sep = ' ';
 }
 if(end===undefined){
  end = '\n';
 }
 if(file===undefined){
  file = Py_None;
 }
 if(flush===undefined){
  flush = false;
 }

 // ignore file for now
 
 if(sep === Py_None){
  sep = '';
 }
 if(end === Py_None){
  end = '';
 }
 
 for(var i=0; i<objects_length; i++){
  if(i > 0){
   process.stdout.write(sep);
  }
  process.stdout.write(objects[i]);
 }
 process.stdout.write(end);
}
