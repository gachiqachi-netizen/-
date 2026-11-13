# C3c 交付报告

分支：agent/C3c-workbench-stack　最后一个实现提交：221f575

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
|---|---|---|
| 叠戴只换托盘，选珠区和底部栏都还在 | 做了，未在开发者工具核屏 | `pages/diy/diy.js::stack/chooseStack/applyStack/refreshStackPreview/closeStackPreview`；`diy.wxml` 托盘的 `c-bracelet` stack 模式。 |
| 起名弹层推荐名只用所选珠子的 tags，过 banned 词表 | 已实现，契约导出测试通过 | `diy.js::openName/nameInput/confirmName/finish`；经负责人同意把词表写入契约并导出。 |
| “更多”：按手围重排、按颗数串、落珠声 | 做了 | `diy.js::reflowWrist/openCount/count/toggleSound`；`diy.wxml` 的 `c-sheet`。 |
| 托盘上拉放大、拖动排序、松手复位 | 做了，未实机验证触摸效果 | `diy.js::trayTouchStart/trayTouchMove/trayLongPress/trayTouchEnd`。 |
| 尺寸规则算法一个字不能改 | 做到 | `git diff -- miniprogram/pages/diy/logic.js` 无输出。 |

## 2. 验收

| D17 验收项 | 结果 | 证据 |
|---|---|---|
| 1. 选最多两条、叠戴预览只换托盘、可继续串、关闭恢复单条；无别的作品时提示 | 代码及定向测试通过，未实机验证 | `node --test miniprogram/tests/workbench-stack.test.js` 中“叠戴最多选两条…”；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s15、s16。 |
| 2. 起名弹层、9 字限制、推荐名、没起名点“串好了” | 代码、定向测试及契约导出测试通过，未实机验证 | `workbench-stack.test.js::起名只从珠子 tags 推荐；禁用词不能保存，输入最多八字`、`::没起名就点串好了，用所选珠子的安全 tags 推荐首名`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s17。 |
| 3. 按手围重排：20 颗变 21 颗、刚好合适 | 代码及定向测试通过，未实机验证 | `workbench-stack.test.js::20 颗 8mm 按手围重排成 21 颗，尺寸文案由原规则计算`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s16。 |
| 4. 09 清单 6、24、29、G1–G8 | 部分完成，未实机验证 | 叠戴配字和 `c-sheet` 见 `diy.wxml`；需要负责人在开发者工具看：`pages/diy/diy`，对照稿 s16。 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`（报告本次更新前）：

```text
 .../{pages/diy/c3c.test.js => tests/workbench-stack.test.js}        | 6 +++---
 1 file changed, 3 insertions(+), 3 deletions(-)
```

## 4. 测试

```text
python3 -m unittest discover -s server/tests: Ran 559 tests in 126.543s; OK (skipped=7)
node --test miniprogram/tests/*.test.js: tests 211; pass 211; fail 0
python3 kb/validate.py: 已填 200/200 种，有问题 0 条，缺 0 种
node --test miniprogram/tests/workbench-stack.test.js: tests 6; pass 6; fail 0
python3 -m unittest discover -s server/tests -p test_contract.py: Ran 5 tests; OK
```

测试数：后端开工前 558 → 现在 559；小程序开工前 205 → 现在 211。新增 6 个工作台测试：叠戴选两条且不改当前设计、20 颗按手围重排、托盘放大与换位、更多中的声音及 108 颗、禁用词与 8 字起名、未起名时推荐首名。审核后测试已移入 `miniprogram/tests/`，全量命令包含这 6 个用例。后端新增 `test_banned_words_include_kb_terms` 验证非空且包含知识库的“招财”。未改旧测试期望值。

## 5. 自查（贴命令和输出）

```text
git log --oneline origin/integration/2026-11..HEAD
d57bc97 C3c: 审核 3 把工作台测试纳入小程序全量
221f575 C3c: 审核 2 固定禁用词导出顺序
5b473f8 C3c: 记录词表导出顺序阻塞
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
- 经负责人选择 A，同长度禁用词在 `contract.py` 导出时按词排序，保证不同 Python 进程得到相同生成文件；词表仍来自 `kb._load()["banned"]`，`kb.py` 没改。`test_exported_files_are_fresh` 和三条全量均通过。
- C3d 未开工。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
|---|---|---|
| 负责人批准 A：词表来源 | 契约加入 bannedWords、导出两个文件并加后端测试；小程序起名按词表检查 | 342ceff、877bfc6 |
| 负责人批准 A：稳定排序 | 从知识库取词后固定同长度词的顺序，再运行导出脚本 | 221f575 |
| 审核：测试目录 | 把页面内 `c3c.test.js` 移到 `miniprogram/tests/workbench-stack.test.js`，调整 require 路径；全量从 205 增为 211 | d57bc97 |
