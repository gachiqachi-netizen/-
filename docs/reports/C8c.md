# C8c 交付报告

分支：agent/C8c-logistics　最后一个代码提交：3bbabdf

## 1. 步骤
| 卡上的步骤（照抄编号和第一句） | 做了 / 没做 | 在哪 |
|---|---|---|
| 物流详情和发货前改地址 | 做了，改地址表单放在本卡允许的物流页目录内 | `miniprogram/features/logistics/logistics.js`、`.wxml`；727f8f6 |
| B-13 没合并时只显示单号和复制 | 做了；仅当订单物流对象有 `traces` 时展示轨迹 | `logistics.js::load`、`logistics.wxml`；727f8f6 |
| 承运方、单号、复制、送到、时间倒序轨迹、下拉刷新 | 做了 | `logistics.js`、`logistics.wxml`；727f8f6 |
| 发货前改地址；已发货不开放 | 做了页面内表单，按订单 `allowedActions` 的 `edit_address` 判断 | `logistics.js::editAddress`、`saveAddress`；727f8f6 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 物流详情和稿 63 并排；复制提示“单号已复制” | 功能测试通过，待视觉验收 | `logistics.test.js::without tracking provider only waybill is visible and copy gives feedback`；需要负责人在开发者工具看：`features/logistics/logistics?no=<订单号>`，对照稿 s63 |
| B-13 没做：只有单号和“复制单号后可在快递官网查询” | 功能测试通过，待视觉验收 | `logistics.test.js::without tracking provider only waybill is visible and copy gives feedback`；需要负责人在开发者工具看：`features/logistics/logistics?no=<订单号>`，对照稿 s63 |
| 制作中的订单改地址，保存后提示“地址已改” | 功能测试通过，待跨页验收 | `logistics.test.js::only edit_address permission allows pre-shipment address update`；需要负责人在开发者工具看：`features/logistics/logistics?no=<订单号>&mode=address`，对照稿 s64 |
| 已发货订单没有“改 ›” | 功能测试通过，待视觉验收 | `logistics.test.js::shipped order never opens address editor`；需要负责人在开发者工具看：`features/logistics/logistics?no=<订单号>`，对照稿 s63 |
| 09 清单 13、18、G1–G8 | 部分完成 | 单号可复制和发货前改地址有上述测试；跨页入口及设备表现需要负责人验收 |

## 3. 改了的文件
`git diff --stat origin/integration/2026-11...HEAD`（提交本报告前）：
```
 miniprogram/features/logistics/logistics.js      | 94 +++++++++++++++++++++++-
 miniprogram/features/logistics/logistics.json    |  7 +-
 miniprogram/features/logistics/logistics.test.js | 64 ++++++++++++++++
 miniprogram/features/logistics/logistics.wxml    | 32 +++++++-
 miniprogram/features/logistics/logistics.wxss    | 24 +++++-
 5 files changed, 214 insertions(+), 7 deletions(-)
```

## 4. 测试
- 后端开工前 563 项 → 现在 563 项；小程序开工前 215 项 → 现在 218 项。
- `python3 -m unittest discover -s server/tests`：两次在 180 秒上限被中止，未产生 `Ran/OK` 汇总；详细模式停在 `test_handler_template_expand_work_order_and_quality_gate`。`python3 -m unittest discover -s server/tests -p test_production_workbench.py`：`Ran 8 tests in 10.940s`、`OK`。
- `node --test miniprogram/tests/*.test.js`：审核后重跑 `tests 218`、`pass 218`、`fail 0`；新增的物流页 3 项已被此命令发现。
- `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `node --test miniprogram/tests/logistics-page.test.js`：3 项通过。`without tracking provider only waybill is visible and copy gives feedback` 验证无轨迹时单号复制；`only edit_address permission allows pre-shipment address update` 验证发货前改地址；`shipped order never opens address editor` 验证已发货禁止编辑。
- 未改旧测试期望；后端发现用例数由 `unittest` discover 的 `countTestCases()` 得到，未将限时中止误写成通过。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：
```
727f8f6 C8c: 实现物流详情和发货前改地址
dd0af83 C8c: 开工
```
`rg -n '#[0-9a-fA-F]{3,8}\\b|rgba?\\(' miniprogram/features/logistics/*.wxss`：无输出。
`rg -n 'new URL|URLSearchParams' miniprogram --glob '*.js'`：无输出。
`git diff --check origin/integration/2026-11...HEAD`：无输出。
`git merge origin/integration/2026-11`：`Already up to date.`。

## 6. 没做 / 没验证 / 偏离卡片
- 未在微信开发者工具或真机验收；截图需要负责人看上述页面和屏号。
- C8c 的“只能改”限于 `features/logistics/*`，订单详情的“收货 … 改 ›”入口和共享的 `address-edit` 订单模式未改；本页支持 `mode=address`，等对应页面卡接入。
- B-13 快递轨迹接口未合并，因此当前只显示已有的承运方、单号和复制提示；无真实快递轨迹验证。
- 后端全量测试在 3 分钟上限内未完成；卡住时最后显示 `test_handler_template_expand_work_order_and_quality_gate`，该文件单独 8 项通过。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 测试移到 `miniprogram/tests/logistics-page.test.js`，修正 `auth` 和页面模块的相对路径；`node --test miniprogram/tests/*.test.js` 实际运行 218 项，全部通过，包含新增 3 项。 | 3bbabdf |
