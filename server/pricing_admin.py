"""后台商品分组与批量调价，金额全程使用整数分。"""
import csv
import io

import money


def _price_fen(bead):
    if bead.get("priceFen") is not None:
        return money.parse_fen(bead["priceFen"])
    return money.yuan_to_fen(bead.get("price"))


def group_beads(rows):
    """按品种名称分组，同组内按尺寸由小到大列商品。"""
    groups = {}
    for bead in rows:
        name = bead.get("name") or ""
        groups.setdefault(name, []).append(bead)
    return [{"name": name, "sizes": sorted(items, key=lambda item: (item.get("mm") or 0, item.get("id") or ""))}
            for name, items in sorted(groups.items())]


def _csv_changes(raw):
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("缺少 CSV 内容")
    reader = csv.DictReader(io.StringIO(raw))
    if reader.fieldnames != ["id", "priceFen"]:
        raise ValueError("CSV 表头必须是 id,priceFen")
    changes = []
    for row in reader:
        if not row.get("id") or not row.get("priceFen"):
            raise ValueError("CSV 行缺少商品编号或价格")
        try:
            new_fen = int(row["priceFen"])
        except ValueError:
            raise ValueError("CSV 价格必须是整数分")
        money.parse_fen(new_fen)
        changes.append((row["id"], new_fen))
    if not changes:
        raise ValueError("CSV 没有商品")
    return changes


def reprice(db, data):
    if not isinstance(data, dict):
        raise ValueError("调价内容必须是对象")
    mode = data.get("mode")
    if mode == "add":
        ids = data.get("ids")
        if not isinstance(ids, list) or not ids or any(not isinstance(i, str) or not i for i in ids):
            raise ValueError("请选择商品")
        add_fen = data.get("addFen")
        if type(add_fen) is not int:
            raise ValueError("加价必须是整数分")
        changes = [(rid, None) for rid in ids]
    elif mode == "csv":
        changes = _csv_changes(data.get("csv"))
    else:
        raise ValueError("调价模式不正确")
    if len({rid for rid, _ in changes}) != len(changes):
        raise ValueError("商品编号不能重复")
    rows = []
    for rid, supplied in changes:
        bead = db.get("beads", rid)
        if bead is None:
            raise KeyError("商品不存在")
        old_fen = _price_fen(bead)
        new_fen = money.parse_fen(old_fen + add_fen if mode == "add" else supplied)
        rows.append((bead, {"id": rid, "name": bead.get("name"), "oldFen": old_fen, "newFen": new_fen}))
    if data.get("preview") is False:
        for bead, change in rows:
            bead["priceFen"] = change["newFen"]
            bead["price"] = money.fen_to_yuan(change["newFen"])
            db.put("beads", bead["id"], bead)
    elif data.get("preview") is not True:
        raise ValueError("请指定 preview")
    return [change for _, change in rows]
