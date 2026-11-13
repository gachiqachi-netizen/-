// 珠子图组件：有实拍图显示本地缓存的图，没有就画仿真球；loading 浅灰骨架；off 整体半透明。
const { createCache } = require('../../utils/bead-image.js');
const { paint } = require('../../utils/bead-paint.js');

let cache = null;
function getCache() {
  if (cache) return cache;
  const fsm = wx.getFileSystemManager();
  cache = createCache({
    storage: {
      get: (k) => wx.getStorageSync(k),
      set: (k, v) => wx.setStorageSync(k, v),
    },
    fs: {
      save: (temp) => new Promise((resolve, reject) => {
        const target = wx.env.USER_DATA_PATH + '/bead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        fsm.saveFile({
          tempFilePath: temp,
          filePath: target,
          success: () => {
            wx.getFileInfo({
              filePath: target,
              success: (info) => resolve({ path: target, size: info.size }),
              fail: () => resolve({ path: target, size: 0 }),
            });
          },
          fail: reject,
        });
      }),
      remove: (p) => { try { fsm.unlink({ filePath: p, fail() {} }); } catch (e) {} },
    },
    download: (url) => new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        success: (r) => (r.statusCode === 200 ? resolve(r.tempFilePath) : reject(new Error('http ' + r.statusCode))),
        fail: reject,
      });
    }),
    now: () => Date.now(),
  });
  return cache;
}

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    bead: { type: Object, value: null },
    size: { type: String, value: 'm' },   // s 48rpx / m 80rpx / l 120rpx
    state: { type: String, value: 'normal' }, // normal / loading / off
  },
  data: { paintStyle: '', photoPath: '' },
  observers: {
    'bead, state': function () { this.refresh(); },
  },
  lifetimes: {
    attached() { this.refresh(); },
  },
  methods: {
    photoUrl(bead) {
      const p = bead && bead.photo;
      if (!p) return '';
      if (/^(https?:|data:)/.test(p)) return p;
      const app = typeof getApp === 'function' ? getApp() : null;
      const base = app && app.globalData && app.globalData.apiBase;
      return base ? base + p : '';
    },
    refresh() {
      if (this.data.state === 'loading') {
        this.setData({ paintStyle: '', photoPath: '' });
        return;
      }
      const bead = this.data.bead || {};
      this.setData({ paintStyle: paint(bead.c) });
      const url = this.photoUrl(bead);
      if (!url) {
        this.setData({ photoPath: '' });
        return;
      }
      if (url.indexOf('data:') === 0) { // data 图不用下载，直接用
        this.setData({ photoPath: url });
        return;
      }
      const seq = (this._seq = (this._seq || 0) + 1); // 属性变了又变回来的竞态保护
      getCache().get(url).then((path) => {
        if (seq !== this._seq) return;
        this.setData({ photoPath: path || '' });
      });
    },
    onImgError() { // 缓存文件没了等情况：退回仿真球
      this.setData({ photoPath: '' });
    },
  },
});
