# A8e 交付报告

分支：agent/A8e-data-scope　最后一个代码提交：afc0976（报告提交见分支 HEAD）

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. `accounts.py` 加 `own_scope_name()` | 做了 | `server/accounts.py:147`；bb770fd |
| 2. `list_work_orders` 只留当前账号的工单；`get_work_order` 对别人的返回 None | 做了 | `server/commerce.py:955`、`:967`；22ddafd |
| 3. `update_work_order`、`record_quality_gate` 对别人的工单按不存在处理 | 做了 | `server/commerce.py:995`、`:1045`；22ddafd |
| 4. 测试 own、负责人和没有当前账号的两种范围及内部调用 | 做了 | `server/tests/test_admin_data_scope.py`；1d81060 |
| 5. 推送前合并最新 `origin/integration/2026-11` 并跑全量 | 做了 | afc0976；第 4 节命令输出 |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| own 做单师傅只看到分给自己的工单，未分配的也看不到 | 通过 | `test_admin_data_scope.py::AdminDataScopeTests::test_maker_sees_only_assigned_work_orders` |
| 看别人的工单返回 404 | 通过 | `test_maker_sees_only_assigned_work_orders`，HTTP GET 别人的及未分配的均为 404 |
| 改、提交质检别人的工单均返回 404 | 通过 | `test_maker_cannot_update_or_quality_check_other_work_order`，HTTP PUT 两类操作均为 404 |
| 负责人看全部 | 通过 | `test_owner_sees_all_work_orders` |
| 没有当前账号时内部调用不过滤 | 通过 | `test_internal_call_without_current_admin_is_unfiltered`，覆盖列表、详情、更新和质检 |

## 3. 改了的文件
```text
 docs/reports/A8e.md                   |  69 +++++++++++++++++++++
 server/accounts.py                    |   9 +++
 server/commerce.py                    |  15 ++++-
 server/tests/test_admin_data_scope.py | 110 ++++++++++++++++++++++++++++++++++
 4 files changed, 202 insertions(+), 1 deletion(-)
```

## 4. 测试
```text
python3 -m unittest discover -s server/tests
Ran 462 tests in 74.319s
OK (skipped=7)

node --test miniprogram/tests/*.test.js
ℹ tests 146
ℹ pass 146
ℹ fail 0

python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端开工前 442 个 → 合并最新 integration 后基线 458 个 → 现在 462 个；小程序开工前 146 个 → 现在 146 个。集成分支新增了 B-10 的 16 项后端测试，本卡新增 4 项。

本卡新增测试：`test_maker_sees_only_assigned_work_orders` 测试 own 的列表、自己和未分配详情；`test_maker_cannot_update_or_quality_check_other_work_order` 测试越权写操作 404 且不改数据；`test_owner_sees_all_work_orders` 测试 all 范围；`test_internal_call_without_current_admin_is_unfiltered` 测试内部调用的四个函数不受限。

## 5. 自查（贴命令和输出）
```text
git log --oneline origin/integration/2026-11..HEAD
afc0976 A8e: 合并最新 integration
1d81060 A8e: 覆盖工单范围与越权 404
22ddafd A8e: 限制工单读取和写入范围
bb770fd A8e: 识别当前后台账号的数据范围
31ebaae A8e: 记录缺少可改文件范围的阻塞
5de8f72 A8e: 开工

git status --short
（空）
```
本卡未新增接口；现有 `GET /api/admin/work-orders` 返回工单列表，`GET /api/admin/orders/{no}/work-order` 返回工单详情或 404，`PUT /api/admin/orders/{no}/work-order` 和 `PUT /api/admin/orders/{no}/quality-gate` 返回更新结果或 404，均沿用后台登录与现有权限点。未涉及金额或尺寸规则。

## 6. 没做 / 没验证 / 偏离卡片
可改文件由负责人在本次回复中指定为 `server/accounts.py`、`server/commerce.py`、新建 `server/tests/test_admin_data_scope.py`；未改 `server/app.py`。无未完成项。

## 7. 审核修改（打回后才有）
无。
