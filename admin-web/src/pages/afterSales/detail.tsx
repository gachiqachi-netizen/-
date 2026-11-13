import React from 'react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { apiRequest, fenToYuan, fmtTime } from '../../api';
import { CONTRACT } from '../../contract';
import { Can } from '../../permissions';

const STATUS_LABELS: Record<string, string> = { ...(CONTRACT.statusLabels.afterSaleStatus || {}) };

const ACTION_LABELS: Record<string, string> = {
  approve: '同意',
  reject: '拒绝',
  returning: '记录退货物流',
  refund: '确认退款',
  receive: '确认收到退货',
  complete: '完成',
  close: '关闭',
};

interface AfterSaleDetail {
  no: string;
  orderNo: string;
  type: string;
  reason?: string;
  userNote?: string;
  status: string;
  refundFen?: number;
  createdAt?: number;
  phone?: string;
  images?: string[];
  allowedActions?: string[];
  history?: Array<{ at?: number; actor?: string; from?: string; to?: string; note?: string }>;
  returnLogistics?: { carrierName?: string; trackingNo?: string };
  result?: string;
}

/** D5b 售后审核抽屉（稿 A09）：底栏按钮来自后端 allowedActions */
const AfterSaleDrawer: React.FC<{
  afterSaleNo: string;
  onClose: () => void;
  onChanged: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
  onViewOrder: (orderNo: string) => void;
}> = ({ afterSaleNo, onClose, onChanged, notify, onViewOrder }) => {
  const [rec, setRec] = React.useState<AfterSaleDetail | null>(null);
  const [error, setError] = React.useState('');
  const [userNote, setUserNote] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [logisticsPrompt, setLogisticsPrompt] = React.useState<{ action: string; carrierName: string; trackingNo: string } | null>(null);

  const load = () => {
    setError('');
    apiRequest<AfterSaleDetail>(`/api/admin/after-sales/${encodeURIComponent(afterSaleNo)}`)
      .then(setRec)
      .catch((e) => setError(e.message));
  };
  React.useEffect(load, [afterSaleNo]);

  const needLogistics = (action: string, type: string) =>
    action === 'returning' || (action === 'complete' && type === '补寄配件');

  const runAction = async (action: string) => {
    if (!rec || busy) return;
    setFormError('');
    if (action === 'reject' && !userNote.trim()) {
      setFormError('拒绝时必须填写“给用户的说明”。');
      return;
    }
    if (needLogistics(action, rec.type)) {
      setLogisticsPrompt({
        action,
        carrierName: rec.returnLogistics?.carrierName || '',
        trackingNo: rec.returnLogistics?.trackingNo || '',
      });
      return;
    }
    setBusy(action);
    try {
      await apiRequest(`/api/admin/after-sales/${encodeURIComponent(afterSaleNo)}/transition`, {
        method: 'PUT',
        body: { action, note: userNote.trim() },
      });
      notify('售后状态已更新');
      setUserNote('');
      load();
      onChanged();
    } catch (err: any) {
      setFormError(err.message || '操作失败');
    } finally {
      setBusy('');
    }
  };

  const submitLogistics = async () => {
    if (!rec || !logisticsPrompt || busy) return;
    if (!logisticsPrompt.carrierName.trim() || !logisticsPrompt.trackingNo.trim()) {
      setFormError('快递公司和单号都要填。');
      return;
    }
    setBusy(logisticsPrompt.action);
    setFormError('');
    try {
      await apiRequest(`/api/admin/after-sales/${encodeURIComponent(afterSaleNo)}/transition`, {
        method: 'PUT',
        body: {
          action: logisticsPrompt.action,
          note: userNote.trim(),
          returnLogistics: {
            carrierName: logisticsPrompt.carrierName.trim(),
            trackingNo: logisticsPrompt.trackingNo.trim(),
          },
        },
      });
      notify('已保存');
      setLogisticsPrompt(null);
      setUserNote('');
      load();
      onChanged();
    } catch (err: any) {
      setFormError(err.message || '操作失败');
    } finally {
      setBusy('');
    }
  };

  const actions = rec?.allowedActions || [];
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid var(--line, #d9d5d1)',
    borderRadius: 8,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  return (
    <Drawer
      title={rec ? `${rec.no} · ${rec.type}` : afterSaleNo}
      subtitle={rec ? `${STATUS_LABELS[rec.status] || rec.status} · ${fmtTime(rec.createdAt)}` : ''}
      onClose={onClose}
      footer={
        rec && actions.length > 0 && !logisticsPrompt ? (
          <>
            {actions.map((action) => (
              <Can key={action} perm={action === 'refund' ? 'refund' : 'process_after_sales'}><span style={{ marginLeft: 8 }}>
                <Button
                  variant={action === 'reject' ? 'danger' : 'primary'}
                  disabled={busy !== ''}
                  onClick={() => runAction(action)}
                >
                  {busy === action ? '提交中…' : (ACTION_LABELS[action] || action)}
                </Button>
              </span></Can>
            ))}
          </>
        ) : undefined
      }
    >
      {error ? <div style={{ color: '#c8302e', fontSize: 13 }}>{error}</div> : null}
      {!rec && !error ? <div className="zy-empty">读取中…</div> : null}
      {rec && (
        <div style={{ display: 'grid', rowGap: 16 }}>
          <div className="zy-card">
            <div className="zy-card-title">申请</div>
            <div style={{ padding: '12px 16px', display: 'grid', rowGap: 8, fontSize: 13 }}>
              <div>类型：{rec.type}</div>
              <div>原因：{rec.reason || '—'}</div>
              <div>用户说明：{rec.userNote || '—'}</div>
              <div>退款金额：{rec.refundFen != null ? `${fenToYuan(rec.refundFen)}（后端算好）` : '—'}</div>
              <div>联系电话：{rec.phone || '—'}</div>
              {Array.isArray(rec.images) && rec.images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {rec.images.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="zy-card">
            <div className="zy-card-title">订单</div>
            <div style={{ padding: '12px 16px', fontSize: 13 }}>
              {rec.orderNo}{' '}
              <span
                className="zy-table-aux"
                style={{ cursor: 'pointer', marginLeft: 4 }}
                onClick={() => onViewOrder(rec.orderNo)}
              >
                看订单 ›
              </span>
            </div>
          </div>

          <div className="zy-card">
            <div className="zy-card-title">处理</div>
            <div style={{ padding: '12px 16px', display: 'grid', rowGap: 8 }}>
              <label style={{ fontSize: 13 }}>
                给用户的说明
                <textarea
                  style={{ ...inputStyle, minHeight: 64, marginTop: 4, resize: 'vertical' }}
                  placeholder="拒绝时必填，用户能看到"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                />
              </label>
              {logisticsPrompt ? (
                <div style={{ display: 'grid', rowGap: 8 }}>
                  <input
                    style={inputStyle}
                    placeholder="快递公司"
                    value={logisticsPrompt.carrierName}
                    onChange={(e) => setLogisticsPrompt({ ...logisticsPrompt, carrierName: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="运单号"
                    value={logisticsPrompt.trackingNo}
                    onChange={(e) => setLogisticsPrompt({ ...logisticsPrompt, trackingNo: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Can perm="process_after_sales"><Button variant="primary" disabled={busy !== ''} onClick={submitLogistics}>
                      {busy === logisticsPrompt.action ? '提交中…' : '保存并继续'}
                    </Button></Can>
                    <Button variant="secondary" onClick={() => setLogisticsPrompt(null)}>取消</Button>
                  </div>
                </div>
              ) : null}
              {formError ? <div style={{ color: '#c8302e', fontSize: 12 }}>{formError}</div> : null}
            </div>
          </div>

          <div className="zy-card">
            <div className="zy-card-title">协商历史</div>
            <div style={{ padding: '12px 16px', display: 'grid', rowGap: 8 }}>
              {(rec.history || []).length === 0 && <div className="zy-empty">还没有记录</div>}
              {(rec.history || []).map((h, i) => (
                <div key={i} style={{ fontSize: 13 }}>
                  <span className="zy-table-aux">{fmtTime(h.at)}</span>{' '}
                  {h.actor ? `${h.actor} ` : ''}
                  {h.from && h.to ? `${STATUS_LABELS[h.from] || h.from} → ${STATUS_LABELS[h.to] || h.to}` : ''}
                  {h.note ? `：${h.note}` : ''}
                </div>
              ))}
              {rec.result ? <div style={{ fontSize: 13 }}>处理结果：{rec.result}</div> : null}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default AfterSaleDrawer;
