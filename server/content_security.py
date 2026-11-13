"""WeChat text content security with cached access tokens and a test seam."""
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request

import env

_token = None
_expires_at = 0
_lock = threading.Lock()
_checker = None
_image_checker = None


class ContentRejected(ValueError):
    pass


def configured():
    return bool(os.environ.get('WECHAT_APP_ID') and os.environ.get('WECHAT_APP_SECRET'))


def fail_open_allowed():
    """未配置凭证时是否允许 fail-open：仅 development 环境允许；trial/production 必须 fail-closed。"""
    return env.is_dev()


def set_checker(checker):
    global _checker
    _checker = checker


def set_image_checker(checker):
    global _image_checker
    _image_checker = checker


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
        if fail_open_allowed():
            sys.stderr.write('content security skipped: WECHAT_APP_ID/WECHAT_APP_SECRET not configured\n')
            return True
        raise ContentRejected('内容安全未配置，无法校验文字')
    return _wechat_check(text)


def ensure_allowed(*texts):
    if any(not allowed(text) for text in texts if text):
        raise ContentRejected('文字包含不适合发布的内容，请修改后重试')


def _wechat_check_image_async(media_url):
    """提交微信异步图片检查；返回 (是否已直接放行, trace_id)。"""
    request = urllib.request.Request(
        'https://api.weixin.qq.com/wxa/media_check_async?access_token=' + urllib.parse.quote(_access_token()),
        data=json.dumps({'media_url': media_url, 'media_type': 2}, ensure_ascii=False).encode(),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read())
    code = int(result.get('errcode', 0))
    if code == 0:
        return False, result.get('trace_id')
    if code in (87014,):
        return True, None
    raise RuntimeError('微信图片检查暂不可用')


def check_image_async(media_url):
    """提交图片安全检查。返回 "passed"（已放行）或 "pending"（等微信回调）。

    未配置凭证时和文字检查同一条 fail-open 规则：只在 development 环境放行，
    trial/production 抛 ContentRejected。
    """
    if _image_checker is not None:
        return _image_checker(media_url)
    if not configured():
        if fail_open_allowed():
            sys.stderr.write('image check skipped: WECHAT_APP_ID/WECHAT_APP_SECRET not configured\n')
            return 'passed'
        raise ContentRejected('内容安全未配置，无法校验图片')
    passed, _trace_id = _wechat_check_image_async(media_url)
    return 'passed' if passed else 'pending'


def filter_ai_entries(entries):
    safe = []
    for entry in entries or []:
        texts = [entry.get(k) for k in ('name', 'meaning', 'story', 'summary', 'text') if isinstance(entry, dict)]
        if all(allowed(text) for text in texts):
            safe.append(entry)
    return safe

