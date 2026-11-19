#!/usr/bin/env python3
"""Offline deployment checks; --ping is the only network operation.

No environment value, file content, URL, or exception text is printed.
"""
import argparse
import os
import stat
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit


CORE = ('ENV', 'DATABASE_URL', 'ADMIN_TOKEN', 'WECHAT_APP_ID',
        'WECHAT_APP_SECRET', 'PAYMENT_PROVIDER', 'PUBLIC_BASE_URL',
        'MEDIA_LINK_SECRET', 'PHONE_SALT')
PAY = ('WXPAY_MCHID', 'WXPAY_APPID', 'WXPAY_API_V3_KEY',
       'WXPAY_CERT_SERIAL', 'WXPAY_PRIVATE_KEY_PATH', 'WXPAY_NOTIFY_URL')


def _present(value):
    return bool(value and value.strip() and '<' not in value and '>' not in value)


def _file(path, loader):
    if not _present(path):
        return '缺少'
    try:
        info = os.stat(path)
        if not stat.S_ISREG(info.st_mode) or stat.S_IMODE(info.st_mode) != 0o600:
            return '不对（文件权限应为 600）'
        with open(path, 'rb') as handle:
            loader(handle.read())
    except Exception:
        return '不对（文件不可读或格式不正确）'
    return '通过'


def _private_key(data):
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    key = serialization.load_pem_private_key(data, password=None)
    if not isinstance(key, rsa.RSAPrivateKey):
        raise ValueError('RSA required')


def _public_key(data):
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    key = serialization.load_pem_public_key(data)
    if not isinstance(key, rsa.RSAPublicKey):
        raise ValueError('RSA required')


def _certificate(data):
    from cryptography import x509
    from cryptography.hazmat.primitives.asymmetric import rsa
    cert = x509.load_pem_x509_certificate(data)
    if not isinstance(cert.public_key(), rsa.RSAPublicKey):
        raise ValueError('RSA required')


def _notify_url(value):
    if not _present(value):
        return '缺少'
    try:
        parsed = urlsplit(value)
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or
                parsed.path != '/api/payments/notify' or parsed.query or parsed.fragment):
            return '不对（须为 HTTPS 且路径为 /api/payments/notify）'
    except ValueError:
        return '不对（地址格式不正确）'
    return '通过'


def _public_url(value):
    if not _present(value):
        return '缺少'
    try:
        parsed = urlsplit(value)
        if parsed.scheme == 'https' and parsed.hostname and not parsed.username and not parsed.password:
            return '通过'
    except ValueError:
        pass
    return '不对（须为 HTTPS 地址）'


def _ping(url):
    request = urllib.request.Request(url, data=b'{}',
                                     headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return '通过' if response.status == 400 else '不对（预期 HTTP 400）'
    except urllib.error.HTTPError as exc:
        return '通过' if exc.code == 400 else '不对（预期 HTTP 400）'
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        return '不对（回调不可达）'


def _live_test_template():
    """Read the selected deployment database; never expose row or connection values."""
    try:
        import load_seed
        db = load_seed.open_database()
        return any(row.get('testOnly') is True and row.get('onSale') is True
                   for row in db.list('templates'))
    except Exception:
        return False


def check(values=None, ping=False):
    """Return ordered (name, status) pairs. Never include supplied values."""
    values = os.environ if values is None else values
    result = []

    def add(name, status):
        result.append((name, status))

    for name in CORE + PAY:
        add(name, '通过' if _present(values.get(name)) else '缺少')
    provider = values.get('PAYMENT_PROVIDER', '').strip().lower()
    add('PAYMENT_PROVIDER 类型', '通过' if provider == 'wechat' else '不对（部署应使用 wechat）')
    add('ENV 类型', '通过' if values.get('ENV') == 'production' else '不对（部署应使用 production）')
    database = values.get('DATABASE_URL', '')
    add('DATABASE_URL 类型', '通过' if _present(database) and
        database.startswith(('postgres://', 'postgresql://')) else '不对（须为 PostgreSQL 地址）')
    key = values.get('WXPAY_API_V3_KEY', '')
    add('WXPAY_API_V3_KEY 长度', '通过' if _present(key) and len(key.encode('utf-8')) == 32 else '不对（须为 32 字节）')
    add('WXPAY_NOTIFY_URL 格式', _notify_url(values.get('WXPAY_NOTIFY_URL', '')))
    add('PUBLIC_BASE_URL 格式', _public_url(values.get('PUBLIC_BASE_URL', '')))
    add('WXPAY_APPID 与 WECHAT_APP_ID', '通过' if _present(values.get('WECHAT_APP_ID')) and
        values.get('WXPAY_APPID') == values.get('WECHAT_APP_ID') else '不对（必须一致）')

    try:
        import cryptography  # noqa: F401
    except ImportError:
        add('cryptography', '缺少')
    else:
        add('WXPAY_PRIVATE_KEY_PATH 文件', _file(values.get('WXPAY_PRIVATE_KEY_PATH'), _private_key))
        public_path = values.get('WXPAY_PLATFORM_PUBLIC_KEY_PATH')
        cert_path = values.get('WXPAY_PLATFORM_CERT_PATH')
        if _present(public_path) or not _present(cert_path):
            add('WXPAY_PLATFORM_PUBLIC_KEY_PATH 文件', _file(public_path, _public_key))
            add('WXPAY_PLATFORM_PUBLIC_KEY_ID', '通过' if _present(values.get('WXPAY_PLATFORM_PUBLIC_KEY_ID')) else '缺少')
        else:
            add('WXPAY_PLATFORM_CERT_PATH 文件', _file(cert_path, _certificate))

    if ping:
        add('回调公网探测', _ping(values['WXPAY_NOTIFY_URL']) if _notify_url(values.get('WXPAY_NOTIFY_URL', '')) == '通过'
            else '不对（先修正回调地址）')
    if values.get('ENV') == 'production' and provider == 'wechat' and _live_test_template():
        add('提醒', '测试款仍在上架')
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description='检查部署配置，不显示任何配置值')
    parser.add_argument('--ping', action='store_true', help='向 HTTPS 回调发送无签名请求，预期 HTTP 400')
    args = parser.parse_args(argv)
    results = check(ping=args.ping)
    for name, status in results:
        print(f'{name}：{status}')
    return 0 if all(status == '通过' or (name, status) == ('提醒', '测试款仍在上架') for name, status in results) else 1


if __name__ == '__main__':
    sys.exit(main())
