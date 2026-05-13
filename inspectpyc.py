import sys
import marshal

code = None

def main():
	if len(sys.argv) < 2:
		print("not enough args")
		return
	infile = sys.argv[1]
	with open(infile, "rb") as f:
		magic = f.read(4)
		print("magic: ", magic)
		flags = f.read(4)
		print(flags)
		moddate = f.read(4)
		print("moddate: ", moddate)
		size = f.read(4)
		print("size: ", size)
		global code
		code = marshal.load(f)
		print(code)


if __name__ == "__main__":
	main()
