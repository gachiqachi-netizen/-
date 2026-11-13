import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

/** D5a：订单详情抽屉里的后台操作——内部备注、发货前改地址、改运单号。 */
const OrdersOpsPanel: React.FC<{
  orderNo: string;
  internalNotes: Array<{ at?: number; actor?: string; text?: string }>;
  shipped: boolean;
  logistics?: { carrierName?: string; carrierCode?: string; trackingNo?: string } | null;
  onChanged: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ orderNo, internalNotes, shipped, logistics, onChanged, notify }) => {
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addr, setAddr] = useState({ person: '', phone: '', addr: '' });
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrError, setAddrError] = useState('');
  const [lgOpen, setLgOpen] = useState(false);
  const [lg, setLg] = useState({ carrierName: '', trackingNo: '' });
  const [lgError, setLgError] = useState('');
  const [savingLg, setSavingLg] = useState(false);

  useEffect(() => {
    setAddrOpen(false);
    setLgOpen(false);
    setNoteText('');
    setAddrError('');
    setLgError('');
  }, [orderNo]);

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text || savingNote) return;
    setSavingNote(true);
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/note`, {
        method: 'PUT',
        body: { text },
      });
      setNoteText('');
      notify('内部备注已保存');
      onChanged();
    } catch (err: any) {
      notify(err.message || '保存备注失败', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const openAddr = () => {
    setAddr({
      person: '',
      phone: '',
      addr: '',
    });
    setAddrError('');
    setAddrOpen(true);
  };

  const saveAddr = async () => {
    if (savingAddr) return;
    if (!addr.person.trim() || !addr.phone.trim() || !addr.addr.trim()) {
      setAddrError('收货人、手机号、地址都要填。');
      return;
    }
    setSavingAddr(true);
    setAddrError('');
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/address`, {
        method: 'PUT',
        body: { person: addr.person.trim(), phone: addr.phone.trim(), addr: addr.addr.trim() },
      });
      notify('地址已修改，原地址已记录在案');
      setAddrOpen(false);
      onChanged();
    } catch (err: any) {
      setAddrError(err.message || '改地址失败');
    } finally {
      setSavingAddr(false);
    }
  };

  const openLg = () => {
    setLg({ carrierName: logistics?.carrierName || '', trackingNo: logistics?.trackingNo || '' });
    setLgError('');
    setLgOpen(true);
  };

  const saveLg = async () => {
    if (savingLg) return;
    if (!lg.carrierName.trim() || !lg.trackingNo.trim()) {
      setLgError('快递公司和运单号都要填。');
      return;
    }
    setSavingLg(true);
    setLgError('');
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/logistics`, {
        method: 'PUT',
        body: { carrierName: lg.carrierName.trim(), trackingNo: lg.trackingNo.trim() },
      });
      notify('运单号已更新');
      setLgOpen(false);
      onChanged();
    } catch (err: any) {
      setLgError(err.message || '更新运单号失败');
    } finally {
      setSavingLg(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid var(--line, #d9d5d1)',
    borderRadius: 8,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  return (
    <>
      {/* 内部备注（只给后台看，按时间列出） */}
      <div className="zy-card" style={{ marginBottom: 16 }}>
        <div className="zy-card-title">内部备注<span style={{ fontWeight: 400, marginLeft: 8, color: 'var(--text-aux)', fontSize: 'var(--font-aux)' }}>只给后台看</span></div>
        <div style={{ padding: '12px 16px', display: 'grid', rowGap: 8 }}>
          {(internalNotes || []).length === 0 && <div className="zy-empty">还没有内部备注</div>}
          {(internalNotes || []).map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
              <span className="zy-table-aux">{n.at ? new Date(n.at).toLocaleString('zh-CN', { hour12: false }) : '-'}</span>
              <span>{n.actor ? `${n.actor}：` : ''}{n.text}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="写一条内部备注，用户看不到"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button
              type="button"
              className="zy-btn zy-btn-secondary"
              disabled={savingNote || !noteText.trim()}
              onClick={saveNote}
            >
              {savingNote ? '保存中…' : '添加'}
            </button>
          </div>
        </div>
      </div>

      {/* 发货前改地址 / 改运单号 */}
      <div className="zy-card" style={{ marginBottom: 16 }}>
        <div className="zy-card-title">后台操作</div>
        <div style={{ padding: '12px 16px', display: 'grid', rowGap: 12 }}>
          {!shipped && !addrOpen && (
            <button type="button" className="zy-btn zy-btn-secondary" style={{ justifySelf: 'start' }} onClick={openAddr}>
              改地址（发货前）
            </button>
          )}
          {!shipped && addrOpen && (
            <div style={{ display: 'grid', rowGap: 8, maxWidth: 420 }}>
              <input style={inputStyle} placeholder="收货人" value={addr.person} onChange={(e) => setAddr({ ...addr, person: e.target.value })} />
              <input style={inputStyle} placeholder="手机号" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
              <input style={inputStyle} placeholder="地址" value={addr.addr} onChange={(e) => setAddr({ ...addr, addr: e.target.value })} />
              {addrError && <div style={{ color: '#c8302e', fontSize: 12 }}>{addrError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="zy-btn zy-btn-primary" disabled={savingAddr} onClick={saveAddr}>
                  {savingAddr ? '保存中…' : '保存新地址'}
                </button>
                <button type="button" className="zy-btn zy-btn-secondary" onClick={() => setAddrOpen(false)}>取消</button>
              </div>
            </div>
          )}
          {shipped && !lgOpen && (
            <button type="button" className="zy-btn zy-btn-secondary" style={{ justifySelf: 'start' }} onClick={openLg}>
              改运单号
            </button>
          )}
          {shipped && lgOpen && (
            <div style={{ display: 'grid', rowGap: 8, maxWidth: 420 }}>
              <input style={inputStyle} placeholder="快递公司" value={lg.carrierName} onChange={(e) => setLg({ ...lg, carrierName: e.target.value })} />
              <input style={inputStyle} placeholder="运单号" value={lg.trackingNo} onChange={(e) => setLg({ ...lg, trackingNo: e.target.value })} />
              {lgError && <div style={{ color: '#c8302e', fontSize: 12 }}>{lgError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="zy-btn zy-btn-primary" disabled={savingLg} onClick={saveLg}>
                  {savingLg ? '保存中…' : '保存运单号'}
                </button>
                <button type="button" className="zy-btn zy-btn-secondary" onClick={() => setLgOpen(false)}>取消</button>
              </div>
            </div>
          )}
          {shipped && (
            <div className="zy-table-aux" style={{ fontSize: 12 }}>
              已发货，地址不能再改；用户看到的发货信息以这里保存的快递和单号为准。
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersOpsPanel;
