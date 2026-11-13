// 珠子实拍图本地缓存：按需下载到本地，建索引，总大小超上限时按最久没用的先删。
// 读写存储、下载、删文件全部通过参数注入，测试里用假的替换。
// 用法：createCache({ storage: {get,set}, fs: {save,remove}, download, now, limit }).get(url) → Promise<本地路径|null>

const KEY = 'beadImageIndex';
const DEFAULT_LIMIT = 20 * 1024 * 1024; // 20MB

function createCache({ storage, fs, download, now, limit }) {
  const cap = limit || DEFAULT_LIMIT;
  const clock = now || Date.now;

  function readIndex() {
    return storage.get(KEY) || {};
  }

  function totalSize(idx) {
    return Object.keys(idx).reduce((sum, url) => sum + (idx[url].size || 0), 0);
  }

  function evict(idx, keepUrl) {
    while (totalSize(idx) > cap) {
      const victims = Object.keys(idx).filter((u) => u !== keepUrl);
      if (!victims.length) break;
      victims.sort((a, b) => (idx[a].usedAt || 0) - (idx[b].usedAt || 0));
      const oldest = victims[0];
      try { fs.remove(idx[oldest].path); } catch (e) { /* 删不掉也继续，索引不再引用 */ }
      delete idx[oldest];
    }
  }

  // 命中返回本地路径并刷新 usedAt；没缓存就下载保存；任何一步失败返回 null（调用方画仿真球）
  async function get(url) {
    if (!url) return null;
    const idx = readIndex();
    const hit = idx[url];
    if (hit) {
      hit.usedAt = clock();
      storage.set(KEY, idx);
      return hit.path;
    }
    let temp;
    try {
      temp = await download(url);
    } catch (e) {
      return null;
    }
    let saved;
    try {
      saved = await fs.save(temp, url);
    } catch (e) {
      return null;
    }
    if (!saved || !saved.path) return null;
    idx[url] = { path: saved.path, usedAt: clock(), size: saved.size || 0 };
    evict(idx, url);
    storage.set(KEY, idx);
    return idx[url].path;
  }

  return { get };
}

module.exports = { createCache, KEY, DEFAULT_LIMIT };
