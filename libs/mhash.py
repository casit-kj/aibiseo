"""
module.name : mhash.py
module.purpose: 해시함수
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import hashlib, time

def make_hash(seed):                
    obj = hashlib.sha256(seed.encode())
    return obj.hexdigest()