// C0e：bead-image 缓存行为（命中不重复下载、超限按最久没用删、地址变了重新下载、失败返回 null）
// 附带 bead-paint 仿真球样式的纯函数断言（共同规矩 6：纯函数要有测试）。
const test = require('node:test');
const assert = require('node:assert');
const { createCache, KEY } = require('../utils/bead-image.js');
const { paint } = require('../utils/bead-paint.js');

function fakes({ limit = 1024, failUrls = [] } = {}) {
  const store = {};
  const saved = {};   // path -> true
  const removed = [];
  let clock = 0;
  let downloads = 0;
  const storage = {
    get: (k) => store[k],
    set: (k, v) => { store[k] = v; },
  };
  const fs = {
    save: async (temp, url) => {
      const path = 'local/' + url;
      saved[path] = true;
      return { path, size: 400 };
    },
    remove: (p) => { removed.push(p); delete saved[p]; },
  };
  const download = async (url) => {
    downloads += 1;
    if (failUrls.includes(url)) throw new Error('net down');
    return 'tmp/' + url;
  };
  const now = () => ++clock;
  return { store, saved, removed, storage, fs, download, now, downloads: () => downloads, limit };
}

test('命中缓存不重复下载', async () => {
  const f = fakes();
  const cache = createCache(f);
  const p1 = await cache.get('a.png');
  const p2 = await cache.get('a.png');
  assert.strictEqual(p1, 'local/a.png');
  assert.strictEqual(p2, 'local/a.png');
  assert.strictEqual(f.downloads(), 1);
});

test('超过上限按最久没用的先删', async () => {
  const f = fakes({ limit: 1000 }); // 每张 400，最多放两张
  const cache = createCache(f);
  await cache.get('a.png'); // usedAt 1
  await cache.get('b.png'); // usedAt 2
  await cache.get('a.png'); // 摸一下 a，usedAt 3，b 变成最久没用
  await cache.get('c.png'); // 总量 1200 > 1000，应删 b
  const idx = f.store[KEY];
  assert.ok(idx['a.png'], 'a 刚用过，应该还在');
  assert.ok(idx['c.png'], 'c 是新的，应该还在');
  assert.ok(!idx['b.png'], 'b 最久没用，应该被删');
  assert.deepStrictEqual(f.removed, ['local/b.png']);
});

test('地址变了重新下载', async () => {
  const f = fakes();
  const cache = createCache(f);
  const p1 = await cache.get('a.png');
  const p2 = await cache.get('a-v2.png');
  assert.notStrictEqual(p1, p2);
  assert.strictEqual(f.downloads(), 2);
});

test('下载失败返回 null', async () => {
  const f = fakes({ failUrls: ['bad.png'] });
  const cache = createCache(f);
  const p = await cache.get('bad.png');
  assert.strictEqual(p, null);
  assert.ok(!f.store[KEY] || !f.store[KEY]['bad.png'], '失败的不进索引');
});

test('paint 输出径向渐变和内阴影，不是平涂', () => {
  const s = paint(['#f1bcc6', '#c47f8e']);
  assert.ok(s.includes('radial-gradient'), '要有径向渐变');
  assert.ok(s.includes('#f1bcc6') && s.includes('#c47f8e'), '两个颜色都要用上');
  assert.ok(s.includes('box-shadow:inset'), '要有内阴影');
});

test('paint 没有颜色数据时用中性灰兜底', () => {
  const s = paint(null);
  assert.ok(s.includes('radial-gradient'));
});
