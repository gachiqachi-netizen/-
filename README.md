# 串个珠

自己设计手串、再下单买回家的原生微信小程序。仓库包含原生小程序、网页管理后台、业务接口、AI 适配层和珠子知识库；`prototype.html` 仅作为交互参考，不是正式客户端。

## 运行

```bash
PORT=8801 ADMIN_TOKEN=local-dev-only DEV_LOGIN=1 python3 server/app.py
```

- 小程序：用微信开发者工具导入 `miniprogram/`
- 后台：http://127.0.0.1:8801/admin
- 目录接口：http://127.0.0.1:8801/api/catalog

默认 SQLite 运行只用 Python 自带库。第一次启动会用示例数据建库（`server/data.sqlite3`，不进 git）。`ADMIN_TOKEN` 必填；`DEV_LOGIN=1` 仅供本地开发。接 AI 模型的方法见 [server/README.md](server/README.md)。

## 目录

| 路径 | 内容 |
|---|---|
| `prototype.html` | 小程序原型：首页、自己串、AI 配、拍照做同款、3D 试戴、下单 |
| `server/` | 本地服务：接口、网页后台、方案匹配（`plans.py`）、知识库读取（`kb.py`）、AI（`ai/`） |
| `kb/` | 珠子知识库：格式说明 `SCHEMA.md`，数据在 `kb/data/` |
| `kb/data/beads/` | 200 种珠子：怎么认、易混、品质维度、品级、合规、寓意 |
| `kb/data/attributes.json` | 属性词典：12 个维度、商家叫法对照、禁用词 |
| `kb/data/rules.json` | 串法：颗数说法（带出处）、结构、尺寸规则、搭配禁忌 |
| `kb/data/plans/` | 100 条现成搭配方案，AI 配先查这里再按手围和预算微调 |
| `kb/data/review/` | 独立审校的打分和意见 |
| `kb/market/` | 市场调研：商家怎么写卖点、建 SPU、分 SKU |
| `miniprogram/` | 原生微信小程序；开发、体验、正式环境分别配置接口地址 |

改了 `kb/taxonomy.txt` 后运行 `python3 kb/build.py`；改了珠子数据后运行 `python3 kb/validate.py` 检查格式。
