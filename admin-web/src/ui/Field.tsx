import React from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** 表单字段：标签在上、框在下、可带提示和红字错误 */
export const Field: React.FC<FieldProps> = ({ label, hint, error, children }) => {
  return (
    <label className="zy-field">
      <span className="zy-field-label">{label}</span>
      {children}
      {error ? <span className="zy-field-error">{error}</span> : hint ? <span className="zy-field-hint">{hint}</span> : null}
    </label>
  );
};
