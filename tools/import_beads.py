"""Preview or import bead products from CSV/XLSX; --apply writes only new rows."""

import argparse
import csv
import os
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))
sys.path.insert(0, str(ROOT / "tools"))

from commerce import create_product, normalize_product  # noqa: E402
from load_seed import open_database  # noqa: E402
from match_kb import load_entries, match  # noqa: E402

# Source column names, in priority order. 价格 is yuan; 价格(分) is integer fen.
COLUMNS = {
    "id": ("ID", "id", "商品ID"),
    "name": ("名称", "商品名称", "珠子名称", "name"),
    "mm": ("尺寸(mm)", "尺寸（mm）", "尺寸", "mm"),
    "price_fen": ("价格(分)", "价格（分）", "priceFen"),
    "price_yuan": ("价格", "售价", "price"),
    "mat": ("材质", "材质类型", "mat"),
    "photo": ("照片", "图片", "主图", "photo"),
    "type": ("类型", "商品类型", "type"),
    "legal": ("合法来源证明", "legal"),
}
MATERIALS = {"木": "wood", "木质": "wood", "菩提": "bodhi", "石": "stone",
             "石质": "stone", "玉石": "stone", "水晶": "crystal", "金属": "metal",
             "金属配件": "metal"}
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def read_xlsx(path):
    """Read values from the first worksheet without a third-party dependency."""
    with zipfile.ZipFile(path) as book:
        strings = []
        if "xl/sharedStrings.xml" in book.namelist():
            root = ET.fromstring(book.read("xl/sharedStrings.xml"))
            strings = ["".join(t.text or "" for t in item.findall(".//x:t", NS))
                       for item in root.findall("x:si", NS)]
        workbook = ET.fromstring(book.read("xl/workbook.xml"))
        sheet = workbook.find("x:sheets/x:sheet", NS)
        if sheet is None:
            return []
        rel_id = sheet.attrib[f"{{{NS['r']}}}id"]
        rels = ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        target = next(item.attrib["Target"] for item in rels if item.attrib["Id"] == rel_id)
        sheet_path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        root = ET.fromstring(book.read(sheet_path))
        rows = []
        for row in root.findall(".//x:sheetData/x:row", NS):
            values = {}
            for cell in row.findall("x:c", NS):
                letters = "".join(ch for ch in cell.attrib["r"] if ch.isalpha())
                index = 0
                for ch in letters:
                    index = index * 26 + ord(ch.upper()) - 64
                node = cell.find("x:v", NS)
                if cell.attrib.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//x:t", NS))
                elif node is None:
                    value = ""
                elif cell.attrib.get("t") == "s":
                    value = strings[int(node.text)]
                else:
                    value = node.text or ""
                values[index - 1] = value
            if values:
                rows.append([values.get(i, "") for i in range(max(values) + 1)])
        if not rows:
            return []
        return [dict(zip(rows[0], row)) for row in rows[1:]]


def read_rows(path):
    if path.suffix.lower() == ".xlsx":
        return read_xlsx(path)
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as stream:
            return list(csv.DictReader(stream))
    raise ValueError("只支持 .xlsx 或 .csv 文件")


def field(row, key):
    return next((str(row[name]).strip() for name in COLUMNS[key]
                 if name in row and row[name] is not None and str(row[name]).strip()), "")


def check_photo(photo, source):
    parsed = urlparse(photo)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        try:
            with urlopen(Request(photo, headers={"User-Agent": "bead-import/1"}), timeout=8) as response:
                return response.read(5_000_000), ""
        except (OSError, ValueError):
            return None, "照片 URL 不可访问"
    if parsed.scheme or photo.startswith("//"):
        return None, "照片路径格式不正确"
    path = Path(photo)
    if not path.is_absolute():
        path = source.parent / path
    if not path.is_file():
        return None, "照片文件不存在"
    try:
        return path.read_bytes(), ""
    except OSError:
        return None, "照片文件不可读"


def color_for(name, mat, image):
    try:
        from bead_colors import name_color, photo_color
        try:
            color = photo_color(image)
        except (OSError, ValueError):
            color = None
        return color or name_color(name, mat)
    except ImportError:  # Pillow is optional for the server image.
        # Reuse B-22's name palette without importing its optional PIL dependency.
        import ast
        source = (ROOT / "tools/bead_colors.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        palette = next(ast.literal_eval(node.value) for node in tree.body
                       if isinstance(node, ast.Assign)
                       and any(isinstance(target, ast.Name) and target.id == "PALETTE"
                               for target in node.targets))
        base = "#b69a5c" if mat == "metal" and "金" in name else "#a7a9ae" if mat == "metal" else "#978b81"
        if mat != "metal":
            base = next((color for word, color in palette if word in name), base)
        rgb = bytes.fromhex(base.lstrip("#"))
        return ["#%02x%02x%02x" % tuple(round(v * .72 + 255 * .28) for v in rgb),
                "#%02x%02x%02x" % tuple(round(v * .67) for v in rgb)]


def prepare(row, source, entries):
    name, mm_raw, fen_raw = field(row, "name"), field(row, "mm"), field(row, "price_fen")
    yuan_raw, mat_raw, photo = field(row, "price_yuan"), field(row, "mat"), field(row, "photo")
    errors = []
    if not name:
        errors.append("名称缺失")
    try:
        mm = float(mm_raw)
        if not mm_raw or not 0 < mm < float("inf"):
            raise ValueError
    except ValueError:
        mm = None
        errors.append("尺寸须为正数 mm")
    if not fen_raw and not yuan_raw:
        errors.append("价格缺失")
    mat = MATERIALS.get(mat_raw, mat_raw)
    if not mat_raw:
        errors.append("材质缺失")
    if not photo:
        errors.append("照片缺失")
        image = None
    else:
        image, error = check_photo(photo, source)
        if error:
            errors.append(error)
    if errors:
        return None, errors, False
    data = {"name": name, "mm": mm, "mat": mat, "type": field(row, "type") or "bead",
            "images": [photo], "photo": photo, "legal": field(row, "legal"), "status": "draft"}
    if field(row, "id"):
        data["id"] = field(row, "id")
    if fen_raw:
        try:
            if str(int(fen_raw)) != fen_raw or int(fen_raw) < 0:
                raise ValueError
            data["priceFen"] = int(fen_raw)
        except ValueError:
            return None, ["价格(分)须为非负整数"], False
    else:
        data["price"] = yuan_raw
    kb_id = match(name, entries)
    if kb_id and any(item["id"] == kb_id for item in entries):
        data["kb"] = kb_id
    data["c"] = color_for(name, mat, image)
    _, error = normalize_product(data)
    if error:
        return None, [error], False
    return data, [], not bool(data.get("kb"))


def import_rows(db, rows, source, apply=False, output=print):
    entries = load_entries()
    existing = db.list("beads")
    ids = {str(item["id"]) for item in existing}
    keys = {(item.get("name"), item.get("mm"), item.get("mat")) for item in existing}
    groups = {"将新增": [], "跳过": [], "缺字段": [], "知识库待确认": []}
    for number, row in enumerate(rows, 2):
        data, errors, pending = prepare(row, source, entries)
        label = f"第 {number} 行 {field(row, 'name') or '(无名称)'}"
        if errors:
            groups["缺字段"].append(f"{label}：{'、'.join(errors)}")
            continue
        key = (data["name"], data["mm"], data["mat"])
        if (data.get("id") and data["id"] in ids) or key in keys:
            groups["跳过"].append(label)
            continue
        if apply:
            # Recheck explicit IDs before writing; create_product performs the final validation.
            if data.get("id") and db.get("beads", data["id"]) is not None:
                groups["跳过"].append(label)
                continue
            saved = create_product(db, data, actor="import_beads")
            ids.add(saved["id"])
        elif data.get("id"):
            ids.add(data["id"])
        keys.add(key)
        groups["将新增"].append(label)
        if pending:
            groups["知识库待确认"].append(label)
    for title, details in groups.items():
        output(f"{title} {len(details)} 条")
        for detail in details:
            output(f"  {detail}")
    return groups


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path, help="CSV 或 XLSX 商品表")
    parser.add_argument("--apply", action="store_true", help="确认写入；默认只预览")
    args = parser.parse_args(argv)
    try:
        rows = read_rows(args.file)
        db = open_database()
        print("执行导入（只新增）" if args.apply else "预览（不写入记录）")
        import_rows(db, rows, args.file, apply=args.apply)
    except Exception:
        print("读取表格、数据库连接或导入失败，请检查输入和服务端日志。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
