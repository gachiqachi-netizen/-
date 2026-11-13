# 派活和审核交接（2026-11-13）

> 给接手“派活 + 审核 + 合并”的新会话。只读这一页和它点名的文件就能开工，不用翻旧对话。

## 1. 你的角色

- 负责人（用户）用 Codex（两个账号）、Kimi，可能加 DeepSeek 执行任务卡。你**不写功能代码**，除非负责人说“你来做”（之前 A4a、A4c、A5b、D2f 是这样接手的）。
- 你做三件事：**审核**交上来的卡、**合并**进 `integration/2026-11` 并推送、**回答**执行者停下来问的问题（给负责人一段可粘贴的回复）。
- 回复负责人一律用中文，先说结论。

## 2. 东西在哪

| 文件 | 用途 |
|---|---|
| `docs/design/tasks/queue.md` | 总队列：每张卡的分支、卡片文件、依赖、谁做、不能同时做、等负责人 |
| `docs/design/tasks/02-prompts.md` | Codex、Kimi、DeepSeek 三段总提示词（执行者自己领卡） |
| `docs/design/tasks/00-dispatch.md` 第 5、6 节 | 交付报告格式、不许做的事、**审核清单** |
| `docs/design/tasks/*-wave1.md`、`*-wave2.md` | 卡片内容 |
| `docs/reports/<卡号>.md` | 执行者的交付报告（在它的分支里） |
| `AGENTS.md` | 执行者规矩（含省上下文：大文件按行号分段读、测试输出截短） |

## 3. 审核和合并怎么做（每张卡）

1. `git fetch origin`；分支是 `origin/agent/<卡号>-*`。
2. `git diff --stat origin/integration/2026-11...<分支>`：每个文件都要在卡的“只能改”里。
3. 读报告和代码，按 00-dispatch 第 6 节查：步骤、验收证据、测试数不减、铁律（金额整数分、尺寸规则不动、只讲寓意、小程序不用 URL、文字只从契约来）。
4. 在临时 worktree 里合并（**不要在负责人的主目录切分支**）：
   ```bash
   W=<scratchpad>/integ; git worktree add -q $W integration/2026-11; cd $W
   git merge -q --ff-only origin/integration/2026-11
   git merge -q --no-ff origin/agent/<卡号>-... -m "合并 <卡号>（审核通过）"
   unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy; export DATA_DIR=$(mktemp -d)
   python3 -m unittest discover -s server/tests 2>&1 | tail -3
   node --test miniprogram/tests/*.test.js 2>&1 | tail -8
   python3 kb/validate.py | tail -1
   GIT_TERMINAL_PROMPT=0 git push -q origin integration/2026-11
   ```
   一定用 merge commit（不要 squash），执行者靠“<卡号>:”开头的提交判断卡合没合。
5. 合并冲突只在 `contract.js` / `contract.ts`：合并后跑 `python3 tools/export_contract.py` 再提交。
6. 推送偶尔报 `SSL_ERROR_SYSCALL`：等几秒重试，用 `git ls-remote origin <分支>` 确认。
7. 要改：给负责人一段编号意见，让他粘回**同一个会话**；执行者在同一分支追加提交。

**环境**：
- 推送已经能用：负责人的 GitHub 令牌存在 macOS 钥匙串里。
- Node 20 在 scratchpad 的 `nodedl/node-v20.18.1-darwin-arm64/bin`，用之前加进 PATH；新会话的 scratchpad 不同，没有的话请负责人同意后从 nodejs.org 重新下载，并核对校验码。
- 后台打包：`cd admin-web && npm ci && npm run build`。

**已经给执行者的通用许可**（不用再问）：因为本卡新增动作、迁移、类型改名，或本卡就是要去掉某个旧行为，导致旧测试期望值对不上的，只改期望值或把前提改成合法情况、保留原断言，报告里列清楚。删测试、改测试逻辑、放宽条件仍要问。

## 4. 现在的进度

- **第一波**：25 张里 21 张已合并（A4a、A4c、A5b 由 Claude 接手做完），另加一张对稿修正 D2f 已合并。
- **已交、等审**：A11 路由拆分、C2 小程序订单状态、C1p 新页面空壳（第二波）、D4 做单页（第二波）。**先审 A11**：第二波后端都等它，Codex 的卡也等它。
- 第一波合完后，第二波按 `queue.md` 滚动派，执行者自己领。
- 有个 Kimi 会话可能还领着 D2f 在做：D2f 已经合并，让它放弃。

## 5. 负责人还没定的

| 事 | 卡住的卡 |
|---|---|
| E1 新单价 | A3 → B-8 → C5a（AI 配整条线），B-11b 也和 A3 互斥 |
| 允许接真实微信支付（AGENTS.md 现写“不接真实支付”）、证书和 HTTPS 回调域名 | B-14（商户号已下来） |
| 快递查询服务商 | B-13 |
| 语音识别服务 | C5b |
| 改手围重串规则 | A5c |
| 客服接不接 | C10a（可先不放客服入口） |
| 旧后台留不留 | D9 |

负责人定了一项，就把 `queue.md` 里对应的“等负责人”格清空，推到 integration。

## 6. 已经定下的产品决定（别再问）

- 尺寸规则以小程序工作台 `logic.js` 的 `stats` 为准（`10f3b78` 保留）。
- 售后原因按电商版本（`contract.py` 的 `AFTER_SALE_REASONS`）；取消原因“不想要了 / 拍错了，想重新设计 / 地址填错了 / 其他”。
- 未付款订单后台不能手动确认；签收 7 天自动完成；模拟退款只对模拟付款的订单生效。
- 知识库先做简化版（16 号文档）：保存即生效、改动记录可退回、权限点“编辑知识库”。
- 后台样式以 `mockups-admin.html` 为准：黑白灰，红色只给异常，界面不出现英文代码。

## 7. 本地后台预览（可选）

- `.claude/launch.json` 里有两项临时配置：`admin-review`（端口 8810，口令 `local-review`，临时数据库）和 `mock-static`（端口 8821，后台设计稿）。
- 它们指向旧会话的 scratchpad，新会话要用的话按同样方式重建。不用时删掉这两项。
