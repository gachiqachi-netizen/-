"""007 Rename historical accessory resend records; safe to run repeatedly."""

VERSION = '007'
NAME = 'after_sale_types'


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'after_sales'):
        if doc.get('type') == '补发':
            doc['type'] = '补寄配件'
            adapter.update_doc(conn, 'after_sales', rid, doc)
