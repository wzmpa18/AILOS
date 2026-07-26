# -*- coding: utf-8 -*-
"""AILOS 网页版线上预览验收脚本（漏洞1 证据采集）。
采集：Chrome 桌面 / Chrome 移动端模拟 / Firefox 三套；
每页截图 + DOM 断言（无 Language Context 控件残留）+ HTTP 状态。
"""
import os, json, time
from playwright.sync_api import sync_playwright, Error as PWError

BASES = ["https://www.yandao.vip/xuewaiyu", "https://yandao.vip/xuewaiyu"]
ACCT, PWD = "13480010005", "Test123456"
OUT = os.path.join(os.path.dirname(__file__), "_webpreview")
os.makedirs(OUT, exist_ok=True)

PUBLIC = ["login.html", "register.html", "home.html", "chat.html",
          "learn.html", "onboarding.html", "language.html", "profile.html"]
LOGIN_PAGES = ["home.html", "chat.html", "learn.html", "profile.html",
               "onboarding.html", "language.html"]

def resolve_base():
    from urllib.request import urlopen
    for b in BASES:
        try:
            with urlopen(b + "/home.html", timeout=8) as r:
                if r.status == 200:
                    return b
        except Exception:
            continue
    return BASES[0]

def lc_assert(page):
    """返回 Language Context 控件计数 + 文本命中。"""
    try:
        n = page.evaluate("""() => document.querySelectorAll(
            '[id*=languageContext i],[class*=language-context i],[name=languageContext]').length""")
        txt = page.evaluate("() => (document.body? document.body.innerText.includes('Language Context'): false)")
        return n, txt
    except Exception as e:
        return -1, str(e)

def shot(page, path):
    try:
        page.screenshot(path=path, full_page=False)
        return os.path.getsize(path)
    except Exception as e:
        return -1

def run(browser, name, is_mobile, token=None):
    results = []
    ctx_opts = {}
    if is_mobile:
        ctx_opts = {"viewport": {"width": 390, "height": 844},
                    "device_scale_factor": 3, "is_mobile": True, "has_touch": True}
    ctx = browser.new_context(**ctx_opts)
    page = ctx.new_page()
    page.set_default_timeout(15000)
    b = resolve_base()
    for pg in (LOGIN_PAGES if token else PUBLIC):
        url = f"{b}/{pg}"
        rec = {"device": name, "page": pg, "url": url}
        try:
            if token and not pg.startswith("login") and not pg.startswith("register"):
                page.add_init_script(f"localStorage.setItem('yandao_token_v1','{token}');")
            resp = page.goto(url, wait_until="networkidle", timeout=20000)
            rec["status"] = resp.status if resp else "none"
            time.sleep(1.2)
            n, txt = lc_assert(page)
            rec["lc_controls"] = n
            rec["lc_text_hit"] = bool(txt)
            f = os.path.join(OUT, f"{name}__{pg}.png")
            rec["shot_bytes"] = shot(page, f)
            rec["shot"] = os.path.relpath(f)
        except Exception as e:
            rec["status"] = "ERR"
            rec["error"] = str(e)[:120]
        results.append(rec)
        print(json.dumps(rec, ensure_ascii=False))
    ctx.close()
    return results

def main():
    all_res = []
    with sync_playwright() as p:
        # 1) Chrome 桌面（先拿 token）
        token = None
        b = resolve_base()
        c = p.chromium.launch()
        # 登录取 token（用 urllib 直连，避开浏览器内 fetch/CORS 干扰）
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{b}/api/auth/password",
                data=json.dumps({"account": ACCT, "password": PWD}).encode("utf-8"),
                headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=15) as rp:
                j = json.loads(rp.read().decode("utf-8"))
            token = j.get("tokens", {}).get("accessToken") or j.get("accessToken")
            print("LOGIN", json.dumps({"status": rp.status, "token_acquired": bool(token)}, ensure_ascii=False))
        except Exception as e:
            print("LOGIN_ERR", str(e)[:160])
        all_res += run(c, "chrome_desktop", False, token=token)
        c.close()
        # 2) Chrome 移动端
        cm = p.chromium.launch()
        all_res += run(cm, "chrome_mobile", True, token=token)
        cm.close()
        # 3) Firefox
        try:
            ff = p.firefox.launch()
            all_res += run(ff, "firefox_desktop", False, token=token)
            ff.close()
        except Exception as e:
            print("FIREFOX_ERR", str(e)[:120])
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"base": resolve_base(), "account": ACCT, "login_token_acquired": bool(token),
                   "results": all_res}, f, ensure_ascii=False, indent=2)
    # 汇总
    bad = [r for r in all_res if r.get("status") not in (200, 301, 302, "none") or r.get("lc_controls", 0) not in (0,)]
    print("SUMMARY total=%d suspicious=%d" % (len(all_res), len(bad)))

if __name__ == "__main__":
    main()
