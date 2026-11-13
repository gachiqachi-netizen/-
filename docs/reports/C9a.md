# C9a 交付报告

分支：agent/C9a-after-sale-apply　最后一个功能提交：4cca9d8

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 选择售后类型：只列后端允许的类型 | 做了 | `server/routes/after_sale_options.py:8`；`miniprogram/features/after-sale/type.js:6` |
| 填写申请：原因、照片、说明、金额、电话、新手围 | 做了 | `miniprogram/features/after-sale/apply.js:10`、`:29`、`:54` |
| 申请成功进入售后详情，返回订单详情 | 做了 | 类型页和申请页均用 `wx.redirectTo`；`miniprogram/tests/after-sale-apply.test.js` |
| 用户授权补充后端 options 和申请字段 | 做了 | `b43e3d1`、`1838acf` |
| 按 0.2 节交易卡片版式 | 做了代码，未做视觉验收 | `4cca9d8`；需要负责人在开发者工具看 |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 1. 已签收三种类型、制作中仅退款 | 逻辑通过；未截屏 | `server/tests/test_after_sale_options.py::AfterSaleOptionsTests.test_options_follow_order_stage_and_backend_amount`；需要负责人在开发者工具看：`features/after-sale/type`，对照稿 s65 |
| 2. 未选原因按钮不可点，选后可提交 | 已实现；未截屏 | `miniprogram/tests/after-sale-apply.test.js`；需要负责人在开发者工具看：`features/after-sale/apply`，对照稿 s66 |
| 3. 质量问题无照片显示红字 | 已实现；未截屏 | `miniprogram/tests/after-sale-apply.test.js`；需要负责人在开发者工具看：`features/after-sale/apply`，对照稿 s66 |
| 4. 成功进售后详情，返回订单详情 | 跳转链已实现；详情由 C9b 负责 | `miniprogram/tests/after-sale-apply.test.js`；需要负责人在开发者工具看：`features/after-sale/apply`，对照稿 s66 |
| 5. B5 没做时订单详情只显示联系客服 | 不适用：B5 已合并；订单详情不在本卡范围 | 未修改订单详情 |
| 6. 09 清单 11、15、18、G1–G8 | 11、15 有代码和测试；视觉项待验 | `miniprogram/tests/after-sale-apply.test.js`；需要负责人在开发者工具看：`features/after-sale/type` 和 `features/after-sale/apply`，对照稿 s65、s66 |

## 3. 改了的文件

```text
 miniprogram/features/after-sale/apply.js   |  72 +++++++++++++++-
 miniprogram/features/after-sale/apply.wxml |  24 +++++-
 miniprogram/features/after-sale/apply.wxss |  21 ++++-
 miniprogram/features/after-sale/type.js    |  31 ++++++-
 miniprogram/features/after-sale/type.wxml  |  12 ++-
 miniprogram/features/after-sale/type.wxss  |  13 ++-
 miniprogram/tests/after-sale-apply.test.js |  39 +++++++++
 server/commerce.py                         |   3 +
 server/routes/after_sale_options.py        |  23 +++++
 server/tests/test_after_sale_options.py    | 130 +++++++++++++++++++++++++++++
 server/user_api.py                         |  15 ++++
 11 files changed, 371 insertions(+), 12 deletions(-)
```

## 4. 测试

- 开工前后端全量：超过 3 分钟，按规则中止；数量未取得。新增 6 项后，最终 569 项，因此开工前数量按差额推算为 563 项。第一次交付前全量有 1 项 HTTP 超时；复测 `Ran 569 tests in 143.523s`、`OK (skipped=7)`。
- 开工前小程序全量：旧 `ar-model-cache.test.js` 计时测试失败，215 项。交付前曾在并行负载下复现同一失败；最终 `tests 216`、`pass 216`、`fail 0`。
- `python3 -m unittest discover -s server/tests -p test_after_sale_options.py`：Ran 6 tests，OK。
- `python3 -m unittest discover -s server/tests -p test_after_sale_customer.py`：Ran 18 tests，OK。
- `node --test miniprogram/tests/after-sale-apply.test.js`：tests 1，pass 1，fail 0。
- `python3 kb/validate.py`：已填 200/200 种，有问题 0 条，缺 0 种。

测试数：后端 563（根据新增数推算，开工前运行超时）→ 569；小程序 215 → 216。

新增测试：`AfterSaleOptionsTests` 的路由认证、阶段与金额、归属、照片和电话存储；`AfterSaleOptionsHTTPTests` 的 200/404、非法照片和电话 400；`after-sale-apply.test.js` 的后端选项、照片必填和提交跳转。未删除或放宽原测试。

## 5. 自查

- `git log --oneline origin/integration/2026-11..HEAD`：所有提交均以 `C9a:` 开头。
- `git diff --check`：无输出。
- `grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(' miniprogram/features/after-sale/{type,apply}.wxss`：无输出。
- `grep -rnE 'new URL|URLSearchParams' miniprogram --include='*.js'`：无输出。
- 新接口：`GET /api/my/orders/{no}/after-sale-options`，须用户登录且只能查本人订单；返回 `types`，每项有 `type`、`label`、整数分 `refundFen`、`reasons`；他人订单 404，不可申请时空数组。
- 申请接口：`POST /api/my/orders/{no}/after-sales`，须用户登录；新增可选 `photoIds`、`contactPhone`，校验后保存。金额仍由后端计算，单位为分。
- `server/tests/fixtures/size_rule_cases.json` 未改；未加依赖、未改数据库文件。

## 6. 没做 / 没验证 / 偏离卡片

- 经负责人同意新增 `server/routes/after_sale_options.py`、`server/tests/test_after_sale_options.py`，并改 `server/user_api.py` 的 `request_after_sale`；`server/commerce.py` 只在 `create_after_sale` 记录构造处原样存入 `photoIds` 和 `contactPhone`。
- 未在微信开发者工具验证 s65、s66 的视觉和交互，未编造截图。
- 售后政策说明文案目前来自 04 文档。负责人指定的 options 响应只含类型、金额、原因，没有政策文案字段，因此无法从后端读取政策说明；规则确认后需补接口和页面。
- 售后详情仍是 C9b 空壳；申请成功后已跳转其路由，详情内容待 C9b。
- 全量测试首次运行中的后端 HTTP 超时和小程序旧 AR 计时测试失败，在复测中均未复现；最终三条全量均通过。

## 7. 审核修改

无。
