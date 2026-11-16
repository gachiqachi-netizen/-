"""Stable, public visual fields for one bead in an order or share snapshot."""

VISUAL_KEYS = ("id", "name", "mm", "spacer", "mat", "colors", "photo")
PLACEHOLDER_COLORS = ("#b8b8b8", "#e3e3e3")


def visual_of(bead):
    bead = bead or {}
    raw_colors = bead.get("colors") if "colors" in bead else bead.get("c")
    colors = list(raw_colors[:2]) if isinstance(raw_colors, (list, tuple)) else []
    colors += [None] * (2 - len(colors))
    return {
        "id": bead.get("id"),
        "name": bead.get("name"),
        "mm": bead.get("mm"),
        "spacer": bead.get("spacer"),
        "mat": bead.get("mat"),
        "colors": colors,
        "photo": bead.get("photo") or None,
    }


def placeholder_of(bead_id):
    visual = visual_of({"id": bead_id, "name": bead_id})
    visual["colors"] = list(PLACEHOLDER_COLORS)
    return visual


def current_visual(db, bead_id):
    bead = db.get("beads", bead_id) if db is not None else None
    return visual_of(bead) if bead else placeholder_of(bead_id)
