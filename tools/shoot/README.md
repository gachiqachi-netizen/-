# 小程序自动截图

只在 `tools/shoot/` 安装微信官方 `miniprogram-automator`。需要 Node 20 及以上、微信开发者工具和本地开发服务。

## 第一次配置

1. 微信开发者工具：**设置 → 安全设置 → 服务端口**，打开开关。导入 `miniprogram/`，本地设置里允许测试环境请求 `127.0.0.1`。服务端口未开时脚本会停止并提示这个路径。
2. macOS 默认 CLI：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`。安装在别处时设置 `WECHAT_DEVTOOLS_CLI=/实际路径/cli`。
3. 在仓库根目录运行 `npm install --prefix tools/shoot --no-package-lock`。
4. 用**临时数据目录**启动服务（另一个终端，保持运行）：

   ```bash
   mkdir -p /tmp/chuan-shoot-data
   PORT=8801 ADMIN_TOKEN=local-dev-only DEV_LOGIN=1 ENV=development PAYMENT_PROVIDER=mock DEMO_ORDERS=1 DATA_DIR=/tmp/chuan-shoot-data python3 server/app.py
   ```

   这个目录只放截图测试数据，不与日常后台数据混用。首次运行需要把相同的本地测试口令传给截图进程；不要把真实口令写入仓库。

## 运行

```bash
SHOOT_ADMIN_TOKEN=local-dev-only node tools/shoot/shoot.js --out docs/reports/shots/U4/before
SHOOT_ADMIN_TOKEN=local-dev-only node tools/shoot/shoot.js --out docs/reports/shots/U4/after --only order-confirm,order-detail
```

`--only order-detail` 会截所有订单详情状态。页面清单、路径、参数和前置操作见 [pages.json](pages.json)。脚本先通过开发接口登录测试用户，用现有接口建立模板作品、未支付订单、运输中订单、已签收订单、售后和评价，再交给 `miniprogram-automator` 导航和截图。模拟付款不会扣款。图片输出为 390×844 PNG；`result.json` 记录各页成功与失败及总耗时，任一页失败时进程返回非零退出码。每张图片超过 300KB 时视为失败。

开发者工具的设备型号由本机模拟器选择决定。运行前在模拟器底部的机型菜单选 **iPhone 12/13 (Pro)（390×844）**；脚本会核对型号与逻辑尺寸，再输出 390×844 PNG。打开脚本前如有别的自动化会话正在使用开发者工具，请先结束那次会话。
