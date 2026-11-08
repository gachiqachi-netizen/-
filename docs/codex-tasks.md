# 执行 agent 工作手册与任务清单（2026-11-04，2026-11-08 起由 Kimi 接手）

这份文档有三个读者：

- **你（产品负责人）**：看第 1 节怎么派活、怎么验收，看第 5 节哪些事只能你来做。
- **执行 agent**：每次开工先读第 2 节守则，再读分到的那条任务（第 4 节）。
- **审查（Claude）**：执行 agent 每做完一条，按第 1.3 节审完再合并。

审查依据：提交 5e4945b 的代码审查。小程序逐条问题和行号见 [review-miniprogram-2026-11-04.md](review-miniprogram-2026-11-04.md)；知识库方案审校意见见 `kb/data/review/plans.json`。

---

## 1. 怎么派活（给你）

### 1.1 顺序

| 波次 | 任务 | 什么时候开始 | 能不能并行 |
|---|---|---|---|
| 第一波 | T1 T2 T3 T4 T16 | 现在 | 5 个都能同时开，改的文件互不重叠 |
| 第二波 | T5–T12、T17、T18 | 第一波全部合并后 | T5、T6 改后端，二选一先做，另一个等它合并；T7–T12、T17、T18 可以同时开 |
| 第三波 | T13 T14 T15 T19 | T13、T14 要你先定方向（见每条任务里的“待你决定”）；T15、T19 随时可做 | 可以同时开 |

一条任务一个 执行 agent 会话。同一个会话里不要连着做多条任务。

### 1.2 派活时粘贴给 执行 agent 的话

把下面这段整段发给 执行 agent，只改任务编号：

```text
你在“串个珠”仓库工作。先完整读 docs/codex-tasks.md 的第 2 节“执行 agent 工作守则”，再读第 4 节里的 T3，严格按 T3 的“要做”和“验收”完成。
只改 T3 列出的文件；需要改别的文件时先停下来说明原因。
做完按第 2.6 节的格式汇报。
```

### 1.3 执行 agent 做完以后

1. 看它的汇报：验收项是不是都打了勾，测试命令的输出有没有贴出来。
2. 让我审一下：在这个对话里说“审一下 T3 的分支 agent/t3-xxx”（或 PR 链接）。我会看代码、跑测试、核对验收项，给出“可以合并”或“要改哪几处”。
3. 要改就把我的意见原样贴回给那个 执行 agent 会话。
4. 可以合并后：在 GitHub 上合并 PR；如果没开 PR，就在 GitHub Desktop 里切到 main，选 Branch → Merge into current branch，再 Push。
5. 一波全部合并后再开下一波。

---

## 2. 执行 agent 工作守则（执行 agent 每次必读）

### 2.1 先了解项目

开工前读：`README.md`、`docs/architecture.md`、`开发与上线准备.md`。涉及界面的任务，再看根目录 `prototype.html` 里对应的功能（它是功能最全的参照版本）。涉及珠子知识的任务，读 `kb/SCHEMA.md`。

### 2.2 环境

- Python：用系统的 `python3`（3.9 及以上），后端只用标准库。PostgreSQL 相关才需要 `pip install -r server/requirements-postgres.txt`。
- Node：需要 v18 及以上（`node --version` 确认）。不在 PATH 里就先找到它的位置加进 PATH；负责人那台 Mac 上的位置是 `~/.local/toolchains/node/bin`。小程序没有 package.json，不要为了跑测试新增依赖。
- AR 手部模型：`tools/hand-tracker/models/` 不进 git。没有这个目录时运行 `python3 tools/hand-tracker/download_models.py` 从官方地址下载（约 12.7MB）；本地后端会在 `/models/` 下提供这些文件。
- 本地后端（小程序开发用 8801 端口）：
  ```bash
  PORT=8801 ADMIN_TOKEN=local-dev-only DISABLE_DEMO_ORDERS=1 DEV_LOGIN=1 python3 server/app.py
  ```
  后台地址 `http://127.0.0.1:8801/admin`。`DEV_LOGIN=1` 打开开发测试登录（没有微信 AppSecret 时用），只能用于本地。`server/data.sqlite3` 是本地数据，删掉会用示例数据重建。
- 微信开发者工具：导入 `miniprogram/` 目录。你没法操作这个工具的，就在汇报里写“需要在开发者工具里验证”的具体步骤。

### 2.3 分支和提交

- 从最新的 `main` 拉分支，名字用 `agent/t<编号>-<英文短名>`，例如 `agent/t5-pricing`（第一波沿用的 `codex/` 分支名不改）。
- 一条任务一个分支；可以多次提交，提交信息用中文写清改了什么。
- 能开 PR 就开 PR，标题写“T3 材料清单与安全提示”；不能开就把分支留在本地，汇报里写分支名。
- 不要改别的任务的文件，不要顺手重构无关代码，不要改 `kb/data/` 下的数据（T15 除外）。

### 2.4 硬性规定

- 不接真实支付，不写任何真实的 AppSecret、密钥、令牌、手机号、地址。需要配置的地方用环境变量或占位值，并在 `开发与上线准备.md` 里说明。
- 给用户看的文字只讲寓意不讲功效：要过 `kb/data/attributes.json` 的 `banned` 词表（“转运珠”“本命年”除外）。不确定的说法不写。
- 金额一律按“分”算整数，和 `server/user_api.py` 一致。
- 尺寸规则不能改：总长 = 手围×10 + max(8, 2.5×主珠直径 − 5) mm，合适区间 −4 到 +6mm；54 颗及以上按念珠处理。
- 不删已有测试；改了行为就改对应测试并说明原因。
- 拿不准产品意图时停下来问，不要猜着做。

### 2.5 每条任务做完必须通过

```bash
python3 -m unittest discover -s server/tests
node --test miniprogram/tests/*.test.js
python3 kb/validate.py
```

改了方案库还要跑 `python3 kb/validate_plans.py`。新增的逻辑要加测试：后端放 `server/tests/`，小程序放 `miniprogram/tests/`（用 `node:test`，参考现有文件的写法）。

### 2.6 汇报格式

```text
任务：T3 材料清单与安全提示
分支 / PR：agent/t3-xxx（PR 链接）
改了什么：3–6 条，每条一句
验收：
- [x] 验收项 1 …（怎么验证的）
- [ ] 验收项 2 …（没做到的原因）
测试输出：三条命令的最后几行
需要在微信开发者工具或真机上验证的步骤：…
遗留问题 / 需要产品决定的：…
```

---

## 3. 审查结论（背景）

**主体可以继续，不用推倒重来。** 后端和小程序主流程写得扎实：尺寸、颗数、价格计算和原型一致；登录、按用户隔离、下单幂等、价格复核、设计版本冲突都做了；后端 21 项、小程序 15 项测试全部通过。

**离上线还差 4 个硬伤**（T1–T4）：正式环境接口地址写死本机、AR 模型挂在别人的测试 CDN、小程序不展示有毒提示、列表缩略图每个都开 WebGL。其余是体验和维护问题。

可以直接沿用的：后端用户/设计/订单接口与安全默认值；SQLite 与 PostgreSQL 双存储；`pages/editor/logic.js`、`utils/template.js`、`pages/order/order.js` 的计算；`utils/auth.js`、`utils/design.js` 的登录与同步；3D 组件和拍照同款确认页的逐级降级。

---

## 4. 任务

每条任务的格式：**目标 / 现状 / 改动文件 / 要做 / 验收**。

### 第一波（P0，可同时开）

#### T1 按环境配置接口地址
- **目标**：开发、体验、正式三种版本都能连上对的后端。
- **现状**：`miniprogram/app.js:6` 开发版真机写死局域网 IP `192.168.2.156:8802`，体验版和正式版写死 `http://127.0.0.1:8800`，上线后所有接口都失败。
- **改动文件**：`miniprogram/app.js`、`miniprogram/utils/api.js`、新建 `miniprogram/config.js`、新建 `miniprogram/config.local.example.js`、`.gitignore`、`开发与上线准备.md`、`miniprogram/tests/`。
- **要做**：
  1. `config.js` 按 `wx.getAccountInfoSync().miniProgram.envVersion` 给出 `apiBase`：develop 在开发者工具里用 `http://127.0.0.1:8801`；develop 真机从 `config.local.js` 读局域网地址（这个文件加进 `.gitignore`，提供 `config.local.example.js` 示例），没有就在页面上提示去配置；trial 和 release 只接受 `https://` 开头的地址，先放占位 `https://api.example.com`，不是 https 时启动就报错并在控制台说明。
  2. 删掉代码里所有写死的 IP 和端口。
  3. `开发与上线准备.md` 写清三种环境怎么配。
- **验收**：全仓库搜不到 `192.168.`；非 develop 分支里没有 `http://`；新增测试覆盖三种 envVersion 和 https 检查。

#### T2 AR 手部模型自己托管并缓存
- **目标**：试戴页不依赖第三方测试地址，第二次进入秒开，失败能降级。
- **现状**：`tools/hand-tracker/build.js:9-11` 把模型地址换成 `cdn.static.oppenlab.com/weblf/test/...`（第三方测试目录，约 12.5MB），每次进页面重新下载。
- **改动文件**：`tools/hand-tracker/build.js`、`tools/hand-tracker/runtime.ts`、`tools/hand-tracker/README.md`、`miniprogram/ar-hand/*`（重新构建产物）、`miniprogram/pages/ar-tryon/*`。
- **要做**：
  1. 模型根地址改成运行时从配置读，构建产物里不写死任何第三方地址：**开发版默认用本地后端 `apiBase + '/models'`**（后端已提供 `/models/` 地址，文件来自 `tools/hand-tracker/models/`，没有这个目录就先运行下载脚本）；体验版和正式版用对象存储域名，先放占位 `https://static.example.com`，等负责人上传后再填。
  2. 模型文件用 `python3 tools/hand-tracker/download_models.py` 从 TensorFlow Hub 官方地址下载（已写好），上传后的目录结构固定为：`<模型根地址>/handpose/v1/handdetector/model.json`（加两个 .bin 分片）、`<模型根地址>/handpose/v1/handskeleton/model.json`（加两个 .bin 分片）、`<模型根地址>/handpose/v1/anchors.json`。代码按这个结构拼地址，`<模型根地址>` 和版本号 `v1` 从配置读。`tools/hand-tracker/README.md` 写清模型来源（TensorFlow.js handpose，Apache-2.0）和这个结构。上传由负责人完成（见第 5 节）。
  3. 首次下载后用 `wx.getFileSystemManager` 存到用户目录，之后先读缓存；配置里的版本号变了才重新下。注意小程序本地缓存上限，超出时给出提示。
  4. 加载时显示进度百分比；超过 20 秒或失败时提示，并提供“改用照片试戴”按钮跳到 `pages/tryon`。
- **验收**：构建产物里搜不到 `oppenlab`；模拟下载失败能降级；缓存读写逻辑有测试；汇报里写清真机验证步骤。

#### T3 材料清单、卖点、讲解和安全提示
- **目标**：用户在编辑、下单、订单详情都能看到每种珠子的卖点、讲解和安全提示。
- **现状**：后端 `/api/catalog` 每颗珠子带 `points`（卖点）、`meaning`/`summary`（讲解）、`safety`（有毒提示，例如朱砂、红豆杉、相思子、元宝菩提），小程序全部没展示（`pages/editor/editor.js:23` 算了 points 但没渲染）。原型的做法见 `prototype.html` 的 `notesHtml`。
- **改动文件**：`miniprogram/pages/editor/*`、`miniprogram/pages/order/*`、`miniprogram/pages/order-detail/*`、`server/user_api.py`、`server/tests/test_user_api.py`、`miniprogram/tests/`。
- **要做**：
  1. 编辑器加“材料清单”区：每种珠子一行，显示名称、尺寸、数量、小计、卖点（`points` 用“ · ”连接）、一句讲解；有 `safety` 的用红字单独一行。
  2. 下单确认页和订单详情：有安全提示的珠子同样红字提示；提交订单前的确认弹窗里再列一次。
  3. 后端订单快照 `items` 加上 `kb`、`points`、`safety`；订单详情从快照读，不依赖当前目录。
- **验收**：含元宝菩提或朱砂的设计，在三个页面都能看到红字提示；后端测试覆盖快照新字段；小程序测试覆盖材料清单的数据整理函数。

#### T4 缩略图改成静态图片
- **目标**：列表页不再同时开几十个 WebGL，真机不黑块、不闪退。
- **现状**：`miniprogram/components/bracelet-thumb/index.js` 每个实例创建一个 WebGL 上下文，“我的”页和 AI 页可能同时存在几十个。
- **改动文件**：`miniprogram/components/bracelet-thumb/*`、新建 `miniprogram/utils/thumb-cache.js`、`miniprogram/tests/`。用到组件的页面只在必要时改属性，不改布局。
- **要做**：用一个离屏画布（优先 `wx.createOffscreenCanvas` 2d）按珠子序列和颜色画成图片，`canvasToTempFilePath` 后按“珠子 id 序列 + 尺寸”做缓存 key；组件只显示 `<image>`；画失败显示平面圆环占位图。3D 交互只留在编辑器和试戴页。
- **验收**：“我的”页 50 条作品滚动不卡、不黑块（附开发者工具性能面板截图）；测试覆盖缓存命中和失败占位。

#### T16 下单前刷新目录，价格以最新为准
- **目标**：后台改价或下架后，用户下单前一定看到最新价格，不在提交时才报错。
- **现状**：`utils/api.js:21-26` 开发版永远返回打包的目录快照（没有 `safety`），平时目录也只在进程里缓存一次（见 `docs/architecture.md` 风险 2）。
- **改动文件**：`miniprogram/utils/api.js`、`miniprogram/utils/catalog-preview.js`、新建 `tools/refresh-catalog-preview.js`、`miniprogram/pages/order/order.js`（只改进入页面时的目录刷新）。
- **要做**：
  1. 开发版也优先请求 `/api/catalog`，只有请求失败时才用快照，并在页面顶部提示“正在使用离线示例数据”。
  2. 写 `tools/refresh-catalog-preview.js`：从本地后端拉 `/api/catalog` 重写快照文件，保证带 `points`、`safety` 等字段。
  3. 进入下单页时强制刷新目录；有珠子下架或价格变了，列出变化让用户确认后再提交。
- **验收**：后台把某颗珠子改价后，进下单页能看到变化提示；测试覆盖“价格变化 → 提示”的逻辑。注意：订单页其余部分归 T5，本任务只改进入页面时的刷新。

### 第二波（P1，第一波合并后开始）

#### T5 计价规则只留一份，旧演示下单默认关闭
- **目标**：改一处计价参数，所有地方一起变；只保留一条正式下单路径。
- **现状**：手工费 15、编织绳 5、礼盒 10、满 99 免运费否则 8，在旧接口 `/api/orders`、新接口 `/api/my/orders`、小程序、原型里各写一遍。旧接口不用登录、带首单立减 10，默认开着。
- **改动文件**：新建 `server/pricing.py`、`server/app.py`、`server/user_api.py`、`miniprogram/pages/order/*`、`prototype.html`（只改读计价参数的地方）、`Dockerfile`、`开发与上线准备.md`、`server/tests/`。
- **要做**：
  1. `pricing.py` 定义计价参数和 `quote(items, options)`，两个下单接口都调它；`/api/catalog` 返回 `pricing` 字段，小程序和原型从这里读。
  2. 旧演示接口改为只有设置 `DEMO_ORDERS=1` 才开放（替代 `DISABLE_DEMO_ORDERS`），文档和 Dockerfile 同步改。
  3. 首单立减：没接支付前任何接口都不发。
- **验收**：测试覆盖“改参数后两个接口和 `/api/catalog` 一致”和“未设 DEMO_ORDERS 时旧接口返回 403”。

#### T6 按用户查询加索引，登录会话可清理
- **目标**：用户多了查询不变慢；退出登录有效；过期会话不堆积。
- **现状**：`GET /api/designs`、`/api/my/orders` 把整张表读出来再按 `userId` 过滤；过期会话从不删除，也没有退出登录。
- **改动文件**：`server/db.py`、`server/db_postgres.py`、`server/migrate_sqlite_postgres.py`、`server/app.py`、`server/user_api.py`、`server/tests/`。
- **要做**：
  1. 两个 DB 类加 `list_by_owner(table, user_id)`。SQLite 给 designs、orders 加 `user_id` 列并建索引（启动时自动迁移旧数据）；PostgreSQL 建 `(doc->>'userId')` 表达式索引。
  2. 新增 `POST /api/auth/logout`，删除当前会话；启动时清理一次过期会话，之后每 24 小时清理一次。
- **验收**：测试覆盖“只返回本人数据”“退出后令牌失效”“过期会话被清理”；设置 `BEADLOOP_TEST_DATABASE_URL` 后 PostgreSQL 集成测试通过（没有数据库就在汇报里说明未跑）。

#### T7 AI 方案跟着手围走，分享页按查看者手围重排
- **目标**：改了手围，AI 方案和朋友分享的设计都会按新手围重新算颗数。
- **现状**：`pages/ai/ai.js:46` 把方案的 `count` 当固定颗数存进设计，之后改手围不会重排；分享落地页沿用分享者手围，文案却写“按你的手围串”。方案卡片没显示讲解和超预算提示。
- **改动文件**：`miniprogram/pages/ai/*`、`miniprogram/pages/shared/*`、`miniprogram/utils/design.js`、`miniprogram/tests/`。
- **要做**：只有 `/api/plans/match` 返回 `fixed`（108 颗这类）时才存固定颗数，其他存 `special/pattern/tail`，按手围重排。分享页按查看者手围重排，文案改为“已按你的 X cm 手围重新排好”，查看者没量过手围就用 15cm 并提示可修改。方案卡片显示讲解，`overBudget` 时标“略超预算”，`swapped` 非空时显示换珠说明。
- **验收**：测试覆盖“改手围后颗数变化”“108 颗不变”“分享页按查看者手围”。

#### T8 页面栈不再越压越深
- **目标**：反复在编辑和下单之间来回，不会撞到小程序 10 层页面上限。
- **改动文件**：新建 `miniprogram/utils/nav.js`；把各页面里打开编辑器、下单页的 `navigateTo` 换成调用它（只改这几处调用）。
- **要做**：`openEditor`、`openOrder`：页面栈里已有目标页就 `navigateBack` 到它，否则在栈深 ≥8 时用 `redirectTo`；下单成功后 `reLaunch` 到订单详情。
- **验收**：测试模拟“编辑 → 下单 → 返回编辑”20 次，栈深不超过 10。

#### T9 编辑器和 AR 性能
- **改动文件**：`miniprogram/pages/editor/*`（除 T3 加的材料清单外的渲染逻辑）、`miniprogram/components/bracelet3d/*`、`miniprogram/pages/ar-tryon/*`。
- **要做**：编辑操作只 setData 变化的字段，不传整份材料列表；3D 视图加减珠子时增量更新，不全部重建；AR 推理复用帧缓冲，把每帧的拷贝从 4 次降到 1 次以内。
- **验收**：连续添加 30 颗珠子不明显掉帧；附开发者工具性能截图和改动前后的 setData 数据量对比。

#### T10 拍照上传前压缩
- **改动文件**：`miniprogram/pages/photo/*`、`miniprogram/tests/`。
- **要做**：选图后用 `wx.compressImage` 或画布把长边缩到 1024px、质量 0.8 左右再转 base64；超过 1MB 继续压。上传超时给明确提示，并走现有的本地颜色识别降级。
- **验收**：5MB 原图上传体积 ≤1MB；测试覆盖尺寸计算函数。

#### T11 真机测试代理放行完整接口
- **改动文件**：`tools/phone-test-proxy.py`。
- **要做**：白名单加上 `/api/plans/match`、`/api/ai/*`、`/api/shares`、`/api/kb/*`、`/api/auth/*`；文件头写清只用于局域网开发、不能对公网开放。
- **验收**：用代理在真机上走通 AI 配、拍照同款、分享（写清验证步骤）。

#### T12 包体积和分包
- **改动文件**：`miniprogram/project.config.json`、`miniprogram/app.json`（以及移动页面目录时被影响的跳转路径）。
- **要做**：`packOptions.ignore` 排除 `tests/`；`minified` 改为 true；试戴、分享落地页、订单详情移到分包，主包只留首页、自己串、AI 配、我的、编辑器、下单。
- **验收**：开发者工具“详情 → 本地代码”的主包体积比现在（约 0.85MB）小，附截图；所有跳转路径更新后小程序测试通过。

#### T17 用户文字内容安全
- **目标**：用户写的设计名、分享标题，以及 AI 生成的文字，过微信内容安全检查，避免审核和合规问题。
- **改动文件**：新建 `server/content_security.py`、`server/user_api.py`（保存设计和创建分享时调用）、`server/plans.py` 不改、`server/tests/`。
- **要做**：封装微信 `msgSecCheck`（需要 access_token，用 `WECHAT_APP_ID`/`WECHAT_APP_SECRET` 换取并缓存）；没配置凭证时跳过检查并记日志；检查不通过返回 400 和友好提示。AI 返回的文字同样检查，不通过就丢弃该条。
- **验收**：测试用假的检查函数覆盖“通过 / 不通过 / 未配置”三种情况。

#### T18 尺寸规则测试补齐
- **目标**：尺寸规则有专门的测试守住，以后谁改都会被发现。
- **改动文件**：新建 `miniprogram/tests/size-rule.test.js`、新建 `server/tests/test_sizing.py`。
- **要做**：手围 13–19cm、珠径 6/8/10/12/14mm 的组合，检查一键铺满后长度都在 −4 到 +6mm 区间（做不到的组合要和原型、`kb/data/rules.json` 的说法一致）；54 颗以上按念珠处理；小程序和后端 `plans.py` 的 `_fill` 对同一输入结果一致。
- **验收**：新测试通过；如发现小程序和后端结果不一致，在汇报里列出，不要自行改算法。

### 第三波（P2）

#### T13 视觉和设计规范同步
- **待你决定**：这次提交把视觉改了：托盘底色接近纯白、卡片加边框、语音按钮用 emoji 🎙、编辑页把“名称与寓意”“按颗数串”折叠、“去下单”前加了“完成设计”页。原设计规范是托盘用浅色绒布渐变、卡片不加边框、不用 emoji 当图标。请在派这条任务时告诉 执行 agent：保留新视觉（更新规范）还是改回原规范，或者逐项说明。
- **改动文件**：`prototype.html` 的样式、`miniprogram/app.wxss` 和各页面 `.wxss`、`docs/` 下新建 `design-tokens.md`。
- **要做**：按你的决定统一原型和小程序的颜色、边框、圆角 token，写进 `docs/design-tokens.md`；无论哪种决定，emoji 图标都换成线性 SVG 图标（24px 网格、1.5px 描边、圆角端点）。
- **验收**：原型和小程序同一页面截图对比，附在汇报里。

#### T14 隐私授权
- **改动文件**：`miniprogram/app.json`、`miniprogram/app.js`、用到相机、相册、剪贴板的页面、新建 `miniprogram/components/privacy-popup/*`、`开发与上线准备.md`。
- **要做**：接入 `wx.onNeedPrivacyAuthorization`，首次用相机、相册、剪贴板前弹授权说明，用户拒绝时给出能继续使用的路径；在 `开发与上线准备.md` 列出要在公众平台填写的隐私条目（手串照片会发到识别服务；手腕画面只在本机处理；收货信息用于发货）。
- **验收**：开发者工具里清除授权后能看到弹窗，拒绝后功能有降级提示。公众平台的填写由你完成。

#### T15 知识库方案修复
- **改动文件**：`kb/data/plans/*.json`、`kb/data/rules.json`、`kb/validate_plans.py`、`kb/SCHEMA.md`、`server/seed.py`（只往 `EXTRA` 里补珠子）。
- **要做**：
  1. `kb/validate_plans.py` 是上一轮写了一半的检查脚本，未验证：先跑通，补全检查项（格式和标签取值、品种存在且可用、尺寸、主珠统一、禁用词、珍珠挨硬石、绿松石配木珠或菩提、孩子款 <8mm、替代比原料贵、重复方案、同名方案）。
  2. 按 `kb/data/review/plans.json` 改 100 条方案：合并 15 组雷同方案并补缺口（乔迁、教师节、康复、父亲节母亲节、孩子、同事、爸爸、老师、男友高档、18 子、手绳、多宝、复古；“老师”先加进 SCHEMA 的 audience 取值）；修正违反串法禁忌的搭配；孩子款主珠 ≥8mm、不用易碎和染色材质；替代珠不能比原料贵；同料预算档统一；删掉讲解里的内部说明和误导名字；讲解里“转运珠”叫“路路通”；108 颗补三通佛头，10mm 以上写挂颈或手持。
  3. `rules.json` 按审校意见重算颗数和珠径（例子写明 15cm 手围）。
  4. 新用到但示例料包没有的品种，补到 `server/seed.py` 的 `EXTRA`。
- **验收**：`validate_plans.py`、`validate.py` 都通过；本地起后端，用 `/api/plans/match` 抽测“送男朋友生日 200 以内”“给妈妈母亲节”“孩子生日 50 以内”，结果贴进汇报。

#### T19 文档和行为对齐
- **改动文件**：`README.md`、`server/README.md`、`miniprogram/README.md`、`docs/architecture.md`、`开发与上线准备.md`。
- **要做**：把各 README 里和当前代码不一致的地方改掉（端口 8800/8801、ADMIN_TOKEN 必填、演示下单开关、H5 和小程序的差异）；`architecture.md` 的“下一步”按本清单的完成情况更新。只改文档。
- **验收**：按文档从零启动后端和小程序能走通。

---

## 5. 只能你本人做的事

这些需要你的账号、钱或决定，执行 agent 和我都替代不了。左边列是会卡住哪条任务。

| 事情 | 卡住的任务 | 说明 |
|---|---|---|
| 决定视觉方向 | T13 | 保留新视觉还是改回原规范（见 T13） |
| 注册小程序主体并认证、拿到正式 AppID | 真机验收、T17、上线 | AppSecret 只放服务器环境变量，不发给任何人，不进仓库 |
| 买域名、备案、配 HTTPS，开服务器或云托管 | T1 的正式地址、上线 | 定下来后把 `https://` 地址填进 `miniprogram/config.js` |
| 开对象存储（例如腾讯云 COS），上传 AR 模型 | T2 | 按 `tools/hand-tracker/README.md` 上传，并把域名加到小程序的合法域名 |
| 在公众平台填隐私保护指引、配置合法域名 | T14、上线 | T14 会列出要填的条目 |
| 选 AI 服务并提供 Key（放服务器环境变量） | AI 配、拍照识别的真实效果 | 不配也能用本地规则，效果差一些 |
| 申请微信支付商户号 | 正式收款 | 在这之前订单一律“待支付”，不发货 |
| 真机验收（iOS 和 Android 各一台） | 每一波结束时 | 按每条任务汇报里的“真机验证步骤”走一遍 |
| 审方案库前 50 条 | T15 之后 | 方案讲解代表品牌口吻，建议你亲自过一遍 |
