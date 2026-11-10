# 串个珠 · 本地服务

## 小程序数据接口（开发基础）

设置 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 后，`POST /api/auth/wechat` 接收 `{"code":"微信 wx.login 返回的 code"}`；成功返回 `token` 与秒级 Unix 时间 `expiresAt`。后续请求发送 `Authorization: Bearer <token>`，服务端只保存 token 的哈希。未配置微信凭证时返回 503；不可使用伪造用户身份。

- `GET /api/designs`：当前用户的设计列表。
- `POST /api/designs`：`{"name":"我的手串","beads":["zt8"],"wrist":15}`，返回包含 `id` 的设计。
- `PUT /api/designs/{id}`：更新自己的设计，字段同上，必须额外带 `expectedUpdatedAt`（上次获取的 `updatedAt`）。成功返回新 `updatedAt`；若其他设备已修改则返回 HTTP 409、`code: design_conflict`，服务端不覆盖原设计，客户端应保留本地草稿并提示用户处理冲突。
- 设计支持可选模板信息 `special`、`pattern`、`tail`（珠子 ID 数组）、`fixed`（整数或 null）、`source`、`tplId`、`meaning` 和 `edited`。旧客户端更新时省略这些字段会保留云端原值；传入空数组或 null 表示显式清除相应字段。
- `GET /api/my/orders`：仅返回当前用户订单。
- `POST /api/my/orders`：提交 `requestId`（每次新购买生成唯一 16–128 位英文字母、数字、下划线或连字符，网络重试须沿用且请求内容不变）、`name`、`beads`、`wrist`、`cord`（0 或 1）、`gift`（布尔）、`person`、`phone`、`addr` 和用户确认的 `confirmedQuote`。报价格式为 `{"totalFen":整数,"items":[{"id":"珠子ID","unitPriceFen":整数,"mm":数字}]}`，每种珠子只提供一次；金额单位为分。服务端对比当前价格、规格和总价，并在插入事务中重新检查材料快照；发生变化返回 HTTP 409 `price_changed`，必须刷新后由用户重新确认。相同请求编号和内容重复提交返回同一订单，内容不同返回 409 `idempotency_conflict`。新订单为“待支付”，`paymentAvailable` 为 false，不会自动进入履约。

旧网页演示仍使用 `/api/orders`，默认关闭；只有本地明确设置 `DEMO_ORDERS=1` 才开放。此 SQLite 实现适合本地开发，不是生产数据库或完整支付系统。小程序正式上线仍需安全的后台认证、微信支付及回调验证、可靠的生产数据库、HTTPS 和部署环境、订单并发与幂等、数据备份和日志脱敏等。勿将微信密钥提交到仓库。

### PostgreSQL 适配与本地迁移演练

默认不需要额外依赖，继续使用 SQLite。需要 PostgreSQL 时，在隔离的虚拟环境安装 `python -m pip install -r server/requirements-postgres.txt`，并通过环境变量配置 `DATABASE_URL`；URL 只通过安全环境变量提供，勿写入代码、命令历史或日志。默认部署镜像未内置 PostgreSQL 驱动，需要为 PostgreSQL 构建包含该依赖的镜像。

首次切换前，停止写入、备份 SQLite 并使用**空的目标数据库**执行：

```bash
python server/migrate_sqlite_postgres.py --sqlite /实际路径/data.sqlite3
```

迁移脚本从环境变量读取 `DATABASE_URL`，创建兼容的 JSONB 表并在单个事务内复制 SQLite 一致性快照；目标任一表非空时拒绝导入，不覆盖既有数据。迁移范围包含用户会话、设计、订单和分享数据，执行前须确认这些数据属于允许迁移的数据；上传图片目录需要单独复制或迁至对象存储，迁移不会修改其 URL。迁移后核对数量及交易数据，再配置 `DATABASE_URL` 启动服务，避免在迁移过程中产生新写入。

可通过环境变量 `BEADLOOP_TEST_DATABASE_URL` 指向隔离的测试 PostgreSQL，再执行 `python -m unittest discover -s server/tests`，测试会创建并删除唯一临时 schema。适配器已在本地 PostgreSQL 16 测试设计并发冲突、订单幂等和报价检查，尚不是完成生产数据库改造：当前仍是 JSON 文档表，需要完善关系模型与查询索引、版本迁移、连接池、权限、加密、备份恢复和监控后再进行生产评估。

前台（小程序原型）+ 网页后台 + 接口 + AI，一个命令启动，只用 Python 自带的库。

```bash
python3 server/app.py
```

- 前台：http://127.0.0.1:8800/ （用浏览器手机模式看）
- 后台：http://127.0.0.1:8800/admin

数据存在 `server/data.sqlite3`，上传的图片在 `server/uploads/`。删掉这两个就回到初始示例数据。

容器调试时可设置 `DATA_DIR` 为挂载的持久目录（影响数据库和上传文件）；也可单独设置 `DATABASE_PATH` 和 `UPLOADS_DIR`。默认只监听 `127.0.0.1`。确需容器对外监听时设置 `SERVER_HOST=0.0.0.0`、`ALLOW_PUBLIC_BIND=1` 和 `ADMIN_TOKEN`，并保持 `DEMO_ORDERS` 未开启，仍需配合 HTTPS 反向代理、鉴权、访问控制和生产数据库；这些选项并不等同上线准备完成。

## 后台能做什么

| 页签 | 内容 |
|---|---|
| 珠子 | 上架 / 编辑 / 下架 / 删除。尺寸和单价必填。上传白底实拍图后自动取色；花纹特殊的珠子可另传纹理图给 3D 用。 |
| 模板 | 用“开头珠 / 循环花型 / 结尾珠”三排积木搭热门款，右侧实时预览 15cm 手围的颗数和价格。可传成品实拍封面。 |
| 宣传位 | 角标、标题、说明、点击去哪（某个模板 / 自己串 / AI 配）、是否只给新人看。 |
| 订单 | 查看和搜索订单、手串明细、尺寸、金额与收货信息；当前后台不提供发货操作。 |

改完前台刷新就生效。下架的珠子会让用到它的模板、宣传位自动隐藏。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/catalog` | 前台用：在售珠子、模板、宣传位、AI 状态 |
| POST | `/api/orders` | 前台下单，价格由服务端重新计算 |
| POST | `/api/ai/design` | AI 配：心愿 + 对话记录 → 3 条候选 |
| POST | `/api/ai/photo` | 拍照做同款：照片 → 认出主珠 / 配珠 / 金属点缀各是哪颗（只认不设计） |
| POST | `/api/ai/review` | AI 帮你看看：肯定 + 寓意 + 最多 2 条可一键采纳的建议 |
| GET/POST/PUT/DELETE | `/api/admin/{beads,templates,banners}` | 后台增删改 |
| GET | `/api/admin/orders` | 后台查看订单；当前管理界面不提供发货或状态修改 |
| POST | `/api/upload` | 后台上传图片 |

设置环境变量 `ADMIN_TOKEN=口令` 后才能使用后台接口；未设置时后台接口拒绝访问。口令仅用于本地开发，不能替代正式上线所需的账号、权限和安全控制。

## 接 AI

不配置时，`/api/plans/match` 使用本地规则匹配方案并以 `by: rules` 标注；`/api/ai/*` 返回 503，用户端应明确展示暂不可用。照片识别不会被伪装为已成功。

**国内上线（推荐）**：用已备案的国内模型，走兼容 OpenAI 的接口：

```bash
AI_PROVIDER=openai \
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 \
AI_API_KEY=你的Key \
AI_MODEL=qwen-plus \
AI_VISION_MODEL=qwen-vl-plus \
python3 server/app.py
```

`AI_VISION_MODEL` 是拍照做同款用的看图模型；未配置时该接口不可用。

**Claude（海外部署或内部测试）**：需要 Python 3.10+ 和 `pip install anthropic`：

```bash
AI_PROVIDER=claude ANTHROPIC_API_KEY=你的Key python3 server/app.py
```

默认模型 `claude-opus-5-5`，可用 `CLAUDE_MODEL` 改。

AI 只负责挑珠子、起名字、写寓意；珠子 id 不在在售目录里的结果会被丢掉，颗数、长度、价格都由代码按手围计算。输出会过一遍广告法敏感词（`ai/__init__.py` 里的 `BANNED`）。正式上线还要接微信内容安全接口 `msgSecCheck`。

## 正式版要换掉的部分

- 数据库：PostgreSQL JSONB 适配器已用于本地验证，仍需设计生产数据库模型、迁移机制、连接池、备份、恢复和监控；SQLite 仅作为开发用途。
- 图片：本地文件夹 → 云存储 + CDN 缩略图。
- 后台登录：现在只有一个口令，正式版需要账号和权限。
- 前台：原生小程序已开始开发，微信环境联调和生产验收仍未完成。
