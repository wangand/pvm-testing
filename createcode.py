import types
import _imp
import os
import marshal

MAGIC_NUMBER = _imp.pyc_magic_number_token.to_bytes(4, 'little')
bitfield = b'\x00\x00\x00\x00'
moddate = int(os.path.getmtime('test2.py')).to_bytes(4, 'little')
filesize = os.path.getsize('test2.py').to_bytes(4, 'little')

header = MAGIC_NUMBER + bitfield + moddate + filesize
print(header)

code = types.CodeType(
	0,
	0,
	0,
	0,
	3,
	0,
	b'\x80\x00^{t\x00R\x01t\x01]\x02!\x00]\x014\x01\x00\x00\x00\x00\x00\x00\x1f\x00R\x02#\x00',
	(123, 'cef', None),
	('x', 'y', 'print'),
	(),
	'test2.py',
	'<module>',
	'<module>',
	1,
	b'\x00\xff\x02\x01\x04\x01\x04\x01',
	b'',
	(),
	(),
)

payload = marshal.dumps(code)
print(payload)
with open('test2x.pyc', 'wb') as f:
	f.write(header)
	f.write(payload)
