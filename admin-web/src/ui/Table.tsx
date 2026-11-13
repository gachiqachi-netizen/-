import React from 'react';

export interface TableColumn<Row> {
  title: string;
  width?: number | string;
  render: (row: Row) => React.ReactNode;
}

interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  empty?: React.ReactNode;
}

/** 表格：表头灰小字、行高 52（--row-h）、行可点 */
export function Table<Row>({ columns, rows, rowKey, onRowClick, empty }: TableProps<Row>) {
  return (
    <div className="zy-card" style={{ overflow: 'hidden' }}>
      <table className="zy-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.width !== undefined ? { width: col.width } : undefined}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'zy-table-row' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col, i) => (
                <td key={i}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="zy-empty">{empty || '暂无数据'}</div>}
    </div>
  );
}
