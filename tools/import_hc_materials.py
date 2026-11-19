"""Import HC material exports. Preview by default; --apply writes new products."""
import argparse
import csv
import hashlib
import os
import sys
from collections import deque
from pathlib import Path

from PIL import Image

import import_beads
from import_beads import import_rows, open_database
from match_kb import load_entries, match

MAT = {
    "wood": "wood", "incense": "wood", "kernel": "bodhi", "bodhi": "bodhi",
    "crystal": "crystal", "feldspar": "stone", "agate": "stone", "gem": "stone",
    "jade": "stone", "organic": "stone", "colored": "stone", "fitting": "metal",
}
REQUIRED = {"名称", "长(mm)", "价格(元)", "图片文件名"}


def clean_image(source, destination):
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
    alpha = im.getchannel("A")
    box = alpha.getbbox()
    if box is None:
        raise ValueError("图片完全透明")
    margin = max(1, round(max(box[2] - box[0], box[3] - box[1]) * .02))
    box = (max(0, box[0] - margin), max(0, box[1] - margin),
           min(width, box[2] + margin), min(height, box[3] + margin))
    im = im.crop(box)
    im.thumbnail((512, 512), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    im.save(destination, format="PNG")
    return im.getchannel("A").getextrema()[0] == 255


def run(materials, output_dir, db, apply=False, output=print):
    source = materials / "materials_summary.csv"
    with source.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not REQUIRED.issubset(reader.fieldnames or []):
            raise ValueError("CSV 缺少必要列")
        raw_rows = list(reader)
    entries = load_entries()
    by_id = {item["id"]: item for item in entries}
    rows, pending, problems = [], [], []
    output_dir = output_dir.resolve()
    for number, raw in enumerate(raw_rows, 2):
        name = (raw["名称"] or "").strip()
        image_name = (raw["图片文件名"] or "").strip()
        kb_id = match(name, entries)
        category = by_id[kb_id]["category"] if kb_id in by_id else None
        mat = MAT.get(category)
        if not mat:
            pending.append(f"第 {number} 行 {name}")
            continue
        image_path = materials / "images" / image_name
        if not image_name or Path(image_name).name != image_name or not image_path.is_file():
            problems.append(f"第 {number} 行 {name}：图片不存在或文件名无效")
            continue
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()[:20]
        target = output_dir / ("hc-" + digest + ".png")
        try:
            opaque = clean_image(image_path, target)
        except (OSError, ValueError) as exc:
            problems.append(f"第 {number} 行 {name}：{exc}")
            continue
        if opaque:
            problems.append(f"第 {number} 行 {name}：处理后底仍不透明，请后台换图")
        rows.append({"名称": name, "尺寸(mm)": raw["长(mm)"],
                     "价格": raw["价格(元)"], "材质": mat,
                     "图片": "/uploads/" + target.name})
    original_check = import_beads.check_photo
    def check_upload(photo, source):
        if photo.startswith("/uploads/") and Path(photo).name == photo[len("/uploads/"):]:
            path = output_dir / Path(photo).name
            return original_check(str(path), source)
        return None, "照片路径格式不正确"
    try:
        import_beads.check_photo = check_upload
        groups = import_rows(db, rows, source, apply=apply, output=output)
    finally:
        import_beads.check_photo = original_check
    output(f"总行数 {len(raw_rows)}；新建 {len(groups['将新增'])}；跳过 {len(groups['跳过'])}")
    output(f"材质待确认 {len(pending)} 条")
    for item in pending:
        output("  " + item)
    output(f"图片有问题 {len(problems)} 条")
    for item in problems:
        output("  " + item)
    return groups


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("materials", type=Path, help="解压后的 materials_export 目录")
    parser.add_argument("--output-dir", type=Path, required=True, help="图片输出目录，须与 UPLOADS_DIR 相同")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args(argv)
    uploads = Path(os.environ.get("UPLOADS_DIR") or Path(os.environ.get("DATA_DIR") or Path(__file__).resolve().parents[1] / "server") / "uploads").resolve()
    if args.output_dir.resolve() != uploads:
        parser.error("--output-dir 必须等于服务端 UPLOADS_DIR")
    run(args.materials, args.output_dir, open_database(), apply=args.apply)
    return 0


if __name__ == "__main__":
    sys.exit(main())
