# 部署闭环验证：5 核心页面 PC+移动端截图 + DOM 断言 + AI 语言篡改核验
# 证据输出: _deploy_verify/ 目录 + stdout 日志
import json, os, sys, urllib.request

BASE = "https://www.yandao.vip"
ACCT, PWD = "13480010005", "Test123456"
PAGES = ["login.html", "chat.html", "learn.html", "home.html", "profile.html"]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_deploy_verify")
os.makedirs(OUT, exist_ok=True)

def api(path, data=None, token=None, method=None):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        headers={"Content-Type": "application/json",
                 **({"Authorization": f"Bearer {token}"} if token else {})},
        method=method or ("POST" if data is not None else "GET"))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try: body = json.loads(e.read().decode("utf-8"))
        except Exception: body = {}
        return e.code, body

# 1) 登录取 token（正确端点 /api/auth/password）
st, j = api("/api/auth/password", {"account": ACCT, "password": PWD})
token = (j.get("tokens") or {}).get("accessToken") or j.get("accessToken")
print("LOGIN", st, "token_acquired=", bool(token))

# 2) AI 语言篡改核验：body 注入伪造语言参数，输出必须仍按用户库配置(目标语=日语)
if token:
    st2, j2 = api("/api/ai/chat", {"userInput": "こんにちは、今日の天気について一言お願いします",
                                   "targetLang": "fr", "nativeLang": "en", "lang": "fr",
                                   "language": "fr"}, token=token)
    txt = json.dumps(j2, ensure_ascii=False)
    reply = (j2.get("data") or {}).get("reply") or (j2.get("data") or {}).get("content") or txt
    has_jp = any('\u3040' <= ch <= '\u30ff' for ch in str(reply))
    # 法语特征词粗查
    has_fr = any(w in str(reply).lower() for w in [" le ", " la ", " est ", "bonjour", " je "])
    print("AI_TAMPER status=", st2, "len=", len(str(reply)), "contains_japanese=", has_jp, "looks_french=", has_fr)
    print("AI_REPLY_HEAD=", str(reply)[:160].replace("\n", " "))
else:
    print("SKIP AI tamper (no token)")

# 3) Playwright 截图：PC Chrome + 移动端(iPhone12) 各 5 页
from playwright.sync_api import sync_playwright

def shoot(p, label, ctx_args):
    c = p.chromium.launch()
    ctx = c.new_context(**ctx_args)
    if token:
        ctx.add_init_script(f"localStorage.setItem('yandao_token_v1','{token}')")
    results = []
    pg = ctx.new_page()
    for f in PAGES:
        url = f"{BASE}/xuewaiyu/{f}"
        try:
            r = pg.goto(url, wait_until="networkidle", timeout=30000)
            status = r.status if r else 0
        except Exception:
            try:
                r = pg.goto(url, wait_until="domcontentloaded", timeout=30000)
                status = r.status if r else 0
            except Exception as e:
                results.append({"page": f, "status": "ERR:" + str(e)[:60]}); continue
        pg.wait_for_timeout(1500)
        lc = pg.evaluate("document.querySelectorAll('[id*=languageContext],[class*=language-context],[name=languageContext]').length")
        body_txt = pg.evaluate("document.body ? document.body.innerText.slice(0,20000) : ''")
        suspicious = 1 if "Language Context" in body_txt else 0
        shot = os.path.join(OUT, f"{label}__{f}.png")
        pg.screenshot(path=shot, full_page=False)
        results.append({"page": f, "status": status, "lc_controls": lc,
                        "suspicious": suspicious, "shot_bytes": os.path.getsize(shot)})
        print(label, f, "status=", status, "lc=", lc, "susp=", suspicious,
              "bytes=", os.path.getsize(shot))
    c.close()
    return results

with sync_playwright() as p:
    all_res = {}
    all_res["pc_chrome"] = shoot(p, "pc_chrome", {"viewport": {"width": 1440, "height": 900}})
    iphone = p.devices["iPhone 12"]
    all_res["mobile"] = shoot(p, "mobile", iphone)

with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(all_res, f, ensure_ascii=False, indent=1)

bad = [r for v in all_res.values() for r in v
       if r.get("status") != 200 or r.get("lc_controls", 1) not in (0,) and r["page"] != "profile.html" or r.get("suspicious")]
print("SUMMARY total=", sum(len(v) for v in all_res.values()), "bad=", len(bad))
for r in bad: print("BAD", r)
