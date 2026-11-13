# A8d 交付报告

分支：agent/A8d-operator　最后一个代码提交：e15c6d4（报告提交见分支 HEAD）

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. 把 `self.admin_user["name"]` 传给 commerce 函数的 `actor` 参数 | 做了 | `server/app.py:645` 等 19 处；0490213 |
| 2. `record_quality_gate` 的 `inspector` 改成取 `actor`，忽略请求里的 `inspector` | 做了 | `server/commerce.py:1041`；42be2d3 |
| 3. 测试操作记录、订单历史和质检人；全仓库搜索 `actor=ACTOR` 调用 | 做了 | `server/tests/test_admin_actor.py`；818b8aa |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 每个后台写操作之后，操作记录里的操作人是账号名字 | 通过 | `test_admin_actor.py::AdminActorHTTPTests::test_product_create_copy_update_delete_audits_account`、`test_template_create_copy_update_delete_audits_account`、`test_term_create_update_delete_audit_account`、`test_logistics_and_work_order_audit_account`、`test_after_sale_create_and_transition_audit_account` |
| 订单历史里的操作人是账号名字 | 通过 | `test_admin_actor.py::AdminActorHTTPTests::test_order_history_note_and_quality_use_account`、`test_after_sale_create_and_transition_audit_account` |
| 质检人等于当前账号，忽略请求里的 `inspector` | 通过 | `test_admin_actor.py::AdminActorHTTPTests::test_order_history_note_and_quality_use_account`、`test_direct_quality_gate_ignores_request_inspector` |
| `actor=ACTOR` 调用只剩默认参数定义 | 通过 | `rg -n 'actor=ACTOR\b' server --glob '*.py'`：结果均为 `server/commerce.py` 的 `def` 行；没有调用行 |

## 3. 改了的文件
```text
 docs/reports/A8d.md                  |  68 +++++++++++++
 server/app.py                        |  38 ++++----
 server/commerce.py                   |   2 +-
 server/tests/test_admin_actor.py     | 179 +++++++++++++++++++++++++++++++++++
 server/tests/test_order_admin_ops.py |   2 +-
 5 files changed, 268 insertions(+), 21 deletions(-)
```

## 4. 测试
```text
python3 -m unittest discover -s server/tests
Ran 427 tests in 63.296s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 146
ℹ pass 146
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端开工前 420 个 → 现在 427 个；小程序开工前 146 个 → 现在 146 个。

本卡新增测试：`test_product_create_copy_update_delete_audits_account` 验证商品四种写操作；`test_template_create_copy_update_delete_audits_account` 验证模板四种写操作；`test_term_create_update_delete_audit_account` 验证条款三种写操作；`test_order_history_note_and_quality_use_account` 验证订单状态、内部备注和质检；`test_logistics_and_work_order_audit_account` 验证物流历史与工单审计；`test_after_sale_create_and_transition_audit_account` 验证售后历史和审计；`test_direct_quality_gate_ignores_request_inspector` 验证伪造的质检人被忽略。

旧测试期望改动：`server/tests/test_order_admin_ops.py::AdminHTTPTests::test_admin_change_address_before_shipping` 的 `addressHistory[-1]["actor"]`，原期望 `"admin"`，新期望 `"测试负责人"`。原因：该测试通过负责人账号登录，A8d 要把真实账号名字写进历史；只改期望值，未改测试逻辑。

## 5. 自查（贴命令和输出）
```text
git log --oneline origin/integration/2026-11..HEAD
e15c6d4 A8d: 更新改地址操作人旧断言
818b8aa A8d: 验证后台审计历史和质检操作人
42be2d3 A8d: 质检人固定为当前操作账号
0490213 A8d: 后台写操作传入账号名
8146bab A8d: 开工

git status --short
（空）
```
本卡未新增接口；受影响的后台 POST、PUT、DELETE 接口沿用现有登录和权限校验，响应字段未改。未涉及金额或尺寸规则。

## 6. 没做 / 没验证 / 偏离卡片
无。

## 7. 审核修改（打回后才有）
无。
