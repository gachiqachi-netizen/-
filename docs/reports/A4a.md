# A4a 交付报告

分支：agent/A4a-receipt　执行：步骤 1–2 Codex（691d72f），步骤 3–5 Claude 接手

## 1. 步骤
| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 1. `order_allowed_actions`：物流加 delivered，履约 shipped/delivered | 做了 | server/user_api.py:158-163（691d72f） |
| 2. 确认收货分支：允许 delivered；物流、履约已是 delivered 时跳过迁移，保留 signedAt | 做了 | server/commerce.py:1157-1182（691d72f） |
| 3. 新函数 `auto_complete_delivered` | 做了 | server/commerce.py `_auto_complete_due`、`auto_complete_delivered`（49bb7c0）：事务里再查一次条件，状态变了就跳过；操作人 system，说明“签收 7 天后自动确认收货”，写 `auto_complete` 操作记录 |
| 4. 新建 `server/jobs.py`，子命令 auto-complete | 做了 | server/jobs.py（af32cae），开库方式照 app.py 第 49–53 行，不 import app |
| 5. 新建 `server/tests/test_order_receipt.py` | 做了 | 9 个用例（74b45df） |

## 2. 验收
| 卡上的验收项 | 结果 | 证据 |
|---|---|---|
| 三条测试全过 | 后端、知识库通过；小程序本卡没改，未在本机跑（本机没装 Node） | 见第 4 节 |
| 新测试 5 个以上用例全过 | 通过 | `python3 -m unittest tests.test_order_receipt` → Ran 9 tests OK |

## 3. 改了的文件
```
 server/commerce.py                 |  79 ++++++++++++++++----
 server/jobs.py                     |  39 ++++++++++
 server/tests/test_order_receipt.py | 147 +++++++++++++++++++++++++++++++++++++
 server/user_api.py                 |   4 +-
```
都在卡的“只能改”里。

## 4. 测试
```
python3 -m unittest discover -s server/tests
Ran 238 tests  OK (skipped=7)
python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```
测试数：后端 229 → 238（+9）。小程序未改动。

新加的测试：
- `test_in_transit_can_confirm`：运输中能确认收货（原有行为不变）
- `test_delivered_can_confirm_and_keeps_signed_at`：已签收能确认，signedAt 不变，不记 delivered → delivered
- `test_after_sale_hides_confirm`：有售后时没有确认收货，硬调也报错
- `test_other_user_cannot_confirm`：别人的订单确认不了
- `test_auto_complete_after_seven_days`：8 天前签收的完成；6 天前、有售后、已完成、运输中的都不动；返回列表正确
- `test_auto_complete_records_system_actor`：历史操作人 system、说明正确，写了一条 auto_complete 操作记录
- `test_auto_complete_is_idempotent`：跑两次，第二次不重复处理
- `test_auto_complete_skips_order_without_signed_at`：没有签收时间的不动
- `test_jobs_cli_runs`：`jobs.main(["auto-complete"])` 能跑

## 5. 自查
- 提交都以“A4a:”开头。
- 没改发货、签收的后台接口；没加定时任务配置。
- 现有测试里没有“签收后没有 confirm_receipt”的断言（停下来问的情况没出现）。

## 6. 没做 / 没验证 / 偏离卡片
- 无偏离。
- 小程序测试本卡没改代码，本机没装 Node，没跑。
