/**
 * Table Helper for GIYA
 * Adds consistent Department column to tables
 */

document.addEventListener('DOMContentLoaded', function() {
    // After a short delay to let other scripts initialize tables
    setTimeout(() => {
        // Find all DataTables
        $('table.dataTable').each(function() {
            try {
                const table = $(this).DataTable();

                // Check if table already has Department column
                const headers = table.columns().header().toArray();
                let hasDepartment = false;

                for (let i = 0; i < headers.length; i++) {
                    if (headers[i].textContent.includes('Department')) {
                        hasDepartment = true;
                        // Make sure it's visible
                        table.column(i).visible(true);
                        break;
                    }
                }

                // If no department column, check if we can add it
                if (!hasDepartment) {
                    console.log('Table is missing Department column. Consider adding it to HTML structure.');
                }
            } catch (e) {
                console.warn('Error checking table for Department column:', e);
            }
        });
    }, 1000); // Wait 1 second for tables to initialize
});

/**
 * Fixes tables that may have hidden or missing Department columns
 * @param {string} tableSelector - CSS selector for the DataTable
 */
function fixTableDepartmentColumn(tableSelector) {
    try {
        if (!$.fn.DataTable.isDataTable(tableSelector)) {
            console.warn('Not a DataTable:', tableSelector);
            return;
        }

        const table = $(tableSelector).DataTable();
        const columnDefs = table.settings().init().columnDefs || [];

        // Force the Department column to be visible if it exists
        table.columns().every(function() {
            const header = this.header();
            if (header && header.textContent.includes('Department')) {
                this.visible(true);
                console.log('Department column made visible');
            }
        });
    } catch (e) {
        console.error('Error fixing Department column:', e);
    }
}

// Make it available globally
window.fixTableDepartmentColumn = fixTableDepartmentColumn;
