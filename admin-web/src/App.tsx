import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest, setSavedToken } from './api';
import { Shell } from './layout/Shell';
import TodayPage from './pages/today';
import OrdersPage from './pages/orders';
import AfterSalesPage from './pages/afterSales';
import ProductsPage from './pages/products';
import TemplatesPage from './pages/templates';
import TermsPage from './pages/terms';
import AuditPage from './pages/audit';
import WorkOrdersPage from './pages/workOrders';
import ReviewsPage from './pages/reviews';
import KnowledgePage from './pages/knowledge';
import HomePage from './pages/home';
import ArticlesPage from './pages/articles';
import AccountsPage from './pages/accounts';
import LoginPage from './pages/login';
import { AdminMe, can, setPermissions } from './permissions';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const App: React.FC = () => {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('today');
  const [orderQuery, setOrderQuery] = useState('');
  const [orderTab, setOrderTab] = useState('all');

  const [beads, setBeads] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [afterSales, setAfterSales] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [kbMaterials, setKbMaterials] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deniedBlocks, setDeniedBlocks] = useState<Record<string, string>>({});

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3200);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const current = await apiRequest<AdminMe>('/api/admin/me');
      setPermissions(current.permissions);
      const denied: Record<string, string> = {};
      const section = async <T,>(key: string, perm: string | null, path: string, empty: T): Promise<T> => {
        if (perm && !can(perm)) return empty;
        try { return await apiRequest<T>(path); }
        catch (err: any) {
          if (err.status === 401) throw err;
          if (err.status === 403) { denied[key] = err.need || '没有权限'; return empty; }
          throw err;
        }
      };
      const [bRes, tRes, oRes, aRes, tmRes, bnRes, auRes, kbRes] = await Promise.all([
        section<any[]>('products', 'edit_products', '/api/admin/beads', []),
        section<any[]>('templates', 'edit_templates', '/api/admin/templates', []),
        section<any[]>('orders', 'view_orders', '/api/admin/orders', []),
        section<any[]>('afterSales', 'process_after_sales', '/api/admin/after-sales', []),
        section<any[]>('terms', 'publish_terms', '/api/admin/terms', []),
        section<any[]>('home', 'edit_content', '/api/admin/banners', []),
        section<any[]>('audit', 'manage_accounts', '/api/admin/audit', []),
        section<any>('knowledge', null, '/api/kb/materials', { items: [] }),
      ]);
      setDeniedBlocks(denied);
      setBeads(Array.isArray(bRes) ? bRes : []);
      setTemplates(Array.isArray(tRes) ? tRes : []);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setAfterSales(Array.isArray(aRes) ? aRes : []);
      setTerms(Array.isArray(tmRes) ? tmRes : []);
      setBanners(Array.isArray(bnRes) ? bnRes : []);
      setAuditLogs(Array.isArray(auRes) ? auRes : []);
      setKbMaterials(Array.isArray(kbRes) ? kbRes : kbRes?.items || kbRes?.materials || []);
      setAuthed(true);
    } catch (err: any) {
      if (err.status === 401) {
        setAuthed(false);
      } else if (err.status === 403) {
        setDeniedBlocks({ current: err.need || '没有权限' });
        setAuthed(true);
      } else {
        notify(err.message || '数据加载异常', 'error');
      }
    }
  }, [notify]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
    } catch (err: any) {
      setLoginError(err.message || '口令验证未通过，请确认口令');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/admin/session', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setSavedToken('');
    setPermissions([]);
    setAuthed(false);
  };

  const handleSearch = (q: string) => {
    if (!q) return;
    setOrderQuery(q);
    setPage('orders');
  };

  const handleNavigate = (next: string, payload?: { tab?: string }) => {
    if (payload?.tab) setOrderTab(payload.tab);
    setPage(next);
  };

  if (authed === false) {
    return <LoginPage onAuthenticated={() => loadAllData()} />;
  }

  if (authed !== true) {
    return null;
  }

  const now = new Date();
  const todaySubtitle = `${now.getMonth() + 1} 月 ${now.getDate()} 日 星期${WEEKDAYS[now.getDay()]}`;
  // 菜单右侧数字：做单 = 待领料 + 质检不通过；售后 = 待处理（12 第 2 节）
  const counts: Record<string, number> = {
    workOrders: orders.filter((o) => o.workOrder?.step === '待领料' || o.qualityGate?.status === 'failed').length,
    afterSales: afterSales.filter((a) => a.status === 'requested' || a.status === 'reviewing').length,
  };

  return (
    <Shell
      active={page}
      subtitle={page === 'today' ? todaySubtitle : undefined}
      counts={counts}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onLogout={handleLogout}
    >
      {deniedBlocks[page] && <div role="alert">没有权限：需要“{deniedBlocks[page]}”，找负责人开通。</div>}
      {page === 'today' && (
        <TodayPage
          orders={orders}
          afterSales={afterSales}
          beads={beads}
          auditLogs={auditLogs}
          onNavigate={handleNavigate}
        />
      )}
      {page === 'orders' && (
        <OrdersPage
          orders={orders}
          initialQuery={orderQuery}
          initialTab={orderTab}
          onRefresh={loadAllData}
          notify={notify}
        />
      )}
      {page === 'afterSales' && (
        <AfterSalesPage afterSales={afterSales} orders={orders} onRefresh={loadAllData} notify={notify} />
      )}
      {page === 'products' && (
        <ProductsPage beads={beads} kbMaterials={kbMaterials} onRefresh={loadAllData} notify={notify} />
      )}
      {page === 'templates' && (
        <TemplatesPage templates={templates} beads={beads} onRefresh={loadAllData} notify={notify} />
      )}
      {page === 'terms' && (
        <TermsPage terms={terms} beads={beads} templates={templates} onRefresh={loadAllData} notify={notify} />
      )}
      {page === 'audit' && <AuditPage banners={banners} auditLogs={auditLogs} />}
      {page === 'workOrders' && <WorkOrdersPage />}
      {page === 'reviews' && <ReviewsPage />}
      {page === 'knowledge' && <KnowledgePage />}
      {page === 'home' && <HomePage />}
      {page === 'articles' && <ArticlesPage />}
      {page === 'accounts' && <AccountsPage />}

      {toast && <div className="zy-toast">{toast.msg}</div>}
    </Shell>
  );
};
