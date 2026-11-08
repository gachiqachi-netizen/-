第一波复审通过了大部分，还有 2 处小问题。请直接在 codex/wave1-integration 分支上修正（同时把对应修改也提交到原分支 codex/t2-ar-model、codex/t1-env-config，保持一致）。不要合并到 main，不要推送 main。

1. miniprogram/ar-hand/model-cache.js（T2）：wx.downloadFile 现在仍然传了 timeout: 20 秒，这是单个文件的总下载时限。4MB 的分片在网速低于 200KB/s 时，即使一直有进度也会被微信中断。
   - 去掉 downloadFile 的 timeout 参数（或改成 120000），只靠"连续 20 秒无进度"来判断停滞。
   - 补测试：单个文件下载超过 20 秒但持续有进度时不失败。

2. miniprogram/config.js（T1）：placeholderBase 用了 new URL()。部分微信基础库没有全局 URL，会抛错后被 catch 当成"不是占位地址"放行，检查等于失效。
   - 改成用正则从地址里取主机名（例如 /^https?:\/\/([^\/:?#]+)/i），不要依赖 URL。
   - 补测试：在 globalThis.URL 被删掉的情况下，example.com 仍然会被拦截。

修完在 codex/wave1-integration 上跑三条测试：
   python3 -m unittest discover -s server/tests
   node --test miniprogram/tests/*.test.js
   python3 kb/validate.py

推送 codex/wave1-integration、codex/t2-ar-model、codex/t1-env-config。
汇报：两处怎么改的、新增测试、三条测试输出、最新提交编号。
