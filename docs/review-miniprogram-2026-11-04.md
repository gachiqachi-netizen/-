# 串个珠小程序代码审查（提交 5e4945b：`miniprogram/` + `tools/`）

只读审查，没有改任何文件。行号按提交 5e4945b 的版本。很多文件整页压成一行，所以行号只能定位到那一行。

## 总评

开发版的主流程是通的：首页 → DIY/AI/拍照同款 → 编辑器 → 完成 → 下单，还有试戴和分享。尺寸、颗数、价格的计算和原型、后端一致（我抽测了 6/8/10/12mm 一键铺满的结果，都在 −4~+6mm 区间内；订单报价和服务端分、元的算法逐项吻合）。错误处理、幂等下单、登录重试也写得比较周到。

但它离提审上线还差几件“硬伤”：
- 正式版和体验版的接口地址写死成 `http://127.0.0.1:8800`。
- AR 模型从第三方测试 CDN 拉取，约 12.5MB，每次进页面都重新下载。
- 知识库要求的有毒、安全提示在小程序里完全没有展示，卖点和讲解也算出来了却没渲染。
- 列表页每个缩略图各开一个 WebGL 上下文，真机上有上下文耗尽的风险。

包体积不成问题：主包约 0.85MB，AR 分包约 0.73MB。

## 可以直接继续用的部分

- **尺寸算法**：`pages/editor/logic.js`（stats/fill/move/setCount）和 `utils/template.js` 与原型的 `margin/mainSize/fill/fitOf` 一致。总长 = 手围×10 + max(8, 2.5d−5)，合适区间 −4/+6，≥54 颗按多圈处理。
- **订单页** `pages/order/order.js`：按分计价，加手工费 15、编织绳 5、礼盒 10，满 99 包邮，和 `server/user_api.py:make_order` 完全一致。另外有 confirmedQuote 价格确认、requestId 幂等、价格变动重算、尺寸不合适时的二次确认。
- **登录**：`utils/auth.js` 合并并发登录，401 时清掉 token 重登一次。`utils/design.js` 云同步按设计排队，并带 `expectedUpdatedAt` 防冲突。
- **3D 组件** `components/bracelet3d`：three.js 渲染，失败时回退到原生 WebGL，再失败回退到平面圆环；`detached` 里释放纹理、buffer 和定时器。长按拖到垃圾桶、撤销、音效都有测试覆盖。
- **拍照做同款的认珠确认页** `pages/photo`：AI 识别失败时退到本地颜色聚类；主珠、配珠、金属三个角色各给最多 6 个备选，可以调间隔，按手围重新铺。这一页做得比较完整。
- **AR 分包** `ar-hand`：相机帧只在本机推理，退出和隐藏时停帧、释放 tracker；有定格、缩放、诊断复制；`pages/tryon` 有照片叠加和 3D 模型手两种降级方案。
- **测试**：10 个测试文件，`node --test miniprogram/tests/*.test.js` 共 15 项，全部通过。

## 测试结果

- 本机 PATH 里没有 node，我用的是 `~/.local/toolchains/node/bin/node`（v22.23.4）。
- 按任务给的命令 `node --test miniprogram/tests/` 会失败：Node 22 不把目录当测试入口，报 `Cannot find module .../miniprogram/tests`。这不是代码问题。
- 用 `node --test miniprogram/tests/*.test.js`（项目文档 `docs/frontend-interaction-audit-2026-11-03.md` 里写的命令）：**15 tests / 15 pass / 0 fail**，耗时约 1.1s。
- 10 个文件逐个用 `node <file>` 跑，都打印出了成功信息。
- 缺口：没有测试直接覆盖 `logic.stats/fill/setCount` 和 `template.build` 的尺寸规则。我用临时脚本抽测过：手围 15cm 时，6/8/10/12mm 分别铺 27/21/17/15 颗，差值 +2/+3/0/+5mm，全部落在区间内。

## 问题清单

| 严重度 | 文件:行 | 问题 | 怎么改 |
|---|---|---|---|
| 高 | miniprogram/app.js:6 | 非 develop 环境（体验版、正式版）的 `apiBase = 'http://127.0.0.1:8800'`，在用户手机上指向手机本机，而且是 http。注释说“正式版不用私网地址”，实际给的地址同样不可用。体验版和正式版所有接口都会失败（目录、下单、分享落地页、AI）。 | 按 `envVersion` 区分 develop/trial/release，trial 和 release 用 HTTPS 合法域名，并在公众平台配置 request 域名。 |
| 高 | tools/hand-tracker/build.js:9-11 → miniprogram/ar-hand/runtime.js；runtime.ts:6-14 | 手部模型来自他人的测试 CDN `cdn.static.oppenlab.com/weblf/test/...`，约 12.5MB（README 自己写了）。用 `wx.request` 下载、不落盘缓存，每次进 AR 页都重新拉。服务可用性不受控；正式版要把这个域名加进 request 合法域名；4G 下首次加载要十几到几十秒，还消耗流量。 | 模型迁到自有、带版本号的 HTTPS 存储；用 `wx.getFileSystemManager` 缓存到 `USER_DATA_PATH`，按版本校验；进页前提示体积，或者只在 Wi-Fi 下预载；评估换更轻的模型（只做 palm 检测 + 量化 int8）。 |
| 高 | miniprogram/pages/editor/editor.wxml:19；pages/editor/editor.js:23；pages/order/order.wxml:6；pages/shared/shared.wxml:1 | 知识库的 `safety` 字段（朱砂、红豆杉、相思子、金元宝等标了 toxic）在小程序里没有任何展示，全目录 grep 不到 `safety`。原型 prototype.html:1048 的材料清单会用 `--danger` 色显示这条提示。`notes` 里算好了 `points/meaning`，但编辑器 wxml 没渲染（`detailsOpen` 等字段是死代码）；长按详情只显示 `meaning`，没有卖点、讲解（summary）和安全提示。违反“有毒材质要提示”的规则。 | 在长按详情、编辑器材料清单、订单材料明细、分享落地页统一渲染 `points`、`summary`、`safety`（红色）。下单前如果含 toxic 材质，弹出确认。`utils/catalog-preview.js` 里也要补上 safety 字段。 |
| 高（待真机确认） | components/bracelet-thumb/index.js:23,31；用在 pages/home/home.wxml:4,9、pages/diy/diy.wxml:5、pages/mine/mine.wxml:7,10、pages/ai/ai.wxml:11、pages/photo、pages/order | 每个缩略图各创建一个 `canvas type="webgl"` 上下文。“我的”列出全部订单和作品，AI 页恢复最多 20 条消息、每条 3 个方案，tab 页又常驻内存，叠加后很容易几十个 WebGL 上下文同时存在。iOS 和部分安卓对同时存在的 WebGL 上下文有上限，超出会丢上下文、黑块甚至闪退；`detached` 也不释放 program 和 buffer。首页、diy、我的、AI 都没绑 `unavailable`，失败时没有降级图。 | 缩略图改成 2D 圆点图（像 fallback-ring 那样用 view，或者一个 2D canvas 画好后转 tempFile 图片缓存）；只有编辑器、完成页、分享页保留一个 3D 实例。 |
| 中 | miniprogram/utils/api.js:21-26 | develop 环境下 `catalog()` 永远返回打包的 `catalog-preview.js`，`force` 也无效。真机联调时价格是快照，下单走真实后端，容易触发 price_changed；快照里也没有 safety。审计文档已经列为 P1，但没修。 | 把“离线演示”和“联调”分开，用开关或 `catalogOffline` 只在请求失败时兜底。 |
| 中 | pages/ai/ai.js:46；pages/editor/editor.js:66；utils/template.js:6 | 服务端方案总是返回 `count=len(seq)`（server/plans.py:236），`use()` 却写成 `d.fixed=t.fixed\|\|t.count`。结果普通按手围的方案也被标成定颗数，编辑器里“按手围重排”永远按旧颗数排，改了手围也不会重新适配。 | 只用 `t.fixed` 写 `d.fixed`；`count` 只用于展示。 |
| 中 | pages/shared/shared.js:2（use/buySame）；shared.wxml 文案“按你的手围串” | 分享落地页直接沿用分享者的手围和颗数，“买同款”直接进下单页，文案却写“按你的手围串”。 | 读取 `cgz_wrist`，如果有 pattern 就重新铺，否则提示核对手围，或者先进手围页。 |
| 中 | pages/order/order.js:13；pages/share/share.js:28；pages/order-detail/order-detail.js:2；pages/shared/shared.js:2 | 多处用 `navigateTo` 再打开一个编辑器或下单页，比如编辑器→完成→下单→“回去调整”又压一个新编辑器。来回几次会逼近页面栈 10 层上限，返回路径也变乱。 | 能返回的地方用 `navigateBack({delta})`（先用 getCurrentPages 找到已存在的 editor）；起新流程时用 `redirectTo` 或 `reLaunch`。 |
| 中 | pages/editor/editor.js:26（update）、37（dragMove） | 每次点珠、选中、切 tab 都会 setData 整个 `filtered`（每颗珠子带 meaning/summary 长文本，约 90 项）、`items`、`notes`、`design`，一次几十 KB。拖动时每个 touchmove 都 setData。低端安卓会卡。 | 用 `filtered` 的 id 和必要字段做轻量视图模型，只在筛选条件变化时更新；拖动层用 WXS 或 `animation`，或者节流到 16–33ms。 |
| 中 | components/bracelet3d/three-renderer.js:43-52 | 珠子列表一变就清空重建全部 Mesh：每颗 `SphereGeometry(48×32)` 加一个 `MeshPhysicalMaterial`（clearcoat）。80 颗时约 24 万三角面，每次加一颗都重建一遍。 | 按 mm 缓存 geometry，按珠子 id 缓存 material，增量增删 mesh；移动端把球面分段降到 24×16。 |
| 中 | miniprogram/ar-hand/index.js:40,46-47；tools/hand-tracker/runtime.ts:24 | 每次推理（≤10fps）要复制 RGBA 帧 4 次（slice → Uint8Array → 两次 Uint8ClampedArray），medium 帧约 1.2MB，每秒 ~40MB 的临时分配，GC 抖动明显。 | 复用一块预分配 buffer；画面直接用 camera 组件显示，不再 putImageData。如果非要画帧，复用 ImageData。 |
| 中 | tools/phone-test-proxy.py:15-19 | 真机测试代理只放行 catalog、designs、orders、auth。`/api/kb/rules`、`/api/plans/match`、`/api/ai/*`、`/api/shares` 全部 403，体积限制 256KB 也挡住拍照上传。真机上 AI 配、拍照同款、分享、AI 评价都没法测，容易误判为功能 bug。 | 补齐白名单，单独放宽 `/api/ai/photo` 的体积限制；或者在 README 里写明代理只覆盖登录、订单。 |
| 中 | pages/photo/photo.js:33,44,49 | `chooseMedia` 没设 `sizeType:['compressed']`，允许 5MB 原图，转 base64 后用 JSON 发送（约 6.7MB），弱网容易超时。 | 先 `wx.compressImage` 或限制 1600px 长边再上传；或者改用 `wx.uploadFile`。 |
| 中（待确认） | app.json；pages/photo、pages/share、pages/tryon、ar-hand | 用到相机、相册、保存到相册、剪贴板，需要在公众平台配置《用户隐私保护指引》。代码里没有 `wx.onNeedPrivacyAuthorization` 的处理，审核或首次调用时可能直接 fail。 | 在后台配置隐私指引，在 app 或页面里处理 `onNeedPrivacyAuthorization`，或者用 privacy 授权按钮。 |
| 低 | miniprogram/pages/editor/logic.js:7 对比 utils/template.js:11、server/plans.py:166 | 主珠直径的判定三处不一致：编辑器排除 metal 且要求 ≥6mm；模板只排除 spacer、要求 ≥6；服务端只排除 spacer、没有 ≥6 的限制。金属大珠或 4mm 为主时，三处算出的目标长度会不同。 | 抽一个共享的 `mainSize`，规则写进 docs，前后端同步。 |
| 低 | pages/editor/logic.js:37 | `setCount` 接受 ±12mm 的偏差，但会提示“已按 n 颗搭配”，同时长度提示又显示“还差/超出”。 | 偏差超出 −4/+6 时说明“该颗数在你的手围下偏长/偏短”。 |
| 低 | pages/editor/editor.js:2 | `CATS` 里 jade 和 stone 都映射成“玉石”，左侧分类会出现两个“玉石”。 | 按名称合并，或者区分“玉/石”。 |
| 低 | pages/editor/editor.wxml:17 对比 order.js:9 | 编辑器底部价格不含编辑绳 +¥5（cord 选项在编辑器里就能选），和下单页总价对不上。 | 编辑器价格把 `design.cord` 也算进去。 |
| 低 | utils/design.js:9-10 | 云同步快照不含 `cord` 和 `preferences`，换设备后丢失。 | 加入快照，服务端 `design_data` 同步放行。 |
| 低 | pages/editor/editor.js:9 | 每次 onShow 都请求 `/kb/rules`。 | 缓存到 globalData。 |
| 低 | pages/ai/ai.js:26 | 发给 `/ai/design` 的 history 里已经包含本轮刚发的这句话，相当于重复发了一次。 | 用 `prior` 构造 history。 |
| 低 | pages/order/order.js:5 | `cgz_pending_order_request` 只在下单成功时清理，失败或放弃的记录会一直累积。 | 记录时间戳，超过 24h 清掉。 |
| 低 | pages/share/share.js:12,23；pages/tryon/tryon.js:50,69 | 用的是旧版 `wx.createCanvasContext` 和 `canvas-id`，已被官方标为不推荐。 | 迁移到 `type="2d"` 的 canvas。 |
| 低 | 多处：editor.js:26、finish.js:8、share.js:9、shared.js:2、tryon.js:13、photo.js:92、home/data.js:11、diy.js:4、order.js:9 | 手工费 15（或 1500 分）、绳 5、礼盒 10、包邮 99、运费 8 这些魔法数散落在 9 处；圆环坐标 `50+35/37*cos` 也复制了 6 处。 | 抽出 `utils/pricing.js`（同时对齐服务端常量）和 `ringLayout()`。 |
| 低 | three-renderer.js 对比 pages/tryon/three-tryon.js；bracelet3d/index.js 对比 bracelet-thumb/index.js | `textureData/makeEnvironment/mapFor`、`compile/mesh/rgb` 大段重复。 | 抽成共享模块。 |
| 低 | app.wxss 及各页 wxss | 没有用设计 token。品牌色 #c8302e、danger #b42318、fit-warn #9a5800 对得上；ink 用的是 #1f1b1a（原型是 --ink #211e1d），灰阶有 #777/#68625f/#645d59/#5e5753 等十几种；没有 `--font-num`（DIN）数字字体。 | 在 `page{}` 上定义 CSS 变量，对齐 prototype.html:6-16，各页引用变量。 |
| 低 | project.config.json:7,26 | `minified:false`；`packOptions.ignore` 为空，`tests/`、`README.md`、仅开发用的 `catalog-preview.js`（40KB）都会被打进包。 | 打开压缩，ignore 掉 tests/README；catalog-preview 只在开发时引入，或者放到分包。 |
| 低 | app.json | 没开 `lazyCodeLoading: "requiredComponents"`；没给 ar-hand 配 `preloadRule`；sitemap 放开了所有页面（包括 login、order）。 | 补上这些配置。 |
| 低 | miniprogram/README.md:3 对比 app.js:6、phone-test-proxy.py | README 写 8801 端口，代码用 8800（开发者工具）和 8802（代理），文档和实现对不上。 | 统一端口说明。 |
| 低 | tools/audit-*.cjs:2 | automator 默认路径硬编码成 `/tmp/beadloop-automation/...`。 | 改用 devDependency 或环境变量，并写进 README。 |

## 和原型的功能差距

| 功能 | 原型 | 小程序现状 |
|---|---|---|
| DIY 一键铺满 | “用「X」铺满剩下的 N 颗” | 有（“补齐 N 颗”），逻辑一致。缺少原型里“铺满后点一颗换成配珠”的引导。 |
| 按颗数串 | 详情区里的 chips | 有，但藏在“更多”弹层里。偏差容忍 ±12mm，提示不够明确。 |
| 材料清单（卖点、讲解、安全提示） | 每种珠子 × 数量，显示 points、safety（红色）、meaning | **没有**：notes 算了没渲染，safety 完全缺失，summary（讲解）没展示。 |
| 长按看实拍和详情 | 有 | 只有照片、价格、meaning，没有 points、summary、safety。 |
| 手串名称与寓意 | 可以编辑名称和寓意 | 只能改名称，寓意不能编辑或查看。 |
| AI 配精选方案 | 3 条，带“精选方案/热门款”角标 | 有角标和 refine chips。没展示 `tips/notes/overBudget/swapped`；“再来三条”不带 exclude 参数（待确认是否会重复返回同样的方案）；定颗数问题见上表。语音只是个 toast 占位。 |
| 拍照做同款的认珠确认页 | 主珠、配珠、点缀加备选 | 已实现，比较完整，有 AI 和本地两路识别。 |
| 试戴 | 照片叠加 | 有照片叠加、3D 模型手，另加实验性的实时 AR（标了“测试”）。 |
| 分享 | 分享卡片和落地页 | 有海报、分享卡片和落地页。落地页不会按查看者的手围重排；“每颗珠子的寓意”显示的是 tags，不是 meaning。 |
| 下单 | 有地址、绳、礼盒 | 有，但支付没接入（页面已写明）；没有 `wx.chooseAddress`。 |
| 首单立减 | 有宣传 | 小程序没有，服务端也不承诺这个优惠，可以接受。 |
| 受保护材质来源证明 | 知识库规则 | 后端 `enrich` 不返回 compliance，小程序也不展示。属于前后端共同的缺口（待确认产品是否要在 C 端展示）。 |

## 包体积和性能结论

**包体积**（按文件字节统计，未压缩）：

| 部分 | 大小 | 说明 |
|---|---|---|
| 主包 | 约 870KB（0.83MB） | three.js 597KB 占大头；包含 tests 16KB、catalog-preview 40KB |
| `ar-hand` 分包 | 约 750KB（runtime.js 739KB） | |
| 合计 | 约 1.6MB | |

- 主包限制 2MB、总包限制 20MB，**都不会超**，主包还有约 1.1MB 余量。README 里记录的开发者工具构建数字（主包约 907KB、AR 分包约 936KB）与此吻合。
- 运行时另外要下载 AR 模型约 12.5MB，不计入包体积，但它是首次加载的主要瓶颈。
- 建议：
  - 把 `pages/tryon`（含 three-tryon）、share、shared 移到分包。three.js 主包里的编辑器也要用，所以留在主包。
  - 打开 minified，ignore 掉 tests。

**性能**：
- 编辑器：每次操作都整量 setData，three.js 每次全量重建，80 颗时低端机会卡。
- 缩略图：多个 WebGL 上下文是最大的稳定性风险，需要真机验证。
- AR：每 100ms 最多推理一次，理论上限 10fps，实际受移动端 handpose 推理速度限制，估计 5–10fps（待真机测）；每帧大量内存拷贝。首次进入要下载 12.5MB，没有缓存，每次进入都重新下载。

**隐私**：
- 实时 AR 和照片试戴的相机数据只在本机处理，不上传，代码和页面文案一致。
- 拍照做同款会把照片 base64 上传到 `/api/ai/photo`，页面有提示。
- 需要在后台补配隐私指引。

**AR 失败降级**：权限被拒、模型下载失败、渲染失败都有错误提示、重试和打开设置；试戴页保留照片叠加和 3D 模型手作为替代，降级路径完整。
