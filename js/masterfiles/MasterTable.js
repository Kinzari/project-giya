/**
 * MasterTable - Utility functions for DataTables implementation
 */
const MasterTable = {
    /**
     * Initialize a DataTable with standard configuration
     * @param {string} selector - Table selector
     * @param {Array} columns - Column definitions
     * @param {Object} options - Additional DataTable options
     * @returns {Object} DataTable instance
     */
    initTable: function(selector, columns, options = {}) {
        const defaultOptions = {
            responsive: true,
            language: {
                emptyTable: "No data available",
                zeroRecords: "No matching records found",
                searchPlaceholder: "Search...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search...')
                    .addClass('form-control-search');
            }
        };


        const mergedOptions = { ...defaultOptions, ...options, columns };


        const table = $(selector).DataTable(mergedOptions);

        return table;
    },

    /**
     * Render action buttons for DataTables
     * @param {string|number} id - Row ID
     * @param {Object} options - Button options (view, edit, delete)
     * @returns {string} HTML for buttons
     */
    renderActionButtons: function(id, options = {}) {
        const { view = true, edit = true, delete: deleteBtn = true } = options;

        let html = '<div class="d-flex gap-1">';

        if (view) {
            html += `<button class="btn btn-sm btn-primary view-btn" data-id="${id}">
                <i class="bi bi-eye"></i>
            </button>`;
        }

        if (edit) {
            html += `<button class="btn btn-sm btn-primary edit-btn" data-id="${id}">
                <i class="bi bi-pencil"></i>
            </button>`;
        }

        if (deleteBtn) {
            html += `<button class="btn btn-sm btn-danger delete-btn" data-id="${id}">
                <i class="bi bi-trash"></i>
            </button>`;
        }

        html += '</div>';
        return html;
    },

    /**
     * Render a status badge
     * @param {string|number} status - Status value
     * @returns {string} HTML for badge
     */
    renderStatusBadge: function(status) {
        const isActive = Number(status) === 1;
        const badgeClass = isActive ? "bg-success" : "bg-danger";
        const statusText = isActive ? "Active" : "Inactive";

        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    }
};
