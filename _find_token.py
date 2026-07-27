# -*- coding: utf-8 -*-
import sys, json, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
BASE="http://127.0.0.1:3000"
import urllib.parse
body=json.dumps({'phone':'13480010005','password':'Test123456'}).encode()
r=urllib.request.Request(BASE+'/api/auth/password',data=body,method='POST')
r.add_header('Content-Type','application/json')
with urllib.request.urlopen(r,timeout=20) as resp:
    data=json.loads(resp.read().decode())
print("TOP KEYS:", list(data.keys()))
for k,v in data.items():
    if k=='user':
        print(k,"=> (user obj)")
    else:
        s=json.dumps(v,ensure_ascii=False)
        print(k,"=>",s[:120])
