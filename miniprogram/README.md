# 微信小程序前端开发版

微信开发者工具导入本目录。本地后端使用 8801 端口；开发者工具自动使用 `127.0.0.1`，手机真机按 `config.local.example.js` 创建被忽略的 `config.local.js`，填写电脑局域网地址。体验版和正式版只接受 `config.js` 中的 HTTPS 地址。

当前已实现微信/开发登录、设备草稿与云端设计、目录、AI 配、拍照识别、编辑器、照片/AR 试戴验证、分享快照、待支付订单和订单详情。3D 与试戴仍是开发效果，真实支付、退款、物流和供应商履约尚未接入。隐私弹窗已经接入代码，公众平台隐私保护指引和 iOS/Android 真机验收仍必须完成。

本地启动：

```sh
PORT=8801 ADMIN_TOKEN=local-dev-only DEV_LOGIN=1 python3 server/app.py
```

旧 H5 的 `/api/orders` 默认关闭；如需单独演示必须显式设置 `DEMO_ORDERS=1`，它不代表小程序正式交易链路。
