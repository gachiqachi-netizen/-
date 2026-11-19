"""Prepare HC images on a Pillow-equipped machine; import in a Pillow-free server."""
import argparse
import csv
import hashlib
import os
import shutil
import sys
from collections import deque
from pathlib import Path

import import_beads
from import_beads import import_rows, open_database
from match_kb import load_entries, match

MAT = {
    "wood": "wood", "incense": "wood", "kernel": "bodhi", "bodhi": "bodhi",
    "crystal": "crystal", "feldspar": "stone", "agate": "stone", "gem": "stone",
    "jade": "stone", "organic": "stone", "colored": "stone", "fitting": "metal",
}
METAL_WORDS = ("银", "金", "镀", "镶钻", "吊坠", "吊牌", "跑环", "花托", "光珠", "铃铛", "十字架")
SOURCE_COLUMNS = {"名称", "长(mm)", "价格(元)", "图片文件名"}
IMPORT_COLUMNS = ("名称", "尺寸(mm)", "价格", "材质", "图片")


def clean_image(source, destination):
    from PIL import Image  # Pillow is required only by the Mac prepare command.

    with Image.open(source) as original:
        im = original.convert("RGBA")
    pixels = im.load()
    width, height = im.size
    seen = set()
    queue = deque((x, y) for x in range(width) for y in (0, height - 1))
    queue.extend((x, y) for y in range(height) for x in (0, width - 1))
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        r, g, b, a = pixels[x, y]
        if a == 0 or not (r > 235 and g > 235 and b > 235):
            continue
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen:
                queue.append((nx, ny))
    box = im.getchannel("A").getbbox()
    if box is None:
        raise ValueError("图片完全透明")
    margin = max(1, round(max(box[2] - box[0], box[3] - box[1]) * .02))
    im = im.crop((max(0, box[0] - margin), max(0, box[1] - margin),
                  min(width, box[2] + margin), min(height, box[3] + margin)))
    im.thumbnail((512, 512), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    im.save(destination, format="PNG")
    return im.getchannel("A").getextrema()[0] == 255


def prepare(materials, output_dir, output=print):
    source = materials / "materials_summary.csv"
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not SOURCE_COLUMNS.issubset(reader.fieldnames or []):
            raise ValueError("CSV 缺少必要列")
        raw_rows = list(reader)
    entries = load_entries()
    by_id = {item["id"]: item for item in entries}
    rows, pending, ropes, problems = [], [], [], []
    for number, raw in enumerate(raw_rows, 2):
        name = (raw["名称"] or "").strip()
        if "绳" in name:
            ropes.append(f"第 {number} 行 {name}")
            continue
        kb_id = match(name, entries)
        category = by_id[kb_id]["category"] if kb_id in by_id else None
        mat = MAT.get(category)
        if not mat and any(word in name for word in METAL_WORDS):
            mat = "metal"
        if not mat:
            pending.append(f"第 {number} 行 {name}")
            continue
        image_name = (raw["图片文件名"] or "").strip()
        image_path = materials / "images" / image_name
        if not image_name or Path(image_name).name != image_name or not image_path.is_file():
            problems.append(f"第 {number} 行 {name}：图片不存在或文件名无效")
            continue
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()[:20]
        filename = "hc-" + digest + ".png"
        try:
            opaque = clean_image(image_path, output_dir / filename)
        except (OSError, ValueError) as exc:
            problems.append(f"第 {number} 行 {name}：{exc}")
            continue
        if opaque:
            problems.append(f"第 {number} 行 {name}：处理后底仍不透明，请后台换图")
        rows.append({"名称": name, "尺寸(mm)": raw["长(mm)"], "价格": raw["价格(元)"],
                     "材质": mat, "图片": "/uploads/" + filename})
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "import.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=IMPORT_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    output(f"总行数 {len(raw_rows)}；待导入 {len(rows)}；材质待确认 {len(pending)}；绳子跳过 {len(ropes)}；图片有问题 {len(problems)}")
    for title, items in (("材质待确认", pending), ("绳子跳过", ropes), ("图片有问题", problems)):
        for item in items:
            output(f"{title}：{item}")
    return rows


def import_prepared(bundle, db, apply=False, uploads=None, output=print):
    source = bundle / "import.csv"
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not set(IMPORT_COLUMNS).issubset(reader.fieldnames or []):
            raise ValueError("导入 CSV 缺少必要列")
        rows = list(reader)
    uploads = Path(uploads or os.environ.get("UPLOADS_DIR") or
                   Path(os.environ.get("DATA_DIR") or Path(__file__).resolve().parents[1] / "server") / "uploads")
    original_check = import_beads.check_photo

    def check_upload(photo, unused_source):
        if not photo.startswith("/uploads/") or Path(photo).name != photo[len("/uploads/"):]:
            return None, "照片路径格式不正确"
        path = bundle / Path(photo).name
        return original_check(str(path), source)

    try:
        import_beads.check_photo = check_upload
        preview = import_rows(db, rows, source, apply=False, output=lambda _: None)
        if not apply:
            import_rows(db, rows, source, apply=False, output=output)
            output(f"总行数 {len(rows)}；新建 {len(preview['将新增'])}；跳过 {len(preview['跳过'])}；缺字段 {len(preview['缺字段'])}；知识库待确认 {len(preview['知识库待确认'])}")
            return preview
        # Copy only images needed by new rows. Preview does not create UPLOADS_DIR.
        new_indices = {int(label.split()[1]) - 2 for label in preview["将新增"]}
        for index in new_indices:
            filename = Path(rows[index]["图片"]).name
            src, dst = bundle / filename, uploads / filename
            if dst.exists() and dst.read_bytes() != src.read_bytes():
                raise ValueError(f"目标图片冲突：{filename}")
        if new_indices:
            uploads.mkdir(parents=True, exist_ok=True)
        for index in new_indices:
            filename = Path(rows[index]["图片"]).name
            dst = uploads / filename
            if not dst.exists():
                shutil.copy2(bundle / filename, dst)
        groups = import_rows(db, rows, source, apply=True, output=output)
        output(f"总行数 {len(rows)}；新建 {len(groups['将新增'])}；跳过 {len(groups['跳过'])}；缺字段 {len(groups['缺字段'])}；知识库待确认 {len(groups['知识库待确认'])}")
        return groups
    finally:
        import_beads.check_photo = original_check


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare", help="Mac 上处理原始图片")
    prep.add_argument("materials", type=Path, help="解压后的 materials_export 目录")
    prep.add_argument("--output-dir", type=Path, required=True, help="导出图片和 import.csv 的目录")
    imp = commands.add_parser("import", help="服务器预览或入库，无 Pillow 依赖")
    imp.add_argument("bundle", type=Path, help="prepare 生成的目录")
    imp.add_argument("--apply", action="store_true", help="复制图片并入库")
    args = parser.parse_args(argv)
    if args.command == "prepare":
        prepare(args.materials, args.output_dir)
    else:
        import_prepared(args.bundle, open_database(), apply=args.apply)
    return 0


if __name__ == "__main__":
    sys.exit(main())
