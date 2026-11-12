export const LABELS: Record<string, Record<string, string>> = {
  productType: {
    bead: '珠子',
    spacer: '隔片',
    charm: '吊坠',
    cord: '线材',
    pack: '包装',
  },
  productStatus: {
    draft: '草稿',
    on_sale: '上架中',
    off_sale: '已下架',
    archived: '已归档',
  },
  orderStatus: {
    pending_confirmation: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    closed: '已关闭',
  },
  paymentStatus: {
    unpaid: '未支付',
    paid: '已支付',
    refund_pending: '退款处理中',
    refunded: '已退款',
  },
  fulfillmentStatus: {
    unfulfilled: '待排产',
    in_production: '手工制作中',
    ready_to_ship: '质检通过待发',
    shipped: '已发货',
    completed: '已签收完成',
  },
  shippingStatus: {
    not_shipped: '未发货',
    in_transit: '运输中',
    delivered: '已妥投',
  },
  afterSaleStatus: {
    none: '无售后',
    applied: '待审核',
    approved: '已同意',
    rejected: '已拒绝',
    returned: '退货已收',
    completed: '售后完成',
    closed: '已关闭',
  },
  workStep: {
    pending: '待领料排产',
    picking: '按BOM配珠中',
    stringing: '手工穿制中',
    rechecking: '尺寸复核中',
    qc: '待终检放行',
    packed: '已包装待发',
  },
  scenarios: {
    custom_bracelet: 'DIY 定制手串',
    template_order: '同款模板下单',
    natural_mineral: '天然矿石/晶石材质',
    metal_accessory: '含金属配饰/隔珠',
    gift_pack: '礼盒包装订单',
  },
};

export function labelOf(group: string, value?: string | null): string {
  if (!value) return '-';
  return (LABELS[group] && LABELS[group][value]) || value;
}

export function fmtTime(ts?: number | string | null): string {
  if (!ts) return '-';
  const num = Number(ts);
  const d = new Date(num > 1e12 ? num : num * 1000);
  if (Number.isNaN(d.getTime())) return String(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fenToYuan(fen?: number | null): string {
  return (Number(fen || 0) / 100).toFixed(2);
}

export function yuanToFen(yuan?: string | number | null): number {
  return Math.round(Number(yuan || 0) * 100);
}

const TOKEN_STORAGE_KEY = 'cgz_admin_bearer_token';

export function getSavedToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers || {}) };
  const token = getSavedToken();
  if (token) {
    headers['X-Admin-Token'] = token;
  }
  let bodyPayload: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
    bodyPayload = JSON.stringify(options.body);
  }
  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: bodyPayload,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.message || data.error || `请求失败 (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export async function uploadImageFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  const base64 = btoa(binary);
  const res = await apiRequest<{ url: string }>('/api/upload', {
    method: 'POST',
    body: {
      filename: file.name,
      contentType: file.type || 'image/png',
      data: base64,
    },
  });
  return res.url;
}
