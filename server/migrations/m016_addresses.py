"""用户地址簿。"""

VERSION = "016"
NAME = "addresses"
NEW_TABLES = ("addresses",)


def up(conn, adapter):
    adapter.create_table(conn, "addresses")
