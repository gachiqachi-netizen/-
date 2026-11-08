第一波审查结果出来了。请在原分支上修正下面的问题，然后建一个合并分支给我验收。不要合并到 main，不要推送 main。

【修正（在各自的原分支上提交）】
1. codex/t2-ar-model【高】：20 秒超时不能包含模型首次下载的时间。
   - 改成两种超时：下载阶段"连续 20 秒没有任何下载进度"才算超时；识别初始化阶段（setBackend、handpose.load）单独 20 秒超时。
   - 重试时保留同一版本目录里已经完整下载的文件（以大小和 JSON 能解析为准），只下载缺的；只删除其他版本的目录。
   - 补测试：慢速但一直有进度的下载不会超时；中途失败后重试只补下缺失的文件。
2. codex/t16-catalog-refresh【中】：
   - submit() 开头检查 quotePending，为 true 时提示"请先确认新价格"并返回。
   - calculate() 在 quotePending 为 true 时，不能把 catalogReady 设成 true。
   - calculate() 开头如果 this.catalog 不是数组就直接返回（目录首次加载失败后切换编织绳或礼盒不能报错）。
   - 补测试：改价待确认时切换礼盒仍不能提交；目录加载失败后切换选项不报错。
3. codex/t1-env-config【中】：trial 和 release 的 apiBase、modelBase 如果包含 example.com 或其他占位域名，启动时报错"正式环境地址未配置"。补测试。

【合并分支】
4. 从 main 拉出 codex/wave1-integration，按顺序合并：t1-env-config → t2-ar-model → t3-safety → t4-thumb → t16-catalog-refresh（用修正后的版本）。冲突这样解决：
   - miniprogram/utils/api.js：request() 保留 T1 的 configError 检查，同时加上 T16 的 timeout:10000；catalog() 开头保留 T1 的 configError 检查，删掉 T1 那行"if (!force && g.catalog) return ..."，其余用 T16 的逻辑。
   - miniprogram/pages/order/order.js：onShow、confirmQuote 和改价确认流程用 T16 的；calculate() 里的 items 用 T3 的 materials.fromCatalog 写法，并保留第 2 条的修正。
   - order.wxml 和 editor.wxml 会自动合并，合并后确认离线提示、报价确认、材料清单、红字安全提示都还在。
5. 在合并分支上跑三条测试，确认全部通过：
   python3 -m unittest discover -s server/tests
   node --test miniprogram/tests/*.test.js
   python3 kb/validate.py

【推送】
6. 推送这几个分支：codex/t1-env-config、codex/t2-ar-model、codex/t16-catalog-refresh、codex/wave1-integration。

【汇报】
每个问题怎么改的（一两句话），新增了哪些测试，合并分支的三条测试输出，以及各分支最新的提交编号。
