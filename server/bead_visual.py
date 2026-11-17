"""Stable, public visual fields for one bead in an order or share snapshot."""

import seed

VISUAL_KEYS = ("id", "name", "mm", "spacer", "mat", "colors", "photo", "photoMd", "photoSm")
PLACEHOLDER_COLORS = ("#b8b8b8", "#e3e3e3")


def colors_for(bead):
    """Use the established palette when an admin-created bead has no color data."""
    bead = bead or {}
    raw = bead.get("colors") or bead.get("c")
    if isinstance(raw, (list, tuple)) and len(raw) >= 2 and raw[0] and raw[1]:
        return list(raw[:2])
    kb_id = bead.get("kb")
    if not kb_id:
        return []
    candidates = [item for item in seed.BEADS if item.get("kb") == kb_id and item.get("c")]
    if not candidates:
        return []
    attrs = bead.get("attrs") or {}
    matched = next((item for item in candidates if attrs and item.get("attrs") == attrs), candidates[0])
    return list(matched["c"][:2])


def visual_of(bead):
    bead = bead or {}
    colors = colors_for(bead)
    colors += [None] * (2 - len(colors))
    return {
        "id": bead.get("id"),
        "name": bead.get("name"),
        "mm": bead.get("mm"),
        "spacer": bead.get("spacer"),
        "mat": bead.get("mat"),
        "colors": colors,
        "photo": bead.get("photo") or None,
        "photoMd": bead.get("photoMd") or None,
        "photoSm": bead.get("photoSm") or None,
    }


def placeholder_of(bead_id):
    visual = visual_of({"id": bead_id, "name": bead_id})
    visual["colors"] = list(PLACEHOLDER_COLORS)
    return visual


def current_visual(db, bead_id):
    bead = db.get("beads", bead_id) if db is not None else None
    return visual_of(bead) if bead else placeholder_of(bead_id)
