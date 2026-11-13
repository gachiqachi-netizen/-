"""011 给已有后台角色补 edit_kb 权限（K3）。

A8a 之后新建的库角色模板里已带 edit_kb；这条迁移给升级上来的旧库补齐：
owner（负责人）拥有全部权限点，operator（运营）补上 edit_kb。
"""

VERSION = '011'
NAME = 'kb_permission'


def up(conn, adapter):
    for rid in ('owner', 'operator'):
        row = conn.execute('SELECT doc FROM admin_roles WHERE id = ?', (rid,)).fetchone()
        if not row:
            continue
        import json as _json
        role = _json.loads(row[0])
        perms = list(role.get('permissions') or [])
        if 'edit_kb' in perms:
            continue
        perms.append('edit_kb')
        role['permissions'] = perms
        adapter.update_doc(conn, 'admin_roles', rid, role)
