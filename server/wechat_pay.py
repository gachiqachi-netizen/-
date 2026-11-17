"""微信支付 API v3：签名、JSAPI、回调和退款。只在 wechat 通道导入密码库。"""
import base64
import json
import os
import secrets
import time
import urllib.request


def validate_config():
    required = ("WXPAY_MCHID", "WXPAY_APPID", "WXPAY_API_V3_KEY", "WXPAY_CERT_SERIAL",
                "WXPAY_PRIVATE_KEY_PATH", "WXPAY_NOTIFY_URL")
    missing = [name for name in required if not os.environ.get(name)]
    if not (os.environ.get("WXPAY_PLATFORM_PUBLIC_KEY_PATH") and
            os.environ.get("WXPAY_PLATFORM_PUBLIC_KEY_ID")) and not os.environ.get("WXPAY_PLATFORM_CERT_PATH"):
        missing.append("WXPAY_PLATFORM_PUBLIC_KEY_PATH + WXPAY_PLATFORM_PUBLIC_KEY_ID 或 WXPAY_PLATFORM_CERT_PATH")
    if missing:
        raise SystemExit("微信支付缺少环境变量：" + ", ".join(missing))
    if not os.environ["WXPAY_NOTIFY_URL"].startswith("https://"):
        raise SystemExit("WXPAY_NOTIFY_URL 必须是 https 地址")
    if os.environ.get("WECHAT_APP_ID") and os.environ["WECHAT_APP_ID"] != os.environ["WXPAY_APPID"]:
        raise SystemExit("WXPAY_APPID 必须与微信登录的 WECHAT_APP_ID 一致")
    try:
        import cryptography  # noqa: F401
    except ImportError:
        raise SystemExit("缺少 cryptography，请 pip install -r server/requirements.txt")


def _private_key():
    from cryptography.hazmat.primitives import serialization
    with open(os.environ["WXPAY_PRIVATE_KEY_PATH"], "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def _sign(message):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    return base64.b64encode(_private_key().sign(message.encode(), padding.PKCS1v15(), hashes.SHA256())).decode()


def _request(method, path, body):
    raw = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
    stamp, nonce = str(int(time.time())), secrets.token_hex(16)
    signature = _sign("\n".join((method, path, stamp, nonce, raw, "")))
    authorization = ('WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",timestamp="%s",'
                     'serial_no="%s",signature="%s"' %
                     (os.environ["WXPAY_MCHID"], nonce, stamp, os.environ["WXPAY_CERT_SERIAL"], signature))
    request = urllib.request.Request("https://api.mch.weixin.qq.com" + path, raw.encode(),
                                     {"Authorization": authorization, "Content-Type": "application/json",
                                      "Accept": "application/json"}, method=method)
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read(65536))


def jsapi(order_no, amount_fen, openid):
    if not isinstance(amount_fen, int) or isinstance(amount_fen, bool) or amount_fen < 1:
        raise ValueError("支付金额必须是正整数分")
    result = _request("POST", "/v3/pay/transactions/jsapi", {
        "appid": os.environ["WXPAY_APPID"], "mchid": os.environ["WXPAY_MCHID"],
        "description": "串个珠订单", "out_trade_no": order_no,
        "notify_url": os.environ["WXPAY_NOTIFY_URL"], "amount": {"total": amount_fen, "currency": "CNY"},
        "payer": {"openid": openid}})
    return result["prepay_id"]


def payment_params(prepay_id):
    stamp, nonce = str(int(time.time())), secrets.token_hex(16)
    package = "prepay_id=" + prepay_id
    return {"timeStamp": stamp, "nonceStr": nonce, "package": package, "signType": "RSA",
            "paySign": _sign("\n".join((os.environ["WXPAY_APPID"], stamp, nonce, package, "")))}


def _platform_key(serial):
    from cryptography import x509
    from cryptography.hazmat.primitives import serialization
    path = os.environ.get("WXPAY_PLATFORM_PUBLIC_KEY_PATH")
    if path:
        if serial != os.environ.get("WXPAY_PLATFORM_PUBLIC_KEY_ID"):
            raise ValueError("微信支付公钥编号不符")
        with open(path, "rb") as f:
            return serialization.load_pem_public_key(f.read())
    with open(os.environ["WXPAY_PLATFORM_CERT_PATH"], "rb") as f:
        cert = x509.load_pem_x509_certificate(f.read())
    if format(cert.serial_number, "X") != serial.upper():
        raise ValueError("微信支付平台证书序列号不符")
    return cert.public_key()


def decode_notify(headers, raw):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    def header(name):
        return headers.get(name) or headers.get(name.lower()) or ""
    stamp, nonce, serial, signature = (header("Wechatpay-" + name) for name in
                                      ("Timestamp", "Nonce", "Serial", "Signature"))
    if not all((stamp, nonce, serial, signature)) or abs(time.time() - int(stamp)) > 300:
        raise ValueError("微信支付回调头无效")
    message = stamp.encode() + b"\n" + nonce.encode() + b"\n" + raw + b"\n"
    _platform_key(serial).verify(base64.b64decode(signature), message, padding.PKCS1v15(), hashes.SHA256())
    outer = json.loads(raw)
    resource = outer["resource"]
    plaintext = AESGCM(os.environ["WXPAY_API_V3_KEY"].encode()).decrypt(
        resource["nonce"].encode(), base64.b64decode(resource["ciphertext"]),
        resource.get("associated_data", "").encode())
    return outer["id"], json.loads(plaintext)


def refund(order_no, refund_id, total_fen, refund_fen):
    return _request("POST", "/v3/refund/domestic/refunds", {
        "out_trade_no": order_no, "out_refund_no": refund_id, "reason": "售后退款",
        "notify_url": os.environ["WXPAY_NOTIFY_URL"],
        "amount": {"refund": refund_fen, "total": total_fen, "currency": "CNY"}})
