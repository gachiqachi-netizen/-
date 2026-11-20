const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');

const root = path.resolve(__dirname, '..');

async function loadPage() {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['src/pages/products.tsx'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['react', 'react-dom'],
    write: false,
    plugins: [{ name: 'test-permissions', setup(bundler) {
      bundler.onResolve({ filter: /^\.\.\/permissions$/ }, () => ({ path: 'permissions', namespace: 'u39-test' }));
      bundler.onLoad({ filter: /.*/, namespace: 'u39-test' }, () => ({ contents: 'export const Can = ({ children }) => children;' }));
    } }],
  });
  const filename = path.join(root, 'node_modules', '__u39_products_test.cjs');
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled._compile(result.outputFiles[0].text, filename);
  return compiled.exports;
}

test('removing rejected products keeps reasons, re-previews remaining selection, and enables execution', async () => {
  const dom = new JSDOM('<div id="app"></div>', { url: 'http://localhost/admin/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.sessionStorage = dom.window.sessionStorage;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const requests = [];
  const products = [
    { id: 'valid', name: '演示珠', type: 'bead', mm: 8, mat: 'crystal', status: 'draft', priceFen: 800, photo: '/valid.png' },
    { id: 'invalid', name: '演示珠', type: 'bead', mm: 10, mat: 'crystal', status: 'draft', priceFen: 900, photo: '' },
  ];
  global.fetch = async (url, options = {}) => {
    if (url === '/api/admin/beads?group=1') return Response.json([{ name: '演示珠', sizes: products }]);
    if (url === '/api/admin/kb') return Response.json({ items: [] });
    if (url === '/api/admin/beads/status') {
      const body = JSON.parse(options.body);
      requests.push(body);
      return Response.json({
        changes: body.ids.includes('valid') ? [{ id: 'valid', name: '演示珠' }] : [],
        rejected: body.ids.includes('invalid') ? [{ id: 'invalid', name: '演示珠', reason: '缺少照片' }] : [],
        unchanged: [],
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const { default: ProductsPage } = await loadPage();
  const container = document.querySelector('#app');
  const app = createRoot(container);
  const click = async element => { assert.ok(element); await act(async () => element.click()); };
  const button = label => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label);
  try {
    await act(async () => app.render(React.createElement(ProductsPage, { beads: [], kbMaterials: [], onRefresh: async () => {}, notify: () => {} })));
    await click(container.querySelector('input[aria-label="勾选演示珠全部尺寸"]'));
    assert.match(container.textContent, /已勾选 2 件/);
    await click(button('批量上架'));
    assert.deepEqual(requests[0].ids, ['valid', 'invalid']);
    assert.equal(button('确认上架').disabled, true);
    await click(button('去掉这 1 个，继续'));
    assert.match(container.textContent, /已勾选 1 件/);
    assert.deepEqual(requests[1].ids, ['valid']);
    assert.equal(requests[1].preview, true);
    assert.match(container.textContent, /已从本批移除，待补资料/);
    assert.match(container.textContent, /缺少照片/);
    assert.equal(button('确认上架').disabled, false);
  } finally {
    await act(async () => app.unmount());
    dom.window.close();
    delete global.fetch;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
