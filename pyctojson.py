import sys
import py_compile
import marshal
import json
import base64

def main():
	if len(sys.argv) < 2:
		print("not enough args")
		return
	infile = sys.argv[1]
	name = infile.split(".")[0]
	pycfile = name + ".pyc"
	jsonfile = name + ".json"
	print(infile, pycfile, jsonfile)

	py_compile.compile(infile, name+".pyc")
	
	magic, flags, moddate, size, code = (None,)*5
	with open(pycfile, "rb") as f:
		magic = f.read(4)
		flags = f.read(4)
		moddate = f.read(4)
		size = f.read(4)
		code = marshal.load(f)
	
	newcode = code_to_dict(magic, flags, moddate, size, code)
	print(newcode)
	with open(jsonfile, "w") as f:
		json.dump(newcode, f)

def code_to_dict(magic, flags, moddate, size, code):
	def b64s(bytes):
		return base64.b64encode(bytes).decode('utf-8')
	retval = {
		"header": {
			"magic": b64s(magic),
			"flags": b64s(flags),
			"moddate": b64s(moddate),
			"size": b64s(size),
		},
		"argcount": code.co_argcount,
		"posonlyargcount": code.co_posonlyargcount,
		"kwonlyargcount": code.co_kwonlyargcount,
		"nlocals": code.co_nlocals,
		"stacksize": code.co_stacksize,
		"flags": code.co_flags,
		"code": b64s(code.co_code),
		"consts": code.co_consts,
		"names": code.co_names,
		"varnames": code.co_varnames,
		"filename": code.co_filename,
		"qualname": code.co_filename,
		"name": code.co_name,
		"firstlineno": code.co_firstlineno,
		"lnotab": b64s(code.co_lnotab),
		"exceptiontable": b64s(code.co_exceptiontable),
		"freevars": code.co_freevars,
		"cellvars": code.co_cellvars,
	}
	return retval

if __name__ == "__main__":
	main()
