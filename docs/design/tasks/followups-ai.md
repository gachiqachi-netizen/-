# AI 两张卡（2026-11-20 负责人：拍照做同款识别差；对话推荐要支持图片）

前提：服务器 `app.env` 配好 `AI_PROVIDER=openai`、文字模型 `qwen-plus`、看图模型 `qwen3-vl-plus`（负责人做，密钥不进仓库、不发给执行者）。两张卡都改 `server/ai/__init__.py` 和 `server/app.py` 的 `ai_route`，**不能同时做**：先 AI-2，再 AI-1。

本地开发没有真实模型：用 `server/ai/` 现有的假 provider 方式（看 `server/tests/test_ai_photo.py`、`test_ai_settings.py` 怎么替换 provider）写测试；不要接真实服务，不要写任何 Key。

---

## AI-2 拍照做同款：两步识别 + 每种珠子 3 个候选（2026-11-20）

- **依赖**：无　**大小**：L　**只能改**：`server/ai/__init__.py`（`photo()`、`PHOTO_SCHEMA` 及新增的匹配函数）、新建 `server/photo_match.py`（纯函数）、`server/app.py`（只改 `ai_route` 里 `/api/ai/photo` 的返回）、`miniprogram/pages/photo/photo.{js,wxml,wxss}`、`server/tests/`、`miniprogram/tests/` 对应测试
- **现状**（审核核对过）：
  - 服务器没配 AI 时，体验版走 `fallback`（前台本机取色），效果最差——配置是负责人的事，本卡不管。
  - 配了 AI 时，`ai.photo(beads, image)` 把整份在售目录用 `catalog_text()` 写成文字（只有 `id|名称尺寸|材质|类型|单价|寓意`，**没有颜色**）发给看图模型，让它直接挑 `main / accent / metal` 三个 id 和 `every`。380 种珠子只能靠名字猜颜色，所以常认错；也不认尺寸、佛头/吊坠、对称排法；前台拿到结果直接排，用户不能改。
  - 珠子已有颜色值 `c`（H6 从照片取的两个色，如 `["#e8b4bc","#c47a88"]`）、`mat`、`mm`、`spacer`。
- **要做的**：
  1. **第一步：让模型只“描述”，不挑 id**。新 `PHOTO_SCHEMA`：
     ```
     ok, reason（同现在）, seen（15–30 字）,
     kinds: [ { role: main|accent|metal|center|pendant, color: "#rrggbb", colorName: 中文颜色,
                clarity: clear|translucent|opaque, pattern: plain|cracked|striped|speckled|banded|metallic,
                material: crystal|stone|wood|bodhi|metal|other, mmGuess: 4–20 的数字或 null,
                count: 大约颗数, confidence: 0–1 } ]   最多 6 种
     layout: { symmetric: bool, every: 2–6 或 null, sequence: [role…] 最多 30 个，按 12 点钟顺时针 }
     ```
     提示词里**不再附目录**（省钱、也不让它乱挑）。
  2. **第二步：程序匹配**（`server/photo_match.py`，纯函数，可测）：对每个 kind，在在售珠子里打分取前 3：
     - 颜色：把 `color` 和珠子 `c[0]`、`c[1]` 转 Lab，取较近的那个算 ΔE（越小越好，权重最大）；
     - 材质：`material` 和 `mat` 一致加分；`metal` 只在金属配件里找，其余不在金属里找；
     - 尺寸：有 `mmGuess` 时，同名珠子优先选最接近的尺寸；
     - 透明度/纹路：能从珠子 `name` 关键词判断的（如“发晶”“虎眼”“冰”“荔枝冻”）作弱加分，判断不了就不加；
     - 返回每个 kind 的 `candidates: [{id, score}] × 3`，分数归一到 0–1。
     打分权重写成常量放文件顶部，测试里覆盖。
  3. **返回给前台**：`{ok, seen, kinds:[{role, colorName, mmGuess, count, candidates:[…]}], layout, by}`；兼容字段 `main/accent/metal/every` 继续给（取各 role 的第一个候选），旧前台不坏。
  4. **结果页**（`pages/photo`）：照片缩略图下列出识别到的每种珠子一行：角色（主珠 / 配珠 / 金属 / 佛头 / 吊坠）、AI 看到的颜色名、3 个候选珠子（实拍图 + 名字 + 尺寸），默认选第一个，点别的就换；下面“按 15cm 排一条”主按钮，按 `layout`（顺序、对称、间隔）和手围排出手串进工作台。排法规则：有 `sequence` 时按它循环到手围长度；`symmetric` 时以 `center` 为中心左右对称；都没有时用 `every`。
  5. 识别失败（`ok=false`）的提示保持现状；某个 kind 一个候选都没有（分数都低于阈值），这一行显示“没找到像的，点这里自己挑”，点了进工作台对应分类。
- **测试**：Lab ΔE 计算（几组已知颜色）；匹配排序（同色不同材质、金属只在金属里找、尺寸就近）；模型返回缺字段/越界时的清洗；`sequence`/`symmetric`/`every` 三种排法按 15cm 排出的颗数和顺序；旧字段兼容。
- **截图**：开发者工具里用假 provider 返回一组固定结果，截结果页（含切换候选后）和排好进工作台的样子，放 `docs/reports/AI-2-assets/`。
- **不做**：接真实模型；改工作台；改识别失败的文案。
- **负责人要做**：配好看图模型后，用 5 张真实手串照片在体验版试，把结果截图发审核，用来调权重。

## AI-1 AI 配：对话里可以发图片（2026-11-20，负责人要求本周修好，拆成两张）

**接口约定（两张卡都按这个来，先定好，前后端可以同时做）**：
- 请求 `POST /api/ai/design` 现有字段不变，新增可选 `image`：data URL（`data:image/jpeg;base64,…`），格式和 `/api/ai/photo` 一样；
- 响应现有字段不变，新增可选 `seen`：一句话（≤40 字），只有带图时才有；
- 没配看图模型时：HTTP 400，`{"error": "暂时只能看文字，请去掉图片再发", "code": "vision_unavailable"}`。

### AI-1a 后端：对话接口收图片

- **依赖**：AI-2（同改 `server/ai/__init__.py`、`app.py`）　**大小**：S　**只能改**：`server/ai/__init__.py`（只改 `design()`，加可选 `image`）、`server/app.py`（只改 `ai_route` 里 `/api/ai/design` 读图和上面的错误）、`server/tests/` 对应测试
- **现状**（审核核对过）：`ai_route` 只在 `/api/ai/photo` 时 `image_part(data.get("image"))`；`ai.design(beads, text, history, wrist)` 不收图；`openai_compat` 的 `json(..., image=)` 已支持带图时自动换 `vision_model`。
- **要做的**：
  1. `/api/ai/design` 也读 `image`（复用 `image_part`，大小、格式校验沿用）。
  2. `ai.design(..., image=None)`：有图时提示词加一段——“先用一句话说你从图里看到的颜色和感觉（如‘看到的颜色：浅蓝、米白；感觉：清冷’），再按这个感觉配一条新的，不是还原图里的手串”；`DESIGN` 的 schema 加 `seen`；回复里 `seen` 过 `content_security.allowed`。
  3. 没配看图模型：按接口约定返回 400 + `vision_unavailable`，不要 502。
  4. 服务器不保存图片；AI 日志（`_log_design`）只记“带图: 是/否”，不记图片内容。
- **测试**：带图走看图模型、不带图走文字模型（用假 provider 记下被调用时的参数）；没配看图模型时 400；日志里没有 base64；`seen` 过内容安全。
- **不做**：前台；语音；多张图。

### AI-1b 前台：输入区“+”发图、气泡显示图片和“看到了什么”

- **依赖**：无（按上面的接口约定做，后端没合并前用假数据测）　**大小**：M　**只能改**：`miniprogram/pages/ai/ai.{js,wxml,wxss,json}`、`miniprogram/tests/` 对应测试
- **现状**（审核核对过）：AI 配页面只有文字输入（`submit`），没有发图入口。设计规范 08 第 3 节：输入区是一个大圆角框，上面一整行输入框，下面一排小按钮在框内，左边“+”（拍照、相册），右边语音（没有识别服务前隐藏）。压缩已有 `pages/photo/compress.js` 的 `prepare`（长边 1024、≤1MB）。
- **要做的**：
  1. 输入区按 08 规范：框内下排左边“+”（`assets/icons/plus.svg`），点了 `wx.chooseMedia`（拍照或相册，单张）；选好后输入框上方出现一个 64rpx 小缩略图，右上角 ×（`assets/icons/close.svg`）去掉。
  2. 发送：有图就用 `prepare` 压缩、转 data URL 放进 `image`；只发图不写字时，文字默认“照这张图的感觉配一条”。
  3. 对话里：用户气泡里显示那张小图（点开 `wx.previewImage`）；AI 回复有 `seen` 时在第一行显示，下面照旧是推荐卡片。
  4. 收到 `vision_unavailable`：提示“暂时只能看文字”，图片保留在输入区，用户可以 × 掉再发；文字不丢。
  5. 第一次点“+”时弹一句：“图片会发给 AI 服务识别颜色和风格，不会公开，也不会保存”，[知道了]；确认后存本地不再弹。
  6. 输入区上方加一行文字链接：“想做一模一样的？去拍照做同款 ›”，跳 `pages/photo/photo`。
- **测试**：选图后缩略图出现、× 能去掉；只发图时用默认文字；请求体带 `image`；`seen` 显示；`vision_unavailable` 时图片和文字都保留；隐私说明只弹一次。
- **截图**：开发者工具（假数据）：选图后的输入区、带图的一轮对话（含 `seen`）、隐私说明，放 `docs/reports/AI-1b-assets/`。
- **不做**：语音；多张图；后端。
