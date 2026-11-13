# A5a 交付报告（暂停待确认）

分支：agent/A5a-after-sale-customer　最后一个代码提交：d8a3eea

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 类型改成五种 | 做了 | 60fabd4、9635150 |
| 2. _after_sale_target 补新类型的流程 | 做了 | bbff1a3 |
| 3. 按订单阶段能申请哪些类型 | 做了 | 1572bac |
| 4. 退款金额 | 做了 | a5b3047 |
| 5. 原因选项 | 做了 | e068df3 |
| 6. 用户申请 | 做了 | 2f965bf |
| 7. 测试 | 新测试做了；全量仍有 4 处旧期望冲突 | 8881f16、7e827cb、d8a3eea |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 各阶段类型和签收期限 | 通过 | `server/tests/test_after_sale_customer.py::test_pre_shipment_only_refund`、`test_shipped_and_in_transit_only_refusal_refund`、`test_signed_within_seven_days_has_three_types`、`test_signed_on_day_eight_has_no_types` |
| 金额、原因、归属、幂等、迁移 | 新测试通过 | `python3 -m unittest server.tests.test_after_sale_customer`：Ran 18 tests，OK |
| 原有后台售后测试全部通过 | 已通过；全量仍未过 | 3 处旧“补发”输入已按授权改名；迁移版本期望 3 个测试和确认收货后动作期望 1 个测试待确认 |

## 3. 改了的文件
```
 admin-web/src/contract.ts                  |  33 +++++-
 docs/reports/A5a.md                        |  64 ++++++++++
 miniprogram/utils/contract.js              |  33 +++++-
 server/app.py                              |   7 ++
 server/commerce.py                         |  54 +++++++--
 server/contract.py                         |   9 ++
 server/migrations/__init__.py              |   2 +
 server/migrations/m007_after_sale_types.py |  11 ++
 server/status.py                           |   2 +-
 server/tests/test_admin_commerce.py        |   2 +-
 server/tests/test_after_sale_customer.py   | 181 +++++++++++++++++++++++++++++
 server/tests/test_order_user_contract.py   |   2 +-
 server/tests/test_refund_truth.py          |   4 +-
 server/user_api.py                         |  39 +++++++
 14 files changed, 424 insertions(+), 19 deletions(-)
```
`server/migrations/__init__.py` 经负责人明确授权，仅登记 m007；旧测试改动也经负责人明确授权。

## 4. 测试
开工前后端 293 个（现在 311 个减去新加 18 个；开工前命令只留最后 3 行），小程序 129 个；现在后端 311 个，小程序 129 个。

```
python3 -m unittest server.tests.test_after_sale_customer
Ran 18 tests in 1.141s
OK

python3 -m unittest discover -s server/tests
Ran 311 tests in 11.776s
FAILED (failures=4, skipped=7)
```
全量小程序：`node --test miniprogram/tests/*.test.js`，129/129 通过；知识库：`python3 kb/validate.py`，200/200 通过。迁移与另一处旧动作列表期望待确认后重跑全量。

按负责人授权，`server/tests/test_admin_commerce.py:283`、`server/tests/test_refund_truth.py:141,192` 的类型字面量由 `补发` 改为 `补寄配件`，其他断言不变；`server/tests/test_order_user_contract.py:107` 的动作列表由 `[confirm_receipt, view_logistics, reorder]` 改为 `[confirm_receipt, view_logistics, reorder, request_after_sale]`。新增测试：`test_unpaid_has_no_types`（未付）；`test_pre_shipment_only_refund`（未发货）；`test_shipped_and_in_transit_only_refusal_refund`（运输中）；`test_signed_within_seven_days_has_three_types`（七天内）；`test_signed_on_day_eight_has_no_types`（第八天）；`test_existing_after_sale_has_no_types`（已有售后）；`test_other_logistics_or_missing_signed_at_has_no_types`（其他物流）；`test_refund_amount_ignores_client_amount`（金额由后端算）；`test_same_key_returns_same_after_sale`（幂等）；`test_repeated_without_same_key_is_rejected`（重复申请）；`test_wrong_owner_is_not_found`（越权）；`test_invalid_reason_and_long_note`（输入校验）；`test_new_wrist_required_and_stored`（新手围）；`test_migration_renames_and_is_idempotent`（迁移重复执行）；`test_contract_reason_options`（契约）；`test_invalid_reason_is_400`、`test_other_owner_is_404`、`test_customer_request_is_201_and_idempotent`（HTTP）。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：当前所有提交均以 `A5a:` 开头。新增 POST `/api/my/orders/{no}/after-sales`，需要用户登录和订单归属；返回 `afterSale`（历史不含 actor）与 `order`（`public_order`）；金额单位为整数分。

## 6. 没做 / 没验证 / 偏离卡片
`server/migrations/__init__.py` 经负责人确认后仅注册 m007。旧测试类型名及第 107 行动作列表经确认后已更新。全量测试另发现 `server/tests/test_migration.py` 4 处版本期望止于 006，以及 `server/tests/test_order_user_contract.py:116` 的另一处动作列表缺少 `request_after_sale`，等待负责人确认。未在开发者工具验证，未开 PR。仅退款、补寄配件、拒收后退款的原因是暂定，待负责人确认。

## 7. 审核修改（打回后才有）
| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 1 | 注册 m007，未改 TABLES | 9635150 |
| 2 | 三处旧测试类型字面量改名 | 7e827cb |
| 3 | 第 107 行动作列表加入 request_after_sale | d8a3eea |
