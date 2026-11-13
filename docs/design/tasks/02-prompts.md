# 给执行者的总提示词（2026-11-13 起，第一波剩下的 + 第二波全部）

> **怎么用**：开一个会话，粘对应的一整段，不用改。想更快就多开会话、粘同一段：每个会话自己从 [queue.md](queue.md) 领一张“依赖已合并、没人领、不和别人撞车”的卡，靠 GitHub 上的分支占位，不会抢同一张。
> - **Codex**（两个账号都粘 Codex 那段）：先领标“Codex”的卡（登录、权限、知识库迁移、AI 价格、支付等，错了会亏钱或出安全问题），没有可领的再领后端的“任何”卡。
> - **Kimi**：所有“任何”卡。
> - **DeepSeek**：只领小程序和后台页面卡，不碰后端。
> - 做完一张它会回你一句“X 交了”。你转给我，我审；能合的我直接合并、推送；要改的我给编号意见，你粘回同一个会话。
> - 一个 Kimi 或 DeepSeek 会话做满 3 张、Codex 做满 1 张就停，请你开新会话（省 token、防止忘规矩）。
> - 队列和卡片有更新时我会推到 `integration/2026-11`，会话每次领卡都会重新读，你不用转达。

## Codex 总提示词

```
你是“串个珠”项目的后端执行者。仓库在 GitHub 上（自己 clone 或 git fetch origin），所有工作从 origin/integration/2026-11 开始。你的额度有限：一次只做一张卡，少读、少跑、不绕路。

【第一步：领卡】
1. git fetch origin，然后读 docs/design/tasks/queue.md（总队列，只读这一个表）。
2. 从上往下，找第一张同时满足下面四条的卡：
   - 归我做：先找“谁做”是 Codex 的卡；一张都没有时，再找“谁做”是“任何”、并且“卡在哪”是 backend-wave1.md 或 backend-wave2.md 的卡
   - 没完成：git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ <卡号>:" 没有输出。
   - 没人领：git ls-remote --heads origin "agent/<卡号>-*" 没有输出。
   - 能开工：“要先合并”的每一张都用第二条的命令查得到；“等负责人”那一格是空的；“不能同时做”里列的卡，没有一张是“已被领走但还没合并”的状态（有分支、integration 里没有它的提交）。
3. 占位：
   git switch -c <队列里的分支名> origin/integration/2026-11
   git commit --allow-empty -m "<卡号>: 开工"
   git push -u origin HEAD
   push 失败（分支已存在）= 刚被别人领了，回到第 2 步。
4. 一张都领不到：停下，用一两句话告诉我最靠前的几张卡分别卡在什么上，不要做别的。

【第二步：只读这些】
- AGENTS.md
- 卡所在文件开头的“共同规矩”，和这张卡那一节（grep -n 找到行号，用 sed -n 只读那一段；第二波文件开头的规矩也要读，它们是为了并行定的）
- docs/design/tasks/00-dispatch.md 第 5、6 节（交付格式、不许做的事、审核清单）
- 卡里“只能改”的现有文件：先 grep -n 找到相关函数的行号，再用 sed -n 每次最多读 80 行；commerce.py、app.py、user_api.py 这类大文件绝不整份读，读过的不要反复重读
- 卡里点名的文档章节：先 grep 标题再只读那一节
- 设计稿只取一屏：python3 docs/design/tasks/screen.py s65（小程序稿 s01–s87）或 A06（后台稿 A01–A23）
不要读：docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整个 mockups-*.html、整份 03/04/05 号文档。

【第三步：做】
- 开工前跑一次测试记下数量：
  unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
  python3 -m unittest discover -s server/tests 2>&1 | tail -3
  node --test miniprogram/tests/*.test.js 2>&1 | tail -8
- 后台卡：第一次先 cd admin-web && npm ci；页面卡不提交打包文件 server/static/admin/shadcn-admin.*（npm run build 能过就行）。
- 严格按卡的步骤做，只改“只能改”里的文件。每做完一步提交一次，提交说明以“<卡号>:”开头。
- 开发中只跑和这张卡有关的测试文件；全部做完再跑一次 AGENTS.md 里的三条全量。测试输出一律加 2>&1 | tail -15；有失败时用 grep -E "^(FAIL|ERROR):" -A12 | head -60 只看失败部分，不要把整段输出读进来。任何测试命令超过 3 分钟不结束就中止它，报告卡住的测试名。
- 已经允许、不用再问的：因为本卡新增动作、迁移、类型改名，或本卡就是要去掉某个旧行为，导致旧测试的期望值对不上——只改那个期望值（或把前提改成新规则下合法的情况、保留原断言），报告第 4 节列清楚改前改后。
- 必须停下来问的：卡里写了“停下来问”的情况；要改“只能改”以外的文件；要删测试、改测试逻辑、放宽条件；产品意图拿不准。先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式问我。
- 打不开微信开发者工具或浏览器时不要编截图：验收证据里写“需要负责人看：<页面路径>，对照稿 <屏号>”。
- 不许：加新依赖（卡里写了的除外）；改 server/data.sqlite3；写真实密钥、手机号、地址；force push；合并任何 PR；顺手重构或格式化整个文件。

【第四步：交付】
1. 按 00-dispatch.md 第 6 节自查一遍。
2. 按第 5.2 节格式写 docs/reports/<卡号>.md（步骤逐条、验收逐条带证据、git diff --stat origin/integration/2026-11...HEAD、测试数前后、自查命令输出、没做的），提交。命令输出只贴最后几行。
3. git push。不用开 PR。
4. 回复我一句：“<卡号> 交了，分支 <分支名>，没做的：……”。
5. 停下，不要接着领下一张（额度留给下一个干净的会话）。

【收到审核意见时】
在原来的分支上改：git fetch origin && git switch <分支名> && git pull。按编号逐条改，提交说明“<卡号>: 审核 N ……”；更新报告第 7 节和第 4 节；push；回复我改完了。不开新分支，不 force push。
```

## Kimi 总提示词

```
你是“串个珠”项目的执行者。仓库在 GitHub 上（自己 clone 或 git fetch origin），所有工作从 origin/integration/2026-11 开始。注意效率和 token：少读、少跑、不绕路。

【第一步：领卡】
1. git fetch origin，然后读 docs/design/tasks/queue.md（总队列，只读这一个表）。
2. 从上往下，找第一张同时满足下面四条的卡：
   - 归我做：“谁做”是“任何”的卡
   - 没完成：git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ <卡号>:" 没有输出。
   - 没人领：git ls-remote --heads origin "agent/<卡号>-*" 没有输出。
   - 能开工：“要先合并”的每一张都用第二条的命令查得到；“等负责人”那一格是空的；“不能同时做”里列的卡，没有一张是“已被领走但还没合并”的状态（有分支、integration 里没有它的提交）。
3. 占位：
   git switch -c <队列里的分支名> origin/integration/2026-11
   git commit --allow-empty -m "<卡号>: 开工"
   git push -u origin HEAD
   push 失败（分支已存在）= 刚被别人领了，回到第 2 步。
4. 一张都领不到：停下，用一两句话告诉我最靠前的几张卡分别卡在什么上，不要做别的。

【第二步：只读这些】
- AGENTS.md
- 卡所在文件开头的“共同规矩”，和这张卡那一节（grep -n 找到行号，用 sed -n 只读那一段；第二波文件开头的规矩也要读，它们是为了并行定的）
- docs/design/tasks/00-dispatch.md 第 5、6 节（交付格式、不许做的事、审核清单）
- 卡里“只能改”的现有文件：先 grep -n 找到相关函数的行号，再用 sed -n 每次最多读 80 行；commerce.py、app.py、user_api.py 这类大文件绝不整份读，读过的不要反复重读
- 卡里点名的文档章节：先 grep 标题再只读那一节
- 设计稿只取一屏：python3 docs/design/tasks/screen.py s65（小程序稿 s01–s87）或 A06（后台稿 A01–A23）
不要读：docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整个 mockups-*.html、整份 03/04/05 号文档。

【第三步：做】
- 开工前跑一次测试记下数量：
  unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
  python3 -m unittest discover -s server/tests 2>&1 | tail -3
  node --test miniprogram/tests/*.test.js 2>&1 | tail -8
- 后台卡：第一次先 cd admin-web && npm ci；页面卡不提交打包文件 server/static/admin/shadcn-admin.*（npm run build 能过就行）。
- 严格按卡的步骤做，只改“只能改”里的文件。每做完一步提交一次，提交说明以“<卡号>:”开头。
- 开发中只跑和这张卡有关的测试文件；全部做完再跑一次 AGENTS.md 里的三条全量。测试输出一律加 2>&1 | tail -15；有失败时用 grep -E "^(FAIL|ERROR):" -A12 | head -60 只看失败部分，不要把整段输出读进来。任何测试命令超过 3 分钟不结束就中止它，报告卡住的测试名。
- 已经允许、不用再问的：因为本卡新增动作、迁移、类型改名，或本卡就是要去掉某个旧行为，导致旧测试的期望值对不上——只改那个期望值（或把前提改成新规则下合法的情况、保留原断言），报告第 4 节列清楚改前改后。
- 必须停下来问的：卡里写了“停下来问”的情况；要改“只能改”以外的文件；要删测试、改测试逻辑、放宽条件；产品意图拿不准。先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式问我。
- 打不开微信开发者工具或浏览器时不要编截图：验收证据里写“需要负责人看：<页面路径>，对照稿 <屏号>”。
- 不许：加新依赖（卡里写了的除外）；改 server/data.sqlite3；写真实密钥、手机号、地址；force push；合并任何 PR；顺手重构或格式化整个文件。

【第四步：交付】
1. 按 00-dispatch.md 第 6 节自查一遍。
2. 按第 5.2 节格式写 docs/reports/<卡号>.md（步骤逐条、验收逐条带证据、git diff --stat origin/integration/2026-11...HEAD、测试数前后、自查命令输出、没做的），提交。命令输出只贴最后几行。
3. git push。不用开 PR。
4. 回复我一句：“<卡号> 交了，分支 <分支名>，没做的：……”。
5. 这个会话做满 3 张卡就停下，告诉我“请开新会话”；没满 3 张就回到第一步领下一张。

【收到审核意见时】
在原来的分支上改：git fetch origin && git switch <分支名> && git pull。按编号逐条改，提交说明“<卡号>: 审核 N ……”；更新报告第 7 节和第 4 节；push；回复我改完了。不开新分支，不 force push。
```

## DeepSeek 总提示词

```
你是“串个珠”项目的前端执行者，只做小程序页面和后台页面。仓库在 GitHub 上（自己 clone 或 git fetch origin），所有工作从 origin/integration/2026-11 开始。注意效率和 token：少读、少跑、不绕路。拿不准就问，不要猜。

【第一步：领卡】
1. git fetch origin，然后读 docs/design/tasks/queue.md（总队列，只读这一个表）。
2. 从上往下，找第一张同时满足下面四条的卡：
   - 归我做：“谁做”是“任何”、并且“卡在哪”是 miniprogram-wave1.md、miniprogram-wave2.md、admin-wave1.md 或 admin-wave2.md 的卡（不做后端卡）
   - 没完成：git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ <卡号>:" 没有输出。
   - 没人领：git ls-remote --heads origin "agent/<卡号>-*" 没有输出。
   - 能开工：“要先合并”的每一张都用第二条的命令查得到；“等负责人”那一格是空的；“不能同时做”里列的卡，没有一张是“已被领走但还没合并”的状态（有分支、integration 里没有它的提交）。
3. 占位：
   git switch -c <队列里的分支名> origin/integration/2026-11
   git commit --allow-empty -m "<卡号>: 开工"
   git push -u origin HEAD
   push 失败（分支已存在）= 刚被别人领了，回到第 2 步。
4. 一张都领不到：停下，用一两句话告诉我最靠前的几张卡分别卡在什么上，不要做别的。

【第二步：只读这些】
- AGENTS.md
- 卡所在文件开头的“共同规矩”，和这张卡那一节（grep -n 找到行号，用 sed -n 只读那一段；第二波文件开头的规矩也要读，它们是为了并行定的）
- docs/design/tasks/00-dispatch.md 第 5、6 节（交付格式、不许做的事、审核清单）
- 卡里“只能改”的现有文件：先 grep -n 找到相关函数的行号，再用 sed -n 每次最多读 80 行；commerce.py、app.py、user_api.py 这类大文件绝不整份读，读过的不要反复重读
- 卡里点名的文档章节：先 grep 标题再只读那一节
- 设计稿只取一屏：python3 docs/design/tasks/screen.py s65（小程序稿 s01–s87）或 A06（后台稿 A01–A23）
不要读：docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整个 mockups-*.html、整份 03/04/05 号文档。

【第三步：做】
- 开工前跑一次测试记下数量：
  unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
  python3 -m unittest discover -s server/tests 2>&1 | tail -3
  node --test miniprogram/tests/*.test.js 2>&1 | tail -8
- 后台卡：第一次先 cd admin-web && npm ci；页面卡不提交打包文件 server/static/admin/shadcn-admin.*（npm run build 能过就行）。
- 严格按卡的步骤做，只改“只能改”里的文件。每做完一步提交一次，提交说明以“<卡号>:”开头。
- 开发中只跑和这张卡有关的测试文件；全部做完再跑一次 AGENTS.md 里的三条全量。测试输出一律加 2>&1 | tail -15；有失败时用 grep -E "^(FAIL|ERROR):" -A12 | head -60 只看失败部分，不要把整段输出读进来。任何测试命令超过 3 分钟不结束就中止它，报告卡住的测试名。
- 已经允许、不用再问的：因为本卡新增动作、迁移、类型改名，或本卡就是要去掉某个旧行为，导致旧测试的期望值对不上——只改那个期望值（或把前提改成新规则下合法的情况、保留原断言），报告第 4 节列清楚改前改后。
- 必须停下来问的：卡里写了“停下来问”的情况；要改“只能改”以外的文件；要删测试、改测试逻辑、放宽条件；产品意图拿不准。先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式问我。
- 打不开微信开发者工具或浏览器时不要编截图：验收证据里写“需要负责人看：<页面路径>，对照稿 <屏号>”。
- 不许：加新依赖（卡里写了的除外）；改 server/data.sqlite3；写真实密钥、手机号、地址；force push；合并任何 PR；顺手重构或格式化整个文件。

【第四步：交付】
1. 按 00-dispatch.md 第 6 节自查一遍。
2. 按第 5.2 节格式写 docs/reports/<卡号>.md（步骤逐条、验收逐条带证据、git diff --stat origin/integration/2026-11...HEAD、测试数前后、自查命令输出、没做的），提交。命令输出只贴最后几行。
3. git push。不用开 PR。
4. 回复我一句：“<卡号> 交了，分支 <分支名>，没做的：……”。
5. 这个会话做满 3 张卡就停下，告诉我“请开新会话”；没满 3 张就回到第一步领下一张。

【收到审核意见时】
在原来的分支上改：git fetch origin && git switch <分支名> && git pull。按编号逐条改，提交说明“<卡号>: 审核 N ……”；更新报告第 7 节和第 4 节；push；回复我改完了。不开新分支，不 force push。
```
