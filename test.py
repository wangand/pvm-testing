import marshal

code = None

with open("test2.pyc","rb") as f:
	magic = f.read(4)
	print("magic: ", magic)
	flags = f.read(4)
	print(flags)
	moddate = f.read(4)
	print("moddate: ", moddate)
	size = f.read(4)
	print("size: ", size)
	code = marshal.load(f)
	print(code)

