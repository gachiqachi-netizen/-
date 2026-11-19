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
        ids = dict.fromkeys((recipe.get("special") or []) + (recipe.get("pattern") or []) + (recipe.get("tail") or []))
        bad = [bid for bid in ids if bid not in beads or beads[bid].get("onSale") is not True
               or status.product_type(beads[bid]) not in ("bead", "spacer")]
        if bad:
            output(f"{name}：珠子缺失或不可用：{'、'.join(bad)}")
            invalid.append(name)
        else:
            output(f"{name}：将新增" if not apply else f"{name}：待新增")
            pending.append(template)
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
