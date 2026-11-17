# V7a 交付报告

分支：`agent/V7a-bracelet-tiers`　功能提交：`80db4a7`

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 位置 |
|---|---|---|
| 1. 组件只接受 `tier="s|m|l"` | 记录页完成；工作台托盘保留原 `size/mode` | `miniprogram/components/bracelet/index.js` |
| 2. 手串占边长 88%，组件画直角卡面色背景 | 做了；页面灰框去掉 | `components/bracelet/index.js`、相关页面 WXML/WXSS |
| 3. 渐变、高光、描边参数写入 JSON，小档单独一组 | 做了。微信运行时不能直接 require JSON，组件目录 JS 模块由同一 JSON 内容生成并由测试逐字段比对 | `server/tests/fixtures/bracelet_style.json`、`miniprogram/components/bracelet/style.js` |
| 4. `bracelet-thumb` 只调用 `c-bracelet tier="s"`，`cell`、`design-row` 改用组件 | 做了 | 对应组件 WXML |
| 5. 工作台托盘照旧，珠子画法读中大档参数 | 做了 | `components/bracelet/index.js` |
| 确认订单约 200rpx、顶端对齐、间距 32rpx；修复珠子缝隙 | 做了；复用 V2b 相切布局 | `pages/order/order.wxss`；`bracelet-tiers.test.js` |
| 冻结快照来源 | 做了；订单详情、售后详情、评价页均传 `designSnapshot.sequence`，不现查目录 | `features/order-detail/order-detail.wxml`、`features/after-sale/detail.js`、`features/review/review.js` |

## 2. 验收

| 验收项 | 结果 | 证据 |
|---|---|---|
| 三档尺寸、88% 占比、小档去描边且珠子放大 | 通过 | `miniprogram/tests/bracelet-tiers.test.js::三档尺寸和参数来自同一份样式文件` |
| 记录页只传 tier | 通过 | `bracelet-tiers.test.js::记录页只传 tier` |
| 中大档相切、无缝隙 | 通过 | `bracelet-tiers.test.js::中大档仍走相切排布` |
| 订单详情、售后详情、评价页冻结珠序及外观字段 | 通过 | `snapshot-thumbnails.test.js::订单详情、售后详情和评价都用冻结珠序，三处手串均有照片和颜色` |
| 微信组件实际加载、订单详情有手串 | 通过 | `shots/V7a/order-detail-pending.png`；修复前微信日志报 `style.json.js is not defined`，改为 JS 模块后截图显示珠子 |
| 九页截图 | 已截 9/9；视觉一致性仅对同一作品的页面确认 | `shots/V7a/result.json` 与下表。AI 配展示独立推荐方案；售后商品行在首屏下方，已补滚动截图。九页完全一致仍待核对。 |

### 截图对照表

| 页面 | 截图 | 核对结果 |
|---|---|---|
| 工作台 | <img src="shots/V7a/workbench.png" width="130" alt="workbench"> | 好运连连，19 颗 |
| 确认订单 | <img src="shots/V7a/order-confirm.png" width="130" alt="order-confirm">、[无弹层补图](shots/V7a/order-confirm-visible.png) | 好运连连；补图可见整行和 32rpx 间距 |
| 订单详情 | <img src="shots/V7a/order-detail-pending.png" width="130" alt="order-detail-pending"> | 好运连连；手串已显示 |
| 我的订单 | <img src="shots/V7a/my-orders.png" width="130" alt="my-orders"> | 好运连连；同一圈珠序 |
| 售后详情 | <img src="shots/V7a/after-sale-detail.png" width="130" alt="after-sale-detail">、[滚动补图](shots/V7a/after-sale-detail-product.png) | 好运连连；补图可见商品行 |
| 写评价 | <img src="shots/V7a/write-review.png" width="130" alt="write-review"> | 好运连连；同一圈珠序 |
| AI 配 | <img src="shots/V7a/ai-match.png" width="130" alt="ai-match"> | 推荐方案「薰衣草梦」，珠序不同；需在开发者工具核对同一作品场景 |
| 好友落地页 | <img src="shots/V7a/friend-landing.png" width="130" alt="friend-landing"> | 好运连连；同一圈珠序 |
| 分享海报 | <img src="shots/V7a/share-poster.png" width="130" alt="share-poster"> | 好运连连；同一圈珠序 |

## 3. 改了的文件

```text
 docs/reports/V7a.md                                | 126 +++++++++++++++++++++
 .../shots/V7a/after-sale-detail-product.png        | Bin 0 -> 47619 bytes
 docs/reports/shots/V7a/after-sale-detail.png       | Bin 0 -> 46001 bytes
 docs/reports/shots/V7a/ai-match.png                | Bin 0 -> 81264 bytes
 docs/reports/shots/V7a/friend-landing.png          | Bin 0 -> 77447 bytes
 docs/reports/shots/V7a/my-orders.png               | Bin 0 -> 77955 bytes
 docs/reports/shots/V7a/order-confirm-visible.png   | Bin 0 -> 64671 bytes
 docs/reports/shots/V7a/order-confirm.png           | Bin 0 -> 62922 bytes
 docs/reports/shots/V7a/order-detail-pending.png    | Bin 0 -> 47680 bytes
 docs/reports/shots/V7a/result.json                 |  79 +++++++++++++
 docs/reports/shots/V7a/share-poster.png            | Bin 0 -> 77351 bytes
 docs/reports/shots/V7a/workbench.png               | Bin 0 -> 115271 bytes
 docs/reports/shots/V7a/write-review.png            | Bin 0 -> 48583 bytes
 miniprogram/components/bracelet-thumb/index.wxml   |   5 +-
 miniprogram/components/bracelet-thumb/index.wxss   |   5 +-
 miniprogram/components/bracelet/index.js           |  47 +++++---
 miniprogram/components/bracelet/index.wxml         |   7 +-
 miniprogram/components/bracelet/index.wxss         |   2 +
 miniprogram/components/bracelet/style.js           |  31 +++++
 miniprogram/components/cell/index.json             |   2 +-
 miniprogram/components/cell/index.wxml             |   2 +-
 miniprogram/components/cell/index.wxss             |   1 -
 miniprogram/components/design-row/index.js         |   7 ++
 miniprogram/components/design-row/index.json       |   2 +-
 miniprogram/components/design-row/index.wxml       |   2 +-
 miniprogram/components/design-row/index.wxss       |   1 -
 miniprogram/features/after-sale/detail.json        |   2 +-
 miniprogram/features/after-sale/detail.wxml        |   2 +-
 miniprogram/features/after-sale/detail.wxss        |   2 +-
 .../features/order-detail/order-detail.json        |   2 +-
 .../features/order-detail/order-detail.wxml        |   2 +-
 .../features/order-detail/order-detail.wxss        |   2 +-
 miniprogram/features/orders/orders.json            |   2 +-
 miniprogram/features/orders/orders.wxml            |   2 +-
 miniprogram/features/orders/orders.wxss            |   6 +-
 miniprogram/features/review/review.js              |   2 +-
 miniprogram/features/review/review.json            |   2 +-
 miniprogram/features/review/review.wxml            |   2 +-
 miniprogram/features/review/review.wxss            |   2 +-
 miniprogram/features/shared/shared.wxml            |   2 +-
 miniprogram/features/shared/shared.wxss            |   2 +-
 miniprogram/pages/ai/ai.wxml                       |   2 +-
 miniprogram/pages/ai/ai.wxss                       |   2 +-
 miniprogram/pages/mine/mine.wxml                   |   2 +-
 miniprogram/pages/order/order.wxml                 |   2 +-
 miniprogram/pages/order/order.wxss                 |   5 +-
 miniprogram/pages/share/share.js                   |  24 ++--
 miniprogram/tests/bracelet-tiers.test.js           |  58 ++++++++++
 miniprogram/tests/snapshot-thumbnails.test.js      |  45 +++++++-
 server/tests/fixtures/bracelet_style.json          |  30 +++++
 50 files changed, 456 insertions(+), 67 deletions(-)
```

除报告与截图，均在卡片允许范围；`features/review/review.js` 的一行扩展经负责人本次明确同意。

## 4. 测试

- 后端：`python3 -m unittest discover -s server/tests` → `Ran 633 tests in 104.523s`，`OK (skipped=7)`。
- 小程序：`node --test miniprogram/tests/*.test.js` → `tests 320`，`pass 320`，`fail 0`。
- 知识库：`python3 kb/validate.py` → `已填 200/200 种，有问题 0 条，缺 0 种`。
- 测试数：后端 633 → 633；小程序 316 → 320。
- 新增快照测试检查三页都取冻结珠序、外观字段含照片和颜色、组件布局非空。原快照测试两处 WXML 标签期望从 `bracelet-thumb` 更新为 `c-bracelet tier="s"`，冻结字段断言未放宽。
- 初次小程序全量曾遇不相关的 AR 模型计时测试偶发失败；重跑全量 320/320 通过。

## 5. 自查

- `git log --oneline origin/integration/2026-11..HEAD`：提交均以 `V7a:` 开头。
- 改动的 WXSS 执行 `grep -nE "#[0-9a-fA-F]{3,8}\\b|rgba?\\("`：无输出。
- `grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js`：无输出。
- `python3 tools/check-ui.py` → `UI check: 42 violations, 0 new`。
- `git diff --check`：无输出。

## 6. 没做 / 没验证 / 偏离卡片

- 九页已用 `tools/shoot` 截图，并补了确认订单无遮挡和售后商品行的截图。AI 配脚本展示独立推荐方案，尚不能证明九页是同一条手串；需要负责人在开发者工具补核该场景。
- 确认订单的默认自动截图打开送礼弹层，另用同一脚本关闭弹层补图；截图脚本警告 `¥0.00`，这是送礼弹层的关闭礼盒价格显示，不影响手串图。
- 微信小程序运行时不支持直接 `require('./style.json')`：用 `style.js` 承载与 `bracelet_style.json` 完全一致的参数，由测试防漂移。此处为实际运行必要的实现偏离。
- 工作台托盘保留原 `size/mode/selected`；记录页只传 `tier`，未改变首页封面图和详情主图。

## 7. 审核修改

| 意见 | 修改 | 提交 |
|---|---|---|
| 负责人同意评价页一行改用冻结快照；并要求订单详情同源、三处非空 | 评价与订单详情均用 `designSnapshot.sequence`，加三处非空测试；修复微信 JSON 模块加载错误并重截九页 | `80db4a7` |
