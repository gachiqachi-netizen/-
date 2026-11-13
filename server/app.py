"""串个珠本地服务：前台、网页后台、接口、图片上传、AI。只用 Python 标准库，python3 app.py 即可启动。

  http://127.0.0.1:8800/        前台（小程序原型）
  http://127.0.0.1:8800/admin   网页后台（珠子 / 模板 / 宣传位 / 订单）

环境变量：PORT、SERVER_HOST、DATA_DIR；后台接口需要配置 ADMIN_TOKEN，未配置时拒绝访问；AI 相关见 ai/__init__.py。
"""
import base64
import binascii
import json
import os
import re
import secrets
import sys
import time
import threading
import math
import traceback
import uuid
import user_api
import pricing
import content_security
import env
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import ai  # noqa: E402
import kb  # noqa: E402
import plans  # noqa: E402
import status  # noqa: E402
import commerce  # noqa: E402
import routes  # noqa: E402
from db import DB  # noqa: E402

ROUTE_TABLE = routes.load()

PORT = int(os.environ.get("PORT", "8800"))
HOST = os.environ.get("SERVER_HOST", "127.0.0.1").strip()
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
DATA_DIR = os.environ.get("DATA_DIR") or HERE
UPLOADS = os.environ.get("UPLOADS_DIR") or os.path.join(DATA_DIR, "uploads")
MODELS = os.environ.get("MODELS_DIR") or os.path.join(HERE, "..", "tools", "hand-tracker", "models")   # 本地开发用的 AR 模型
FRONT = os.path.join(HERE, "..", "prototype.html")   # 前台就是原型页面，加上接口地址后直接用
os.makedirs(UPLOADS, exist_ok=True)
def ensure_dev_login_local():
    # 开发测试登录只签 dev: 前缀的本地账号，绝不能出现在生产数据库上。
    env.ensure_dev_login_local()
env.validate_startup()
if os.environ.get("DATABASE_URL"):
    from db_postgres import PostgresDB
    db = PostgresDB(os.environ["DATABASE_URL"])
else:
    db = DB(os.environ.get("DATABASE_PATH") or os.path.join(DATA_DIR, "data.sqlite3"))
user_api.cleanup_sessions(db)

def session_cleanup_loop():
    while True:
        time.sleep(24 * 3600)
        try:
            user_api.cleanup_sessions(db)
        except Exception:
            traceback.print_exc()

threading.Thread(target=session_cleanup_loop, daemon=True).start()

ORDER_STATUS = ["待串制", "串制中", "已发货", "已完成", "已取消"]
MAX_UPLOAD = 6 * 1024 * 1024
AI_SLOTS = threading.BoundedSemaphore(4)
ADMIN_SESSION_TTL = int(os.environ.get("ADMIN_SESSION_TTL", "28800"))
ADMIN_LOGIN_WINDOW = 10 * 60
ADMIN_LOGIN_LIMIT = 5
ADMIN_AUDIT_PATH = os.path.join(DATA_DIR, "admin-audit.jsonl")
_admin_sessions = {}
_admin_login_failures = {}
_admin_lock = threading.Lock()


def _prune_admin_state(now=None):
    now = now or time.time()
    with _admin_lock:
        for sid, expires in list(_admin_sessions.items()):
            if expires <= now:
                _admin_sessions.pop(sid, None)
        for ip, attempts in list(_admin_login_failures.items()):
            kept = [stamp for stamp in attempts if stamp > now - ADMIN_LOGIN_WINDOW]
            if kept:
                _admin_login_failures[ip] = kept
            else:
                _admin_login_failures.pop(ip, None)


def _audit_admin(method, path, ip):
    record = {"at": int(time.time() * 1000), "method": method, "path": path, "ip": ip}
    try:
        with open(ADMIN_AUDIT_PATH, "a", encoding="utf-8") as stream:
            stream.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        traceback.print_exc()

def validate_bind(host, admin_token, public_enabled, demo_disabled):
    # Public binding is an explicit opt-in, but is not a substitute for TLS,
    # production storage, authentication, rate limiting or security review.
    if host not in ("127.0.0.1", "localhost", "::1"):
        if not public_enabled or not admin_token or not demo_disabled:
            raise ValueError("非本机监听需设置 ALLOW_PUBLIC_BIND=1、ADMIN_TOKEN 并禁用演示下单")

def input_wrist(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 8 <= value <= 30:
        raise ValueError("手围须在 8–30cm 之间")
    return value

def text_history(value):
    if value is None:
        return []
    if not isinstance(value, list) or any(not isinstance(x, str) for x in value):
        raise ValueError("对话记录格式不正确")
    return [x[:200] for x in value[-6:]]


def page_skeleton(body, head=""):
    return ('<!doctype html><html><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
            f'{head}</head><body>{body}</body></html>')


def on_sale_catalog():
    beads = [kb.enrich(b) for b in db.list("beads") if b.get("onSale", True) and (b.get("mm") or 0) > 0
             and status.product_type(b) in ("bead", "spacer")]
    ids = {b["id"] for b in beads}
    tpls = [t for t in db.list("templates") if t.get("onSale", True)
            and all(x in ids for x in (t.get("special") or []) + (t.get("pattern") or []) + (t.get("tail") or []))
            and t.get("pattern")]
    tpl_ids = {t["id"] for t in tpls}
    banners = [b for b in db.list("banners") if b.get("on", True) and (not b.get("tpl") or b["tpl"] in tpl_ids)]
    return beads, tpls, banners


def save_image(data_url):
    m = re.match(r"data:(image/(png|jpeg|jpg|webp));base64,(.+)$", data_url or "", re.S)
    if not m:
        raise ValueError("只支持 png / jpg / webp 图片")
    raw = base64.b64decode(m.group(3))
    if len(raw) > MAX_UPLOAD:
        raise ValueError("图片太大，请小于 6MB")
    ext = {"png": "png", "jpeg": "jpg", "jpg": "jpg", "webp": "webp"}[m.group(2)]
    name = f"{int(time.time())}-{uuid.uuid4().hex[:8]}.{ext}"
    with open(os.path.join(UPLOADS, name), "wb") as f:
        f.write(raw)
    return "/uploads/" + name


def image_part(data_url):
    m = re.match(r"data:(image/(?:png|jpeg|webp));base64,(.+)$", data_url or "", re.S)
    if not m:
        raise ValueError("图片格式不对")
    try:
        raw = base64.b64decode(m.group(2), validate=True)
    except (ValueError, binascii.Error):
        raise ValueError("图片内容无效")
    if len(raw) > MAX_UPLOAD:
        raise ValueError("图片太大，请小于 6MB")
    typ = m.group(1)
    if not ((typ == "image/png" and raw.startswith(b'\x89PNG\r\n\x1a\n')) or
            (typ == "image/jpeg" and raw.startswith(b'\xff\xd8\xff')) or
            (typ == "image/webp" and raw.startswith(b'RIFF') and raw[8:12] == b'WEBP')):
        raise ValueError("图片内容与格式不符")
    return typ, m.group(2)


class Handler(BaseHTTPRequestHandler):
    server_version = "cgz/1"

    # ---------- 工具 ----------
    def log_message(self, fmt, *args):
        message = re.sub(r'/api/shares/[A-Za-z0-9_-]{43}', '/api/shares/[redacted]', fmt % args)
        sys.stderr.write("%s %s\n" % (self.command, message))

    def send(self, code, body, ctype="application/json; charset=utf-8", headers=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False)
        if isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        if ctype.startswith("text/html"):
            self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise ValueError("请求长度不正确")
        if n < 0 or n > MAX_UPLOAD * 2:
            raise ValueError("请求太大")
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, UnicodeDecodeError):
            raise ValueError("请求必须是有效的 JSON")
        if not isinstance(data, dict):
            raise ValueError("请求内容必须是 JSON 对象")
        return data

    def admin_cookie(self):
        for part in (self.headers.get("Cookie") or "").split(";"):
            name, _, value = part.strip().partition("=")
            if name == "beadloop_admin":
                return value
        return ""

    def admin_ok(self):
        import accounts
        self.admin_user = None
        sid = self.admin_cookie()
        if not sid:
            return False
        user = accounts.session_user(db, sid)
        if not user:
            return False
        path = urlparse(self.path).path
        if user.get("bootstrap") and path != "/api/admin/accounts/bootstrap":
            return False
        if user.get("mustChangePassword") and path != "/api/admin/accounts/me/password":
            return False
        self.admin_user = user
        accounts.CURRENT_ADMIN.set(user)
        return True

    def admin_login(self, data):
        import accounts
        ip = self.client_address[0]
        now = time.time()
        _prune_admin_state(now)
        with _admin_lock:
            attempts = _admin_login_failures.get(ip, [])
        if len(attempts) >= ADMIN_LOGIN_LIMIT:
            return self.send(429, {"error": "尝试次数过多，请十分钟后再试"}, headers={"Retry-After": str(ADMIN_LOGIN_WINDOW)})
        supplied = str(data.get("password") or "")
        username = str(data.get("username") or "")
        if db.list("admin_users"):
            user = accounts.login_user(db, username, supplied)
            uid = user["id"] if user else None
        else:
            uid = "__bootstrap__" if (ADMIN_TOKEN and
                  secrets.compare_digest(supplied.encode("utf-8"), ADMIN_TOKEN.encode("utf-8"))) else None
        if not uid:
            with _admin_lock:
                _admin_login_failures.setdefault(ip, []).append(now)
            return self.send(401, {"error": "账号或密码不正确"})
        sid = accounts.create_session(db, uid, ADMIN_SESSION_TTL)
        with _admin_lock:
            _admin_login_failures.pop(ip, None)
        secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        cookie = f"beadloop_admin={sid}; Path=/; Max-Age={ADMIN_SESSION_TTL}; HttpOnly; SameSite=Strict{secure}"
        _audit_admin("LOGIN", "/api/admin/session", ip)
        return self.send(200, {"ok": True}, headers={"Set-Cookie": cookie})

    def admin_logout(self):
        sid = self.admin_cookie()
        if sid:
            db.delete("admin_sessions", sid)
        secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        cookie = f"beadloop_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict{secure}"
        _audit_admin("LOGOUT", "/api/admin/session", self.client_address[0])
        return self.send(200, {"ok": True}, headers={"Set-Cookie": cookie})

    def audit_admin_mutation(self, path):
        _audit_admin(self.command, path, self.client_address[0])

    def qs(self):
        from urllib.parse import parse_qs
        return parse_qs(urlparse(self.path).query)

    def _route_dispatch(self, method, path, data=None):
        # A11 新接口注册表：现有路由都匹配不上、即将 404 之前查这里。命中并处理完返回 True。
        for mth, pattern, fn, auth in ROUTE_TABLE:
            if mth != method:
                continue
            match = pattern.fullmatch(path)
            if not match:
                continue
            if auth == "user":
                uid = self.user()
                if not uid:
                    self.send(401, {"error": "请先登录"})
                    return True
                user_id, is_admin = uid, False
            elif auth == "admin":
                if not self.admin_ok():
                    self.send(401, {"error": "需要后台口令"})
                    return True
                user_id, is_admin = None, True
                if method != "GET":
                    self.audit_admin_mutation(path)
            elif auth == "public":
                user_id, is_admin = self.user(), False
            else:
                # 不认识的登录要求一律拒绝，不当成公开接口
                self.send(401, {"error": "需要登录"})
                return True
            ctx = routes.Ctx(db=db, user_id=user_id, admin=is_admin, qs=self.qs())
            try:
                status_code, body = fn(ctx, match, data)
            except ValueError as e:
                self.send(400, {"error": str(e)})
            except KeyError as e:
                self.send(404, {"error": str(e)})
            else:
                self.send(status_code, body)
            return True
        return False

    def user(self):
        return user_api.owner(db, self.headers.get("Authorization"))

    # ---------- 路由 ----------
    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path in ("/", "/index.html"):
                html = open(FRONT, encoding="utf-8").read()
                return self.send(200, page_skeleton(html, '<script>window.CGZ_API="/api";</script>'), "text/html; charset=utf-8")
            if path in ("/admin", "/admin/"):
                with open(os.path.join(HERE, "static", "admin.html"), encoding="utf-8") as stream:
                    return self.send(200, stream.read(), "text/html; charset=utf-8")
            if path.startswith("/admin/"):   # 后台拆分的 JS 模块（server/static/admin/）
                rel = os.path.normpath(path[len("/admin/"):]).replace("\\", "/")
                fp = os.path.join(HERE, "static", "admin", rel)
                if not rel or rel.startswith("..") or os.path.isabs(rel) or not os.path.isfile(fp):
                    return self.send(404, {"error": "not_found"})
                ext = rel.rsplit(".", 1)[-1] if "." in rel else ""
                ctype = {"js": "application/javascript; charset=utf-8", "css": "text/css; charset=utf-8"}.get(ext, "application/octet-stream")
                return self.send(200, open(fp, "rb").read(), ctype)
            if path.startswith("/uploads/"):
                name = os.path.basename(path)
                fp = os.path.join(UPLOADS, name)
                if not os.path.isfile(fp):
                    return self.send(404, {"error": "not_found"})
                ext = name.rsplit(".", 1)[-1]
                return self.send(200, open(fp, "rb").read(), {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}.get(ext, "application/octet-stream"))
            if path.startswith("/models/"):   # 本地开发：AR 手部模型由本机提供，上线后改用对象存储
                rel = os.path.normpath(path[len("/models/"):]).replace("\\", "/")
                fp = os.path.join(MODELS, rel)
                if rel.startswith("..") or os.path.isabs(rel) or not os.path.isfile(fp) or rel.rsplit(".", 1)[-1] not in ("json", "bin"):
                    return self.send(404, {"error": "not_found"})
                with open(fp, "rb") as f:
                    return self.send(200, f.read(), "application/json" if fp.endswith(".json") else "application/octet-stream")
            if path == "/api/catalog":
                beads, tpls, banners = on_sale_catalog()
                return self.send(200, {"beads": beads, "templates": tpls, "banners": banners, "ai": ai.status(), "pricing": pricing.public_config()})
            if path == "/api/meta/contract":
                import contract
                return self.send(200, contract.payload())
            if path == "/api/promotions/status":
                return self.send(200, user_api.promotion_status())
            if path == "/api/kb/status":
                return self.send(200, kb.status())
            if path == "/api/kb/index":
                return self.send(200, kb.index())
            if path == "/api/kb/rules":
                return self.send(200, plans.rules())
            if path == "/api/kb/attributes":
                return self.send(200, kb.attributes())
            m = re.match(r"^/api/kb/bead/([\w-]+)$", path)
            if m:
                b = kb.public(kb.get(m.group(1)))
                return self.send(200, b) if b else self.send(404, {"error": "知识库里没有这个品种"})
            if path == "/api/ai/status":
                return self.send(200, ai.status())
            m = re.fullmatch(r"/api/shares/([A-Za-z0-9_-]{43})", path)
            if m:
                shared = user_api.read_share(db, m.group(1))
                return self.send(200, shared) if shared else self.send(404, {"error": "分享不存在"})
            order_detail = re.fullmatch(r"/api/my/orders/([\w-]+)", path)
            if order_detail:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                try:
                    return self.send(200, user_api.get_my_order(db, order_detail.group(1), uid))
                except KeyError:
                    return self.send(404, {"error": "订单不存在"})
            if path in ("/api/designs", "/api/my/orders"):
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                table = "designs" if path == "/api/designs" else "orders"
                presenter = user_api.public_design if path == "/api/designs" else user_api.public_order
                rows = [presenter(row) for row in db.list_by_owner(table, uid)]
                rows.sort(key=lambda row: row.get("updatedAt", row.get("createdAt", 0)), reverse=True)
                return self.send(200, rows)
            m = re.match(r"^/api/admin/(beads|templates|banners|orders)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                q = self.qs()
                if m.group(1) == "orders":
                    rows = commerce.list_orders(db, q.get("q", [""])[0],
                                                {k: q.get(k, [""])[0] for k in status.GROUP_FIELDS})
                elif m.group(1) == "beads":
                    rows = commerce.list_products(db, q.get("q", [""])[0], q.get("type", [""])[0], q.get("status", [""])[0])
                elif m.group(1) == "templates":
                    rows = commerce.list_templates(db, q.get("q", [""])[0], q.get("status", [""])[0])
                else:
                    rows = db.list(m.group(1))
                return self.send(200, rows)
            if path == "/api/admin/after-sales":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                q = self.qs()
                return self.send(200, commerce.list_after_sales(db, q.get("q", [""])[0], q.get("status", [""])[0]))
            if path == "/api/admin/terms":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                q = self.qs()
                return self.send(200, commerce.list_terms(db, q.get("q", [""])[0], q.get("status", [""])[0], q.get("scopeMode", [""])[0]))
            if path == "/api/admin/work-orders":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                q = self.qs()
                return self.send(200, commerce.list_work_orders(db, q.get("q", [""])[0], q.get("status", [""])[0], q.get("assignee", [""])[0]))
            if path == "/api/admin/audit":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                q = self.qs()
                return self.send(200, commerce.list_audit(db, q.get("q", [""])[0], q.get("target", [""])[0]))
            m = re.match(r"^/api/admin/templates/([\w-]+)/expand$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                tpl = db.get("templates", m.group(1))
                if not tpl:
                    return self.send(404, {"error": "模板不存在"})
                q = self.qs()
                try:
                    wrist = float(q.get("wrist", ["15"])[0])
                except (TypeError, ValueError):
                    return self.send(400, {"error": "手围格式不正确"})
                return self.send(200, commerce.expand_template_recipe(db, tpl, wrist=wrist))
            m = re.match(r"^/api/admin/orders/([\w-]+)/work-order$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                wo = commerce.get_work_order(db, m.group(1))
                return self.send(200, wo) if wo else self.send(404, {"error": "订单不存在"})
            m = re.match(r"^/api/admin/orders/([\w-]+)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                detail = commerce.order_detail(db, m.group(1))
                return self.send(200, detail) if detail else self.send(404, {"error": "订单不存在"})
            m = re.match(r"^/api/admin/after-sales/([\w-]+)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                rec = commerce.after_sale_detail(db, m.group(1))
                return self.send(200, rec) if rec else self.send(404, {"error": "售后记录不存在"})
            if self._route_dispatch("GET", path):
                return
            return self.send(404, {"error": "not_found"})
        except Exception as e:
            traceback.print_exc()
            return self.send(500, {"error": "服务暂时不可用，请稍后重试"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/payments/notify":
                # 支付回调边界：未接真实微信支付，任何回调一律 501，不解析回调报文。
                return self.send(501, {"error": "未接真实支付"})
            data = self.body()
            if path == "/api/admin/session":
                return self.admin_login(data)
            # ----- 前台 -----
            if path == "/api/auth/wechat":
                status, result = user_api.login(db, data.get("code"))
                return self.send(status, result)
            if path == "/api/auth/dev":
                status, result = user_api.dev_login(db, data.get("name"))
                return self.send(status, result)
            if path == "/api/auth/logout":
                if not user_api.logout(db, self.headers.get("Authorization")):
                    return self.send(401, {"error": "请先登录"})
                return self.send(200, {"ok": True})
            if path == "/api/shares":
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                return self.send(201, user_api.create_share(db, data, uid))
            after_sale_request = re.fullmatch(r"/api/my/orders/([\w-]+)/after-sales", path)
            if after_sale_request:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                return self.send(201, user_api.request_after_sale(
                    db, after_sale_request.group(1), uid, data))
            address_change = re.fullmatch(r"/api/my/orders/([\w-]+)/address", path)
            if address_change:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                return self.send(200, user_api.change_my_order_address(
                    db, address_change.group(1), uid, data))
            pay = re.fullmatch(r"/api/my/orders/([\w-]+)/pay", path)
            if pay:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                return self.send(200, user_api.start_payment(db, pay.group(1), uid))
            if path == "/api/payments/mock/notify":
                import payments
                if payments.provider() != "mock":
                    return self.send(404, {"error": "not_found"})
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                return self.send(200, user_api.mock_payment_notify(
                    db, str(data.get("orderNo") or ""), uid, str(data.get("paymentId") or ""), data.get("result")))
            order_action = re.fullmatch(r"/api/my/orders/([\w-]+)/actions(?:/([a-z_]+))?", path)
            if order_action:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                no, suffix_action = order_action.groups()
                action = suffix_action or data.get("action")
                if not isinstance(action, str) or not re.fullmatch(r"[a-z_]+", action):
                    raise ValueError("订单操作格式不正确")
                return self.send(200, user_api.perform_order_action(db, no, uid, action, data.get("reason")))
            if path in ("/api/designs", "/api/my/orders"):
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                if path == "/api/my/orders":
                    return self.send(201, user_api.make_order(db, data, uid))
                design = user_api.design_data(data, uid)
                design["createdAt"] = design["updatedAt"]
                return self.send(201, user_api.public_design(db.put("designs", uuid.uuid4().hex, design)))
            if path == "/api/plans/match":   # AI 配：先查方案库，再按手围和预算微调
                beads, _, _ = on_sale_catalog()
                text = str(data.get("text") or "")[:200]
                history = text_history(data.get("history"))
                wrist = input_wrist(data.get("wrist", 15))
                exclude = data.get("exclude") or []
                if not isinstance(exclude, list) or len(exclude) > 100 or any(not isinstance(x, str) or len(x) > 100 for x in exclude):
                    raise ValueError("排除方案格式不正确")
                tags, by = None, "rules"
                degraded = False
                degraded_reason = ""
                if ai.provider():
                    try:
                        vocab = {k: sorted({v for p in plans.all_plans() for v in (p.get(k) or [])}) for k in ("audience", "occasion", "meaning", "style")}
                        if not AI_SLOTS.acquire(blocking=False):
                            return self.send(429, {"error": "请求较多，请稍后重试"})
                        try:
                            t = ai.extract_tags(text, history, vocab)
                        finally:
                            AI_SLOTS.release()
                        if t:
                            local = plans.extract(text, history)
                            tags = {**local, **{k: v for k, v in t.items() if v}}
                            by = "ai"
                    except Exception:
                        sys.stderr.write("AI tag extraction failed\n")
                        if not env.ai_fallback_allowed():
                            return self.send(502, {"error": "AI 暂时不可用"})
                        degraded = True
                        degraded_reason = "ai_unavailable"
                elif not env.ai_fallback_allowed():
                    # production/trial 未配置 AI 且未显式允许降级：不得用本地规则冒充 AI 方案
                    return self.send(502, {"error": "AI 暂时不可用"})
                out = plans.match(text, beads, wrist, history, set(exclude), tags)
                out["by"] = by
                if degraded:
                    out["degraded"] = True
                    out["degradedReason"] = degraded_reason
                return self.send(200, out)
            if path == "/api/orders":
                if not env.demo_orders_allowed():
                    return self.send(403, {"error": "演示下单已关闭"})
                beads = {b["id"]: b for b in db.list("beads") if b.get("onSale", True)}
                ids = data.get("beads") or []
                if len(ids) < 6 or any(x not in beads for x in ids):
                    return self.send(400, {"error": "手串里有珠子已下架，请回去调整"})
                for k in ("person", "phone", "addr"):
                    if not str(data.get(k) or "").strip():
                        return self.send(400, {"error": "请填写收货人、手机号和地址"})
                if not re.match(r"^1\d{10}$", str(data.get("phone"))):
                    return self.send(400, {"error": "手机号要 11 位数字，以 1 开头"})
                priced = pricing.quote([{"unitPriceFen": user_api.bead_price_fen(beads[x])} for x in ids], data)
                goods = priced["goodsFen"] / 100
                ship = priced["shippingFen"] / 100
                promo = 0
                no = "CGZ" + time.strftime("%y%m%d") + uuid.uuid4().hex[:4].upper()
                order = {"no": no, "name": str(data.get("name") or "我的手串")[:20], "beads": ids, "wrist": data.get("wrist"),
                         "length": data.get("length"), "cord": data.get("cord", 0), "gift": bool(data.get("gift")),
                         "goods": goods, "ship": ship, "promo": promo, "total": priced["totalFen"] / 100,
                         "person": data["person"].strip()[:20], "phone": data["phone"], "addr": data["addr"].strip()[:120],
                         "status": "待串制", "createdAt": int(time.time() * 1000)}
                db.put("orders", no, order)
                return self.send(200, order)
            if path == "/api/upload":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                result = {"url": save_image(data.get("data"))}
                self.audit_admin_mutation(path)
                return self.send(200, result)
            if path.startswith("/api/ai/"):
                return self.ai_route(path, data)
            # ----- 后台：新建 -----
            m = re.match(r"^/api/admin/(beads|templates|banners)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                if m.group(1) == "beads":
                    result = commerce.create_product(db, data)
                    self.audit_admin_mutation(path + "/" + result["id"])
                    return self.send(200, result)
                if m.group(1) == "templates":
                    result = commerce.create_template(db, data)
                    self.audit_admin_mutation(path + "/" + result["id"])
                    return self.send(200, result)
                err = validate("banners", data)
                if err:
                    return self.send(400, {"error": err})
                rid = data.get("id") or "bn" + uuid.uuid4().hex[:6]
                result = db.put("banners", rid, data)
                self.audit_admin_mutation(path + "/" + rid)
                return self.send(200, result)
            if path == "/api/admin/templates/expand":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                tpl_src = data
                if data.get("templateId") and not data.get("pattern"):
                    tpl_src = db.get("templates", str(data.get("templateId")))
                    if not tpl_src:
                        return self.send(404, {"error": "模板不存在"})
                return self.send(200, commerce.expand_template_recipe(db, tpl_src, wrist=data.get("wrist", 15)))
            m = re.match(r"^/api/admin/(beads|templates)/([\w-]+)/copy$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                if m.group(1) == "beads":
                    return self.send(200, commerce.copy_product(db, m.group(2)))
                return self.send(200, commerce.copy_template(db, m.group(2)))
            if path == "/api/admin/after-sales":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                return self.send(200, commerce.create_after_sale(db, data))
            if path == "/api/admin/terms":
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                return self.send(200, commerce.create_term(db, data))
            if self._route_dispatch("POST", path, data):
                return
            return self.send(404, {"error": "not_found"})
        except user_api.IdempotencyConflict as e:
            return self.send(409, {"error": str(e), "code": "idempotency_conflict"})
        except user_api.PriceChanged:
            return self.send(409, {"error": "商品价格或规格已变化，请刷新并重新确认订单", "code": "price_changed"})
        except ValueError as e:
            return self.send(400, {"error": str(e)})
        except KeyError as e:
            return self.send(404, {"error": str(e)})
        except Exception as e:
            traceback.print_exc()
            return self.send(500, {"error": "服务暂时不可用，请稍后重试"})

    def do_PUT(self):
        path = urlparse(self.path).path
        try:
            design_match = re.fullmatch(r"/api/designs/([a-f0-9]{32})", path)
            if design_match:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                data = self.body()
                expected = data.get("expectedUpdatedAt")
                if type(expected) is not int or expected < 0:
                    return self.send(400, {"error": "请提供设计版本 expectedUpdatedAt"})
                design = user_api.design_data(data, uid)
                update_status, saved = db.update_design_if_version(design_match.group(1), uid, expected, design)
                if update_status == 'missing':
                    return self.send(404, {"error": "设计不存在"})
                if update_status == 'conflict':
                    return self.send(409, {"error": "设计已在其他设备修改，请重新获取后处理冲突", "code": "design_conflict"})
                return self.send(200, user_api.public_design(saved))
            data = self.body()
            m = re.match(r"^/api/admin/orders/([\w-]+)/(status|logistics|work-order|quality-gate)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                rid, action = m.groups()
                if action == "status":
                    group, to = data.get("group"), data.get("to")
                    if group not in status.GROUP_FIELDS or not to:
                        return self.send(400, {"error": "请提供 group 和 to"})
                    result = commerce.transition_order_status(db, rid, group, to, data.get("note") or "", data.get("logistics"))
                elif action == "logistics":
                    result = commerce.update_order_logistics(db, rid, data)
                elif action == "work-order":
                    result = commerce.update_work_order(db, rid, data)
                else:
                    result = commerce.record_quality_gate(db, rid, data)
                self.audit_admin_mutation(path)
                return self.send(200, result)
            m = re.match(r"^/api/admin/orders/([\w-]+)/(address|note)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                rid, action = m.groups()
                if action == "address":
                    commerce.change_order_address(db, rid, data, actor="admin")
                else:
                    commerce.add_internal_note(db, rid, data.get("text"), actor="admin")
                self.audit_admin_mutation(path)
                return self.send(200, commerce.order_detail(db, rid))
            m = re.match(r"^/api/admin/after-sales/([\w-]+)/transition$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                result = commerce.transition_after_sale(db, m.group(1), data.get("action"), data.get("note") or "", data.get("returnLogistics"), data.get("result"))
                self.audit_admin_mutation(path)
                return self.send(200, result)
            m = re.match(r"^/api/admin/(beads|templates|banners|terms|orders)/([\w-]+)$", path)
            if m:
                if not self.admin_ok():
                    return self.send(401, {"error": "需要后台口令"})
                table, rid = m.groups()
                if table == "orders":
                    return self.send(400, {"error": "旧订单状态接口已停用，请使用分组状态接口"})
                if table == "beads":
                    result = commerce.update_product(db, rid, data)
                if table == "templates":
                    result = commerce.update_template(db, rid, data)
                if table == "terms":
                    result = commerce.update_term(db, rid, data)
                if table == "banners":
                    err = validate("banners", data)
                    if err:
                        return self.send(400, {"error": err})
                    result = db.put("banners", rid, data)
                self.audit_admin_mutation(path)
                return self.send(200, result)
            if self._route_dispatch("PUT", path, data):
                return
            return self.send(404, {"error": "not_found"})
        except ValueError as e:
            return self.send(400, {"error": str(e)})
        except KeyError as e:
            return self.send(404, {"error": str(e)})
        except Exception as e:
            traceback.print_exc()
            return self.send(500, {"error": "服务暂时不可用，请稍后重试"})

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path == "/api/admin/session":
            return self.admin_logout()
        try:
            design_match = re.fullmatch(r"/api/designs/([a-f0-9]{32})", path)
            if design_match:
                uid = self.user()
                if not uid:
                    return self.send(401, {"error": "请先登录"})
                old = db.get("designs", design_match.group(1))
                if not old or old.get("userId") != uid:
                    return self.send(404, {"error": "设计不存在"})
                db.delete("designs", design_match.group(1))
                return self.send(200, {"ok": True})
            m = re.match(r"^/api/admin/(beads|templates|banners|terms)/([\w-]+)$", path)
            if not m:
                if self._route_dispatch("DELETE", path):
                    return
                return self.send(404, {"error": "not_found"})
            if not self.admin_ok():
                return self.send(401, {"error": "需要后台口令"})
            table, rid = m.groups()
            if table == "beads":
                commerce.delete_product(db, rid)
            elif table == "templates":
                commerce.delete_template(db, rid)
            elif table == "terms":
                commerce.delete_term(db, rid)
            else:
                db.delete("banners", rid)
            self.audit_admin_mutation(path)
            return self.send(200, {"ok": True})
        except KeyError as e:
            return self.send(404, {"error": str(e)})
        except Exception:
            traceback.print_exc()
            return self.send(500, {"error": "服务暂时不可用，请稍后重试"})

    # ---------- AI ----------
    def ai_route(self, path, data):
        if path not in ("/api/ai/design", "/api/ai/photo", "/api/ai/review"):
            return self.send(404, {"error": "not_found"})
        beads, _, _ = on_sale_catalog()
        try:
            wrist = input_wrist(data.get("wrist", 15))
            history = text_history(data.get("history"))
            chosen = data.get("beads") or []
            if not isinstance(chosen, list) or len(chosen) > 500 or any(not isinstance(x, str) or len(x) > 100 for x in chosen):
                raise ValueError("珠子数据格式不正确")
            image = image_part(data.get("image")) if path == "/api/ai/photo" else None
        except ValueError as e:
            return self.send(400, {"error": str(e)})
        if not ai.provider():
            if env.ai_fallback_allowed():
                return self.send(503, {"error": "未配置 AI 模型", "fallback": True})
            return self.send(502, {"error": "AI 暂时不可用，请稍后重试"})
        if not AI_SLOTS.acquire(blocking=False):
            return self.send(429, {"error": "请求较多，请稍后重试"})
        try:
            if path == "/api/ai/design":
                out = ai.design(beads, str(data.get("text") or "")[:200], history, wrist)
            elif path == "/api/ai/photo":
                out = ai.photo(beads, image)
            elif path == "/api/ai/review":
                out = ai.review(beads, chosen, wrist, bool(data.get("fitOk")))
            else:
                return self.send(404, {"error": "not_found"})
        except Exception as e:   # AI 出错不让前台报错：返回 502，前台用本地规则
            sys.stderr.write(f"AI provider request failed: {type(e).__name__}: {e}\n")
            return self.send(502, {"error": "AI 暂时不可用，请稍后重试"})
        finally:
            AI_SLOTS.release()
        if out is None:
            if env.ai_fallback_allowed():
                return self.send(503, {"error": "未配置 AI 模型", "fallback": True})
            return self.send(502, {"error": "AI 暂时不可用，请稍后重试"})
        if isinstance(out, dict):
            key = "designs" if isinstance(out.get("designs"), list) else "results" if isinstance(out.get("results"), list) else None
            if key:
                out[key] = content_security.filter_ai_entries(out[key])
            for field in ("reply", "text", "summary"):
                if isinstance(out.get(field), str) and not content_security.allowed(out[field]):
                    out[field] = "已生成搭配，请查看具体方案。"
        return self.send(200, out)


def validate(table, d):
    if table == "beads":
        if not str(d.get("name") or "").strip():
            return "请填写珠子名称"
        if not (isinstance(d.get("mm"), (int, float)) and d["mm"] > 0):
            return "请填写尺寸（mm），用户要靠它判断合不合手"
        try:
            user_api.bead_price_fen(d)
        except (KeyError, TypeError, ValueError):
            return "请填写有效的整数分单价"
        if d.get("mat") not in ai.MATS:
            return "材质不对"
        if d.get("kb"):
            k = kb.get(d["kb"])
            if not k:
                return "知识库里没有这个品种，请重新选"
            level = (k.get("compliance") or {}).get("level")
            if level == "banned":
                return f"{k.get('name')}属于禁售材质，不能上架"
            if level == "restricted" and not str(d.get("legal") or "").strip():
                return f"{k.get('name')}受保护或有来源要求，请填写合法来源证明（如证书编号、进口许可）"
        bad = kb.banned_in(" ".join(d.get("tags") or []))
        if bad:
            return "寓意里有不能用的词：" + "、".join(bad) + "。只写寓意，不写功效"
    if table == "templates":
        if not str(d.get("name") or "").strip():
            return "请填写模板名称"
        if not d.get("pattern"):
            return "循环花型至少要有一颗珠子"
        ids = {b["id"] for b in db.list("beads")}
        bad = [x for x in (d.get("special") or []) + d["pattern"] + (d.get("tail") or []) if x not in ids]
        if bad:
            return "模板里有不存在的珠子：" + "、".join(bad)
    if table == "banners":
        if not str(d.get("title") or "").strip():
            return "请填写标题"
        if not d.get("tpl") and d.get("go") not in ("diy", "ai"):
            return "请选择点击后去哪：某个模板、自己串或 AI 配"
    return None


if __name__ == "__main__":
    validate_bind(HOST, ADMIN_TOKEN, os.environ.get("ALLOW_PUBLIC_BIND") == "1", not env.demo_orders_allowed())
    print(f"串个珠服务已启动：{HOST}:{PORT}")
    print("AI：", ai.status())
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
