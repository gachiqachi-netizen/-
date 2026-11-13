import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest, fmtTime } from '../../api';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Skeleton } from '../../ui/Skeleton';
import { CONTRACT } from '../../contract';
import { Can } from '../../permissions';

const STEPS: string[] = [...CONTRACT.workOrderSteps];
const QC_ITEMS: Array<{ key: string; label: string }> = Object.entries(CONTRACT.qualityGateItems).map(
  ([key, label]) => ({ key, label: String(label) })
);

interface SeqEntry {
  seq: number;
  id: string;
  name: string;
  mm?: number;
  photo?: string;
}
interface BomItem {
  id: string;
  name: string;
  mm?: number;
  count: number;
  positions: number[];
}
interface WorkOrder {
  workOrderNo: string;
  orderNo: string;
  orderName: string;
  status: string;
  step: string;
  assignee: string;
  mockPayment: boolean;
  customerNote: string;
  giftCard?: string;
  hidePrice?: boolean;
  wrist?: number;
  count?: number;
  lengthMm?: number | string;
  createdAt?: number;
  sequence: SeqEntry[];
  materials: BomItem[];
  qualityGate?: { passed?: boolean; inspector?: string; note?: string; checkedAt?: number } | null;
  operatorNote?: string;
}

const pickedKey = (woNo: string) => `wo-picked-${woNo}`;
const readPicked = (woNo: string): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(pickedKey(woNo)) || '{}');
  } catch {
    return {};
  }
};

/** D4 工单页（稿 A04/A05）：珠序网格 + 领料勾选（只存本机）+ 五段工序 + 质检 */
const WorkOrderDetail: React.FC<{ orderNo: string; nextNo: string; onBack: () => void; onNext: (no: string) => void }> = ({
  orderNo,
  nextNo,
  onBack,
  onNext,
}) => {
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [error, setError] = useState('');
  const [assignee, setAssignee] = useState('');
  const [savingStep, setSavingStep] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [inspectorName, setInspectorName] = useState('');
  const [failNote, setFailNote] = useState('');
  const [qcError, setQcError] = useState('');
  const [qcBusy, setQcBusy] = useState('');

  const load = () => {
    setError('');
    apiRequest<WorkOrder>(`/api/admin/orders/${encodeURIComponent(orderNo)}/work-order`)
      .then((w) => {
        setWo(w);
        setAssignee(w.assignee || '');
        setPicked(readPicked(w.workOrderNo));
        if (w.qualityGate && w.qualityGate.passed === false) {
          setFailNote(w.qualityGate.note || '');
        }
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, [orderNo]);
  useEffect(() => {
    localStorage.removeItem('wo-inspector');
    apiRequest<{ name: string }>('/api/admin/me')
      .then((current) => setInspectorName(current.name || ''))
      .catch((e) => setQcError(e.message || '当前账号读取失败'));
  }, []);

  const saveStep = (step: string) => {
    if (!wo || step === wo.step) return;
    setSavingStep(step);
    apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/work-order`, { method: 'PUT', body: { step } })
      .then(load)
      .catch((e) => setError(e.message))
      .finally(() => setSavingStep(''));
  };

  const saveAssignee = () => {
    if (!wo || (assignee || '') === (wo.assignee || '')) return;
    apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/work-order`, {
      method: 'PUT',
      body: { assignee },
    })
      .then(load)
      .catch((e) => setError(e.message));
  };

  const togglePicked = (id: string) => {
    if (!wo) return;
    const next = { ...picked, [id]: !picked[id] };
    setPicked(next);
    localStorage.setItem(pickedKey(wo.workOrderNo), JSON.stringify(next));
  };

  const allChecked = QC_ITEMS.every((item) => checks[item.key]);

  const submitQc = (pass: boolean) => {
    if (!wo) return;
    setQcError('');
    if (!pass && !failNote.trim()) {
      setQcError('质检不通过时必须填写原因说明。');
      return;
    }
    if (!inspectorName) {
      setQcError('当前账号读取失败，请刷新后再试。');
      return;
    }
    setQcBusy(pass ? 'pass' : 'fail');
    apiRequest(`/api/admin/orders/${encodeURIComponent(orderNo)}/quality-gate`, {
      method: 'PUT',
      body: {
        sequenceOk: !!checks.sequenceOk,
        sizeOk: !!checks.sizeOk,
        materialOk: !!checks.materialOk,
        appearanceOk: !!checks.appearanceOk,
        note: failNote.trim(),
      },
    })
      .then(() => {
        setChecks({});
        setFailNote('');
        load();
      })
      .catch((e) => setQcError(e.message))
      .finally(() => setQcBusy(''));
  };

  const seqPositions = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const s of wo?.sequence || []) {
      (map[s.id] = map[s.id] || []).push(s.seq);
    }
    return map;
  }, [wo]);

  if (error && !wo) return <ErrorState reason={error} onRetry={load} />;
  if (!wo) return <Skeleton rows={6} />;

  const lastQcFailed = wo.qualityGate && wo.qualityGate.passed === false;

  return (
    <div>
      <div className="wo-detail-head no-print">
        <Button variant="secondary" onClick={onBack}>‹ 返回列表</Button>
        <span className="wo-detail-title">{wo.orderName}</span>
        <span className="wo-meta">
          工单 {wo.workOrderNo} · 订单 {wo.orderNo} · {fmtTime(wo.createdAt)} 下单
        </span>
        <span style={{ flex: 1 }} />
        <Button variant="secondary" onClick={() => window.print()}>打印工单</Button>
        {nextNo ? (
          <Button variant="secondary" onClick={() => onNext(nextNo)}>下一单 ›</Button>
        ) : null}
      </div>
      {error ? <div className="wo-qcfail">{error}</div> : null}

      {wo.mockPayment ? <div className="wo-mock">模拟付款，不要生产</div> : null}

      {lastQcFailed ? (
        <div className="wo-qcfail">
          上次质检不通过（{wo.qualityGate?.inspector}，{fmtTime(wo.qualityGate?.checkedAt)}）：
          {wo.qualityGate?.note}。重做后再质检一次。
        </div>
      ) : null}

      <div className="wo-stats">
        <div className="wo-stat"><div className="n">{wo.wrist ?? '—'}</div><div className="l">手围 cm</div></div>
        <div className="wo-stat"><div className="n">{wo.count ?? '—'}</div><div className="l">颗数</div></div>
        <div className="wo-stat"><div className="n">{wo.lengthMm ?? '—'}</div><div className="l">总长 mm</div></div>
        <Can perm="work_orders"><div className="wo-assignee">
          负责人
          <input
            className="wo-input"
            style={{ width: 140 }}
            value={assignee}
            placeholder="未分配"
            onChange={(e) => setAssignee(e.target.value)}
            onBlur={saveAssignee}
          />
        </div></Can>
      </div>

      <Can perm="work_orders"><div className="wo-steps no-print" role="tablist" aria-label="工序">
        {STEPS.map((s) => (
          <button
            key={s}
            type="button"
            className={`wo-step ${wo.step === s ? 'wo-step-on' : ''}`}
            disabled={savingStep === s}
            onClick={() => saveStep(s)}
          >
            {s}
          </button>
        ))}
      </div></Can>

      {wo.customerNote ? <div className="wo-note">客户备注：{wo.customerNote}</div> : null}
      {wo.giftCard ? <div className="wo-note"><strong>贺卡</strong><div className="wo-gift-card">{wo.giftCard}</div></div> : null}
      {wo.hidePrice ? <div className="wo-note wo-red">包裹里不放带价格的单据</div> : null}
      {wo.operatorNote ? <div className="wo-note">作业备注：{wo.operatorNote}</div> : null}

      <div className="wo-section-title">按顺序穿（从 1 开始，穿完回到 1 打结）</div>
      <div className="wo-seq">
        {wo.sequence.map((s) => (
          <div key={s.seq} className="wo-cell">
            <span className="wo-seqno">{s.seq}</span>
            <span className="wo-bead">
              {s.photo ? <img src={s.photo} alt="" /> : (s.name || '').slice(0, 1)}
            </span>
            <span className="wo-beadname">{s.name}{s.mm ? ` ${s.mm}mm` : ''}</span>
          </div>
        ))}
      </div>

      <div className="wo-section-title">领料清单（已领只存在本机）</div>
      <table className="wo-bom">
        <thead>
          <tr><th style={{ width: 40 }}></th><th>珠子</th><th style={{ width: 80 }}>尺寸</th><th style={{ width: 60 }}>数量</th><th>位置</th></tr>
        </thead>
        <tbody>
          {(wo.materials || []).map((m) => (
            <tr key={m.id}>
              <td>
                <Can perm="work_orders"><input
                  type="checkbox"
                  aria-label={`已领 ${m.name}`}
                  checked={!!picked[m.id]}
                  onChange={() => togglePicked(m.id)}
                /></Can>
              </td>
              <td>{m.name}</td>
              <td>{m.mm ? `${m.mm}mm` : '—'}</td>
              <td>{m.count}</td>
              <td className="wo-pos">
                {(seqPositions[m.id] || []).map((p) => `#${p}`).join(' ') || `其余 ${m.count} 颗`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Can perm="quality_gate"><div className="wo-qc no-print">
        <div className="wo-section-title" style={{ marginTop: 0 }}>质检</div>
        {QC_ITEMS.map((item) => (
          <label key={item.key} className="wo-qc-row">
            <input
              type="checkbox"
              checked={!!checks[item.key]}
              onChange={() => setChecks({ ...checks, [item.key]: !checks[item.key] })}
            />
            {item.label}
            {item.key === 'sizeOk' && wo.lengthMm ? `（量出来 ${wo.lengthMm}mm）` : ''}
          </label>
        ))}
        <div className="wo-qc-fields">
          <label>
            质检人
            <div>{inspectorName || '正在读取当前账号…'}</div>
          </label>
          <label>
            不通过原因
            <textarea
              style={{ width: '100%' }}
              value={failNote}
              placeholder="四项都勾上就不用填"
              onChange={(e) => setFailNote(e.target.value)}
            />
          </label>
        </div>
        <div className="wo-qc-actions">
          {allChecked ? (
            <Button
              variant="primary"
              disabled={qcBusy !== ''}
              onClick={() => submitQc(true)}
            >
              {qcBusy === 'pass' ? '提交中…' : '通过，可以发货'}
            </Button>
          ) : (
            <span style={{ alignSelf: 'center' }} className="wo-spec">四项全勾上才能点“通过”</span>
          )}
          <Button
            variant={allChecked ? 'secondary' : 'primary'}
            disabled={qcBusy !== ''}
            onClick={() => submitQc(false)}
          >
            {qcBusy === 'fail' ? '提交中…' : '不通过，退回重做'}
          </Button>
        </div>
        {qcError ? <div className="wo-qc-error">{qcError}</div> : null}
      </div></Can>

      {/* 打印视图：只留珠序和领料清单 */}
      <div className="print-only">
        <h2>{wo.orderName} · 工单 {wo.workOrderNo}</h2>
        <p>手围 {wo.wrist}cm · {wo.count} 颗 · 总长 {wo.lengthMm}mm</p>
        {wo.customerNote ? <p>客户备注：{wo.customerNote}</p> : null}
        <ol>
          {wo.sequence.map((s) => (
            <li key={s.seq}>{s.name}{s.mm ? ` ${s.mm}mm` : ''}</li>
          ))}
        </ol>
        <table className="wo-bom">
          <tbody>
            {(wo.materials || []).map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.mm ? `${m.mm}mm` : ''}</td>
                <td>{m.count} 颗</td>
                <td>{(seqPositions[m.id] || []).map((p) => `#${p}`).join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkOrderDetail;
