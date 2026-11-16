# 速度、截图、实拍图、AI 设置（2026-11-16 负责人同意）

> 共同规矩：照 `02-prompts.md` 总提示词；测试放 `server/tests/`、`miniprogram/tests/`；小程序页面卡照 `followups-ui.md` 开头的规矩（U0 组件、`check-ui.py`、截图）；后台卡 `npm run build` 能过、打包文件不提交；不加新依赖。

## T2 截图脚本：自动等加载完、加测速

- **依赖**：无　**谁做**：在装了微信开发者工具的那台电脑上　**只能改**：`tools/shoot/*`
1. 每页截图前自动等到“数据加载完”：页面 `data` 里约定一个 `ready: true`（脚本轮询 `page.data('ready')`），最多等 10 秒；页面还没有 `ready` 字段的，退回等到骨架消失（页面上没有 `c-skeleton`）再截。超时就在输出里标“未加载完”，不静默截图。
2. 截图前检查画面里有没有 `NaN`、`undefined`、`¥0.00`（价格为 0 的商品除外）、“0 种”，有就标红警告。
3. 加 `--timing`：冷启动（清掉本机缓存后打开）和有缓存各跑一次，记下每页从打开到 `ready` 的毫秒数，输出一张表到 `docs/reports/shots/<卡号>/timing.md`。
4. README 写清楚页面怎么约定 `ready`（P1 会在主要页面加上）。

## P1 加载速度

- **依赖**：无（和 U15、W1、V3 不改同一批文件）　**只能改**：`miniprogram/utils/api.js`（`catalog` 那一段）、`miniprogram/app.json`（只加 `preloadRule`）、`server/app.py` 的 `/api/catalog` 那一段、新建 `miniprogram/tests/catalog-cache.test.js`、`server/tests/test_catalog_version.py`；首页、工作台、手串详情、订单详情四页的 `.js` 里只加一行 `ready` 标记
- **标准**：有缓存时任何页面 1 秒内出现真实内容；第一次打开、4G 网络 2.5 秒内出现第一屏。
1. **商品目录存到手机里**：`api.catalog()` 先读本机存的上一份目录立刻返回给页面，同时后台向服务器请求；服务器返回的版本号和本机一样就不更新，不一样就换上新目录并通知页面刷新。本机存储用 `wx.setStorageSync`，键带版本号，大小超过 1MB 就不存。
2. **服务器目录加版本号**：`/api/catalog` 返回里加 `version`（商品、模板、宣传位、计价配置内容的摘要，任何一项变了就变）；请求带 `?v=<本机版本>` 且一致时，返回 `{"unchanged": true, "version": ...}`，不再传整份。
3. **分包预加载**：在首页预先下载工作台和手串详情所在的分包（`preloadRule`，网络 `all`）；AR 试戴分包不预加载。
4. **ready 标记**：首页、工作台、手串详情、订单详情四页在第一屏内容渲染出来时 `setData({ ready: true })`，给 T2 测速用。
5. **测试**：本机有目录时，`catalog()` 不等网络就返回；服务器版本一致时不替换；版本变了会替换并通知；后端版本号在改商品、改计价配置后会变。
6. 用 T2 的 `--timing` 跑一次，改前改后的耗时表放进报告。T2 还没合并就写明，由负责人看。

## V6 小程序订单详情显示成品实拍图

- **依赖**：V3（V3 也改订单详情）　**只能改**：`miniprogram/features/order-detail/*` 里新增实拍图那一块、`server/user_api.py` 里用户订单详情返回的地方（只加一个字段）、`miniprogram/tests/` 和 `server/tests/` 里新增测试
1. 后端：用户看自己的订单详情时，多返回 `qcPhotos: [url]`（V5 存在工单里的成品照），只在订单已发货以后才返回；没有就是空数组。不返回质检人、质检备注这类内部信息。
2. 小程序：订单详情里，手串图下面加一块“实拍图”：横排缩略图（直角，用 `c-skeleton` 占位），点开 `wx.previewImage` 看大图；没有实拍图就不显示这一块。
3. 测试：发货前不返回；发货后返回；不带内部字段。截图：有实拍图的已发货订单一张。

## AI1 后台“AI 设置”（后端）

- **依赖**：无　**只能改**：新建 `server/ai_settings.py`、`server/routes/ai_settings.py`、`server/tests/test_ai_settings.py`；`server/ai/__init__.py` 里选服务商的 `provider()` 那一段
- **原则**：密钥只放服务器环境变量，后台看不到、改不了；后台只管“用哪家、开不开、测一测、看用量”。
1. 设置存在 `settings` 表 `id = "ai"`：`{designEnabled, photoEnabled, provider, model, visionModel, updatedBy, updatedAt}`。`provider` 只能选环境变量里已经配好密钥的那几家；没配就不能选。
2. `ai.provider()` 先看这份设置：`designEnabled` 为假时 AI 配直接返回不可用，走方案库兜底；`photoEnabled` 为假时拍照做同款同理；`provider`、`model` 有值时用它，没有就照旧按环境变量选。
3. 接口（权限 `manage_accounts`）：
   - `GET /api/admin/ai-settings`：当前设置，加上每家服务“已配置 / 未配置”，已配置的只显示密钥最后 4 位。
   - `PUT /api/admin/ai-settings`：改开关、服务商、模型；不合法 400；记操作记录。
   - `POST /api/admin/ai-settings/test`：用当前设置发一句固定的测试话（“帮我配一条清爽的手串”），返回成功与否、耗时毫秒、模型名；不记进 AI 对话记录。
   - `GET /api/admin/ai-settings/usage?days=7`：按天统计 AI 配和拍照的调用次数、失败次数、平均耗时（读 B-12 的 `ai_logs`）。
4. 测试：关掉开关后 AI 配走兜底；选没配密钥的服务商 400；返回里永远没有完整密钥；测试接口用假的服务商测。

## AI2 后台“AI 设置”页面

- **依赖**：AI1　**只能改**：新建 `admin-web/src/pages/aiSettings.tsx`；`admin-web/src/layout/` 里菜单加一项“AI 设置”（放在“系统”下面，权限 `manage_accounts`，用 `<Can>`）
1. 一页四块：当前状态（用的哪家、哪个模型、密钥是否已配置）、开关（AI 配、拍照做同款）、切换服务商和模型（只列已配置的）、“测试一下”按钮（显示成功或失败、耗时）。
2. 下面一张用量表：最近 7 天每天的调用次数、失败次数、平均耗时。
3. 页面写一句说明：“密钥在服务器上配置，这里看不到也改不了。”
4. 后台界面不出现英文代码；`npm run build` 能过；写明需要负责人在浏览器看。

## R1 补寄配件：需要时让用户寄回维修（2026-11-16 负责人提出）

- **依赖**：无（A5c 的重串工单、C9b 的填寄回单号都已合并，本卡复用它们）　**只能改**：`server/commerce.py` 里售后流转 `_after_sale_target` 和 `create_rework_order` 中跟“补寄配件”有关的分支、`server/routes/my_after_sales.py` 的 `customerActions` 判断、`server/routes/rework_orders.py`（如需）、`admin-web/src/pages/afterSales/detail.tsx` 的“同意”那一块和重串入口、`server/tests/` 新增 `test_after_sale_repair_return.py`
- **现在的问题**：售后类型“补寄配件”只能由我们直接寄配件，同意以后只有“完成”。掉珠、断线这类问题，常常需要用户把手串寄回来修，现在没有这条路。
- **怎么做（处理方式由后台定，用户不用选）**：
  1. 后台点“同意”时，“补寄配件”多一个选择：**直接补寄**（照旧，我们寄配件，填单号后完成）或**寄回维修**。选了寄回维修，售后记录存 `handling: "repair_return"`。
  2. 寄回维修的流程和“改手围重串”完全一样，复用现有的：同意 → 用户在小程序填寄回单号（C9b 的 `submit_return`，`customerActions` 要把这种情况算进去）→ 后台“确认收到”（状态 `received`）→ “生成维修工单”（复用 A5c 的重串工单，手围不变，珠序照抄原订单，可以改珠序、必须写备注）→ 做单、质检、发货 → 售后完成。
  3. 文案区分：这种工单在后台显示“维修工单”（不是“重串工单”），用户看到的状态说明写“我们收到手串后会尽快修好寄回”。
  4. **运费**：寄回和寄出的运费、换下来的珠子补不补差价，**系统里都不算**，客服线下沟通，和改手围重串一样；维修工单上写一行“运费和差价已线下沟通”。
  5. 选“直接补寄”的老流程不变。
- **测试**：补寄配件选寄回维修后，用户能填寄回单号；收到后能生成维修工单；工单走完发货后售后变成完成；选直接补寄的照旧只能“完成”；原订单金额不变；改珠序不写备注 400。
- 后台截图需要负责人在浏览器看；小程序不改页面（按钮来自后端的 `customerActions`），但要用 tools/shoot 截一张“已同意、寄回维修”状态的售后详情，确认出现了“填写寄回单号”。
