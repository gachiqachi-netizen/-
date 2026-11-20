"""Preview or apply product status changes with product edit permission."""

import catalog_cache
import commerce


def change_status(ctx, match, data):
    result = commerce.batch_product_status(ctx.db, data)
    if data.get("preview") is False and result["changes"]:
        catalog_cache.invalidate()
    return 200, result


ROUTES = [
    ("POST", r"/api/admin/beads/status", change_status, "edit_products"),
]
