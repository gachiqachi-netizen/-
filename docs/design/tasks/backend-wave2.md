# 后端任务卡 · 第二波及以后

> 派活批次见 [00-dispatch.md](00-dispatch.md) 第 2 节（第 5–9 批）。第一波的共同规矩全部适用（见 [backend-wave1.md](backend-wave1.md) 开头）。
> **第二波起多两条规矩，为的是能并行**：
> 1. **新接口不改 `server/app.py`**：写在 `server/routes/<领域>.py` 里（A11 建好的机制），`app.py` 会自动加载。
> 2. **新功能的业务逻辑放新模块**（`server/reviews.py`、`articles.py`、`uploads.py`、`accounts.py`……），不往 `commerce.py`、`user_api.py` 里加大段代码；只有卡片明确写了的函数才能改这两个文件。
>
> **提示词统一用这个模板**，把尖括号换掉：
> ```
> 你在仓库 串个珠 里做任务卡 <卡号>（<卡名>）。先确认 origin/integration/2026-11 里已经有 <依赖卡号> 的提交，缺了就停下来告诉我。先读 docs/design/tasks/00-dispatch.md 的第 1、3、4、5 节，再读 docs/design/tasks/<卡片所在文件> 开头的规矩和 <卡号> 这一节，严格按步骤做，只改卡里列出的文件。分支 agent/<卡号>-<英文简述>，从 origin/integration/2026-11 拉。每做完一步提交一次，提交说明以“<卡号>:”开头。碰到“停下来问”的情况就停下来问我。做完按 00-dispatch.md 第 5 节写 PR 描述，开 PR 到 integration/2026-11 后停下，不要开始别的卡。
> ```

---

## A11 路由拆分（第一波第 4 批）

- **依赖**：无（但要等第 3 批合并完再开工，避免和 A4c、A5a 改 `app.py` 撞车）　**大小**：S

**只能改**：`server/app.py`（只加加载和分发，不搬现有路由）、新建 `server/routes/__init__.py`、`server/routes/_example.py`、`server/tests/test_routes_registry.py`。

**步骤**
1. `server/routes/__init__.py`：
   ```python
   """新接口的注册处：每个领域一个文件，文件里定义 ROUTES = [(方法, 正则, 处理函数, 需要什么登录)]。
   需要什么登录："public" 不登录；"user" 用户登录；"admin" 后台登录（A8b 以后会变成权限点名字）。"""
   import importlib, pkgutil, re
   def load():
       table = []
       for m in pkgutil.iter_modules(__path__):
           if m.name.startswith("_"):
               continue
           mod = importlib.import_module(f"routes.{m.name}")
           for method, pattern, fn, auth in getattr(mod, "ROUTES", []):
               table.append((method, re.compile(pattern), fn, auth))
       return table
   ```
   处理函数签名：`fn(ctx, match, data) -> (状态码, 返回体)`；`ctx` 里有 `db`、`user_id`（用户登录时）、`admin`（后台登录时为真）、`qs`（查询参数）。
2. `app.py`：模块加载时 `import routes; ROUTE_TABLE = routes.load()`；在 `do_GET / do_POST / do_PUT / do_DELETE` 里**现有路由都匹配不上、返回 404 之前**，先查 `ROUTE_TABLE`：方法和正则都匹配就按 `auth` 检查登录（沿用 `self.user()`、`self.admin_ok()`），不通过返回 401；通过就调处理函数，`ValueError` 返回 400、`KeyError` 返回 404（和现有的处理一致）；后台写操作同样调 `self.audit_admin_mutation(path)`。
3. `routes/_example.py`：一个示例（文件名以下划线开头，不会被加载），写清楚怎么加一个接口。
4. 测试：临时写一个测试用的路由模块（在测试里动态插入 `ROUTE_TABLE`），验证 public / user / admin 三种登录要求、400 / 404 的转换、现有路由不受影响。

---

## A12 尺寸规则统一（后端）

- **状态**：Claude 已经在 `review/admin-workbench-fixes` 的 `10f3b78` 做完（负责人 2026-11-13 定：统一成小程序工作台那一份）。**负责人如果要撤销那次提交、交给执行 agent 做，就按这张卡重做**；不撤销就跳过这张卡。
- **只能改**：`server/plans.py`（`main_mm`、`target_for`、`target_mm`、`_fill`、`size_for_count`）、`server/commerce.py`（`build_design_snapshot` 里算主珠的那几行）、新建 `server/tests/fixtures/size_rule_cases.json`、`server/tests/test_size_rule_shared.py`。
- **规则**（以 `miniprogram/pages/editor/logic.js` 的 `stats` 为准）：主珠按整串算，排除隔片、金属珠、6mm 以下；次数一样取较小的；没有时 8mm。目标长度四舍五入 .5 进位（和 JS 的 `Math.round` 一样，不用 Python 的 `round`）。排珠每加一颗都按加上以后的整串重新算目标。
- **测试**：用例的期望值要另写一个“照搬 logic.js”的版本独立算出来，两边一致才写进 fixture；小程序那边由 C0j 读同一份 fixture。

---

## A3 计价去掉手工费

- **依赖**：A1；**负责人给出新单价表（E1）**　**大小**：S

**只能改**：`server/pricing.py`、`server/seed.py`（单价）、新建 `server/migrations/m008_unit_prices.py`、`docs/data/unit-prices.csv`（负责人给的表，原样放进来）、相关测试的期望值。

**步骤**
1. 负责人的表格式：`id,priceFen`，每行一个商品编号和新单价（整数分）。放到 `docs/data/unit-prices.csv`。表里没有的商品单价不变。
2. `pricing.HANDWORK_FEN = 0`（字段保留，返回 0，兼容旧前端）。
3. `m008_unit_prices.py`：读这张表，更新库里对应商品的 `price`（元）和 `priceFen`；照 m006 的格式（`VERSION`、`NAME`、`up(conn, adapter)`），能重复跑。`seed.py` 里的单价同步改。
4. 测试：所有写死 `1500` 的测试改成用 `pricing.HANDWORK_FEN`（这是期望值跟着规则走，不算改断言的意思）；新加一个用例：好运连连 15cm 的到手价 = 珠子合计 +（不满 ¥99 时）运费；旧订单的金额不变（订单里存的是下单时的快照）。

**停下来问**：表里有库里不存在的编号；新单价让某个热门款价格变化超过 30%（列出来给负责人看）。

---

## A7 手机号登录

- **依赖**：A11　**大小**：M　**正式开通依赖 E3**（企业认证、手机号能力）

**只能改**：新建 `server/routes/auth_phone.py`、`server/phone_auth.py`、`server/tests/test_phone_auth.py`；改 `server/user_api.py`（只加 `INTERNAL_ORDER_FIELDS` 以外的用户字段 `phoneMasked`，见步骤 3）。

**步骤**
1. `phone_auth.py`：
   - `exchange_code(code)`：服务端用 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 换 access_token（复用 `content_security._access_token()`），调微信“获取手机号”接口，返回手机号。**做成可替换的函数**（模块级变量 `_exchanger`，测试里替换），开发环境（`env.is_dev()`）没有凭证时用假的：`code` 是 `dev-` 开头就返回 `138` + `code` 后 8 位数字。
   - `bind_phone(db, user_id, phone)`：用户表（现有 `users` 集合，看 `user_api.login` 怎么存的）里记 `phoneHash`（`sha256(phone + 服务器盐)`，盐用环境变量 `PHONE_SALT`，开发环境有默认值）和 `phoneMasked`（`138****8000`）；**不存明文手机号**。同一个 `phoneHash` 已经绑在别的 `user_id` 上时，把当前用户的作品（`designs` 里 `userId` 等于当前用户的）转到那个用户名下，当前会话改成那个用户（合并账号）。
2. 路由 `POST /api/auth/phone`（`auth: "user"`，要先有静默登录的会话）：收 `{"code"}`，调上面两个函数，返回 `{"phoneMasked", "merged": 布尔}`。
3. `GET /api/me`（如果还没有）返回 `phoneMasked`，没绑是 `null`。
4. 测试：绑定成功；同号第二个设备登录后合并作品；微信接口失败返回 502 和一句“没登录上，网络不太好，再点一次试试”；接口返回里没有明文手机号。

**停下来问**：现有用户表的结构和上面假设的不一样。

---

## A8 后台账号和权限（拆成 5 张，按顺序）

依据：[14-admin-roles.md](../14-admin-roles.md)。五张卡都要改后台登录这一块，**必须串行**：A8a → A8b →（A8c、A8d 可以并行）→ A8e。

### A8a 账号、密码、会话

- **依赖**：A11　**大小**：M

**只能改**：新建 `server/accounts.py`、`server/routes/admin_accounts.py`、`server/migrations/m009_admin_accounts.py`、`server/tests/test_admin_accounts.py`；改 `server/app.py`（只改 `admin_ok`、`admin_login`、`admin_logout` 三个方法）。

**步骤**
1. 三张表（迁移里建）：`admin_users`（`id, username, name, roleId, status(active/disabled), passwordHash, mustChangePassword, createdAt, lastLoginAt`）、`admin_roles`（`id, name, permissions[], builtin, dataScope`）、`admin_sessions`（`sid, userId, expiresAt`）。迁移里写入四个默认角色（14 第 2.3 节的表，权限点名字用 14 第 2.2 节表里的中文名对应的英文代码，代码表写在 `accounts.py` 顶部 `PERMISSIONS` 常量里，一一对应）。
2. 密码：`hashlib.scrypt(password, salt=随机16字节, n=2**14, r=8, p=1)`，存 `scrypt$<salt hex>$<hash hex>`；至少 8 位。
3. 登录 `POST /api/admin/session`：收 `{"username","password"}`；失败 5 次锁 10 分钟（沿用现有计数）；成功写 `admin_sessions`，cookie 不变。`ADMIN_TOKEN` **只在 `admin_users` 为空时**能登录，而且这个会话只能调“创建第一个负责人”接口。
4. `admin_ok()` 改成查 `admin_sessions`（不再查进程内存），并把当前账号放到 `self.admin_user`；停用账号的会话立即失效。
5. 账号接口（`auth: "admin"`，A8b 后改成权限点 `manage_accounts`）：列表、新建（返回一次性临时密码）、改名字和角色、停用、重置密码、改自己的密码（`mustChangePassword` 为真时只能调这个）。最后一个在用的负责人不能停用、不能改成别的角色。
6. 测试：14 第 5 节 B41、B42 的验收逐条一个用例。

### A8b 权限点检查

- **依赖**：A8a　**大小**：M

**只能改**：`server/app.py`（把每个后台路由的 `self.admin_ok()` 换成 `self.admin_can("<权限点>")`）、`server/routes/__init__.py`（`auth` 可以写权限点）、`server/accounts.py`、新建 `server/tests/test_admin_permissions.py`。

**步骤**
1. `admin_can(perm)`：登录了且角色的 `permissions` 包含 `perm`（负责人角色全部为真）。没登录 401，没权限 403 `{"error": "你没有这个操作的权限", "need": "<权限点中文>"}`。
2. 每个后台接口配权限点，对照表写在 `accounts.py` 的 `ROUTE_PERMISSIONS` 里（路径正则 → 权限点），`app.py` 里统一查表，不在每个路由里手写。对照关系按 14 第 2.2 节：商品写 → `edit_products`，改价 → `edit_prices`，订单状态 → `process_orders`，取消 → `cancel_orders`，改地址和备注 → `edit_order_address`，售后 → `process_after_sales`，退款动作 → `refund`，条款发布 → `publish_terms`，工单 → `work_orders`，质检 → `quality_gate`，账号 → `manage_accounts`；所有 GET 列表和详情按“看订单 / 看工单”等查看权限。
3. 测试：四个默认角色 × 每个后台接口，结果和 14 第 2.3 节的表一致（表驱动）。

### A8c 敏感信息打码

- **依赖**：A8b　**大小**：S　**可以和 A8d 并行**

**只能改**：`server/accounts.py`（新函数 `mask_order`）、`server/commerce.py`（只在 `order_detail`、`list_orders`、`list_work_orders`、`get_work_order` 的返回前调一次 `mask_order`）、新建 `server/routes/admin_reveal.py`、新建 `server/tests/test_admin_masking.py`。

**步骤**：没有 `view_full_contact` 权限时手机号变 `138****8000`、地址只保留到区县加 `***`；没有 `view_cost` 时去掉 `costFen`。`POST /api/admin/orders/{no}/reveal` 返回全号并写操作记录。测试：运营、做单师傅拿不到全号；客服调 reveal 能拿到并留下记录。

### A8d 操作人记到账号

- **依赖**：A8b　**大小**：S　**可以和 A8c 并行**

**只能改**：`server/app.py`（把 `self.admin_user["name"]` 传给 commerce 函数的 `actor` 参数）、`server/commerce.py`（`record_quality_gate` 的 `inspector` 改成取 `actor`，忽略请求里的 `inspector`）、新建 `server/tests/test_admin_actor.py`。

**测试**：每个后台写操作之后，操作记录和订单历史里的操作人是账号名字；质检人等于当前账号；全仓库搜 `actor=ACTOR` 的调用只剩默认参数定义。

### A8e 做单师傅的数据范围

- **依赖**：A8c、A8d　**大小**：S

角色的 `dataScope` 为 `own` 时，`list_work_orders` 只返回 `assignee` 等于当前账号名字的工单，`get_work_order` 访问别人的返回 404。测试两种范围。

---

## A9b 知识库补把握（数据任务，不写代码）

- **依赖**：KD2 上线（之后在后台里直接改）　**大小**：M　**适合**：负责人或运营，不需要程序员

在售商品里 16 种的知识库寓意把握是“低”，用户端不显示寓意：蜜蜡（mila）、草莓晶（caomei-jing）、红玛瑙（putong-manao）、绿玉髓（lv-yusui）、东陵玉（dongling-yu）、缠丝玛瑙（chansi）、岫玉（xiu-yu）、水草玛瑙（shuicao）等（完整名单：在 `server/` 下跑 `python3 -c "import kb,..."` 的覆盖检查，或看后台 A17 页）。

每一条：在后台“知识库”里打开这一种，查出处（书、标准、可靠的文化资料），加进“来源”；出处够了把“寓意的把握”改成中或高，保存（保存即生效）。寓意只写文化说法，不写功效（后台会自动检查）。

---

## K 知识库搬进后台（简化版，3 张）

依据：[16-knowledge-base.md](../16-knowledge-base.md)。顺序：K1 → K2 → K3，串行。

### K1 知识库存进数据库

- **依赖**：A11　**大小**：M

**只能改**：新建 `server/migrations/m010_kb_tables.py`、`server/kb_store.py`、`server/tests/test_kb_store.py`；改 `server/kb.py`（只改 `_load()` 和缓存）。

**步骤**
1. 迁移建两张表：`kb_items`（`id, kind: bead|dict, key, data JSON, version, updatedBy, updatedAt`）、`kb_versions`（`itemId, version, data JSON, savedBy, savedAt, note`）。`kind=bead` 的 `key` 是品种编号（如 `mila`），`kind=dict` 的 `key` 是 `banned` / `meaning_tags` / `terms` / `dims` / `grade_families`。**没有草稿：存进去就是生效的内容。**
2. 迁移里**第一次导入**：读 `kb/data/beads/*.json` 和 `kb/data/attributes.json`，每个品种、每个词典各一行，`data` 等于文件内容，`version = 1`，`updatedBy = "导入"`，同时写一条 `kb_versions`。表里已有数据时不再导入（能重复跑）。
3. `kb_store.py`：`snapshot()` 返回和现在 `_load()` 一样结构的数据（`{"beads": {...}, "attrs": {...}}`）；`stamp()` 返回最近一次保存的时间（缓存用）；`save(key, data, by, note)`：`version + 1`，更新 `kb_items`，写一条 `kb_versions`（一个事务）。
4. `kb.py` 的 `_load()`：改成从 `kb_store.snapshot()` 取；缓存按 `stamp()` 判断是否过期（替换现在按文件修改时间）。**`kb.py` 的其他函数一个都不改。**数据库里没有知识库数据时（比如测试环境），退回读 `kb/data/*.json`，并打一行警告。
5. 测试：导入后 `kb.get("mila")`、`kb.enrich(...)`、`kb.banned_in("招财")` 的结果和改之前完全一样（用改之前的文件读法算一遍做对照）；`save` 之后 `kb.get` 立刻拿到新的，`kb_versions` 多一条。

### K2 校验抽成共用模块

- **依赖**：K1　**大小**：S

**只能改**：新建 `server/kb_rules.py`、`server/tests/test_kb_rules.py`；改 `kb/validate.py`（改成调用 `kb_rules`，命令行用法和输出不变）。

`kb_rules.check_bead(item, dicts) -> [错误]`，每条错误 `{"field", "message"}`，`message` 是给运营看的中文（例：“‘招财’是禁用词：只写寓意，不写功效”“把握改成中或高，至少要有一条不是‘常识’的来源”）。规则：16 第 2 节第 4 条，加上现在 `kb/validate.py` 里已有的全部检查（逐条搬过来，不删）。测试：现有 200 种全部通过；每条规则一个失败用例。`python3 kb/validate.py` 的输出和改之前一样（PR 里贴对比）。

### K3 后台接口：查、改（保存即生效）、改动记录、退回

- **依赖**：K2、A8b（权限点）　**大小**：M

**只能改**：新建 `server/routes/kb_admin.py`、`server/tests/test_kb_admin.py`、迁移 `server/migrations/m011_kb_permission.py`；`server/accounts.py` 的 `PERMISSIONS` 加 `edit_kb`（编辑知识库），默认给负责人和运营（迁移给已有的这两个角色补上）。

接口（都要登录后台；查看所有人能用）：
- `GET /api/admin/kb?q=&category=&meaningConfidence=`：列表（`q` 搜名字、别名、商家叫法）；每项带大类、寓意关键词、`meaningConfidence`、关联在售商品数、`updatedAt`。另返回三个数字：品种数、在售商品里用户端不显示寓意的（`lowConfidence`、`spacer` 两类分开）、最近 7 天改过的。
- `GET /api/admin/kb/{key}`：`data`、`version`、关联在售商品（编号、名字、尺寸）、最近 20 条改动记录（版本、谁、什么时候、备注）。
- `POST /api/admin/kb/{key}/check`：只检查不保存，返回错误列表（编辑页实时提示用）。
- `PUT /api/admin/kb/{key}`（`edit_kb`）：body `{data, version, note}`。先跑 `kb_rules.check_bead`，有错返回 400 和错误列表，**不保存**；`version` 和库里不一样返回 409“别人刚改过，请刷新”；没错就 `kb_store.save`，写操作记录（`audit`），返回新 `version` 和受影响的在售商品。
- `POST /api/admin/kb/{key}/rollback`（`edit_kb`）：`{"version": 5}`，把第 5 版的内容当作一次新保存（同样先检查，检查不过返回 400）。

**不做**：新建品种、草稿和发布、词典编辑、导入导出（16 第 3 节）。

测试：没登录 401、没 `edit_kb` 403；有禁用词保存返回 400 且库里没变；版本冲突 409；保存后 `kb.get` 和 `kb.enrich` 立刻是新内容；退回生成新版本、内容等于第 N 版；操作记录有人名；蜜蜡把握从低改中、补一条来源后，3 个在售商品的寓意在 `/api/beads` 里出现。

---

## B-1 用户上传照片和图片审核

- **依赖**：A11　**大小**：M

**只能改**：新建 `server/uploads.py`、`server/routes/uploads.py`、`server/tests/test_user_uploads.py`；改 `server/content_security.py`（加图片检查函数）。

**步骤**
1. `POST /api/my/uploads`（`auth: "user"`）：收 `{"filename","contentType","data"(base64)}`；只收 png / jpg / webp；单张不超过 5MB；每个用户每天最多 50 张；保存到 `DATA_DIR/uploads/user/<日期>/<随机名>`；记一条 `uploads` 记录（`id, userId, path, checkStatus: pending/passed/rejected, createdAt`）；返回 `{"id","url"}`。
2. 图片安全检查：`content_security.check_image_async(path)` 调微信的异步图片检查，结果通过回调路由 `POST /api/wechat/media-check`（`auth: "public"`，按微信的消息签名校验）写回 `checkStatus`。开发环境没有凭证时直接 `passed`（和文字检查一样的 fail-open 规则：只在开发环境放行）。
3. 读图片 `GET /uploads/user/...`：`checkStatus` 不是 `passed` 时，只有上传者本人和后台能看到，别人 404。
4. 测试：格式、大小、每日上限、检查不通过后别人看不到。

---

## B-2 评价（先审后发）

- **依赖**：A7、B-1　**大小**：L　依据：13 第 3.1 节、04 第 20 节

**只能改**：新建 `server/reviews.py`、`server/routes/reviews.py`、`server/tests/test_reviews.py`；改 `server/user_api.py`（`order_allowed_actions` 加 `write_review`）、`server/contract.py`（`ACTIONS` 加一行、加 `REVIEW_STATUSES`）和两个导出文件。

**步骤**
1. 评价记录：`id, orderNo, userId, templateId(可空), stars(1–5), text(≤300), photoIds[], anonymous, status, machine{textOk, textReason, photos:[{id, status}]}, rejectReason, createdAt, publishedAt`。状态：`machine_failed`（机审不过，用户能改了再发）、`pending`（等人审）、`published`、`rejected`（人审不过）、`taken_down`（下架）。
2. 用户提交 `POST /api/my/orders/{no}/review`：只限订单已签收或已完成、用户已绑手机号（A7）、这一单还没评价过。文字过 `content_security.ensure_allowed` 和 `kb.banned_in`（含功效词），任何一项不过 → `machine_failed`，返回原因；照片引用 B-1 的上传记录，有 `pending` 的照片就等它们出结果，有 `rejected` 的 → `machine_failed`；全部通过 → `pending`。自己串的、AI 配的（订单没有 `tplId`）评价也收，但永远不公开。
3. 后台：列表（按状态筛）、通过（→ `published`，只有有 `templateId` 的才真正公开）、驳回（必须写给用户的原因）、下架（必须写原因）。
4. 公开接口 `GET /api/templates/{id}/reviews?filter=all|photos|wrist&wrist=15`：只返回 `published`；匿名时昵称变成 `X*`；`wrist` 筛选取手围差 1cm 以内。
5. 测试：13 第 3.1 节的五条规则各一个用例；含“治失眠”这类功效词的直接 `machine_failed`；没公开的评价在公开接口里拿不到。

**停下来问**：法务（E7）对评价有具体要求时，以法务为准。

---

## B-3 分享管理

- **依赖**：A11　**大小**：S

`shares` 加 `takenDownAt`、`takeDownReason`；后台 `GET /api/admin/shares?q=`（按名字或链接里的编号查）、`POST /api/admin/shares/{id}/take-down`；用户举报 `POST /api/shares/{id}/report`（不登录也能，按 IP 每天限 20 次，存 `share_reports`）；`read_share` 遇到已下架返回 `None`（落地页显示“这条手串看不到了”）。新文件 `server/routes/shares_admin.py`、测试；只改 `user_api.read_share` 一处。

---

## B-4 文章，和条款加“用户协议”“隐私政策”

- **依赖**：A11　**大小**：M

**只能改**：新建 `server/articles.py`、`server/routes/articles.py`、`server/tests/test_articles.py`；改 `server/status.py`（`TERM_TYPES` 加两项）。

文章：`id, title, cover(上传 id 或图片地址), body(段落数组), beadKbIds[], button{text, target}(可空), homeOrder(可空), status(draft/published), updatedAt`；保存前标题和正文过 `kb.banned_in`；后台增删改查和上下线；公开 `GET /api/articles/{id}`、`GET /api/articles?home=1`（上首页的，按 `homeOrder`）。首期三篇（04 第 25 节的“月光石的光是怎么来的”等）由运营在后台录入，不写死在代码里。

---

## B-5 首页配置

- **依赖**：B-4　**大小**：S

`banners` 补字段：`title, tags[], target{type: template|article|page, id}, cover, order, on`；模板加 `homeOrder`（为空不上首页）；`/api/catalog` 返回的 `templates` 按 `homeOrder` 排、`banners` 按 `order` 排；加 `homeArticles`（B-4 的上首页文章）。后台接口：一次保存三块的顺序（`PUT /api/admin/home`）。只改 `app.py` 里 `on_sale_catalog` 一个函数（这是例外，卡片写明了），其余新文件。

---

## B-6 用户查询

- **依赖**：A8b　**大小**：S

`GET /api/admin/users?q=`：`q` 是 4 位数字时按手机号后 4 位（用 A7 存的 `phoneMasked` 末 4 位匹配），否则按订单号；返回打码手机号、订单列表（订单号、状态、金额）、售后数、作品数。权限点 `lookup_users`。新文件 `server/routes/admin_users_lookup.py`、测试。

---

## B-7 商品按品种分组、批量调价、成本价

- **依赖**：A8b　**大小**：M

商品加可选的 `costFen`（没有 `view_cost` 权限不返回，A8c 已处理）；`GET /api/admin/beads?group=1` 按 `name` 分组返回（每组下面是各尺寸）；`POST /api/admin/beads/reprice`：`{"mode": "add"|"csv", "addFen": 200, "ids": [...] | "csv": "..."}`，`preview: true` 时只返回 `[{id, name, oldFen, newFen}]`，`preview: false` 时执行并整批写一条操作记录；权限点 `edit_prices`。新文件 `server/pricing_admin.py`、`server/routes/pricing_admin.py`、测试（预览和执行结果一致、没有权限 403）。

---

## B-8 AI 配的返回结构

- **依赖**：A3（价格要对）　**大小**：M

`/api/ai/design` 返回 `{"message": 一两句先讲寓意, "plans": [三个方案：{name, line, beads, count, lengthMm, payableFen}], "quickReplies": [三个]}`。`count`、`lengthMm` 用 `plans._fill` 和 `plans.target_mm` 算，`payableFen` 用 `pricing.quote` 算，**不让模型写数字**：模型返回的 `message` 里如果有数字（`\d`），换成模板句“为你配了三条，先看第一条。”。寓意关键词只能用方案里珠子的知识库 `tags`。改 `server/ai/__init__.py` 的组装部分和 `app.py` 的 `ai_route` 里 `/api/ai/design` 那一段（例外，写明了）；测试用假的模型返回。

---

## B-9 拍照识别的置信度和失败原因

- **依赖**：无　**大小**：M

`/api/ai/photo` 的识别结果里，每种珠子带 `confidence`（0–1）；整体失败时返回 `{"reason": "dark"|"blurry"|"no_bracelet"|"unknown_beads"}`。阈值：`confidence < 0.6` 的前端显示“可能不准”。只改 `server/ai/` 里识别结果的整理函数和对应测试；模型调用本身不改。**停下来问**：现在用的模型服务给不出置信度时，先报告，不要编。

---

## B-10 订阅消息

- **依赖**：A11；**E4（公众平台申请好三个模板）**　**大小**：M

`server/notify.py`：`send(user_id, template_key, data)`，三个模板 `shipped`（发货）、`delivered`（签收）、`refunded`（退款到账），模板 ID 从环境变量读；开发环境用假的发送函数（只记日志）；发送记录表 `notify_logs`（谁、哪个模板、成功没有、错误码）。在订单发货、物流签收、售后退款完成三处调用——这三处在 `commerce.py`，**只加一行调用**，失败不影响主流程。用户订阅授权的记录接口 `POST /api/my/subscriptions`。测试：三处都调用了；发送失败订单状态照常变。

---

## B-11 地址簿、送礼、作品删除（三张小卡，可以并行）

### B-11a 地址簿
`addresses` 表：`id, userId, person, phone, region[], detail, isDefault`；`GET/POST/PUT/DELETE /api/my/addresses`；每人最多 20 条；设默认时把别的取消默认；手机号校验同下单。新文件 `server/addresses.py`、`server/routes/addresses.py`、测试。

### B-11b 送礼
下单时 `gift: {"box": true, "card": "≤50字", "hidePrice": true}`；贺卡过 `content_security.ensure_allowed`；价格照 `pricing.quote` 现有的 `gift` 处理（礼盒费）；工单里显示贺卡和“包裹里不放带价格的单据”。只改 `user_api.make_order` 里读 `gift` 的那几行和 `commerce.build_work_order` 里多两个字段；测试。

### B-11c 作品删除
`DELETE /api/designs/{id}`：只能删自己的；软删除（`deletedAt`），列表不返回；被分享过的作品删除后分享落地页显示“看不到了”。新路由文件、测试；改 `user_api.read_share` 一处。

---

## B-12 AI 对话记录和统计

- **依赖**：A8b；**E5（隐私政策写明保留期限）**　**大小**：M

`ai_logs`：每次 AI 配的输入（去掉手机号等）、输出、命中的方案、耗时、时间；按 E5 的期限定时清理（加到 `jobs.py` 的子命令 `purge-ai-logs`）。统计：`jobs.py stats-daily` 每天汇总“珠子被串次数、搭配次数”（只有数字，不带用户）。后台只读接口两个。新文件、测试。

---

## B-13 物流轨迹

- **依赖**：选定快递查询服务（负责人）　**大小**：M

`server/tracking.py`：`fetch(carrierCode, trackingNo)` 调第三方查询（服务商定了再写），结果缓存 30 分钟；订单接口带 `tracking: [{at, text}]`（给用户的，不带内部信息）。**服务商没定之前不开工。**

---

## B-14 接入微信支付

- **依赖**：**E6（商户号、APIv3 密钥、证书）**　**大小**：L

在 `payments.py` 加 `wechat` 通道：`create_payment` 调统一下单（JSAPI），返回 `wx.requestPayment` 要的参数；`/api/payments/notify` 用平台证书验签、解密，再调 `apply_callback`（和模拟支付同一个函数）；`handle_refund` 调退款 API，退款结果回调同样处理。密钥只放环境变量。上线前用小额真实订单走一遍付款和退款。**商户号下来之前不开工。**

---

## A5c 改手围重串

- **依赖**：A5b；**负责人定重串规则**　**大小**：M

售后“改手围重串”收到寄回后，按新手围重新排一次（自己串的手串：按原来的珠子比例加减主珠；模板手串：用模板配方重新 `_fill`），生成一张新工单（关联原订单），走同样的做单、质检、发货。**规则没定之前不开工**，要定的是：自己串的手串加减珠子时加减哪一种、加了珠子要不要补差价。

---

## A10 清理旧字段（上线前最后做）

- **依赖**：小程序和后台都不再读旧字段（C11 完成后）　**大小**：S

删掉订单里的中文 `status` 字段写入、`paymentAvailable`；删之前全仓库搜一遍 `miniprogram`、`admin-web` 里没有读它们的地方。迁移不删已有数据，只是不再写。
