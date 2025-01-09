export const rowToCsvData = (row: any): string => {
    return Object.values(row)
        .map((value) => {
            if (value instanceof Date) {
                return value.toISOString();
            }

            if (typeof value === 'string' && /GMT/i.test(value)) {
                return value.replace(/GMT([+-]\d{4})/, (_, offset) => {
                    return `${offset.slice(0, 3)}:${offset.slice(3)}`;
                });
            }

            return value && `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',') + '\n';
}