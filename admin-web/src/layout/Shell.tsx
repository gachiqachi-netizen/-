import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { AdminMe, canPage, pageNeed } from '../permissions';

export interface NavItem {
  key: string;
  label: string;
  count?: number;
}

export interface NavGroup {
  group: string | null;
  items: NavItem[];
}

/** 左菜单分组和条目：照 docs/design/12-admin.md 第 2 节 */
export const MENU: NavGroup[] = [
  { group: null, items: [{ key: 'today', label: '今天' }] },
  { group: '生产', items: [{ key: 'workOrders', label: '做单' }] },
  {
    group: '交易',
    items: [
      { key: 'orders', label: '订单' },
      { key: 'afterSales', label: '售后' },
      { key: 'reviews', label: '评价' },
    ],
  },
  {
    group: '商品',
    items: [
      { key: 'products', label: '珠子与配件' },
      { key: 'templates', label: '模板' },
      { key: 'knowledge', label: '知识库' },
    ],
  },
  {
    group: '内容',
    items: [
      { key: 'home', label: '首页' },
      { key: 'articles', label: '文章' },
      { key: 'terms', label: '条款' },
    ],
  },
  {
    group: '系统',
    items: [
      { key: 'accounts', label: '账号与权限' },
      { key: 'audit', label: '操作记录' },
    ],
  },
];

export function pageTitle(page: string): string {
  for (const g of MENU) {
    const hit = g.items.find((i) => i.key === page);
    if (hit) return hit.label;
  }
  return '';
}

interface ShellProps {
  active: string;
  subtitle?: string;
  counts?: Record<string, number>;
  onNavigate: (page: string) => void;
  onSearch: (q: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/** 外壳：左菜单（宽 200）+ 顶栏（页面标题 + 全局搜索）+ 内容区 */
export const Shell: React.FC<ShellProps> = ({
  active,
  subtitle,
  counts = {},
  onNavigate,
  onSearch,
  onLogout,
  children,
}) => {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let alive = true;
    apiRequest<AdminMe>('/api/admin/me')
      .then((result) => { if (alive) setMe(result); })
      .catch((error) => { if (alive) setLoadError(error.status === 403 && error.data?.need
        ? `需要“${error.data.need}”，找负责人开通。` : error.message || '权限读取失败'); });
    return () => { alive = false; };
  }, []);
  const denied = me !== null && !canPage(active, me);
  return (
    <div className="zy-shell">
      <aside className="zy-side">
        <div className="zy-side-brand">
          珠养养
          <span className="zy-side-brand-sub">后台</span>
        </div>
        <nav className="zy-side-nav">
          {MENU.map((g) => ({ ...g, items: me ? g.items.filter((item) => canPage(item.key, me)) : [] })).filter((g) => g.items.length).map((g) => (
            <div key={g.group || 'top'}>
              {g.group && <div className="zy-side-group">{g.group}</div>}
              {g.items.map((item) => {
                const count = counts[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`zy-side-item ${active === item.key ? 'zy-side-item-on' : ''}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <span>{item.label}</span>
                    {count !== undefined && count > 0 && <span className="zy-side-count">{count}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="zy-side-foot">
          <span>{me ? `${me.name}（${me.roleName}）` : '串个珠 · 后台'}</span>
          <button type="button" className="zy-side-logout" onClick={onLogout}>
            退出
          </button>
        </div>
      </aside>
      <div className="zy-main">
        <header className="zy-top">
          <div>
            <span className="zy-top-title">{pageTitle(active)}</span>
            {subtitle && <span className="zy-top-sub">{subtitle}</span>}
          </div>
          <input
            className="zy-top-search"
            placeholder="搜订单号、手机号后 4 位"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </header>
        <main className="zy-content">
          {loadError ? <div role="alert">{loadError}</div> :
            !me ? <div>正在读取权限…</div> :
            denied ? <div className="zy-card zy-empty" role="alert"><h2>你没有这个页面的权限</h2><p>需要“{pageNeed(active)}”，找负责人开通。</p></div> : children}
        </main>
      </div>
    </div>
  );
};
