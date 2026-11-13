import React from 'react';
import { CONTRACT } from '../contract';

interface StatusTextProps {
  /** 契约里的展示状态代码（opsStatus），缺省时直接显示 text */
  code?: string | null;
  text?: string;
  danger?: boolean;
}

/** 文字状态（不用彩色徽章）：danger 时红字。状态词只从契约取 */
export const StatusText: React.FC<StatusTextProps> = ({ code, text, danger }) => {
  let label = text ?? '—';
  let isDanger = Boolean(danger);
  if (code) {
    const hit = (CONTRACT.opsStatus as Record<string, { label: string; danger: boolean }>)[code];
    if (hit) {
      label = hit.label;
      isDanger = hit.danger;
    } else {
      console.warn(`[contract] 找不到 opsStatus 的中文：${code}`);
      label = code;
    }
  }
  return <span className={isDanger ? 'zy-danger-text' : undefined}>{label}</span>;
};
