# 微信支付部署准备

安装后端依赖：`python3 -m pip install -r server/requirements-postgres.txt`（其中会读取 `server/requirements.txt` 安装 `cryptography`）。

服务端配置 `PAYMENT_PROVIDER=wechat`，并设置 `WXPAY_MCHID`、`WXPAY_APPID`、`WXPAY_API_V3_KEY`、`WXPAY_CERT_SERIAL`、`WXPAY_PRIVATE_KEY_PATH`、`WXPAY_NOTIFY_URL`。私钥文件只放在服务器受限权限目录中，环境变量填写绝对路径，不提交文件。验签再配置 `WXPAY_PLATFORM_PUBLIC_KEY_PATH` 和 `WXPAY_PLATFORM_PUBLIC_KEY_ID`；若使用平台证书，改配 `WXPAY_PLATFORM_CERT_PATH`。`WXPAY_NOTIFY_URL` 使用公网 HTTPS 地址，商户平台也配置同一个回调地址，指向 `/api/payments/notify`。

上线前自检：确认环境变量完整且启动校验通过；确认 HTTPS 回调可从微信支付平台访问；用负责人掌握的测试商户资料核对 APPID、商户号、证书序列号；由负责人在真实环境用一笔小额订单完成付款和退款，核对订单状态及重复回调处理。不要将密钥、回调原文或个人信息写入日志与仓库。
