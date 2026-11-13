import React from 'react';

interface EmptyStateProps {
  text: string;
  action?: React.ReactNode;
}

/** 空状态：一句话 + 出路 */
export const EmptyState: React.FC<EmptyStateProps> = ({ text, action }) => {
  return (
    <div className="zy-empty">
      <div>{text}</div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
};
