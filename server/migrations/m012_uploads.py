"""012 用户上传图片表 uploads：B-1 建的表，由迁移登记机制自动并入 ALL_TABLES。"""

VERSION = '012'
NAME = 'uploads'

NEW_TABLES = ('uploads',)


def up(conn, adapter):
    adapter.create_table(conn, 'uploads')
