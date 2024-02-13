FNV1_64_INIT = 0xcbf29ce484222325
FNV_64_PRIME = 0x100000001b3


def fnva(data):
    """
    Alternative FNV hash algorithm used in FNV-1a.
    """
    assert isinstance(data, bytes)
    print("Hash input", data)
    hval = FNV1_64_INIT
    for i, byte in enumerate(data):
        print(f"{i}) hval={hval}, hval ^ byte = {hval ^ byte}")
        hval = hval ^ byte
        hval = (hval * FNV_64_PRIME) % 2 ** 64
    return hval


print("=" * 5, "START", "=" * 5)
print(fnva(b"bruh"))
print("=" * 10)
print(fnva(b"Mind uploading"))
print("=" * 10)
print(fnva(b"Knowledge sharing 1337$^&%@$(#)"))
