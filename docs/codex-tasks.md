# 代码审查结论与 Codex 任务清单（2026-11-04）

审查对象：提交 5e4945b（微信原生小程序、用户与订单接口、AR 手部识别、测试与文档）。
小程序的逐条问题和行号见 [review-miniprogram-2026-11-04.md](review-miniprogram-2026-11-04.md)；知识库方案的审校意见见 `kb/data/review/plans.json`。

## 结论

**主体可以继续，不用推倒重来。** 后端和小程序主流程写得扎实：尺寸、颗数、价格计算和原型一致；登录、按用户隔离、下单幂等、价格复核、设计版本冲突都做了，还有测试（后端 21 项、小程序 15 项全部通过）。架构文档也如实写了还缺什么。

**离提审上线还差 4 个硬伤**：正式环境接口地址写死在本机、AR 模型用的是别人的测试 CDN、小程序不展示有毒提示、列表缩略图每个都开一个 WebGL。另外有一批中等问题会影响体验和后期维护。

### 可以直接继续用的

| 部分 | 说明 |
|---|---|
| 后端用户、设计、订单接口 | 会话令牌只存哈希；按用户隔离；订单幂等、同事务复核商品、十进制算钱；设计版本冲突保护；输入校验严格；报错不泄露内部信息 |
| 部署与安全默认值 | 默认只监听本机，公网监听要显式开启；后台没口令就拒绝；AI 调用限流；上传图片校验真实格式 |
| SQLite / PostgreSQL 双存储 | 接口一致，有迁移脚本和集成测试 |
| 小程序尺寸与价格逻辑 | `pages/editor/logic.js`、`utils/template.js`、`pages/order/order.js` 和原型、后端一致 |
| 登录与设计同步 | `utils/auth.js`、`utils/design.js`：并发登录合并、401 重登、按设计排队同步、版本冲突提示 |
| 3D 组件、拍照同款确认页、AR 分包的降级 | 失败逐级回退；认珠确认页比原型还完整 |

### 需要优化的（按优先级拆成下面的任务）

- **P0 上线前必须修**：环境地址、AR 模型托管、安全提示与材料清单、缩略图渲染。
- **P1 体验和维护**：计价规则统一、新旧下单接口、按用户查询、AI 方案跟手围、页面栈、编辑器性能、拍照压缩、真机代理、包体积。
- **P2 需要先定方向**：设计规范同步（部分视觉是你用 Codex 改的）、隐私指引、知识库方案修复。

## 给 Codex 的通用要求

每个任务开工前先读：`README.md`、`docs/architecture.md`、`开发与上线准备.md`、本文件对应任务。

- 不接真实支付，不写任何真实密钥、AppSecret、令牌；需要的配置走环境变量或 `config` 文件里的占位值。
- 只讲寓意不讲功效：任何给用户看的文字都要过 `kb/data/attributes.json` 的 `banned` 词表（“转运珠”“本命年”除外）。
- 每个任务做完必须跑通：
  ```bash
  python3 -m unittest discover -s server/tests
  node --test miniprogram/tests/*.test.js
  python3 kb/validate.py
  ```
  涉及方案库的再跑 `python3 kb/validate_plans.py`。新逻辑要加测试。
- 一个任务一个提交，提交信息写清改了什么、怎么验证的。
- 括号里的“文件”是这个任务主要改动的范围。**同一波里的任务改的文件不重叠，可以并行开多个 Codex**；不同波次按顺序做。

---

## 第一波（P0，可并行）

### T1 按环境配置接口地址
文件：`miniprogram/app.js`、`miniprogram/utils/api.js`、新建 `miniprogram/config.js`、`开发与上线准备.md`

现状：`app.js:6` 开发版真机写死局域网 IP `192.168.2.156:8802`，体验版和正式版写死 `http://127.0.0.1:8800`，上线后所有接口都会失败。

要做：
1. 新建 `config.js`，按 `envVersion`（develop / trial / release）给出 `apiBase`。develop 在开发者工具里用 `http://127.0.0.1:8801`；develop 真机用的局域网地址从 `config.local.js`（加进 `.gitignore`）读，没有就提示去配置；trial / release 只允许 `https://` 开头的地址，先放占位 `https://api.example.com` 并在启动时检查。
2. 去掉代码里所有写死的 IP 和端口。
3. 文档写清三种环境怎么配。

验收：全仓库搜不到 `192.168.` 和非 develop 分支里的 `http://`；加一个测试，覆盖三种 envVersion 的地址选择。

### T2 AR 手部模型改为自己托管并缓存
文件：`tools/hand-tracker/build.js`、`tools/hand-tracker/runtime.ts`、`miniprogram/ar-hand/*`（重新构建）、`miniprogram/pages/ar-tryon/*`

现状：`build.js:9-11` 把模型地址换成了 `cdn.static.oppenlab.com/weblf/test/...`（第三方测试目录，约 12.5MB），每次进页面重新下载。

要做：
1. 模型地址改成从配置读（默认放我们自己的对象存储域名占位），构建时不写死第三方地址。在 `tools/hand-tracker/README.md` 写清模型来源（TensorFlow.js handpose，Apache-2.0）和怎么上传到自己的存储。
2. 首次下载后用 `wx.getFileSystemManager` 缓存到本地，之后从缓存读；版本号变了才重新下。
3. 加载时显示进度；超过 20 秒或失败时，提示并跳转到照片试戴（`pages/tryon`）。

验收：断网第二次进入仍能加载（来自缓存）；模拟加载失败能降级；构建产物里搜不到 `oppenlab`。

### T3 材料清单、卖点、讲解和安全提示
文件：`miniprogram/pages/editor/*`、`miniprogram/pages/order/*`、`miniprogram/pages/order-detail/*`、`miniprogram/utils/api.js`、`miniprogram/utils/catalog-preview.js`、`server/user_api.py`、`server/tests/test_user_api.py`

现状：后端 `/api/catalog` 每颗珠子带 `points`（卖点）、`meaning`/`summary`（讲解）、`safety`（有毒提示，例如朱砂、红豆杉、相思子、元宝菩提），小程序全部没展示。原型在材料清单里用红字显示安全提示（`prototype.html` 的 `notesHtml`）。

要做：
1. 编辑器加“材料清单”：每种珠子一行，显示名称、尺寸、数量、小计、卖点（`points` 用 · 连接）、一句讲解；有 `safety` 的用红字显示。
2. 下单确认页和订单详情：有安全提示的珠子在清单里同样红字提示，下单前在确认弹窗里再提示一次。
3. 后端订单快照 `items` 加上 `kb`、`points`、`safety`，订单详情从快照读，不依赖当前目录。
4. 开发版的目录快照 `catalog-preview` 改为从 `/api/catalog` 重新生成（写一个脚本放 `tools/`），保证带这些字段；或者开发版也走接口，只在接口失败时用快照。

验收：含元宝菩提或朱砂的设计，在编辑器、下单页、订单详情都能看到红字提示；新增后端测试覆盖快照字段。

### T4 缩略图改成静态图片
文件：`miniprogram/components/bracelet-thumb/*`，以及用到它的页面（首页、自己串、我的、AI 配、拍照、下单）

现状：`bracelet-thumb/index.js` 每个实例创建一个 WebGL 上下文。“我的”页列出全部作品和订单、AI 页恢复 20 条消息每条 3 个方案，可能同时存在几十个上下文，真机会黑块或闪退。

要做：缩略图统一用一个离屏画布（2d 或单个共享 WebGL）按珠子序列画成图片，`canvasToTempFilePath` 后缓存（按珠子 id 序列做 key），组件只显示 `<image>`；渲染失败显示平面圆环占位图。3D 交互只保留在编辑器和试戴页。

验收：“我的”页 50 条作品滚动不卡、不黑块（开发者工具性能面板截图附在提交说明里）；组件测试覆盖缓存和失败占位。

---

## 第二波（P1，T1–T4 合并后开始；T5、T6 改后端，T7–T12 改小程序，组内文件不重叠可并行）

### T5 计价规则只留一份
文件：新建 `server/pricing.py`、`server/app.py`、`server/user_api.py`、`miniprogram/pages/order/*`、`prototype.html`（只改读取计价参数的地方）

现状：手工费 15、编织绳 5、礼盒 10、满 99 免运费否则 8，在旧下单接口、新下单接口、小程序、原型里各写一遍。旧演示接口 `/api/orders` 不用登录、带首单立减 10，新接口没有立减，默认两个都开着。

要做：
1. `pricing.py` 定义全部计价参数和一个 `quote(items, options)` 函数，两个下单接口都调它；`/api/catalog` 返回 `pricing` 字段，小程序和原型从这里读，不再写死。
2. 旧演示接口默认关闭：改成只有设置 `DEMO_ORDERS=1` 才开（替代现在的 `DISABLE_DEMO_ORDERS`，文档和 Dockerfile 一起改）。
3. 首单立减：新接口仍然不发（没接支付前不认），旧接口关掉后不再有这个分叉。

验收：改一处计价参数，两个接口和小程序报价一起变；测试覆盖。

### T6 按用户查询加索引，登录会话可清理
文件：`server/db.py`、`server/db_postgres.py`、`server/app.py`、`server/user_api.py`、`server/tests/*`

现状：`GET /api/designs`、`/api/my/orders` 把整张表读出来再按 `userId` 过滤；过期会话永远不删，也没有退出登录。

要做：
1. 两个 DB 类加 `list_by_owner(table, user_id)`。SQLite 给 designs、orders 加 `user_id` 列（或 JSON 表达式索引）并建索引；PostgreSQL 建 `(doc->>'userId')` 表达式索引。迁移旧数据。
2. 加 `POST /api/auth/logout` 删除当前会话；启动时和每天一次清理过期会话。

验收：测试覆盖只返回本人数据、退出后令牌失效、过期会话被清理；PostgreSQL 集成测试（设置 `BEADLOOP_TEST_DATABASE_URL`）通过。

### T7 AI 方案跟着手围走，分享页按查看者手围重排
文件：`miniprogram/pages/ai/*`、`miniprogram/pages/shared/*`、`miniprogram/utils/design.js`

现状：`pages/ai/ai.js:46` 把方案的 `count` 当成固定颗数存进设计，之后改手围不会重排；分享落地页沿用分享者手围，却写着“按你的手围串”。

要做：只有 `/api/plans/match` 返回 `fixed`（108 颗这类）时才存固定颗数，其他存 `special/pattern/tail` 按手围重排。分享页按查看者手围重排，文案改成“已按你的 X cm 手围重新排好”；对方没量过手围就用默认并提示可修改。方案卡片显示讲解和超预算提示（`overBudget`、`swapped`）。

验收：测试覆盖改手围后颗数变化、108 颗不变。

### T8 页面栈不再越压越深
文件：新建 `miniprogram/utils/nav.js`，以及用 `navigateTo` 重开编辑器、下单页的页面

要做：封装 `openEditor`、`openOrder`：栈里已有同一页就 `navigateBack` 到它，否则在接近 10 层时用 `redirectTo`。下单完成后 `reLaunch` 到订单详情。

验收：来回“编辑 → 下单 → 返回编辑”20 次不报栈满；测试覆盖。

### T9 编辑器和 AR 性能
文件：`miniprogram/pages/editor/*`、`miniprogram/components/bracelet3d/*`、`miniprogram/pages/ar-tryon/*`

要做：编辑操作只 setData 变化的字段（不要整份材料列表）；3D 视图加减一颗珠子时增量更新，不全部重建；AR 每次推理复用帧缓冲，减少帧拷贝（现在复制 4 次）。

验收：连续添加 30 颗珠子在开发者工具里无明显掉帧；附性能截图。

### T10 拍照上传前压缩
文件：`miniprogram/pages/photo/*`

要做：选图后用 `wx.compressImage` 或画布把长边缩到 1024px、质量 0.8 左右再转 base64；大于 1MB 继续压。上传超时给明确提示并保留本地颜色识别的降级。

验收：5MB 原图上传体积 ≤1MB；测试覆盖压缩函数。

### T11 真机测试代理放行完整接口
文件：`tools/phone-test-proxy.py`

要做：白名单加上 `/api/plans/match`、`/api/ai/*`、`/api/shares`、`/api/kb/*`，并在文件头写清只用于局域网开发。

验收：真机能走通 AI 配、拍照、分享。

### T12 包体积和分包
文件：`miniprogram/project.config.json`、`miniprogram/app.json`

要做：`packOptions.ignore` 排除 `tests/` 和开发用目录快照；开启代码压缩；试戴、分享、订单详情移到分包，主包只留首页、自己串、AI 配、我的、编辑器。

验收：上传前预览的主包体积比现在（约 0.85MB）小，附截图。

---

## 第三波（P2，先找产品负责人确认再做）

### T13 视觉和设计规范同步（需要先定方向）
这次提交把原型和小程序的视觉改了：托盘底色接近纯白、卡片加边框、语音按钮用了 emoji 🎙、编辑页把“名称与寓意”“按颗数串”折叠、“去下单”前加了“完成设计”页。设计规范里写的是托盘用浅色绒布渐变、不用 emoji 当图标。

- 先确定保留哪套。保留新改动的，就更新设计规范（`docs/` 和线上的设计规范页）；不保留的就改回。
- 不管哪套，emoji 图标都换成线性图标（24px 网格、1.5px 描边）。

### T14 隐私保护指引和权限
文件：`miniprogram/app.json`、用到相机、相册、剪贴板的页面

要做：按微信要求接入 `wx.onNeedPrivacyAuthorization` / `requirePrivacyAuthorize` 流程，首次用相机、相册、剪贴板前弹授权说明；在 `开发与上线准备.md` 列出要在公众平台填的隐私指引条目（手串照片会发到识别服务、手腕画面只在本机处理）。公众平台上的填写由负责人手动完成。

### T15 知识库方案修复
文件：`kb/data/plans/*.json`、`kb/data/rules.json`、`kb/validate_plans.py`、`kb/SCHEMA.md`

`kb/validate_plans.py` 是上一轮写了一半的检查脚本，未验证，先跑通并补全。然后按 `kb/data/review/plans.json` 的意见改 100 条方案：合并 15 组雷同方案并补缺口（乔迁、教师节、康复、父亲节母亲节、孩子、同事、爸爸、老师、男友高档、18 子、手绳、多宝、复古）；修正违反串法禁忌的搭配（珍珠挨硬石、绿松石配木珠或菩提、染色料挨白珠）；孩子款主珠 ≥8mm；替代珠不能比原料贵；同料预算档统一；删掉讲解里的内部说明和误导名字；“转运珠”在讲解里叫“路路通”；108 颗补三通佛头、10mm 以上写挂颈或手持。`rules.json` 按审校意见重算颗数和珠径。新用到但示例料包（`server/seed.py`）没有的品种，补到 `EXTRA` 里。

验收：`python3 kb/validate_plans.py` 和 `python3 kb/validate.py` 都通过；用 `/api/plans/match` 抽测“送男朋友生日 200 以内”“给妈妈母亲节”“孩子生日 50 以内”三句，结果贴在提交说明里。
