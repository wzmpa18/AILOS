# -*- coding: utf-8 -*-
import sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:3000"
PHONE, PW = "13480010005", "Test123456"

def req(method, path, token=None, body=None, raw=False):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, (resp.read().decode('utf-8','replace') if raw else json.loads(resp.read().decode('utf-8','replace')))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8','replace'))
        except Exception:
            return e.code, {'raw': e.read().decode('utf-8','replace')[:300]}
    except Exception as ex:
        return 'ERR', str(ex)

def show(label, tup):
    st, body = tup
    print(label, "=>", st)
    print("   ", json.dumps(body, ensure_ascii=False)[:500])

print("===== [1] health =====")
show("health", req('GET', '/api/health'))

print("\n===== [2] login =====")
st, login = req('POST', '/api/auth/password', body={'phone': PHONE, 'password': PW})
show("login", (st, login))
token = None
if isinstance(login, dict):
    token = (login.get('tokens') or {}).get('accessToken') or login.get('token') or login.get('accessToken')
print("TOKEN:", (token or 'NONE')[:40], "...")

if not token:
    print("NO TOKEN, ABORT")
else:
    show("packages", req('GET', '/api/billing/packages', token))
    show("status-init", req('GET', '/api/billing/status', token))
    show("buy pay_1h", req('POST', '/api/billing/package/buy', token, {'packageType':'pay_1h'}))
    show("status-after-buy", req('GET', '/api/billing/status', token))
    show("consume 60", req('POST', '/api/billing/consume', token, {'scene':'scan','seconds':60}))
    show("status-1", req('GET', '/api/billing/status', token))
    show("consume 400", req('POST', '/api/billing/consume', token, {'scene':'scan','seconds':400}))
    show("status-2", req('GET', '/api/billing/status', token))
    show("consume 5000 (应拒绝)", req('POST', '/api/billing/consume', token, {'scene':'scan','seconds':5000}))
    show("alias /api/translate/trial/status", req('GET', '/api/translate/trial/status', token))

print("\n=== DONE ===")
