"""Create the notify_logs and subscriptions tables."""

VERSION = '017'
NAME = 'notify_logs'
NEW_TABLES = ('notify_logs', 'subscriptions')


def up(conn, adapter):
    adapter.create_table(conn, 'notify_logs')
    adapter.create_table(conn, 'subscriptions')
