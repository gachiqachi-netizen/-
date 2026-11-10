"""本地数据库：SQLite，每张表存一份 JSON 文档。正式版换成小程序云开发数据库，接口不变。"""
import json
import sqlite3
import threading
import time

import seed

TABLES = ("beads", "templates", "banners", "orders", "users", "sessions", "designs", "order_requests", "shares")


class DB:
    def __init__(self, path):
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.lock = threading.Lock()
        with self.lock:
            for t in TABLES:
                self.conn.execute(f"CREATE TABLE IF NOT EXISTS {t} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
            for table in ("designs", "orders"):
                columns = {row[1] for row in self.conn.execute(f"PRAGMA table_info({table})")}
                if "user_id" not in columns:
                    self.conn.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT")
                rows = self.conn.execute(f"SELECT id, doc FROM {table} WHERE user_id IS NULL").fetchall()
                for rid, raw in rows:
                    self.conn.execute(f"UPDATE {table} SET user_id = ? WHERE id = ?", (json.loads(raw).get("userId"), rid))
                self.conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table}(user_id)")
            self.conn.commit()
        if not self.list("beads"):
            for b in seed.BEADS:
                self.put("beads", b["id"], b)
            for t in seed.TEMPLATES:
                self.put("templates", t["id"], t)
            for b in seed.BANNERS:
                self.put("banners", b["id"], b)

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

    def list_by_owner(self, table, user_id):
        assert table in ("designs", "orders")
        with self.lock:
            rows = self.conn.execute(f"SELECT id, doc FROM {table} WHERE user_id = ?", (user_id,)).fetchall()
        return [{**json.loads(doc), "id": rid} for rid, doc in rows]

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
            raw = json.dumps(doc, ensure_ascii=False)
            if table in ("designs", "orders"):
                self.conn.execute(f"INSERT OR REPLACE INTO {table} (id, doc, user_id) VALUES (?, ?, ?)",
                                  (rid, raw, doc.get("userId")))
            else:
                self.conn.execute(f"INSERT OR REPLACE INTO {table} (id, doc) VALUES (?, ?)", (rid, raw))
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
                self.conn.execute('INSERT INTO orders (id, doc, user_id) VALUES (?, ?, ?)',
                                  (no, json.dumps(order, ensure_ascii=False), order.get('userId')))
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

    def delete_expired_sessions(self, now=None):
        now = time.time() if now is None else now
        with self.lock:
            rows = self.conn.execute("SELECT id, doc FROM sessions").fetchall()
            expired = [rid for rid, raw in rows if json.loads(raw).get("expiresAt", 0) <= now]
            self.conn.executemany("DELETE FROM sessions WHERE id = ?", [(rid,) for rid in expired])
            self.conn.commit()
        return len(expired)
