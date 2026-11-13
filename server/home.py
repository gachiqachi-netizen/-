"""Home content ordering and banner configuration."""
import articles


def _ids(rows, table, db):
    if not isinstance(rows, list):
        raise ValueError(table + '应为数组')
    ids = []
    for row in rows:
        rid = row.get('id') if isinstance(row, dict) else row
        if not isinstance(rid, str) or not rid or rid in ids:
            raise ValueError(table + '编号重复或无效')
        if db.get(table, rid) is None:
            raise ValueError(table + '里有不存在的编号：' + rid)
        ids.append(rid)
    return ids


def _banner_patch(row):
    if isinstance(row, str):
        return {}
    if not isinstance(row, dict):
        raise ValueError('宣传位内容不正确')
    patch = {key: row[key] for key in ('title', 'tags', 'target', 'cover', 'on') if key in row}
    if 'title' in patch and (not isinstance(patch['title'], str) or not patch['title'].strip()):
        raise ValueError('宣传位标题不正确')
    if 'tags' in patch and (not isinstance(patch['tags'], list) or any(not isinstance(x, str) for x in patch['tags'])):
        raise ValueError('宣传位标签不正确')
    if 'target' in patch:
        target = patch['target']
        if not isinstance(target, dict) or target.get('type') not in ('template', 'article', 'page') or not isinstance(target.get('id'), str) or not target['id']:
            raise ValueError('宣传位跳转目标不正确')
    if 'cover' in patch and not isinstance(patch['cover'], str):
        raise ValueError('宣传位封面不正确')
    if 'on' in patch and type(patch['on']) is not bool:
        raise ValueError('宣传位上下线状态不正确')
    return patch


def save(db, data):
    if not isinstance(data, dict) or any(key not in data for key in ('banners', 'templates', 'articles')):
        raise ValueError('请一次提供 banners、templates、articles 三块顺序')
    banners = data['banners']
    banner_ids = _ids(banners, 'banners', db)
    template_ids = _ids(data['templates'], 'templates', db)
    article_ids = _ids(data['articles'], 'articles', db)
    patches = [_banner_patch(row) for row in banners]
    for order, (rid, patch) in enumerate(zip(banner_ids, patches)):
        item = db.get('banners', rid)
        item.update(patch)
        item['order'] = order
        db.put('banners', rid, item)
    for item in db.list('templates'):
        item['homeOrder'] = template_ids.index(item['id']) if item['id'] in template_ids else None
        db.put('templates', item['id'], item)
    for item in db.list('articles'):
        if item['id'] in article_ids:
            articles.save(db, {'homeOrder': article_ids.index(item['id'])}, item['id'])
        elif item.get('homeOrder') is not None:
            articles.save(db, {'homeOrder': None}, item['id'])
    return {'banners': banner_ids, 'templates': template_ids, 'articles': article_ids}


def home_articles(db):
    return articles.list_articles(db, public=True, home=True)
