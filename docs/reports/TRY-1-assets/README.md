# TRY-1 交付记录

- 分支：`agent/TRY-1-photo-tryon`，基于 `origin/integration/2026-11`。
- 完成：手腕椭圆按珠子实际总长与直径排布；Canvas 2D 分层绘制模特图、后排珠、抠图、阴影和前排实拍珠；横向滑动旋转；默认模特手入口、切换、失败重试、保存相册；旧 `photo`、`model`、`ar` 代码保留，后两种入口隐藏。
- 卡顿修复：组件按 `src` 缓存 Canvas Image 的加载 Promise 和解码结果；旋转沿用缓存，只重画；`requestAnimationFrame` 合并连续的重画请求。自动测试验证连续 10 次 `spin` 更新每个 `src` 只触发一次图片加载，且只安排一帧。
- 模特数据格式样例：`tools/hand-tracker/tryon-hands.example.json`。正式模特照片和正式 `hands.json` 尚未提供。
- 测试素材：`light-test-hand.jpg`、`warm-test-hand.jpg` 与对应透明抠图、缩略图均为本地生成的纯色示意图，无网上素材。珠子和吊坠截图素材也仅在本机生成，无网上素材。
- 开发者工具验收：在微信开发者工具 2.02.2611192 Nightly 的 iPhone 12/13 mini 模拟器（375 CSS px）中实际打开 `features/tryon/tryon`。截图为 `01-21x8mm.png`、`02-21x8mm-spin90.png`、`03-17x10mm.png`、`04-pendant.png`。前两张使用同一条 21 颗 8mm 手串，其中一颗是强调色，`spin` 分别为 0 和 π/2；第三张为 17 颗 10mm；第四张为 20 颗 8mm 加一颗 12mm 吊坠。截图使用测试示意素材，不代表正式商品视觉验收。
- 本机配置（未提交）：`/tmp/try1-models/tryon-hands/v1/` 放临时 `hands.json`、手图、抠图、缩略图、珠图；后端用 `PORT=8801 MODELS_DIR=/tmp/try1-models python3 server/app.py` 启动；`miniprogram/config.local.js` 的 develop 环境设 `apiBase: 'http://127.0.0.1:8801'`、`modelBase: 'http://127.0.0.1:8801/models'`。开发者工具的项目配置 `urlCheck: false`，控制台显示未校验合法域名。四种珠序列在本地调试控制台用页面 `setData` 注入，仅用于验收截图。
- 自动测试：服务端 `python3 -m unittest discover -s server/tests`、小程序 `node --test miniprogram/tests/*.test.js`、`python3 kb/validate.py`，以及 `python3 tools/check-ui.py`。
