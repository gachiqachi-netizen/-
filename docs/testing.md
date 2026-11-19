# 后端商品接口测试

普通全量测试会运行 SQLite 的 562 珠商品接口测试。它测量首次请求与缓存命中请求，分别要求小于 3 秒和 1 秒；输出 `H4 DB catalog cold=... warm=...`。

Postgres 专项测试可选。先安装仓库已有的 `server/requirements-postgres.txt`，并启动一个仅供测试的临时实例：

```bash
docker run --rm --name chuan-h4-pg -e POSTGRES_PASSWORD=h4-local-only -e POSTGRES_DB=h4_test -p 127.0.0.1:55432:5432 -d postgres:16
TEST_DATABASE_URL=postgresql://postgres:h4-local-only@127.0.0.1:55432/h4_test python3 -m unittest discover -s server/tests -p test_postgres_catalog.py -v
docker stop chuan-h4-pg
```

测试在独立 schema 中创建和删除数据。未设置 `TEST_DATABASE_URL` 时，Postgres 整组跳过。不要指向生产库。
