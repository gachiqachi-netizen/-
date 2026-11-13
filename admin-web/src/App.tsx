import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  ShoppingBag,
  ShieldAlert,
  Truck,
  FileCheck2,
  History,
  Search,
  RefreshCw,
  LogOut,
  Command,
  CheckCircle2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from 'lucide-react';
import { apiRequest, setSavedToken } from './api';
import { DashboardOverview, ProductsView } from './components/OverviewAndProducts';
import { TemplatesWorkbenchView } from './components/TemplatesView';
import { OrdersAndWorkOrdersView } from './components/OrdersView';
import {
  AfterSalesView,
  LogisticsView,
  TermsAndScopeView,
  BannersAndAuditView,
} from './components/OperationsViews';

const NAV_ITEMS = [
  { id: 'overview', label: '工作台总览', group: '核心运营', icon: LayoutDashboard },
  { id: 'products', label: '商品与珠材库', group: '核心运营', icon: Package },
  { id: 'templates', label: '模板配方工作台', group: '核心运营', icon: Sparkles },
  { id: 'orders', label: '订单、工单与质检', group: '生产与履约', icon: ShoppingBag },
  { id: 'after-sales', label: '售后审批管理', group: '生产与履约', icon: ShieldAlert },
  { id: 'logistics', label: '物流运单中心', group: '生产与履约', icon: Truck },
  { id: 'terms', label: '条款与适用范围', group: '合规与审计', icon: FileCheck2 },
  { id: 'audit', label: '宣传位与操作审计', group: '合规与审计', icon: History },
];

export const App: React.FC = () => {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [focusOrderNo, setFocusOrderNo] = useState<string | null>(null);

  const [beads, setBeads] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [afterSales, setAfterSales] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [kbMaterials, setKbMaterials] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3200);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, oRes, aRes, tmRes, bnRes, auRes, kbRes, aiRes] = await Promise.all([
        apiRequest<any[]>('/api/admin/beads'),
        apiRequest<any[]>('/api/admin/templates'),
        apiRequest<any[]>('/api/admin/orders'),
        apiRequest<any[]>('/api/admin/after-sales').catch(() => []),
        apiRequest<any[]>('/api/admin/terms').catch(() => []),
        apiRequest<any[]>('/api/admin/banners').catch(() => []),
        apiRequest<any[]>('/api/admin/audit').catch(() => []),
        apiRequest<any>('/api/kb/materials').catch(() => ({ items: [] })),
        apiRequest<any>('/api/ai/status').catch(() => null),
      ]);
      setBeads(Array.isArray(bRes) ? bRes : []);
      setTemplates(Array.isArray(tRes) ? tRes : []);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setAfterSales(Array.isArray(aRes) ? aRes : []);
      setTerms(Array.isArray(tmRes) ? tmRes : []);
      setBanners(Array.isArray(bnRes) ? bnRes : []);
      setAuditLogs(Array.isArray(auRes) ? auRes : []);
      setKbMaterials(Array.isArray(kbRes) ? kbRes : kbRes?.items || kbRes?.materials || []);
      setAiStatus(aiRes);
      setAuthed(true);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setAuthed(false);
      } else {
        notify(err.message || '数据加载异常', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await apiRequest('/api/admin/session', {
        method: 'POST',
        body: { password: password.trim() },
      });
      setSavedToken(password.trim());
      await loadAllData();
      notify('欢迎进入串个珠 shadcn-admin 生产与运营工作台');
    } catch (err: any) {
      setLoginError(err.message || '口令验证未通过，请确认 ADMIN_TOKEN');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/admin/session', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setSavedToken('');
    setAuthed(false);
  };

  const handleNavigate = (tab: string, payload?: any) => {
    setActiveTab(tab);
    if (payload?.orderNo) {
      setFocusOrderNo(payload.orderNo);
    }
  };

  if (authed === false) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8302e] text-white font-bold flex items-center justify-center text-lg shadow-sm">
              串
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">串个珠 · 生产与运营工作台</h1>
              <p className="text-xs text-zinc-400">Beadloop Admin Workbench (shadcn-admin 架构)</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                管理员访问口令 (`ADMIN_TOKEN`)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入后台管理口令..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c8302e]"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              解锁进入后台
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-zinc-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-zinc-950 text-zinc-300 border-r border-zinc-800 flex flex-col justify-between transition-all duration-200 select-none`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#c8302e] text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                串
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">串个珠 · Admin</div>
                  <div className="text-[11px] text-zinc-400 truncate">shadcn-admin 生产工作台</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70"
              title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Groups */}
          <div className="p-3 space-y-5">
            {['核心运营', '生产与履约', '合规与审计'].map((groupName) => {
              const items = NAV_ITEMS.filter((i) => i.group === groupName);
              return (
                <div key={groupName} className="space-y-1">
                  {!sidebarCollapsed && (
                    <div className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {groupName}
                    </div>
                  )}
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    const badgeCount =
                      item.id === 'products'
                        ? beads.length
                        : item.id === 'templates'
                        ? templates.length
                        : item.id === 'orders'
                        ? orders.length
                        : item.id === 'after-sales'
                        ? afterSales.filter((a) => a.status === 'requested' || a.status === 'reviewing').length
                        : 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!sidebarCollapsed && badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              active ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          {!sidebarCollapsed && (
            <div className="px-2.5 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>KB 知识库</span>
                <span className="text-emerald-400 font-medium">{kbMaterials.length} 种材质就绪</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI 顾问网关</span>
                <span className="text-zinc-300">{aiStatus?.provider || '本地规则降级'}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>退出管理会话</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-zinc-900">{currentNav.label}</h2>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              / {currentNav.group} · 实时同步小程序端与生产车间
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCmdOpen(true)}
              className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/70 border border-zinc-200 text-xs text-zinc-600 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span>全局快捷检索...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-zinc-300 text-zinc-500">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>
        </header>

        {/* Active Module Workspace */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              beads={beads}
              templates={templates}
              orders={orders}
              afterSales={afterSales}
              terms={terms}
              onNavigate={handleNavigate}
            />
          )}
          {activeTab === 'products' && (
            <ProductsView
              beads={beads}
              kbMaterials={kbMaterials}
              onRefresh={loadAllData}
              notify={notify}
            />
          )}
          {activeTab === 'templates' && (
            <TemplatesWorkbenchView
              templates={templates}
              beads={beads}
              onRefresh={loadAllData}
              notify={notify}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersAndWorkOrdersView
              orders={orders}
              initialOrderNo={focusOrderNo}
              onRefresh={loadAllData}
              notify={notify}
            />
          )}
          {activeTab === 'after-sales' && (
            <AfterSalesView
              afterSales={afterSales}
              orders={orders}
              onRefresh={loadAllData}
              notify={notify}
            />
          )}
          {activeTab === 'logistics' && (
            <LogisticsView orders={orders} onRefresh={loadAllData} notify={notify} />
          )}
          {activeTab === 'terms' && (
            <TermsAndScopeView
              terms={terms}
              beads={beads}
              templates={templates}
              onRefresh={loadAllData}
              notify={notify}
            />
          )}
          {activeTab === 'audit' && <BannersAndAuditView banners={banners} auditLogs={auditLogs} />}
        </main>
      </div>

      {/* Command Palette (⌘K) */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/45 backdrop-blur-[1px] p-4"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2.5">
              <Command className="w-4 h-4 text-zinc-400" />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="输入模块名称、订单号、商品名称或模板快速跳转..."
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-100 text-xs">
              <div className="py-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400">导航模块</div>
                {NAV_ITEMS.filter((i) => !cmdQuery || i.label.includes(cmdQuery)).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setActiveTab(i.id);
                      setCmdOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 flex items-center justify-between"
                  >
                    <span className="font-medium text-zinc-900">{i.label}</span>
                    <span className="text-zinc-400">{i.group}</span>
                  </button>
                ))}
              </div>
              {orders.length > 0 && (
                <div className="py-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400">近期订单快速定位</div>
                  {orders
                    .filter((o) => !cmdQuery || `${o.no} ${o.name}`.toLowerCase().includes(cmdQuery.toLowerCase()))
                    .slice(0, 5)
                    .map((o) => (
                      <button
                        key={o.no}
                        onClick={() => {
                          handleNavigate('orders', { orderNo: o.no });
                          setCmdOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 flex items-center justify-between"
                      >
                        <span className="font-mono font-semibold text-zinc-900">{o.no}</span>
                        <span className="text-zinc-500">
                          {o.name} · ¥{o.total || o.price}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border bg-zinc-900 text-white border-zinc-800 text-xs font-medium">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};
