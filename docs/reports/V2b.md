# V2b 交付报告

分支：agent/V2b-tangent-layout　最后一个功能提交：2e73d4a

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 1. 所有珠子的圆心都在同一个圆上 | 做了，4 颗以上使用同一个求解半径 | `miniprogram/utils/bracelet-layout.js:29`、`admin-web/src/bracelet/layout.ts:43` |
| 2. 相邻两颗正好相切、不重叠 | 做了，弦长角度求和后二分 80 次 | `miniprogram/utils/bracelet-layout.js:30`、`admin-web/src/bracelet/layout.ts:44` |
| 3. 珠子太少时按现在方式排 | 做了，1–3 颗保留原排法 | `miniprogram/utils/bracelet-layout.js:18`、`admin-web/src/bracelet/layout.ts:32` |
| 4. 1 号珠正上方，顺时针，整串在容器内 | 做了 | `miniprogram/tests/bracelet-layout-shared.test.js`、`admin-web/scripts/check-layout.cjs` |
| 测试和截图 | 做了 3 组混排、工作台前后截图；后台工单待负责人浏览器看 | 共用用例和 `docs/reports/shots/V2b/` |

## 2. 验收

| 验收项 | 结果 | 证据 |
| --- | --- | --- |
| 圆心同圆、相邻含首尾相切 | 通过 | `miniprogram/tests/bracelet-layout-shared.test.js::大小珠混排圆心同圆、首尾相切且任意两颗不重叠`；相切误差 ≤0.01px |
| 任意两颗不重叠 | 通过 | 同上；3 组混排各对珠子距离 ≥半径和－0.5px |
| 前后台共用结果一致 | 通过 | `npm run check:layout`：13 cases passed，max error 0.5px |
| 工作台截图 | 已截 | [改前](shots/V2b/before/workbench.png)、[改后](shots/V2b/after/workbench.png)；脚本各完成 1/1 页。工作台仍调用旧组件排布，见第 6 节 |
| 后台工单图 | 待人工看 | 需要负责人在浏览器看：后台做单 → 工单详情，选择 10/4mm 或 12/6mm 混排珠序，核对编号与相切圆环 |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD` 在最终提交后核对：算法两份、共用用例、两端测试、报告与工作台截图。

## 4. 测试

- `python3 -m unittest discover -s server/tests`：Ran 619 tests in 110.961s，OK (skipped=7)。开工前 619 → 现在 619。
- `node --test miniprogram/tests/*.test.js`：tests 289，pass 289，fail 0。开工前 288 → 现在 289。
- `python3 kb/validate.py`：已填 200/200 种，有问题 0 条，缺 0 种。
- `npm run check:layout`：layout parity: 13 cases passed (max error 0.5px)。
- `npm run build`：TypeScript 和 Vite 构建通过，1624 modules transformed；未提交打包文件。
- 新增测试 `大小珠混排圆心同圆、首尾相切且任意两颗不重叠`：检查 10/4、12/6、大佛头配 8mm 三组，每颗同圆心半径、每对相邻相切、所有珠子不重叠。
- 旧测试未删除、未改弱。

## 5. 自查（命令和输出）

- `git diff --check`：无输出。
- `git log --oneline origin/integration/2026-11..HEAD`：`V2b: 开工`、`V2b: 用弦长求同圆相切排布`、`V2b: 增加三组混排共用用例与几何断言`；报告与截图提交后再核对。
- `npm run build`：`✓ built in 1.60s`。
- `npm run check:layout`：`layout parity: 13 cases passed (max error 0.5px)`。
- `rg 'new URL|URLSearchParams' miniprogram`：本卡未引入浏览器 URL 对象。

## 6. 没做 / 没验证 / 偏离卡片

- 工作台页面目前从 `miniprogram/components/bracelet/index.js` 引入旧 `layout`；V2b 的“只能改”不包含该组件，V3 才负责页面切换。故工作台改前改后截图几乎相同，不能据此声称工作台视觉已更新。共用算法几何验收由测试验证。
- 后台工单页未在浏览器人工查看；需负责人按第 2 节路径验收。
- 8801 被另一项目服务占用。使用 `tools/shoot/shoot.js` 的内存载入方式将本次请求端口改为临时 8892，未改动或提交截图脚本；脚本先登录并建演示数据。改后截图曾重试，最终结果 1/1 页通过。
