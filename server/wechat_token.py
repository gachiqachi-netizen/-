"""Shared cached mini-program access token for WeChat server APIs."""
import json
import os
import threading
import time
import urllib.parse
import urllib.request

_token = None
_expires_at = 0
_lock = threading.Lock()


def access_token():
    global _token, _expires_at
    if _token and _expires_at > time.time() + 60:
        return _token
    with _lock:
        if _token and _expires_at > time.time() + 60:
            return _token
        query = urllib.parse.urlencode({'grant_type': 'client_credential', 'appid': os.environ['WECHAT_APP_ID'], 'secret': os.environ['WECHAT_APP_SECRET']})
        with urllib.request.urlopen('https://api.weixin.qq.com/cgi-bin/token?' + query, timeout=8) as response:
            result = json.loads(response.read())
        if not result.get('access_token'):
            raise RuntimeError('微信接口凭证获取失败')
        _token = result['access_token']
        _expires_at = time.time() + int(result.get('expires_in', 7200))
        return _token
