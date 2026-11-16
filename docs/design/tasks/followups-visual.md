# 手串图统一 V1–V5（2026-11-16，负责人定方案）

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

## V3 小程序全部换成统一的图

- **依赖**：V1、V2、U9、U13　**只能改**：`miniprogram/components/bracelet/*`、`components/bracelet-thumb/*`（改成内部都调 `bracelet-layout.js`），`pages/share/*`（海报用同一套排布画到画布上，珠子照片先 `wx.getImageInfo` 下到本地再画）、`features/shared/*`（默认显示统一的 2D 图，旁边“转一转”按钮切到 3D）；其他页面不用改——它们都用这两个组件
1. 有照片的珠子用照片（圆形裁切、按 `rotate` 转），没有的用 `colors` 画渐变加高光，和现在的画法一致。
2. 订单、售后、分享里的图一律用快照里的 `visual`（V1），不读当前商品。
3. 截图：工作台、手串详情、确认订单、订单详情、我的订单、售后详情、分享海报、好友落地页，同一条手串八张图摆在一起，报告里写“是否完全一致”。

## V4 后台全部换成统一的图

- **依赖**：V1、V2　**只能改**：新建 `admin-web/src/bracelet/Bracelet.tsx`（用 `layout.ts` 画 SVG，珠子上可选显示编号），`src/pages/workOrders/detail.tsx`、`src/components/OrdersView.tsx` 的手串那一块、`src/pages/afterSales/detail.tsx` 的订单那一块
1. 工单页：大图，每颗珠子标编号，和下面“按顺序穿”的编号一致；师傅照图穿。
2. 订单详情、售后详情：小图，不标编号。
3. 用快照里的 `visual`，不读当前商品。

## V5 后台珠子照片上传和质检实拍图

- **依赖**：V2　**只能改**：后端新建 `server/routes/bead_photos.py`、`server/tests/test_bead_photos.py`；后台 `src/pages/products/` 下新建 `beadPhoto.tsx` 并挂到商品编辑抽屉；`src/pages/workOrders/detail.tsx` 加质检实拍图（**和 V4 改同一个文件，V4 合并后再做这一部分**，或者整张卡排在 V4 后面）
1. 珠子照片：上传 PNG，后端检查 800×800 以上、正方形、有透明背景（四个角是透明的），不合格返回 400 并写清原因；存进商品的 `photo`，权限 `edit_products`，记操作记录。
2. 上传后当场用这张照片和 `layout.ts` 拼一圈 16 颗的手串预览，旁边并排一张用另一种已有照片的珠子拼的，方便对比亮度、光线。
3. 抽屉里放一段拍摄规范：每种料挑一颗、俯拍、单色背景；用 AI 抠图、居中、珠子占九成、光从左上、统一亮度后导出透明底 PNG。同料不同尺寸共用一张。
4. 质检实拍图：工单质检区加“上传成品照”（用 B-1 的上传接口），存进工单；订单详情（后台）和售后详情显示；小程序订单详情发货后显示“实拍图”（这一处小程序改动另开小卡，本卡只做后台和后端）。
