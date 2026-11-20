"""Deterministic photo-description to on-sale catalog matching."""
import math
import re

COLOR_WEIGHT = 0.72
MATERIAL_WEIGHT = 0.16
SIZE_WEIGHT = 0.08
NAME_WEIGHT = 0.04
MIN_SCORE = 0.30


def lab(hex_color):
    if not isinstance(hex_color, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", hex_color):
        return None
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    rgb = [v / 12.92 if v <= 0.04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    x = (rgb[0] * .4124564 + rgb[1] * .3575761 + rgb[2] * .1804375) / .95047
    y = rgb[0] * .2126729 + rgb[1] * .7151522 + rgb[2] * .0721750
    z = (rgb[0] * .0193339 + rgb[1] * .1191920 + rgb[2] * .9503041) / 1.08883
    f = lambda t: t ** (1 / 3) if t > .008856 else 7.787 * t + 16 / 116
    x, y, z = f(x), f(y), f(z)
    return (116 * y - 16, 500 * (x - y), 200 * (y - z))


def delta_e(a, b):
    first, second = lab(a), lab(b)
    return math.dist(first, second) if first and second else None


def _name_bonus(kind, name):
    clues = {
        "clear": ("透明", "玻璃", "白水晶"), "translucent": ("冰", "荔枝冻", "玉"),
        "opaque": ("木", "菩提", "虎眼"), "cracked": ("爆花", "裂", "发晶"),
        "striped": ("虎眼", "条纹"), "speckled": ("草莓晶", "斑"),
        "banded": ("玛瑙", "缠丝"), "metallic": ("金", "银", "铜"),
    }
    return any(word in name for field in (kind.get("clarity"), kind.get("pattern"))
               for word in clues.get(field, ()))


def match_kind(kind, beads):
    """Return up to three candidates ordered by perceptual similarity."""
    role = kind.get("role")
    color = kind.get("color")
    material = kind.get("material")
    guess = kind.get("mmGuess")
    # Pick a size within each named variety before comparing varieties.
    # The model's size estimate selects the variant; without one, show the
    # standard 8 mm variant (or its nearest available size).
    target_mm = guess if guess is not None else 8
    by_name = {}
    for bead in beads:
        if (bead.get("mat") == "metal") != (role == "metal"):
            continue
        name = bead.get("name", "")
        if role == "center" and not any(x in name for x in ("佛头", "三通")):
            continue
        if role == "pendant" and not any(x in name for x in ("吊坠", "挂件")):
            continue
        if role not in ("center", "pendant", "metal") and (bead.get("spacer") or any(x in name for x in ("佛头", "三通", "吊坠", "挂件"))):
            continue
        distances = [delta_e(color, value) for value in (bead.get("c") or [])[:2]]
        distances = [value for value in distances if value is not None]
        if not distances:
            continue
        color_score = max(0, 1 - min(distances) / 100)
        material_score = 1 if bead.get("mat") == material or (material, bead.get("mat")) in {
            ("wood", "bodhi"), ("bodhi", "wood"), ("stone", "jade")
        } else 0
        size_score = max(0, 1 - abs(bead.get("mm", 0) - guess) / 12) if guess else 0
        score = COLOR_WEIGHT * color_score + MATERIAL_WEIGHT * material_score + SIZE_WEIGHT * size_score + NAME_WEIGHT * int(_name_bonus(kind, name))
        if score >= MIN_SCORE:
            size = bead.get("mm", 0)
            variant = (abs(size - target_mm), size, str(bead["id"]))
            group = name or str(bead["id"])
            previous = by_name.get(group)
            if previous is None or variant < previous[0]:
                by_name[group] = (variant, score)
    scored = [(score, variant[0], variant[2]) for variant, score in by_name.values()]
    scored.sort(key=lambda row: (-row[0], row[1], row[2]))
    return [{"id": id_, "score": round(score, 3)} for score, _, id_ in scored[:3]]
