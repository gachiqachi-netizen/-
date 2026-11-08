# 给执行 agent 的说明（Kimi / Codex 等）

开工前按顺序读：

1. [docs/handoff.md](docs/handoff.md)：项目现状、当前工作分支、下一步做什么。
2. [docs/codex-tasks.md](docs/codex-tasks.md)：工作守则（第 2 节）、任务清单（第 4 节）、汇报格式（第 2.6 节）。

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
- 金额按“分”的整数计算；尺寸规则不能改。
- 小程序代码不要依赖 `URL` 等浏览器对象；地址不要写死，一律走 `miniprogram/config.js`。
- 拿不准产品意图时停下来问，不要猜；没在微信开发者工具或真机上验证过的，不要说“已通过”。
