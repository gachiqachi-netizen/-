"""后台电商业务：商品 / 模板 / 订单 / 售后 / 物流 / 条款 / 审计。

金额一律整数分（fen）。所有后台写操作都写审计日志；订单与售后状态变更同时写状态历史。
不接真实支付与退款，不写任何密钥；支付状态不可由后台手工修改。
"""
import json
import re
import time
import uuid

import kb
import money
import notify
import payments
import plans
import pricing
import status

ACTOR = "admin"


def fen(yuan):
    """元转整数分，委托 money.yuan_to_fen（唯一权威转换）。"""
    return money.yuan_to_fen(yuan)


def _now():
    return int(time.time() * 1000)


def _new_id(prefix):
    return prefix + uuid.uuid4().hex[:8]


# ---------------------------------------------------------------- 审计

def _audit_record(actor, action, target, target_id, detail=None):
    """构造一条审计记录（不落库），供事务内/事务外复用。"""
    return {"actor": actor or ACTOR, "action": action, "target": target,
            "targetId": str(target_id), "detail": (detail or "")[:500], "at": _now()}


def audit(db, actor, action, target, target_id, detail=None):
    """写一条操作审计。actor 默认为后台操作员。"""
    rec = _audit_record(actor, action, target, target_id, detail)
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

    try:
        if "priceFen" in d:
            price_fen = money.parse_fen(d["priceFen"])
            if "price" in d and money.yuan_to_fen(d["price"]) != price_fen:
                return None, "价格与整数分金额不一致"
        elif "price" in d:
            price_fen = money.yuan_to_fen(d["price"])
        else:
            return None, "请填写价格"
    except ValueError as exc:
        return None, str(exc)
    price = price_fen / 100

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


# ---------------------------------------------------------------- 模板与配方展开

def _bead_unit_fen(b):
    if not b:
        return 0
    if "priceFen" in b and b["priceFen"] is not None:
        return money.parse_fen(b["priceFen"])
    return money.yuan_to_fen(b.get("price") or 0)


def expand_template_recipe(db, tpl_or_recipe, wrist=15):
    """根据模板配方（special/pattern/tail/fixed）与用户手围展开为完整珠序列、尺寸与物料清单（BOM）。"""
    if isinstance(wrist, bool) or not isinstance(wrist, (int, float)) or not 8 <= float(wrist) <= 30:
        raise ValueError("手围须在 8–30cm 之间")
    wrist_val = float(wrist)
    recipe = tpl_or_recipe.get("recipe") if isinstance(tpl_or_recipe.get("recipe"), dict) else tpl_or_recipe
    special = list(recipe.get("special") or tpl_or_recipe.get("special") or [])
    pattern = list(recipe.get("pattern") or tpl_or_recipe.get("pattern") or [])
    tail = list(recipe.get("tail") or tpl_or_recipe.get("tail") or [])
    fixed = recipe.get("fixed") if "fixed" in recipe else tpl_or_recipe.get("fixed")
    if fixed in ("", 0):
        fixed = None
    if not pattern:
        raise ValueError("循环花型至少要有一颗珠子")
    bead_map = {b["id"]: b for b in db.list("beads")}
    all_refs = special + pattern + tail
    missing = [bid for bid in all_refs if bid not in bead_map or status.product_type(bead_map[bid]) not in ("bead", "spacer")]
    if missing:
        raise ValueError("模板里有不存在的珠子：" + "、".join(missing))

    if fixed is not None and (type(fixed) is not int or not 1 <= fixed <= 500):
        raise ValueError("模板固定颗数不正确")
    # 尺寸规则只有一份：和用户端排模板用同一个函数（plans._fill / plans.target_mm），不在这里另写。
    main_mm, target_mm = plans.target_mm(special + pattern + tail, bead_map, wrist_val)
    seq_ids = plans._fill(special, pattern, tail, bead_map, wrist_val, fixed)

    sequence = []
    bom_map = {}
    bom_order = []
    total_mm = 0.0
    for idx, bid in enumerate(seq_ids):
        b = kb.enrich(bead_map[bid])
        mm = float(b.get("mm") or 0)
        ufen = _bead_unit_fen(bead_map[bid])
        total_mm += mm
        sequence.append({
            "seq": idx + 1,
            "id": bid,
            "name": b.get("name") or bid,
            "mm": b.get("mm"),
            "mat": b.get("mat"),
            "spacer": bool(b.get("spacer") or status.product_type(bead_map[bid]) == "spacer"),
            "unitPriceFen": ufen,
            "photo": bead_map[bid].get("photo") or ((bead_map[bid].get("images") or [""])[0]),
            "kb": b.get("kb") or "",
            "points": b.get("points") or [],
            "meaning": b.get("meaning") or "",
            "summary": b.get("summary") or "",
            "safety": b.get("safety") or "",
        })
        if bid not in bom_map:
            bom_order.append(bid)
            bom_map[bid] = {
                "id": bid,
                "name": b.get("name") or bid,
                "mm": b.get("mm"),
                "mat": b.get("mat"),
                "spacer": bool(b.get("spacer") or status.product_type(bead_map[bid]) == "spacer"),
                "count": 0,
                "unitPriceFen": ufen,
                "subtotalFen": 0,
                "positions": [],
                "onSale": status.product_on_sale(bead_map[bid]),
                "safety": b.get("safety") or "",
                "points": b.get("points") or [],
            }
        bom_map[bid]["count"] += 1
        bom_map[bid]["subtotalFen"] += ufen
        bom_map[bid]["positions"].append(idx + 1)

    materials = [bom_map[bid] for bid in bom_order]
    length_mm = round(total_mm, 1) if total_mm % 1 else int(total_mm)
    fit_delta = round(total_mm - target_mm, 1)
    is_rosary = len(seq_ids) >= 54 or bool(fixed and fixed >= 54)
    fit_ok = True if is_rosary else (-4.0 <= fit_delta <= 6.0)
    # 价格只有一份：由 pricing.quote 计算，手工费、运费规则改动只改 pricing.py。
    priced = pricing.quote([{"unitPriceFen": m["unitPriceFen"], "quantity": m["count"]} for m in materials])
    return {
        "wrist": wrist_val,
        "recipe": {"special": special, "pattern": pattern, "tail": tail, "fixed": fixed},
        "beads": seq_ids,
        "count": len(seq_ids),
        "mainMm": main_mm,
        "targetMm": target_mm,
        "lengthMm": length_mm,
        "fitDeltaMm": fit_delta,
        "isRosary": is_rosary,
        "fitOk": fit_ok,
        "sequence": sequence,
        "materials": materials,
        "goodsFen": priced["goodsFen"],
        "handworkFen": priced["handworkFen"],
        "shippingFen": priced["shippingFen"],
        "totalFen": priced["totalFen"],
        "warnings": template_warnings(db, {"special": special, "pattern": pattern, "tail": tail}),
    }


def normalize_template(db, data, existing=None):
    d = dict(data or {})
    name = str(d.get("name") or "").strip()
    if not name:
        return None, "请填写模板名称"
    recipe_in = d.get("recipe") if isinstance(d.get("recipe"), dict) else {}
    special = list(d.get("special") if "special" in d else (recipe_in.get("special") or (existing or {}).get("special") or []))
    pattern = list(d.get("pattern") if "pattern" in d else (recipe_in.get("pattern") or (existing or {}).get("pattern") or []))
    tail = list(d.get("tail") if "tail" in d else (recipe_in.get("tail") or (existing or {}).get("tail") or []))
    fixed = d.get("fixed") if "fixed" in d else recipe_in.get("fixed", (existing or {}).get("fixed"))
    if fixed in ("", 0):
        fixed = None
    if fixed is not None and (type(fixed) is not int or not 1 <= fixed <= 500):
        return None, "模板固定颗数不正确"
    if not pattern:
        return None, "循环花型至少要有一颗珠子"
    ids = {b["id"] for b in db.list("beads") if status.product_type(b) in ("bead", "spacer")}
    bad = [x for x in special + pattern + tail if x not in ids]
    if bad:
        return None, "模板里有不存在的珠子：" + "、".join(bad)
    pstatus = d.get("status") or status.product_status(existing or d)
    if pstatus not in status.PRODUCT_STATUSES:
        return None, "模板状态不正确"
    meaning = str(d.get("meaning") if "meaning" in d else (existing or {}).get("meaning") or "").strip()
    bad_words = kb.banned_in(meaning)
    if bad_words:
        return None, "寓意里有不能用的词：" + "、".join(bad_words) + "。只写寓意，不写功效"
    images = clean_images(d.get("images"))
    out = dict(d)
    out.update({
        "name": name,
        "meaning": meaning,
        "special": special,
        "pattern": pattern,
        "tail": tail,
        "fixed": fixed,
        "recipe": {"special": special, "pattern": pattern, "tail": tail, "fixed": fixed},
        "status": pstatus,
        "images": images,
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


def _enrich_template_for_admin(db, tpl):
    out = dict(tpl)
    out["recipe"] = {
        "special": list(tpl.get("special") or []),
        "pattern": list(tpl.get("pattern") or []),
        "tail": list(tpl.get("tail") or []),
        "fixed": tpl.get("fixed"),
    }
    out["warnings"] = template_warnings(db, tpl)
    try:
        out["expandedPreview"] = expand_template_recipe(db, tpl, wrist=15)
    except ValueError:
        out["expandedPreview"] = None
    return out


def list_templates(db, q="", pstatus=""):
    rows = [_enrich_template_for_admin(db, r) for r in db.list("templates")]
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
    return _enrich_template_for_admin(db, saved)


def update_template(db, rid, data, actor=ACTOR):
    existing = db.get("templates", rid)
    if not existing:
        raise KeyError("模板不存在")
    doc, err = normalize_template(db, data, existing)
    if err:
        raise ValueError(err)
    saved = db.put("templates", rid, doc)
    audit(db, actor, "update", "template", rid, doc.get("name"))
    return _enrich_template_for_admin(db, saved)


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
    return _enrich_template_for_admin(db, saved)


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
    return _enrich_template_for_admin(db, saved)


# ---------------------------------------------------------------- 跨状态约束

def _paid_fen(order):
    """可信实付金额（整数分）。未收到支付回调时一律为 0。"""
    return int(order.get("paidFen") or 0)


def customer_after_sale_types(order, now_ms):
    groups = status.derive_status(order)
    if groups['afterSaleStatus'] != 'none' or groups['paymentStatus'] != 'paid':
        return []
    logistics = groups['logisticsStatus']
    if logistics == 'not_shipped':
        return ['仅退款']
    if logistics in ('shipped', 'in_transit', 'exception'):
        return ['拒收后退款']
    if logistics == 'delivered':
        signed_at = (order.get('logistics') or {}).get('signedAt')
        if (type(signed_at) in (int, float) and signed_at <= now_ms
                and now_ms - signed_at <= AFTER_SALE_DAYS * 24 * 60 * 60 * 1000):
            return ['退货退款', '补寄配件', '改手围重串']
    return []


def refund_amount_for(order, atype):
    # 制作中退款的扣除规则待负责人定（15 号文档 E2），定了以后只改这里。
    if atype in REFUND_TYPES:
        return _paid_fen(order)
    if atype in ('补寄配件', '改手围重串'):
        return 0
    raise ValueError('售后类型不正确')


_ACTIVE_AFTER_SALE_STATUSES = ("requested", "reviewing", "approved", "returning", "refunding")
REFUND_TYPES = ("仅退款", "退货退款", "拒收后退款")
AFTER_SALE_DAYS = 7


def _reserved_fen(after_sales, order_no):
    """退款类售后尚未释放的预占金额。"""
    total = 0
    for rec in after_sales:
        if rec.get("orderNo") != order_no or rec.get("type") not in REFUND_TYPES:
            continue
        if rec.get("status") in _ACTIVE_AFTER_SALE_STATUSES:
            total += int(rec.get("reservedFen") or rec.get("requestedFen") or rec.get("refundFen") or 0)
    return total


def _refunded_fen(after_sales, order_no):
    """累计真实退款金额；只信任支付回调写入的 refundedFen。"""
    total = 0
    for a in after_sales:
        if a.get("orderNo") != order_no:
            continue
        if a.get("type") not in REFUND_TYPES:
            continue
        total += int(a.get("refundedFen") or 0)
    return total


def _order_reserved_fen(db, order_no):
    return _reserved_fen(db.list("after_sales"), order_no)


def _order_refunded_fen(db, order_no):
    """该订单累计已退款（整数分），基于 db.list 读全量售后（事务外调用）。"""
    return _refunded_fen(db.list("after_sales"), order_no)


def _cross_constraint(order, group, to_):
    """跨状态约束（集中一处，服务端权威裁决）。返回违规原因字符串，合法返回 None。"""
    groups = status.derive_status(order)
    paid = groups["paymentStatus"] == "paid"
    cancelled = groups["orderStatus"] == "cancelled"
    if group == "fulfillmentStatus":
        if to_ != "unfulfilled" and not paid:
            return "未支付订单不能开始履约或发货"
        if cancelled and to_ != "unfulfilled":
            return "订单已取消，不能继续履约"
        if to_ in ("ready_to_ship", "shipped"):
            # 每一单发货前都要过质检关口，不依赖工单是否被编辑过。
            qg = order.get("qualityGate")
            if isinstance(qg, dict) and qg.get("passed") is False:
                return "质检关口不通过，不得进入待发货"
            if not (isinstance(qg, dict) and qg.get("passed") is True):
                return "还没有通过质检，不能进入待发货"
    elif group == "logisticsStatus":
        if cancelled:
            return "订单已取消，不能继续发货"
        if to_ in ("shipped", "in_transit", "delivered") and not paid:
            return "未支付订单不能发货"
        if to_ in ("in_transit", "delivered") and groups["logisticsStatus"] == "not_shipped":
            return "未发货不能标记运输中或已签收"
        if to_ in ("shipped", "in_transit", "delivered") and groups["fulfillmentStatus"] not in ("shipped", "delivered"):
            return "订单尚未完成发货履约，不能推进物流状态"
    elif group == "orderStatus":
        if to_ == "completed":
            if not paid:
                return "未支付订单不能完成"
            if groups["fulfillmentStatus"] != "delivered":
                return "订单未完成履约（未签收），不能标记完成"
            if groups["logisticsStatus"] != "delivered":
                return "物流未签收，不能标记订单完成"
    return None


def _check_order_constraints(order, group, to_):
    """校验订单跨状态约束，违反抛 ValueError。"""
    err = _cross_constraint(order, group, to_)
    if err:
        raise ValueError(err)


def _has_paid(order):
    """是否已实付：paymentStatus == paid，或已存在真实 paidFen>0（支付回调写入，未接入时为缺省）。

    注意：不能用 totalFen 回退判断「是否已支付」——未支付订单也有 totalFen>0。
    """
    if status.derive_status(order)["paymentStatus"] == "paid":
        return True
    paid = order.get("paidFen")
    return paid is not None and int(paid or 0) > 0


def _check_refund_constraints_in(order, refund_fen, reserved_fen, refunded_fen):
    """校验退款请求、预占和真实退款总额。"""
    refund_fen = money.parse_fen(refund_fen)
    if refund_fen <= 0:
        raise ValueError("退款金额必须大于 0")
    groups = status.derive_status(order)
    if groups["paymentStatus"] == "refunded":
        raise ValueError("该订单已完成退款，不能再次退款")
    if not _has_paid(order):
        raise ValueError("未支付订单不能退款")
    cap = _paid_fen(order)
    if reserved_fen + refunded_fen + refund_fen > cap:
        raise ValueError("退款总额不能超过实付金额")


def _check_refund_constraints(order, refund_fen, db):
    """校验退款类售后的金额与支付约束（事务外，基于 db 读已退款金额）。"""
    no = order.get("no") or order.get("id")
    _check_refund_constraints_in(
        order, refund_fen, _order_reserved_fen(db, no), _order_refunded_fen(db, no))


def allowed_order_transitions(order):
    """订单详情允许的下一状态（按组），供前端渲染按钮；服务端仍是最终裁决。"""
    groups = status.derive_status(order)
    out = {}
    for group in ("orderStatus", "fulfillmentStatus", "logisticsStatus"):
        current = groups.get(group)
        states = status.next_states(group, current)
        if group == "logisticsStatus":
            # 「发货」由履约状态联动推进，物流维度不单独提供发货按钮
            states = [s for s in states if s != "shipped"]
        out[group] = [t for t in states if _cross_constraint(order, group, t) is None]
        if group == "orderStatus" and groups.get("paymentStatus") != "paid":
            # 付款后由支付回调自动确认，后台不再手动确认未付款订单
            out[group] = [t for t in out[group] if t != "confirmed"]
    out["paymentStatus"] = []
    out["afterSaleStatus"] = []
    return out


class _AtomicWriter:
    """订单/售后读改写的事务绑定写入器。

    SQLite：持有 db.lock + BEGIN IMMEDIATE，直接用 db.conn 执行 SQL（避免嵌套 db.lock 死锁）。
    PostgreSQL：持有 db.transaction() 连接，读用 SELECT ... FOR UPDATE 锁行。
    事务内只调用本写入器的方法，不调用会再开连接/再取锁的 db.get/db.put/db.list。
    """

    def __init__(self, db):
        self.db = db
        self._sqlite = hasattr(db, "lock") and hasattr(db, "conn")
        self.conn = None

    def __enter__(self):
        if self._sqlite:
            self._lock = self.db.lock
            self._lock.__enter__()
            self.conn = self.db.conn
            self.conn.execute("BEGIN IMMEDIATE")
        else:
            self._txn = self.db.transaction()
            self.conn = self._txn.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._sqlite:
            try:
                if exc_type is None:
                    self.conn.commit()
                else:
                    self.conn.rollback()
            finally:
                self._lock.__exit__(exc_type, exc, tb)
            return False
        return self._txn.__exit__(exc_type, exc, tb)

    def lock_order(self, no):
        """锁定订单行并返回文档（PG 用 FOR UPDATE，SQLite 靠 BEGIN IMMEDIATE 写锁）。"""
        if self._sqlite:
            row = self.conn.execute("SELECT doc FROM orders WHERE id = ?", (no,)).fetchone()
            return {**json.loads(row[0]), "id": no} if row else None
        return self.db.get_for_update(self.conn, "orders", no)

    def lock_after_sale(self, no):
        """锁定售后行并返回文档。"""
        if self._sqlite:
            row = self.conn.execute("SELECT doc FROM after_sales WHERE id = ?", (no,)).fetchone()
            return {**json.loads(row[0]), "id": no} if row else None
        return self.db.get_for_update(self.conn, "after_sales", no)

    def list_after_sales(self):
        if self._sqlite:
            return [json.loads(r[0]) for r in self.conn.execute("SELECT doc FROM after_sales").fetchall()]
        return [r[0] for r in self.conn.execute("SELECT doc FROM after_sales").fetchall()]

    def find_after_sale_by_key(self, order_no, idem_key):
        """按 (orderNo, idempotencyKey) 查已有售后，返回带 id 的文档或 None。"""
        if self._sqlite:
            row = self.conn.execute(
                "SELECT doc, id FROM after_sales WHERE order_no = ? AND idempotency_key = ?",
                (order_no, idem_key)).fetchone()
            return {**json.loads(row[0]), "id": row[1]} if row else None
        row = self.conn.execute(
            "SELECT doc, id FROM after_sales "
            "WHERE doc->>'orderNo' = %s AND doc->>'idempotencyKey' = %s",
            (order_no, idem_key)).fetchone()
        return {**row[0], "id": row[1]} if row else None

    def put_order(self, no, doc):
        data = dict(doc); data.pop("id", None)
        if self._sqlite:
            self.conn.execute("INSERT OR REPLACE INTO orders (id, doc, user_id) VALUES (?, ?, ?)",
                              (no, json.dumps(data, ensure_ascii=False), data.get("userId")))
        else:
            self.db.put_in_conn(self.conn, "orders", no, data)

    def put_after_sale(self, no, doc):
        data = dict(doc); data.pop("id", None)
        if self._sqlite:
            # 同时维护幂等物理列，避免 INSERT OR REPLACE 触发唯一索引的删除重插语义
            self.conn.execute(
                "INSERT INTO after_sales (id, doc, order_no, idempotency_key) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET doc=excluded.doc, order_no=excluded.order_no, "
                "idempotency_key=excluded.idempotency_key",
                (no, json.dumps(data, ensure_ascii=False), data.get("orderNo"), data.get("idempotencyKey")))
        else:
            self.db.put_in_conn(self.conn, "after_sales", no, data)

    def put_audit(self, rec):
        rid = _new_id("a")
        if self._sqlite:
            self.conn.execute("INSERT INTO audit_logs (id, doc) VALUES (?, ?)",
                              (rid, json.dumps(rec, ensure_ascii=False)))
        else:
            self.db.put_in_conn(self.conn, "audit_logs", rid, rec)


def _atomic_order_transition(db, no, fn, audit_builder=None):
    """在数据库写事务内原子地读-改-写订单，避免并发重复转换或状态覆盖。

    fn(order) 原地修改订单（可抛 ValueError/KeyError），返回修改后的订单。
    audit_builder()（可选）在提交前返回一条审计记录（None 表示不写），与订单
    写入同一事务：要么一起成功、要么一起回滚。
    SQLite 用 db.lock + BEGIN IMMEDIATE；PostgreSQL 用事务 + SELECT ... FOR UPDATE。
    """
    with _AtomicWriter(db) as w:
        order = w.lock_order(no)
        if not order:
            raise KeyError("订单不存在")
        fn(order)
        w.put_order(no, order)
        rec = audit_builder() if audit_builder else None
        if rec:
            w.put_audit(rec)
        return order


def change_order_address(db, no, data, actor, owner_id=None):
    """Update a pre-shipment address and retain a limited, masked audit history."""
    for key in ('person', 'phone', 'addr'):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError('请填写收货人、手机号和地址')
    if not re.fullmatch(r'1\d{10}', data['phone']):
        raise ValueError('请输入有效的 11 位手机号')
    person, phone, addr = data['person'].strip(), data['phone'], data['addr'].strip()
    if len(person) > 40 or len(addr) > 200:
        raise ValueError('收货人或地址过长')

    def apply(order):
        if owner_id is not None and order.get('userId') != owner_id:
            raise KeyError('订单不存在')
        groups = status.derive_status(order)
        if (groups['orderStatus'] in ('cancelled', 'closed', 'completed')
                or groups['logisticsStatus'] != 'not_shipped'
                or groups['afterSaleStatus'] != 'none'):
            raise ValueError('已经发货，改不了了')
        history = list(order.get('addressHistory') or [])
        old_phone = order.get('phone') or ''
        masked = old_phone[:3] + '****' + old_phone[-4:] if len(old_phone) == 11 else ''
        history.append({'at': _now(), 'actor': actor, 'person': order.get('person', ''),
                        'phone': masked, 'addr': order.get('addr', '')})
        order['addressHistory'] = history[-20:]
        order.update(person=person, phone=phone, addr=addr, updatedAt=_now())

    return _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record(actor, 'change_address', 'order', no, ''))


# ---------------------------------------------------------------- 设计快照、生产工单与质检关口

WORK_ORDER_STEPS = ("待领料", "配珠排序", "穿制打结", "待质检", "已完工")
WORK_ORDER_STATUSES = ("pending", "producing", "qc_passed", "qc_failed", "ready_to_ship", "shipped")
QUALITY_GATE_FIELDS = ("sequenceOk", "sizeOk", "materialOk", "appearanceOk")
_FORBIDDEN_WORK_ORDER_MUTATIONS = ("sequence", "materials", "beads", "items", "replaceMaterial", "substituteSku", "designSnapshot")


def build_design_snapshot(db, order_or_data, frozen_items=None):
    """构造下单时冻结的设计快照：包含编号珠序列、SKU、尺寸、数量、手围、总长和客户备注。

    若订单已存有 designSnapshot，则直接返回已冻结的快照，绝不用当前商品目录覆写。
    """
    existing = (order_or_data or {}).get("designSnapshot")
    if isinstance(existing, dict) and existing.get("sequence"):
        return existing
    d = dict(order_or_data or {})
    ids = list(d.get("beads") or [])
    items = list(frozen_items if frozen_items is not None else (d.get("items") or []))
    wrist = float(d.get("wrist") or 15)
    note = str(d.get("customerNote") if "customerNote" in d else (d.get("note") or d.get("remark") or "")).strip()[:200]
    tpl_id = str(d.get("tplId") or "").strip()[:100]
    source = str(d.get("source") or ("template" if tpl_id else "custom")).strip()[:40]

    sequence = []
    bom_map = {}
    bom_order = []
    total_mm = 0.0
    for idx, bid in enumerate(ids):
        snap_item = items[idx] if idx < len(items) and isinstance(items[idx], dict) else None
        if not snap_item:
            snap_item = next((it for it in items if isinstance(it, dict) and it.get("id") == bid), None)
        if not snap_item and db is not None:
            raw_b = db.get("beads", bid)
            snap_item = kb.enrich(raw_b) if raw_b else {"id": bid, "name": bid, "mm": 8, "priceFen": 0}
        snap_item = snap_item or {"id": bid, "name": bid, "mm": 8, "priceFen": 0}
        mm = float(snap_item.get("mm") or 0)
        ufen = _bead_unit_fen(snap_item) if ("priceFen" in snap_item or "price" in snap_item) else int(snap_item.get("unitPriceFen") or 0)
        is_spacer = bool(snap_item.get("spacer") or snap_item.get("type") == "spacer")
        total_mm += mm
        seq_entry = {
            "seq": idx + 1,
            "id": bid,
            "name": snap_item.get("name") or bid,
            "mm": snap_item.get("mm"),
            "mat": snap_item.get("mat") or "",
            "spacer": is_spacer,
            "unitPriceFen": ufen,
            "photo": snap_item.get("photo") or "",
            "kb": snap_item.get("kb") or "",
            "points": list(snap_item.get("points") or []),
            "meaning": snap_item.get("meaning") or "",
            "summary": snap_item.get("summary") or "",
            "safety": snap_item.get("safety") or "",
        }
        sequence.append(seq_entry)
        if bid not in bom_map:
            bom_order.append(bid)
            bom_map[bid] = {
                "id": bid,
                "name": seq_entry["name"],
                "mm": seq_entry["mm"],
                "mat": seq_entry["mat"],
                "spacer": is_spacer,
                "count": 0,
                "unitPriceFen": ufen,
                "subtotalFen": 0,
                "positions": [],
                "safety": seq_entry["safety"],
            }
        bom_map[bid]["count"] += 1
        bom_map[bid]["subtotalFen"] += ufen
        bom_map[bid]["positions"].append(idx + 1)

    # 主珠和目标长度用同一套尺寸规则（plans.main_mm，和小程序工作台一致），按整串算
    main_mm = plans.main_mm([s["id"] for s in sequence], {s["id"]: s for s in sequence})
    target_mm = plans.target_for(wrist, main_mm)
    length_mm = round(total_mm, 1) if total_mm % 1 else int(total_mm)
    return {
        "wrist": wrist,
        "count": len(sequence),
        "mainMm": main_mm,
        "targetMm": target_mm,
        "lengthMm": length_mm,
        "cord": int(d.get("cord") or 0),
        "gift": bool(d.get("gift")),
        "customerNote": note,
        "tplId": tpl_id,
        "source": source,
        "sequence": sequence,
        "materials": [bom_map[bid] for bid in bom_order],
        "frozenAt": int(d.get("createdAt") or _now()),
    }


def build_work_order(order, db=None):
    """从订单与冻结的设计快照生成生产工单（员工作业指令），严禁自行替换用料。"""
    snap = build_design_snapshot(db, order)
    existing = dict(order.get("workOrder") or {})
    groups = status.derive_status(order)
    fulfillment = groups.get("fulfillmentStatus")
    qg = order.get("qualityGate")
    no = order.get("no") or order.get("id") or ""
    wo_no = existing.get("workOrderNo") or ("WO" + no[3:] if no.startswith("CGZ") else "WO-" + no)

    if fulfillment in ("shipped", "delivered"):
        wo_status = "shipped"
    elif fulfillment == "ready_to_ship":
        wo_status = "ready_to_ship"
    elif isinstance(qg, dict) and qg.get("passed") is True:
        wo_status = "qc_passed"
    elif isinstance(qg, dict) and qg.get("passed") is False:
        wo_status = "qc_failed"
    elif fulfillment == "producing" or existing.get("status") == "producing":
        wo_status = "producing"
    else:
        wo_status = existing.get("status") or "pending"

    progress = existing.get("progress")
    if progress is None:
        progress = 100 if wo_status in ("qc_passed", "ready_to_ship", "shipped") else (50 if wo_status == "producing" else 0)
    gift_opt = order.get("gift")
    gift_card = str(gift_opt.get("card") or "") if isinstance(gift_opt, dict) else ""
    hide_price = bool(gift_opt.get("hidePrice")) if isinstance(gift_opt, dict) else False
    step = existing.get("step") or (
        "已完工" if wo_status in ("qc_passed", "ready_to_ship", "shipped")
        else ("待质检" if wo_status == "qc_failed" else ("穿制打结" if wo_status == "producing" else "待领料"))
    )
    return {
        "workOrderNo": wo_no,
        "orderNo": no,
        "orderName": order.get("name") or "我的手串",
        "status": wo_status,
        "fulfillmentStatus": fulfillment,
        "paymentStatus": groups.get("paymentStatus"),
        "paymentChannel": order.get("paymentChannel") or "",
        "mockPayment": order.get("paymentChannel") == "mock",
        "orderStatus": groups.get("orderStatus"),
        "assignee": str(existing.get("assignee") or ""),
        "progress": int(progress),
        "step": step,
        "operatorNote": str(existing.get("operatorNote") or ""),
        "customerNote": snap.get("customerNote") or str(order.get("customerNote") or order.get("note") or ""),
        "wrist": snap.get("wrist"),
        "lengthMm": snap.get("lengthMm"),
        "targetMm": snap.get("targetMm"),
        "count": snap.get("count"),
        "cord": snap.get("cord"),
        "gift": snap.get("gift"),
        "giftCard": gift_card,
        "hidePrice": hide_price,
        "sequence": snap.get("sequence", []),
        "materials": snap.get("materials", []),
        "allowMaterialSubstitution": False,
        "qcRequired": True,
        "qualityGate": qg,
        "createdAt": int(existing.get("createdAt") or order.get("createdAt") or _now()),
        "updatedAt": int(existing.get("updatedAt") or order.get("updatedAt") or order.get("createdAt") or _now()),
    }


def get_work_order(db, no):
    import accounts
    order = db.get("orders", no)
    if not order:
        return None
    return accounts.mask_order(db, build_work_order(order, db=db))


def list_work_orders(db, q="", status_="", assignee=""):
    import accounts
    rows = db.list("orders")
    rows.sort(key=lambda o: o.get("createdAt", 0), reverse=True)
    q = (q or "").strip().lower()
    status_ = (status_ or "").strip()
    assignee = (assignee or "").strip().lower()
    out = []
    for o in rows:
        wo = build_work_order(o, db=db)
        if status_ and wo.get("status") != status_:
            continue
        if assignee and assignee not in str(wo.get("assignee") or "").lower():
            continue
        if q and not (
            q in str(wo.get("orderNo") or "").lower()
            or q in str(wo.get("workOrderNo") or "").lower()
            or q in str(wo.get("assignee") or "").lower()
            or q in str(wo.get("customerNote") or "").lower()
        ):
            continue
        out.append(accounts.mask_order(db, wo))
    return out


def update_work_order(db, no, data, actor=ACTOR):
    """更新生产工单的负责人、工序进度与作业备注；严禁替换用料或修改编号珠序列。"""
    d = dict(data or {})
    for forbidden in _FORBIDDEN_WORK_ORDER_MUTATIONS:
        if forbidden in d:
            raise ValueError("生产工单锁定设计快照，不得自行替换用料或修改珠序")
    assignee = d.get("assignee")
    if assignee is not None and (not isinstance(assignee, str) or len(assignee.strip()) > 40):
        raise ValueError("负责人名称格式不正确")
    progress = d.get("progress")
    if progress is not None:
        if isinstance(progress, bool) or not isinstance(progress, int) or not 0 <= progress <= 100:
            raise ValueError("生产进度须为 0–100 的整数")
    step = d.get("step")
    if step is not None and step not in WORK_ORDER_STEPS:
        raise ValueError("工序阶段不正确")
    operator_note = d.get("operatorNote")
    if operator_note is not None and not isinstance(operator_note, str):
        raise ValueError("作业备注格式不正确")

    def apply(order):
        snap = build_design_snapshot(db, order)
        order["designSnapshot"] = snap
        wo = dict(order.get("workOrder") or build_work_order(order, db=db))
        if assignee is not None:
            wo["assignee"] = assignee.strip()
        if progress is not None:
            wo["progress"] = progress
        if step is not None:
            wo["step"] = step
        if operator_note is not None:
            wo["operatorNote"] = operator_note.strip()[:300]
        wo["qcRequired"] = True
        wo["allowMaterialSubstitution"] = False
        wo["updatedAt"] = _now()
        order["workOrder"] = wo
        order["updatedAt"] = wo["updatedAt"]
        return order

    saved = _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record(
            actor, "update_work_order", "order", no,
            f"assignee={d.get('assignee', '')} progress={d.get('progress', '')} step={d.get('step', '')}".strip()))
    return build_work_order(saved, db=db)


def record_quality_gate(db, no, data, actor=ACTOR):
    """记录发货前质检关口（珠序、尺寸、用料、外观四项必填布尔结果）；质检不通过时不得进入待发货。"""
    d = dict(data or {})
    checks = {}
    for field in QUALITY_GATE_FIELDS:
        val = d.get(field)
        if type(val) is not bool:
            raise ValueError("质检关口必须完整记录珠序、尺寸、用料和外观四项检查结果")
        checks[field] = val
    inspector = str(actor or ACTOR).strip()[:40]
    if not inspector:
        raise ValueError("请填写质检人员")
    note = str(d.get("note") or "").strip()[:300]
    passed = all(checks.values())
    if not passed and not note:
        raise ValueError("质检不通过时请填写原因说明")

    now = _now()
    gate = {
        **checks,
        "passed": passed,
        "inspector": inspector,
        "note": note,
        "checkedAt": now,
    }

    def apply(order):
        groups = status.derive_status(order)
        if groups["orderStatus"] == "cancelled":
            raise ValueError("已取消订单不能执行质检")
        snap = build_design_snapshot(db, order)
        order["designSnapshot"] = snap
        wo = dict(order.get("workOrder") or build_work_order(order, db=db))
        wo["qcRequired"] = True
        wo["status"] = "qc_passed" if passed else "qc_failed"
        if passed:
            wo["progress"] = 100
            wo["step"] = "已完工"
        else:
            wo["step"] = "待质检"
        wo["updatedAt"] = now
        order["workOrder"] = wo
        order["qualityGate"] = gate
        order["updatedAt"] = now
        append_history(
            order, actor, "fulfillmentStatus", groups["fulfillmentStatus"], groups["fulfillmentStatus"],
            f"质检关口：{'通过' if passed else '不通过'}（{inspector}）{(' · ' + note) if note else ''}"
        )
        return order

    saved = _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record(
            actor, "quality_gate", "order", no,
            f"passed={passed} inspector={inspector} note={note}".strip()))
    return order_detail(db, saved.get("no") or no)


# ---------------------------------------------------------------- 订单

def order_detail(db, no):
    """订单详情：附五组状态、允许的下一状态、状态历史、物流、售后记录、设计快照、生产工单与质检关口。"""
    import accounts
    import order_view
    o = db.get("orders", no)
    if not o:
        return None
    out = dict(o)
    out.update(status.derive_status(o))
    out['opsStatus'] = order_view.ops_status(o)
    out["designSnapshot"] = build_design_snapshot(db, o)
    out["workOrder"] = build_work_order(o, db=db)
    out["qualityGate"] = o.get("qualityGate")
    out["allowedTransitions"] = allowed_order_transitions(o)
    out["statusHistory"] = o.get("statusHistory", [])
    out["logisticsHistory"] = o.get("logisticsHistory", [])
    out["afterSales"] = [a for a in db.list("after_sales") if a.get("orderNo") == no]
    out["termsSnapshot"] = o.get("termsSnapshot", [])
    return accounts.mask_order(db, out)


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
    if group not in ("orderStatus", "fulfillmentStatus", "logisticsStatus"):
        raise ValueError("只能变更订单状态、履约状态或物流状态")
    if group == "paymentStatus":
        raise ValueError("支付状态不可手工修改")

    meta = {}

    def apply(order):
        groups = status.derive_status(order)
        from_ = groups[group]
        meta["from"] = from_
        meta["to"] = to_
        if group == "orderStatus" and to_ == "confirmed" and groups["paymentStatus"] != "paid":
            raise ValueError("付款后会自动确认，不用手动确认")
        status.validate_transition(group, from_, to_)
        _check_order_constraints(order, group, to_)
        if from_ == to_:  # 幂等：重复转换直接返回当前状态，不重复写历史/审计
            meta["idempotent"] = True
            return order
        meta["idempotent"] = False

        if group == "fulfillmentStatus":
            if to_ == "shipped":
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
                # 联动：履约发货同时推进物流状态到 shipped
                if status.derive_status(order)["logisticsStatus"] == "not_shipped":
                    order["logisticsStatus"] = "shipped"
            elif to_ == "delivered":
                lg = dict(order.get("logistics") or {})
                if not lg.get("signedAt"):
                    lg["signedAt"] = _now()
                order["logistics"] = lg
                order["logisticsStatus"] = "delivered"
            elif to_ == "exception":
                order["logisticsStatus"] = "exception"
            elif to_ == "returned":
                order["logisticsStatus"] = "returned"

        if group == "logisticsStatus":
            lg = dict(order.get("logistics") or {})
            if to_ == "shipped" and not lg.get("shippedAt"):
                lg["shippedAt"] = _now()
            elif to_ == "delivered" and not lg.get("signedAt"):
                lg["signedAt"] = _now()
            order["logistics"] = lg

        order[group] = to_
        append_history(order, actor, group, from_, to_, note)
        return order

    saved = _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: (
            None if meta.get("idempotent") else
            _audit_record(actor, "transition", "order", no,
                          f"{group}: {meta['from']} → {meta['to']}")
        ))
    notify.on_order_transition(db, saved, group, to_, meta.get("idempotent"))
    return saved


def customer_order_action(db, no, user_id, action, reason=None):
    """Apply a customer-owned order action under the same database transaction.

    Payment is intentionally absent: only the payment callback boundary may
    advance paymentStatus to paid.
    """
    if action not in ("cancel_order", "confirm_receipt"):
        raise ValueError("不支持的订单操作")
    meta = {}

    def apply(order):
        if order.get("userId") != user_id:
            # Do not reveal whether another customer's order exists.
            raise KeyError("订单不存在")
        groups = status.derive_status(order)
        meta["before"] = dict(groups)
        now = _now()
        if action == "cancel_order":
            expected = {
                "orderStatus": "pending_confirmation", "paymentStatus": "unpaid",
                "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none",
                "logisticsStatus": "not_shipped",
            }
            if any(groups[k] != v for k, v in expected.items()):
                raise ValueError("当前订单状态不能取消")
            if reason:
                import contract
                if reason not in contract.CANCEL_REASONS:
                    raise ValueError("取消原因不正确")
                order["cancelReason"] = reason
            status.validate_transition("orderStatus", groups["orderStatus"], "cancelled")
            status.validate_transition("paymentStatus", groups["paymentStatus"], "closed")
            order["orderStatus"] = "cancelled"
            order["paymentStatus"] = "closed"
            order["status"] = "已取消"  # legacy client compatibility
            append_history(order, "customer", "orderStatus", groups["orderStatus"], "cancelled",
                           "用户取消未支付订单" + ("：" + reason if reason else ""))
            append_history(order, "customer", "paymentStatus", groups["paymentStatus"], "closed", "订单取消，关闭支付")
        else:
            if not (groups["orderStatus"] == "confirmed"
                    and groups["paymentStatus"] == "paid"
                    and groups["fulfillmentStatus"] in ("shipped", "delivered")
                    and groups["afterSaleStatus"] == "none"
                    and groups["logisticsStatus"] in ("shipped", "in_transit", "delivered")):
                raise ValueError("当前订单状态不能确认收货")
            if groups["logisticsStatus"] != "delivered":
                status.validate_transition("logisticsStatus", groups["logisticsStatus"], "delivered")
                _check_order_constraints(order, "logisticsStatus", "delivered")
                order["logisticsStatus"] = "delivered"
                logistics = dict(order.get("logistics") or {})
                logistics.setdefault("signedAt", now)
                order["logistics"] = logistics
                append_history(order, "customer", "logisticsStatus", groups["logisticsStatus"], "delivered", "用户确认收货")
            if groups["fulfillmentStatus"] != "delivered":
                status.validate_transition("fulfillmentStatus", groups["fulfillmentStatus"], "delivered")
                _check_order_constraints(order, "fulfillmentStatus", "delivered")
                order["fulfillmentStatus"] = "delivered"
                append_history(order, "customer", "fulfillmentStatus", groups["fulfillmentStatus"], "delivered", "用户确认收货")
            status.validate_transition("orderStatus", groups["orderStatus"], "completed")
            _check_order_constraints(order, "orderStatus", "completed")
            order["orderStatus"] = "completed"
            order["status"] = "已完成"  # legacy client compatibility
            order.setdefault("logisticsHistory", []).append(
                {"at": now, "actor": "customer", "action": "确认收货", "detail": "用户确认已收到商品"})
            append_history(order, "customer", "orderStatus", groups["orderStatus"], "completed", "用户确认收货")
        order["updatedAt"] = now
        return order

    return _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record(
            "customer", action, "order", no,
            json.dumps(meta.get("before", {}), ensure_ascii=False, sort_keys=True)))


INTERNAL_NOTE_MAX = 300


def add_internal_note(db, no, text, actor=ACTOR):
    """后台内部备注：只给后台看，用户接口不返回。最多保留 100 条。"""
    text = text.strip() if isinstance(text, str) else ""
    if not 1 <= len(text) <= INTERNAL_NOTE_MAX:
        raise ValueError("内部备注要 1–300 字")

    def apply(order):
        notes = list(order.get("internalNotes") or [])
        notes.append({"at": _now(), "actor": actor, "text": text})
        order["internalNotes"] = notes[-100:]
        order["updatedAt"] = _now()

    return _atomic_order_transition(
        db, no, apply, audit_builder=lambda: _audit_record(actor, "internal_note", "order", no, ""))


AUTO_COMPLETE_DAYS = 7


def _auto_complete_due(order, cutoff):
    groups = status.derive_status(order)
    signed_at = (order.get("logistics") or {}).get("signedAt")
    return (groups["orderStatus"] == "confirmed"
            and groups["logisticsStatus"] == "delivered"
            and groups["afterSaleStatus"] == "none"
            and isinstance(signed_at, (int, float)) and signed_at <= cutoff)


def auto_complete_delivered(db, now_ms=None, days=AUTO_COMPLETE_DAYS):
    """签收超过 days 天、用户没确认、也没有售后的订单，自动完成。返回处理的订单号列表。"""
    now = _now() if now_ms is None else now_ms
    cutoff = now - days * 24 * 3600 * 1000
    done = []
    for order in db.list("orders"):
        no = order.get("no")
        if not no or not _auto_complete_due(order, cutoff):
            continue

        def apply(o):
            # 事务里再查一次：列表读出来以后状态可能已经变了。
            if not _auto_complete_due(o, cutoff):
                raise ValueError("订单状态已变化，跳过自动完成")
            groups = status.derive_status(o)
            note = "签收 7 天后自动确认收货"
            if groups["fulfillmentStatus"] != "delivered":
                status.validate_transition("fulfillmentStatus", groups["fulfillmentStatus"], "delivered")
                _check_order_constraints(o, "fulfillmentStatus", "delivered")
                o["fulfillmentStatus"] = "delivered"
                append_history(o, "system", "fulfillmentStatus", groups["fulfillmentStatus"], "delivered", note)
            status.validate_transition("orderStatus", groups["orderStatus"], "completed")
            _check_order_constraints(o, "orderStatus", "completed")
            o["orderStatus"] = "completed"
            o["status"] = "已完成"  # legacy client compatibility
            append_history(o, "system", "orderStatus", groups["orderStatus"], "completed", note)
            o["updatedAt"] = now
            return o

        try:
            _atomic_order_transition(
                db, no, apply,
                audit_builder=lambda no=no: _audit_record("system", "auto_complete", "order", no, ""))
        except (ValueError, KeyError):
            continue
        done.append(no)
    return done


def start_payment(db, no, user_id):
    """用户发起付款：校验订单归属和状态，记一条付款记录，返回给前端的付款参数。"""
    out = {}

    def apply(order):
        if order.get("userId") != user_id:
            raise KeyError("订单不存在")
        attempt, params = payments.create_payment(order)
        out["params"] = params
        order["updatedAt"] = _now()
        return order

    saved = _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record("customer", "start_payment", "order", no, out.get("params", {}).get("provider", "")))
    return saved, out["params"]


def payment_callback(db, no, callback, user_id=None):
    """支付回调：走 payments.apply_callback（幂等、金额核对）；付款成功时订单从待确认自动变已确认。

    user_id 只给模拟通道用：模拟回调由用户端发起，必须是自己的订单。真实通道的回调由微信服务器发起，不带 user_id。
    """
    meta = {}

    def apply(order):
        if user_id is not None and order.get("userId") != user_id:
            raise KeyError("订单不存在")
        before = status.derive_status(order)
        result, order = payments.apply_callback(order, callback)
        meta["result"] = result
        if result == "paid":
            append_history(order, "payment", "paymentStatus", before["paymentStatus"], "paid",
                           "模拟付款成功" if order.get("paymentChannel") == "mock" else "付款成功")
            if before["orderStatus"] == "pending_confirmation":
                status.validate_transition("orderStatus", "pending_confirmation", "confirmed")
                order["orderStatus"] = "confirmed"
                append_history(order, "payment", "orderStatus", "pending_confirmation", "confirmed", "付款后自动确认")
            order["status"] = "待串制"  # legacy client compatibility
        order["updatedAt"] = _now()
        return order

    saved = _atomic_order_transition(
        db, no, apply,
        audit_builder=lambda: _audit_record("payment", "payment_callback", "order", no,
                                            f"{callback.get('provider', '')} {meta.get('result', '')} {callback.get('amountFen', '')}"))
    return meta.get("result"), saved


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
        if lg.get(k) not in (None, ""):
            raise ValueError("发货/签收时间由状态迁移自动生成，不能手工填写")
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
    import accounts
    import order_view
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
        item['opsStatus'] = order_view.ops_status(o)
        item["designSnapshot"] = build_design_snapshot(db, o)
        item["workOrder"] = build_work_order(o, db=db)
        item["qualityGate"] = o.get("qualityGate")
        item["allowedTransitions"] = allowed_order_transitions(o)
        out.append(accounts.mask_order(db, item))
    return out


# ---------------------------------------------------------------- 售后

def _after_sale_no():
    return "AS" + time.strftime("%y%m%d") + uuid.uuid4().hex[:6].upper()


def create_after_sale(db, data, actor=ACTOR):
    order_no = str(data.get("orderNo") or "").strip()
    atype = data.get("type")
    if atype not in status.AFTER_SALE_TYPES:
        raise ValueError("售后类型不正确")
    reason = str(data.get("reason") or "").strip()[:200]
    if not reason:
        raise ValueError("请填写售后原因")
    refund_fen = money.parse_fen(data.get("refundFen"))
    idem_key = str(data.get("idempotencyKey") or "").strip() or None
    if idem_key and not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", idem_key):
        raise ValueError("幂等键格式不正确")

    with _AtomicWriter(db) as w:
        order = w.lock_order(order_no)
        if not order:
            raise ValueError("订单不存在")
        if idem_key:
            existing = w.find_after_sale_by_key(order_no, idem_key)
            if existing:
                old_amount = int(existing.get("requestedFen") or existing.get("refundFen") or 0)
                if (existing.get("type"), existing.get("reason"), old_amount) != (atype, reason, refund_fen):
                    raise ValueError("幂等键已用于不同请求")
                out = dict(existing)
                out["idempotent"] = True
                return out
        if status.derive_status(order)["afterSaleStatus"] != "none":
            raise ValueError("该订单已有进行中的售后")
        if atype in REFUND_TYPES:
            sales = w.list_after_sales()
            _check_refund_constraints_in(
                order, refund_fen, _reserved_fen(sales, order_no), _refunded_fen(sales, order_no))

        no = _after_sale_no()
        rec = {"no": no, "orderNo": order_no, "type": atype, "reason": reason,
               "userNote": str(data.get("userNote") or "")[:500],
               "refundFen": refund_fen, "requestedFen": refund_fen,
               "reservedFen": refund_fen if atype in REFUND_TYPES else 0,
               "refundedFen": 0, "returnLogistics": {},
               "result": "", "status": "requested",
               "createdAt": _now(), "updatedAt": _now(),
               "history": [status.history_entry(actor, "afterSaleStatus", "none", "requested", reason)]}
        if idem_key:
            rec["idempotencyKey"] = idem_key
        if "newWrist" in data:
            rec["newWrist"] = data["newWrist"]
        w.put_after_sale(no, rec)

        order["afterSaleStatus"] = "requested"
        append_history(order, actor, "afterSaleStatus", "none", "requested", f"创建售后 {no}")
        w.put_order(order_no, order)
        w.put_audit(_audit_record(actor, "create", "after_sale", no, f"订单 {order_no} · {atype}"))
        return rec


def _after_sale_target(action, current, atype):
    if action == "refund":
        if atype not in REFUND_TYPES:
            raise ValueError("这种售后不退款")
        if atype == "退货退款":
            if current != "returning":
                raise ValueError("退货退款要先记录退货物流，再退款")
        elif current != "approved":
            raise ValueError("同意后才能退款")
        return "refunding"
    if action == "approve":
        if current == "requested":
            return "reviewing"
        if current == "reviewing":
            return "approved"
        raise ValueError("只有申请中或审核中的售后才能同意")
    if action == "reject":
        if current in ("requested", "reviewing"):
            return "rejected"
        raise ValueError("只有申请中或审核中的售后才能拒绝")
    if action == "returning":
        if atype not in ("退货退款", "改手围重串"):
            raise ValueError("仅退款/补寄配件/拒收后退款没有退货环节")
        if current != "approved":
            raise ValueError("同意后才能记录退货物流")
        return "returning"
    if action == "receive":
        if atype == "改手围重串":
            raise ValueError("改手围重串的重做流程还没接入")
        if atype == "补寄配件":
            raise ValueError("补寄配件类型没有退货收货环节")
        raise ValueError("真实退款服务尚未接入，不能确认退款收货")
    if action == "complete":
        if atype == "改手围重串":
            raise ValueError("改手围重串的重做流程还没接入")
        if atype in REFUND_TYPES:
            raise ValueError("真实退款服务尚未接入，不能完成退款售后")
        if current == "approved" and atype == "补寄配件":
            return "completed"
        raise ValueError("当前状态不能完成售后")
    if action == "close":
        if current in ("completed", "closed"):
            raise ValueError("售后已结束")
        return "closed"
    raise ValueError("未知售后操作")


def transition_after_sale(db, no, action, note="", return_logistics=None, result=None, actor=ACTOR):
    pre = db.get("after_sales", no)
    if not pre:
        raise KeyError("售后记录不存在")
    order_no = pre["orderNo"]
    refunded_order = None

    with _AtomicWriter(db) as w:
        order = w.lock_order(order_no)
        rec = w.lock_after_sale(no)
        if not rec:
            raise KeyError("售后记录不存在")
        current = rec["status"]
        target = _after_sale_target(action, current, rec["type"])
        status.validate_transition("afterSaleStatus", current, target)
        # 支付域退款（paid → refunding → refunded/refund_failed）走 payments.handle_refund；
        # 当前未接真实微信退款，故此处只推进售后域状态，不伪造订单 paymentStatus 的退款流转。
        if target == current:  # 幂等：同一状态重复转换不重复写历史
            return rec

        if target == "refunding":
            rec = _refund_in_tx(w, order, rec, no, current, note, actor)
            refunded_order = order
        else:
            rec["status"] = target
            rec["updatedAt"] = _now()
            if target in ("rejected", "closed"):
                rec["reservedFen"] = 0
            if result is not None:
                rec["result"] = str(result)[:500]
            if return_logistics:
                rl = {k: str(v or "").strip()[:100] for k, v in (return_logistics or {}).items()
                      if k in ("carrierCode", "carrierName", "trackingNo")}
                rec["returnLogistics"] = {**rec.get("returnLogistics", {}), **rl}
            rec.setdefault("history", []).append(status.history_entry(actor, "afterSaleStatus", current, target, note))
            rec["history"] = rec["history"][-200:]
            w.put_after_sale(no, rec)

            if order:
                order["afterSaleStatus"] = target
                append_history(order, actor, "afterSaleStatus", current, target, note)
                w.put_order(order_no, order)
            w.put_audit(_audit_record(actor, action, "after_sale", no, f"{rec['type']}: {current} → {target}"))

    if refunded_order is not None:
        notify.order_event(db, refunded_order, "refunded")
    return rec


def _refund_in_tx(w, order, rec, no, current, note, actor):
    """在 transition_after_sale 的同一个事务里退款：售后 → refunding → completed，订单支付 paid → refunding → refunded。

    真实通道（payments.handle_refund 抛 RuntimeError）时整个事务不提交，售后和订单都不变。
    """
    if not order:
        raise KeyError("订单不存在")
    refund_fen = int(rec.get("refundFen") or 0)
    try:
        payments.handle_refund(order, refund_fen)
    except RuntimeError:
        raise ValueError("真实退款服务尚未接入")
    mock = order.get("paymentChannel") == "mock"
    pay_note = "模拟退款" if mock else "退款"
    pay_from = status.derive_status(order)["paymentStatus"]
    status.validate_transition("paymentStatus", pay_from, "refunding")
    status.validate_transition("paymentStatus", "refunding", "refunded")
    status.validate_transition("afterSaleStatus", "refunding", "completed")
    now = _now()

    rec["status"] = "completed"
    rec["refundedFen"] = refund_fen
    rec["reservedFen"] = 0
    rec["updatedAt"] = now
    rec.setdefault("history", []).append(status.history_entry(actor, "afterSaleStatus", current, "refunding", note))
    rec["history"].append(status.history_entry(actor, "afterSaleStatus", "refunding", "completed", pay_note))
    rec["history"] = rec["history"][-200:]
    w.put_after_sale(no, rec)

    order["paymentStatus"] = "refunded"
    order["refundFen"] = int(order.get("refundFen") or 0) + refund_fen
    order["afterSaleStatus"] = "completed"
    order["updatedAt"] = now
    append_history(order, actor, "afterSaleStatus", current, "refunding", note)
    append_history(order, actor, "paymentStatus", pay_from, "refunding", pay_note)
    append_history(order, actor, "paymentStatus", "refunding", "refunded", pay_note)
    append_history(order, actor, "afterSaleStatus", "refunding", "completed", pay_note)
    w.put_order(order["no"], order)
    w.put_audit(_audit_record(actor, "refund", "after_sale", no, f"{rec['type']}: {pay_note} {refund_fen} 分"))
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


def after_sale_allowed_states(rec):
    """售后记录允许的下一状态（稳定有序列表）。"""
    return status.next_states("afterSaleStatus", rec.get("status"))


def after_sale_allowed_actions(rec):
    """售后记录当前可执行的操作（供前端渲染按钮），复用 _after_sale_target 作为唯一裁决源。"""
    actions = []
    for action in ("approve", "reject", "returning", "refund", "receive", "complete", "close"):
        try:
            _after_sale_target(action, rec.get("status"), rec.get("type"))
            actions.append(action)
        except ValueError:
            pass
    return actions


def after_sale_detail(db, no):
    """售后详情：附允许的下一状态与允许的操作。"""
    rec = db.get("after_sales", no)
    if not rec:
        return None
    out = dict(rec)
    out["allowedTransitions"] = after_sale_allowed_states(rec)
    out["allowedActions"] = after_sale_allowed_actions(rec)
    return out


# ---------------------------------------------------------------- 条款与规则适用范围

TERM_SCOPE_MODES = ("global", "scoped")
TERM_SCENARIOS = ("all", "custom_diy", "template", "ai", "gift", "cord", "safety_warning")


def normalize_term_scope(data):
    """校验并归一化条款的规则适用范围（rule scope）：支持全局、指定商品、指定模板和指定订单场景。"""
    d = dict(data or {})
    raw_scope = d.get("scope") if isinstance(d.get("scope"), dict) else {}
    mode = str(raw_scope.get("mode") or d.get("scopeMode") or "global").strip()
    if mode not in TERM_SCOPE_MODES:
        return None, "条款适用范围模式不正确"

    def _clean_str_list(val):
        if val is None:
            return []
        if isinstance(val, str):
            val = [x.strip() for x in val.split(",")]
        if not isinstance(val, list):
            return None
        out = []
        for item in val:
            if not isinstance(item, str):
                return None
            s = item.strip()
            if s and s not in out:
                out.append(s)
        return out

    product_ids = _clean_str_list(raw_scope.get("productIds") if "productIds" in raw_scope else d.get("scopeProducts"))
    template_ids = _clean_str_list(raw_scope.get("templateIds") if "templateIds" in raw_scope else d.get("scopeTemplates"))
    scenarios = _clean_str_list(raw_scope.get("scenarios") if "scenarios" in raw_scope else d.get("scopeScenarios"))
    if product_ids is None or template_ids is None or scenarios is None:
        return None, "条款适用范围列表格式不正确"
    if any(s not in TERM_SCENARIOS for s in scenarios):
        return None, "条款适用订单场景不正确"
    if mode == "scoped" and not (product_ids or template_ids or scenarios):
        return None, "指定范围的条款至少要选择一项适用商品、模板或订单场景"
    if mode == "global":
        return {"mode": "global", "productIds": [], "templateIds": [], "scenarios": []}, None
    return {
        "mode": "scoped",
        "productIds": product_ids,
        "templateIds": template_ids,
        "scenarios": scenarios,
    }, None


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
    scope, scope_err = normalize_term_scope(d)
    if scope_err:
        return None, scope_err
    out = dict(d)
    out.update({"title": title, "type": ttype, "version": version, "body": body,
                "status": tstatus, "effectiveAt": effective_at if isinstance(effective_at, int) else None,
                "confirmed": bool(d.get("confirmed")), "scope": scope})
    out.pop("id", None)
    return out, None


def derive_order_scenarios(context):
    """根据下单上下文推导命中的订单场景集合。"""
    ctx = dict(context or {})
    scenarios = {"all"}
    tpl_id = str(ctx.get("tplId") or "").strip()
    source = str(ctx.get("source") or "").strip()
    if tpl_id or source in ("tpl", "template"):
        scenarios.add("template")
    else:
        scenarios.add("custom_diy")
    if source in ("ai", "plan"):
        scenarios.add("ai")
    if bool(ctx.get("gift")):
        scenarios.add("gift")
    if int(ctx.get("cord") or 0) == 1:
        scenarios.add("cord")
    if bool(ctx.get("hasSafety")):
        scenarios.add("safety_warning")
    for extra in (ctx.get("scenarios") or []):
        if isinstance(extra, str) and extra in TERM_SCENARIOS:
            scenarios.add(extra)
    return scenarios


def match_term_scope(term, context=None):
    """判断已发布条款是否命中当前订单上下文，返回 (matched: bool, matched_by: list[str])。"""
    scope = term.get("scope") if isinstance(term.get("scope"), dict) else {"mode": "global"}
    mode = scope.get("mode") or "global"
    if mode == "global":
        return True, ["global"]
    if context is None:
        return False, []
    ctx = dict(context or {})
    order_beads = set(ctx.get("beads") or [])
    tpl_id = str(ctx.get("tplId") or "").strip()
    active_scenarios = derive_order_scenarios(ctx)
    matched_by = []
    if scope.get("productIds") and (order_beads & set(scope["productIds"])):
        matched_by.append("product")
    if scope.get("templateIds") and tpl_id and tpl_id in set(scope["templateIds"]):
        matched_by.append("template")
    if scope.get("scenarios") and (active_scenarios & set(scope["scenarios"])):
        matched_by.append("scenario")
    return bool(matched_by), matched_by


def published_terms(db, context=None):
    """当前已发布的条款（传入 context 时按规则适用范围筛选）。"""
    rows = [t for t in db.list("terms") if t.get("status") == "published"]
    rows.sort(key=lambda t: (t.get("order", 9999), t.get("id")))
    if context is None:
        return rows
    out = []
    for t in rows:
        ok, _ = match_term_scope(t, context)
        if ok:
            out.append(t)
    return out


def terms_snapshot(db, context=None):
    """下单时根据规则适用范围筛选并冻结的已发布条款快照。"""
    rows = [t for t in db.list("terms") if t.get("status") == "published"]
    rows.sort(key=lambda t: (t.get("order", 9999), t.get("id")))
    out = []
    for t in rows:
        if context is None:
            scope = t.get("scope") if isinstance(t.get("scope"), dict) else {"mode": "global", "productIds": [], "templateIds": [], "scenarios": []}
            if scope.get("mode", "global") != "global":
                continue
            matched_by = ["global"]
        else:
            ok, matched_by = match_term_scope(t, context)
            if not ok:
                continue
        scope_doc = t.get("scope") if isinstance(t.get("scope"), dict) else {"mode": "global", "productIds": [], "templateIds": [], "scenarios": []}
        out.append({
            "id": t.get("id"),
            "type": t.get("type"),
            "title": t.get("title"),
            "version": t.get("version"),
            "body": t.get("body"),
            "scope": scope_doc,
            "matchedBy": matched_by,
        })
    return out


def list_terms(db, q="", pstatus="", scope_mode=""):
    rows = db.list("terms")
    for r in rows:
        if not isinstance(r.get("scope"), dict):
            r["scope"] = {"mode": "global", "productIds": [], "templateIds": [], "scenarios": []}
    q = (q or "").strip().lower()
    if pstatus:
        rows = [r for r in rows if r.get("status") == pstatus]
    if scope_mode:
        rows = [r for r in rows if (r.get("scope") or {}).get("mode", "global") == scope_mode]
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
