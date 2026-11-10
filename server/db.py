"""本地数据库：SQLite，每张表存一份 JSON 文档。正式版换成小程序云开发数据库，接口不变。"""
import json
import sqlite3
import threading

import seed

TABLES = ("beads", "templates", "banners", "orders", "users", "sessions", "designs", "order_requests", "shares",
          "audit_logs", "after_sales", "terms")


class DB:
    def __init__(self, path):
        self.lock = threading.Lock()
        try:
            self.conn = sqlite3.connect(path, check_same_thread=False)
            with self.lock:
                for t in TABLES:
                    self.conn.execute(f"CREATE TABLE IF NOT EXISTS {t} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
                self.conn.commit()
        except sqlite3.Error as e:
            raise RuntimeError(f"数据库迁移失败，无法启动：{e}（数据库文件：{path}）") from e
        if not self.list("beads"):
            for b in seed.BEADS:
                self.put("beads", b["id"], b)
            for t in seed.TEMPLATES:
                self.put("templates", t["id"], t)
            for b in seed.BANNERS:
                self.put("banners", b["id"], b)
        if not self.list("terms"):
            for t in seed.TERMS:
                self.put("terms", t["id"], t)

    def list(self, table):
        assert table in TABLES
        with self.lock:
            rows = self.conn.execute(f"SELECT id, doc FROM {table}").fetchall()
        out = []
        for rid, doc in rows:
            d = json.loads(doc)
            d["id"] = rid
            out.append(d)
        return sorted(out, key=lambda d: (d.get("order", 9999), d["id"]))

    def get(self, table, rid):
        assert table in TABLES
        with self.lock:
            row = self.conn.execute(f"SELECT doc FROM {table} WHERE id = ?", (rid,)).fetchone()
        if not row:
            return None
        d = json.loads(row[0])
        d["id"] = rid
        return d

    def put(self, table, rid, doc):
        assert table in TABLES
        doc = dict(doc)
        doc.pop("id", None)
        with self.lock:
            self.conn.execute(f"INSERT OR REPLACE INTO {table} (id, doc) VALUES (?, ?)", (rid, json.dumps(doc, ensure_ascii=False)))
            self.conn.commit()
        doc["id"] = rid
        return doc

    def update_design_if_version(self, rid, user_id, expected, doc):
        """Atomically check ownership and revision and update a design on this connection."""
        with self.lock:
            self.conn.execute('BEGIN IMMEDIATE')
            try:
                row = self.conn.execute('SELECT doc FROM designs WHERE id = ?', (rid,)).fetchone()
                old = json.loads(row[0]) if row else None
                if not old or old.get('userId') != user_id:
                    self.conn.rollback()
                    return 'missing', None
                if old.get('updatedAt') != expected:
                    self.conn.rollback()
                    return 'conflict', None
                doc = dict(doc)
                doc.pop('id', None)
                for field in ('special', 'pattern', 'tail', 'fixed', 'source', 'tplId', 'meaning', 'edited'):
                    if field not in doc and field in old:
                        doc[field] = old[field]
                doc['createdAt'] = old.get('createdAt', doc['updatedAt'])
                doc['updatedAt'] = max(doc['updatedAt'], old['updatedAt'] + 1)
                self.conn.execute('UPDATE designs SET doc = ? WHERE id = ?',
                                  (json.dumps(doc, ensure_ascii=False), rid))
                self.conn.commit()
                doc['id'] = rid
                return 'updated', doc
            except Exception:
                self.conn.rollback()
                raise

    def idempotent_order(self, request_id, fingerprint, order=None):
        """Resolve or create a request and order together in one write transaction."""
        with self.lock:
            self.conn.execute('BEGIN IMMEDIATE')
            try:
                row = self.conn.execute('SELECT doc FROM order_requests WHERE id = ?', (request_id,)).fetchone()
                if row:
                    record = json.loads(row[0])
                    if record['fingerprint'] != fingerprint:
                        self.conn.rollback()
                        return 'conflict', None
                    stored = self.conn.execute('SELECT doc FROM orders WHERE id = ?', (record['orderId'],)).fetchone()
                    if not stored:
                        raise RuntimeError('订单记录缺失')
                    result = json.loads(stored[0])
                    self.conn.commit()
                    return 'existing', result
                if order is None:
                    self.conn.rollback()
                    return 'missing', None
                # Recheck the catalog in the same write transaction as insertion,
                # so a concurrent admin update cannot alter the confirmed items.
                for item in order['items']:
                    row = self.conn.execute('SELECT doc FROM beads WHERE id = ?', (item['id'],)).fetchone()
                    bead = json.loads(row[0]) if row else None
                    if not bead or not bead.get('onSale', True) or any(bead.get(k) != item.get(k) for k in ('name', 'mm', 'price', 'photo')):
                        self.conn.rollback()
                        return 'price_changed', None
                no = order['no']
                self.conn.execute('INSERT INTO orders (id, doc) VALUES (?, ?)', (no, json.dumps(order, ensure_ascii=False)))
                record = {'orderId': no, 'fingerprint': fingerprint}
                self.conn.execute('INSERT INTO order_requests (id, doc) VALUES (?, ?)', (request_id, json.dumps(record)))
                self.conn.commit()
                return 'created', order
            except Exception:
                self.conn.rollback()
                raise

    def delete(self, table, rid):
        assert table in TABLES
        with self.lock:
            self.conn.execute(f"DELETE FROM {table} WHERE id = ?", (rid,))
            self.conn.commit()
