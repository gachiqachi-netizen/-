# A5c 交付报告

分支：`agent/A5c-rewrist`　最后一个代码提交：`ad7e3f2`（本报告另行提交）

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 收到寄回后，后台在售后详情点“生成重串工单” | 做了 | `server/commerce.py::create_rework_order`、`server/routes/rework_orders.py`、`admin-web/src/pages/afterSales/detail.tsx` |
| 新工单关联原订单和售后单，带新手围，先复制原珠序 | 做了 | 重串工单存于售后记录的 `reworkOrder`，含 `orderNo`、`afterSaleNo`、`wrist` 和冻结原珠序；无新表 |
| 重串工单允许改珠序，必须备注并记操作记录；普通工单仍锁用料 | 做了 | `server/commerce.py::update_rework_order`；原 `_FORBIDDEN_WORK_ORDER_MUTATIONS` 未改 |
| 工单页显示手围、颗数、长度参考与线下沟通提示 | 做了 | `admin-web/src/pages/workOrders/detail.tsx`；尺寸参考调用现有 `build_design_snapshot` 中的 `plans.main_mm/target_for` |
| 走做单、质检、发货；不新增补退款 | 做了 | 重串工单独立工序、四项质检、质检通过后寄出；发货后售后完成；原订单金额字段不动 |

## 2. 验收

| 验收项 | 结果 | 证据 |
| --- | --- | --- |
| 仅改手围重串且已收到寄回可生成工单 | 通过 | `server/tests/test_rework_orders.py::ReworkOrderTests::test_only_received_rework_sale_can_create_order` |
| 收货后订单仍显示售后处理中 | 通过 | 同上断言 `customerStatus.code == after_sale_open`；`server/order_view.py` 只加 `received` |
| 小程序售后详情显示中文状态 | 通过 | `miniprogram/features/after-sale/detail-model.js:2,8` 从契约 `statusLabels.afterSaleStatus` 取中文；生成契约含 `received: 已收到寄回` |
| 可加、减、换珠，修改必须有备注及审计；普通工单不许改 | 通过 | `server/tests/test_rework_orders.py::ReworkOrderTests::test_rework_sequence_note_and_normal_order_lock` |
| 质检后才能发货，售后完成，金额不变 | 通过 | `server/tests/test_rework_orders.py::ReworkOrderTests::test_rework_requires_qc_before_shipping_and_completes_sale` |
| 权限不足返回 403 | 通过 | `server/tests/test_rework_orders.py::ReworkOrderTests::test_http_permissions`：做单角色不能生成，客服角色不能改珠序 |
| 后台按钮按权限显示，工单展示线下沟通文案 | 需手工看 | 需要负责人看：`/admin` 的售后详情和做单页；`npm run build` 通过 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`：

```text
admin-web/src/contract.ts                 |   6 +-
admin-web/src/pages/afterSales/detail.tsx |  29 ++++++
admin-web/src/pages/workOrders.tsx        |  19 ++--
admin-web/src/pages/workOrders/detail.tsx |  79 ++++++++++++--
docs/reports/A5c.md                       |  88 ++++++++++++++++
miniprogram/utils/contract.js             |   6 +-
server/commerce.py                        | 164 +++++++++++++++++++++++++++++-
server/contract.py                        |   3 +
server/order_view.py                      |   2 +-
server/routes/rework_orders.py            |  61 +++++++++++
server/status.py                          |   7 +-
server/tests/test_rework_orders.py        | 134 ++++++++++++++++++++++++
12 files changed, 577 insertions(+), 21 deletions(-)
```

`server/migrations/m020_rework_orders.py` 未建：工单嵌在现有售后记录中。

## 4. 测试

- 后端全量：`Ran 604 tests in 119.903s`、`OK (skipped=7)`。
- 小程序全量：`tests 267`、`pass 267`、`fail 0`。
- `python3 kb/validate.py`：`已填 200/200 种，有问题 0 条，缺 0 种`。
- `cd admin-web && npm run build`：`✓ 1621 modules transformed.`、`✓ built in 1.55s`；构建产物已恢复，未提交。
- 测试数：后端开工前 600 → 现在 604；小程序开工前 267 → 现在 267。
- 新增 `server/tests/test_rework_orders.py` 四个测试：分别测生成条件/客户状态、珠序及普通工单锁定、质检发货及金额、HTTP 权限。定向结果：`Ran 4 tests in 2.448s`、`OK`。
- 旧测试期望未改；无测试删除或放宽。

## 5. 自查

```text
$ git log --oneline origin/integration/2026-11..HEAD
ad7e3f2 A5c: 验证重串珠序质检发货和权限
931ce7f A5c: 接入后台重串入口和工单操作
0700275 A5c: 接通寄回收货与独立重串工单
e36b6f7 A5c: 记录待确认的订单展示依赖
4fda1bc A5c: 追加寄回已收状态与重串按钮文案
8cdb35b A5c: 补记开工前测试数
de0ef9c A5c: 记录范围确认前的进度
1aa1550 A5c: 开工

$ git diff --check origin/integration/2026-11...HEAD
（无输出）
```

接口（金额字段沿用原订单，单位为整数分；以下接口不改金额）：`POST /api/admin/after-sales/{no}/rework-order` 需 `process_after_sales`，返回关联编号、新手围、珠序和工单参考；`GET /api/admin/rework-orders`、`GET /api/admin/rework-orders/{no}` 需 `view_work_orders`；`PUT /api/admin/rework-orders/{no}` 需 `work_orders`，更新珠序/工序/负责人；`PUT /api/admin/rework-orders/{no}/quality-gate` 需 `quality_gate`；`PUT /api/admin/rework-orders/{no}/ship` 需 `process_after_sales`。

## 6. 没做 / 没验证 / 偏离卡片

- 经负责人同意，只在 `server/order_view.py` 的售后处理中状态列表加了 `received`，其他行不动。
- 经负责人同意，在 `server/status.py` 追加 `received` 状态、中文名，以及 `returning → received → completed` 路径；现有流转边未删除。新按钮文字写入 `server/contract.py::ACTIONS`，运行 `tools/export_contract.py` 生成两个契约文件，未手改。
- 重串工单嵌入售后记录，无新表或迁移；原订单金额与退款字段不改。
- 按负责人已定规则，珠子增减与差价由客服线下沟通；系统只记录备注，不自动加减珠、不计算补退款。初始工单复制原珠序，包含模板订单。
- 未在后台浏览器或微信开发者工具手工验收页面。

## 7. 审核修改（打回后才有）

无。
