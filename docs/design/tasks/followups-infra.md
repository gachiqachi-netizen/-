# 清理和防返工卡 H1–H6（2026-11-19，来自 `docs/review/2026-11-19-history-and-rework.md`）

> 共同规矩：照 `02-prompts.md` 的总提示词做；每张卡只改自己列出的文件，要动别的先停下来问；不碰 `server/data.sqlite3`；不写任何真实密钥、令牌、手机号、地址；三条测试（`python3 -m unittest discover -s server/tests`、`node --test miniprogram/tests/*.test.js`、`python3 kb/validate.py`）和 `python3 tools/check-ui.py` 必须通过。
> 这批卡的目的写在复盘报告里：删掉已经没用的历史包袱，把反复踩的坑变成自动检查。**删除类改动先用 `git grep` 证明没有引用再删**，报告里贴出 grep 结果。

## H1 删除历史包袱：原型页、原型小程序、旧变量名、过期文档

- **依赖**：B-20、B-24（同改 `server/uploads.py`、`server/app.py`）　**大小**：S　**只能改**：删除 `panzhu/`、删除 `prototype.html`、`server/app.py`（只删 `FRONT` 和 `/` 返回原型页那段）、`Dockerfile`（只删 COPY prototype.html 那一行）、`server/uploads.py`（只删 `WECHAT_TOKEN` 别名）、`deploy/app.env.example`（删 `WECHAT_TOKEN` 那行，如有）、`server/plans.py`（只改注释里的 `pages/editor` 为 `pages/diy`）、移动 `docs/review-miniprogram-2026-11-04.md`、`docs/frontend-interaction-audit-2026-11-03.md` 到 `docs/archive/` 并改所有引用处、`server/tests/`
- **要做的**：
  1. `/` 改为返回 404（JSON `{"error":"not_found"}`，和其它未知路径一致）；`/admin`、`/api/*`、`/uploads/*`、`/models/*` 行为不变。
  2. `panzhu/`、`prototype.html` 删除前 `git grep -n "panzhu\|prototype.html\|FRONT"`，贴结果；有测试依赖就改测试。
  3. `WECHAT_TOKEN` 只删别名，只认 `WECHAT_MSG_TOKEN`。
  4. 两份旧文档移到 `docs/archive/`，所有链接改到新位置（`git grep` 找全）。`docs/codex-tasks.md` 不动（第 2 节工作守则仍在用）。
- **测试**：`GET /` 返回 404；其它入口回归不变；`uploads` 只读 `WECHAT_MSG_TOKEN`。
- **不做**：动 AI provider（等 AI 选型）；动 compose。

## H2 镜像带上 tools/，去掉逐个挂载

- **依赖**：H1、B-22、B-25（它们都改 `Dockerfile` 或 `deploy/docker-compose.yml`）　**大小**：S　**只能改**：`Dockerfile`、`.dockerignore`、`deploy/docker-compose.yml`、`docs/deploy.md`、`server/tests/`（如有部署相关测试）
- **现状**：Dockerfile 不复制 `tools/`，每加一个运维命令就要在 compose 里加一行只读挂载（check_deploy、load_seed、load_templates、patch_beads……），相关的卡只能排队串行做。
- **要做的**：Dockerfile `COPY tools ./tools`（`.dockerignore` 排除 `tools/shoot/node_modules`、`tools/hand-tracker/node_modules`、`tools/hand-tracker/models` 等大目录）；compose 删掉所有 `../tools/*.py` 单文件挂载，保留数据目录和 `deploy/data-files` 挂载；`docs/deploy.md` 改成“更新代码后 `up -d --build` 即可，不用再单独传工具文件”。
- **测试**：`docker compose config` 解析通过并贴输出；本机能起 Docker 就 `docker build` 一次并在容器里 `python tools/check_deploy.py --help`、`python tools/load_seed.py`（临时库）跑通，贴输出；起不了就写明。
- **不做**：改服务端代码。

## H3 写卡检查工具 card_lint（防“卡里写的路径和变量不存在”）

- **依赖**：无　**大小**：S　**只能改**：新建 `tools/card_lint.py`、`tools/board.py`（只在生成看板时调用 card_lint 并把问题列进看板顶部）、`server/tests/test_card_lint.py`
- **背景**：复盘里返工的第一大类是卡片本身写错（路径不存在、变量名不对、“只能改”漏文件）。
- **要做的**：`python3 tools/card_lint.py [卡号...]`，读 `queue.md` 和各卡文件：
  1. 卡里反引号包着、看起来是仓库路径的（含 `/` 且以已知顶层目录开头：`server/`、`miniprogram/`、`admin-web/`、`tools/`、`deploy/`、`docs/`、`kb/`），在 `origin/integration/2026-11`（参数可改）上不存在就报——除非同一行写了“新建”。
  2. 全大写下划线的环境变量（如 `PAYMENT_PROVIDER`）既不在 `deploy/app.env.example` 也不在 `server/` 代码里出现、且同一行没写“新增/新环境变量”就报。
  3. 依赖里写的卡号在 `queue.md` 不存在就报。
  4. 输出：每张卡一行“通过”或问题列表；有问题退出码 1。
- **board.py**：生成看板时跑一遍，对“现在能派”的卡如有问题，在该卡说明栏写“卡片待修：xxx”（不阻止生成）。
- **测试**：用临时的卡文件覆盖三类问题和“新建”豁免。

## H4 后端测试加 Postgres 一组和商品接口性能测试

- **依赖**：B-24　**大小**：M　**只能改**：`server/tests/`（新增文件为主，可加 `server/tests/pg_support.py`）、`docs/` 下测试说明（如 `docs/testing.md`，没有就新建）、`AGENTS.md`（只在“每次改完都要跑通”那段加一句可选的 Postgres 测试命令）
- **背景**：首页空、13 秒、16 秒都是 SQLite 测试发现不了的线上问题。
- **要做的**：
  1. 设了 `TEST_DATABASE_URL` 时，额外跑一组用 `PostgresDB` 的测试：空库启动不写示例数据（证明行为）、`load_seed.py` 预览和导入、`/api/catalog` 正常返回、`kb_store.stamp()` 在一次 catalog 请求里调用次数 ≤ 1。没设就整组 `skip`（不影响现在的三条测试）。
  2. 性能测试（SQLite 和 Postgres 都跑）：造 562 颗珠子（可用 `server/seed.py` 的珠子复制改 id），冷启动后第二次 `/api/catalog` 必须 < 1 秒，第一次 < 3 秒；超了就失败并打印耗时。
  3. 说明文档写清楚本机怎么起一个临时 Postgres（`docker run ... postgres:16`）再跑这组测试。
- **测试**：本身就是测试；报告贴 SQLite 和 Postgres 两次的耗时。

## H5 组件行为检查：防“点一下触发两次”这类问题

- **依赖**：U28、U22（已合并）　**大小**：S　**只能改**：`tools/check-ui.py`、`miniprogram/tests/`（新增组件行为测试）
- **背景**：`c-cell` 点一次触发两次影响了 16 处；隐私弹层组件没吃到全局按钮样式。都是组件层的问题，`check-ui.py` 只查写法查不出来。
- **要做的**：
  1. `check-ui.py` 新规则：`miniprogram/components/*/index.js` 里 `triggerEvent('tap'|'click'|'touchstart')`，而对应 wxml 用 `bindtap`（不是 `catchtap`）调用它 → 报错“原生事件会冒泡，页面会收到两次”；组件 `options` 里没声明 `styleIsolation` 或 `addGlobalClass`，而 wxml 用了 `c-btn` 等全局类 → 报错。已有违规按现有“只报新增”机制处理。
  2. 给 `components/` 下每个对外发事件的组件补一条行为测试：一次点击，页面处理函数只被调用一次。
- **测试**：两条新规则各有通过和失败用例。

## H6 商品批量导入命令进仓库，并校验必填字段

- **依赖**：B-23（复用 B-22 的取色、B-23 的知识库匹配）　**大小**：M　**只能改**：新建 `tools/import_beads.py`、`docs/deploy.md`（加“批量导入商品”一节）、`server/tests/`
- **背景**：这次 500 件商品是在仓库外导入的，导入后才发现 473 颗没有颜色、没有知识库，3 颗测试珠照片 404。
- **要做的**：`tools/import_beads.py <excel或csv>`：
  1. 默认预览、`--apply` 才写、只新增不覆盖、选库和不打印环境变量照 `load_seed.py`；写入走 `commerce.create_product`（和后台新建同一套校验）。
  2. 每行必填校验：名称、尺寸（mm>0）、价格（整数分）、材质、照片（文件存在或 URL 可访问）；缺了整行报出，不写。
  3. 自动补：颜色（用 B-22 的取色函数，照片取不到就按名称）、知识库（用 B-23 的匹配，没匹配上的列进“待确认”并照常导入）。
  4. 预览输出：将新增、跳过、缺字段、知识库待确认四类的数量和明细。
  5. 列名映射写在脚本开头，报告里列出支持的 Excel 列名。
- **测试**：临时库 + 小样表格覆盖缺字段、重复、取色、知识库匹配、只新增不覆盖。

## H8 后端 HTTP 测试不走系统代理（2026-11-19 审核：开了代理的 Mac 上 6 个测试报错）

- **依赖**：无　**大小**：S　**只能改**：`server/tests/` 里用 `urlopen` 访问本机测试服务器的文件（`git grep -ln urlopen server/tests` 当前 18 个），可新建 `server/tests/http_helper.py`
- **现状**（审核复现过）：`test_env.DemoOrderHTTPTest`、`test_env_prod.AIFallbackHTTPTest` 共 6 条在负责人的 Mac 上报 `JSONDecodeError`。原因是 macOS 系统代理把发往 `127.0.0.1` 的请求拦下，回了一个空内容的 403，不是程序的问题。`urllib` 在 macOS 上会读系统代理设置，只设 `NO_PROXY` 环境变量也绕不过去。在运行前加一句 `install_opener(build_opener(ProxyHandler({})))`，725 条全部通过。
- **要做的**：
  1. 新建 `http_helper.py`，提供不走代理的 `urlopen`（`build_opener(ProxyHandler({}))`），测试里访问本机服务器的地方全部换成它。
  2. 不改 `server/` 下的正式代码（访问微信、AI 的请求仍按系统设置走）。
- **测试**：把 `HTTP_PROXY`、`HTTPS_PROXY` 设成一个不存在的地址（如 `http://127.0.0.1:9`）跑全部后端测试，必须全部通过；报告贴这次的输出。
- **不做**：改 CI；改正式代码的网络设置。

## H11 Docker 构建：依赖层缓存 + 国内镜像（2026-11-20 负责人：每次更新服务器都要等 9 分钟装依赖）

- **依赖**：无　**大小**：S　**只能改**：`Dockerfile`、`deploy/CHECKLIST.md`（只加一句说明）、`server/tests/` 里如有检查 Dockerfile 的测试则同步
- **现状**（审核核对过）：`Dockerfile` 先 `COPY server ./server`、`COPY kb`、`COPY tools`，再 `RUN pip install --no-cache-dir -r server/requirements-postgres.txt`。代码一改，pip 这一层缓存就失效，每次更新都重新下载安装；服务器在国内，从官方 PyPI 下载约 20KB/s，这一步 546 秒。`server/requirements-postgres.txt` 是 `-r requirements.txt` + `psycopg[binary]`。
- **要做的**：
  1. 先只复制两个依赖清单（`server/requirements.txt`、`server/requirements-postgres.txt`）再 `pip install`，之后才 `COPY server`、`kb`、`tools`；其余行（ENV、建用户、CMD）不变。
  2. pip 源用构建参数：`ARG PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/`，`RUN pip install --no-cache-dir -i "$PIP_INDEX_URL" -r server/requirements-postgres.txt`；需要换回官方源时 `--build-arg PIP_INDEX_URL=https://pypi.org/simple` 即可。
  3. `deploy/CHECKLIST.md` 加一句：只改代码时依赖层走缓存；改了依赖清单才会重装。
- **验证**（在本机用 docker 做，没有 docker 就在报告里写明未验证，不要编结果）：
  1. 第一次 `docker build` 记下耗时；
  2. 改一行 `server/` 里的注释再 build，报告里贴出 pip 那一步显示 `CACHED`；
  3. 改动还原，不提交那行注释。
- **测试**：AGENTS.md 三条测试照常通过（本卡不改代码，主要证明没碰坏）。
- **不做**：换基础镜像；改 docker-compose；改依赖版本。
