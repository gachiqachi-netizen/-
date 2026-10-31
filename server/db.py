"""本地数据库：SQLite，每张表存一份 JSON 文档。正式版换成小程序云开发数据库，接口不变。"""
import json
import sqlite3
import threading

import seed

TABLES = ("beads", "templates", "banners", "orders")


class DB:
    def __init__(self, path):
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.lock = threading.Lock()
        with self.lock:
            for t in TABLES:
                self.conn.execute(f"CREATE TABLE IF NOT EXISTS {t} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
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

    def delete(self, table, rid):
        assert table in TABLES
        with self.lock:
            self.conn.execute(f"DELETE FROM {table} WHERE id = ?", (rid,))
            self.conn.commit()
