# 知识库格式（第 1 步：珠子表 + 属性词典）

所有数据放在 `kb/data/`，UTF-8 JSON。程序只认这里写的字段；没把握的字段留空（`""` 或 `[]`），不要硬编。

## 通用规则

- **只讲寓意，不讲功效。** 不写“招财、转运、辟邪、能量、净化、消磁、开光、加持、护身、安神、助眠、治疗、保佑、旺”等承诺效果的词。寓意写成文化说法：“南红色如赤玉，传统上寓意红火吉祥”。
- **每条记录带来源**：`sources` 列出用过的出处（URL 或“GB/T 16552-2017”“市场调研 kb/market/…”这类说明）。凭常识写的写 `"常识"`，并把对应字段的把握标成“中”或“低”。
- **把握** `confidence`：`high`＝有权威出处直接支持；`mid`＝业内共识或间接出处；`low`＝没找到出处。`low` 的字段不会给用户看。
- 文字用简体中文，短句，口语但不浮夸。

## 1. 珠子表 `kb/data/beads/<大类id>.json`

一个文件一个大类，内容是数组，一个品种一条。`id`、`name`、`std`、`category` 以 `kb/taxonomy.json` 为准，不能改。

```json
{
  "id": "nanhong",
  "name": "南红",
  "std": "南红玛瑙",
  "category": "agate",
  "aliases": ["南红玛瑙", "赤玉"],
  "summary": "一句话说它是什么（20–40 字）",
  "look": "长什么样：颜色、透明度、光泽、纹理、手感（40–80 字），给识别用",
  "identify": ["看得见的识别特征，每条一句，2–5 条"],
  "confusables": [{"id": "taxonomy 里的品种 id，没有就留空", "name": "易混的东西", "how": "怎么区分，一句"}],
  "dims": {
    "color": ["柿子红", "锦红"],
    "clarity": ["满肉", "冰飘"],
    "pattern": ["火焰纹"],
    "origin": ["保山", "凉山"]
  },
  "grades": [
    {"level": 1, "label": "满肉满色", "desc": "看得见的标准，一句"},
    {"level": 2, "label": "少纹少飘", "desc": "…"},
    {"level": 3, "label": "有纹有飘", "desc": "…"}
  ],
  "sizes": {"common": [6, 8, 10, 12], "note": "常见珠径 mm；特殊尺寸写法（如星月的直径×高）写在 note"},
  "treatments": [{"type": "注胶", "note": "常见程度和怎么看出来"}],
  "compliance": {"level": "none", "note": ""},
  "meaning": {"tags": ["红火", "吉祥"], "text": "寓意，文化说法，30–60 字，不承诺效果"},
  "story": "典故或来历，40–100 字，有出处才写，没有留空",
  "care": "保养一句，可空",
  "price_band": "常见价位档：低 / 中 / 高 / 很高，可空",
  "sources": ["…"],
  "confidence": {"look": "high", "identify": "mid", "meaning": "mid", "story": "low"}
}
```

字段说明：

- `dims`：这个品种**适用**的属性维度，以及每个维度下这个品种特有的取值。键只能用下面属性词典里的维度 key。取值优先用市场上的真实叫法（见 `kb/market/`）。
- `grades`：用看得见的特征分 2–4 档，`level` 越小越好。不要用“AAA、7A”这类 A 数。没有品级概念的（如金属配件）留空数组。
- `compliance.level`：`none` / `restricted`（受保护或需合法来源，taxonomy 标了“合规”的）/ `banned`（禁售大类）。`note` 写清依据。
- `meaning.tags`：2–4 个短词，从属性词典的 `meaning_tags` 里选，没有合适的可以新增但要是寓意词不是功效词。
- `safety`：可选。有毒或不宜贴身的材质写 `{"level": "toxic", "note": "…"}`，和 `compliance`（受保护、需合法来源）分开。
- `status`：可选。原植物或材料来源查不清的条目设为 `"draft"`，只给名称、提示和合规，寓意和讲解不展示给用户，也不给 AI 用。
- `combo`（组合款式）和 `banned`（禁售）大类也要填，`banned` 只填 `summary`、`look`、`identify`、`confusables`、`compliance`，不写寓意。

## 2. 属性词典 `kb/data/attributes.json`

```json
{
  "dims": [
    {"key": "color", "name": "颜色", "desc": "…", "values": ["通用取值…"]}
  ],
  "grade_families": [
    {"family": "crystal", "applies": ["crystal", "feldspar", "colored"], "levels": ["净体", "微棉", "有棉有裂"], "desc": "…"}
  ],
  "meaning_tags": ["平安", "红火", "…"],
  "terms": [
    {"term": "马粉", "dim": "origin", "value": "马达加斯加", "beads": ["fen-jing"], "note": "", "source": "市场调研"}
  ],
  "banned": [
    {"word": "招财", "type": "功效", "instead": "寓意财源广进（文化说法）"}
  ]
}
```

维度 key 固定为下面 12 个，不增不减：

| key | 名称 | 说明 |
|---|---|---|
| `color` | 颜色 | 颜色和深浅：柿子红、浓粉、乌金… |
| `clarity` | 种水 / 透明度 | 透明、冰透、半透、微透、不透；满肉、冰飘、果冻… |
| `purity` | 净度 | 净体、微棉、有棉、有裂… |
| `effect` | 光学效应 | 星光、猫眼、月光、晕彩、彩虹眼、砂金、变彩… |
| `pattern` | 纹理图案 | 金星、牛毛纹、水波、火焰纹、缠丝、水草、开片… |
| `inclusion` | 内含物 | 发丝、兔毛、幽灵、草莓点、包裹体… |
| `texture` | 料性 / 密度 | 高密、油性、满金星、玉化、瓷度… |
| `origin` | 产地 / 矿口 / 籽种 | 保山、马达加斯加、海南、印度… |
| `age` | 新老 / 盘玩状态 | 新料、老料、陈籽、包浆、玩透… |
| `shape` | 珠形 | 圆珠、桶珠、老型珠、算盘珠、切面、随形、苹果圆、扁珠… |
| `treatment` | 处理 | 天然、加热、染色、注胶、充填、压制、合成、脱脂… |
| `count` | 颗数形态 | 单圈、多圈、108 颗、18 颗… |

尺寸（珠径、直径×高）是数字，不进词典，由商品自己填。

`terms` 至少收：`kb/market/crystals.md`、`kb/market/wenwan.md` 里卖点词表的非功效词，以及国内平台的说法（马粉、马岛粉、老矿、果冻粉、乌金、彩眼、双金眼、矿心、原生态、原籽、山椒红、满金星等）。`banned` 至少收市场调研里列为“寓意功效（禁用）”的全部词。

## 3. 串法表 `kb/data/rules.json`（第 2 步）

```json
{
  "counts": [
    {"count": 108, "name": "一百零八颗", "form": "念珠，多圈绕腕或挂颈", "meaning": "文化说法，30–60 字，不承诺效果", "source": "出处（经名、书名或 URL）", "confidence": "high"}
  ],
  "structures": [
    {"id": "fotou", "name": "佛头三通", "desc": "是什么、长什么样", "how": "怎么用：放几颗、放在哪", "fits": ["念珠", "手串"], "source": "…", "confidence": "mid"}
  ],
  "sizing": [
    {"id": "margin", "rule": "规则一句", "detail": "怎么算、举例", "source": "…", "confidence": "mid"}
  ],
  "taboos": [
    {"id": "hardness", "rule": "搭配禁忌一句", "why": "原因", "source": "…", "confidence": "mid"}
  ]
}
```

- `counts` 只收有出处的说法（佛教念珠、传统朝珠、民俗），出处写不出来的不收。只讲来历和象征，不写“戴了会怎样”。
- 程序里的尺寸算法：总长 = 手围 ×10 + 余量（mm），余量 = max(8, 2.5 × 主珠直径 − 5)；长度在目标 −4 到 +6mm 之间算合适。`sizing` 要和这个一致，可以补充说明。

## 4. 方案表 `kb/data/plans/<分组>.json`（第 2 步）

一个文件一组，数组，一条一个现成搭配。配方写**品种和属性**，不写具体商品，程序按料包里在卖的珠子去配。

```json
{
  "id": "gift-bf-calm-01",
  "name": "4–8 字的名字",
  "audience": ["男友"],
  "occasion": ["生日", "日常"],
  "meaning": ["沉稳", "坚定"],
  "style": ["简约"],
  "gender": "male",
  "budget": "mid",
  "special": [{"kb": "nanhong", "mm": 12, "role": "佛头"}],
  "pattern": [{"kb": "xiaoye-zitan", "mm": 10, "role": "主珠", "attrs": {"origin": "印度"}}],
  "tail": [],
  "substitutes": {"nanhong": ["zhanguo-hong"], "xiaoye-zitan": ["heitan"]},
  "story": "讲解 60–120 字：为什么这么配、每种珠子的寓意（文化说法）、适合谁",
  "tips": "一句送礼或佩戴建议，可空",
  "sources": ["…"],
  "confidence": {"story": "mid"}
}
```

- `special` 开头只出现一次的珠子（佛头、主题珠，0–2 颗）；`pattern` 循环花型（1–8 颗），程序按手围重复铺满；`tail` 结尾珠（0–2 颗）。和小程序现有模板格式一致。
- 每个槽位：`kb` 必须是 `kb/data/beads/` 里的品种 id，且该品种不能是 `status: draft`、不能有 `safety`、`compliance.level` 不能是 `banned`；尽量不用 `restricted`（真用了，必须在 `substitutes` 里给非受限的替代）。`mm` 用该品种 `sizes.common` 里的尺寸。`attrs` 可选，键只能是 12 个维度 key，值用该品种 `dims` 里的取值。`role` 取：主珠 / 配珠 / 隔珠 / 隔片 / 佛头 / 点缀。
- 同一个方案里主珠直径统一；隔珠、隔片用金属配件（`gezhu`、`zhuanyun`）或小尺寸珠。
- `substitutes`：配方里每个非金属品种至少给 1 个替代（颜色和寓意接近、更常见或更便宜），程序在料包缺货或超预算时用。
- 标签取值固定（多选的给 1–3 个）：
  - `audience`：自己（女）/ 自己（男）/ 女友 / 男友 / 老婆 / 老公 / 闺蜜 / 兄弟 / 妈妈 / 爸爸 / 长辈 / 孩子 / 学生 / 同事 / 领导 / 情侣
  - `occasion`：日常 / 生日 / 纪念日 / 情人节 / 七夕 / 新年 / 本命年 / 考试 / 毕业 / 升职 / 新工作 / 出行 / 新婚 / 乔迁 / 母亲节 / 父亲节 / 教师节 / 康复
  - `meaning`：只用 `attributes.json` 的 `meaning_tags`
  - `style`：简约 / 多宝 / 文玩 / 新中式 / 少女 / 复古 / 轻奢 / 清冷 / 森系
  - `gender`：female / male / any
  - `budget`（15cm 手围整串含手工费 ¥15 的大致价位）：low（≤¥100）/ mid（¥100–300）/ high（>¥300）
- `story` 严禁功效词（见第 1 节），寓意写成文化说法，例如“小叶紫檀色深沉稳，常被视为木中上品”。
