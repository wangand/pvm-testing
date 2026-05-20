const fs = require('node:fs');

if (process.argv.length < 3){
 console.log("no json code file. exiting");
 process.exit(1);	
}

var debug = false;

// Load from json file
const infile = process.argv[2];
const data = fs.readFileSync(infile,'utf8');
var newcode = JSON.parse(data);

// Special Symbols
Py_None = {s:'Py_None'};

// Program
function bc_to_bcarg(bc){
 var bcarg = [];
 for(var i=0; i<(bc.length-1); i+=2){
  var temp = [bc[i], bc[i+1]];
  bcarg.push(temp);
 }
 return bcarg;
}

function create_frame(code){
 const bytecode = Uint8Array.fromBase64(code.code);
 var retval = {
  program: bc_to_bcarg(bytecode),
  consts: code.consts,
  names: code.names,
  varnames: code.varnames,
  freevars: code.freevars,
  cellvars: code.cellvars,
  pc: 0,
  stack: [],
  locals: {},
  globals: {},
  builtins: pvm_load_builtins(),
 }

 // Account for python language symbols
 for (var i=0; i<retval.consts.length; i++){
  if(retval.consts[i]===null){
   retval.consts[i] = Py_None;
  } 
 }

 return retval;
}

// Set up frame stack
var entry_frame = {};
var framestack = [entry_frame];

// Set up first frame
framestack.push(create_frame(newcode));

// Global frame pointer
var fp = framestack.length-1;

run();

// ***************
// functions below
function run(){
 var frame = framestack[fp];
 var program = frame.program;
 while(frame.pc<frame.program.length){
  var op = program[frame.pc][0];
  var arg = program[frame.pc][1];
  var func = lookup(op);
  
  if(func!==undefined){
   func(arg);
  }
  if(debug){
   console.log(op, arg, func);
  }
  frame.pc++;
 }
}

function lookup(op){
 const op_table = {
  0: pvm_CACHE,
  31: pvm_POP_TOP,
  33: pvm_PUSH_NULL,
  35: pvm_RETURN_VALUE,
  52: pvm_CALL,
  55: pvm_CALL_KW,
  82: pvm_LOAD_CONST,
  93: pvm_LOAD_NAME,
  94: pvm_LOAD_SMALL_INT,
  116: pvm_STORE_NAME,
  128: pvm_RESUME,
 }
 return op_table[op];
}

function pvm_load_builtins(){
 return {
  'print': pvm_builtin_print,
 }
}

function pvm_STORE_NAME(arg){
 var frame = framestack[fp];
 var name = frame.names[arg];
 frame.locals[name] = frame.stack.pop();
}

function pvm_RESUME(arg){
 // No op for now
}

function pvm_LOAD_SMALL_INT(arg){
 framestack[fp].stack.push(Number(arg));
}

function pvm_CACHE(arg){
 // No op for now
}

function pvm_POP_TOP(arg){
 framestack[fp].stack.pop();
}

function pvm_PUSH_NULL(arg){
 framestack[fp].stack.push(null);
}

function pvm_RETURN_VALUE(arg){
 var val = framestack[fp].stack.pop();
 // Rest of this op later
}

function pvm_CALL(arg){
 var frame = framestack[fp];
 // Default behavior
 var arglist = [];
 for(var i=0; i<arg; i++){
  arglist.push(frame.stack.pop());
 }
 arglist.reverse();
 var null_or_self = frame.stack.pop();
 var callable = frame.stack.pop();

 switch(callable){
  // Kludge for print
  case pvm_builtin_print:
   pvm_builtin_print(arglist, arglist.length, undefined, undefined, undefined, undefined);
   break; 
  default:
   console.log("Default function call");
 }
}

function pvm_CALL_KW(arg){
 var frame = framestack[fp];

 // Collect keyword tuple
 var keyword_tuple = frame.stack.pop();

 // Default behavior
 var arglist = [];
 for(var i=0; i<arg; i++){
  arglist.push(frame.stack.pop());
 }
 arglist.reverse();
 var null_or_self = frame.stack.pop();
 var callable = frame.stack.pop();

 // Keyword behavior
 var keywords = {};
 const first_kw_pos = arg - keyword_tuple.length;
 for(var i=0; i<keyword_tuple.length; i++){
  keywords[keyword_tuple[i]] = arglist[i+first_kw_pos];
 }
 for(var i=0; i<keyword_tuple.length; i++){
  arglist.pop();
 }
 
 switch(callable){
  // Kludge for print
  case pvm_builtin_print:
   pvm_builtin_print(
    arglist,
    arglist.length,
    keywords['sep'],
    keywords['end'],
    keywords['file'],
    keywords['flush']
   );
   break;
  default:
   console.log("Default function call");
 } 
}

function pvm_LOAD_CONST(arg){
 var frame = framestack[fp];
 var to_push = frame.consts[arg];
 frame.stack.push(to_push);
 if(debug){
  console.log(frame.stack);
 }
}

function pvm_LOAD_NAME(arg){
 var frame = framestack[fp];
 var name = frame.names[arg];

 // check locals
 if(name in frame.locals){
  console.log("found in locals");
 }
 // check globals
 else if(name in frame.globals){
  console.log("found in globals");
 }
 // check builtins
 else if(name in frame.builtins){
  frame.stack.push(frame.builtins[name]);
 } 
 if(debug){
  console.log(stack);
 }
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
  process.stdout.write(String(objects[i]));
 }
 process.stdout.write(end);
}
