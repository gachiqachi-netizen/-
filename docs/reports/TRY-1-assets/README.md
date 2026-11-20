# TRY-1 交付记录

- 分支：`agent/TRY-1-photo-tryon`，基于 `origin/integration/2026-11` 的 `31d8fcb`。
- 完成：手腕椭圆按珠子实际总长与直径排布；Canvas 2D 分层绘制模特图、后排珠、抠图、阴影和前排实拍珠；横向滑动旋转；默认模特手入口、切换、失败重试、保存相册；旧 `photo`、`model`、`ar` 代码保留，后两种入口隐藏。
- 示例清单：`tools/hand-tracker/tryon-hands.example.json`；正式 `hands.json` 与真实模特照片尚未提供。当前示例清单里的路径是部署格式示例，不代表服务器已有这些文件。
- 测试素材：`light-test-hand.jpg`、`warm-test-hand.jpg` 与对应透明抠图、缩略图均为本地生成的纯色示意图，无网上素材。
- 自动测试：服务端 745 项通过（10 项跳过）；小程序 405 项通过；知识库 202/202；`tools/check-ui.py` 40 项既有违规、0 项新增。
- 微信开发者工具：尚未打开并验证本页面，因此卡片要求的 375 宽四张开发者工具截图尚未完成，不能标记为“已通过”。需要为此 worktree 配置本地 `modelBase` 并把临时 `hands.json` 和示意图提供给本地 `/models/` 路径。此配置和图片部署不在本卡允许的改动文件内。
