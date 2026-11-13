# C3c 交付报告

分支：agent/C3c-workbench-stack　最后一个实现提交：877bfc6

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 叠戴只换托盘，选珠区和底部栏都还在 | 做了，未在开发者工具核屏 | `pages/diy/diy.js::stack/chooseStack/applyStack/refreshStackPreview/closeStackPreview`；`diy.wxml` 托盘的 `c-bracelet` stack 模式。 |
| 起名弹层推荐名只用所选珠子的 tags，过 banned 词表 | 已实现，导出稳定性待确认 | `diy.js::openName/nameInput/confirmName/finish`；经负责人同意把词表写入契约并导出。 |
| “更多”：按手围重排、按颗数串、落珠声 | 做了 | `diy.js::reflowWrist/openCount/count/toggleSound`；`diy.wxml` 的 `c-sheet`。 |
| 托盘上拉放大、拖动排序、松手复位 | 做了，未实机验证触摸效果 | `diy.js::trayTouchStart/trayTouchMove/trayLongPress/trayTouchEnd`。 |
| 尺寸规则算法一个字不能改 | 做到 | `git diff -- miniprogram/pages/diy/logic.js` 无输出。 |

## 2. 验收

| D17 验收项 | 结果 | 证据 |
|---|---|---|
| 1. 选最多两条、叠戴预览只换托盘、可继续串、关闭恢复单条；无别的作品时提示 | 代码及定向测试通过，未实机验证 | `node --test miniprogram/pages/diy/c3c.test.js` 中“叠戴最多选两条…”；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s15、s16。 |
| 2. 起名弹层、9 字限制、推荐名、没起名点“串好了” | 代码与定向测试通过，未实机验证；契约导出稳定性待确认 | `c3c.test.js::起名只从珠子 tags 推荐；禁用词不能保存，输入最多八字`、`::没起名就点串好了，用所选珠子的安全 tags 推荐首名`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s17。 |
| 3. 按手围重排：20 颗变 21 颗、刚好合适 | 代码及定向测试通过，未实机验证 | `c3c.test.js::20 颗 8mm 按手围重排成 21 颗，尺寸文案由原规则计算`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s16。 |
| 4. 09 清单 6、24、29、G1–G8 | 部分完成，未实机验证 | 叠戴配字和 `c-sheet` 见 `diy.wxml`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s16。 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`（报告最后提交前）：

```text
 admin-web/src/contract.ts         |  75 ++++++++++++++++++++++++++-
 docs/reports/C3c.md               |  69 +++++++++++++++++++++++++
 miniprogram/pages/diy/c3c.test.js | 105 ++++++++++++++++++++++++++++++++++++++
 miniprogram/pages/diy/diy.js      |  38 +++++++++++---
 miniprogram/pages/diy/diy.wxml    |  12 +++--
 miniprogram/pages/diy/diy.wxss    |   2 +
 miniprogram/utils/contract.js     |  75 ++++++++++++++++++++++++++-
 server/contract.py                |   3 +-
 server/tests/test_contract.py     |   8 +++
 9 files changed, 372 insertions(+), 15 deletions(-)
```

## 4. 测试

```text
python3 -m unittest discover -s server/tests: Ran 558 tests in 122.044s; OK (skipped=7)
node --test miniprogram/tests/*.test.js: tests 205; pass 205; fail 0
python3 kb/validate.py: 已填 200/200 种，有问题 0 条，缺 0 种
node --test miniprogram/pages/diy/c3c.test.js: tests 6; pass 6; fail 0
python3 -m unittest discover -s server/tests -p test_contract.py: 5 tests; FAIL (test_exported_files_are_fresh)
```

测试数：后端开工前 558 → 现在 558；小程序开工前 205 → 现在 205。新增 6 个页面目录内定向测试：叠戴选两条且不改当前设计、20 颗按手围重排、托盘放大与换位、更多中的声音及 108 颗、禁用词与 8 字起名、未起名时推荐首名。全量 `miniprogram/tests/*.test.js` 不包含这个页面目录内文件，已单独运行。未改旧测试期望值。

## 5. 自查（贴命令和输出）

```text
git log --oneline origin/integration/2026-11..HEAD
877bfc6 C3c: 接入契约禁用词与起名弹层
342ceff C3c: 在契约导出知识库禁用词
3d7b5fa C3c: 记录已完成步骤与起名词表阻塞
cdfc34b C3c: 补充更多操作和多圈串测试
5d34742 C3c: 实现叠戴预览更多操作和托盘手势
727c445 C3c: 开工
```

`grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(' miniprogram/pages/diy/diy.wxss`：无输出。
`grep -rnE 'new URL|URLSearchParams' miniprogram --include='*.js'`：无输出。
`git diff --check`：无输出。
`git diff -- miniprogram/pages/diy/logic.js`：无输出。

## 6. 没做 / 没验证 / 偏离卡片

- 未在微信开发者工具或真机验证叠戴层叠、弹层高度、起名弹层和触摸手势；没有截图。
- 经负责人同意，额外改了 `server/contract.py`、`server/tests/test_contract.py`，并运行 `python3 tools/export_contract.py` 提交生成的 `miniprogram/utils/contract.js`、`admin-web/src/contract.ts`；生成文件没有手改。`kb.py` 和 `pages/diy/logic.js` 未改。
- 已知阻塞：既有 `test_exported_files_are_fresh` 失败。`kb._load()["banned"]` 在 `server/kb.py` 用 `sorted(set(banned), key=len, reverse=True)` 排序，同长度词的顺序随 Python 哈希种子变化。导出脚本与测试处于不同进程，`bannedWords` 字符串顺序不稳定。当前按负责人要求直接 `list(kb._load()["banned"])`；如果不允许再做确定性排序，不能稳定通过新鲜度测试。已停下来问最小偏离方案。前三条全量结果是新增契约字段之前的记录；新增字段后还未跑三条最终全量。
- C3d 未开工。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 负责人批准 A | 契约加入 bannedWords、导出两个文件并加后端测试；小程序起名按词表检查 | 342ceff、877bfc6 |
