"""Public articles and admin article management."""
import articles


def public_list(ctx, match, data):
    home = (ctx.qs.get('home') or [''])[0] == '1'
    return 200, {'articles': articles.list_articles(ctx.db, public=True, home=home)}


def public_get(ctx, match, data):
    return 200, articles.get(ctx.db, match.group(1), public=True)


def admin_list(ctx, match, data):
    return 200, {'articles': articles.list_articles(ctx.db)}


def admin_get(ctx, match, data):
    return 200, articles.get(ctx.db, match.group(1))


def admin_create(ctx, match, data):
    return 201, articles.save(ctx.db, data)


def admin_update(ctx, match, data):
    return 200, articles.save(ctx.db, data, match.group(1))


def admin_delete(ctx, match, data):
    articles.delete(ctx.db, match.group(1))
    return 200, {'ok': True}


def admin_status(ctx, match, data):
    return 200, articles.save(ctx.db, {'status': 'published' if match.group(2) == 'publish' else 'draft'}, match.group(1))


ROUTES = [
    ('GET', r'/api/articles', public_list, 'public'),
    ('GET', r'/api/articles/([A-Za-z0-9_-]+)', public_get, 'public'),
    ('GET', r'/api/admin/articles', admin_list, 'admin'),
    ('GET', r'/api/admin/articles/([A-Za-z0-9_-]+)', admin_get, 'admin'),
    ('POST', r'/api/admin/articles', admin_create, 'admin'),
    ('PUT', r'/api/admin/articles/([A-Za-z0-9_-]+)', admin_update, 'admin'),
    ('DELETE', r'/api/admin/articles/([A-Za-z0-9_-]+)', admin_delete, 'admin'),
    ('POST', r'/api/admin/articles/([A-Za-z0-9_-]+)/(publish|unpublish)', admin_status, 'admin'),
]
