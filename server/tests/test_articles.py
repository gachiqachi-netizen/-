"""Article publishing, moderation, home ordering and term types."""
import os
import re
import sys
import tempfile
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import articles
import status
from db import DB
from routes import articles as article_routes


class ArticlesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'articles.db'))
        self.ctx = SimpleNamespace(db=self.db, qs={})
        self.valid = {'title': '月光石的光', 'cover': 'upload_1',
                      'body': ['光晕在表面下游走。', '寓意温柔与浪漫。'],
                      'beadKbIds': ['yueguang-shi'],
                      'button': {'text': '用月光石串一条', 'target': 'pages/editor/editor'}}

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def test_migration_registers_articles_table(self):
        self.assertEqual(self.db.list('articles'), [])

    def test_draft_is_hidden_until_published_and_can_unpublish(self):
        created = article_routes.admin_create(self.ctx, None, self.valid)[1]
        self.assertEqual(created['status'], 'draft')
        self.assertEqual(article_routes.public_list(self.ctx, None, None)[1]['articles'], [])
        match = re.fullmatch(r'([a-z0-9]+)', created['id'])
        with self.assertRaises(KeyError):
            article_routes.public_get(self.ctx, match, None)
        publish = re.fullmatch(r'([a-z0-9]+)/(publish|unpublish)', created['id'] + '/publish')
        article_routes.admin_status(self.ctx, publish, None)
        self.assertEqual(article_routes.public_get(self.ctx, match, None)[1]['id'], created['id'])
        unpublish = re.fullmatch(r'([a-z0-9]+)/(publish|unpublish)', created['id'] + '/unpublish')
        article_routes.admin_status(self.ctx, unpublish, None)
        self.assertEqual(article_routes.public_list(self.ctx, None, None)[1]['articles'], [])

    def test_home_articles_are_published_and_sorted(self):
        for title, order, published in [('后', 2, True), ('前', 0, True), ('草稿', 1, False), ('不在首页', None, True)]:
            articles.save(self.db, {**self.valid, 'title': title, 'homeOrder': order,
                                    'status': 'published' if published else 'draft'})
        self.ctx.qs = {'home': ['1']}
        self.assertEqual([row['title'] for row in article_routes.public_list(self.ctx, None, None)[1]['articles']], ['前', '后'])

    def test_banned_words_rejected_in_title_and_body(self):
        for change in ({'title': '治疗'}, {'body': ['招财']}):
            with self.assertRaises(ValueError):
                articles.save(self.db, {**self.valid, **change})

    def test_admin_update_list_and_delete(self):
        created = articles.save(self.db, self.valid)
        self.assertEqual(len(article_routes.admin_list(self.ctx, None, None)[1]['articles']), 1)
        match = re.fullmatch(r'([a-z0-9]+)', created['id'])
        updated = article_routes.admin_update(self.ctx, match, {'title': '新标题'})[1]
        self.assertEqual(updated['title'], '新标题')
        self.assertEqual(article_routes.admin_get(self.ctx, match, None)[1]['title'], '新标题')
        article_routes.admin_delete(self.ctx, match, None)
        with self.assertRaises(KeyError):
            article_routes.admin_get(self.ctx, match, None)

    def test_validation_and_new_term_types(self):
        for change in ({'body': []}, {'status': 'unknown'}, {'homeOrder': -1}, {'beadKbIds': 'bad'},
                       {'button': {'text': '点'}}):
            with self.assertRaises(ValueError):
                articles.save(self.db, {**self.valid, **change})
        self.assertIn('用户协议', status.TERM_TYPES)
        self.assertIn('隐私政策', status.TERM_TYPES)


if __name__ == '__main__':
    unittest.main()
