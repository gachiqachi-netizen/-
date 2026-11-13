import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  /** 不可点时按钮下面的一行原因 */
  reason?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  disabled = false,
  reason,
  onClick,
  children,
}) => {
  return (
    <span>
      <button
        type="button"
        className={`zy-btn zy-btn-${variant}`}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </button>
      {disabled && reason && <div className="zy-btn-reason">{reason}</div>}
    </span>
  );
};
