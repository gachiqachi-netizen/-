"""旧后台 HTTP 测试共用的负责人会话前提。"""
import json
import secrets
import threading
from http.server import ThreadingHTTPServer
from urllib.request import ProxyHandler, Request, build_opener

import accounts
import app


def owner_headers(base_url=None, username=None):
    """在当前测试数据库创建负责人，经登录接口取得 Cookie 请求头。"""
    username = username or "test-owner-" + secrets.token_hex(6)
    password = "test-only-owner-pass"
    accounts.create_user(app.db, username, "测试负责人", "owner", password)
    server = thread = None
    if base_url is None:
        server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base_url = f"http://127.0.0.1:{server.server_port}"
    try:
        request = Request(base_url + "/api/admin/session",
                          data=json.dumps({"username": username, "password": password}).encode(),
                          headers={"Content-Type": "application/json"}, method="POST")
        with build_opener(ProxyHandler({})).open(request, timeout=3) as response:
            if response.status != 200:
                raise AssertionError(f"负责人登录失败：{response.status}")
            cookie = response.headers["Set-Cookie"].split(";", 1)[0]
        return {"Cookie": cookie}
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()
            thread.join()
