"""B-15: WeChat shipment upload uses fake external calls only."""
import os
import sys
import unittest
import json
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import wx_shipping
import content_security
import wechat_token
import user_api


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


DELIVERY_LIST = [
    {'delivery_name': name, 'delivery_id': 'test-' + str(index)}
    for index, name in enumerate(('顺丰速运', '中通快递', '圆通速递', '韵达速递', '申通快递',
                                  '中国邮政速递物流', '邮政快递包裹', '京东快递', '极兔速递', '德邦快递'))
]


class ShippingTest(unittest.TestCase):
    def test_internal_sync_state_not_sent_to_customer(self):
        rec = order()
        rec['wxShipping'] = {'status': 'failed', 'message': wx_shipping.UNSYNCED}
        self.assertNotIn('wxShipping', user_api.public_order(rec))

    def test_content_security_and_shipping_share_token_cache(self):
        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self):
                return json.dumps({'access_token': 'test-token', 'expires_in': 7200}).encode()

        with mock.patch.object(wechat_token, '_token', None), \
             mock.patch.object(wechat_token, '_expires_at', 0), \
             mock.patch.object(wechat_token.urllib.request, 'urlopen', return_value=Response()) as urlopen, \
             mock.patch.dict(os.environ, {'WECHAT_APP_ID': 'test-app', 'WECHAT_APP_SECRET': 'test-secret'}):
            self.assertEqual(content_security._access_token(), 'test-token')
            self.assertEqual(wechat_token.access_token(), 'test-token')
            urlopen.assert_called_once()

    def test_express_code_mapping(self):
        variants = (('顺丰', '顺丰速运', 'sF'), ('中通', '中通快递', 'zTo'),
                    ('圆通', '圆通快递', 'yTo'), ('韵达', '韵达快递', 'yD'),
                    ('申通', '申通快递', 'sTo'), ('EMS', 'ems', '中国邮政速递物流'),
                    ('邮政', '邮政快递包裹', 'yZpY'), ('京东', '京东快递', 'jD'),
                    ('极兔', '极兔速递', 'jTsD'), ('德邦', '德邦快递', 'dB'))
        for index, names in enumerate(variants):
            for name in names:
                with self.subTest(name=name):
                    self.assertEqual(wx_shipping.express_code(name, DELIVERY_LIST), 'test-' + str(index))
        self.assertIsNone(wx_shipping.express_code('未知快递', DELIVERY_LIST))
        self.assertIsNone(wx_shipping.express_code('京东', DELIVERY_LIST[:5]))

    def test_success_payload_and_no_duplicate(self):
        rec = order()
        db = FakeDB(rec)
        queried = {'trade_state': 'SUCCESS', 'out_trade_no': rec['no'], 'mchid': 'test-merchant',
                   'payer': {'openid': 'test-openid'}}
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='wechat'), \
             mock.patch.object(wx_shipping.wechat_pay, 'query_order', return_value=queried), \
             mock.patch.object(wx_shipping, '_get_delivery_list', return_value=DELIVERY_LIST), \
             mock.patch.object(wx_shipping, '_post', return_value={'errcode': 0}) as post, \
             mock.patch.dict(os.environ, {'WXPAY_MCHID': 'test-merchant'}):
            saved = wx_shipping.sync(db, rec['no'], rec)
            payload = post.call_args.args[0]
            self.assertEqual(payload['order_key'], {'order_number_type': 1,
                                                     'mchid': 'test-merchant', 'out_trade_no': rec['no']})
            self.assertEqual(payload['shipping_list'][0]['express_company'], 'test-0')
            self.assertEqual(payload['shipping_list'][0]['contact']['receiver_contact'], '139****0000')
            self.assertNotIn(rec['phone'], json.dumps(payload, ensure_ascii=False))
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
            self.assertEqual(failed['wxShipping']['reason'], 'api')
            self.assertEqual(wx_shipping.sync(db, rec['no'], failed)['wxShipping']['status'], 'synced')

    def test_carrier_failure_is_not_retriable_until_name_changes(self):
        rec = order()
        rec['logistics']['carrierName'] = '未知快递'
        db = FakeDB(rec)
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='wechat'), \
             mock.patch.object(wx_shipping.wechat_pay, 'query_order') as query:
            result = wx_shipping.sync(db, rec['no'], rec)
            self.assertEqual(result['wxShipping']['reason'], 'carrier')
            self.assertEqual(result['wxShipping']['message'], wx_shipping.CARRIER_UNSYNCED)
            query.assert_not_called()

    def test_payment_failure_reason(self):
        rec = order()
        db = FakeDB(rec)
        with mock.patch.object(wx_shipping.payments, 'provider', return_value='wechat'), \
             mock.patch.object(wx_shipping, '_get_delivery_list', return_value=DELIVERY_LIST), \
             mock.patch.object(wx_shipping.wechat_pay, 'query_order', return_value={'trade_state': 'NOTPAY'}), \
             mock.patch.dict(os.environ, {'WXPAY_MCHID': 'test-merchant'}):
            self.assertEqual(wx_shipping.sync(db, rec['no'], rec)['wxShipping']['reason'], 'payment')

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
