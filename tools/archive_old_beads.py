"""Preview or archive old products and templates displaced by H7 materials."""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))
sys.path.insert(0, str(ROOT / "tools"))

from commerce import archive_product, archive_template  # noqa: E402
from load_seed import open_database  # noqa: E402
from status import product_type  # noqa: E402


def recipe_ids(template):
    recipe = template.get("recipe") if isinstance(template.get("recipe"), dict) else {}
    return [bead_id for field in ("special", "pattern", "tail")
            for bead_id in (template.get(field) if field in template else recipe.get(field)) or []]


def plan(db):
    beads = sorted(db.list("beads"), key=lambda item: str(item["id"]))
    templates = sorted(db.list("templates"), key=lambda item: str(item["id"]))
    h7_ids = {item["id"] for item in beads
              if str(item.get("photo") or "").startswith("/uploads/hc-")}
    if not h7_ids:
        raise RuntimeError("没有 H7 珠子；先完成 H7 导入，再执行旧珠子下架")
    bead_ids = {item["id"] for item in beads}
    test_ids = {bead_id for template in templates if template.get("testOnly")
                for bead_id in recipe_ids(template) if bead_id in bead_ids}
    protected = h7_ids | test_ids
    archived = [item for item in beads if item.get("status") == "archived"]
    targets = [item for item in beads if item.get("status") != "archived"
               and item["id"] not in protected]
    target_ids = {item["id"] for item in targets}
    affected = [(template, sum(bead_id in target_ids for bead_id in recipe_ids(template)))
                for template in templates if not template.get("testOnly")
                and template.get("status") != "archived"]
    affected = [(template, count) for template, count in affected if count]
    return {"h7": h7_ids, "test": test_ids - h7_ids, "archived": archived,
            "targets": targets, "templates": affected}


def run(db, apply=False, output=print):
    result = plan(db)
    targets = result["targets"]
    bead_count = sum(product_type(item) == "bead" for item in targets)
    output(f"保留 H7 珠子 {len(result['h7'])}；保留测试款额外用珠子 {len(result['test'])}")
    output(f"将下架 {len(targets)}（珠子 {bead_count}；配件 {len(targets) - bead_count}）；已归档跳过 {len(result['archived'])}")
    for item in targets[:30]:
        output(f"  {item['id']} {item.get('name') or '(无名称)'}")
    output(f"将下架模板 {len(result['templates'])}")
    for template, count in result["templates"]:
        output(f"  {template['id']} {template.get('name') or '(无名称)'}：引用 {count} 颗")
    if apply:
        for item in targets:
            archive_product(db, item["id"], actor="archive_old_beads")
        for template, _ in result["templates"]:
            archive_template(db, template["id"], actor="archive_old_beads")
        output("下架已执行")
    else:
        output("仅预览；加 --apply 才写入")
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="执行下架；默认仅预览")
    args = parser.parse_args(argv)
    try:
        run(open_database(), apply=args.apply)
    except (RuntimeError, ValueError, KeyError) as exc:
        parser.exit(1, f"错误：{exc}\n")


if __name__ == "__main__":
    main()
