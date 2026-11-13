# A5a 交付报告（暂停待确认）

分支：agent/A5a-after-sale-customer　最后一个代码提交：8881f16

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 类型改成五种 | 部分完成；m007 尚未注册 | 60fabd4；注册文件不在可改清单 |
| 2. _after_sale_target 补新类型的流程 | 做了 | bbff1a3 |
| 3. 按订单阶段能申请哪些类型 | 做了 | 1572bac |
| 4. 退款金额 | 做了 | a5b3047 |
| 5. 原因选项 | 做了 | e068df3 |
| 6. 用户申请 | 做了 | 2f965bf |
| 7. 测试 | 新测试做了；全量待旧测试范围确认 | 8881f16 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 各阶段类型和签收期限 | 通过 | `server/tests/test_after_sale_customer.py::test_pre_shipment_only_refund`、`test_shipped_and_in_transit_only_refusal_refund`、`test_signed_within_seven_days_has_three_types`、`test_signed_on_day_eight_has_no_types` |
| 金额、原因、归属、幂等、迁移 | 新测试通过 | `python3 -m unittest server.tests.test_after_sale_customer`：Ran 18 tests，OK |
| 原有后台售后测试全部通过 | 未达到 | 全量 311 个，3 个“补发”旧输入报错，另有 1 个动作列表断言失败 |

## 3. 改了的文件
```
 admin-web/src/contract.ts                  |  33 +++++-
 miniprogram/utils/contract.js              |  33 +++++-
 server/app.py                              |   7 ++
 server/commerce.py                         |  54 +++++++--
 server/contract.py                         |   9 ++
 server/migrations/m007_after_sale_types.py |  11 ++
 server/status.py                           |   2 +-
 server/tests/test_after_sale_customer.py   | 181 +++++++++++++++++++++++++++++
 server/user_api.py                         |  39 +++++++
 9 files changed, 354 insertions(+), 15 deletions(-)
```

## 4. 测试
开工前后端 293 个（现在 311 个减去新加 18 个；开工前命令只留最后 3 行），小程序 129 个；现在后端 311 个，小程序暂未重跑。

```
python3 -m unittest server.tests.test_after_sale_customer
Ran 18 tests in 1.141s
OK

python3 -m unittest discover -s server/tests
Ran 311 tests in 11.776s
FAILED (failures=1, errors=3, skipped=7)
```
待范围确认后跑全量三条。新增测试：`test_unpaid_has_no_types`（未付）；`test_pre_shipment_only_refund`（未发货）；`test_shipped_and_in_transit_only_refusal_refund`（运输中）；`test_signed_within_seven_days_has_three_types`（七天内）；`test_signed_on_day_eight_has_no_types`（第八天）；`test_existing_after_sale_has_no_types`（已有售后）；`test_other_logistics_or_missing_signed_at_has_no_types`（其他物流）；`test_refund_amount_ignores_client_amount`（金额由后端算）；`test_same_key_returns_same_after_sale`（幂等）；`test_repeated_without_same_key_is_rejected`（重复申请）；`test_wrong_owner_is_not_found`（越权）；`test_invalid_reason_and_long_note`（输入校验）；`test_new_wrist_required_and_stored`（新手围）；`test_migration_renames_and_is_idempotent`（迁移重复执行）；`test_contract_reason_options`（契约）；`test_invalid_reason_is_400`、`test_other_owner_is_404`、`test_customer_request_is_201_and_idempotent`（HTTP）。

## 5. 自查（贴命令和输出）
`git log --oneline origin/integration/2026-11..HEAD`：当前 8 个提交均以 `A5a:` 开头。新增 POST `/api/my/orders/{no}/after-sales`，需要用户登录和订单归属；返回 `afterSale`（历史不含 actor）与 `order`（`public_order`）；金额单位为整数分。

## 6. 没做 / 没验证 / 偏离卡片
`server/migrations/__init__.py` 不在“只能改”清单，但第 1 步要求注册 m007，等待授权。旧测试 `server/tests/test_admin_commerce.py` 1 处、`server/tests/test_refund_truth.py` 2 处使用“补发”，卡片明确要求停下来问；另有 `server/tests/test_order_user_contract.py` 1 处动作列表缺少 `request_after_sale`。三项均等待授权。未在开发者工具验证，未开 PR。仅退款、补寄配件、拒收后退款的原因是暂定，待负责人确认。

## 7. 审核修改（打回后才有）
无。
