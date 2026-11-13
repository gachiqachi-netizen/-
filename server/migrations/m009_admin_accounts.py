"""后台账号、角色、持久会话。"""
import json

import accounts

VERSION = "009"
NAME = "admin_accounts"
NEW_TABLES = ("admin_users", "admin_roles", "admin_sessions")


def up(conn, adapter):
    for table in NEW_TABLES:
        adapter.create_table(conn, table)
    existing = {rid for rid, _ in adapter.iter_docs(conn, "admin_roles")}
    placeholder = "%s" if adapter.name == "postgres" else "?"
    for role_id, name in accounts.ROLE_NAMES.items():
        if role_id in existing:
            continue
        doc = {"name": name, "permissions": list(accounts.ROLE_PERMISSIONS[role_id]),
               "builtin": True, "dataScope": "all"}
        raw = json.dumps(doc, ensure_ascii=False)
        conn.execute(f"INSERT INTO admin_roles (id, doc) VALUES ({placeholder}, {placeholder})",
                     (role_id, raw))
