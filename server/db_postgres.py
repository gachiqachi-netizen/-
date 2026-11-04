"""PostgreSQL development adapter; shared data contracts with the SQLite adapter.

One short-lived connection per operation; pooling and production schema migrations
are separate operational work. Uses JSONB to preserve the existing API documents.
"""
import json

from db import TABLES


class PostgresDB:
    def __init__(self, url, initialize=False):
        try:
            import psycopg
        except ImportError as exc:
            raise RuntimeError('PostgreSQL 需要安装 psycopg 3（见 server/requirements-postgres.txt）') from exc
        self.psycopg = psycopg
        self.url = url
        if initialize:
            self.initialize()

    def connect(self):
        return self.psycopg.connect(self.url, connect_timeout=10)

    def initialize(self):
        with self.connect() as conn:
            for table in TABLES:
                conn.execute(f'CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, doc JSONB NOT NULL)')

    @staticmethod
    def _check(table):
        if table not in TABLES:
            raise ValueError('未知数据表')

    def list(self, table):
        self._check(table)
        with self.connect() as conn:
            rows = conn.execute(f'SELECT id, doc FROM {table}').fetchall()
        return sorted([{**doc, 'id': rid} for rid, doc in rows], key=lambda d: (d.get('order', 9999), d['id']))

    def get(self, table, rid):
        self._check(table)
        with self.connect() as conn:
            row = conn.execute(f'SELECT doc FROM {table} WHERE id = %s', (rid,)).fetchone()
        return {**row[0], 'id': rid} if row else None

    def put(self, table, rid, doc):
        self._check(table)
        data = dict(doc); data.pop('id', None)
        with self.connect() as conn:
            conn.execute(f'INSERT INTO {table} (id,doc) VALUES (%s,%s::jsonb) ON CONFLICT (id) DO UPDATE SET doc=EXCLUDED.doc',
                         (rid, json.dumps(data, ensure_ascii=False, allow_nan=False)))
        return {**data, 'id': rid}

    def delete(self, table, rid):
        self._check(table)
        with self.connect() as conn:
            conn.execute(f'DELETE FROM {table} WHERE id = %s', (rid,))

    def update_design_if_version(self, rid, user_id, expected, doc):
        with self.connect() as conn:
            row = conn.execute('SELECT doc FROM designs WHERE id = %s FOR UPDATE', (rid,)).fetchone()
            old = row[0] if row else None
            if not old or old.get('userId') != user_id:
                return 'missing', None
            if old.get('updatedAt') != expected:
                return 'conflict', None
            data = dict(doc); data.pop('id', None)
            for field in ('special', 'pattern', 'tail', 'fixed', 'source', 'tplId', 'meaning', 'edited'):
                if field not in data and field in old:
                    data[field] = old[field]
            data['createdAt'] = old.get('createdAt', data['updatedAt'])
            data['updatedAt'] = max(data['updatedAt'], old['updatedAt'] + 1)
            conn.execute('UPDATE designs SET doc = %s::jsonb WHERE id = %s',
                         (json.dumps(data, ensure_ascii=False, allow_nan=False), rid))
            return 'updated', {**data, 'id': rid}

    def idempotent_order(self, request_id, fingerprint, order=None):
        with self.connect() as conn:
            # Serialize the absent-key case across connections and instances.
            lock_key = int(request_id[:16], 16)
            if lock_key >= 2**63:
                lock_key -= 2**64
            conn.execute('SELECT pg_advisory_xact_lock(%s)', (lock_key,))
            row = conn.execute('SELECT doc FROM order_requests WHERE id = %s', (request_id,)).fetchone()
            if row:
                record = row[0]
                if record['fingerprint'] != fingerprint:
                    return 'conflict', None
                stored = conn.execute('SELECT doc FROM orders WHERE id = %s', (record['orderId'],)).fetchone()
                if not stored:
                    raise RuntimeError('订单记录缺失')
                return 'existing', stored[0]
            if order is None:
                return 'missing', None
            # Sorted shared row locks prevent changes or deletion until commit and
            # prevent lock-order deadlocks across different mixed designs.
            by_id = {item['id']: item for item in order['items']}
            for rid in sorted(by_id):
                item = by_id[rid]
                row = conn.execute('SELECT doc FROM beads WHERE id = %s FOR SHARE', (rid,)).fetchone()
                bead = row[0] if row else None
                if not bead or not bead.get('onSale', True) or any(bead.get(k) != item.get(k) for k in ('name', 'mm', 'price', 'photo')):
                    return 'price_changed', None
            no = order['no']
            conn.execute('INSERT INTO orders (id,doc) VALUES (%s,%s::jsonb)', (no, json.dumps(order, ensure_ascii=False, allow_nan=False)))
            conn.execute('INSERT INTO order_requests (id,doc) VALUES (%s,%s::jsonb)',
                         (request_id, json.dumps({'orderId': no, 'fingerprint': fingerprint})))
            return 'created', order
