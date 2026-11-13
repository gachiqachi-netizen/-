"""Create the article document table."""

VERSION = '014'
NAME = 'articles'
NEW_TABLES = ('articles',)


def up(conn, adapter):
    adapter.create_table(conn, 'articles')
