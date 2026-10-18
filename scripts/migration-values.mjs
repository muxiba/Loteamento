const jsonColumns = {
  config: new Set(['value']),
  lots: new Set(['payments', 'administrative_docs']),
  users: new Set(['simulation', 'profile']),
};

export function migrationValues(table, row) {
  return Object.entries(row).map(([column, value]) => {
    if (value === null || value === undefined) return null;
    return jsonColumns[table]?.has(column) ? JSON.stringify(value) : value;
  });
}
