"""Store moderated customer reviews."""

VERSION = '013'
NAME = 'reviews'
NEW_TABLES = ('reviews',)


def up(conn, adapter):
    adapter.create_table(conn, 'reviews')
