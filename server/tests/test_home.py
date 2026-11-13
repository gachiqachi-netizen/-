"""Home content configuration and public catalog ordering."""
import os
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import articles
import home
from db import DB
from routes import home as home_routes


class HomeTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'home.db'))
        self.article = articles.save(self.db, {'title': '珠子小知识', 'body': ['寓意温柔'], 'status': 'published'})
        self.draft = articles.save(self.db, {'title': '草稿', 'body': ['待发布']})
        self.data = {'banners': ['b3', 'b1'], 'templates': ['t2', 't1'],
                     'articles': [self.article['id'], self.draft['id']]}

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def test_one_request_saves_three_sections_and_public_order(self):
        result = home_routes.update(SimpleNamespace(db=self.db), None, self.data)[1]
        self.assertEqual(result, self.data)
        with patch.object(app, 'db', self.db):
            _, templates, banners = app.on_sale_catalog()
        self.assertEqual([item['id'] for item in templates[:2]], ['t2', 't1'])
        self.assertEqual([item['id'] for item in banners[:2]], ['b3', 'b1'])
        self.assertEqual([item['id'] for item in home.home_articles(self.db)], [self.article['id']])
        self.assertIsNone(self.db.get('templates', 't3').get('homeOrder'))

    def test_banner_fields_and_target_validation(self):
        data = {**self.data, 'banners': [
            {'id': 'b3', 'title': '首页主题', 'tags': ['温柔'],
             'target': {'type': 'article', 'id': self.article['id']},
             'cover': 'upload_1', 'on': True}, 'b1']}
        home.save(self.db, data)
        banner = self.db.get('banners', 'b3')
        self.assertEqual(banner['target'], {'type': 'article', 'id': self.article['id']})
        self.assertEqual(banner['tags'], ['温柔'])
        bad = {**self.data, 'banners': [{'id': 'b3', 'target': {'type': 'other', 'id': 'x'}}]}
        with self.assertRaises(ValueError):
            home.save(self.db, bad)

    def test_invalid_or_duplicate_ids_leave_order_unchanged(self):
        for data in ({**self.data, 'templates': ['t1', 't1']},
                     {**self.data, 'articles': ['missing']},
                     {**self.data, 'banners': ['missing']},
                     {'templates': [], 'articles': []}):
            with self.assertRaises(ValueError):
                home.save(self.db, data)
        self.assertIsNone(self.db.get('templates', 't1').get('homeOrder'))

    def test_reordering_clears_removed_home_articles(self):
        home.save(self.db, self.data)
        home.save(self.db, {**self.data, 'articles': []})
        self.assertEqual(home.home_articles(self.db), [])
        self.assertIsNone(self.db.get('articles', self.article['id'])['homeOrder'])


if __name__ == '__main__':
    unittest.main()
