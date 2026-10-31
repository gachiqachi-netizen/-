# 串个珠 · 本地服务

前台（小程序原型）+ 网页后台 + 接口 + AI，一个命令启动，只用 Python 自带的库。

```bash
python3 server/app.py
```

- 前台：http://127.0.0.1:8800/ （用浏览器手机模式看）
- 后台：http://127.0.0.1:8800/admin

数据存在 `server/data.sqlite3`，上传的图片在 `server/uploads/`。删掉这两个就回到初始示例数据。

## 后台能做什么

| 页签 | 内容 |
|---|---|
| 珠子 | 上架 / 编辑 / 下架 / 删除。尺寸和单价必填。上传白底实拍图后自动取色；花纹特殊的珠子可另传纹理图给 3D 用。 |
| 模板 | 用“开头珠 / 循环花型 / 结尾珠”三排积木搭热门款，右侧实时预览 15cm 手围的颗数和价格。可传成品实拍封面。 |
| 宣传位 | 角标、标题、说明、点击去哪（某个模板 / 自己串 / AI 配）、是否只给新人看。 |
| 订单 | 前台下的单都在这里，看手串明细、尺寸、金额、收货信息，改状态（待串制 → 串制中 → 已发货 → 已完成）。 |

改完前台刷新就生效。下架的珠子会让用到它的模板、宣传位自动隐藏。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/catalog` | 前台用：在售珠子、模板、宣传位、AI 状态 |
| POST | `/api/orders` | 前台下单，价格由服务端重新计算 |
| POST | `/api/ai/design` | AI 配：心愿 + 对话记录 → 3 条候选 |
| POST | `/api/ai/photo` | 拍照做同款：照片 → 认出主珠 / 配珠 / 金属点缀各是哪颗（只认不设计） |
| POST | `/api/ai/review` | AI 帮你看看：肯定 + 寓意 + 最多 2 条可一键采纳的建议 |
| GET/POST/PUT/DELETE | `/api/admin/{beads,templates,banners}` | 后台增删改 |
| GET / PUT | `/api/admin/orders` | 后台看订单、改状态 |
| POST | `/api/upload` | 后台上传图片 |

设置环境变量 `ADMIN_TOKEN=口令` 后，后台接口需要口令。

## 接 AI

不配置时，AI 接口返回 503，前台自动用本地规则（关键词配珠、照片取色匹配），流程照样能走通。

**国内上线（推荐）**：用已备案的国内模型，走兼容 OpenAI 的接口：

```bash
AI_PROVIDER=openai \
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 \
AI_API_KEY=你的Key \
AI_MODEL=qwen-plus \
AI_VISION_MODEL=qwen-vl-plus \
python3 server/app.py
```

`AI_VISION_MODEL` 是拍照做同款用的看图模型，不填则拍照功能退回本地取色。

**Claude（海外部署或内部测试）**：需要 Python 3.10+ 和 `pip install anthropic`：

```bash
AI_PROVIDER=claude ANTHROPIC_API_KEY=你的Key python3 server/app.py
```

默认模型 `claude-opus-5-5`，可用 `CLAUDE_MODEL` 改。

AI 只负责挑珠子、起名字、写寓意；珠子 id 不在在售目录里的结果会被丢掉，颗数、长度、价格都由代码按手围计算。输出会过一遍广告法敏感词（`ai/__init__.py` 里的 `BANNED`）。正式上线还要接微信内容安全接口 `msgSecCheck`。

## 正式版要换掉的部分

- 数据库：SQLite → 小程序云开发数据库（`db.py` 的四个方法对应改写）。
- 图片：本地文件夹 → 云存储 + CDN 缩略图。
- 后台登录：现在只有一个口令，正式版需要账号和权限。
- 前台：原型页面 → 微信小程序代码，接口不变。
