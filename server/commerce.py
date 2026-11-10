"""后台电商业务：商品 / 模板 / 订单 / 售后 / 物流 / 条款 / 审计。

金额一律整数分（fen）。所有后台写操作都写审计日志；订单与售后状态变更同时写状态历史。
不接真实支付与退款，不写任何密钥；支付状态不可由后台手工修改。
"""
import re
import time
import uuid

import kb
import payments
import status

ACTOR = "admin"


def fen(yuan):
    """元（浮点）转整数分。"""
    try:
        return int(round(float(yuan) * 100))
    except (TypeError, ValueError):
        raise ValueError("金额格式不正确")


def _now():
    return int(time.time() * 1000)


def _new_id(prefix):
    return prefix + uuid.uuid4().hex[:8]


# ---------------------------------------------------------------- 审计

def audit(db, actor, action, target, target_id, detail=None):
    """写一条操作审计。actor 默认为后台操作员。"""
    rec = {"actor": actor or ACTOR, "action": action, "target": target,
           "targetId": str(target_id), "detail": (detail or "")[:500], "at": _now()}
    db.put("audit_logs", _new_id("a"), rec)
    return rec


def list_audit(db, q="", target="", limit=500):
    rows = db.list("audit_logs")
    rows.sort(key=lambda r: r.get("at", 0), reverse=True)
    q = (q or "").strip().lower()
    if target:
        rows = [r for r in rows if r.get("target") == target]
    if q:
        rows = [r for r in rows if q in str(r.get("targetId") or "").lower()
                or q in str(r.get("detail") or "").lower() or q in str(r.get("action") or "").lower()]
    return rows[:limit]


# ---------------------------------------------------------------- 图片

def clean_images(images):
    """主图+详情图列表：去空、去重，最多 12 张。第一张即主图。"""
    out = []
    for i in (images or []):
        if isinstance(i, str) and i.strip() and i.strip() not in out:
            out.append(i.strip())
    return out[:12]


# ---------------------------------------------------------------- 商品

def _check_kb(d, ptype):
    """珠子/隔片类目的知识库合规检查（保留原有规则）。"""
    if ptype not in ("bead", "spacer") or not d.get("kb"):
        return None
    k = kb.get(d["kb"])
    if not k:
        return "知识库里没有这个品种，请重新选"
    level = (k.get("compliance") or {}).get("level")
    if level == "banned":
        return f"{k.get('name')}属于禁售材质，不能上架"
    if level == "restricted" and not str(d.get("legal") or "").strip():
        return f"{k.get('name')}受保护或有来源要求，请填写合法来源证明"
    return None


def normalize_product(data, existing=None):
    """校验并归一化商品文档。返回 (doc, error)。doc 始终包含 status / type / images / onSale / priceFen。"""
    d = dict(data or {})
    name = str(d.get("name") or "").strip()
    if not name:
        return None, "请填写商品名称"

    ptype = d.get("type") or status.product_type(existing or {})
    if ptype not in status.PRODUCT_TYPES:
        return None, "商品类型不正确"

    mat = d.get("mat")
    if ptype in ("bead", "spacer"):
        if mat not in status.BEAD_MATERIALS:
            return None, "材质不正确"
    elif mat not in status.MATERIALS:
        return None, "材质不正确"

    mm = d.get("mm")
    if mm is not None and (isinstance(mm, bool) or not isinstance(mm, (int, float)) or mm <= 0):
        return None, "尺寸格式不正确"
    if ptype in ("bead", "spacer") and mm is None:
        return None, "请填写尺寸（mm），用户要靠它判断合不合手"

    price = d.get("price")
    if isinstance(price, bool) or not isinstance(price, (int, float)) or price < 0:
        return None, "请填写价格"
    price_fen = fen(price)

    pstatus = d.get("status") or status.product_status(existing or d)
    if pstatus not in status.PRODUCT_STATUSES:
        return None, "商品状态不正确"

    stock = d.get("stock") or "in_stock"
    if stock not in ("in_stock", "low_stock", "out_of_stock", "preorder"):
        stock = "in_stock"

    err = _check_kb(d, ptype)
    if err:
        return None, err
    bad = kb.banned_in(" ".join(d.get("tags") or []))
    if bad:
        return None, "寓意里有不能用的词：" + "、".join(bad) + "。只写寓意，不写功效"

    images = clean_images(d.get("images"))
    out = dict(d)
    out.update({
        "name": name, "type": ptype, "mat": mat, "price": price, "priceFen": price_fen,
        "status": pstatus, "stock": stock, "images": images,
        "onSale": status.product_on_sale({"status": pstatus}),
        "photo": images[0] if images else d.get("photo", ""),
    })
    if ptype in ("bead", "spacer"):
        out["mm"] = mm
    # 旧字段保持兼容
    if ptype == "spacer":
        out["spacer"] = True
    out.pop("id", None)
    return out, None


def list_products(db, q="", type_="", pstatus=""):
    rows = db.list("beads")
    q = (q or "").strip().lower()
    if type_:
        rows = [r for r in rows if status.product_type(r) == type_]
    if pstatus:
        rows = [r for r in rows if status.product_status(r) == pstatus]
    if q:
        rows = [r for r in rows if q in str(r.get("name") or "").lower()
                or q in str(r.get("id") or "").lower()
                or q in " ".join(r.get("tags") or []).lower()]
    return rows


def create_product(db, data, actor=ACTOR):
    doc, err = normalize_product(data)
    if err:
        raise ValueError(err)
    rid = data.get("id") or _new_id("b")
    saved = db.put("beads", rid, doc)
    audit(db, actor, "create", "product", rid, doc.get("name"))
    return saved


def update_product(db, rid, data, actor=ACTOR):
    existing = db.get("beads", rid)
    if not existing:
        raise KeyError("商品不存在")
    doc, err = normalize_product(data, existing)
    if err:
        raise ValueError(err)
    saved = db.put("beads", rid, doc)
    audit(db, actor, "update", "product", rid, doc.get("name"))
    return saved


def copy_product(db, rid, actor=ACTOR):
    existing = db.get("beads", rid)
    if not existing:
        raise KeyError("商品不存在")
    doc = dict(existing)
    doc["name"] = str(doc.get("name") or "") + "（副本）"
    doc["status"] = "draft"
    doc["onSale"] = False
    new_id = _new_id("b")
    doc.pop("id", None)
    saved = db.put("beads", new_id, doc)
    audit(db, actor, "copy", "product", new_id, f"复制自 {rid}")
    return saved


def delete_product(db, rid, actor=ACTOR):
    existing = db.get("beads", rid)
    if not existing:
        raise KeyError("商品不存在")
    db.delete("beads", rid)
    audit(db, actor, "delete", "product", rid, existing.get("name"))


def archive_product(db, rid, actor=ACTOR):
    existing = db.get("beads", rid)
    if not existing:
        raise KeyError("商品不存在")
    existing["status"] = "archived"
    existing["onSale"] = False
    saved = db.put("beads", rid, existing)
    audit(db, actor, "archive", "product", rid, existing.get("name"))
    return saved


# ---------------------------------------------------------------- 模板

def normalize_template(db, data, existing=None):
    d = dict(data or {})
    name = str(d.get("name") or "").strip()
    if not name:
        return None, "请填写模板名称"
    if not d.get("pattern"):
        return None, "循环花型至少要有一颗珠子"
    ids = {b["id"] for b in db.list("beads") if status.product_type(b) in ("bead", "spacer")}
    bad = [x for x in (d.get("special") or []) + d["pattern"] + (d.get("tail") or []) if x not in ids]
    if bad:
        return None, "模板里有不存在的珠子：" + "、".join(bad)
    pstatus = d.get("status") or status.product_status(existing or d)
    if pstatus not in status.PRODUCT_STATUSES:
        return None, "模板状态不正确"
    images = clean_images(d.get("images"))
    out = dict(d)
    out.update({
        "name": name, "status": pstatus, "images": images,
        "onSale": status.product_on_sale({"status": pstatus}),
        "cover": images[0] if images else d.get("cover", ""),
    })
    out.pop("id", None)
    return out, None


def template_warnings(db, tpl):
    """模板引用了已下架/已归档商品时给出提示。"""
    ids = (tpl.get("special") or []) + (tpl.get("pattern") or []) + (tpl.get("tail") or [])
    warnings = []
    for rid in dict.fromkeys(ids):
        b = db.get("beads", rid)
        if not b:
            warnings.append(f"商品 {rid} 已删除")
        elif status.product_status(b) != "on_sale":
            warnings.append(f"商品「{b.get('name')}」已下架/归档")
    return warnings


def list_templates(db, q="", pstatus=""):
    rows = db.list("templates")
    q = (q or "").strip().lower()
    if pstatus:
        rows = [r for r in rows if status.product_status(r) == pstatus]
    if q:
        rows = [r for r in rows if q in str(r.get("name") or "").lower()
                or q in str(r.get("id") or "").lower()]
    return rows


def create_template(db, data, actor=ACTOR):
    doc, err = normalize_template(db, data)
    if err:
        raise ValueError(err)
    rid = data.get("id") or _new_id("t")
    saved = db.put("templates", rid, doc)
    audit(db, actor, "create", "template", rid, doc.get("name"))
    return saved


def update_template(db, rid, data, actor=ACTOR):
    existing = db.get("templates", rid)
    if not existing:
        raise KeyError("模板不存在")
    doc, err = normalize_template(db, data, existing)
    if err:
        raise ValueError(err)
    saved = db.put("templates", rid, doc)
    audit(db, actor, "update", "template", rid, doc.get("name"))
    return saved


def copy_template(db, rid, actor=ACTOR):
    existing = db.get("templates", rid)
    if not existing:
        raise KeyError("模板不存在")
    doc = dict(existing)
    doc["name"] = str(doc.get("name") or "") + "（副本）"
    doc["status"] = "draft"
    doc["onSale"] = False
    new_id = _new_id("t")
    doc.pop("id", None)
    saved = db.put("templates", new_id, doc)
    audit(db, actor, "copy", "template", new_id, f"复制自 {rid}")
    return saved


def delete_template(db, rid, actor=ACTOR):
    existing = db.get("templates", rid)
    if not existing:
        raise KeyError("模板不存在")
    db.delete("templates", rid)
    audit(db, actor, "delete", "template", rid, existing.get("name"))


def archive_template(db, rid, actor=ACTOR):
    existing = db.get("templates", rid)
    if not existing:
        raise KeyError("模板不存在")
    existing["status"] = "archived"
    existing["onSale"] = False
    saved = db.put("templates", rid, existing)
    audit(db, actor, "archive", "template", rid, existing.get("name"))
    return saved


# ---------------------------------------------------------------- 订单

def order_detail(db, no):
    """订单详情：附四组状态、状态历史、物流、售后记录。不改写旧数据。"""
    o = db.get("orders", no)
    if not o:
        return None
    out = dict(o)
    out.update(status.derive_status(o))
    out["statusHistory"] = o.get("statusHistory", [])
    out["logisticsHistory"] = o.get("logisticsHistory", [])
    out["afterSales"] = [a for a in db.list("after_sales") if a.get("orderNo") == no]
    out["termsSnapshot"] = o.get("termsSnapshot", [])
    return out


def append_history(order, actor, group, from_, to_, note=""):
    order.setdefault("statusHistory", []).append(status.history_entry(actor, group, from_, to_, note))
    # 状态历史最多保留 200 条，防止订单文档无限膨胀
    order["statusHistory"] = order["statusHistory"][-200:]


def _require_logistics_for_ship(order, logistics):
    carrier = str((logistics or {}).get("carrierName") or (order.get("logistics") or {}).get("carrierName") or "").strip()
    tracking = str((logistics or {}).get("trackingNo") or (order.get("logistics") or {}).get("trackingNo") or "").strip()
    if not carrier or not tracking:
        raise ValueError("发货前请填写承运公司和运单号")
    return carrier, tracking


def transition_order_status(db, no, group, to_, note="", logistics=None, actor=ACTOR):
    order = db.get("orders", no)
    if not order:
        raise KeyError("订单不存在")
    if group == "paymentStatus":
        raise ValueError("支付状态不可手工修改")
    if group not in ("orderStatus", "fulfillmentStatus"):
        raise ValueError("只能变更订单状态或履约状态")
    current = status.derive_status(order)
    from_ = current[group]
    status.validate_transition(group, from_, to_)

    if group == "fulfillmentStatus" and to_ == "shipped":
        carrier, tracking = _require_logistics_for_ship(order, logistics)
        lg = dict(order.get("logistics") or {})
        lg.update(logistics or {})
        lg["carrierName"] = carrier
        lg["trackingNo"] = tracking
        if not lg.get("shippedAt"):
            lg["shippedAt"] = _now()
        order["logistics"] = lg
        order.setdefault("logisticsHistory", []).append(
            {"at": _now(), "actor": actor, "action": "发货", "detail": f"{carrier} {tracking}"})
    elif group == "fulfillmentStatus" and to_ == "delivered":
        lg = dict(order.get("logistics") or {})
        if not lg.get("signedAt"):
            lg["signedAt"] = _now()
        order["logistics"] = lg

    order[group] = to_
    append_history(order, actor, group, from_, to_, note)
    saved = db.put("orders", no, order)
    audit(db, actor, "transition", "order", no, f"{group}: {from_} → {to_}")
    return saved


def update_order_logistics(db, no, logistics, actor=ACTOR):
    order = db.get("orders", no)
    if not order:
        raise KeyError("订单不存在")
    lg = dict(logistics or {})
    clean = {k: str(v or "").strip()[:100] for k, v in lg.items()
             if k in ("carrierCode", "carrierName", "trackingNo", "note")}
    if clean.get("carrierName") and not clean.get("trackingNo"):
        raise ValueError("填写了承运公司就必须填写运单号")
    for k in ("shippedAt", "signedAt"):
        if k in lg and lg[k] not in (None, ""):
            if not isinstance(lg[k], int):
                raise ValueError("发货/签收时间格式不正确")
            clean[k] = lg[k]
    order["logistics"] = {**(order.get("logistics") or {}), **clean}
    order.setdefault("logisticsHistory", []).append(
        {"at": _now(), "actor": actor, "action": "修改物流", "detail": json_dump_safe(clean)})
    order["logisticsHistory"] = order["logisticsHistory"][-200:]
    saved = db.put("orders", no, order)
    audit(db, actor, "update_logistics", "order", no, clean.get("trackingNo") or "")
    return saved


def json_dump_safe(obj):
    try:
        import json
        return json.dumps(obj, ensure_ascii=False)
    except Exception:
        return str(obj)


def list_orders(db, q="", filters=None):
    rows = db.list("orders")
    rows.sort(key=lambda o: o.get("createdAt", 0), reverse=True)
    q = (q or "").strip().lower()
    filters = filters or {}
    out = []
    for o in rows:
        groups = status.derive_status(o)
        if any(filters.get(k) and groups.get(k) != filters[k] for k in status.GROUP_FIELDS):
            continue
        if q and not (q in str(o.get("no") or "").lower() or q in str(o.get("person") or "").lower()
                      or q in str(o.get("phone") or "").lower()):
            continue
        item = dict(o)
        item.update(groups)
        out.append(item)
    return out


# ---------------------------------------------------------------- 售后

def _after_sale_no():
    return "AS" + time.strftime("%y%m%d") + uuid.uuid4().hex[:6].upper()


def create_after_sale(db, data, actor=ACTOR):
    order_no = str(data.get("orderNo") or "").strip()
    order = db.get("orders", order_no)
    if not order:
        raise ValueError("订单不存在")
    if status.derive_status(order)["afterSaleStatus"] != "none":
        raise ValueError("该订单已有进行中的售后")
    atype = data.get("type")
    if atype not in status.AFTER_SALE_TYPES:
        raise ValueError("售后类型不正确")
    reason = str(data.get("reason") or "").strip()[:200]
    if not reason:
        raise ValueError("请填写售后原因")
    refund_fen = data.get("refundFen")
    if isinstance(refund_fen, bool) or not isinstance(refund_fen, int) or refund_fen < 0:
        raise ValueError("退款金额必须是不小于 0 的整数分")
    if atype in ("仅退款", "退货退款"):
        payments.validate_refund_amount(order, refund_fen)

    no = _after_sale_no()
    rec = {"no": no, "orderNo": order_no, "type": atype, "reason": reason,
           "userNote": str(data.get("userNote") or "")[:500],
           "refundFen": refund_fen, "returnLogistics": {},
           "result": "", "status": "requested",
           "createdAt": _now(), "updatedAt": _now(),
           "history": [status.history_entry(actor, "afterSaleStatus", "none", "requested", reason)]}
    db.put("after_sales", no, rec)

    order["afterSaleStatus"] = "requested"
    append_history(order, actor, "afterSaleStatus", "none", "requested", f"创建售后 {no}")
    db.put("orders", order_no, order)
    audit(db, actor, "create", "after_sale", no, f"订单 {order_no} · {atype}")
    return rec


def _after_sale_target(action, current, atype):
    if action == "approve":
        if current != "requested":
            raise ValueError("只有申请中的售后才能同意")
        return "approved"
    if action == "reject":
        if current != "requested":
            raise ValueError("只有申请中的售后才能拒绝")
        return "rejected"
    if action == "returning":
        if atype != "退货退款":
            raise ValueError("仅退款/补发没有退货环节")
        if current != "approved":
            raise ValueError("同意后才能记录退货物流")
        return "returning"
    if action == "receive":
        if atype == "补发":
            raise ValueError("补发类型没有退货收货环节")
        if current in ("approved", "returning"):
            return "refunding"
        raise ValueError("当前状态不能确认收到退货")
    if action == "complete":
        if current == "refunding":
            return "completed"
        if current == "approved" and atype == "补发":
            return "completed"
        raise ValueError("当前状态不能完成售后")
    if action == "close":
        if current in ("completed", "closed"):
            raise ValueError("售后已结束")
        return "closed"
    raise ValueError("未知售后操作")


def transition_after_sale(db, no, action, note="", return_logistics=None, result=None, actor=ACTOR):
    rec = db.get("after_sales", no)
    if not rec:
        raise KeyError("售后记录不存在")
    current = rec["status"]
    target = _after_sale_target(action, current, rec["type"])
    status.validate_transition("afterSaleStatus", current, target)
    # 支付域退款（paid → refunding → refunded/refund_failed）走 payments.handle_refund；
    # 当前未接真实微信退款，故此处只推进售后域状态，不伪造订单 paymentStatus 的退款流转。

    rec["status"] = target
    rec["updatedAt"] = _now()
    if result is not None:
        rec["result"] = str(result)[:500]
    if return_logistics:
        rl = {k: str(v or "").strip()[:100] for k, v in (return_logistics or {}).items()
              if k in ("carrierCode", "carrierName", "trackingNo")}
        rec["returnLogistics"] = {**rec.get("returnLogistics", {}), **rl}
    rec.setdefault("history", []).append(status.history_entry(actor, "afterSaleStatus", current, target, note))
    rec["history"] = rec["history"][-200:]
    db.put("after_sales", no, rec)

    order = db.get("orders", rec["orderNo"])
    if order:
        order["afterSaleStatus"] = target
        append_history(order, actor, "afterSaleStatus", current, target, note)
        db.put("orders", rec["orderNo"], order)
    audit(db, actor, action, "after_sale", no, f"{rec['type']}: {current} → {target}")
    return rec


def list_after_sales(db, q="", pstatus=""):
    rows = db.list("after_sales")
    rows.sort(key=lambda r: r.get("createdAt", 0), reverse=True)
    q = (q or "").strip().lower()
    if pstatus:
        rows = [r for r in rows if r.get("status") == pstatus]
    if q:
        rows = [r for r in rows if q in str(r.get("no") or "").lower()
                or q in str(r.get("orderNo") or "").lower()]
    return rows


# ---------------------------------------------------------------- 条款

def normalize_term(data):
    d = dict(data or {})
    title = str(d.get("title") or "").strip()
    if not title:
        return None, "请填写标题"
    ttype = d.get("type")
    if ttype not in status.TERM_TYPES:
        return None, "条款类型不正确"
    version = str(d.get("version") or "").strip()
    if not version or not re.fullmatch(r"[A-Za-z0-9._\-]{1,30}", version):
        return None, "版本号格式不正确（如 1.0.0）"
    body = str(d.get("body") or "").strip()
    if not body:
        return None, "请填写正文"
    tstatus = d.get("status") or "draft"
    if tstatus not in status.TERM_STATUSES:
        return None, "条款状态不正确"
    effective_at = d.get("effectiveAt")
    if effective_at not in (None, "", 0) and not isinstance(effective_at, int):
        return None, "生效时间格式不正确"
    out = dict(d)
    out.update({"title": title, "type": ttype, "version": version, "body": body,
                "status": tstatus, "effectiveAt": effective_at if isinstance(effective_at, int) else None,
                "confirmed": bool(d.get("confirmed"))})
    out.pop("id", None)
    return out, None


def published_terms(db):
    """当前已发布的条款（下单时做快照用）。"""
    rows = [t for t in db.list("terms") if t.get("status") == "published"]
    rows.sort(key=lambda t: (t.get("order", 9999), t.get("id")))
    return rows


def terms_snapshot(db):
    """下单时记录的条款版本与快照。"""
    return [{"type": t.get("type"), "title": t.get("title"),
             "version": t.get("version"), "body": t.get("body")} for t in published_terms(db)]


def list_terms(db, q="", pstatus=""):
    rows = db.list("terms")
    q = (q or "").strip().lower()
    if pstatus:
        rows = [r for r in rows if r.get("status") == pstatus]
    if q:
        rows = [r for r in rows if q in str(r.get("title") or "").lower()
                or q in str(r.get("type") or "").lower()]
    return rows


def create_term(db, data, actor=ACTOR):
    doc, err = normalize_term(data)
    if err:
        raise ValueError(err)
    rid = data.get("id") or _new_id("term")
    saved = db.put("terms", rid, doc)
    audit(db, actor, "create", "term", rid, doc.get("title"))
    return saved


def update_term(db, rid, data, actor=ACTOR):
    if not db.get("terms", rid):
        raise KeyError("条款不存在")
    doc, err = normalize_term(data)
    if err:
        raise ValueError(err)
    saved = db.put("terms", rid, doc)
    audit(db, actor, "update", "term", rid, doc.get("title"))
    return saved


def delete_term(db, rid, actor=ACTOR):
    existing = db.get("terms", rid)
    if not existing:
        raise KeyError("条款不存在")
    db.delete("terms", rid)
    audit(db, actor, "delete", "term", rid, existing.get("title"))
