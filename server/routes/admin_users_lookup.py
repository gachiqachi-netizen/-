"""Customer support lookup by masked phone suffix or order number."""
import re


def _summary(db, user, orders, after_sales, designs):
    uid = user['id']
    mine = [order for order in orders if order.get('userId') == uid]
    order_keys = {str(key) for order in mine for key in (order.get('no'), order.get('id')) if key}
    after_sale_count = sum(1 for item in after_sales
                           if item.get('userId') == uid
                           or str(item.get('orderNo') or item.get('orderId') or '') in order_keys)
    return {
        'userId': uid,
        'phoneMasked': user.get('phoneMasked') or '',
        'orders': [{'no': order.get('no') or order['id'],
                    'status': order.get('orderStatus'),
                    'totalFen': order.get('totalFen')}
                   for order in mine],
        'afterSaleCount': after_sale_count,
        'designCount': sum(1 for design in designs if design.get('userId') == uid),
    }


def lookup(ctx, match, data):
    query = (ctx.qs.get('q') or [''])[0].strip()
    if not query:
        raise ValueError('请提供手机号后四位或订单号')
    users = ctx.db.list('users')
    orders = ctx.db.list('orders')
    if re.fullmatch(r'\d{4}', query):
        matches = [user for user in users if str(user.get('phoneMasked') or '').endswith(query)]
    else:
        owner_ids = {order.get('userId') for order in orders
                     if query in (str(order.get('no') or ''), str(order['id']))}
        matches = [user for user in users if user['id'] in owner_ids]
    after_sales = ctx.db.list('after_sales')
    designs = ctx.db.list('designs')
    return 200, {'users': [_summary(ctx.db, user, orders, after_sales, designs) for user in matches]}


ROUTES = [('GET', r'/api/admin/users', lookup, 'lookup_users')]
