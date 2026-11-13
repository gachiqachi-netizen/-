# C7a 交付报告

分支：agent/C7a-checkout　最后一个代码提交：b302f3f

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪 |
|---|---|---|
| 勾选只有一个，贴着提交按钮；没有第二次确认弹层 | 做了 | `miniprogram/pages/order/order.wxml`、`order.js`；69af79a |
| 金额只显示报价数（toHand）；运费和手工费按 catalog pricing 算 | 做了配置计价和提交前服务端复核 | `order.js::calculate`、`submit`；5fbc7ad |
| 改价弹层“按新价格提交”后要用户自己再点提交 | 做了；初次改价及提交时改价均先关闭弹层，再由用户点提交 | `order.js::acceptPrice`；5fbc7ad |
| 提交时没登录：`auth.goLogin({ type: 'submitOrder' })`，回来自动提交 | 做了 | `order.js::submit`；`order.test.js`；5fbc7ad |
| 地址、手串摘要、材料、穿绳、送礼、金额和底部栏 | 做了 | `order.wxml`、`order.wxss`；69af79a |
| 送礼弹层、穿绳弹层、改价弹层、提交中和材料下架 | 做了 | `order.js`、`order.wxml`；69af79a、b302f3f |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 默认地址、无地址、微信地址和手动填写 | 代码完成，待视觉验收 | 需要负责人在开发者工具看：`pages/order/order`，对照稿 s46 |
| 一处勾选贴着提交按钮；未勾选阻止提交，无二次确认弹窗 | 自动测试通过，待视觉验收 | `miniprogram/tests/order.test.js`；`material-safety.test.js::safety notice stays visible and unchecked agreement blocks submission`；需要负责人在开发者工具看：`pages/order/order`，对照稿 s46 |
| 长度偏差提示和材料安全提示 | 自动测试通过，待视觉验收 | `material-safety.test.js::short bracelet and safety warning render near the single submit agreement`；需要负责人在开发者工具看：`pages/order/order`，对照稿 s47 |
| 礼盒、贺卡 50 字、隐藏价格及穿绳弹层 | 代码完成，待视觉验收 | `order.wxml` 的 `maxlength="50"` 与礼物、穿绳弹层；需要负责人在开发者工具看：`pages/order/order`，对照稿 s49 |
| 改价、下架、目录失联、并发刷新 | 自动测试通过，待视觉验收 | `catalog-refresh.test.js::进入下单强制刷新，改价列明并确认，取消保持禁用`、`::材料下架不可确认，目录失联不可下单`、`::旧页面请求不能覆盖新进入页面的报价`；需要负责人在开发者工具看：`pages/order/order`，对照稿 s50 |
| 提交成功、幂等、登录回来自动提交 | 自动测试通过，待跨页验收 | `order.test.js` 的同一次请求只创建一单、`continueAfterLogin` 自动调用页面 `submit` 断言；需要负责人在开发者工具看：`pages/order/order`，对照稿 s52 |
| 运费和手工费按 catalog pricing；不包邮门槛 `null` | 自动测试通过 | `order.test.js` 中通过 `loadCatalog` 验证默认 41.00、不收手工费 26.00、不包邮仍收 8.00 运费；提交的 `confirmedQuote.totalFen` 与底部金额一致 |

## 3. 改了的文件
`git diff --stat origin/integration/2026-11...HEAD`（更新本报告前）：
```
 docs/reports/C7a.md                       |  46 +++++
 miniprogram/pages/order/order.js          | 287 ++++++++++++++++++++++--------
 miniprogram/pages/order/order.json        |  10 +-
 miniprogram/pages/order/order.wxml        |  91 +++++++---
 miniprogram/pages/order/order.wxss        |  45 ++++-
 miniprogram/tests/catalog-refresh.test.js |   2 +-
 miniprogram/tests/material-safety.test.js |  40 +++--
 miniprogram/tests/order.test.js           | 110 +++++++++---
 8 files changed, 484 insertions(+), 147 deletions(-)
```
三个测试文件的超卡片范围改动，分别经总提示词的旧期望值许可及负责人对 `order.test.js`、`material-safety.test.js` 的明确授权。

## 4. 测试
- 后端开工前 555 项（首次基线因并行环境 HTTP 超时，`Ran 555 tests in 172.934s`、`FAILED (errors=8, skipped=7)`）；最终 555 项。
- 小程序开工前 168 项 → 现在 168 项。
- `python3 -m unittest discover -s server/tests`：`Ran 555 tests in 122.621s`、`OK (skipped=7)`。
- `node --test miniprogram/tests/*.test.js`：`tests 168`、`pass 168`、`fail 0`。
- `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `order.test.js`：删除旧“尺寸二次确认弹窗”相关断言，因为本卡取消此行为；保留价格复核和重复提交只生成一单的断言。旧改价期望是 `error` 含“更新”，新期望是 `sheet='price'`、合计更新为 `53.00` 且用户关闭弹层后再次点提交；旧未登录期望是 `needLogin=true` 后手动点登录，新期望是 `goLogin({type:'submitOrder'})` 并自动续提交；旧离线期望显示原异常“离线”，新期望显示统一网络提示。新增单勾选、未勾选阻止提交、无二次弹窗、登录续提交、同次点击幂等及三种 catalog pricing 的检查。
- `material-safety.test.js`：前两条测试一行未动。旧两条分别断言安全/尺寸 `showModal`、弹窗文字、取消/接受结果；新两条检查 `materials.safetyLines` 生成的文字、页面材料安全文字、贴提交按钮的勾选行、未勾选阻止提交、短手串长度提示。经负责人授权，删除旧二次确认弹窗断言。
- `catalog-refresh.test.js`：只改一个期望来源：旧 `modal.content`，新 `p.data.quoteChanges[0]`；仍断言同样的 `3.00 → ¥5.00` 改价明细。其余断言未动。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：
```
b302f3f C7a: 保留目录刷新与安全提示交互
d2615b0 C7a: 更新安全提示与长度提醒的旧测试
053d28b C7a: 记录材料安全旧测试阻塞
5fbc7ad C7a: 验证单勾选续提交与配置计价
df1dde9 C7a: 记录旧测试与新交互冲突
69af79a C7a: 重做确认订单与登录续提交
3114fc2 C7a: 开工
```
`rg -n '#[0-9a-fA-F]{3,8}\\b|rgba?\\(' miniprogram/pages/order/*.wxss`：无输出。
`rg -n 'new URL|URLSearchParams' miniprogram --glob '*.js'`：无输出。
`git diff --check origin/integration/2026-11...HEAD`：无输出。
`git merge origin/integration/2026-11`：`Already up to date.`。

## 6. 没做 / 没验证 / 偏离卡片
- 未在微信开发者工具或真机验证；页面截图需要负责人查看上述路径和屏号。
- 支付步骤由 C7b 卡接续；本卡提交成功进入订单详情。
- 材料安全提示由当前材料数据在本页弹层展示；公开条款页目前没有“材料安全说明”类型。

## 7. 审核修改（打回后才有）
无。
