
/**
 * Simple CSV Parser
 * @param {File} file
 * @returns {Promise<Array>}
 */
export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split(/\r\n|\n/);
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

            const result = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const obj = {};
                const currentline = lines[i].split(',');

                // Basic parsing, handles simple CSVs.
                // For complex CSVs with commas in values, a library is better, 
                // but this suffices for a simple template.
                for (let j = 0; j < headers.length; j++) {
                    let val = currentline[j] ? currentline[j].trim().replace(/^"|"$/g, '') : '';
                    if (val === 'null' || val === 'undefined') val = '';
                    obj[headers[j]] = val;
                }
                result.push(obj);
            }
            resolve(result);
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

/**
 * Download Sample CSV Template
 */
export const downloadSampleTemplate = () => {
    const headers = [
        'name',
        'phone',
        'email',
        'source',
        'status',
        'stage',
        'stage',
        'campaign_name',
        'budget_min',
        'budget_max',
        'type',
        'notes'
    ];

    const sampleRow = [
        'John Doe',
        '9876543210',
        'john@example.com',
        'import',
        'Uncontacted',
        'Screening',
        'Screening',
        'Summer Sale 2026',
        '5000000',
        '7500000',
        'residential',
        'Interested in 2BHK'
    ];

    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + sampleRow.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
