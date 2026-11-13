"""用户地址簿；所有读写按登录用户隔离。"""
import re
import uuid

MAX_ADDRESSES = 20


def list_for(db, user_id):
    return [row for row in db.list("addresses") if row.get("userId") == user_id]


def get_for(db, user_id, address_id):
    row = db.get("addresses", address_id)
    if not row or row.get("userId") != user_id:
        raise KeyError("地址不存在")
    return row


def _fields(data, current=None):
    if not isinstance(data, dict):
        raise ValueError("地址内容必须是对象")
    result = dict(current or {})
    for key in ("person", "phone", "region", "detail", "isDefault"):
        if key in data:
            result[key] = data[key]
    if not isinstance(result.get("person"), str) or not result["person"].strip():
        raise ValueError("请填写收货人")
    if not isinstance(result.get("phone"), str) or not re.fullmatch(r"1\d{10}", result["phone"]):
        raise ValueError("手机号格式不正确")
    region = result.get("region")
    if not isinstance(region, list) or not region or any(not isinstance(x, str) or not x.strip() for x in region):
        raise ValueError("请选择地区")
    if not isinstance(result.get("detail"), str) or not result["detail"].strip():
        raise ValueError("请填写详细地址")
    if not isinstance(result.get("isDefault", False), bool):
        raise ValueError("默认地址标记无效")
    result["person"] = result["person"].strip()
    result["detail"] = result["detail"].strip()
    result["region"] = [x.strip() for x in region]
    result["isDefault"] = result.get("isDefault", False)
    return result


def _unset_other_defaults(db, user_id, keep_id):
    for row in list_for(db, user_id):
        if row["id"] != keep_id and row.get("isDefault"):
            row["isDefault"] = False
            db.put("addresses", row["id"], row)


def create(db, user_id, data):
    existing = list_for(db, user_id)
    if len(existing) >= MAX_ADDRESSES:
        raise ValueError("最多保存 20 个地址")
    row = _fields(data)
    row["userId"] = user_id
    row["isDefault"] = row["isDefault"] or not existing
    address_id = uuid.uuid4().hex
    if row["isDefault"]:
        _unset_other_defaults(db, user_id, address_id)
    return db.put("addresses", address_id, row)


def update(db, user_id, address_id, data):
    current = get_for(db, user_id, address_id)
    row = _fields(data, current)
    row["userId"] = user_id
    if row["isDefault"]:
        _unset_other_defaults(db, user_id, address_id)
    return db.put("addresses", address_id, row)


def delete(db, user_id, address_id):
    get_for(db, user_id, address_id)
    db.delete("addresses", address_id)
    return {"ok": True}
