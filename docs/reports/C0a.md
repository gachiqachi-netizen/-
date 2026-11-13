# C0a 交付报告

分支：agent/C0a-tokens　最后一个提交：1fb9559

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 1. 原样复制 tokens.wxss | 做了 | miniprogram/styles/tokens.wxss（提交 d45ae90），`diff docs/design/tokens.wxss miniprogram/styles/tokens.wxss` 无输出 |
| 2. app.wxss 第一行 import，旧类保留、颜色和边框改变量 | 做了 | miniprogram/app.wxss（提交 d45ae90）：`.primary` 黑底白字胶囊、`.card` 去掉边框、`.active` 不再用红色 |
| 3. 加文字类 .t-display 等 7 个 | 做了 | miniprogram/app.wxss 末行，字号取 4 档变量 |
| 4. 新建 utils/theme.js | 做了 | miniprogram/utils/theme.js（提交 8964c64），7 个颜色 |
| 5. app.json 颜色和标题 | 做了 | miniprogram/app.json（提交 8964c64）：标题“珠养养”，tabBar color/selectedColor/backgroundColor/borderStyle |
| 6. 测试 theme-tokens.test.js | 做了 | miniprogram/tests/theme-tokens.test.js（提交 1fb9559），4 个用例 |

## 2. 验收

| 卡上的验收项 | 结果 | 证据 |
| --- | --- | --- |
| 首页底纯白、主按钮黑底白字胶囊（截图） | 样式已按变量实现，截图未做 | 需要负责人在开发者工具看：`pages/home/home`（首页底、`page` 底色变量）、任一含 `.primary` 按钮的页；无对应稿屏号，对照 tokens.wxss 变量值 |
| 四个 tab、编辑器、下单页都能正常打开，文字看得见、不错位 | 未在开发者工具验证 | 需要负责人在开发者工具看：`pages/home/home`、`pages/diy/diy`、`pages/ai/ai`、`pages/mine/mine`、`pages/editor/editor`、`pages/order/order` |
| 三条测试通过 | 通过 | 见第 4 节 |

## 3. 改了的文件

```
 miniprogram/app.json                   |  7 ++--
 miniprogram/app.wxss                   |  4 ++-
 miniprogram/styles/tokens.wxss         | 62 ++++++++++++++++++++++++++++++++++
 miniprogram/tests/theme-tokens.test.js | 37 ++++++++++++++++++++
 miniprogram/utils/theme.js             | 10 ++++++
 5 files changed, 116 insertions(+), 4 deletions(-)
```
（git diff --stat origin/integration/2026-11...HEAD；app.json 只改了 window 和 tabBar 的颜色和标题，未碰 pages、subPackages、tabBar.list）

## 4. 测试

```
$ python3 -m unittest discover -s server/tests
Ran 225 tests in 15.971s
OK (skipped=7)

$ node --test miniprogram/tests/*.test.js
ℹ tests 88
ℹ pass 88
ℹ fail 0

$ python3 kb/validate.py
已填 200/200 种，有问题 0 条，缺 0 种
```

测试数：后端 开工前 225 个 → 现在 225 个；小程序 开工前 84 个 → 现在 88 个（未变少）。

这张卡新加的测试：
- `miniprogram/tests/theme-tokens.test.js::theme.js 与 tokens.wxss 的 --c-* 逐项相等`：解析 tokens.wxss 的全部颜色变量，和 theme.js 深比较，防两边不同步。
- `miniprogram/tests/theme-tokens.test.js::颜色变量总数不超过 30`：变量预算上限。
- `miniprogram/tests/theme-tokens.test.js::tokens.wxss 里没有 accent`：不允许出现强调色。
- `miniprogram/tests/theme-tokens.test.js::app.wxss 没有 # 开头的颜色值`：全局样式不许写死颜色。

## 5. 自查（贴命令和输出）

```
$ git log --oneline origin/integration/2026-11..HEAD
1fb9559 C0a: theme-tokens 一致性测试
8964c64 C0a: theme.js 颜色值和 app.json 导航栏/tabBar 配色
d45ae90 C0a: 复制 tokens.wxss，app.wxss 改变量并加文字类
82f9243 C0a: 开工

$ grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" miniprogram/app.wxss
（无输出）

$ grep -rnE "new URL|URLSearchParams" miniprogram --include=*.js
（无输出）
```

## 6. 没做 / 没验证 / 偏离卡片

- 截图验收未做：本环境打不开微信开发者工具，按 00-dispatch.md 第 5.3 节写“需要负责人看”（见第 2 节），未在开发者工具验证。

## 7. 审核修改（打回后才有）

（暂无）
