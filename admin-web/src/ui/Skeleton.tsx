import React from 'react';

interface SkeletonProps {
  rows?: number;
}

/** 加载中行骨架 */
export const Skeleton: React.FC<SkeletonProps> = ({ rows = 5 }) => {
  return (
    <div className="zy-card" style={{ overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="zy-skeleton-row">
          <div className="zy-skeleton-bar" style={{ width: '18%' }} />
          <div className="zy-skeleton-bar" style={{ width: '30%' }} />
          <div className="zy-skeleton-bar" style={{ width: '14%' }} />
          <div className="zy-skeleton-bar" style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  );
};
