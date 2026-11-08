# 交接说明（2026-11-08，Codex → Kimi）

接手的执行 agent 先读这份，再读 [codex-tasks.md](codex-tasks.md)（工作手册：守则、任务、汇报格式）。分工不变：执行 agent 写代码 → 审查（Claude）审 → 负责人在微信开发者工具里验证 → 合并到 main。

## 项目一句话

“串个珠”：用户自己设计手串、AI 按心愿配手串、拍照做同款、试戴，然后下单的微信小程序。小程序在 `miniprogram/`，后端在 `server/`（Python 标准库），珠子知识库在 `kb/`。功能最全的参照是根目录的 `prototype.html`。

## 仓库和分支现状

仓库：`https://github.com/gachiqachi-netizen/-.git`

| 分支 | 内容 | 状态 |
|---|---|---|
| `main` | 上线前的基线，加上工作手册和本交接说明 | 稳定，**不要直接往 main 提交业务代码** |
| `codex/wave1-integration` | 第一波 5 个任务（T1、T2、T3、T4、T16）合在一起，加上审查后的修正和开发测试登录 | **当前工作分支**。代码审查已通过，测试全过，等负责人在开发者工具里验证后合并到 main |
| `codex/t1-env-config` 等 5 个 | 第一波各任务的单独分支 | 已并入 integration，不用再动 |
| `codex/wave1-report` | 第一波交付报告 `docs/reports/wave1.md` | 存档 |

最新一次在 integration 上跑的结果：后端 25 项通过（2 项需要 PostgreSQL，跳过），小程序 50 项通过，知识库 200/200。

## 第一波做了什么（已完成）

- **T1 环境地址**：`miniprogram/config.js` 按开发版、体验版、正式版取接口和模型地址；开发版真机读不进仓库的 `config.local.js`；体验版和正式版只认 https，遇到 example.com 这类占位域名直接报错（用正则取域名，不依赖 `URL`）。
- **T2 AR 模型**：模型从自己的地址加载并缓存到手机；开发版默认用本地后端 `/models/`；下载阶段“连续 20 秒无进度”才算超时，识别初始化另算 20 秒；重试只补缺的文件；失败可改用照片试戴。
- **T3 材料清单和安全提示**：编辑页、下单页、订单详情显示卖点、讲解、红字安全提示；提交前弹安全确认；订单快照冻结这些字段。
- **T4 缩略图**：列表缩略图共用一个离屏 2D 画布画成静态图片并缓存，失败显示占位图。
- **T16 下单前刷新价格**：开发版优先请求真实目录；进入下单页强制刷新，改价要确认，确认前不能提交。
- **开发测试登录**（为本地验证加的）：后端 `POST /api/auth/dev`，只有 `DEV_LOGIN=1` 时可用；测试账号 id 带 `dev:` 前缀，和真实微信用户分开。

## 下一步要做的（按顺序）

### 1. 补齐开发测试登录（在 `codex/wave1-integration` 上做）

上一轮没做完的 6 项：

1. `miniprogram/utils/auth.js`：开发版（envVersion 为 develop）在**手机预览**时也要能走测试登录，不能只认开发者工具。判断“微信登录未配置”要看返回状态码 503，不要靠匹配报错文字。体验版和正式版绝对不能走测试登录。补测试：develop 在手机上会自动改用测试登录；release 不会。
2. 后端：同时设置 `DEV_LOGIN=1` 和 `DATABASE_URL` 时，启动直接报错退出。补测试。
3. 登录页：开发版显示一行小字“开发测试登录（仅本地有效）”。
4. 下单页：取消安全确认后的红字改成“你选择了返回修改。确认已阅读材料安全提示后，可以再次提交。”；没登录导致提交失败时，提示“需要先登录才能下单”，并给“去登录”按钮。
5. `开发与上线准备.md`：本地启动命令加上 `DEV_LOGIN=1`，并说明只用于本地开发。
6. 跑完三条测试，用下面的命令重启本地后端，推送 `codex/wave1-integration`。

### 2. 帮负责人准备验证环境

负责人要在微信开发者工具里手动验证第一波。按 [reports/wave1-verify.md](reports/wave1-verify.md) 的“准备”一节把环境搭好（切分支、下模型、启动后端、上架一颗元宝菩提测试珠子、打开开发者工具），然后把“验证项”一节原样列给负责人。

### 3. 修负责人验证发现的问题

负责人会把截图和问题发过来，审查给出修改意见后再改。

### 4. 第二波

第一波合并到 main 之后，按 [codex-tasks.md](codex-tasks.md) 第 4 节做第二波：T5、T6（后端，一个做完再做另一个），T7–T12、T17、T18（小程序，可并行）。每条任务从最新 main 拉 `agent/t<编号>-<短名>` 分支。

## 本地环境

```bash
# 后端（开发用 8801 端口，DEV_LOGIN 只能本地用）
PORT=8801 ADMIN_TOKEN=local-dev-only DISABLE_DEMO_ORDERS=1 DEV_LOGIN=1 python3 server/app.py

# 三条必跑的测试
python3 -m unittest discover -s server/tests
node --test miniprogram/tests/*.test.js
python3 kb/validate.py

# AR 模型（不进 git，没有就下载，约 12.7MB）
python3 tools/hand-tracker/download_models.py
```

- Python 3.9 以上；Node 18 以上（小程序没有 package.json，不要新增依赖）。
- 后台 `http://127.0.0.1:8801/admin`，口令 `local-dev-only`。
- 开发版真机：复制 `miniprogram/config.local.example.js` 为 `config.local.js`，填电脑的局域网地址（这个文件不提交）。

## 踩过的坑（别再犯）

- **微信小程序环境不一定有 `URL`、`TextEncoder` 这类浏览器对象**：Node 测试能过，真机可能出错后被吞掉。解析地址用正则。
- **不要写死 IP 和端口**：一律走 `config.js`。
- **金额一律按“分”的整数算**，和 `server/user_api.py` 一致。
- **尺寸规则不能改**：总长 = 手围×10 + max(8, 2.5×主珠直径 − 5) mm，合适区间 −4 到 +6mm；54 颗及以上按念珠处理。
- **只讲寓意不讲功效**：给用户看的文字过 `kb/data/attributes.json` 的 banned 词表（“转运珠”“本命年”除外）。
- **一个文件被多个任务改时，合并要两边都保留**，不能整份覆盖；第一波 `utils/api.js`、`pages/order/order.js` 就是这样合的。
- **不接真实支付，不写任何真实密钥**；AppSecret 只放服务器环境变量。
- **没在开发者工具或真机上验证过的，汇报里不要说“已通过”**。

## 交接时的约定

- 不要合并到 main，不要推送 main；只推送自己的工作分支。
- 每完成一项，按 [codex-tasks.md](codex-tasks.md) 第 2.6 节的格式汇报：改了什么、验收打勾、测试输出、需要负责人在开发者工具里验证的步骤、提交编号。
- 拿不准产品意图时停下来问，不要猜。
