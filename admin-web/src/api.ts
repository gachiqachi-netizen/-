// 状态代码和中文只从契约取（A1 导出，见 contract.ts），这里只做查表，不写对照。
import { CONTRACT } from './contract';

const LABEL_GROUPS: Record<string, Record<string, string>> = {
  orderStatus: CONTRACT.statusLabels.orderStatus,
  paymentStatus: CONTRACT.statusLabels.paymentStatus,
  fulfillmentStatus: CONTRACT.statusLabels.fulfillmentStatus,
  logisticsStatus: CONTRACT.statusLabels.logisticsStatus,
  afterSaleStatus: CONTRACT.statusLabels.afterSaleStatus,
  productTypes: CONTRACT.productTypes,
  productStatuses: CONTRACT.productStatuses,
  termStatuses: CONTRACT.termStatuses,
  termScenarios: CONTRACT.termScenarios,
  workOrderStatuses: CONTRACT.workOrderStatuses,
  qualityGateItems: CONTRACT.qualityGateItems,
};

export function labelOf(group: string, value?: string | null): string {
  if (!value) return '-';
  const table = LABEL_GROUPS[group];
  const hit = table && table[value];
  if (!hit) {
    console.warn(`[contract] 找不到 ${group} 的中文：${value}`);
    return value;
  }
  return hit;
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
    err.need = data.need;
    if (res.status === 403 && data.need) err.message = `需要“${data.need}”，找负责人开通。`;
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
