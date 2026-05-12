var examples = [
 {
  "base": "Kw4NCg==",
  "python": String.raw`b'+\x0e\r\n'`,
  "int": 168627755,
 },
]

function bytestoint(bytes){
 // unsigned small endian 4 byte
 if(bytes.length != 4){
  return undefined;
 }
 var value = 0; 
 for(var i = 3; i>=0; i--){
  var multiplier = 256**i;
  value += multiplier * bytes[i];
 }
 return value;
}

function pythonrepr(bytes){
 var retval = "";
 // Note JS uses UTF-16 but it should work for values less than 255 right?
 for(var i=0; i<bytes.length; i++){
  var c = bytes[i];
  if(c=="'".charCodeAt(0) || c=='\\'.charCodeAt(0)){
   retval += '\\';
   retval += String.fromCharCode(c);
  }
  else if(c=='\t'.charCodeAt(0)){
   retval += '\\t';
  }
  else if(c=='\n'.charCodeAt(0)){
   retval += '\\n';
  }
  else if(c=='\r'.charCodeAt(0)){
   retval += '\\r';
  }
  else if(c < ' '.charCodeAt(0) || c >= 127){
   var hexval = c.toString(16);
   if(hexval.length < 2){
    hexval = '0'+hexval;
   }
   retval += '\\x'+hexval;
  }
  else{
   retval += String.fromCharCode(c);
  }
 }
 return "b'"+retval+"'"; 
}

function generate(example){
 var retval = {};
 e_base = example['base'];
 e_python = example['python'];
 e_int = example['int'];
 
 const bytes = Uint8Array.fromBase64(e_base);
 var j_int = bytestoint(bytes);
 var j_python = pythonrepr(bytes);

 retval['base'] = e_base;
 retval['python'] = j_python;
 retval['int'] = j_int;
 retval['bytes'] = bytes;

 return retval;
}

for(var i=0; i<examples.length; i++){
 example = examples[i];
 var found = generate(example);
 
 var int_result = (example['int'] == found['int'])
 var python_result = (example['python'] == found['python'])
 console.log('\t', example['int'], found['int'], int_result);
 console.log('\t', example['python'], found['python'], python_result);
 console.log(example['base'], int_result && python_result);
}
