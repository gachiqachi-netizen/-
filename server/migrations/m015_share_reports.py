"""Create the share report document table."""

VERSION = '015'
NAME = 'share_reports'
NEW_TABLES = ('share_reports',)


def up(conn, adapter):
    adapter.create_table(conn, 'share_reports')
