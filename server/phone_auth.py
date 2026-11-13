"""手机号绑定；只保存加盐摘要和脱敏值。"""
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request

import content_security
import env

_exchanger = None


def exchange_code(code):
    if not isinstance(code, str) or not code:
        raise ValueError("缺少手机号凭证")
    if _exchanger is not None:
        return _exchanger(code)
    if env.is_dev() and not content_security.configured():
        if re.fullmatch(r"dev-\d{8}", code):
            return "138" + code[4:]
        raise ValueError("开发手机号凭证无效")
    token = content_security._access_token()
    request = urllib.request.Request(
        "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token="
        + urllib.parse.quote(token),
        data=json.dumps({"code": code}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read(16384))
    if result.get("errcode") != 0:
        raise RuntimeError("微信手机号接口失败")
    return result["phone_info"]["purePhoneNumber"]


def bind_phone(db, user_id, phone):
    if not isinstance(phone, str) or not re.fullmatch(r"1\d{10}", phone):
        raise ValueError("手机号格式无效")
    salt = os.environ.get("PHONE_SALT") or ("beadloop-dev-only" if env.is_dev() else None)
    if not salt:
        raise RuntimeError("PHONE_SALT 未配置")
    digest = hashlib.sha256((phone + salt).encode()).hexdigest()
    masked = phone[:3] + "****" + phone[-4:]
    user = db.get("users", user_id)
    if user is None:
        raise KeyError("用户不存在")
    other = next((u for u in db.list("users") if u["id"] != user_id and u.get("phoneHash") == digest), None)
    if other:
        target_id = other["id"]
        for design in db.list_by_owner("designs", user_id):
            design["userId"] = target_id
            db.put("designs", design["id"], design)
        for session in db.list("sessions"):
            if session.get("userId") == user_id:
                session["userId"] = target_id
                db.put("sessions", session["id"], session)
        return {"phoneMasked": other.get("phoneMasked", masked), "merged": True}
    user["phoneHash"] = digest
    user["phoneMasked"] = masked
    db.put("users", user_id, user)
    return {"phoneMasked": masked, "merged": False}
