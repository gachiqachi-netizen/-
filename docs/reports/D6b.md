# D6b 模板 交付报告

- **分支**：`agent/D6b-templates`（从 `origin/integration/2026-11` 切出，基线含 D4）
- **卡片**：`docs/design/tasks/admin-wave2.md` D6b；稿 A12（`docs/design/12-admin.md` 第 99 行 + 第 9 条约定）
- **只能改的范围**：`src/pages/templates.tsx`、`src/pages/templates/`（已遵守；`src/components/TemplatesView.tsx` 未动，变成未引用的旧实现，D9 清理卡可以删）

## 做了什么

新实现 `src/pages/templates/TemplatesWorkbench.tsx` + `templates.css`，`templates.tsx` 改为薄壳转发（App 传的 `templates/beads/onRefresh/notify` 四个 prop 不变）。

1. **配方三行可拖动**：开头（special）/ 循环（pattern）/ 收尾（tail）三行，每行珠子 chip 支持 HTML5 拖拽排序（同队内移动，拖到最后空白处=移到末尾）、× 移除、下拉添加。固定颗数（fixed）输入框保留。
2. **13–19cm 分段预览**：配方变化防抖 350ms 后，7 个手围并行 `POST /api/admin/templates/expand`（带 recipe，不依赖模板已保存），表格列出 颗数 count、长度/目标 lengthMm/targetMm、到手价 totalFen、贴合 fitOk；基准手围行高亮。加载中骨架屏、整行错误统一 ErrorState 重试。expand 返回的 warnings 也在表下黄条提示。
3. **寓意从知识库关键词勾选（≤3）**：从配方珠子的 `kb` 关联取 `/api/kb/bead/{id}`（带缓存），收集 `meaning.tags` 去重。**"只列把握在中以上的"由 `kb.public` 保证**——它会把 `confidence.meaning == "low"` 的整条 meaning 清空，所以前端拿到的 tags 天然只有中/高把握。最多勾 3 个，超出 toast 报错并禁用未选项。
4. **下架珠子顶部提示**：配方里 `onSale === false` 的珠子在编辑器顶部红条列出名字和 id。

保存/复制/删除沿用现有接口（POST/PUT `/api/admin/templates`、`/copy`、DELETE）。左侧模板列表（名称+状态+基准手围），右侧编辑区。

## 已决偏离

- **寓意存进模板 `meaning` 字段**：设计第 9 条说"不提供手写寓意的框"，勾选的关键词以「、」连接存入 `meaning`（保存时后端照旧过禁用词表）。老数据里手写的寓意句子拆词后只有本来就是知识库关键词的才预勾选；不全是关键词的老句显示黄条提示"保存后会换成勾选的词"，避免无声覆盖。`tags` 字段仍是原来的展示标签，与寓意无关。
- **配方里的珠子没有 kb 关联时**：关键词区显示空态"还没有可用的知识库寓意关键词"；保存时若一个关键词也没勾到，保留原 meaning 不乱清。

## 没做 / 已知边界

- 下架珠子提示只做了代码路径验证（当前本地数据没有下架珠子，没造数据）；逻辑就是 `bead.onSale === false` 过滤。
- 拖拽排序在无头浏览器里没法模拟，验证过的是添加/移除/排序的数据流（同一 splice 逻辑）。
- 珠子 chip 的颜色点：`/api/admin/beads` 不带 `color` 字段，显示默认灰色，不影响功能。

## 验证

- `npm run build`（admin-web）通过；产物不提交，`server/static/admin/` 已还原。
- 真机（本地服务 127.0.0.1:8800，ADMIN_TOKEN=dev-local-admin）浏览器 DOM 验证：6 个模板列表、13–19cm 七行数字全部来自 expand、关键词勾选/取消/已选回显、老寓意提示条均正常。
- 三条全量测试：后端 `Ran 346 tests OK (skipped=7)`（比老基线 335 多 11 是 integration 上 D4 等已合并卡新增的用例）；小程序 `node --test` fail 0；`python3 kb/validate.py` 已填 200/200、问题 0。
