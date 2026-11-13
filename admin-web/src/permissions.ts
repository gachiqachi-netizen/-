/** 后台页面入口对应的后端权限点。今天和知识库浏览对所有账号开放。 */
export const PAGE_PERMISSIONS: Record<string, { key: string; name: string } | null> = {
  today: null,
  workOrders: { key: 'view_work_orders', name: '看工单' },
  orders: { key: 'view_orders', name: '看订单' },
  afterSales: { key: 'process_after_sales', name: '处理售后' },
  reviews: { key: 'moderate_reviews', name: '审核评价' },
  products: { key: 'edit_products', name: '编辑商品' },
  templates: { key: 'edit_templates', name: '编辑模板' },
  knowledge: null,
  home: { key: 'edit_content', name: '编辑首页和文章' },
  articles: { key: 'edit_content', name: '编辑首页和文章' },
  terms: { key: 'publish_terms', name: '编辑和发布条款' },
  accounts: { key: 'manage_accounts', name: '管理账号和权限' },
  audit: { key: 'manage_accounts', name: '管理账号和权限' },
};

export interface AdminMe {
  name: string;
  roleName: string;
  permissions: string[];
  permissionNames: string[];
}

export function canPage(page: string, me: AdminMe): boolean {
  const required = PAGE_PERMISSIONS[page];
  return required === null || (!!required && me.permissions.includes(required.key));
}

export function pageNeed(page: string): string {
  return PAGE_PERMISSIONS[page]?.name || '';
}
