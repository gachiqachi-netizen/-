import React from 'react';

interface DrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** 底栏操作：主操作放最右，danger 放左边（传带 zy-drawer-foot-left 的节点或靠组件顺序） */
  footer?: React.ReactNode;
}

/** 右侧抽屉：宽 560、头部标题加副标题、中间可滚、底栏操作右对齐 */
export const Drawer: React.FC<DrawerProps> = ({ title, subtitle, onClose, children, footer }) => {
  return (
    <>
      <div className="zy-drawer-mask" onClick={onClose} />
      <div className="zy-drawer">
        <div className="zy-drawer-head">
          <div>
            <div className="zy-drawer-title">{title}</div>
            {subtitle && <div className="zy-drawer-sub">{subtitle}</div>}
          </div>
          <button type="button" className="zy-drawer-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className="zy-drawer-body">{children}</div>
        {footer && <div className="zy-drawer-foot">{footer}</div>}
      </div>
    </>
  );
};
