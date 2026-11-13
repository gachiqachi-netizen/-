import React from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  reason: string;
  onRetry: () => void;
}

/** 失败状态：一句原因 + 再试一次 */
export const ErrorState: React.FC<ErrorStateProps> = ({ reason, onRetry }) => {
  return (
    <div className="zy-error-state">
      <div>{reason || '加载失败'}</div>
      <Button variant="secondary" onClick={onRetry}>
        再试一次
      </Button>
    </div>
  );
};
