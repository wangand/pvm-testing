import sys

def main():
	if len(sys.argv) < 2:
		print("not enough args")
		return
	infile = sys.argv[1]
	print(infile)

if __name__ == "__main__":
	main()
