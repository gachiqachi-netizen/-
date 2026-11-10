"""WeChat text content security with cached access tokens and a test seam."""
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request

_token = None
_expires_at = 0
_lock = threading.Lock()
_checker = None


class ContentRejected(ValueError):
    pass


def configured():
    return bool(os.environ.get('WECHAT_APP_ID') and os.environ.get('WECHAT_APP_SECRET'))


def set_checker(checker):
    global _checker
    _checker = checker


def _access_token():
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
            raise RuntimeError('微信内容安全凭证获取失败')
        _token = result['access_token']
        _expires_at = time.time() + int(result.get('expires_in', 7200))
        return _token


def _wechat_check(text):
    request = urllib.request.Request(
        'https://api.weixin.qq.com/wxa/msg_sec_check?access_token=' + urllib.parse.quote(_access_token()),
        data=json.dumps({'content': text}, ensure_ascii=False).encode(),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read())
    code = int(result.get('errcode', 0))
    if code == 0:
        return True
    if code in (87014,):
        return False
    raise RuntimeError('微信内容安全检查暂不可用')


def allowed(text):
    text = str(text or '').strip()
    if not text:
        return True
    if _checker is not None:
        return bool(_checker(text))
    if not configured():
        sys.stderr.write('content security skipped: WECHAT_APP_ID/WECHAT_APP_SECRET not configured\n')
        return True
    return _wechat_check(text)


def ensure_allowed(*texts):
    if any(not allowed(text) for text in texts if text):
        raise ContentRejected('文字包含不适合发布的内容，请修改后重试')


def filter_ai_entries(entries):
    safe = []
    for entry in entries or []:
        texts = [entry.get(k) for k in ('name', 'meaning', 'story', 'summary', 'text') if isinstance(entry, dict)]
        if all(allowed(text) for text in texts):
            safe.append(entry)
    return safe

