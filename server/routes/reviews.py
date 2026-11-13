"""Customer review submission, moderation, and public template reviews."""
import reviews


def submit(ctx, match, data):
    try:
        return 200, reviews.submit(ctx.db, match.group(1), ctx.user_id, data)
    except PermissionError as error:
        return 403, {'error': str(error)}


def mine(ctx, match, data):
    return 200, reviews.my_review(ctx.db, match.group(1), ctx.user_id)


def admin_list(ctx, match, data):
    review_status = (ctx.qs.get('status') or [None])[0]
    return 200, {'reviews': reviews.list_admin(ctx.db, review_status)}


def admin_moderate(ctx, match, data):
    reason = data.get('reason') if isinstance(data, dict) else None
    return 200, reviews.moderate(ctx.db, match.group(1), match.group(2), reason)


def public_list(ctx, match, data):
    review_filter = (ctx.qs.get('filter') or ['all'])[0]
    wrist = (ctx.qs.get('wrist') or [None])[0]
    return 200, {'reviews': reviews.public_reviews(ctx.db, match.group(1), review_filter, wrist)}


ROUTES = [
    ('POST', r'/api/my/orders/([\w-]+)/review', submit, 'user'),
    ('GET', r'/api/my/orders/([\w-]+)/review', mine, 'user'),
    ('GET', r'/api/admin/reviews', admin_list, 'moderate_reviews'),
    ('POST', r'/api/admin/reviews/([a-f0-9]{32})/(approve|reject|take-down)', admin_moderate, 'moderate_reviews'),
    ('GET', r'/api/templates/([\w-]+)/reviews', public_list, 'public'),
]
