"""Save all three home sections in one request."""
import home


def update(ctx, match, data):
    return 200, home.save(ctx.db, data)


ROUTES = [('PUT', r'/api/admin/home', update, 'edit_content')]
