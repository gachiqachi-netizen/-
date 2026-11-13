# D5b 交付报告

## 1. 步骤
1. `src/pages/afterSales.tsx`（替换原来转发到 components/OperationsViews 的占位）：售后列表。分栏：全部/待处理（申请中+审核中）/退货中/退款中/已完成，带数量；搜索框（售后单号、订单号）；表格列：售后单、订单（手串名+订单号）、类型、原因、退款（`fenToYuan`）、状态（拒绝红字）、申请时间、处理 ›。
2. `src/pages/afterSales/detail.tsx`：处理抽屉（稿 A09）。申请块（类型/原因/用户说明/退款金额-标注“后端算好”/联系电话——后端暂无这两个字段时显示 —）；订单块（看订单 ›）；处理块：一个“给用户的说明”框（placeholder 写明“拒绝时必填，用户能看到”）；协商历史块（时间 + 操作人 + 状态变化 + 说明）。
3. 底栏按钮**只来自后端 `allowedActions`**（`after_sale_allowed_actions` 用 `_after_sale_target` 裁决，做了的就是当前状态合法的动作）：申请中/审核中 → 拒绝 / 同意；退货物流（returning）和补寄配件完成（complete）先弹快递公司+单号两个必填框，随 `returnLogistics` 一起提交；确认退款（refund）走 A5b 的 `transition action: "refund"`（同一事务里退款，售后 → completed、订单 → refunded）。
4. 拒绝时前端校验“给用户的说明”非空；后端拒绝原因原样显示在框下。没有合法动作时不显示底栏。
5. 类型直接用中文（`AFTER_SALE_TYPES` 本身就是中文词），状态词从 `CONTRACT.statusLabels.afterSaleStatus` 取。

## 2. 验收
- 底栏按钮随状态和类型变、只来自后端：已实现。
- 拒绝必须写给用户的说明：已实现（前端校验 + 说明进 `note`）。
- 确认退款调 transition refund：已实现。
- 样子（稿 A09）：需要负责人本地验。

## 3. 改了的文件
```
 admin-web/src/pages/afterSales.tsx        | 重写（列表）
 admin-web/src/pages/afterSales/detail.tsx | 新建（处理抽屉）
```

## 4. 测试
- 开工前基线：后端 335 OK（skipped=7）、小程序 138/138。
- 交付前全量：
  - `python3 -m unittest discover -s server/tests` → Ran 335 tests, OK (skipped=7)
  - `node --test miniprogram/tests/*.test.js` → pass 138 / fail 0
  - `python3 kb/validate.py` → 已填 200/200 种，有问题 0 条
  - `cd admin-web && npm run build` → ✓ built（产物未提交）

## 5. 自查
- 只改了 `src/pages/afterSales.tsx` 和 `src/pages/afterSales/`，符合“只能改”；没有再动 components/。
- 按钮完全由后端裁决，前端没有自己推售后流转。

## 6. 没做 / 没验证 / 偏离卡片
1. **内部备注框没做（请审核裁量）**：卡上写“内部备注另一个框”，但后端 `transition_after_sale` 只接收 note/returnLogistics/result，售后记录没有内部备注存储字段（订单的 `add_internal_note` 只适用于订单）。现在只有一个“给用户的说明”框。建议另出一张小卡给售后加内部备注（后端 `after_sales` 加 `internalNotes` + 一个 note 路由），前端这格留着一起补。
2. “看订单 ›”现在只提示订单号（跳到订单页打开抽屉需要 App 层支持跨页带参，超出本卡范围）。
3. 联系电话/照片：后端售后记录暂无这两个字段（B-1 未合并），抽屉里显示“—”，接口有了自动显示。
4. 样子需要负责人本地 `npm run dev` 验（A09）。
