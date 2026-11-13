"""Public WeChat mini program code for an active share."""
import json
import urllib.parse
import urllib.request

import content_security
import user_api


def _fetch_code(share_id):
    token = content_security._access_token()
    url = ('https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token='
           + urllib.parse.quote(token, safe=''))
    payload = json.dumps({
        'scene': share_id,
        'page': 'features/shared/shared',
        'check_path': False,
        'env_version': 'release',
    }).encode()
    request = urllib.request.Request(url, data=payload,
                                     headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = response.read()
    if not result.startswith(b'\x89PNG\r\n\x1a\n'):
        raise RuntimeError('微信小程序码生成失败')
    return result


def get_qrcode(ctx, match, data):
    share_id = match.group(1)
    if not user_api.read_share(ctx.db, share_id) or not content_security.configured():
        raise KeyError('分享不存在')
    return 200, _fetch_code(share_id)


ROUTES = [
    ('GET', r'/api/shares/([A-Za-z0-9_-]{43})/qrcode', get_qrcode, 'public'),
]
