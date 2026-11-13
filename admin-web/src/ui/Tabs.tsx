import React from 'react';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

/** 状态分栏：每项带数量 */
export const Tabs: React.FC<TabsProps> = ({ items, active, onChange }) => {
  return (
    <div className="zy-tabs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`zy-tab ${active === item.key ? 'zy-tab-on' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined && <span className="zy-tab-count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
};
