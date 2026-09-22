import React from 'react';
import Input from './Input';
import Select from './Select';

const Table = ({ columns, data, loading = false, onRowClick, filters = {}, onFilterChange }) => {
  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap align-top"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap align-top"
                style={{ minWidth: col.minWidth }}
              >
                <div className="mb-2">{col.header}</div>
                {col.filterKey && col.filterType === 'select' && (
                  <div className="mt-1 font-normal normal-case">
                    <Select
                      className="py-1.5 text-xs bg-white h-8"
                      containerClassName="gap-0"
                      placeholder={col.filterPlaceholder || "All"}
                      options={col.filterOptions || []}
                      value={filters[col.filterKey] || ''}
                      onChange={(e) => handleFilterChange(col.filterKey, e.target.value)}
                    />
                  </div>
                )}
                {col.filterKey && col.filterType === 'text' && (
                  <div className="mt-1 font-normal normal-case">
                    <Input
                      className="py-1.5 text-xs bg-white h-8"
                      containerClassName="gap-0"
                      placeholder={col.filterPlaceholder || "Search..."}
                      value={filters[col.filterKey] || ''}
                      onChange={(e) => handleFilterChange(col.filterKey, e.target.value)}
                    />
                  </div>
                )}
                {col.filterKey && col.filterType === 'date' && (
                  <div className="mt-1 font-normal normal-case">
                    <Input
                      type="date"
                      className="py-1.5 text-xs bg-white h-8"
                      containerClassName="gap-0"
                      value={filters[col.filterKey] || ''}
                      onChange={(e) => handleFilterChange(col.filterKey, e.target.value)}
                    />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={[
                'table-row-hover transition-colors duration-100',
                onRowClick ? 'cursor-pointer' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3.5 text-gray-700 whitespace-nowrap"
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
