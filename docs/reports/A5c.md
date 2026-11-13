# A5c 交付报告（待范围确认）

分支：`agent/A5c-rewrist`　当前代码提交：`4fda1bc`

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 从已合并 A5b 的 integration 领卡 | 做了 | `1aa1550 A5c: 开工` |
| 追加“已收到寄回”状态及重串按钮契约文案 | 做了 | `4fda1bc`；契约输出由脚本生成，未手改 |
| 收到寄回后生成重串工单 | 未做 | 卡片没有“只能改”清单，待负责人确认文件范围 |
| 只允许重串工单改珠序并记备注与操作记录 | 未做 | 同上 |
| 显示新手围、颗数、长度参考及线下沟通文案 | 未做 | 同上 |
| 走做单、质检、发货，不自动补退款 | 未做 | 同上 |

## 2. 验收

| 验收项 | 结果 | 证据 |
| --- | --- | --- |
| 重串工单流程 | 待实现 | `server/commerce.py:1568,1574` 目前明确拒绝改手围重串的确认收货和完成动作 |
| 普通工单仍锁用料 | 现状已确认 | `server/commerce.py:812,1014` 的 `_FORBIDDEN_WORK_ORDER_MUTATIONS` |

## 3. 改了的文件

当前已改 `server/status.py`、`server/contract.py`，并由 `tools/export_contract.py` 生成 `miniprogram/utils/contract.js`、`admin-web/src/contract.ts`。完整 `git diff --stat origin/integration/2026-11...HEAD` 将在最终交付时补齐。

## 4. 测试

开工前测试：后端 600 个通过（跳过 7 个）；小程序 267 个通过。当前状态及契约改动尚未跑交付全量测试。

## 5. 自查

`git log --oneline origin/integration/2026-11..HEAD`：`4fda1bc A5c: 追加寄回已收状态与重串按钮文案`、`8cdb35b A5c: 补记开工前测试数`、`de0ef9c A5c: 记录范围确认前的进度`、`1aa1550 A5c: 开工`。

## 6. 没做 / 没验证 / 偏离卡片

负责人已批准第一批七个文件及状态、契约生成文件。实现时发现新 `received` 状态在 `server/order_view.py:9` 未归入“售后处理中”，会让用户端主状态回落成普通订单状态。该文件不在批准范围，现按要求停下请求最小额外授权。尚未实现重串工单及页面。

## 7. 审核修改（打回后才有）

无。
