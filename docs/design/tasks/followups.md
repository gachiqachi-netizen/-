# 后续小卡 F1–F7（2026-11-13 审卡时攒下的，负责人同意派出）

> 共同规矩：照 `02-prompts.md` 的总提示词做；测试一律放 `server/tests/` 或 `miniprogram/tests/`；后台卡第一次先 `cd admin-web && npm ci`，打包文件不提交；后台按钮用 `src/permissions.ts` 的 `can()` / `<Can>` 按权限藏（没权限不渲染，不是变灰）。

## F1 后台做单页：贺卡、不放价格单据、质检人

- **依赖**：无　**只能改**：`admin-web/src/pages/workOrders/` 下的文件

1. 工单页显示 B-11b 给的 `giftCard`（有就显示整段，标题“贺卡”）和 `hidePrice`（为真时红字一行“包裹里不放带价格的单据”，这是整页唯一允许的第二处红字）。
2. 质检人不再手填：A8d 已经让后端固定用当前账号，页面上的输入框删掉，改成只读显示当前账号名字（取 `GET /api/admin/me` 的 `name`）；本机 localStorage 里存的质检人键一并删掉。
3. `npm run build` 通过；报告里写清要负责人在浏览器看的页面。

## F2 后台订单详情：“显示全号”按钮

- **依赖**：无　**只能改**：`admin-web/src/components/OrdersView.tsx` 里收货人那一块、`admin-web/src/pages/orders/orderOps.tsx`

1. 有 `view_full_contact` 权限时，收货人电话旁边出现“显示全号”；点了调 A8c 的 `POST /api/admin/orders/{no}/reveal`，把返回的电话和地址替换显示 60 秒后恢复打码。没有权限时按钮不渲染。
2. “复制”按钮：有权限时先调 reveal 再复制全号；没权限时复制按钮不渲染。
3. 后端每调一次 reveal 都会记操作记录，页面不用另记。

## F3 后台寄回地址设置

- **依赖**：无　**只能改**：新建 `admin-web/src/pages/afterSales/returnAddress.tsx`；`admin-web/src/pages/afterSales.tsx` 只加入口按钮“寄回地址”和挂载

抽屉：收件人、电话、地址、备注四项；接口 C9b 的 `GET / PUT /api/admin/return-address`；必填和格式错误把后端 400 的原因显示在对应框下；保存后显示“谁、什么时候改的”。没有 `process_after_sales` 权限时入口不渲染。**上线前负责人要在这里填好真实地址。**

## F4 删除 AI 配接口的两个兼容旧字段

- **依赖**：C11a（C11a 可能改 `pages/ai/ai.js`，避免撞车）　**只能改**：`server/ai/__init__.py` 的 `design_response`、`server/tests/test_ai_design_response.py`、`miniprogram/pages/ai/ai.js`、`miniprogram/tests/ai-page.test.js`

1. `design_response` 返回里删掉 `designs`、`reply`，只留 `message`、`plans`、`quickReplies`。
2. `ai.js` 不再读 `design.designs`、`design.reply`；有 plans 走 plans，没有走方案库兜底（照旧）。
3. 测试改成断言返回里没有这两个字段；小程序测试改成只给 plans。

## F5 后台其余页面的按钮按权限藏

- **依赖**：KD2（避免和 KD2 改同一批知识库文件）　**只能改**：`admin-web/src/pages/` 下的 `reviews.tsx`、`home.tsx`、`articles.tsx`、`terms.tsx`、`accounts.tsx`、`knowledge.tsx` 和 `knowledge/`、`orders/contentTools.tsx`

只给写操作的按钮包 `<Can>`：评价审核 `moderate_reviews`；首页、文章、分享 `edit_content`；条款 `publish_terms`；账号和角色 `manage_accounts`；知识库编辑和退回 `edit_kb`；用户查询 `lookup_users`。页面逻辑不改。报告附一张表：每个角色在每页能看到哪些按钮，标“需要负责人在浏览器验”。

## F6 禁用词表补功效类说法

- **依赖**：无　**只能改**：`kb/data/attributes.json` 的 `banned`、`server/tests/test_kb_rules.py`

1. `banned` 加这几个词（每个写上 `reason`，照现有条目的格式）：治失眠、治病、根治、疗效、药效、改善睡眠。已有的“治愈、治疗、助眠、降血压”不动。
2. 加完跑 `python3 kb/validate.py`，必须还是“200/200、有问题 0 条”；有珠子的文字因此不合格就**停下来问**，不要改珠子数据。
3. 跑 `python3 tools/export_contract.py`（契约里的 bannedWords 会跟着变），提交两个生成文件。
4. 测试：`kb.banned_in("能治失眠")` 命中；B-2 评价里写“治失眠”变成机审不通过。

## F7 保存作品时检查名字里的功效词

- **依赖**：无　**只能改**：`server/user_api.py` 的 `design_data`、新建 `server/tests/test_design_name_banned.py`

1. `design_data` 里作品名过 `kb.banned_in`，命中抛 `ValueError("名字里不要写功效类的词")`。保存作品、创建分享都走这个函数，一处改两处生效。
2. 已经存在的作品不批量处理，只拦新的保存。
3. 测试：名字带“招财”保存 400；带“治失眠”（F6 合并后）400；正常名字照常保存；创建分享同样拦。
