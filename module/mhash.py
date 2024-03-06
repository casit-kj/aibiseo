import hashlib, time

def make_hash(seed):                
    obj = hashlib.sha256(seed.encode())
    return obj.hexdigest()