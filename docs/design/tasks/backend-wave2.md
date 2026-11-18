# 后端任务卡 · 第二波及以后

> 派活批次见 [00-dispatch.md](00-dispatch.md) 第 2 节（第 5–9 批）。第一波的共同规矩全部适用（见 [backend-wave1.md](backend-wave1.md) 开头）。
> **第二波起多三条规矩，为的是能并行**：
> 1. **新接口不改 `server/app.py`**：写在 `server/routes/<领域>.py` 里（A11 建好的机制），`app.py` 会自动加载。
> 2. **新功能的业务逻辑放新模块**（`server/reviews.py`、`articles.py`、`uploads.py`、`accounts.py`……），不往 `commerce.py`、`user_api.py` 里加大段代码；只有卡片明确写了的函数才能改这两个文件。
> 3. **新表不改 `server/db.py` 和 `server/migrations/__init__.py`**（A11m 做完后）：在自己的迁移文件里写 `NEW_TABLES = ("表名",)`，`up()` 里用 `adapter.create_table(conn, "表名")` 建表，会被自动发现和登记。迁移编号按下面的表用，**不要自己挑号**：
>
> | 编号 | 文件 | 卡 |
> |---|---|---|
> | 007 | `m007_after_sale_types.py` | A5a（第一波，手动登记） |
> | 008 | `m008_pricing_settings.py`（`settings`） | A3 |
> | 009 | `m009_admin_accounts.py`（`admin_users`、`admin_roles`、`admin_sessions`） | A8a |
> | 010 | `m010_kb_tables.py`（`kb_items`、`kb_versions`） | K1 |
> | 011 | `m011_kb_permission.py` | K3 |
> | 012 | `m012_uploads.py`（`uploads`） | B-1 |
> | 013 | `m013_reviews.py`（`reviews`） | B-2 |
> | 014 | `m014_articles.py`（`articles`） | B-4 |
> | 015 | `m015_share_reports.py`（`share_reports`） | B-3 |
> | 016 | `m016_addresses.py`（`addresses`） | B-11a |
> | 017 | `m017_notify_logs.py`（`notify_logs`、`subscriptions`） | B-10 |
> | 018 | `m018_ai_logs.py`（`ai_logs`、`stats_daily`） | B-12 |
>
> 只是给已有的表加字段（比如 `shares.takenDownAt`、`designs.deletedAt`、`beads.costFen`）不需要迁移：文档里没有这个字段时按空处理。
>
> **提示词**：用 [01-agents.md](01-agents.md) 第 4 节的模板（省 token 的版本），不要再用旧的长模板。

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

## A11m 迁移和新表自动登记（第一波第 4 批，和 A11 同一个会话做）

- **依赖**：A5a（m007 已合并）　**大小**：S　**为什么**：第二波有 9 张卡要建新表。现在每建一张表都要改 `server/db.py` 的 `TABLES` 和 `server/migrations/__init__.py` 的两个列表，几张卡同时做一定冲突。

**只能改**：`server/migrations/__init__.py`、`server/db.py`（只改 `TABLES` 的定义）、新建 `server/tests/test_migrations_registry.py`。

**步骤**
1. `migrations/__init__.py`：保留 `TABLES`（12 张基础表）；`MIGRATIONS` 改成自动发现：用 `pkgutil.iter_modules(__path__)` 找所有 `m\d{3}_*.py`，`importlib` 导入，按 `VERSION` 排序。两个模块 `VERSION` 相同时直接抛错（启动失败，写清楚是哪两个文件）。
2. 同一个文件加 `ALL_TABLES = TABLES + 各迁移模块的 NEW_TABLES`（模块没有这个属性就当空），重复的表名抛错。
3. `db.py`：`TABLES = migrations.ALL_TABLES`（从迁移包导入，`db.py` 其他地方一行不改）。
4. 测试：现有 m001–m007 照常按顺序执行；临时目录里放一个假的 `m099_demo.py`（`NEW_TABLES=("demo",)`）后 `ALL_TABLES` 含 `demo`、`DB.put("demo", ...)` 能用；两个同号迁移启动报错。测试结束删掉假文件（用 `tempfile` + `sys.path`，不要在 `server/migrations/` 里留文件）。
5. 跑全部后端测试，结果和改之前一样。

**容易做错**：不要动 m001–m007 的内容；不要改 `migrate.py`。

---

## A12 尺寸规则统一（后端）

- **状态**：Claude 已经在 `review/admin-workbench-fixes` 的 `10f3b78` 做完（负责人 2026-11-13 定：统一成小程序工作台那一份）。**负责人如果要撤销那次提交、交给执行 agent 做，就按这张卡重做**；不撤销就跳过这张卡。
- **只能改**：`server/plans.py`（`main_mm`、`target_for`、`target_mm`、`_fill`、`size_for_count`）、`server/commerce.py`（`build_design_snapshot` 里算主珠的那几行）、新建 `server/tests/fixtures/size_rule_cases.json`、`server/tests/test_size_rule_shared.py`。
- **规则**（以 `miniprogram/pages/editor/logic.js` 的 `stats` 为准）：主珠按整串算，排除隔片、金属珠、6mm 以下；次数一样取较小的；没有时 8mm。目标长度四舍五入 .5 进位（和 JS 的 `Math.round` 一样，不用 Python 的 `round`）。排珠每加一颗都按加上以后的整串重新算目标。
- **测试**：用例的期望值要另写一个“照搬 logic.js”的版本独立算出来，两边一致才写进 fixture；小程序那边由 C0j 读同一份 fixture。

---

## A3 手工费和运费改成后台可配置（2026-11-13 负责人定，取代原“去掉手工费”）

- **依赖**：A1、A11、A11m　**大小**：M　**不能和 B-11b 同时做**（都改 `pricing.py`）

**负责人的决定**：手工费、运费不写死在代码里，和商品单价一样在后台定：每一项能选“收 / 不收”，收的话收多少；运费另有“满多少包邮”。商品单价照旧在商品里改（D6a），**不再需要负责人给新单价表**。

**只能改**：`server/pricing.py`、新建 `server/migrations/m008_pricing_settings.py`、`server/routes/pricing_settings.py`、`server/tests/test_pricing_settings.py`；`server/app.py` 只加一行（启动时 `pricing.attach(db)`，放在 `db` 建好之后）；相关测试的期望值。

**步骤**
1. 迁移 `m008_pricing_settings.py`：`NEW_TABLES = ("settings",)`，建表后写入一行 `id = "pricing"`：
   `{"handwork": {"enabled": true, "fen": 1500}, "shipping": {"enabled": true, "fen": 800, "freeThresholdFen": 9900}, "updatedBy": "导入", "updatedAt": ...}`（就是现在代码里的数，上线后价格不变）。已有这一行就不写（能重复跑）。
2. `pricing.py`：
   - 现有常量保留，作为数据库里没有配置时的默认值。
   - `attach(db)`：记住数据库；`config()`：读 `settings/pricing`，读不到就用默认值。
   - `quote()` 和 `public_config()` 改成用 `config()` 的数：手工费不收时 `handworkFen = 0`；运费不收时 `shippingFen` 恒为 0；收运费时 `freeThresholdFen` 为 `null` 表示不包邮，否则满额包邮。**其他调用处一行不改**（`app.py`、`commerce.py`、`user_api.py` 继续调 `pricing.quote` / `public_config`）。
   - `public_config()` 多返回 `handworkEnabled`、`shippingEnabled`（小程序以后按它决定显不显示这一行），原有字段名不变。
3. 路由 `routes/pricing_settings.py`（`auth: "admin"`，A8b 以后改成权限点 `edit_prices`）：
   - `GET /api/admin/pricing-settings`：返回当前配置。
   - `PUT /api/admin/pricing-settings`：收上面的结构；金额是 0–100000 的整数分（写元存分由后台页面做）；`enabled` 是布尔；`freeThresholdFen` 是整数分或 `null`；不合法抛 `ValueError`。保存时记 `updatedBy`（当前后台账号的名字，A8a 的 `accounts.CURRENT_ADMIN`）、`updatedAt`。
4. 旧订单不受影响：订单里存的是下单时的报价快照，改配置只影响之后的报价和下单。
5. 测试：默认配置下报价和改之前一模一样（拿现有 `test_pricing` 的几组数对照）；手工费关掉后报价里 `handworkFen = 0`；运费关掉后不管多少钱都是 0；包邮门槛改成 `null` 后永远收运费；改配置前下的订单金额不变；不合法的金额（负数、小数、字符串、超上限）返回 400；没登录后台 401；`GET /api/catalog` 的 `pricing` 跟着配置变。

**停下来问**：要改上面列出的调用处才能做下去。
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
2. 密码：`hashlib.pbkdf2_hmac("sha256", password, salt=随机16字节, 600000)`，存 `pbkdf2_sha256$<迭代次数>$<salt hex>$<hash hex>`；至少 8 位。（原写 scrypt，macOS 自带 Python 没有，2026-11-13 改。）
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


### A8f 角色的新建、修改，和“当前账号”接口（2026-11-13 补）

- **依赖**：A8b　**大小**：S　**为什么**：D3b 的角色勾选表要能保存，D3c 要知道当前账号有哪些权限，后端都还没有接口。

**只能改**：新建 `server/routes/admin_roles.py`、`server/tests/test_admin_roles.py`；`server/accounts.py` 只加函数，不改已有函数。不改 `app.py`、不加迁移（`admin_roles` 表 A8a 已经建好）。

**步骤**
1. 路由都写权限点 `manage_accounts`，“当前账号”那条除外：
   - `POST /api/admin/roles`：`{name, permissions[], dataScope: "all"|"own"}`，新建自定义角色，返回角色。
   - `PUT /api/admin/roles/{id}`：改名字、权限、数据范围。
   - `DELETE /api/admin/roles/{id}`：只能删自定义角色。
   - `GET /api/admin/me`（任何登录的后台账号都能调，auth 写一个四个内置角色都有的查看权限点，照 K3 的做法，并在注释里写明原因）：返回 `{name, roleId, roleName, permissions: [代码], permissionNames: [中文], dataScope, mustChangePassword}`，负责人返回全部权限点。
2. 校验：`name` 非空、不超过 20 字、不和已有角色重名；`permissions` 里每一项都必须在 `accounts.PERMISSIONS` 里；`dataScope` 只能是 `all` 或 `own`。
3. 保护：
   - 内置的四个角色（负责人、运营、客服、做单师傅，`builtin` 为真）不能删、不能改名；负责人角色的权限不能改（永远是全部）。其他三个内置角色的权限可以改。
   - 还有账号在用的角色不能删，原因写“有 N 个账号在用这个角色，先把他们换到别的角色”。
   - 不合规的一律 `ValueError`（400）。
4. 操作记录照旧由路由分发统一记，不用自己写。
5. 测试：新建、修改、删除自定义角色；内置角色删不掉、改不了名；负责人权限改不了；权限点写错 400；有人在用的角色删不掉；没有 `manage_accounts` 的账号调这些接口 403；`/api/admin/me` 对负责人、运营、做单师傅各返回正确的权限列表。

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

**只能改**：新建 `server/uploads.py`、`server/routes/uploads.py`、`server/migrations/m012_uploads.py`、`server/tests/test_user_uploads.py`；改 `server/content_security.py`（加图片检查函数）。

**步骤**
1. `POST /api/my/uploads`（`auth: "user"`）：收 `{"filename","contentType","data"(base64)}`；只收 png / jpg / webp；单张不超过 5MB；每个用户每天最多 50 张；保存到 `DATA_DIR/uploads/user/<日期>/<随机名>`；记一条 `uploads` 记录（`id, userId, path, checkStatus: pending/passed/rejected, createdAt`）；返回 `{"id","url"}`。
2. 图片安全检查：`content_security.check_image_async(path)` 调微信的异步图片检查，结果通过回调路由 `POST /api/wechat/media-check`（`auth: "public"`，按微信的消息签名校验）写回 `checkStatus`。开发环境没有凭证时直接 `passed`（和文字检查一样的 fail-open 规则：只在开发环境放行）。
3. 读图片 `GET /uploads/user/...`：`checkStatus` 不是 `passed` 时，只有上传者本人和后台能看到，别人 404。
4. 测试：格式、大小、每日上限、检查不通过后别人看不到。

---

## B-2 评价（先审后发）

- **依赖**：A7、B-1　**大小**：L　依据：13 第 3.1 节、04 第 20 节

**只能改**：新建 `server/reviews.py`、`server/routes/reviews.py`、`server/migrations/m013_reviews.py`、`server/tests/test_reviews.py`；改 `server/user_api.py`（`order_allowed_actions` 加 `write_review`）、`server/contract.py`（`ACTIONS` 加一行、加 `REVIEW_STATUSES`）和两个导出文件。

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

`shares` 加 `takenDownAt`、`takeDownReason`；后台 `GET /api/admin/shares?q=`（按名字或链接里的编号查）、`POST /api/admin/shares/{id}/take-down`；用户举报 `POST /api/shares/{id}/report`（不登录也能，按 IP 每天限 20 次，存 `share_reports`）；`read_share` 遇到已下架返回 `None`（落地页显示“这条手串看不到了”）。**只能改**：新建 `server/routes/shares_admin.py`、`server/migrations/m015_share_reports.py`、`server/tests/test_shares_admin.py`；改 `server/user_api.py` 的 `read_share` 一处。

---

## B-4 文章，和条款加“用户协议”“隐私政策”

- **依赖**：A11　**大小**：M

**只能改**：新建 `server/articles.py`、`server/routes/articles.py`、`server/migrations/m014_articles.py`、`server/tests/test_articles.py`；改 `server/status.py`（`TERM_TYPES` 加两项）。

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

`server/notify.py`：`send(user_id, template_key, data)`，三个模板 `shipped`（发货）、`delivered`（签收）、`refunded`（退款到账），模板 ID 从环境变量读；开发环境用假的发送函数（只记日志）；发送记录表 `notify_logs`（谁、哪个模板、成功没有、错误码），订阅授权表 `subscriptions`，迁移 `server/migrations/m017_notify_logs.py`。在订单发货、物流签收、售后退款完成三处调用——这三处在 `commerce.py`，**只加一行调用**，失败不影响主流程。用户订阅授权的记录接口 `POST /api/my/subscriptions`。测试：三处都调用了；发送失败订单状态照常变。

---

## B-11 地址簿、送礼、作品删除（三张小卡，可以并行）

### B-11a 地址簿
`addresses` 表：`id, userId, person, phone, region[], detail, isDefault`；`GET/POST/PUT/DELETE /api/my/addresses`；每人最多 20 条；设默认时把别的取消默认；手机号校验同下单。**只能改**：新建 `server/addresses.py`、`server/routes/addresses.py`、`server/migrations/m016_addresses.py`、`server/tests/test_addresses.py`。

### B-11b 送礼
下单时 `gift: {"box": true, "card": "≤50字", "hidePrice": true}`；贺卡过 `content_security.ensure_allowed`；价格照 `pricing.quote` 现有的 `gift` 处理（礼盒费）；工单里显示贺卡和“包裹里不放带价格的单据”。只改 `user_api.make_order` 里读 `gift` 的那几行和 `commerce.build_work_order` 里多两个字段；测试。

### B-11c 作品删除
`DELETE /api/designs/{id}`：只能删自己的；软删除（`deletedAt`），列表不返回；被分享过的作品删除后分享落地页显示“看不到了”。新路由文件、测试；改 `user_api.read_share` 一处。

---

## B-12 AI 对话记录和统计

- **依赖**：A8b；**E5（隐私政策写明保留期限）**　**大小**：M

`ai_logs`：每次 AI 配的输入（去掉手机号等）、输出、命中的方案、耗时、时间；按 E5 的期限定时清理（加到 `jobs.py` 的子命令 `purge-ai-logs`）。统计：`jobs.py stats-daily` 每天汇总“珠子被串次数、搭配次数”（只有数字，不带用户）。后台只读接口两个。**只能改**：新建 `server/ai_logs.py`、`server/routes/ai_stats.py`、`server/migrations/m018_ai_logs.py`、`server/tests/test_ai_logs.py`；改 `server/jobs.py`（加两个子命令）和 `server/ai/__init__.py`（AI 配结束时调用一次记录，失败不影响返回）。

---

## B-16 部署脚手架和支付配置自检（2026-11-17 负责人要）

- **依赖**：B-14　**大小**：M　**只能改**：新建 `deploy/`（下面列的文件）、新建 `tools/check_deploy.py`、`docs/deploy.md`、`.gitignore`、`server/tests/` 对应测试
- **目的**：负责人或运维照着做就能把后端连同微信支付配上线；执行 agent **不接触任何真实密钥、不登录任何服务器、不连商户平台**，只提供模板、脚本和说明。
- **要做的**：
  1. `deploy/app.env.example`：列出全部环境变量（微信登录、微信支付、数据库、`PAYMENT_PROVIDER` 等，以代码实际读取的为准，`grep -rn "os.environ" server` 核对），每项一行中文注释说明去哪拿；值全部是占位符。`.gitignore` 加上 `deploy/app.env`、`deploy/secrets/`、`*.pem`。
  2. `deploy/docker-compose.yml`：后端服务（用现有 Dockerfile）、`env_file: app.env`、密钥目录只读挂载到 `/secrets`、数据目录挂载到 `/data`；如项目用 Postgres 就带上，并写清楚数据卷。
  3. `deploy/nginx.conf.example`：https 反向代理到 8800，含 `/api/payments/notify`；证书路径用占位符。
  4. `tools/check_deploy.py`：在服务器上运行，读当前环境变量和密钥文件，逐项打印“通过 / 缺少 / 不对”，**绝不打印任何值**（最多打印长度和文件是否存在、权限是否 600）；检查项：变量齐全、APIv3 密钥 32 位、私钥和公钥文件能被 cryptography 读取、回调地址是 https 且路径对、`WXPAY_APPID` 等于 `WECHAT_APP_ID`、`PAYMENT_PROVIDER=wechat` 时以上必须全部通过。加 `--ping` 选项时，向回调地址发一个不带签名的请求，期望得到 400（说明回调能从公网访问到、且拒绝无签名请求）。
  5. `docs/deploy.md` 重写成负责人照做的分步说明，**按负责人实际环境：腾讯云云服务器（CVM，国内同事租的），Linux + Docker**：① 腾讯云控制台：安全组放行 80、443（8800 不对公网开放）；域名解析到服务器公网 IP；域名完成 ICP 备案；在“SSL 证书”申请免费证书并下载 Nginx 格式。② 服务器上装 Docker 和 compose 插件（给出 Ubuntu/OpenCloudOS 的命令）。③ 从微信商户平台拿五样材料（商户号、APIv3 密钥、商户证书私钥和序列号、微信支付公钥和 ID）并在“AppID 账号管理”关联小程序。④ pem 上传到 `deploy/secrets/` 并 `chmod 600`。⑤ `cp deploy/app.env.example deploy/app.env` 填值。⑥ `docker compose up -d`，再 `docker compose exec` 跑 `check_deploy.py`，全部“通过”后把输出截图给审核。⑦ 配 nginx 和证书，`check_deploy.py --ping` 通过。⑧ 小程序后台“开发管理 → 服务器域名”加 request 合法域名；商户平台填回调地址。⑨ 真机 0.01 元付款、后台退款，核对状态。⑩ 更新代码：`git pull` 后 `docker compose up -d --build`，数据目录不受影响；写清楚备份数据目录的命令。每步写在哪个后台、点哪里；拿不准的界面写“以实际后台为准”。不写云托管。
- **测试**：`check_deploy.py` 用临时生成的假密钥和假环境变量测：全对时全部通过；缺变量、密钥长度不对、文件不可读、回调不是 https 各报对应错误；输出里不出现任何变量的值。
- **不做**：真实部署、真实付款。

## B-20 评价图片改为人工审核，微信图片机审做成开关（2026-11-18 负责人定）

- **依赖**：B-19（已完成）　**大小**：S　**只能改**：`server/uploads.py`、`server/reviews.py`、`server/routes/uploads.py`、`admin-web/src/pages/reviews.tsx`（只改机审那一列的文字和颜色）、`deploy/app.env.example`（加一行开关）、`docs/deploy.md`、`server/tests/`、构建产物照以往做法
- **现象**：线上评价照片一直“图片检查中”，后台点“通过并公开”被拦“照片还在审核中”。原因：图片走微信异步检测，结果要靠小程序后台“消息推送”回调，没配（且我们没写推送地址的 GET 验证，也配不上），所以永远不返回。
- **负责人定的规则**：所有评价本来就由负责人人工先审后发，图片不再必须过微信机审。
- **要做的**：
  1. 新环境变量 `IMAGE_SEC_CHECK`，默认 `off`；只有值为 `on` 才送微信异步检测（现有逻辑原样保留）。`off` 时 `uploads.create` 不调微信、不生成送审链接，`checkStatus` 记为 `manual`（待人工）。
  2. `viewer_can_see` 不变：非 `passed` 只有上传者本人和后台能看。
  3. `reviews` 通过（approve）时：照片状态是 `manual` 或 `pending`（含已经卡住的老记录）都允许通过，并把这些照片记录改成 `passed`，记 `reviewedBy`（后台操作人）和时间——否则公开后别人看不到图。`rejected`（微信明确判违规）仍然拦，逻辑不变。
  4. 后台评价列表“机审”列：`manual`/`pending` 显示“人工审核”（灰色），`passed` 显示“已通过”，`rejected` 显示“机审判定违规”（红色）。不新增按钮。
  5. `GET /api/wechat/media-check`：按微信消息推送规范校验 `signature`（用 `WECHAT_MSG_TOKEN`），通过就原样返回 `echostr`（纯文本），否则 403。为以后打开开关时能在小程序后台保存推送配置。
  6. `deploy/app.env.example` 加 `IMAGE_SEC_CHECK=off` 和中文注释；`docs/deploy.md` 加一节“以后打开图片机审”：生成 `WECHAT_MSG_TOKEN`、填进 `app.env`、`IMAGE_SEC_CHECK=on`、小程序后台“开发管理 → 开发设置 → 消息推送”填 URL `https://<API域名>/api/wechat/media-check`、Token 同上、数据格式 JSON、明文模式。
- **测试**：`off` 时上传不调 `check_image_async` 且状态 `manual`；`on` 时行为与现在一致；`manual` 和 `pending` 照片的评价可以通过、通过后照片变 `passed` 且公开可见；`rejected` 仍拦；GET 验证签名对返回 echostr、不对 403；评价文字审核逻辑不变。
- **报告**：后台评价列表三种状态的截图。
- **不做**：改评价文字的检测；改售后照片流程（只有后台能看，按 `viewer_can_see` 不受影响）；删除机审代码。

## B-19 商品接口 13 秒：知识库缓存每次都开新数据库连接（2026-11-18 线上实测）

- **依赖**：B-18（已完成）　**大小**：S　**只能改**：`server/kb.py`、`server/kb_store.py`、`server/tests/` 对应测试
- **现象**：线上 `GET /api/catalog` 约 13 秒（89 颗珠子）。首页、工作台、AI 配都先等这个接口。
- **原因**（已定位，开工先自己核实）：`kb._load()` 每次都调 `kb_store.stamp()` 判断缓存是否过期，而 `stamp()` 每次 `psycopg.connect` 新建一条 Postgres 连接再查 `kb_items`。`kb.enrich(bead)` 一颗珠子里会多次走 `_load()`（`get`、`public`、`clean` 逐个标签、`points` 等），89 颗就是几百次建连。本地 SQLite 建连几乎不花时间，所以测试和开发机都没暴露。
- **要做的**：
  1. `kb._load()` 的过期检查限频：距上次检查不到 `KB_STAMP_TTL` 秒（默认 5 秒，环境变量可调，测试里可设 0）直接用缓存，不调 `stamp()`。
  2. 知识库保存（`kb_store` 里写 `kb_items` 的函数）成功后主动让 `kb` 缓存失效，后台改完立刻生效，不用等 5 秒。用一个轻量钩子，别让 `kb_store` 反向 import `kb` 造成循环引用。
  3. 行为不变：返回内容逐字节不变；无知识库数据时回退到文件的逻辑不变。
- **测试**：给 `kb_store.stamp` 打桩计数：一次 `on_sale_catalog()`（或对 89 颗 seed 珠子逐个 `enrich`）`stamp` 调用 ≤ 1 次；TTL 内再调不增加；保存一条知识库后下一次 `_load` 立刻拿到新数据；`KB_STAMP_TTL=0` 时每次都检查（兼容现有测试）。全量测试照常通过。
- **报告**：贴改前改后在本机 SQLite 下对 `/api/catalog` 计时，以及 `stamp` 调用次数对比。线上耗时由负责人更新后复测。
- **不做**：给 `PostgresDB` 加连接池（另议）；改接口返回结构。

## B-18 线上初始数据导入命令（2026-11-18 负责人：体验版首页是空的）

- **依赖**：B-17（已完成）　**大小**：S　**只能改**：新建 `tools/load_seed.py`、`server/tests/` 对应测试、`docs/deploy.md`（加一节“首次导入初始数据”）
- **原因**：`server/db.py` 的 `DB`（SQLite）在空库时会写入 `server/seed.py` 的珠子、模板、宣传位、条款；生产用的 `server/db_postgres.py` 的 `PostgresDB` 不写。服务器（`DATABASE_URL` 指向 Postgres）因此珠子、模板、横幅、条款全空，首页、工作台、AI 配都没法测。
- **要做的**：`tools/load_seed.py`，在服务器上用 `sudo docker compose --env-file app.env exec app python tools/load_seed.py` 运行：
  1. 按 `server/app.py` 现有逻辑选库（有 `DATABASE_URL` 用 `PostgresDB`，否则 `DB`），**复用现有 `put`/`list`/`get`，不写 SQL**。
  2. 默认只预览：逐表打印“将新增 N 条 / 已存在跳过 M 条”，不写库；加 `--apply` 才写。
  3. 只补缺：按 id 判断，**已存在的记录一律不覆盖**（负责人可能已在后台改过价格、上传过封面）。表：beads、templates、banners、terms（条款保持 seed 里的 `draft` 状态）。
  4. 可重复运行：第二次 `--apply` 应全部“已存在跳过”。
  5. 加 `--only beads,templates,...` 选表。
  6. 不碰订单、用户、地址、售后等任何业务数据表；不删除任何记录。
  7. 输出不打印 `DATABASE_URL` 或任何环境变量值。
  - **不要**改 `PostgresDB` 让它启动时自动写（避免以后清空的表被自动塞回示例数据）。
- **测试**：用 SQLite 临时库（和现有测试一样）覆盖：空库预览不写入；`--apply` 写入数量等于 seed；已有同 id 记录（改过价格）不被覆盖；第二次运行全跳过；`--only` 只写指定表；输出里没有环境变量值。
- **`docs/deploy.md`**：在自检之后加一节“首次导入初始数据”：先跑预览，确认后加 `--apply`；说明之后在后台修改、上架或下架，不要再用此命令覆盖。
- **报告**：贴本机对临时库跑预览和 `--apply` 两次的输出。
- **不做**：图片上传（模板封面由负责人在后台传，前台没封面时用生成图兜底）；改 `seed.py` 内容。

## B-17 一键部署脚本 setup.sh（2026-11-17 负责人要）

- **依赖**：B-16（已完成）　**大小**：M　**只能改**：新建 `deploy/setup.sh`、新建 `deploy/CHECKLIST.md`、`docs/deploy.md`（第 4–6 节改成“跑脚本”，手动步骤留作备用）、`server/tests/` 或 `tools/` 下对应测试
- **目的**：国内同事登录腾讯云 CVM 后，在仓库根目录执行 `sudo bash deploy/setup.sh` 一条命令完成部署。执行 agent **不登录服务器、不接触任何真实密钥、不连商户平台**；脚本里一个真实值都不许出现。
- **`deploy/CHECKLIST.md`**（同事跑脚本前在网页上点完的勾选清单，每项写在哪个控制台、点哪里，拿不准写“以实际后台为准”）：ICP 备案已完成；安全组入站只开 80、443（8800 不开）；域名 A 记录指向公网 IP；SSL 证书已申请并下载 Nginx 格式；证书两个文件和商户私钥、微信支付公钥 pem 已上传到服务器（写清楚放哪个目录，脚本会问路径）；商户平台“AppID 账号管理”已关联小程序；手边准备好：域名、商户号、APIv3 密钥、证书序列号、公钥 ID、小程序 AppID 和 AppSecret。
- **`deploy/setup.sh` 要做的**（bash，`set -euo pipefail`，必须 root 运行，否则提示用 sudo）：
  1. 读 `/etc/os-release`，Ubuntu/Debian 走 apt、OpenCloudOS/CentOS/TencentOS 走 dnf/yum，安装 Docker、compose 插件、Nginx（已装就跳过）；命令与 `docs/deploy.md` 第 2 节一致。不认识的系统直接退出并提示照 `docs/deploy.md` 手动装。
  2. 建 `deploy/secrets`、`deploy/data/app`，属主 10001:10001，`secrets` 700。
  3. 交互问答：域名；商户号；小程序 AppID（同时写入 `WECHAT_APP_ID` 和 `WXPAY_APPID`）；AppSecret、APIv3 密钥**用 `read -s` 不回显**；证书序列号；公钥 ID；商户私钥、微信支付公钥 pem 的服务器路径（脚本复制进 `deploy/secrets/`，`chown 10001:10001`、`chmod 600`）；Nginx 证书和私钥路径。每项做最小校验（APIv3 密钥 32 位、文件存在、域名不带 `http`），不对就重问，不打印输入的值。
  4. 自动生成 `ADMIN_TOKEN`、`PHONE_SALT`、`MEDIA_LINK_SECRET`、数据库密码（`openssl rand -hex 32` 或 `/dev/urandom`）。`ADMIN_TOKEN` 只在最后提示“已写入 app.env，用 `sudo grep ADMIN_TOKEN deploy/app.env` 自己查看”，不打印。
  5. 以 `deploy/app.env.example` 为模板生成 `deploy/app.env`（`chmod 600`），`PAYMENT_PROVIDER=wechat`、`ENV=production`、`WXPAY_NOTIFY_URL=https://<域名>/api/payments/notify`、`DATABASE_URL` 与数据库变量一致；以 example 里实际有的变量为准，不在脚本里另造变量名。**`app.env` 已存在时先问“覆盖 / 保留”，默认保留**，保留时跳过问答直接进下一步；覆盖前备份成 `app.env.bak.<时间>`。
  6. 以 `deploy/nginx.conf.example` 生成 `/etc/nginx/conf.d/chuan.conf`，替换域名和证书路径；`nginx -t` 通过才 reload，失败就停下并说哪一步。
  7. `docker compose --env-file app.env up -d --build`，然后 `exec app python tools/check_deploy.py`，再跑 `--ping`；最后汇总打印：每步“完成 / 失败”、自检是否全部通过、`--ping` 是否 400，以及下一步提示（小程序后台加 request 合法域名、真机 0.01 元付款和退款）。
  8. 可以重复运行：已装的跳过、已有配置默认保留、不删数据目录、**绝不执行 `docker compose down -v`**。
  9. 任何地方不得 `set -x`、不得 echo 密钥类变量、不写日志文件含密钥。
- **测试**：`bash -n deploy/setup.sh` 语法检查；如本机有 `shellcheck` 跑一遍并在报告里贴结果；写一个测试（Python 或 bash）用假输入、`DRY_RUN=1` 和临时目录跑生成 `app.env` 和 nginx 配置那两段（脚本需支持 `DRY_RUN=1`：不装软件、不碰 `/etc`、不起容器，输出写到临时目录），断言：变量齐全且与 example 一致、通知地址正确、权限 600、终端输出里不出现输入的任何密钥值、已有 `app.env` 默认不被覆盖。
- **报告**：贴 `DRY_RUN=1` 跑一遍的终端输出（用假值）。说明在哪些系统上**没有**真机验证过。
- **不做**：真实部署、真实付款、申请证书或备案、改 `check_deploy.py` 的检查逻辑（发现它有问题写进报告，不要改）。

## B-15 微信发货信息录入（接了微信支付必须做）

- **依赖**：B-14；**负责人确认小程序后台“发货信息管理”已开通**　**大小**：S　**只能改**：新建 `server/wx_shipping.py`、后台发货路由里调用它的那一行、`server/tests/`、`docs/deploy.md`
- **为什么**：小程序用微信支付卖实物，微信要求发货后把物流信息录入给微信，否则订单资金结算会受影响，用户也收不到发货提醒。
- **要做的**：后台点发货（填快递公司和单号）时，调微信“发货信息录入”接口（以官方文档为准，报告里贴文档链接和字段），用支付单号关联；快递公司编码按微信给的列表映射，映射表放代码里并有测试。调用失败不阻断发货，记日志，后台工单上显示“微信发货信息未同步 · 重试”。access_token 复用公用取法（和 B-13 同一个函数；谁先做谁抽）。`PAYMENT_PROVIDER` 不是 `wechat` 时不调用。
- **测试**：用假接口覆盖成功、失败可重试、mock 通道不调用、快递编码映射。

## B-13 物流轨迹（2026-11-17 负责人定：用微信自带的物流服务，同事在申请）

- **依赖**：A11、V7a（V7a 也改订单详情）；**负责人确认微信物流服务和物流查询插件已开通**　**大小**：M　**只能改**：新建 `server/tracking.py`、订单详情和发货相关路由、`server/content_security.py` 里的 access_token 取法抽成公用函数（只搬不改行为）、`miniprogram/app.json`（只加插件声明）、`miniprogram/config.js`、`miniprogram/features/order-detail/*` 里物流那一块、`server/tests/`、`miniprogram/tests/` 对应测试、`docs/deploy.md`
- **不接第三方快递查询**，用微信小程序的物流服务（查询组件）：
  1. 后台发货（填快递公司和单号）后，后端调微信“传运单”接口，拿到 `waybill_token` 存进订单；接口地址、字段以微信官方文档为准，**开工前先在报告里贴出你用的接口文档链接和字段**，和下面写的不一致就照文档、并在报告里说明。
  2. 订单详情“物流”一行：点了用物流查询插件打开轨迹（传 `waybill_token`）；插件 AppID 和版本写在 `miniprogram/config.js`，`app.json` 里按微信要求声明。没有 token（老订单、调用失败）时显示“快递公司 + 单号 + 复制”，不报错。
  3. access_token 复用 `content_security.py` 现有的取法（抽成一个公用函数），不新增密钥；AppID、AppSecret 只读环境变量。
  4. 调用失败记日志、可在后台重试，不影响发货本身。
- **测试**：用假接口覆盖：发货后存 token、接口失败不影响发货、老订单回退显示单号。
- **不做**：自己存和轮询物流轨迹。

---

## B-14 接入微信支付（2026-11-16 负责人确认：商户号和密钥已备好，可以开工）

- **依赖**：A5b（已完成）　**大小**：L　**只能改**：`server/payments.py`、新建 `server/wechat_pay.py`、支付和退款相关路由、`server/config` 里读环境变量的地方、`miniprogram/pages/order/order.js`、`miniprogram/features/order-detail/order-detail.js` 里付款那一段、`server/tests/`、`miniprogram/tests/` 里支付相关测试、`docs/deploy.md`（没有就新建）
- **通道开关**：沿用现有环境变量 `PAYMENT_PROVIDER`（`payments.py` 已有，默认 `none` 不可付款；`mock` 只在开发和开了开关的体验版能用、正式环境禁用），只新增一个取值 `wechat`。不配置时一切照旧，现有测试全部不改就能过。
- **密钥只读环境变量，仓库里一个字都不许出现**：`WXPAY_MCHID`、`WXPAY_APPID`、`WXPAY_API_V3_KEY`、`WXPAY_CERT_SERIAL`、`WXPAY_PRIVATE_KEY_PATH`（商户私钥文件路径）、`WXPAY_PLATFORM_PUBLIC_KEY_PATH` 和 `WXPAY_PLATFORM_PUBLIC_KEY_ID`（微信支付公钥；如负责人用的是平台证书，就改读平台证书，两种都支持）、`WXPAY_NOTIFY_URL`（https 回调地址）。`wechat` 通道缺任何一项，启动时报错并说缺哪一项，不许静默退回 mock。
- **后端**：
  1. 下单：JSAPI 下单（`/v3/pay/transactions/jsapi`），金额用订单的“分”整数，`openid` 用登录用户的；返回 `wx.requestPayment` 要的 `timeStamp`、`nonceStr`、`package`、`signType=RSA`、`paySign`。同一订单重复点付款要复用未过期的预付单，不重复下单。
  2. 回调 `/api/payments/notify`：验签 → AES-256-GCM 解密 → 核对商户号、订单号、金额 → 调 `apply_callback`（和模拟支付同一个函数）；重复回调幂等；验签失败返回失败、不改订单。
  3. 前端付完不信前端结果：`requestPayment` 成功后调查单接口确认，没确认前订单页显示“支付确认中”。
  4. 退款：`handle_refund` 调 `/v3/refund/domestic/refunds`，退款回调同样验签解密幂等处理；金额不能超过实付。
  5. 用标准库加 `cryptography`（项目已有依赖就用，没有先停下来问）；不引入第三方微信支付 SDK。
- **小程序**：`payment.mock` 为真走原来的模拟流程；否则调 `wx.requestPayment`，用户取消时提示“已取消支付”、订单仍是待付款可以再付。
- **测试**：用测试里临时生成的 RSA 密钥对伪造签名和回调，覆盖：下单参数和签名、验签失败、金额不符、重复回调、退款超额、缺环境变量报错、mock 通道不受影响。**不许在测试或代码里放任何真实商户号、密钥、openid。**
- **部署说明**：在 `docs/deploy.md` 写清楚负责人要在服务器上配的环境变量、私钥文件放哪、商户平台要配的回调地址、上线前自检步骤。
- **不做**：真实环境的付款验证由负责人用一笔小额真实订单完成（付款 → 退款），执行 agent 不拿密钥、不连真实商户平台。
---

## A5c 改手围重串

- **依赖**：A5b；**负责人定重串规则**　**大小**：M

售后“改手围重串”收到寄回后，按新手围重新排一次（自己串的手串：按原来的珠子比例加减主珠；模板手串：用模板配方重新 `_fill`），生成一张新工单（关联原订单），走同样的做单、质检、发货。**负责人已定（2026-11-14）**：加减哪种珠子、差价补不补退不退，**都由客服打电话或加微信线下沟通**，系统不自动算。
- 收到寄回后，后台在售后详情点“生成重串工单”：新工单关联原订单和售后单，带上新手围，珠序先复制原订单的珠序。
- 重串工单（只限这种工单）允许后台改珠序：加、减、换珠子都行，必须填一句备注（写沟通结果），记操作记录；普通工单仍然禁止改用料（`_FORBIDDEN_WORK_ORDER_MUTATIONS` 不放开）。
- 工单页显示新手围、按新珠序算的颗数和长度（用 `plans` 同一套尺寸规则，只是显示参考，不自动改珠子），和一行“珠子增减和差价已线下沟通”。
- 之后走同样的做单、质检、发货；系统不新增付款或退款流程，原订单金额不变；小程序里不出现补款或退款按钮。

---

## A10 清理旧字段（上线前最后做）

- **依赖**：小程序和后台都不再读旧字段（C11 完成后）　**大小**：S

删掉订单里的中文 `status` 字段写入、`paymentAvailable`；删之前全仓库搜一遍 `miniprogram`、`admin-web` 里没有读它们的地方。迁移不删已有数据，只是不再写。
