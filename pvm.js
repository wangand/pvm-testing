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
  0: pvm_CACHE,
  31: pvm_POP_TOP,
  33: pvm_PUSH_NULL,
  35: pvm_RETURN_VALUE,
  52: pvm_CALL,
  82: pvm_LOAD_CONST,
  93: pvm_LOAD_NAME,
  128: pvm_RESUME,
 }
 return op_table[op];
}

function pvm_load_builtins(){
 builtins['print'] = (pvm_builtin_print);
}

function pvm_RESUME(arg){
 // No op for now
}

function pvm_CACHE(arg){
 // No op for now
}

function pvm_POP_TOP(arg){
 stack.pop();
}

function pvm_PUSH_NULL(arg){
 stack.push(null);
}

function pvm_RETURN_VALUE(arg){
 var val = stack.pop();
 // Rest of this op later
}

function pvm_CALL(arg){
 // Default behavior
 var arglist = [];
 for(var i=0; i<arg; i++){
  arglist.push(stack.pop());
 }
 var null_or_self = stack.pop();
 var callable = stack.pop();

 switch(callable){
  // Kludge for print
  case pvm_builtin_print:
   pvm_builtin_print(arglist, arglist.length, undefined, undefined, undefined, undefined);
   break; 
  default:
   console.log("Defaulting");
 }
}

function pvm_LOAD_CONST(arg){
 var to_push = consts[arg];
 stack.push(to_push);
 console.log(stack);
}

function pvm_LOAD_NAME(arg){
 var name = names[arg];

 // check locals
 // check globals
 
 // check builtins
 if(name in builtins){
  stack.push(builtins[name]);
 } 

 console.log(stack);
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
