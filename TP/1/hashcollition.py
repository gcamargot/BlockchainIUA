import requests
from hashlib import sha256
from random import choice, seed


server = "https://cripto.iua.edu.ar"

email = "gcamargo221@alumnos.iua.edu.ar"

ascii = ''.join([chr(i) for i in range(33, 127)])

seed(37)

hashmap = {}

for j in range(9999999):
    s = ''.join([choice(ascii) for _ in range(20)])
    string = (email + s).encode("utf-8")
    hash = sha256(string).hexdigest()[:12]
    if hash in hashmap:
        temp = hashmap[hash]
        if temp != string:
            break
    hashmap[hash] = string

print(sha256(string).hexdigest()[:12], string)
print(sha256(temp).hexdigest()[:12], temp)

response = requests.post(
    f"{server}/collision/{email}/answer", 
    files={"message1": string, "message2": temp})
print(response.status_code)
print(response.text)