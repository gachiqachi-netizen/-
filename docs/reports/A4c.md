# A4c 交付报告

分支：agent/A4c-admin-order-ops　执行：Claude（Codex 领卡后未写代码，负责人改派）

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 后台改地址 `PUT /api/admin/orders/{no}/address` | 做了 | server/app.py do_PUT（调 `change_order_address(actor="admin")`，写后台操作记录，返回 `order_detail`） |
| 2. 内部备注 `PUT /api/admin/orders/{no}/note` | 做了 | server/commerce.py `add_internal_note`（1–300 字，最多 100 条，原子写，写操作记录）；`INTERNAL_ORDER_FIELDS` 加 `internalNotes` |
| 3. 取消原因 | 做了 | contract.py `CANCEL_REASONS`，`payload()` 末尾加 `cancelReasons`；用户动作接口透传 `reason`；取消分支校验、存 `cancelReason`、写进历史说明；不带原因照常取消 |
| 4. 去掉手动确认订单 | 做了 | `allowed_order_transitions` 未付款不给 `confirmed`；`transition_order_status` 未付款确认报“付款后会自动确认，不用手动确认” |
| 5. 重跑导出 | 做了 | contract.js、contract.ts 已更新，再跑一次没有变化 |
| 6. 测试 | 做了 | server/tests/test_order_admin_ops.py，13 个用例 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 后台改地址：发货前能、发货后不能、写了 addressHistory | 通过 | `test_admin_change_address_before_shipping`、`test_admin_change_address_after_shipping_rejected` |
| 内部备注：写入、超长报错、用户接口里没有 internalNotes | 通过 | `test_internal_note_is_saved_and_hidden_from_customer`、`test_internal_note_length_rules`、`test_admin_note_over_http` |
| 取消原因：合法存下、非法报错、不带也能取消 | 通过 | `test_cancel_with_valid_reason_is_saved`、`test_cancel_with_invalid_reason_is_rejected`、`test_cancel_without_reason_still_works` |
| 手动确认：未付款没有 confirmed、直接调报错；已付款不变 | 通过 | `test_unpaid_order_has_no_manual_confirm`、`test_admin_manual_confirm_unpaid_rejected_over_http`、`test_paid_order_can_still_be_confirmed` |

## 3. 改了的文件
```
 admin-web/src/contract.ts                 |   8 +-
 miniprogram/utils/contract.js             |   8 +-
 server/app.py                             |  13 +-
 server/commerce.py                        |  34 +++++-
 server/contract.py                        |   2 +
 server/tests/test_admin_http.py           |   2 +-
 server/tests/test_order_admin_ops.py      | 196 ++++++++++++++++++++++++++++++
 server/tests/test_state_machine.py        |   1 +
 server/tests/test_state_machine_strict.py |   3 +-
 server/tests/test_transaction.py          |   1 +
 server/user_api.py                        |   6 +-
```
4 个旧测试文件不在“只能改”里，按负责人已同意的规则改（见第 4 节）。

## 4. 测试
```
python3 -m unittest discover -s server/tests   Ran 329 tests  OK (skipped=7)
python3 kb/validate.py                          已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 316 → 329（+13）。

改了前提的旧测试（它们测的是本卡去掉的“后台手动确认未付款订单”；只改前提，原断言一个不动）：
- `test_admin_http.py::test_order_status_transition_and_illegal`：`self._order()` → `self._order(paid=True)`
- `test_state_machine.py::test_order_status_repeat_transition_is_idempotent`：建单后先把订单置为已付款
- `test_transaction.py::test_idempotent_order_transition_does_not_duplicate_audit`：同上
- `test_state_machine_strict.py::test_unpaid_cannot_complete`：原来先手动确认再断言“未付款不能完成”；现在直接把订单置为“已确认、未付款”（旧数据状态），再断言不能完成，测的仍是同一件事

## 5. 自查
- 提交都以“A4c:”开头。
- 契约导出文件是最新的。

## 6. 没做 / 没验证 / 偏离卡片
- 取消原因第二项写成“拍错了，想重新设计”（卡上是“想改一改再下单”），和负责人确认过的售后原因用词保持一致。
- 小程序测试本卡没改小程序代码，本机没装 Node，没跑。
