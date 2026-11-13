"""后台账号、角色和持久会话。"""
import hashlib
import hmac
import contextvars
import os
import re
import money
import secrets
import time
import uuid

PERMISSIONS = {
    "view_work_orders": "看工单", "work_orders": "做单", "quality_gate": "质检",
    "view_orders": "看订单", "process_orders": "处理订单",
    "edit_order_address": "改地址和备注", "cancel_orders": "取消订单",
    "process_after_sales": "处理售后", "refund": "退款",
    "moderate_reviews": "审核评价", "edit_content": "编辑首页和文章",
    "publish_terms": "编辑和发布条款", "edit_products": "编辑商品",
    "edit_prices": "改价格", "edit_templates": "编辑模板",
    "lookup_users": "查用户", "view_full_contact": "看完整手机号和地址",
    "view_cost": "看成本价和毛利", "export_data": "导出表格",
    "edit_kb": "编辑知识库", "manage_accounts": "管理账号和权限",
}

ROLE_PERMISSIONS = {
    "owner": tuple(PERMISSIONS),
    "operator": ("view_work_orders", "view_orders", "moderate_reviews", "edit_content",
                 "edit_products", "edit_templates", "edit_kb"),
    "service": ("view_work_orders", "view_orders", "process_orders", "edit_order_address",
                "cancel_orders", "process_after_sales", "moderate_reviews", "lookup_users",
                "view_full_contact"),
    "maker": ("view_work_orders", "work_orders", "quality_gate"),
}
ROLE_NAMES = {"owner": "负责人", "operator": "运营", "service": "客服", "maker": "做单师傅"}
CURRENT_ADMIN = contextvars.ContextVar("current_admin", default=None)
PBKDF2_ITERATIONS = 600000

# Method, complete path, permission. More specific paths precede collection paths.
ROUTE_PERMISSIONS = (
    ("GET", r"/api/admin/audit", "manage_accounts"),
    ("GET", r"/api/admin/ai-logs", "view_orders"),
    ("GET", r"/api/admin/ai-stats", "view_orders"),
    ("GET", r"/api/admin/work-orders", "view_work_orders"),
    ("GET", r"/api/admin/orders/[\w-]+/work-order", "view_work_orders"),
    ("GET", r"/api/admin/orders(?:/[\w-]+)?", "view_orders"),
    ("GET", r"/api/admin/after-sales(?:/[\w-]+)?", "process_after_sales"),
    ("GET", r"/api/admin/beads(?:/[\w-]+)?", "edit_products"),
    ("GET", r"/api/admin/templates(?:/[\w-]+/expand)?", "edit_templates"),
    ("GET", r"/api/admin/banners", "edit_content"),
    ("GET", r"/api/admin/terms", "publish_terms"),
    ("GET", r"/api/admin/accounts", "manage_accounts"),
    ("POST", r"/api/admin/accounts/bootstrap", "manage_accounts"),
    ("PUT", r"/api/admin/accounts/me/password", "manage_accounts"),
    ("GET", r"/api/admin/shares", "edit_content"),
    ("GET", r"/api/admin/articles(?:/[\w-]+)?", "edit_content"),
    ("POST", r"/api/admin/articles(?:/[\w-]+/(?:publish|unpublish))?", "edit_content"),
    ("PUT", r"/api/admin/articles/[\w-]+", "edit_content"),
    ("DELETE", r"/api/admin/articles/[\w-]+", "edit_content"),
    ("POST", r"/api/admin/accounts(?:/[\w-]+(?:/disable|/reset-password)?)?", "manage_accounts"),
    ("PUT", r"/api/admin/accounts/[\w-]+", "manage_accounts"),
    ("POST", r"/api/admin/shares/[\w-]+/take-down", "edit_content"),
    ("POST", r"/api/admin/beads(?:/[\w-]+/copy)?", "edit_products"),
    ("PUT", r"/api/admin/beads/[\w-]+", "edit_products"),
    ("DELETE", r"/api/admin/beads/[\w-]+", "edit_products"),
    ("POST", r"/api/admin/templates(?:/expand|/[\w-]+/copy)?", "edit_templates"),
    ("PUT", r"/api/admin/templates/[\w-]+", "edit_templates"),
    ("DELETE", r"/api/admin/templates/[\w-]+", "edit_templates"),
    ("POST", r"/api/admin/banners", "edit_content"),
    ("PUT", r"/api/admin/banners/[\w-]+", "edit_content"),
    ("DELETE", r"/api/admin/banners/[\w-]+", "edit_content"),
    ("POST", r"/api/admin/terms", "publish_terms"),
    ("PUT", r"/api/admin/terms/[\w-]+", "publish_terms"),
    ("DELETE", r"/api/admin/terms/[\w-]+", "publish_terms"),
    ("POST", r"/api/admin/after-sales", "process_after_sales"),
    ("PUT", r"/api/admin/after-sales/[\w-]+/transition", "process_after_sales"),
    ("PUT", r"/api/admin/orders/[\w-]+/(?:address|note)", "edit_order_address"),
    ("PUT", r"/api/admin/orders/[\w-]+/work-order", "work_orders"),
    ("PUT", r"/api/admin/orders/[\w-]+/quality-gate", "quality_gate"),
    ("PUT", r"/api/admin/orders/[\w-]+/(?:status|logistics)", "process_orders"),
    ("PUT", r"/api/admin/orders/[\w-]+", "process_orders"),
    ("POST", r"/api/upload", "edit_content"),
)


def route_permission(method, path, data=None, db=None):
    if method == "PUT" and re.fullmatch(r"/api/admin/orders/[\w-]+/status", path):
        if isinstance(data, dict) and data.get("to") in ("cancelled", "canceled"):
            return "cancel_orders"
    if method == "PUT" and re.fullmatch(r"/api/admin/after-sales/[\w-]+/transition", path):
        if isinstance(data, dict) and data.get("action") in ("refund", "confirm_refund"):
            return "refund"
    if method == "PUT" and re.fullmatch(r"/api/admin/beads/[\w-]+", path):
        if isinstance(data, dict) and any(key in data for key in ("price", "priceFen")):
            existing = db.get("beads", path.rsplit("/", 1)[-1]) if db is not None else None
            if existing is None:
                return "edit_prices"
            try:
                old_fen = (money.parse_fen(existing["priceFen"]) if existing.get("priceFen") is not None
                           else money.yuan_to_fen(existing["price"]))
                if ("priceFen" in data and money.parse_fen(data["priceFen"]) != old_fen) or (
                    "price" in data and money.yuan_to_fen(data["price"]) != old_fen
                ):
                    return "edit_prices"
            except (KeyError, ValueError):
                return "edit_prices"
    return next((perm for verb, pattern, perm in ROUTE_PERMISSIONS
                 if verb == method and re.fullmatch(pattern, path)), None)


def has_permission(db, user, perm):
    if not user or user.get("bootstrap"):
        return False
    if user.get("roleId") == "owner":
        return True
    role = db.get("admin_roles", user.get("roleId"))
    return bool(role and perm in role.get("permissions", ()))


def mask_order(db, value):
    """按当前后台账号权限返回副本，不修改数据库里的订单。"""
    user = CURRENT_ADMIN.get()
    if user is None:
        return value
    show_contact = has_permission(db, user, "view_full_contact")
    show_cost = has_permission(db, user, "view_cost")

    def masked(item):
        if isinstance(item, list):
            return [masked(child) for child in item]
        if not isinstance(item, dict):
            return item
        result = {}
        for key, child in item.items():
            if key == "costFen" and not show_cost:
                continue
            if key in ("phone", "mobile", "contactPhone", "recipientPhone") and not show_contact:
                digits = str(child or "")
                result[key] = digits[:3] + "****" + digits[-4:] if re.fullmatch(r"1\d{10}", digits) else "***"
            elif key in ("addr", "address") and isinstance(child, str) and not show_contact:
                district = re.search(r"^.*?(?:区|县|旗)", child)
                result[key] = district.group(0) + "***" if district else "***"
            else:
                result[key] = masked(child)
        return result

    return masked(value)


def hash_password(password):
    if not isinstance(password, str) or len(password) < 8:
        raise ValueError("密码至少 8 位")
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password, stored):
    try:
        method, rounds_text, salt_hex, digest_hex = stored.split("$")
        if method != "pbkdf2_sha256" or not rounds_text.isdecimal():
            return False
        rounds = int(rounds_text)
        salt, expected = bytes.fromhex(salt_hex), bytes.fromhex(digest_hex)
        if not 1 <= rounds <= 10000000 or len(salt) != 16 or len(expected) != 32:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, rounds)
        return hmac.compare_digest(actual, expected)
    except (AttributeError, TypeError, ValueError, OverflowError):
        return False


def public_user(user):
    return {k: user.get(k) for k in ("id", "username", "name", "roleId", "status",
                                     "mustChangePassword", "createdAt", "lastLoginAt")}


def find_user(db, username):
    return next((u for u in db.list("admin_users") if u.get("username") == username), None)


def create_user(db, username, name, role_id, password=None):
    username = str(username or "").strip()
    name = str(name or "").strip()
    if not username or not name:
        raise ValueError("账号和名字不能为空")
    if find_user(db, username):
        raise ValueError("账号已存在")
    if not db.get("admin_roles", role_id):
        raise ValueError("角色不存在")
    temporary = password is None
    password = password or secrets.token_urlsafe(12)
    now = int(time.time())
    user = {"username": username, "name": name, "roleId": role_id,
            "status": "active", "passwordHash": hash_password(password),
            "mustChangePassword": temporary, "createdAt": now, "lastLoginAt": None}
    uid = uuid.uuid4().hex
    db.put("admin_users", uid, user)
    return public_user(user), password if temporary else None


def login_user(db, username, password):
    user = find_user(db, username)
    if not user or user.get("status") != "active" or not verify_password(password, user.get("passwordHash")):
        return None
    user["lastLoginAt"] = int(time.time())
    db.put("admin_users", user["id"], user)
    return user


def create_session(db, user_id, ttl):
    sid = secrets.token_urlsafe(32)
    db.put("admin_sessions", sid, {"userId": user_id, "expiresAt": time.time() + ttl})
    return sid


def session_user(db, sid):
    session = db.get("admin_sessions", sid)
    if not session or session.get("expiresAt", 0) <= time.time():
        return None
    if session.get("userId") == "__bootstrap__":
        return {"id": "__bootstrap__", "name": "初始化", "bootstrap": True}
    user = db.get("admin_users", session.get("userId"))
    return user if user and user.get("status") == "active" else None


def require_last_owner(db, user, new_role=None, new_status=None):
    if user.get("roleId") != "owner":
        return
    if (new_role is None or new_role == "owner") and (new_status is None or new_status == "active"):
        return
    owners = [u for u in db.list("admin_users") if u.get("roleId") == "owner" and u.get("status") == "active"]
    if user.get("status") == "active" and len(owners) <= 1:
        raise ValueError("最后一个在用的负责人不能停用或降级")
