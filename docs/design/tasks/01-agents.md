# 派活手册：Codex + Kimi（2026-11-13）

> 配合 [00-dispatch.md](00-dispatch.md)（批次、文件归属、git 规矩、交付格式）用。这份讲**谁做哪张、怎么开会话、复制什么提示词、怎么审和合**。

## 1. 自审：现在拆到什么程度

| | 状态 | 能不能派 |
|---|---|---|
| 第一波 25 张（后端 A1、A2、A4a–c、A5a–b、A11、A11m；小程序 C0a–C0j、C0z、C2；后台 D0、D1、D2、D1b） | 每张有步骤、只能改的文件、测试、验收；本文第 3 节给了逐个会话的提示词 | **能，现在就派** |
| 第二波约 75 张（第 5–10 批） | 需求、接口、依赖、批次、迁移编号都定了；约一半卡的“只能改”写在正文里而不是逐文件列出，前端卡大多没有单独的验收（以稿号和 04 号文档对应节为准） | **等第 4 批合并后核对一次再派**（第 5 节） |

**这次自审找到并已经改掉的问题**

1. **新表会互相冲突。**第二波有 9 张卡要建新表，原来每张都得改 `server/db.py` 的 `TABLES` 和 `server/migrations/__init__.py` 的列表，卡里还没把这两个文件列进“只能改”。执行 agent 要么越界改，要么停下来问；同一批几张一起做必冲突。
   - 已加卡 **A11m**（第 4 批，和 A11 同一个会话做）：迁移自动发现，新表在自己的迁移文件里声明。
   - 迁移编号 007–018 已在 [backend-wave2.md](backend-wave2.md) 开头统一分好；B-1、B-2、B-3、B-4、B-10、B-11a、B-12 的“只能改”都补上了自己的迁移文件。
2. **每个会话一开始就要读七万多字。**[AGENTS.md](../../../AGENTS.md) 原来让执行 agent 先读 15 号总计划、README、handoff、codex-tasks；Codex 会自动照做，一张卡还没开工就先花掉两三万 token。
   - 已改成：有任务卡时只读 AGENTS.md、卡片和卡里点名的那几节。
   - 设计稿每份二十多万字，新增 [screen.py](screen.py) 只取一屏（2–4 千字）。
3. **一批全合完才开下一批太慢。**例如 C0f 只等 C0a，不用等 A1。改成**依赖合了就开**（第 3 节表里的“什么时候开”）。批次表只用来看大致进度。

**自审里反驳了自己、但决定保持不变的**

- *“第二波现在就把每张卡的函数名写死？”* 不写。第一波的 A2、A4、A5、A11 会改动或新增这些函数，现在写死的名字到时候多半是错的，执行 agent 会照着错的做。第 4 批合并后对照真代码补一次（第 5 节），是一次会话的工作量。
- *“Codex 一张卡一个会话太费？”* 后端状态和金额的卡上下文干净最重要，每张卡开新会话；省 token 靠第 2 点的少读。Kimi 便宜，相互独立的小卡放在一个会话里连着做，省掉重复读规矩。
- *“审核会不会卡住？”* 有可能，所以每张卡必须交一份固定格式的报告（`docs/reports/<卡号>.md`），我从分支直接读，几张一起审；样子的部分交给你在开发者工具里集中看（第 4 节）。

**开工前要你定的（只有这一件挡着第一波）**

- 尺寸规则那次提交 `10f3b78` 留不留。**建议留**：
  - 它做的就是你选的“统一成小程序那份”，有 16 个共用用例和测试。
  - 第 1 批的 C0j 要读它建的共用用例文件。
  - 不留的话，要先 revert，再派 A12 重做；C0j 也要等 A12。

## 2. 怎么派

**分工**：Codex 额度少，只做错了会亏钱或丢数据的后端卡（订单状态、退款；第二波的登录、权限、知识库迁移、支付），一张卡一个会话。其余都给 Kimi：契约、路由、组件、页面、后台页、新增型接口；相互独立的小卡放在一个会话里连着做。

**第 0 步（负责人，一次）**：按 [00-dispatch.md](00-dispatch.md) 第 4 节推送两个分支、建 `integration/2026-11`。之后 Codex 和 Kimi 都从 GitHub 拉这个分支。

**派的时候**：
- 每个会话粘第 3 节对应的“第一条提示词”；拉代码、建分支、只读什么、怎么交付，提示词里都写了。
- 这张卡的 PR 合并后，在**同一个会话**里粘“合并后接着粘”那一条。一个会话最多连做 4 张，太长了容易忘规矩。
- 执行 agent 做完自己 push；能开 PR 就开到 `integration/2026-11`，开不了就把 PR 描述贴出来，你在 GitHub 上开。

**同时开几路**：一开始 Codex 1 路（CX-1）、Kimi 6 路（KM-1 到 KM-6）。A1、A4a 合并后 Codex 最多 2 路同时（CX-2、CX-3）。

## 3. 第一波：任务和提示词

**怎么读**：“什么时候开”到了就开这个会话。关键路径：A1 → A2 → A4c → A11/A11m；A4a → A4b → A5a → A5b；C0a → C0f → C0g、C0i（分在两个会话同时做）→ C0z → C2；D0 → D1 → D2 → D1b。四条线同时走，第一波大约 6–8 个工作日（取决于审核和合并的速度）。

### 3.1 Codex 的任务（6 张，全是后端订单和退款）

| 会话 | 卡（顺序） | 什么时候开 | 审核 |
|---|---|---|---|
| CX-1 | A4a | 马上 | 我审代码 |
| CX-2 | A2 | A1 合并后 | 我审代码 |
| CX-3 | A4b | A4a 合并后 | 我审代码 |
| CX-4 | A5a | A4b 合并后 | 我审代码 |
| CX-5 | A4c | A4b、A2 合并后 | 我审代码 |
| CX-6 | A5b | A5a 合并后 | 我审代码 |

#### CX-1：A4a

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A4a。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A4a 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A4a-receipt origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A4a:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A4a.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### CX-2：A2

第一条提示词（A1 合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A2。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A2 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A2-order-view origin/integration/2026-11
先确认依赖已合并：对 "A1:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A2:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A2.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### CX-3：A4b

第一条提示词（A4a 合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A4b。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A4b 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A4b-order-address origin/integration/2026-11
先确认依赖已合并：对 "A4a:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A4b:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A4b.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### CX-4：A5a

第一条提示词（A4b 合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A5a。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A5a 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A5a-after-sale-customer origin/integration/2026-11
先确认依赖已合并：对 "A4b:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A5a:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A5a.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### CX-5：A4c

第一条提示词（A4b、A2 合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A4c。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A4c 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A4c-admin-order-ops origin/integration/2026-11
先确认依赖已合并：对 "A4b:" "A2:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A4c:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A4c.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### CX-6：A5b

第一条提示词（A5a 合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A5b。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A5b 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A5b-mock-refund origin/integration/2026-11
先确认依赖已合并：对 "A5a:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A5b:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A5b.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

### 3.2 Kimi 的任务（19 张：契约、路由、小程序组件、后台）

| 会话 | 卡（顺序） | 什么时候开 | 审核 |
|---|---|---|---|
| KM-1 | A1 | 马上 | 我审代码 |
| KM-2 | C0a → C0f → C0g | 马上 | 我审代码；C0f、C0g 你看样子 |
| KM-3 | C0e → C0h → C0i | 马上 | 我审代码；你看样子 |
| KM-4 | C0b、C0c | 马上 | 我审代码；你看样子 |
| KM-5 | C0d、C0j | 马上 | 我审代码 |
| KM-6 | D0 → D1 → D2 → D1b | 马上 | 我审代码；D2 你看样子 |
| KM-7 | A11、A11m | A4c、A5a 合并后 | 我审代码 |
| KM-8 | C0z → C2 | C0a–C0j 全部合并后 | 我审代码；C0z 合并后你在开发者工具看全部 kit 页 |

#### KM-1：A1

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 A1。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave1.md 开头的“共同规矩”，和卡 A1 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A1-contract origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A1:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A1.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

#### KM-2：C0a、C0f、C0g

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 C0a。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/miniprogram-wave1.md 开头的“共同规矩”，和卡 C0a 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/C0a-tokens origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“C0a:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/C0a.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

C0a 合并后接着粘（C0f 的依赖：C0a）：

```
上一张已合并。接着在同一个仓库做任务卡 C0f，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“C0f:”开头；拿不准就问）。
卡在 docs/design/tasks/miniprogram-wave1.md。
git fetch origin && git switch -c agent/C0f-basic origin/integration/2026-11
先确认依赖已合并：对 "C0a:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/C0f.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

C0f 合并后接着粘（C0g 的依赖：C0f）：

```
上一张已合并。接着在同一个仓库做任务卡 C0g，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“C0g:”开头；拿不准就问）。
卡在 docs/design/tasks/miniprogram-wave1.md。
git fetch origin && git switch -c agent/C0g-layer origin/integration/2026-11
先确认依赖已合并：对 "C0f:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/C0g.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

#### KM-3：C0e、C0h、C0i

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 C0e。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/miniprogram-wave1.md 开头的“共同规矩”，和卡 C0e 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/C0e-bead origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“C0e:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/C0e.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

C0e 合并后接着粘（C0h 的依赖：C0e）：

```
上一张已合并。接着在同一个仓库做任务卡 C0h，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“C0h:”开头；拿不准就问）。
卡在 docs/design/tasks/miniprogram-wave1.md。
git fetch origin && git switch -c agent/C0h-bracelet origin/integration/2026-11
先确认依赖已合并：对 "C0e:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/C0h.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

C0h 合并后接着粘（C0i 的依赖：C0f）：

```
上一张已合并。接着在同一个仓库做任务卡 C0i，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“C0i:”开头；拿不准就问）。
卡在 docs/design/tasks/miniprogram-wave1.md。
git fetch origin && git switch -c agent/C0i-composer origin/integration/2026-11
先确认依赖已合并：对 "C0f:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/C0i.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

#### KM-4：C0b、C0c

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里依次做任务卡 C0b、C0c，先做 C0b。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/miniprogram-wave1.md 开头的“共同规矩”，和卡 C0b、C0c 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/C0b-icons origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“C0b:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/C0b.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

然后不用等合并，接着做 C0c（它和前面的卡互不依赖）：
git fetch origin && git switch -c agent/C0c-wordmark origin/integration/2026-11，依赖：无。 同样的做法和交付（报告写 docs/reports/C0c.md），提交说明以“C0c:”开头。

全部交付后停下，不要开始卡片以外的工作。
```

#### KM-5：C0d、C0j

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里依次做任务卡 C0d、C0j，先做 C0d。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/miniprogram-wave1.md 开头的“共同规矩”，和卡 C0d、C0j 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/C0d-format origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“C0d:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/C0d.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

然后不用等合并，接着做 C0j（它和前面的卡互不依赖）：
git fetch origin && git switch -c agent/C0j-size-rule origin/integration/2026-11，依赖：无。 同样的做法和交付（报告写 docs/reports/C0j.md），提交说明以“C0j:”开头。

全部交付后停下，不要开始卡片以外的工作。
```

#### KM-6：D0、D1、D2、D1b

第一条提示词（马上开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 D0。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/admin-wave1.md 开头的“共同规矩”，和卡 D0 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/D0-admin-build origin/integration/2026-11
依赖：无。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“D0:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/D0.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

D0 合并后接着粘（D1 的依赖：A1 D0）：

```
上一张已合并。接着在同一个仓库做任务卡 D1，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“D1:”开头；拿不准就问）。
卡在 docs/design/tasks/admin-wave1.md。
git fetch origin && git switch -c agent/D1-admin-contract origin/integration/2026-11
先确认依赖已合并：对 "A1:" "D0:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/D1.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

D1 合并后接着粘（D2 的依赖：D1）：

```
上一张已合并。接着在同一个仓库做任务卡 D2，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“D2:”开头；拿不准就问）。
卡在 docs/design/tasks/admin-wave1.md。
git fetch origin && git switch -c agent/D2-admin-shell origin/integration/2026-11
先确认依赖已合并：对 "D1:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/D2.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

D2 合并后接着粘（D1b 的依赖：A2 D2）：

```
上一张已合并。接着在同一个仓库做任务卡 D1b，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“D1b:”开头；拿不准就问）。
卡在 docs/design/tasks/admin-wave1.md。
git fetch origin && git switch -c agent/D1b-admin-order-detail origin/integration/2026-11
先确认依赖已合并：对 "A2:" "D2:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/D1b.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

#### KM-7：A11、A11m

第一条提示词（A4c、A5a 合并后开）：

```
你在 GitHub 仓库“串个珠”里依次做任务卡 A11、A11m，先做 A11。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/backend-wave2.md 开头的“共同规矩”，和卡 A11、A11m 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/A11-routes origin/integration/2026-11
先确认依赖已合并：对 "A4c:" "A5a:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“A11:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/A11.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

然后不用等合并，接着做 A11m（它和前面的卡互不依赖）：
git fetch origin && git switch -c agent/A11m-migrations-registry origin/integration/2026-11，先确认依赖已合并：对 "A5a:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。 同样的做法和交付（报告写 docs/reports/A11m.md），提交说明以“A11m:”开头。

全部交付后停下，不要开始卡片以外的工作。
```

#### KM-8：C0z、C2

第一条提示词（C0a–C0j 全部合并后开）：

```
你在 GitHub 仓库“串个珠”里做任务卡 C0z。先拉最新代码：已经有这个仓库就 git fetch origin，没有就先 git clone。

【只读这些，别的文档不要通读，省 token】
1. AGENTS.md（很短）
2. docs/design/tasks/miniprogram-wave1.md 开头的“共同规矩”，和卡 C0z 这一节（用 grep -n "^##" 找到行号后只读那一段）
3. 卡里“只能改”列出的现有文件；卡里点名的文档章节，同样先 grep 标题再只读那一节
4. 要看设计稿时只取那一屏：python3 docs/design/tasks/screen.py s65（小程序稿）或 A17（后台稿）。不要打开整个 mockups-*.html
不要读 docs/design/15-dev-plan.md、docs/handoff.md、docs/codex-tasks.md、整份 04/05 号文档。

【开工】
git fetch origin && git switch -c agent/C0z-register origin/integration/2026-11
先确认依赖已合并：对 "C0a:" "C0b:" "C0c:" "C0d:" "C0e:" "C0f:" "C0g:" "C0h:" "C0i:" "C0j:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前先跑一次后端和小程序测试，记下各有多少个测试（报告里要写）。

【做法】
- 严格按卡里的步骤做，只改卡里“只能改”列出的文件。
- 开发中只跑和这张卡相关的测试文件；全部做完后跑一次 AGENTS.md 里的三条测试（先 unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy）。
- 每做完一步提交一次，提交说明以“C0z:”开头。
- 不许做的事见 docs/design/tasks/00-dispatch.md 第 5.4 节（只读这一节），尤其：不改“只能改”以外的文件、不删不改弱已有测试、不加新依赖、不 force push、不合并。
- 卡里写了“停下来问”的情况，或者产品意图拿不准：先提交并 push 已做的部分，再按 00-dispatch.md 第 5.5 节的格式停下来问我，不要猜。

【交付】
1. 读 docs/design/tasks/00-dispatch.md 第 5.1–5.3 节和第 6 节，按第 6 节自查一遍。
2. 按 5.2 的格式写交付报告 docs/reports/C0z.md，逐项填（步骤、验收证据、diff --stat、测试数、自查命令输出、没做的），提交。
3. git push -u origin HEAD。能开 PR 就开到 integration/2026-11，描述贴报告内容；开不了就告诉我分支名。

全部交付后停下，不要开始卡片以外的工作。
```

C0z 合并后接着粘（C2 的依赖：A2 C0z）：

```
上一张已合并。接着在同一个仓库做任务卡 C2，规矩和上一张一样（只读规矩、这张卡和它点名的文件；只改“只能改”的文件；只跑相关测试，最后跑三条；每步提交，说明以“C2:”开头；拿不准就问）。
卡在 docs/design/tasks/miniprogram-wave1.md。
git fetch origin && git switch -c agent/C2-order-state origin/integration/2026-11
先确认依赖已合并：对 "A2:" "C0z:" 每个都跑 `git log origin/integration/2026-11 --oneline | grep <它>`，有一个查不到就停下来告诉我“依赖的 X 还没合并”。
开工前记下测试数。交付和上一张一样：按 00-dispatch.md 第 5.2 节写 docs/reports/C2.md 并提交，push，开 PR 或告诉我分支名，然后停下。
```

### 3.3 两个通用提示词（两边都用）

**被打回时**，粘到做这张卡的那个会话（把审核意见原样贴在后面）：

```
<卡号> 审核没通过，意见如下（按编号逐条改）。在同一个分支 agent/<卡号>-<简述> 上追加提交，提交说明写“<卡号>: 审核 N ……”；不要开新分支，不要 force push。改完更新 docs/reports/<卡号>.md 第 7 节（编号、怎么改的、提交 hash），三条测试再跑一次更新第 4 节，push，然后停下。
<审核意见>
```

**回答它的提问后**：

```
关于你问的：<答复>。按这个继续做 <卡号>，规矩不变，做完照常交付。
```

## 4. 审核和合并

**每张卡都由我审代码，样子由你看。**执行 agent 打不开微信开发者工具，截图靠不住，所以：

| 谁 | 看什么 | 怎么看 |
|---|---|---|
| 我（每张卡） | 按 [00-dispatch.md](00-dispatch.md) 第 6 节：范围、步骤、验收证据、测试、项目铁律、提交 | 你告诉我“X 交了”（卡号就行），我从分支读 `docs/reports/<卡号>.md` 和代码，给出“可以合 / 改完再看（编号意见）/ 退回重做” |
| 你（只看样子的卡） | 报告第 2 节里写着“需要负责人看”的页面，和稿子并排比 | 小程序卡：C0z 合并后在开发者工具里把 kit 页一次看完；后台卡：本地 `npm run dev` 打开对应页面。差得多的告诉我，我写成审核意见打回 |

几张卡可以攒在一起告诉我，我一次审完。

**要改的时候**：把我的意见原样粘回**做这张卡的那个会话**，让它在同一个分支上改、再 push。不要开新会话。

**合并冲突**：
- 只冲突在 `miniprogram/utils/contract.js` 或 `admin-web/src/contract.ts` 这两个生成文件：合并后跑 `python3 tools/export_contract.py` 再提交。
- 其他冲突：发给我，执行 agent 不要自己解。

**每合一张**：看第 3 节的表，哪个会话“什么时候开”到了就开、哪个会话可以“接着粘”了就粘。

## 5. 第二波怎么接

1. **第 4 批全部合并后**，你跟我说一声。我做一次“开工前核对”（一次会话）：
   - 对照当时的真代码，把每张卡的“只能改”补成逐文件，核对函数名；
   - 前端卡补验收；
   - 按本文第 3 节的格式，写好第 5–9 批每个会话的提示词。
2. 执行者先这样分，到时候按第一波的实际表现再调：

| 谁 | 卡 |
|---|---|
| Codex（10 张） | A3 去手工费、A7 手机号登录、A8a 账号密码会话、A8b 权限点、A8c 打码、A8e 数据范围、K1 知识库存进数据库、B-8 AI 返回结构、B-14 微信支付、A5c 改手围重串 |
| Kimi（其余 65 张） | 后端：A8d、K2、K3、B-1 到 B-13（除 B-8）、B-11a–c、A10；小程序：C1p、C1a、C1b、C3a–d、C4a–d、C5a–c、C6a–c、C7a–b、C8a–c、C9a–c、C10a–b、C11a–b；后台：DB 打包、D3a–c、D4、D5a–b、D6a–b、D7a–c、D8、KD1、KD2、D9 |

3. 第二波还要等你定的事见 [00-dispatch.md](00-dispatch.md) 第 2 节末尾（E1、E3–E7 等），没定的卡先跳过，不影响别的卡。

## 6. 已知的限制

- 执行 agent 都看不了微信开发者工具，前端只能你验：C0z 合并后看一次 kit 页；第二波每批页面卡合并后看一次。PR 里写“未在开发者工具验证”是正常的。
- 稿子是 HTML，Kimi 和 Codex 读得到结构和文字，但看不到渲染出来的样子。还原度靠你看截图对比；差得多的打回给同一个会话。
- Codex 额度粗算：第一波 6 个会话，每个会话读的东西从七万多字降到一万字左右，主要花在写代码和跑测试上。
