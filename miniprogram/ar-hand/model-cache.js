// Persistent model files, isolated from TFJS so download/cache behavior can be tested.
const VIRTUAL_ROOT = 'beadloop-model://';
const LIMIT_BYTES = 24 * 1024 * 1024;
const LOAD_TIMEOUT = 20000;

function resolveModelConfig(globalData = {}, envVersion = 'develop') {
  const version = globalData.modelVersion || 'v1';
  if (!/^[a-zA-Z0-9_-]+$/.test(version)) throw new Error('手部模型版本配置无效');
  const base = (globalData.modelBase || (envVersion === 'develop'
    ? (globalData.apiBase ? globalData.apiBase.replace(/\/$/, '') + '/models' : '')
    : 'https://static.example.com')).replace(/\/$/, '');
  if (!base || !(envVersion === 'develop' ? /^https?:\/\// : /^https:\/\//).test(base)) {
    throw new Error('请先配置手部模型服务地址');
  }
  return {base, version};
}

function createModelLoader(wxApi, config, onProgress = () => {}, options = {}) {
  const fs = wxApi.getFileSystemManager();
  const root = wxApi.env.USER_DATA_PATH + '/beadloop-handpose';
  const dir = root + '/' + config.version;
  const marker = dir + '/complete.json';
  const active = new Set();
  let cancelled = false, bytes = 0, count = 0, lastProgress = -1, files = [];
  const limit = options.limitBytes || LIMIT_BYTES;
  const timeout = options.timeoutMs || LOAD_TIMEOUT;
  const progress = value => {
    const next = Math.max(lastProgress, Math.min(100, Math.floor(value)));
    if (next !== lastProgress && !cancelled) { lastProgress = next; onProgress(next); }
  };
  const exists = path => { try { fs.accessSync(path); return true; } catch (_) { return false; } };
  const unlink = path => { try { fs.unlinkSync(path); } catch (_) {} };
  const pathFor = name => {
    if (!/^(anchors\.json|(?:handdetector|handskeleton)\/[\w.-]+)$/.test(name) || name.includes('..')) {
      throw new Error('手部模型文件路径无效');
    }
    return dir + '/' + name;
  };
  function cancel() {
    cancelled = true;
    for (const pending of active) { pending.reject(new Error('模型加载已取消')); try { pending.task.abort(); } catch (_) {} }
    active.clear();
  }
  function readJSON(path) { return JSON.parse(fs.readFileSync(path, 'utf8')); }
  function cached() {
    try {
      const saved = readJSON(marker);
      if (saved.version !== config.version || !Array.isArray(saved.files) || saved.files.length < 5) return false;
      const names = new Set(saved.files.map(x => x.name));
      for (const name of ['anchors.json','handdetector/model.json','handskeleton/model.json']) if (!names.has(name)) return false;
      let total = 0;
      for (const entry of saved.files) {
        if (!(entry.size > 0) || fs.statSync(pathFor(entry.name)).size !== entry.size) return false;
        total += entry.size;
      }
      if (total > limit) return false;
      for (const kind of ['handdetector','handskeleton']) {
        const model = readJSON(pathFor(kind + '/model.json'));
        if (!Array.isArray(model.weightsManifest)) return false;
        for (const group of model.weightsManifest) for (const shard of group.paths) if (!names.has(kind + '/' + shard)) return false;
      }
      if (!Array.isArray(readJSON(pathFor('anchors.json')))) return false;
      files = saved.files; return true;
    } catch (_) { return false; }
  }
  function download(name) {
    if (cancelled) return Promise.reject(new Error('模型加载已取消'));
    const target = pathFor(name), partial = target + '.part';
    return new Promise((resolve, reject) => {
      let settled = false;
      const pending = {task: null, reject: err => finish(err)};
      function finish(error) {
        if (settled) return;
        settled = true; active.delete(pending);
        if (error) { unlink(partial); reject(error); } else resolve();
      }
      pending.task = wxApi.downloadFile({
        url: config.base + '/handpose/' + config.version + '/' + name,
        filePath: partial, timeout,
        success(result) {
          if (cancelled) return finish(new Error('模型加载已取消'));
          if (result.statusCode !== 200) return finish(new Error('手部模型下载失败，请重试或改用照片试戴'));
          try {
            const size = fs.statSync(partial).size;
            if (!size || bytes + size > limit) throw new Error('手部模型缓存空间不足，请清理存储或改用照片试戴');
            if (/\.json$/.test(name)) readJSON(partial);
            fs.renameSync(partial, target);
            files.push({name,size}); bytes += size; count++;
            progress(Math.min(99, count / 7 * 100)); finish();
          } catch (error) { finish(new Error(/space|quota|limit|空间/i.test(error.message || error.errMsg || '')
            ? '手部模型缓存空间不足，请清理存储或改用照片试戴' : '手部模型缓存写入失败，请重试或改用照片试戴')); }
        },
        fail(error) { finish(new Error(/space|quota|limit/i.test(error.errMsg || '')
          ? '手部模型缓存空间不足，请清理存储或改用照片试戴' : '手部模型下载失败，请重试或改用照片试戴')); }
      });
      if (!settled) active.add(pending);
      if (pending.task && pending.task.onProgressUpdate) pending.task.onProgressUpdate(info => {
        if (cancelled || settled) return;
        if (bytes + (info.totalBytesExpectedToWrite || 0) > limit) {
          finish(new Error('手部模型缓存空间不足，请清理存储或改用照片试戴'));
          try { pending.task.abort(); } catch (_) {}
          return;
        }
        progress(Math.min(99, (count + (info.progress || 0) / 100) / 7 * 100));
      });
    });
  }
  async function populate() {
    progress(0);
    if (cached()) { progress(100); return; }
    try {
      if (!exists(root)) fs.mkdirSync(root, true);
      // A version is immutable. Only retain one complete version to bound this cache.
      for (const old of fs.readdirSync(root)) if (/^[\w-]+$/.test(old)) fs.rmdirSync(root + '/' + old, true);
      fs.mkdirSync(dir + '/handdetector', true); fs.mkdirSync(dir + '/handskeleton', true);
    } catch (_) { throw new Error('手部模型缓存空间不可用，请清理存储或改用照片试戴'); }
    for (const kind of ['handdetector','handskeleton']) {
      await download(kind + '/model.json');
      const model = readJSON(pathFor(kind + '/model.json'));
      if (!Array.isArray(model.weightsManifest)) throw new Error('手部模型文件无效');
      for (const group of model.weightsManifest) {
        if (!Array.isArray(group.paths)) throw new Error('手部模型文件无效');
        for (const shard of group.paths) await download(kind + '/' + shard);
      }
    }
    await download('anchors.json');
    if (!Array.isArray(readJSON(pathFor('anchors.json')))) throw new Error('手部模型文件无效');
    if (cancelled) throw new Error('模型加载已取消');
    try { fs.writeFileSync(marker, JSON.stringify({version:config.version,files}), 'utf8'); }
    catch (_) { throw new Error('手部模型缓存空间不足，请清理存储或改用照片试戴'); }
    progress(100);
  }
  async function prepare() {
    let timer;
    try { await Promise.race([populate(), new Promise((_, reject) => {
      timer = setTimeout(() => { cancel(); reject(new Error('手部模型加载超过 20 秒，可重试或改用照片试戴')); }, timeout);
    })]); } catch (error) { cancel(); throw error; } finally { clearTimeout(timer); }
  }
  async function fetch(url) {
    if (cancelled) throw new Error('模型加载已取消');
    if (!url.startsWith(VIRTUAL_ROOT)) throw new Error('手部模型地址无效');
    const name = url.slice(VIRTUAL_ROOT.length), path = pathFor(name);
    const json = /\.json$/.test(name);
    const data = fs.readFileSync(path, json ? 'utf8' : undefined);
    return {ok:true,status:200,json:async()=>JSON.parse(data),text:async()=>data,
      arrayBuffer:async()=>data,headers:{get:()=>null}};
  }
  return {prepare,fetch,cancel};
}
module.exports = {resolveModelConfig,createModelLoader,LOAD_TIMEOUT,LIMIT_BYTES};
