import marshal

code = None

with open("test2.pyc","rb") as f:
	magic = f.read(4)
	flags = f.read(4)
	moddate = f.read(4)
	size = f.read(4)
	code = marshal.load(f)
	print(code)

