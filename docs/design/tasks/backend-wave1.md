# 后端任务卡 · 第一波

> 派活顺序和并行批次见 [00-dispatch.md](00-dispatch.md)。每张卡一个会话，做完开 PR 就停。
> 所有卡的共同规矩：金额整数分；不改尺寸规则；不写任何真实密钥、手机号、地址；状态迁移只走 `status.validate_transition` 和现有的 `_atomic_order_transition`；用户接口只用 `user_api.public_order` 输出订单；新加的字段如果只给后台看，加进 `user_api.INTERNAL_ORDER_FIELDS`。

---

## A1 字段契约

- **批次**：第 1 批　**开工前必须已合并**：无　**大小**：M
- **分支**：`agent/A1-contract`

### 为什么
同一套状态现在有三份文字（`server/status.py`、`miniprogram/utils/order-state.js`、`admin-web/src/api.ts`），叫法和代码都不一致。这张卡建一个后端的唯一来源，并用脚本导出给两个前端。

### 只能改这些文件
新建 `server/contract.py`、`tools/export_contract.py`、`server/tests/test_contract.py`、`miniprogram/utils/contract.js`、`admin-web/src/contract.ts`；改 `server/app.py`（只加一个 GET 路由）、`docs/order-state-contract.md`。

### 步骤
1. **新建 `server/contract.py`**，只放数据和一个函数，不写业务逻辑。内容逐字如下（中文以这里为准）：
   ```python
   """对外的代码和中文叫法：唯一来源。前端用的文件由 tools/export_contract.py 生成，不要手改。"""
   import hashlib, json
   import commerce, status

   GROUPS = [  # 五组状态：key 给前端用，field 是订单里的字段名
       {"key": "order", "field": "orderStatus", "label": "订单"},
       {"key": "payment", "field": "paymentStatus", "label": "支付"},
       {"key": "fulfillment", "field": "fulfillmentStatus", "label": "制作"},
       {"key": "logistics", "field": "logisticsStatus", "label": "物流"},
       {"key": "afterSale", "field": "afterSaleStatus", "label": "售后"},
   ]
   # 每组状态的中文：直接取 status.py 现有的 *_LABELS，不另写
   STATUS_LABELS = {
       "orderStatus": status.ORDER_STATUS_LABELS,
       "paymentStatus": status.PAYMENT_STATUS_LABELS,
       "fulfillmentStatus": status.FULFILLMENT_STATUS_LABELS,
       "logisticsStatus": status.LOGISTICS_STATUS_LABELS,
       "afterSaleStatus": status.AFTER_SALE_STATUS_LABELS,
   }
   # 给用户看的主状态（06 第 3.1 节）。tone: normal 普通 / attention 需要用户处理 / danger 异常
   CUSTOMER_STATUS = {
       "after_sale_open":     {"label": "售后处理中", "tone": "normal"},
       "after_sale_done":     {"label": "售后已完成", "tone": "normal"},
       "after_sale_rejected": {"label": "售后未通过", "tone": "normal"},
       "cancelled":           {"label": "已取消", "tone": "normal"},
       "refunding":           {"label": "退款中", "tone": "normal"},
       "refunded":            {"label": "已退款", "tone": "normal"},
       "refund_failed":       {"label": "退款遇到问题", "tone": "danger"},
       "completed":           {"label": "已完成", "tone": "normal"},
       "delivered":           {"label": "已签收", "tone": "attention"},
       "in_transit":          {"label": "运输中", "tone": "normal"},
       "logistics_issue":     {"label": "物流有点问题", "tone": "danger"},
       "producing":           {"label": "制作中", "tone": "normal"},
       "ready_to_ship":       {"label": "待发货", "tone": "normal"},
       "pending_payment":     {"label": "待支付", "tone": "attention"},
       "processing":          {"label": "处理中", "tone": "normal"},
   }
   # 给后台看的状态（12 第 4 节）。danger=True 的显示红字
   OPS_STATUS = {
       "after_sale": {"label": "售后中", "danger": False},
       "cancelled": {"label": "已取消", "danger": False},
       "closed": {"label": "已关闭", "danger": False},
       "unpaid": {"label": "待支付", "danger": False},
       "to_make": {"label": "待制作", "danger": False},
       "qc_failed": {"label": "质检不通过", "danger": True},
       "producing": {"label": "制作中", "danger": False},
       "ready_to_ship": {"label": "待发货", "danger": False},
       "logistics_issue": {"label": "物流异常", "danger": True},
       "shipped": {"label": "已发货", "danger": False},
       "completed": {"label": "已完成", "danger": False},
   }
   # 用户订单动作。以后加动作就在这里加一行
   ACTIONS = {
       "pay_order": "去支付",
       "cancel_order": "取消订单",
       "confirm_receipt": "确认收货",
       "view_logistics": "查看物流",
       "reorder": "按这款再串一条",
   }
   PROGRESS_STEPS = [("ordered", "下单"), ("producing", "制作"), ("shipping", "运输"), ("delivered", "签收")]
   PRODUCT_TYPES = {"bead": "珠子", "spacer": "隔珠/隔片", "pendant": "吊坠", "cord": "线材", "packaging": "包装"}
   PRODUCT_STATUSES = {"draft": "草稿", "on_sale": "在售", "off_sale": "已下架", "archived": "已归档"}
   TERM_STATUSES = {"draft": "草稿", "published": "已发布", "disabled": "已停用"}
   TERM_SCENARIOS = {"all": "全部订单", "custom_diy": "自己串的", "template": "按模板下单", "ai": "AI 配的",
                     "gift": "送礼", "cord": "选了穿绳", "safety_warning": "含需要注意的材料"}
   WORK_ORDER_STATUSES = {"pending": "待开始", "producing": "制作中", "qc_passed": "质检通过",
                          "qc_failed": "质检不通过", "ready_to_ship": "待发货", "shipped": "已发货"}
   QUALITY_GATE_ITEMS = {"sequenceOk": "珠子顺序和工单一致", "sizeOk": "长度合适",
                         "materialOk": "用料和清单一致", "appearanceOk": "外观没有裂纹、线头"}

   def payload():
       data = {
           "groups": GROUPS, "statusLabels": STATUS_LABELS, "customerStatus": CUSTOMER_STATUS,
           "opsStatus": OPS_STATUS, "actions": ACTIONS,
           "progressSteps": [{"key": k, "label": v} for k, v in PROGRESS_STEPS],
           "afterSaleTypes": list(status.AFTER_SALE_TYPES),
           "productTypes": PRODUCT_TYPES, "productStatuses": PRODUCT_STATUSES,
           "termTypes": list(status.TERM_TYPES), "termStatuses": TERM_STATUSES, "termScenarios": TERM_SCENARIOS,
           "workOrderSteps": list(commerce.WORK_ORDER_STEPS), "workOrderStatuses": WORK_ORDER_STATUSES,
           "qualityGateItems": QUALITY_GATE_ITEMS,
       }
       raw = json.dumps(data, ensure_ascii=False, sort_keys=True)
       return {"version": hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12], **data}
   ```
   - 先检查 `TERM_SCENARIOS` 的键和 `commerce.TERM_SCENARIOS` 完全一致、`QUALITY_GATE_ITEMS` 的键和 `commerce.QUALITY_GATE_FIELDS` 一致；不一致就停下来问。
   - 如果 `import commerce` 造成循环导入，改成在 `payload()` 里面再 import。
2. **`server/app.py` 加路由**：在 `do_GET` 里 `/api/catalog` 那段旁边加
   ```python
   if path == "/api/meta/contract":
       import contract
       return self.send(200, contract.payload())
   ```
   不需要登录。
3. **新建 `tools/export_contract.py`**：`sys.path` 加上 `server/`，调 `contract.payload()`，写两个文件：
   - `miniprogram/utils/contract.js`：第一行注释 `// 自动生成：python3 tools/export_contract.py，不要手改`，内容是 `module.exports = <JSON>`（用 `json.dumps(..., ensure_ascii=False, indent=2, sort_keys=True)`）。**不要用 ES module 语法**，小程序用 CommonJS。
   - `admin-web/src/contract.ts`：同样的注释，内容 `export const CONTRACT = <JSON> as const;`，再加 `export type CustomerStatusCode = keyof typeof CONTRACT.customerStatus;`、`OpsStatusCode`、`ActionCode` 三个类型。
   - 文件末尾都带换行。脚本跑两次结果完全一样（`sort_keys=True` 保证）。
4. **新建 `server/tests/test_contract.py`**，四个用例：
   - `test_exported_files_are_fresh`：在临时目录里跑一遍导出，和仓库里的两个文件逐字比较，不一致就失败，失败信息写“请运行 python3 tools/export_contract.py”。
   - `test_status_labels_cover_status_machine`：`status.py` 里每组状态的每个代码，在 `STATUS_LABELS` 里都有中文。
   - `test_scenarios_and_qc_match_commerce`：同步骤 1 的两条检查。
   - `test_http_route`：照 `tests/test_admin_http.py` 的方式起服务，`GET /api/meta/contract` 返回 200、带 `version`。本机请求不走代理：`urllib.request.build_opener(urllib.request.ProxyHandler({}))`。
5. **改 `docs/order-state-contract.md`**：
   - “小程序职责”第 1 条改成：“只显示后端给的 `customerStatus`、`progress` 和 `allowedActions`，不自己从五组状态推算（后端从 A2 起提供）。”
   - “当前边界”第 1 条改成：“只有当前有可用的支付通道（开发和体验环境的模拟支付，以后的微信支付）时才返回 `pay_order`。”
   - 末尾加一节“文字从哪来”：所有状态代码和中文以 `server/contract.py` 为准，前端用 `tools/export_contract.py` 导出的文件。
6. 跑 `python3 tools/export_contract.py`，把两个生成文件一起提交。

### 不要做
- 不改 `status.py` 的状态机和中文；不改 `miniprogram/utils/order-state.js` 和 `admin-web/src/api.ts`（那是 C2、D1 的事）。
- 不在 `contract.py` 里写判断逻辑。

### 验收
- 三条测试全过（`node --test` 那条没有改动，应保持原样通过）。
- 手工：改 `contract.py` 里一个中文、不重新导出，`test_exported_files_are_fresh` 失败；改回来通过。PR 里写明做过这个检查。

### 停下来问
- 步骤 1 两组键对不上；`status.py` 里有状态没有中文。

### 提示词
```
你在仓库 串个珠 里做任务卡 A1（字段契约）。先完整读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A1 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/A1-contract，从 origin/integration/2026-11 拉。每做完一步提交一次，提交说明以“A1:”开头。做完按 00-dispatch.md 第 5 节写 PR 描述，开 PR 到 integration/2026-11 后停下，不要开始别的卡。碰到卡里“停下来问”的情况就停下来问我。
```

---

## A4a 确认收货补齐和自动完成

- **批次**：第 1 批　**开工前必须已合并**：无　**大小**：M
- **分支**：`agent/A4a-receipt`

### 为什么
后台把物流改成“已签收”以后，用户的“确认收货”就消失了，订单会永远停在已签收（13 第 1.2 节 S1）。另外要加“签收 7 天后自动确认收货”。

### 只能改这些文件
`server/commerce.py`（只改 `customer_order_action` 的确认收货分支，新加 `auto_complete_delivered`）、`server/user_api.py`（只改 `order_allowed_actions`）、新建 `server/jobs.py`、新建 `server/tests/test_order_receipt.py`。

### 步骤
1. `user_api.order_allowed_actions`：`confirm_receipt` 的条件里，`logisticsStatus in ('shipped', 'in_transit')` 改成 `in ('shipped', 'in_transit', 'delivered')`；同时要求 `fulfillmentStatus in ('shipped', 'delivered')`。
2. `commerce.customer_order_action` 的确认收货分支：
   - 允许的物流状态同上。
   - 物流已经是 `delivered` 时**跳过**物流那一步迁移（不能 delivered → delivered），保留原 `signedAt`；履约已经是 `delivered` 时同样跳过。
   - 订单状态 `confirmed → completed` 照旧。
   - 历史里的说明照旧“用户确认收货”。
3. 新函数，放在 `customer_order_action` 后面：
   ```python
   AUTO_COMPLETE_DAYS = 7

   def auto_complete_delivered(db, now_ms=None, days=AUTO_COMPLETE_DAYS):
       """签收超过 days 天、用户没确认、也没有售后的订单，自动完成。返回处理的订单号列表。"""
   ```
   - 条件：`orderStatus == confirmed`、`logisticsStatus == delivered`、`afterSaleStatus == none`、`logistics.signedAt` 存在且 `<= now - days 天`。
   - 每一单用 `_atomic_order_transition` 单独处理：履约如果还不是 `delivered` 就推到 `delivered`，订单推到 `completed`；操作人写 `"system"`，说明“签收 7 天后自动确认收货”；写操作记录（`_audit_record("system", "auto_complete", "order", no, "")`）。
   - 某一单失败（比如状态已经变了）就跳过它、继续处理别的，最后返回成功的订单号列表。
4. 新建 `server/jobs.py`：
   ```python
   """定时任务入口：python3 server/jobs.py auto-complete"""
   ```
   用 `argparse`，子命令 `auto-complete`，打开数据库的方式和 `app.py` 一致（读 `DATA_DIR` / `DATABASE_URL`，照 `app.py` 里建 `db` 的那几行写）；打印处理了几单。部署时由服务器的定时任务每小时跑一次，这张卡不配定时任务。
5. 新建 `server/tests/test_order_receipt.py`，用 `tempfile` 建临时库，造已付款、已发货的订单（直接 `db.put` 一个最小订单，参照 `tests/test_order_user_contract.py` 的 `order()` 写法）：
   - 物流 `in_transit` 时能确认收货（原有行为不变）。
   - **物流 `delivered` 时 `allowedActions` 里有 `confirm_receipt`，并且能确认成功，`signedAt` 不变。**
   - 有售后时没有 `confirm_receipt`。
   - 自动完成：签收 8 天前的完成；6 天前的不动；有售后的不动；已完成的不重复处理；返回列表正确。

### 不要做
- 不改发货、签收的后台接口；不加定时任务配置。

### 验收
三条测试全过；新测试 5 个以上用例全过。

### 停下来问
- 现有测试里有断言“签收后没有 confirm_receipt”的，不要改断言，停下来问。

### 提示词
```
你在仓库 串个珠 里做任务卡 A4a（确认收货补齐和自动完成）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A4a 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/A4a-receipt，从 origin/integration/2026-11 拉。每做完一步提交一次，提交说明以“A4a:”开头。做完按 00-dispatch.md 第 5 节写 PR 描述，开 PR 后停下。碰到“停下来问”的情况就停下来问我。
```

---

## A2 订单展示状态

- **批次**：第 2 批　**开工前必须已合并**：A1　**大小**：M
- **分支**：`agent/A2-order-view`

### 为什么
用户主状态、后台状态、进度条现在由前端各自推算，规则写了两份。改成后端算好直接给。

### 只能改这些文件
新建 `server/order_view.py`、`server/tests/test_order_view.py`；改 `server/user_api.py`（只改 `public_order`）、`server/commerce.py`（只改 `order_detail`、`list_orders`）。**不改 `contract.py`**；状态代码只能用 A1 里 `CUSTOMER_STATUS`、`OPS_STATUS` 已有的，缺了就停下来问。

### 步骤
1. 新建 `server/order_view.py`，四个纯函数（只读订单、不写库）。五组状态一律先 `g = status.derive_status(order)` 再判断：
   ```python
   def customer_status(order, allowed_actions) -> dict  # {"code","label","tone","desc","primaryAction"}
   def ops_status(order) -> dict                        # {"code","label","danger"}
   def progress(order) -> dict                          # {"show": bool, "steps": [{"key","label","at","done"}]}
   ```
2. **`customer_status`**：按下面顺序，取第一条命中的（06 第 3.1 节，补上了“付款了还没开始做 = 制作中”）。`label`、`tone` 从 `contract.CUSTOMER_STATUS` 取；`desc` 逐字照表；`primaryAction` 只能是 `allowed_actions` 里有的，否则为 `None`。

   | 顺序 | 条件 | code | desc | primaryAction |
   |---|---|---|---|---|
   | 1 | 售后 `requested / reviewing / approved / returning / refunding` | after_sale_open | 售后正在处理，有进展会通知你。 | None |
   | 1 | 售后 `completed` | after_sale_done | 售后已经处理完了。 | None |
   | 1 | 售后 `rejected` | after_sale_rejected | 售后申请没有通过，原因在售后详情里。 | None |
   | 2 | 订单 `cancelled` 或 `closed` | cancelled | 这笔订单已取消，没有扣款。（支付是 `refunded` 时写：这笔订单已取消，钱已原路退回。） | reorder |
   | 3 | 支付 `refunding` / `refunded` / `refund_failed` | refunding / refunded / refund_failed | 钱正在原路退回。 / 钱已原路退回。 / 退款没成功，我们在处理。 | None |
   | 4 | 订单 `completed` | completed | 戴得开心。 | reorder |
   | 5 | 物流 `delivered` | delivered | 快递显示已签收，确认没问题就点确认收货。 | confirm_receipt |
   | 6 | 物流 `shipped` / `in_transit` | in_transit | 有物流单号时：已交给{carrierName}，单号 {trackingNo}；没有时：快件已发出。 | view_logistics |
   | 7 | 物流 `exception` / `returned` | logistics_issue | 快递遇到问题，我们在处理，有进展会通知你。 | None |
   | 8 | 履约 `ready_to_ship` | ready_to_ship | 手串做好了，等快递来取。 | None |
   | 8 | 履约 `producing`，或者支付 `paid` 且履约 `unfulfilled` | producing | 师傅正在串你的手串。 | None |
   | 9 | 支付 `unpaid` / `paying` / `pay_failed` | pending_payment | 还没付款，订单已为你保留。 | pay_order |
   | 10 | 其他 | processing | 订单正在处理。 | None |

   - 售后 `closed` 不算第 1 行，继续往下判断。
   - `{carrierName}` 为空时写“快递”。
3. **`ops_status`**（12 第 4 节）：按顺序取第一条命中的。

   | 条件 | code |
   |---|---|
   | 售后不是 `none` 也不是 `closed` | after_sale |
   | 订单 `cancelled` / `closed` | cancelled / closed |
   | 支付 `unpaid` / `paying` / `pay_failed` | unpaid |
   | 履约 `unfulfilled` | to_make |
   | 履约 `producing` 且 `qualityGate.passed is False` | qc_failed |
   | 履约 `producing` | producing |
   | 履约 `ready_to_ship` | ready_to_ship |
   | 物流 `exception` | logistics_issue |
   | 履约 `shipped` | shipped |
   | 履约 `delivered` 或订单 `completed` | completed |
   | 其他 | producing（并在函数里写注释“不应出现”） |
4. **`progress`**：
   - `show` 为假的情况：订单取消或关闭、支付在退款三种状态之一、售后不是 `none` / `closed`。
   - 四步：`ordered` 下单（`at` = `createdAt`）；`producing` 制作（`at` = `statusHistory` 里第一条 `fulfillmentStatus` 变成 `producing` 的时间）；`shipping` 运输（第一条变成 `shipped` 的时间，没有就取 `logistics.shippedAt`）；`delivered` 签收（`logistics.signedAt`）。`done` = 这一步的时间不为空。`label` 从 `contract.PROGRESS_STEPS` 取。
5. **挂到接口上**：
   - `user_api.public_order`：在算出 `allowedActions` 之后加 `out['customerStatus'] = order_view.customer_status(order, out['allowedActions'])`、`out['progress'] = order_view.progress(order)`。
   - `commerce.order_detail` 和 `commerce.list_orders` 的每一项：加 `opsStatus`。
   - 原有字段一个都不删。
6. 新建 `server/tests/test_order_view.py`：**表驱动**，步骤 2 表里每一行至少一个用例（共 15 个以上），步骤 3 表里每一行一个用例，步骤 4 至少 3 个（正常四步、取消时不显示、只到运输）。用例里的订单用一个 `make(**groups)` 的小函数造，只填五组状态和需要的字段。再加一个用例：`public_order` 的输出里有 `customerStatus`、`progress`，`commerce.order_detail` 里有 `opsStatus`。

### 不要做
- 不改 `contract.py`；不改任何状态迁移；不改前端文件。

### 验收
三条测试全过；`test_order_view.py` 用例数 ≥ 30。

### 停下来问
- 表里的条件和现有状态机对不上（比如某个组合不可能出现，或者出现了表里没有的组合）。

### 提示词
```
你在仓库 串个珠 里做任务卡 A2（订单展示状态）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A2 这一节，严格按步骤和表格做，只改卡里列出的文件，不改 server/contract.py。分支 agent/A2-order-view，从 origin/integration/2026-11 拉（确认里面已经有 A1 的提交）。每做完一步提交一次，提交说明以“A2:”开头。做完按 00-dispatch.md 第 5 节写 PR 描述，开 PR 后停下。
```

---

## A4b 用户订单：单个订单和发货前改地址

- **批次**：第 2 批　**开工前必须已合并**：A4a　**大小**：M
- **分支**：`agent/A4b-order-address`

### 只能改这些文件
`server/commerce.py`（新函数 `change_order_address`）、`server/user_api.py`（`order_allowed_actions`、`INTERNAL_ORDER_FIELDS`、新函数 `get_my_order`、`change_my_order_address`）、`server/app.py`（两个用户路由）、新建 `server/tests/test_order_address.py`。

### 步骤
1. **单个订单** `GET /api/my/orders/{no}`：
   - `user_api.get_my_order(db, no, uid)`：订单不存在或不是这个用户的，一律 `raise KeyError("订单不存在")`（不暴露别人的订单是否存在）；返回 `public_order(order)`。
   - `app.py` 的 `do_GET` 里，在 `/api/designs`、`/api/my/orders` 列表那段之前加 `re.fullmatch(r"/api/my/orders/([\w-]+)", path)`，要求登录（`self.user()`），`KeyError` 返回 404。
2. **改地址的业务函数** `commerce.change_order_address(db, no, data, actor, owner_id=None)`：
   - 能改的条件：订单不是 `cancelled / closed / completed`，物流是 `not_shipped`，售后是 `none`。否则 `ValueError("已经发货，改不了了")`。
   - `owner_id` 不为空时要求 `order.userId == owner_id`，否则 `KeyError`。
   - 字段：`person`（必填，≤40 字）、`phone`（必填，`^1\d{10}$`）、`addr`（必填，≤200 字）。校验和 `user_api.make_order` 里的一致（照抄那几行的规则）。
   - 用 `_atomic_order_transition` 写入：把旧的三项追加到 `order["addressHistory"]`（`{"at","actor","person","phone","addr"}`，最多保留 20 条），再更新三项；写操作记录 `_audit_record(actor, "change_address", "order", no, "")`。**操作记录和历史里不写手机号全号**，`addressHistory` 只给后台看。
3. `user_api`：
   - `INTERNAL_ORDER_FIELDS` 加 `'addressHistory'`。
   - `order_allowed_actions`：满足步骤 2 条件时加 `'edit_address'`。
   - `change_my_order_address(db, no, uid, data)`：调 `commerce.change_order_address(db, no, data, actor="customer", owner_id=uid)`，返回 `public_order`。
4. `app.py` 的 `do_POST`：`re.fullmatch(r"/api/my/orders/([\w-]+)/address", path)`，要求登录，调上面的函数。
5. `server/contract.py` 里 `ACTIONS` 加 `"edit_address": "修改地址"`，重跑 `python3 tools/export_contract.py`。（这是这张卡唯一能碰的契约改动。）
6. 测试 `server/tests/test_order_address.py`：
   - 单个订单：自己的 200；别人的 404；不存在的 404；返回里没有 `userId`、`workOrder`、`addressHistory`。
   - 改地址：待支付、制作中、待发货都能改；已发货不能；有售后不能；别人的不能；手机号格式错 400；改完 `addressHistory` 多一条；`allowedActions` 里 `edit_address` 出现和消失的时机对。

### 不要做
- 后台改地址的接口是 A4c 的事，这张卡不加。

### 验收
三条测试全过。

### 提示词
```
你在仓库 串个珠 里做任务卡 A4b（单个订单和发货前改地址）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A4b 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/A4b-order-address，从 origin/integration/2026-11 拉（确认里面已经有 A4a 的提交）。每步提交一次，提交说明以“A4b:”开头。做完开 PR 后停下。
```

---

## A4c 后台订单操作：改地址、内部备注、取消原因、去掉手动确认

- **批次**：第 3 批　**开工前必须已合并**：A2、A4b　**大小**：M
- **分支**：`agent/A4c-admin-order-ops`

### 只能改这些文件
`server/commerce.py`（`allowed_order_transitions`、`transition_order_status`、`customer_order_action` 的取消分支、新函数 `add_internal_note`）、`server/user_api.py`（`INTERNAL_ORDER_FIELDS`、`perform_order_action`）、`server/app.py`（后台路由、用户动作路由传原因）、新建 `server/tests/test_order_admin_ops.py`、`server/contract.py` 和两个导出文件。

### 步骤
1. **后台改地址** `PUT /api/admin/orders/{no}/address`：要求后台登录（现在是 `self.admin_ok()`，A8 以后会换成权限检查），调 A4b 的 `commerce.change_order_address(db, no, data, actor="admin")`，写 `self.audit_admin_mutation(path)`，返回 `commerce.order_detail`。
2. **内部备注** `PUT /api/admin/orders/{no}/note`，请求 `{"text": "..."}`：
   - `commerce.add_internal_note(db, no, text, actor)`：`text` 去掉首尾空白，1–300 字，否则 `ValueError`；追加到 `order["internalNotes"]`（`{"at","actor","text"}`，最多 100 条）；用 `_atomic_order_transition` 写；写操作记录。
   - `user_api.INTERNAL_ORDER_FIELDS` 加 `'internalNotes'`。
3. **取消原因**：
   - `contract.py` 加 `CANCEL_REASONS = ["不想要了", "想改一改再下单", "地址填错了", "其他"]`，放进 `payload()` 的 `data` 字典，**加在最后一项 `"qualityGateItems"` 的后面**（A5a 同时在改这个字典的另一处，位置分开就不会冲突）。
   - 用户动作接口 `POST /api/my/orders/{no}/actions` 的请求体允许多一个 `reason`；`user_api.perform_order_action(db, no, uid, action, reason=None)` 透传；`commerce.customer_order_action` 取消分支：`reason` 不为空时必须在 `CANCEL_REASONS` 里，否则 `ValueError`；存到 `order["cancelReason"]`，写进历史说明（“用户取消未支付订单：地址填错了”）。不带原因也能取消（兼容）。
4. **去掉手动确认订单**：
   - `allowed_order_transitions`：支付不是 `paid` 时，`orderStatus` 里不给 `confirmed`。
   - `transition_order_status`：`group == "orderStatus" and to == "confirmed"` 且支付不是 `paid` 时 `ValueError("付款后会自动确认，不用手动确认")`。
   - 先搜一遍现有测试里有没有“后台把未付款订单改成已确认”的用例；有的话**不改断言**，停下来问。
5. 重跑 `python3 tools/export_contract.py`。
6. 测试 `server/tests/test_order_admin_ops.py`：后台改地址（发货前能、发货后不能、写了 `addressHistory`）；内部备注（写入、超长报错、用户接口里没有 `internalNotes`）；取消原因（合法原因存下、非法原因 400、不带原因也能取消）；手动确认（未付款时 `allowedTransitions` 里没有 `confirmed`、直接调接口报错；已付款的订单行为不变）。

### 提示词
```
你在仓库 串个珠 里做任务卡 A4c（后台订单操作）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A4c 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/A4c-admin-order-ops，从 origin/integration/2026-11 拉（确认里面已有 A2、A4b）。每步提交一次，提交说明以“A4c:”开头。步骤 4 里发现冲突的旧测试就停下来问我。做完开 PR 后停下。
```

---

## A5a 售后类型统一和用户申请售后

- **批次**：第 3 批　**开工前必须已合并**：A4b　**大小**：L
- **分支**：`agent/A5a-after-sale-customer`

### 为什么
售后类型三方不一致（后端 3 种、设计 5 种），用户也不能自己申请售后（13 第 1.2 节 S2、S3）。

### 只能改这些文件
`server/status.py`（`AFTER_SALE_TYPES`）、`server/commerce.py`（`create_after_sale`、`_after_sale_target`、新函数 `customer_after_sale_types`、`refund_amount_for`）、`server/user_api.py`（`order_allowed_actions`、新函数 `request_after_sale`）、`server/app.py`（一个用户路由）、新建 `server/migrations/m007_after_sale_types.py`、新建 `server/tests/test_after_sale_customer.py`、`server/contract.py` 和两个导出文件。

### 步骤
1. **类型改成五种**：`status.AFTER_SALE_TYPES = ["仅退款", "退货退款", "补寄配件", "改手围重串", "拒收后退款"]`。
   - 迁移 `m007_after_sale_types.py`：把已有售后记录里 `type == "补发"` 的改成 `"补寄配件"`。照 `m006_after_sale_idempotency.py` 的写法：文件里定义 `VERSION = '007'`、`NAME = 'after_sale_types'` 和 `def up(conn, adapter)`；看 `migrations/__init__.py` 怎么发现迁移，照着注册。要能重复跑。
   - `commerce.py` 里所有写死的 `"补发"` 改成 `"补寄配件"`（搜 `"补发"`）。
   - 退款类：`("仅退款", "退货退款", "拒收后退款")`，在 `commerce.py` 顶部定义 `REFUND_TYPES`，替换现在写死的 `("仅退款", "退货退款")`。
2. **`_after_sale_target` 补新类型的流程**（不改已有类型的行为）：
   - `补寄配件`：和原来 `补发` 一样（同意后可直接 `complete`）。
   - `拒收后退款`：和 `仅退款` 一样（没有退货环节；完成要等退款，A5b 做）。
   - `改手围重串`：和 `退货退款` 一样有退货环节（`returning`）；`receive` 和 `complete` 先保持报错“改手围重串的重做流程还没接入”（重串怎么排珠要负责人定，见 15 号文档 A5 的说明，这张卡不做）。
3. **按订单阶段能申请哪些类型** `commerce.customer_after_sale_types(order, now_ms)`，返回列表（04 第 16 节）：
   - 售后不是 `none`：`[]`
   - 支付不是 `paid`：`[]`
   - 物流 `not_shipped`（还没发货，含制作中）：`["仅退款"]`
   - 物流 `shipped / in_transit / exception`：`["拒收后退款"]`
   - 物流 `delivered` 且 `logistics.signedAt` 在 7 天内：`["退货退款", "补寄配件", "改手围重串"]`
   - 其他：`[]`
   - 7 天写成常量 `AFTER_SALE_DAYS = 7`。
4. **退款金额** `commerce.refund_amount_for(order, atype)`：退款类返回已付金额（`_paid_fen(order)`），补寄配件和改手围重串返回 0。在函数里写注释“制作中退款的扣除规则待负责人定（15 号文档 E2），定了以后只改这里”。**不要自己编扣除规则。**
5. **原因选项**：`contract.py` 加
   ```python
   AFTER_SALE_REASONS = {
       "仅退款": ["不想要了", "想改一改再下单", "其他"],
       "退货退款": ["珠子有裂纹", "掉珠或断线", "珠子和图不一样", "其他"],
       "补寄配件": ["掉珠或断线", "少了配件", "其他"],
       "改手围重串": ["戴着太紧", "戴着太松"],
       "拒收后退款": ["不想要了", "其他"],
   }
   ```
   放进 `payload()` 的 `data` 字典，键名 `afterSaleReasons`，**紧跟在 `"afterSaleTypes"` 那一行后面**（A4c 同时在字典最后加东西，位置分开就不会冲突）；`ACTIONS` 加 `"request_after_sale": "申请售后"`。重跑导出脚本。
   - 退货退款、改手围重串的原因来自 04 第 17 节；另外三种 04 没写全，**这里是暂定**，PR 里写明“仅退款、补寄配件、拒收后退款的原因是暂定，待负责人确认”。
6. **用户申请** `POST /api/my/orders/{no}/after-sales`，请求 `{"type","reason","userNote","newWrist"(改手围重串必填,13–20),"idempotencyKey"}`：
   - `user_api.request_after_sale(db, no, uid, data)`：订单不是这个用户的 → `KeyError`；`type` 不在 `customer_after_sale_types` 里 → `ValueError("这个阶段不能申请这种售后")`；`reason` 必须在 `AFTER_SALE_REASONS[type]` 里；`userNote` ≤ 500 字并过 `content_security.ensure_allowed`；`refundFen` 由 `refund_amount_for` 算，**不接受前端传的金额**；然后调现有的 `commerce.create_after_sale(db, {...}, actor="customer")`。`newWrist` 存进售后记录的 `newWrist`。
   - 返回 `{"afterSale": <售后记录，去掉 history 里的 actor>, "order": public_order(...)}`。
   - `order_allowed_actions`：`customer_after_sale_types` 不为空时加 `'request_after_sale'`。
   - `app.py` 的 `do_POST` 加路由，要求登录。
7. 测试 `server/tests/test_after_sale_customer.py`：
   - 各阶段能申请的类型（表里每一行一个用例）；签收第 8 天不能申请。
   - 前端传 `refundFen` 被忽略，金额等于已付金额。
   - 原因不在列表 400；别人的订单 404；重复申请（已有售后）400；同一个 `idempotencyKey` 重复提交返回同一条。
   - 迁移：造一条 `补发` 记录，跑迁移后变成 `补寄配件`；再跑一次不报错。
   - 原有后台售后测试全部通过（类型改名后，断言里如果写了“补发”，**停下来问，不要直接改断言**）。

### 提示词
```
你在仓库 串个珠 里做任务卡 A5a（售后类型统一和用户申请售后）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A5a 这一节，严格按步骤做，只改卡里列出的文件。不要自己编退款扣除规则。分支 agent/A5a-after-sale-customer，从 origin/integration/2026-11 拉（确认里面已有 A4b）。每步提交一次，提交说明以“A5a:”开头。旧测试里写了“补发”的断言不要改，停下来问我。做完开 PR 后停下。
```

---

## A5b 模拟退款

- **批次**：第 4 批　**开工前必须已合并**：A5a　**大小**：M
- **分支**：`agent/A5b-mock-refund`

### 为什么
模拟支付已经能付款（`review/admin-workbench-fixes` 的 `d2572c9`），但售后退款还走不通：现在退款类售后在“确认退款”“完成”时一律报“真实退款服务尚未接入”。

### 只能改这些文件
`server/payments.py`（`handle_refund`）、`server/commerce.py`（`_after_sale_target`、`transition_after_sale`）、新建 `server/tests/test_mock_refund.py`。

### 步骤
1. `payments.handle_refund(order, refund_fen)` 改成返回结果而不是一律报错：
   - 先 `validate_refund_amount`。
   - `order.get("paymentChannel") == "mock"` 且 `provider() == "mock"`：返回 `"refunded"`（模拟退款直接成功）。
   - 其他情况：保持原来的 `RuntimeError("未接真实退款，禁止标记已退款")`。
   - 函数不改订单，只返回结果；改订单在 commerce 里做（同一个事务）。
2. `_after_sale_target`：新增动作 `refund`，退款类（`REFUND_TYPES`）在 `approved`（仅退款、拒收后退款）或 `returning`（退货退款）时 → `refunding`。原来 `receive`、`complete` 对退款类报错的分支保留，只是多了 `refund` 这条路。
3. `transition_after_sale`：目标是 `refunding` 时，在同一个 `_AtomicWriter` 里：
   - 调 `payments.handle_refund(order, rec["refundFen"])`；
   - 成功：订单支付 `paid → refunding → refunded`（两次 `status.validate_transition`，都写历史，说明“模拟退款”或“退款”），`rec["refundedFen"] = rec["refundFen"]`，`rec["reservedFen"] = 0`，售后再推到 `completed`；
   - `RuntimeError`（真实通道）：整个事务不提交，抛 `ValueError("真实退款服务尚未接入")`，售后状态不变。
4. 后台接口不用改：`POST /api/admin/after-sales/{no}/transition` 已经按 `action` 调 `transition_after_sale`，前端传 `action: "refund"` 即可。
5. 测试 `server/tests/test_mock_refund.py`（参照 `tests/test_mock_payment.py` 的 `_clean_env` 和造单方法，先用模拟支付把订单付掉）：
   - 仅退款：申请 → 同意 → 审核通过 → `refund` → 售后 `completed`、订单支付 `refunded`、`refundedFen` 等于实付。
   - 退货退款：同意 → 审核通过 → 记录退货物流 → `refund` → 同上。
   - 没开模拟支付（`PAYMENT_PROVIDER` 不设）或订单不是模拟付款：`refund` 报错，售后和订单都不变。
   - 正式环境（`ENV=production`）不可能出现模拟退款（`provider()` 返回 none）。

### 提示词
```
你在仓库 串个珠 里做任务卡 A5b（模拟退款）。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/backend-wave1.md 里 A5b 这一节，严格按步骤做，只改卡里列出的文件。真实退款路径必须保持报错。分支 agent/A5b-mock-refund，从 origin/integration/2026-11 拉（确认里面已有 A5a）。每步提交一次，提交说明以“A5b:”开头。做完开 PR 后停下。
```
