"""Public, published terms without administrative metadata."""
import commerce

LIST_FIELDS = ('id', 'type', 'title', 'version', 'publishedAt')
DETAIL_FIELDS = ('id', 'type', 'title', 'body', 'version', 'publishedAt')


def public_list(ctx, match, data):
    return 200, [{key: term.get(key) for key in LIST_FIELDS}
                 for term in commerce.published_terms(ctx.db)]


def public_get(ctx, match, data):
    term = next((term for term in commerce.published_terms(ctx.db)
                 if term.get('id') == match.group(1)), None)
    if term is None:
        raise KeyError('条款不存在')
    return 200, {key: term.get(key) for key in DETAIL_FIELDS}


ROUTES = [
    ('GET', r'/api/terms', public_list, 'public'),
    ('GET', r'/api/terms/([A-Za-z0-9_-]+)', public_get, 'public'),
]
