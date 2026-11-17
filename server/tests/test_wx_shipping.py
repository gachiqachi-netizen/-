"""B-15: WeChat shipment upload uses fake external calls only."""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import wx_shipping


class FakeDB:
    def __init__(self, order):
        self.order = dict(order)
        self.writes = 0

    def get(self, table, rid):
        return dict(self.order)

    def put(self, table, rid, doc):
        self.order = dict(doc)
        self.writes += 1


def order():
    return {'no': 'test-order', 'name': '手串', 'phone': '13900000000',
            'paymentChannel': 'wechat', 'fulfillmentStatus': 'shipped',
            'logistics': {'carrierName': '顺丰速运', 'trackingNo': 'test-waybill'}}


class ShippingTest(unittest.TestCase):
    def test_express_code_mapping(self):
        self.assertEqual(wx_shipping.express_code('顺丰'), 'SF')
        self.assertEqual(wx_shipping.express_code('顺丰速运'), 'SF')
        self.assertIsNone(wx_shipping.express_code('未知快递'))

    def test_success_payload_and_no_duplicate(self):
        rec = order()
        db = FakeDB(rec)
        queried = {'trade_state': 'SUCCESS', 'out_trade_no': rec['no'], 'mchid': 'test-merchant',
                   'payer': {'openid': 'test-openid'}}
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='wechat'), \
             mock.patch.object(wx_shipping.wechat_pay, 'query_order', return_value=queried), \
             mock.patch.object(wx_shipping, '_post', return_value={'errcode': 0}) as post, \
             mock.patch.dict(os.environ, {'WXPAY_MCHID': 'test-merchant'}):
            saved = wx_shipping.sync(db, rec['no'], rec)
            payload = post.call_args.args[0]
            self.assertEqual(payload['order_key'], {'order_number_type': 1,
                                                     'mchid': 'test-merchant', 'out_trade_no': rec['no']})
            self.assertEqual(payload['shipping_list'][0]['express_company'], 'SF')
            self.assertEqual(payload['shipping_list'][0]['contact']['receiver_contact'], rec['phone'])
            self.assertEqual(payload['payer']['openid'], 'test-openid')
            self.assertEqual(saved['wxShipping']['status'], 'synced')
            wx_shipping.sync(db, rec['no'], rec)
            self.assertEqual(post.call_count, 1)

    def test_failure_keeps_shipped_and_retries(self):
        rec = order()
        db = FakeDB(rec)
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='wechat'), \
             mock.patch.object(wx_shipping, '_payload', return_value={}), \
             mock.patch.object(wx_shipping, '_post', side_effect=[RuntimeError('failure'), {'errcode': 0}]):
            failed = wx_shipping.sync(db, rec['no'], rec)
            self.assertEqual(failed['fulfillmentStatus'], 'shipped')
            self.assertEqual(failed['wxShipping']['message'], wx_shipping.UNSYNCED)
            self.assertEqual(wx_shipping.sync(db, rec['no'], failed)['wxShipping']['status'], 'synced')

    def test_mock_channel_never_calls_wechat(self):
        rec = order()
        db = FakeDB(rec)
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='mock'), \
             mock.patch.object(wx_shipping, '_post') as post:
            wx_shipping.sync(db, rec['no'], rec)
            post.assert_not_called()
            self.assertEqual(db.writes, 0)


if __name__ == '__main__':
    unittest.main()
