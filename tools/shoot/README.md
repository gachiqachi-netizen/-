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
SHOOT_ADMIN_TOKEN=local-dev-only node tools/shoot/shoot.js --out docs/reports/shots/T2 --only home,workbench --timing
```

`--timing` 会先清除模拟器本机缓存，重新写入演示登录和作品，再分别测冷启动与有缓存打开；从打开页面到加载完成的时间写入输出目录的 `timing.md`。没有加载完成的页面会标“未加载完”，不会默默截图。`SHOOT_BASE_URL` 可将截图服务改到其他本地端口，例如 `http://127.0.0.1:8892`。

页面第一屏真实内容渲染后调用 `setData({ ready: true })`；每次重新加载开始时先设 `ready: false`。脚本最多轮询 10 秒。尚未加 `ready` 的旧页面，会等待 `.c-skeleton` 消失；原本没有骨架的旧页面保留短暂渲染等待。截图前检查 `NaN`、`undefined`、`¥0.00`（有零元商品时除外）和“0 种”，在终端显示红色警告，并写入 `result.json`。

`--only order-detail` 会截所有订单详情状态。页面清单、路径、参数和前置操作见 [pages.json](pages.json)。脚本先通过开发接口登录测试用户，用现有接口建立模板作品、未支付订单、运输中订单、已签收订单、售后和评价，再交给 `miniprogram-automator` 导航和截图。模拟付款不会扣款。图片输出为 390×844 PNG；`result.json` 记录各页成功与失败及总耗时，任一页失败时进程返回非零退出码。每张图片超过 300KB 时视为失败。

## T3 全状态截图

服务仍按上面的临时数据目录启动；`SHOOT_BASE_URL` 指定造数接口和小程序请求的上游地址，避免占用的 8801 指向另一套数据。运行 `SHOOT_ADMIN_TOKEN=local-dev-only node tools/shoot/states.js --out docs/reports/shots/T3`。`--only home,my-orders` 可选页，`--state error` 可只重试一个状态；重试结果会合并进同目录 `result.json`。状态清单在 `pages.json` 的 `states` 字段。脚本用开发版接口造正常数据，同时启动独立的临时空数据服务；工作台和手串详情的空态清掉本地作品，其他页面使用空数据服务并清空用于渲染的数据。错误状态由临时本地代理返回 HTTP 500，未登录状态删本地会话，加载中状态由代理延迟 15 秒后返回错误。脚本按正常、空、错误、未登录、加载中的顺序截图，避免慢网请求拖住后续正常态。每次截图前重新打开目标页；结束时关闭代理和空数据服务。每张图小于 300KB，结果写在同目录 `result.json`。请按 `result.json` 的路径核对截图；页面不存在独立状态时在交付表写原因，不能用另一页代替。

开发者工具的设备型号由本机模拟器选择决定。运行前在模拟器底部的机型菜单选 **iPhone 12/13 (Pro)（390×844）**；脚本会核对型号与逻辑尺寸，再输出 390×844 PNG。打开脚本前如有别的自动化会话正在使用开发者工具，请先结束那次会话。
