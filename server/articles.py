"""Article validation and storage."""
from datetime import datetime, timezone
import uuid

import kb


FIELDS = ('title', 'cover', 'body', 'beadKbIds', 'button', 'homeOrder', 'status')


def normalize(data, existing=None):
    if not isinstance(data, dict):
        raise ValueError('文章内容不正确')
    doc = {key: (existing or {}).get(key) for key in FIELDS}
    doc.update({key: data[key] for key in FIELDS if key in data})
    title = doc.get('title')
    if not isinstance(title, str) or not title.strip():
        raise ValueError('请填写标题')
    doc['title'] = title.strip()
    body = doc.get('body')
    if not isinstance(body, list) or not body or any(not isinstance(p, str) or not p.strip() for p in body):
        raise ValueError('正文应为非空段落数组')
    doc['body'] = [p.strip() for p in body]
    banned = kb.banned_in(' '.join([doc['title'], *doc['body']]))
    if banned:
        raise ValueError('标题或正文含禁用词')
    cover = doc.get('cover')
    if cover is not None and (not isinstance(cover, str) or not cover.strip()):
        raise ValueError('题图应为上传编号或图片地址')
    ids = doc.get('beadKbIds')
    if ids is None:
        ids = []
    if not isinstance(ids, list) or any(not isinstance(item, str) or not item.strip() for item in ids):
        raise ValueError('关联珠子编号不正确')
    doc['beadKbIds'] = ids
    button = doc.get('button')
    if button is not None:
        if not isinstance(button, dict) or not isinstance(button.get('text'), str) or not button['text'].strip() or not isinstance(button.get('target'), str) or not button['target'].strip():
            raise ValueError('按钮需有文字和跳转目标')
        doc['button'] = {'text': button['text'].strip(), 'target': button['target'].strip()}
    order = doc.get('homeOrder')
    if order is not None and (type(order) is not int or order < 0):
        raise ValueError('首页顺序应为非负整数')
    doc['status'] = doc.get('status') or 'draft'
    if doc['status'] not in ('draft', 'published'):
        raise ValueError('文章状态不正确')
    doc['updatedAt'] = datetime.now(timezone.utc).isoformat()
    return doc


def save(db, data, article_id=None):
    existing = db.get('articles', article_id) if article_id else None
    if article_id and existing is None:
        raise KeyError('文章不存在')
    doc = normalize(data, existing)
    return db.put('articles', article_id or uuid.uuid4().hex, doc)


def get(db, article_id, public=False):
    article = db.get('articles', article_id)
    if article is None or (public and article.get('status') != 'published'):
        raise KeyError('文章不存在')
    return article


def list_articles(db, public=False, home=False):
    rows = db.list('articles')
    if public:
        rows = [row for row in rows if row.get('status') == 'published']
    if home:
        rows = [row for row in rows if row.get('homeOrder') is not None]
        rows.sort(key=lambda row: (row['homeOrder'], row['id']))
    return rows


def delete(db, article_id):
    get(db, article_id)
    db.delete('articles', article_id)
