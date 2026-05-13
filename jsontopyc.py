import sys
import json
import base64
import types
import marshal

def main():
	if len(sys.argv) < 2:
		print("not enough args")
		return
	infile = sys.argv[1]
	name = infile.split(".")[0]
	outfile = name + ".j.pyc"
	print(infile, name, outfile)
	
	newcode = None
	with open(infile, "r") as f:
		newcode = json.load(f)

	header = newcode['header']
	headerbytes = header_to_str(header)
	
	code = newcode_to_code(newcode)
	codebytes = marshal.dumps(code)

	with open(outfile, "wb") as f:
		f.write(headerbytes + codebytes)

	print(f"Written to: {outfile}")

def newcode_to_code(newcode):
	code = types.CodeType(
		newcode['argcount'],
		newcode['posonlyargcount'],
		newcode['kwonlyargcount'],
		newcode['nlocals'],
		newcode['stacksize'],
		newcode['flags'],
		b642b(newcode['code']),
		tuple(newcode['consts']),
		tuple(newcode['names']),
		tuple(newcode['varnames']),
		newcode['filename'],
		newcode['qualname'],
		newcode['name'],
		newcode['firstlineno'],
		b642b(newcode['lnotab']),
		b642b(newcode['exceptiontable']),
		tuple(newcode['freevars']),
		tuple(newcode['cellvars'])
	)
	return code

def b642b(b64):
	return base64.b64decode(b64)

def header_to_str(header):
	magic = b642b(header['magic'])
	flags = b642b(header['flags'])
	moddate = b642b(header['moddate'])
	size = b642b(header['size'])
	return magic + flags + moddate + size

if __name__ == "__main__":
	main()
