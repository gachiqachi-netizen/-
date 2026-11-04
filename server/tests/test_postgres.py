"""Opt-in PostgreSQL integration tests in a temporary, uniquely named schema."""
import os
import sys
import tempfile
import threading
import time
import unittest
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
from db_postgres import PostgresDB
from migrate_sqlite_postgres import migrate
import user_api

URL = os.environ.get('BEADLOOP_TEST_DATABASE_URL')


@unittest.skipUnless(URL, 'set BEADLOOP_TEST_DATABASE_URL to run PostgreSQL integration tests')
class PostgresTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import make_conninfo
        cls.psycopg = psycopg
        cls.schema = 'beadloop_test_' + uuid.uuid4().hex
        with psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('CREATE SCHEMA {}').format(sql.Identifier(cls.schema)))
        cls.url = make_conninfo(URL, options='-csearch_path=' + cls.schema)
        cls.db = PostgresDB(cls.url, initialize=True)

    @classmethod
    def tearDownClass(cls):
        from psycopg import sql
        with cls.psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('DROP SCHEMA {} CASCADE').format(sql.Identifier(cls.schema)))

    def setUp(self):
        from db import TABLES
        with self.db.connect() as conn:
            for table in TABLES:
                conn.execute(f'DELETE FROM {table}')

    def test_design_revision_and_order_idempotency_concurrency(self):
        bead = {'id':'b1','name':'测试珠','price':2,'mm':8,'onSale':True}
        self.db.put('beads', 'b1', bead)
        original = user_api.design_data({'name':'原设计','beads':['b1'],'wrist':15}, 'u1')
        self.db.put('designs', 'a' * 32, original)
        barrier = threading.Barrier(2); results = []
        def update(name):
            candidate = user_api.design_data({'name':name,'beads':['b1'],'wrist':15}, 'u1')
            barrier.wait()
            results.append(self.db.update_design_if_version('a' * 32, 'u1', original['updatedAt'], candidate)[0])
        a=threading.Thread(target=update,args=('一',)); b=threading.Thread(target=update,args=('二',))
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(sorted(results), ['conflict','updated'])
        req = {'requestId':'pg-concurrent-0001','beads':['b1']*6,'wrist':15,'person':'测试','phone':'13800138000','addr':'地址',
               'confirmedQuote':{'totalFen':3500,'items':[{'id':'b1','unitPriceFen':200,'mm':8}]}}
        barrier = threading.Barrier(2); orders = []
        def order():
            barrier.wait(); orders.append(user_api.make_order(self.db, req, 'u1'))
        a=threading.Thread(target=order); b=threading.Thread(target=order)
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(len(orders), 2)
        self.assertEqual(orders[0]['no'], orders[1]['no'])
        self.assertEqual(len(self.db.list('orders')), 1)

    def test_quote_recheck_and_sqlite_migration_refuses_overwrite(self):
        old = {'id':'b1','name':'测试珠','price':2,'mm':8,'photo':None}
        self.db.put('beads','b1',{**old,'price':3})
        self.assertEqual(self.db.idempotent_order('a' * 64,'fp',{'no':'test','items':[old]})[0], 'price_changed')
        self.assertEqual(self.db.list('orders'), [])
        with tempfile.TemporaryDirectory() as directory:
            sqlite = DB(os.path.join(directory, 'source.db'))
            sqlite.put('users','u1',{'createdAt':int(time.time())})
            sqlite.conn.close()
            with self.assertRaises(RuntimeError):
                migrate(os.path.join(directory, 'source.db'), self.url)
            self.assertEqual(self.db.get('users','u1'), None)
            self.db.delete('beads','b1')
            counts = migrate(os.path.join(directory, 'source.db'), self.url)
            self.assertEqual(counts['users'], 1)
            self.assertIsNotNone(self.db.get('users','u1'))
            with self.assertRaises(RuntimeError):
                migrate(os.path.join(directory, 'source.db'), self.url)

