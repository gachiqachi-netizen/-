"""后台账号、角色和持久会话。"""
import hashlib
import hmac
import contextvars
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


def hash_password(password):
    if not isinstance(password, str) or len(password) < 8:
        raise ValueError("密码至少 8 位")
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password, stored):
    try:
        method, salt_hex, digest_hex = stored.split("$")
        if method != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
        return hmac.compare_digest(actual, bytes.fromhex(digest_hex))
    except (AttributeError, TypeError, ValueError):
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
