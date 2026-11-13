"""Create the ai_logs and stats_daily tables."""

VERSION = '018'
NAME = 'ai_logs'
NEW_TABLES = ('ai_logs', 'stats_daily')


def up(conn, adapter):
    adapter.create_table(conn, 'ai_logs')
    adapter.create_table(conn, 'stats_daily')
