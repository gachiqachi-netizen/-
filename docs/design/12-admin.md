# 12 后台设计（2026-11-12）

> 负责人：原来的后台太丑，要好用、能用。本文是后台改版的开发依据，稿子见 [mockups-admin.html](mockups-admin.html)（A01–A14）。
> 背景：分支 `codex/admin-production-workbench` 用 shadcn-admin 重做了后台，但前端和后端的字段、状态代码多处对不上，模板、工单、物流几页实际用不了（审核记录见第 7 节）。后端问题已在分支 `review/admin-workbench-fixes` 修好。
> 稿子只在浏览器里看过，没有接真实接口。

## 1. 谁在用、每天做什么

| 谁 | 每天做什么 | 最常用的页 |
|---|---|---|
| 做单师傅 | 领料、按顺序穿、质检 | 做单（工单列表、工单页） |
| 客服 | 看新订单、发货、处理售后 | 今天、订单、售后 |
| 运营 | 上下架珠子、改价、建模板、写条款和轮播 | 珠子与配件、模板、条款 |

所以：进后台第一屏是“今天要处理”的待办；做单页单独占一整页，字大，平板横屏也能用。

## 2. 信息架构

左侧菜单（宽 200，分组小标题灰色）：

- 今天
- 生产：做单（右侧数字 = 待领料 + 质检不通过）
- 交易：订单、售后（右侧数字 = 待处理）
- 商品：珠子与配件、模板
- 内容：轮播、条款
- 系统：操作记录

物流不单独成页：发货在订单详情里做，“待发货”“已发货”“物流异常”是订单列表的分栏。原后台的“工作台总览”“物流运单中心”“宣传位与操作审计”拆进上面这些页。

## 3. 通用规则（每页都适用）

1. **布局**：左菜单 + 顶栏（页面标题、全局搜索“搜订单号、手机号后 4 位”）+ 内容区。列表页一律是“状态分栏（带数量）→ 筛选行 → 表格”；点一行从右边拉出详情抽屉（宽 560），抽屉底栏放操作，主操作在最右。
2. **样式**：沿用小程序的白盒——白底、黑字 #111、灰色辅助字、细分隔线 #ececec、页面底 #f6f6f6。能点的是胶囊（按钮、标签、分段），只看的是直角（卡片、表格、抽屉）。字号：页面标题 20、正文 14、表格辅助字 12；表格行高 52。
3. **颜色**：只有黑、白、灰。**红色只用于**物流异常、质检不通过、库存不足（“剩 N”）、删除。状态一律是文字，不用彩色徽章、不用彩色大数字、不加装饰图标。
4. **文案**：员工看得懂的中文。界面上不出现字段名和英文代码（designSnapshot、workOrder、五维状态机……一律不出现）。状态词只用第 5 节表里的中文。
5. **按钮**：文字是动作（发货、改成待发货、同意，请用户寄回）。做不了的按钮变淡，下面一行写原因（后端拒绝的原因原样显示）。不能撤回的操作（取消订单、删除、拒绝售后、发布条款）放底栏左边，点了二次确认。
6. **敏感信息**：列表里手机号只显示后 4 位，详情里才显示全号。内部备注和给用户的说明分成两个框，只有后者会发给用户。
7. **金额**：输入写元，存整数分（框下小字“存成整数分：1800”）。显示写到元。价格一律以后端 `pricing.quote` 的结果为准，前端不自己算。
8. **寓意**：珠子的寓意只读，来自知识库；模板的寓意从配方里珠子的知识库关键词中勾选。不提供手写寓意的框。一句介绍保存前过禁用词表。
9. **状态**：每个列表都有加载中（行骨架）、空（一句话 + 出路）、失败（一句原因 + 再试一次）。一个区块同一时刻只显示一种。
10. **登录**：口令框为空，不预填、不提示默认口令。

## 4. 订单的“当前状态”（订单列表一列一个词）

后端有五组状态，列表只显示一个合成的词，规则按顺序取第一条命中的：

| 条件 | 显示 |
|---|---|
| 售后状态不是 `none` | 售后中（详情里写具体售后状态） |
| 订单状态 `cancelled` / `closed` | 已取消 / 已关闭 |
| 支付状态 `unpaid` / `paying` / `pay_failed` | 待支付 |
| 履约 `unfulfilled` | 待制作 |
| 履约 `producing` 且质检不通过 | 质检不通过（红） |
| 履约 `producing` | 制作中 |
| 履约 `ready_to_ship` | 待发货 |
| 物流 `exception` | 物流异常（红） |
| 履约 `shipped` | 已发货 |
| 履约 `delivered` 或订单 `completed` | 已完成 |

这个函数写在前端一处，配单元测试覆盖每一行。订单列表的分栏用同一套词。

## 5. 前后端对照表（前端必须照这张表，不能另起代码）

| 组 | 后端代码 → 中文（以 `server/status.py`、`server/commerce.py` 为准） |
|---|---|
| 订单 `orderStatus` | pending_confirmation 待确认 · confirmed 已确认 · cancelled 已取消 · completed 已完成 · closed 已关闭 |
| 支付 `paymentStatus` | unpaid 待支付 · paying 支付中 · paid 已支付 · pay_failed 支付失败 · refunding 退款中 · refunded 已退款 · refund_failed 退款失败 · closed 已关闭 |
| 履约 `fulfillmentStatus` | unfulfilled 待制作（后端现在叫“待履约”，见第 8 节）· producing 制作中 · ready_to_ship 待发货 · shipped 已发货 · delivered 已签收 · exception 物流异常 · returned 已退回 |
| 物流 `logisticsStatus`（不是 shippingStatus） | not_shipped 未发货 · shipped 已发货 · in_transit 运输中 · delivered 已签收 · exception 物流异常 · returned 已退回 |
| 售后 `afterSaleStatus` | none 无售后 · requested 申请中 · reviewing 审核中 · approved 已同意 · rejected 已拒绝 · returning 退货中 · refunding 退款中 · completed 售后完成 · closed 售后关闭 |
| 售后类型 | 仅退款 · 退货退款 · 补发（后端存中文） |
| 商品类型 | bead 珠子 · spacer 隔珠/隔片 · pendant 吊坠 · cord 线材 · packaging 包装 |
| 商品状态 | draft 草稿 · on_sale 在售 · off_sale 已下架 · archived 已归档 |
| 条款状态 | draft 草稿 · published 已发布 · disabled 已停用 |
| 条款场景 `scope.scenarios` | all 全部订单 · custom_diy 自己串的 · template 按模板下单 · ai AI 配的 · gift 送礼 · cord 选了穿绳 · safety_warning 含需要注意的材料 |
| 工序 `workOrder.step` | 后端存中文：待领料 · 配珠排序 · 穿制打结 · 待质检 · 已完工（前端直接发这五个词） |
| 工单状态 `workOrder.status` | pending 待开始 · producing 制作中 · qc_passed 质检通过 · qc_failed 质检不通过 · ready_to_ship 待发货 · shipped 已发货 |
| 质检 `quality-gate` 请求 | sequenceOk 珠子顺序 · sizeOk 长度 · materialOk 用料 · appearanceOk 外观（四个布尔值都必填）· inspector 质检人 · note 原因（不通过时必填） |
| 模板展开 `templates/expand` 返回 | count 颗数 · lengthMm 总长 · targetMm 目标长度 · fitOk 是否合适 · goodsFen 珠子 · handworkFen 手工费 · shippingFen 运费 · totalFen 到手价 · materials[].count / subtotalFen · sequence[].seq |

**做法**：前端建一个 `labels.ts`，内容逐字来自这张表；再加一个契约测试，启动时请求 `/api/admin/orders` 等接口，检查返回里出现的每个状态代码在 `labels.ts` 里都有。

## 6. 逐页说明（稿号 A01–A14）

| 稿 | 页 | 焦点 | 数据从哪来 | 要点 |
|---|---|---|---|---|
| A01 | 登录 | 输口令 | `POST /api/admin/session` | 口令框为空；输错时框下红字“口令不对”；连续 5 次锁 10 分钟（后端已有） |
| A02 | 今天 | 今天要处理哪几件事 | 订单列表按第 4 节合成后计数；售后待处理数；库存 < 10 的珠子 | 一行一件事：状态、数量、一句说明、去处理；点了进对应列表并选好分栏。右边最近操作 4 条 |
| A03 | 做单 · 列表 | 今天做哪几单、做到哪一步 | `GET /api/admin/work-orders?status=&assignee=&q=` | 只列已付款的单；分栏是五道工序 + 质检不通过；工序一个词，不用进度条 |
| A04 | 做单 · 工单页 | 按什么顺序穿、用哪些料 | `GET /api/admin/orders/{no}/work-order`；`PUT .../work-order`（assignee、step、operatorNote）；`PUT .../quality-gate` | 顶部三个数字 + 负责人；工序五段，点一段即保存；编号珠序按顺序排（不画圆环）；领料清单可逐行勾“已领”（只存本机）；质检四项全勾才能“通过”；珠序和用料不能改；“打印工单”打印珠序和清单 |
| A05 | 做单 · 质检不通过 | 哪项不过、怎么返工 | 同上 | 原因必填；提交后顶部留浅红说明，工序回到“穿制打结”；再次通过后消失 |
| A06 | 订单 · 列表 | 每一单在哪一步 | `GET /api/admin/orders` | 一列“状态”（第 4 节）；手机号后 4 位；物流异常红字；“导出表格”导出当前筛选 |
| A07 | 订单 · 详情 | 现在怎样、下一步能做什么 | `GET /api/admin/orders/{no}`（allowedTransitions） | 状态区：大字主状态 + 一行另外三组；按钮来自 allowedTransitions，文字写成动作；做不了的变淡并写原因。手串、金额、收货、记录（只给后台看）。底栏：取消订单（左，二次确认）、去工单 / 发货（右） |
| A08 | 订单 · 发货 | 快递和单号 | `PUT .../status`（group=fulfillmentStatus, to=shipped, logistics） | 两项必填；确认后浮动提示“已发货” |
| A09 | 售后 · 审核 | 同不同意、给用户说什么 | `GET /api/admin/after-sales`；`POST .../transition` | 底栏按钮随状态变；拒绝必须写“给用户的说明”；内部备注另一个框 |
| A10 | 珠子与配件 · 列表 | 有哪些料、还剩多少 | `GET /api/admin/beads` | 分栏是商品类型；库存 < 10 红字“剩 N”；行上没有删除 |
| A11 | 珠子与配件 · 编辑 | 这颗珠子的资料 | `POST/PUT /api/admin/beads` | 两列表单；单价写元存分；寓意只读（知识库）；被模板或订单用过只能下架，删除被拦并说明 |
| A12 | 模板 · 编辑 | 配方和不同手围的样子 | `GET /api/admin/templates`；`POST /api/admin/templates/expand` | 配方三行（开头、循环、结尾）可拖动；13–19cm 分段预览，数字来自 expand（count、lengthMm、targetMm、totalFen）；寓意从珠子的知识库关键词里勾；有下架珠子时提示 |
| A13 | 条款 · 适用范围 | 对哪些订单生效 | `GET/POST/PUT /api/admin/terms` | 全部订单 / 指定的订单；场景用第 5 节的中文名；发布二次确认“发布后新订单立即使用”；已下的订单不受影响 |
| A14 | 操作记录 | 谁、什么时候、改了什么 | `GET /api/admin/audit` | 只读；对象可点跳转 |

轮播页沿用条款页的列表 + 抽屉版式（标题、寓意关键词、对应款式、封面图、排序、上下线），稿子不单独画。

## 7. 对 `codex/admin-production-workbench` 前端的审核结论（2026-11-12）

在本地起服务、用测试口令登录后逐页点过：

1. 模板页颗数、长度、价格全是 0：前端读 `beadCount`、`totalLengthMm`、`subtotal`，后端给的是 `count`、`lengthMm`、`subtotalFen`。
2. 工单的工序保存失败（“工序阶段不正确”）：前端发 `stringing` 等英文代码，后端只收五个中文词。
3. 物流状态按钮永远不出现：前端用 `shippingStatus`，后端是 `logisticsStatus`。
4. 制作、支付、售后、商品类型、条款场景五组代码前后端不一致；保存指定场景的条款会被后端拒绝。
5. 登录页预填 `local-dev-only` 并明文提示默认口令，正式环境也显示。
6. `admin-web/package.json` 没有依赖、没有锁文件和入口页，提交进来的打包文件无法从源码重新生成。
7. 旧后台 `server/static/admin/{orders,templates,terms}.js` 还在修改，但新页面已不加载它们。

后端三个必须修的问题（用户订单接口带出工单和质检信息、质检可绕过、模板展开另算 ¥15 手工费和另写尺寸规则）已在 `review/admin-workbench-fixes` 修好并加了测试。

## 8. 开发任务（前端，交给执行 agent）

前提：在 `review/admin-workbench-fixes` 之上开新分支；这台机器之外装好 node 才能打包。

| # | 任务 | 验收 |
|---|---|---|
| AD1 | 补齐 `admin-web` 工程：依赖和锁文件、`index.html`、`tsconfig`、打包脚本；`server/static/admin/` 里的打包产物由 `npm run build` 生成 | 新目录 `npm ci && npm run build` 能生成和提交一致的文件；README 写清命令 |
| AD2 | 按第 5 节建 `labels.ts` 和契约测试，替换现有 LABELS；删掉前端自造的代码 | 契约测试通过；全站搜不到 `in_production`、`shippingStatus`、`custom_bracelet`、`charm`、`stringing` |
| AD3 | 字段对齐：模板预览、工单、物流、条款按第 5 节读写 | 模板页显示 19 颗 162mm（好运连连 15cm）；工单改工序成功；已发货订单出现物流状态按钮；指定场景的条款能保存 |
| AD4 | 版式和样式按第 3 节、稿 A01–A14 重做；去掉统计卡片图标、彩色数字、代码名 | 每页和稿子并排截图；截一屏数颜色：黑、白、灰，红色只出现在第 3.3 条的四种地方 |
| AD5 | 订单“当前状态”合成函数（第 4 节）和单元测试 | 测试覆盖表里每一行 |
| AD6 | 工单页（A04、A05）：编号珠序、领料勾选、工序分段、质检、打印 | 平板横屏（1180×820）截图；质检四项不全时“通过”不可点；不通过必须填原因；打印预览只有珠序和清单 |
| AD7 | 登录页去掉预填和默认口令提示 | 打包产物里搜不到 `local-dev-only` |
| AD8 | 删掉不再加载的旧后台脚本（或在 `admin.html` 里明确保留为备用入口，二选一，由负责人定） | 仓库里没有不被引用的后台 JS |

后端小改（AB，按需）：`status.py` 里 `unfulfilled` 的中文从“待履约”改成“待制作”（要同时看契约测试）；“今天”页的计数如果前端算太慢，再加一个 `/api/admin/today` 汇总接口。
