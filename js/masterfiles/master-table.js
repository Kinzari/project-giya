const MasterTable = {

    defaults: {
        dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
        pageLength: 10,
        processing: true,
        serverSide: false,
        responsive: true,
        autoWidth: false,
        scrollX: false,
        scrollCollapse: true,
        language: {
            emptyTable: "No data available - Please check API connection",
            zeroRecords: "No matching records found",
            searchPlaceholder: "Search records...",
            search: "",
            lengthMenu: "_MENU_ per page",
            paginate: {
                previous: "<i class='bi bi-chevron-left'></i>",
                next: "<i class='bi bi-chevron-right'></i>"
            },
            processing: "<div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Loading...</span></div>"
        },
        drawCallback: function() {
            $('.dataTables_paginate > .pagination').addClass('pagination-md border-0');
            $('.dataTables_paginate').addClass('mt-3');
            $('.page-item .page-link').css({
                'border': 'none',
                'padding': '0.5rem 1rem',
                'margin': '0 0.2rem'
            });

            $('table.dataTable tbody tr').css('cursor', 'pointer');

            $('.btn-action').addClass('btn-sm');
        }
    },

    initTable: function(tableSelector, columns, endpoint, options = {}) {
        if ($.fn.DataTable.isDataTable(tableSelector)) {
            $(tableSelector).DataTable().destroy();
        }

        const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/giya-api/';

        const ajaxOptions = {
            url: `${baseApiUrl}${endpoint}`,
            dataSrc: function(response) {
                if (!response || !response.success) {
                    return [];
                }
                return response.data || [];
            },
            error: function(xhr, status, error) {
                return [];
            }
        };

        const tableOptions = {
            ajax: ajaxOptions,
            columns: columns
        };

        const mergedOptions = $.extend(true, {}, this.defaults, tableOptions, options);

        const table = $(tableSelector).DataTable(mergedOptions);

        if (options.rowClickHandler) {
            $(tableSelector).on('click', 'tbody tr', function(e) {
                if (!$(e.target).closest('.btn-action').length) {
                    const data = table.row(this).data();
                    if (data) {
                        options.rowClickHandler(data);
                    }
                }
            });

            $(tableSelector).addClass('table-hover');
            $(`${tableSelector} tbody tr`).css('cursor', 'pointer');
        }

        return table;
    },

    renderStatusBadge: function(status, activeText = 'Active', inactiveText = 'Inactive') {
        const isActive = Number(status) === 1;
        const badgeClass = isActive ? "btn-solid-success" : "btn-solid-danger";
        const statusText = isActive ? activeText : inactiveText;

        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    },

    renderActionButtons: function(id, actions = {}) {
        const defaultActions = {
            edit: true,
            delete: true,
            view: false,
            reset: false
        };

        const mergedActions = {...defaultActions, ...actions};

        let buttons = '<div class="d-flex justify-content-center gap-1">';
        if (mergedActions.view) {
            buttons += `<button class="btn btn-sm btn-solid-primary view-btn btn-action" data-id="${id}" title="View details">
                            <i class="bi bi-eye"></i>
                        </button>`;
        }

        if (mergedActions.edit) {
            buttons += `<button class="btn btn-sm btn-solid-primary edit-btn btn-action" data-id="${id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>`;
        }

        if (mergedActions.reset) {
            buttons += `<button class="btn btn-sm btn-solid-warning reset-btn btn-action" data-id="${id}" title="Reset password">
                            <i class="bi bi-key"></i>
                        </button>`;
        }

        if (mergedActions.delete) {
            buttons += `<button class="btn btn-sm btn-solid-danger delete-btn btn-action" data-id="${id}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>`;
        }

        buttons += '</div>';

        return buttons;
    },

    renderToggleSwitch: function(id, isActive) {
        return `<div class="form-check form-switch">
                    <input class="form-check-input toggle-status" type="checkbox"
                           data-id="${id}" ${isActive ? 'checked' : ''}>
                </div>`;
    }
};
window.MasterTable = MasterTable;
