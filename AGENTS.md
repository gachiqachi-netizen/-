# 给执行 agent 的说明（Kimi / Codex 等）

**派给你的是一张任务卡时（提示词里有卡号）**：只读提示词里列的东西（本文件、卡片和卡里点名的章节），**不要通读下面 1–4**，省 token。设计稿只用 `python3 docs/design/tasks/screen.py <屏号>` 取一屏。同一台电脑上几个会话并行时，每个会话在自己的 git worktree 里做，不要在别人的目录里切分支。

没有任务卡、要了解整个项目时，按顺序读：

1. [docs/design/15-dev-plan.md](docs/design/15-dev-plan.md)：**改版开发总计划**（2026-11-13 起派活以它为准）：分支、字段契约、A–E 五条线的任务、里程碑、交付要求。
2. [docs/design/README.md](docs/design/README.md)：设计文档的阅读顺序；做哪个任务就读它对应的那一节。
3. [docs/handoff.md](docs/handoff.md)：项目背景（任务清单部分已被第 1 条取代）。
4. [docs/codex-tasks.md](docs/codex-tasks.md)：工作守则（第 2 节）、汇报格式（第 2.6 节）。任务清单（第 4 节）已作废，以第 1 条为准。

最重要的几条（详见工作守则）：

- 不要往 main 提交，也不要推送 main；只在自己的工作分支上提交、推送。
- 每次改完都要跑通三条测试：
  ```bash
  python3 -m unittest discover -s server/tests
  node --test miniprogram/tests/*.test.js
  python3 kb/validate.py
  ```
- 不接真实支付；不写任何真实密钥、令牌、手机号、地址。
- 给用户看的文字只讲寓意不讲功效（禁用词表在 `kb/data/attributes.json`）。
- 金额按“分”的整数计算；尺寸规则不能改（以小程序工作台 `miniprogram/pages/editor/logic.js` 的 `stats` 为准，后端 `server/plans.py` 的 `main_mm`、`target_for`、`_fill` 与它一致；两边共用用例在 `server/tests/fixtures/size_rule_cases.json`，不要只改一边）。
- 小程序代码不要依赖 `URL` 等浏览器对象；地址不要写死，一律走 `miniprogram/config.js`。
- 拿不准产品意图时停下来问，不要猜；没在微信开发者工具或真机上验证过的，不要说“已通过”。
