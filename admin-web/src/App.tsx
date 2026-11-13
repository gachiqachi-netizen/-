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

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3200);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [bRes, tRes, oRes, aRes, tmRes, bnRes, auRes, kbRes] = await Promise.all([
        apiRequest<any[]>('/api/admin/beads'),
        apiRequest<any[]>('/api/admin/templates'),
        apiRequest<any[]>('/api/admin/orders'),
        apiRequest<any[]>('/api/admin/after-sales').catch(() => []),
        apiRequest<any[]>('/api/admin/terms').catch(() => []),
        apiRequest<any[]>('/api/admin/banners').catch(() => []),
        apiRequest<any[]>('/api/admin/audit').catch(() => []),
        apiRequest<any>('/api/kb/materials').catch(() => ({ items: [] })),
      ]);
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
      if (err.status === 401 || err.status === 403) {
        setAuthed(false);
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
    return <LoginPage onAuthenticated={loadAllData} />;
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
