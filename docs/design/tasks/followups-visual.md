# 手串图统一 V1–V5（2026-11-16，负责人定方案）

> **一句话**：**一颗珠子拍一张照片，上架时传一次；之后所有地方的手串都由这些单珠照片按同一套算法拼出来。** 商品列表、选珠格子、模板、首页款式、工作台、详情、确认订单、订单、工单、售后、分享，用的都是同一张单珠照片、同一个拼法，所以处处一致。
>
> **目标**：从选模板、工作台、订单、做单、售后到分享，看到的都是**同一张手串图**。做法：每种珠子一张照片（没有照片的用颜色画），用**同一个排布算法**拼成手串；1 号珠在正上方、顺时针，和工单的“从 1 开始穿”一一对应。3D 只留在“试戴”和落地页的“转一转”里。质检时再拍一张成品实拍图做补充。
> 共同规矩：照 `02-prompts.md` 总提示词；金额整数分；尺寸规则不动；测试放 `server/tests/`、`miniprogram/tests/`；小程序页面卡照 `followups-ui.md` 开头的规矩（U0 组件、`check-ui.py`、截图）；后台卡 `npm run build` 能过、打包文件不提交。

## V1 订单和分享快照存下珠子的样子（后端）

- **依赖**：无　**只能改**：`server/commerce.py` 的 `build_design_snapshot`（冻结每颗珠子的字段）、`server/user_api.py` 的 `create_share` / `read_share`、新建 `server/bead_visual.py`、`server/tests/test_bead_visual.py`；契约若要加字段说明，可改 `server/contract.py` 并跑导出脚本
1. `bead_visual.visual_of(bead)` 返回 `{id, name, mm, spacer, mat, colors: [主色, 高光色], photo}`：`colors` 取商品现有颜色字段（`c`），`photo` 取商品照片地址；缺的给 `None`。
2. 下单时订单快照的每颗珠子都带上这一组字段（已有的字段不删）；创建分享时，分享记录里多存一个 `visual: [...]`（按珠序）。之后商品改颜色、换照片、下架，旧订单和旧分享的样子都不变。
3. 读老订单、老分享（没有这些字段）时，按当前商品补上；商品也找不到了就给灰色占位。
4. 测试：下单后改商品颜色，订单快照里的颜色不变；老订单能补出字段；分享读取返回 `visual`。

## V2 统一排布算法（小程序和后台各一份，共用测试数据）

- **依赖**：无　**只能改**：新建 `miniprogram/utils/bracelet-layout.js`、`admin-web/src/bracelet/layout.ts`、`server/tests/fixtures/bracelet_layout_cases.json`、`miniprogram/tests/bracelet-layout-shared.test.js`；后台没有测试框架的话，用 node 直接跑 `layout.ts` 编译后的结果对照同一份用例（写进 `admin-web/scripts/` 的一个小脚本，`npm run check:layout`）
1. `layout(sequence, size)`：输入按珠序的珠子（带 `mm`、`spacer`、`colors`、`photo`），容器边长 `size`；输出每颗的 `{index(从 1 开始), x, y, r, rotate, photo, colors}`。规则：1 号珠在正上方、顺时针；按每颗的 `mm` 分配圆周长度（隔珠小、主珠大）；整串一定落在容器内；颗数 1–80 都要能排。
2. 共用用例：10 组（不同颗数、尺寸混排、含隔珠、只有 1 颗、80 颗），小程序和后台两边算出来的结果误差在 0.5px 以内。
3. 不改任何页面（页面在 V3、V4 里换）。

## V2b 排布改成“珠子相切、圆心在同一条线上”（2026-11-16 负责人发现）

- **依赖**：V2　**只能改**：`miniprogram/utils/bracelet-layout.js`、`admin-web/src/bracelet/layout.ts`、`server/tests/fixtures/bracelet_layout_cases.json`、`miniprogram/tests/bracelet-layout-shared.test.js`、`admin-web/scripts/check-layout.cjs`
- **问题**：手串是平放俯视的，所有珠子都穿在同一根线上，应该在同一个平面。现在小隔珠看起来一颗压在大珠前面、一颗躲在后面，因为圆心位置是按弧长平均分的，大小珠混排时相邻两颗会互相重叠，谁画在后面谁就被盖住。
- **要求**：
  1. 所有珠子的圆心都在同一个圆上（这个圆就是穿绳）。
  2. 相邻两颗**正好相切、不重叠**：第 i 颗和第 i+1 颗圆心之间的直线距离 = 两颗半径之和。用弦长求圆的半径：找出 R，使所有相邻两颗对应的圆心角 `2·asin((rᵢ+rᵢ₊₁)/(2R))` 加起来等于 360°（二分法或牛顿法迭代，精度 0.01px），首尾也相切。
  3. 珠子太少（比如 1–3 颗）围不成圈时，按现在的方式排、不报错。
  4. 1 号珠仍在正上方，顺时针；整串仍然完整落在容器内（先算出 R，再整体缩放到容器里）。
- **测试**：共用用例里加 3 组大小珠混排（10mm 主珠配 4mm 隔珠、12mm 配 6mm、单颗大佛头配一圈 8mm），断言：所有圆心到中心的距离相等；任意相邻两颗圆心距离 = 半径之和（误差 0.5px）；任意两颗不重叠。小程序和后台两边结果一致。
- 截图：工作台和后台工单页各一张同一条大小珠混排的手串。

## V3 小程序全部换成统一的图

- **依赖**：V1、V2、U9、U13　**只能改**：`miniprogram/components/bracelet/*`、`components/bracelet-thumb/*`、`components/bead/*`（单颗珠子也用同一张照片：选珠格子、已选珠子、每一颗的寓意列表），`pages/share/*`（海报用同一套排布画到画布上，珠子照片先 `wx.getImageInfo` 下到本地再画）、`features/shared/*`（默认显示统一的 2D 图，旁边“转一转”按钮切到 3D）；其他页面不用改——它们都用这两个组件
1. 有照片的珠子用照片（圆形裁切、按 `rotate` 转）。**按显示大小取对应尺寸**（V5 已经存好三份）：选珠格子、缩略图、订单列表用 `photoSm`（96），工作台和详情的手串图用 `photoMd`（240），单颗大图用 `photo`（480）；没有小尺寸的退回用 `photo`。列表、格子里的 `<image>` 加 `lazy-load`。没有的用 `colors` 画渐变加高光，和现在的画法一致。
2. 订单、售后、分享里的图一律用快照里的 `visual`（V1），不读当前商品。
3. 确认订单和订单详情的“材料”展开后，按种列出：珠子照片、名称、珠径、单价、颗数，和工单的领料清单一致；这一处改 `pages/order/*` 和 `features/order-detail/*` 里“材料”那一块，可以改。
4. 截图：首页款式、选珠格子、工作台、手串详情、确认订单、订单详情、我的订单、售后详情、分享海报、好友落地页，同一条手串八张图摆在一起，报告里写“是否完全一致”。

## V4 后台全部换成统一的图

- **依赖**：V1、V2　**只能改**：新建 `admin-web/src/bracelet/Bracelet.tsx`（用 `layout.ts` 画 SVG，珠子上可选显示编号），`src/pages/workOrders/detail.tsx`、`src/components/OrdersView.tsx` 的手串那一块、`src/pages/afterSales/detail.tsx` 的订单那一块
1. 商品列表、模板编辑里的珠子和手串预览，也换成同一张单珠照片和同一个拼法（可以改 `src/pages/products.tsx`、`src/pages/templates/` 里显示珠子和手串的那一块）。
2. 工单页：大图，每颗珠子标编号，和下面“按顺序穿”的编号一致；师傅照图穿。
3. 订单详情、售后详情：小图，不标编号。
4. 用快照里的 `visual`，不读当前商品。

## V5 后台珠子照片上传和质检实拍图

- **依赖**：V2　**只能改**：后端新建 `server/routes/bead_photos.py`、`server/tests/test_bead_photos.py`；后台 `src/pages/products/` 下新建 `beadPhoto.tsx` 并挂到商品编辑抽屉；`src/pages/workOrders/detail.tsx` 加质检实拍图（**和 V4 改同一个文件，V4 合并后再做这一部分**，或者整张卡排在 V4 后面）
1. 珠子照片：**按料上传，一次生效到同名的所有尺寸**（同一个 `name` 的 6mm、8mm、10mm 共用一张）。收 PNG 或 JPG：正方形、800×800 以上；透明底或白底都收（白底时检查四角接近白色），珠子居中占满画面；不合格返回 400 并写清原因。存进这一组商品的 `photo`，权限 `edit_products`，记操作记录。拼手串时一律裁成圆形，所以白底不影响效果。
2. 上传后当场用这张照片和 `layout.ts` 拼一圈 16 颗的手串预览，旁边并排一张用另一种已有照片的珠子拼的，方便对比亮度、光线。
3. 抽屉里放一段拍摄规范：每种料挑一颗品相有代表性的、俯拍、白色或单色背景；用 AI 去杂物、居中、珠子占满、光从左上、统一亮度，导出白底或透明底的正方形图。同料不同尺寸共用一张。后台商品列表里没传照片的料标一个“缺照片”，方便补齐。
4. 质检实拍图：工单质检区加“上传成品照”（用 B-1 的上传接口），存进工单；订单详情（后台）和售后详情显示；小程序订单详情发货后显示“实拍图”（这一处小程序改动另开小卡，本卡只做后台和后端）。
