"""Preview or import missing homepage templates after validating their beads."""

import argparse
import json
import sys
from pathlib import Path

SERVER = Path(__file__).resolve().parents[1] / "server"
sys.path.insert(0, str(SERVER))

import commerce  # noqa: E402
import load_seed  # noqa: E402
import status  # noqa: E402


def load(db, templates, apply=False, output=print):
    """Validate the whole batch before writing any template."""
    if not isinstance(templates, list):
        raise ValueError("模板文件必须是列表")
    beads = {row["id"]: row for row in db.list("beads")}
    by_name_size = {}
    for bead in beads.values():
        if (bead.get("onSale") is True and status.product_status(bead) == "on_sale"
                and status.product_type(bead) in ("bead", "spacer")):
            by_name_size.setdefault((bead.get("name"), bead.get("mm")), []).append(bead["id"])
    existing = {row["id"] for row in db.list("templates")}
    seen = set()
    invalid = []
    pending = []
    for template in templates:
        if not isinstance(template, dict) or not isinstance(template.get("id"), str) or not template["id"]:
            raise ValueError("模板缺少 id")
        rid = template["id"]
        if rid in seen:
            raise ValueError(f"模板 id 重复：{rid}")
        seen.add(rid)
        name = template.get("name") or rid
        if rid in existing:
            output(f"{name}：已存在跳过")
            continue
        recipe = template.get("recipe") if isinstance(template.get("recipe"), dict) else template
        resolved = dict(template)
        bad = []
        for field in ("special", "pattern", "tail"):
            ids = []
            for item in recipe.get(field) or []:
                if isinstance(item, dict):
                    bead_name, mm = item.get("name"), item.get("mm")
                    label = f"{bead_name} {mm}mm"
                    found = by_name_size.get((bead_name, mm), []) if isinstance(bead_name, str) and type(mm) in (int, float) else []
                    if len(found) != 1:
                        bad.append(f"{label}（{'找不到在售珠子' if not found else '匹配到多颗在售珠子'}）")
                        continue
                    ids.append(found[0])
                elif isinstance(item, str):
                    ids.append(item)
                    if item not in beads or beads[item].get("onSale") is not True or status.product_type(beads[item]) not in ("bead", "spacer"):
                        bad.append(item)
                else:
                    bad.append(str(item))
            resolved[field] = ids
        if bad:
            output(f"{name}：珠子缺失或不可用：{'、'.join(bad)}")
            invalid.append(name)
        else:
            output(f"{name}：将新增" if not apply else f"{name}：待新增")
            pending.append(resolved)
    if invalid:
        raise ValueError("整批未写入；珠子缺失或不可用的模板：" + "、".join(invalid))
    # Check the same business rules before any write, including banned words.
    for template in pending:
        _, error = commerce.normalize_template(db, template)
        if error:
            raise ValueError(f"{template.get('name') or template['id']}：{error}；整批未写入")
    if apply:
        for template in pending:
            if db.get("templates", template["id"]) is not None:
                output(f"{template.get('name') or template['id']}：已存在跳过")
                continue
            commerce.create_template(db, template, actor="load_templates")
            output(f"{template.get('name') or template['id']}：已新增")
    return len(pending)


def main(argv=None):
    parser = argparse.ArgumentParser(description="预览或导入缺失的首页模板")
    parser.add_argument("path", type=Path, help="模板 JSON 文件路径")
    parser.add_argument("--apply", action="store_true", help="确认写入；默认只预览")
    args = parser.parse_args(argv)
    try:
        templates = json.loads(args.path.read_text(encoding="utf-8"))
        db = load_seed.open_database()
        print("执行导入（只补缺）" if args.apply else "预览（不写入记录）")
        load(db, templates, apply=args.apply)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print("数据库连接或导入失败，请检查服务端日志和数据库配置。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
