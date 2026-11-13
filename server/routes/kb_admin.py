"""K3 后台知识库接口：查、改（保存即生效）、改动记录、退回。

查看（GET 列表、GET 详情、POST check）任何后台账号都能用；
保存和退回要 edit_kb 权限点（注册表 auth 里声明，分发处统一拦）。
"""
import accounts
import kb
import kb_rules
import kb_store
from datetime import datetime, timezone

FIELDS = ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning',
          'source', 'tplId')
_HISTORY_KEEP = 20


def _item(ctx, key):
    item = ctx.db.get("kb_items", "bead:" + key)
    if item is None:
        raise KeyError("知识库里没有这个品种")
    return item


def _dicts():
    return dict(kb._load()["attrs"])


def _check(data):
    if not isinstance(data, dict):
        raise ValueError("data 必须是知识库条目的对象")
    return kb_rules.check_bead(data, _dicts(), mode="save")


def _on_sale_products(ctx, key):
    return [p for p in ctx.db.list("beads")
            if p.get("kb") == key and p.get("onSale", True)]


def _who():
    admin = accounts.CURRENT_ADMIN.get() or {}
    return admin.get("name") or admin.get("username") or "后台"


def _summary_row(ctx, key, data, item):
    meaning = data.get("meaning") or {}
    conf = data.get("confidence") or {}
    return {
        "id": key,
        "name": data.get("name", key),
        "category": data.get("category"),
        "meaningTags": meaning.get("tags") or [],
        "meaningConfidence": conf.get("meaning"),
        "onSaleCount": len(_on_sale_products(ctx, key)),
        "updatedAt": item.get("updatedAt"),
    }


def _matches_q(data, q):
    if not q:
        return True
    haystacks = [data.get("name") or "", data.get("std") or ""]
    haystacks += [str(a) for a in (data.get("aliases") or [])]
    return any(q in h for h in haystacks)


def list_kb(ctx, match, data):
    c = kb._load()
    rows = []
    q = (ctx.qs.get("q") or [""])[0].strip()
    category = (ctx.qs.get("category") or [""])[0].strip()
    confidence = (ctx.qs.get("meaningConfidence") or [""])[0].strip()
    for key, bead in sorted(c["beads"].items()):
        if category and bead.get("category") != category:
            continue
        if confidence and (bead.get("confidence") or {}).get("meaning") != confidence:
            continue
        if not _matches_q(bead, q):
            continue
        rows.append(_summary_row(ctx, key, bead, _item(ctx, key)))
    products = [p for p in ctx.db.list("beads") if p.get("onSale", True)]
    bead_conf = {k: (b.get("confidence") or {}).get("meaning") for k, b in c["beads"].items()}
    low_confidence = sum(1 for p in products
                         if p.get("mat") != "metal" and bead_conf.get(p.get("kb")) == "low")
    spacers = sum(1 for p in products if p.get("mat") == "metal")
    week_ago = datetime.now(timezone.utc).timestamp() - 7 * 86400
    recent = 0
    for item in ctx.db.list("kb_items"):
        if item.get("kind") != "bead":
            continue
        updated = item.get("updatedAt") or ""
        try:
            ts = datetime.fromisoformat(updated).timestamp()
        except ValueError:
            continue
        if ts >= week_ago:
            recent += 1
    return 200, {
        "items": rows,
        "totalKinds": len(c["beads"]),
        "lowConfidence": low_confidence,
        "spacer": spacers,
        "recent7d": recent,
    }


def detail(ctx, match, data):
    key = match.group(1)
    item = _item(ctx, key)
    products = [{"id": p["id"], "name": p.get("name"), "mm": p.get("mm")}
                for p in _on_sale_products(ctx, key)]
    history = []
    prefix = "bead:%s:" % key
    for h in ctx.db.list("kb_versions"):
        hid = h.get("id") or ""
        if hid.startswith(prefix):
            history.append({
                "version": h.get("version"),
                "savedBy": h.get("savedBy"),
                "savedAt": h.get("savedAt"),
                "note": h.get("note"),
            })
    history.sort(key=lambda h: h["version"] or 0, reverse=True)
    return 200, {
        "data": item.get("data"),
        "version": item.get("version"),
        "products": products,
        "history": history[:_HISTORY_KEEP],
    }


def check(ctx, match, data):
    errors = _check((data or {}).get("data"))
    return 200, {"errors": errors}


def save(ctx, match, data):
    key = match.group(1)
    item = _item(ctx, key)
    body = data if isinstance(data, dict) else {}
    version = body.get("version")
    if type(version) is not int:
        raise ValueError("请提供当前版本号 version")
    errors = _check(body.get("data"))
    if errors:
        return 400, {"errors": errors}
    if version != item.get("version"):
        return 409, {"error": "别人刚改过，请刷新"}
    new_version = kb_store.save(key, body["data"], _who(), str(body.get("note") or ""))
    return 200, {"version": new_version, "products": [p["id"] for p in _on_sale_products(ctx, key)]}


def rollback(ctx, match, data):
    key = match.group(1)
    _item(ctx, key)
    body = data if isinstance(data, dict) else {}
    target = body.get("version")
    if type(target) is not int or target < 1:
        raise ValueError("请提供要退回的版本号 version")
    history = ctx.db.get("kb_versions", "bead:%s:%d" % (key, target))
    if history is None:
        raise KeyError("没有第 %d 版" % target)
    errors = _check(history.get("data"))
    if errors:
        return 400, {"errors": errors}
    new_version = kb_store.save(key, history["data"], _who(), "退回到第 %d 版" % target)
    return 200, {"version": new_version, "rolledBackTo": target}


# 查看类路由的 auth 用 view_work_orders：分发处要求 /api/admin/ 路径必须落到具体权限点，
# 而它是四个内置角色（负责人/运营/客服/做单）都有的权限点，即“登录后台就能看”；
# 保存和退回用 edit_kb（A8a 已加，默认负责人和运营）。
ROUTES = [
    ("GET", r"/api/admin/kb", list_kb, "view_work_orders"),
    ("GET", r"/api/admin/kb/([\w-]+)", detail, "view_work_orders"),
    ("POST", r"/api/admin/kb/([\w-]+)/check", check, "view_work_orders"),
    ("PUT", r"/api/admin/kb/([\w-]+)", save, "edit_kb"),
    ("POST", r"/api/admin/kb/([\w-]+)/rollback", rollback, "edit_kb"),
]
