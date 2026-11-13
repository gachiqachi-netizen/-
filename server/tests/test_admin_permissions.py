"""A8b: four default roles against every registered legacy admin endpoint."""
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import routes
from db import DB


class AdminPermissionsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, "permissions.db"))

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def test_four_roles_by_every_registered_endpoint(self):
        for method, pattern, perm in accounts.ROUTE_PERMISSIONS:
            # The map is authoritative; each role is evaluated against its stored permissions.
            for role_id, allowed in accounts.ROLE_PERMISSIONS.items():
                user = {'roleId': role_id}
                expected = role_id == 'owner' or perm in allowed
                with self.subTest(method=method, pattern=pattern, role=role_id):
                    self.assertEqual(accounts.has_permission(self.db, user, perm), expected)

    def test_sensitive_actions_have_separate_permissions(self):
        self.assertEqual(accounts.route_permission('PUT', '/api/admin/orders/no/status',
                                                  {'to': 'cancelled'}), 'cancel_orders')
        self.assertEqual(accounts.route_permission('PUT', '/api/admin/orders/no/status',
                                                  {'to': 'producing'}), 'process_orders')
        self.assertEqual(accounts.route_permission('PUT', '/api/admin/orders/no/quality-gate'), 'quality_gate')
        self.assertEqual(accounts.route_permission('PUT', '/api/admin/beads/one',
                                                  {'priceFen': 100}), 'edit_prices')
        self.assertEqual(accounts.route_permission('PUT', '/api/admin/beads/one',
                                                  {'name': 'a'}), 'edit_products')

    def test_legacy_endpoint_mapping(self):
        cases = (
            ('GET', '/api/admin/orders', 'view_orders'),
            ('GET', '/api/admin/orders/no', 'view_orders'),
            ('GET', '/api/admin/orders/no/work-order', 'view_work_orders'),
            ('GET', '/api/admin/work-orders', 'view_work_orders'),
            ('GET', '/api/admin/after-sales', 'process_after_sales'),
            ('GET', '/api/admin/terms', 'publish_terms'),
            ('GET', '/api/admin/audit', 'manage_accounts'),
            ('GET', '/api/admin/beads', 'edit_products'),
            ('GET', '/api/admin/templates', 'edit_templates'),
            ('GET', '/api/admin/banners', 'edit_content'),
            ('POST', '/api/admin/beads', 'edit_products'),
            ('POST', '/api/admin/templates', 'edit_templates'),
            ('POST', '/api/admin/banners', 'edit_content'),
            ('POST', '/api/admin/after-sales', 'process_after_sales'),
            ('POST', '/api/admin/terms', 'publish_terms'),
            ('PUT', '/api/admin/orders/no/logistics', 'process_orders'),
            ('PUT', '/api/admin/orders/no', 'process_orders'),
            ('PUT', '/api/admin/orders/no/work-order', 'work_orders'),
            ('PUT', '/api/admin/orders/no/address', 'edit_order_address'),
            ('PUT', '/api/admin/orders/no/note', 'edit_order_address'),
            ('PUT', '/api/admin/after-sales/no/transition', 'process_after_sales'),
            ('PUT', '/api/admin/templates/no', 'edit_templates'),
            ('PUT', '/api/admin/banners/no', 'edit_content'),
            ('PUT', '/api/admin/terms/no', 'publish_terms'),
            ('DELETE', '/api/admin/beads/no', 'edit_products'),
            ('DELETE', '/api/admin/templates/no', 'edit_templates'),
            ('DELETE', '/api/admin/banners/no', 'edit_content'),
            ('DELETE', '/api/admin/terms/no', 'publish_terms'),
            ('GET', '/api/admin/accounts', 'manage_accounts'),
            ('POST', '/api/admin/shares/token/take-down', 'edit_content'),
        )
        for method, path, expected in cases:
            with self.subTest(method=method, path=path):
                self.assertEqual(accounts.route_permission(method, path), expected)

    def test_permissions_are_loaded_from_role_record(self):
        role = self.db.get('admin_roles', 'operator')
        role['permissions'] = ['view_orders']
        self.db.put('admin_roles', 'operator', role)
        user = {'roleId': 'operator'}
        self.assertTrue(accounts.has_permission(self.db, user, 'view_orders'))
        self.assertFalse(accounts.has_permission(self.db, user, 'edit_products'))

    def test_route_registry_accepts_permission_names(self):
        table = routes.compile_routes([('GET', '/api/admin/demo', lambda *_: (200, {}), 'view_orders')])
        self.assertEqual(table[0][3], 'view_orders')
        with self.assertRaises(ValueError):
            routes.compile_routes([('GET', '/api/admin/demo', lambda *_: (200, {}), 'unknown_permission')])

    def test_http_permission_denials(self):
        handler = object.__new__(app.Handler)
        handler.path = '/api/admin/orders'
        handler.command = 'GET'
        replies = []
        handler.send = lambda code, body: replies.append((code, body))
        handler.admin_ok = lambda: False
        self.assertFalse(handler.admin_can())
        self.assertEqual(replies[-1][0], 401)
        handler.admin_user = {'roleId': 'maker'}
        handler.admin_ok = lambda: True
        with patch.object(app, 'db', self.db):
            self.assertFalse(handler.admin_can())
            self.assertEqual(replies[-1], (403, {'error': '你没有这个操作的权限', 'need': '看订单'}))
            handler.admin_user = {'roleId': 'owner'}
            self.assertTrue(handler.admin_can())
