const fs = require('node:fs');

if (process.argv.length < 3){
 console.log("no json code file. exiting");
 process.exit(1);	
}

var debug = false;

// for returning
var increment = true;

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
  locals_plus: [],
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
var entry_frame = {stack:[], program:[]};
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
   console.log(op, arg, func, fp);
  }
  // First op will not be run fix later
  frame = framestack[fp]; // allows for function calls
  program = frame.program;
  if(increment===true){
   frame.pc++;
  }
  else{
   if(debug===true){
    console.log('increment false');
   }
   increment = true;
  }
 }
}

function lookup(op){
 const op_table = {
  0: pvm_CACHE,
  23: pvm_MAKE_FUNCTION,
  28: pvm_NOT_TAKEN,
  31: pvm_POP_TOP,
  33: pvm_PUSH_NULL,
  35: pvm_RETURN_VALUE,
  44: pvm_BINARY_OP,
  52: pvm_CALL,
  55: pvm_CALL_KW,
  56: pvm_COMPARE_OP,
  74: pvm_IS_OP,
  75: pvm_JUMP_BACKWARDS,
  82: pvm_LOAD_CONST,
  86: pvm_LOAD_FAST_BORROW,
  93: pvm_LOAD_NAME,
  94: pvm_LOAD_SMALL_INT,
  100: pvm_POP_JUMP_IF_FALSE,
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

function pvm_COMPARE_OP(arg){
 var comp_lookup = {
   0: function(x,y){return x<y},
   1: function(x,y){return x<=y},
   2: function(x,y){return x==y},
   3: function(x,y){return x!=y},
   4: function(x,y){return x>y},
   5: function(x,y){return x>=y},
 }
 var comp_op = comp_lookup[arg>>5];
 
 var frame = framestack[fp];
 var right = frame.stack.pop();
 var left = frame.stack.pop();
 var result = comp_op(left,right);
 frame.stack.push(result);
}


function pvm_IS_OP(arg){
 var frame = framestack[fp];
 var invert = arg;
 var right = frame.stack.pop();
 var left = frame.stack.pop();
 
 if(invert!==1){
  frame.stack.push(right===left);
 }
 else{
  frame.stack.push(right!==left);
 }
}

function pvm_JUMP_BACKWARDS(arg){
 var frame = framestack[fp];
 var delta = arg;
 
 console.log("jumping back", delta-1);
 frame.pc -= delta-1;
}

function pvm_POP_JUMP_IF_FALSE(arg){
 var frame = framestack[fp];
 var delta = arg;

 var falsable = frame.stack.pop();
 if(falsable===false){
  console.log("jumping", delta+1);
  frame.pc += delta+1;
 }
}

function pvm_NOT_TAKEN(arg){
 // Do nothing code used by the interpeter to record branch events
}

function pvm_NB_ADD(){
 var frame = framestack[fp];
 var op1 = frame.stack.pop();
 var op2 = frame.stack.pop();
 frame.stack.push(Number(op1)+Number(op2));
}

function pvm_NB_INPLACE_ADD(){
 var frame = framestack[fp];
 var right = frame.stack.pop();
 var left = frame.stack.pop();
 console.log("INPLACE_ADD", left, right); 

 var left_val = frame.locals[left];
 var result = Number(left_val) + Number(right);
 frame.locals[left] = result;
 frame.stack.push(result);
}

function pvm_BINARY_OP_lookup(bop){
 const bop_table = {
  0: pvm_NB_ADD,
  13: pvm_NB_INPLACE_ADD,
 }
 return bop_table[bop];
}

function pvm_BINARY_OP(arg){
 var callable = pvm_BINARY_OP_lookup(arg);
 callable();
}

function pvm_STORE_NAME(arg){
 var frame = framestack[fp];
 var name = frame.names[arg];
 frame.locals[name] = frame.stack.pop();
}

function pvm_LOAD_FAST_BORROW(arg){
 var frame = framestack[fp];
 var locals_plus = frame.locals_plus;
 frame.stack.push(locals_plus);
}

function pvm_RESUME(arg){
 // No op for now
}

function pvm_MAKE_FUNCTION(arg){
 var frame = framestack[fp];
 var code = frame.stack.pop();
 var function_object = {
  pvm_type: "function",
  
  globals: {},
  builtins: {},
  name: '',
  qualname: '',
  code: code,
  defaults: [],
  kwdefaults: {},
  closure: [],
  
  doc: undefined,
  dict: undefined,
  weakreflist: undefined,
  module: undefined,
  annotations: undefined,
  annotate: undefined,
  typeparams: undefined,
  vectorcall: undefined,
  func_version: undefined,
 }
 frame.stack.push(function_object);
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
 fp--;
 frame = framestack[fp];
 frame.stack.push(val);
 //increment = false;
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
   var newframe = create_frame(callable.code);
   newframe.locals_plus = arglist;
   framestack.push(newframe);
   fp++;
   increment = false;
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
  frame.stack.push(frame.locals[name]);
 }
 // check globals
 else if(name in frame.globals){
  frame.stack.push(frame.globals[name]);
 }
 // check builtins
 else if(name in frame.builtins){
  frame.stack.push(frame.builtins[name]);
 } 
 if(debug){
  console.log(frame.stack);
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
