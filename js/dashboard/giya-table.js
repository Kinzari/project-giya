const GiyaTable = {
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

            // Style table headers - keep this part
            $('table.dataTable thead th').css({
                'background-color': '#155f37',
                'color': 'white'
            });

            // Add page number input
            GiyaTable.addPageNumberInput(this);
        }
    },

    initPostsTable: function(tableSelector, action, rowClickHandler = null, additionalOptions = {}) {
        if ($.fn.DataTable.isDataTable(tableSelector)) {
            $(tableSelector).DataTable().destroy();
        }

        const columns = [
            {
                title: "Status",
                data: "post_status",
                render: this.renderStatusBadge,
                width: "100px"
            },
            {
                title: "Full Name",
                data: "user_fullname"
            },
            {
                title: "Type",
                data: "postType_name",
                width: "120px"
            },
            {
                title: "Title",
                data: "post_title"
            },
            {
                title: "Department",
                data: "department_name",
                render: function(data) {
                    return data || 'Not Assigned';
                },
                width: "130px"
            },
            {
                title: "Campus",
                data: "campus_name",
                render: function(data) {
                    // Remove campus-specific class and styling
                    return data || 'Carmen';
                },
                width: "100px"
            },
            {
                title: "Date",
                data: "post_date",
                width: "150px"
            },
            {
                title: "Time",
                data: "post_time",
                width: "150px",
                render: function(data, type, row) {
                    const dt = new Date(row.post_date + " " + data);
                    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
                    return dt.toLocaleTimeString('en-US', options);
                }
            }
        ];

        const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/giya-api/';

        const tableOptions = {
            ajax: {
                url: `${baseURL}posts.php?action=${action}`,
                type: 'GET',
                dataType: 'json',
                dataSrc: function(json) {
                    if (!json || !json.data) {
                        console.error('Invalid JSON response:', json);
                        toastr.error('Server returned invalid data format');
                        return [];
                    }
                    return json.data;
                },
                error: function(xhr, error, thrown) {
                    console.error('DataTables AJAX error:', xhr, error, thrown);

                    // Handle empty response
                    if (!xhr.responseText) {
                        toastr.error('Server returned empty response');
                        return [];
                    }

                    // Handle JSON parsing errors
                    try {
                        // Try parsing it to see if it's valid JSON
                        JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error('Invalid JSON response:', xhr.responseText);
                        toastr.error(`Invalid server response: ${e.message}`);

                        // Make a diagnostic request to check response headers
                        fetch(`${baseURL}posts.php?action=${action}`)
                            .then(response => {
                                console.log('Diagnostic response headers:',
                                    Array.from(response.headers.entries()));
                                return response.text();
                            })
                            .then(text => {
                                console.log('Diagnostic response text (first 500 chars):',
                                    text.substring(0, 500));
                            })
                            .catch(error => {
                                console.error('Diagnostic fetch failed:', error);
                            });
                    }

                    toastr.error(`Failed to load data: ${thrown || 'Server error'}`);
                    return [];
                },
                // Add cache busting and user type/department info
                data: function() {
                    const userTypeId = sessionStorage.getItem('user_typeId');
                    const userDepartmentId = sessionStorage.getItem('user_departmentId');

                    return {
                        _: new Date().getTime(),  // Add timestamp to prevent caching
                        userType: userTypeId || '',
                        userDepartment: userDepartmentId || ''
                    };
                }
            },
            columns: columns,
            order: [[6, 'desc'], [7, 'desc']], // Order by date and time columns in descending order
            columnDefs: [
                {
                    responsivePriority: 1,
                    targets: [0, 1]
                },
                {
                    responsivePriority: 2,
                    targets: -1
                }
            ]
        };

        const mergedOptions = $.extend(true, {}, this.defaults, tableOptions, additionalOptions);

        const table = $(tableSelector).DataTable(mergedOptions);

        if (rowClickHandler) {
            $(tableSelector + ' tbody').on('click', 'tr', function() {
                const data = table.row(this).data();
                if (data) {
                    rowClickHandler(data);
                }
            });
        } else {
            $(tableSelector + ' tbody').on('click', 'tr', function() {
                const data = table.row(this).data();
                if (data && window.showPostDetails) {
                    window.showPostDetails(data.post_id);
                }
            });
        }

        $(tableSelector).addClass('table-hover');
        $(tableSelector + ' tbody').addClass('cursor-pointer');

        return table;
    },

    renderStatusBadge: function(data) {
        let statusText = "";
        let badgeClass = "";

        switch (Number(data)) {
            case 0:
                statusText = "Pending";
                badgeClass = "btn-solid-danger";
                break;
            case 1:
                statusText = "Ongoing";
                badgeClass = "btn-solid-warning";
                break;
            case 2:
            case 3:
                statusText = "Resolved";
                badgeClass = "btn-solid-primary";
                break;
            default:
                statusText = "Unknown";
                badgeClass = "btn-secondary";
        }

        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    },

    attachFiltering: function(table, filterSelector) {
        const filterFunction = function(settings, data, dataIndex) {
            const statusCell = data[0];
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = statusCell;
            const statusText = tempDiv.textContent.trim().toLowerCase();

            switch(window.currentFilter) {
                case 'all':
                    return statusText !== 'resolved';
                case 'pending':
                    return statusText === 'pending';
                case 'ongoing':
                    return statusText === 'ongoing';
                case 'resolved':
                    return statusText === 'resolved';
                default:
                    return true;
            }
        };

        $.fn.dataTable.ext.search.push(filterFunction);
        window.currentFilter = 'all';

        $(filterSelector).on('click', function() {
            const filterValue = $(this).data('filter').toLowerCase();
            window.currentFilter = filterValue;

            $(filterSelector).removeClass('active');
            $(this).addClass('active');

            table.draw();
        });
    },

    refreshTables: function() {
        ['#postsTable', '#latestPostsTable'].forEach(tableId => {
            if ($.fn.DataTable.isDataTable(tableId)) {
                $(tableId).DataTable().ajax.reload(null, false);
            }
        });
    },

    addPageNumberInput: function(table) {
        const api = table.api();
        if (api.page.info().pages <= 1) return; // Don't add for single page

        // Set a small timeout to ensure pagination is fully rendered
        setTimeout(() => {
            // Remove existing input if any (to avoid duplicates)
            $(api.table().container()).find('.page-number-input-container').remove();

            // Create input container with proper styling
            const inputContainer = $('<div class="page-number-input-container ms-2"></div>');
            const inputGroup = $('<div class="input-group input-group-sm"></div>');
            const inputLabel = $('<span class="input-group-text">Page</span>');
            const input = $('<input type="number" min="1" class="page-number-input form-control">');
            const totalPages = $(`<span class="input-group-text">of ${api.page.info().pages}</span>`);

            // Assemble the components
            inputGroup.append(inputLabel);
            inputGroup.append(input);
            inputGroup.append(totalPages);
            inputContainer.append(inputGroup);

            // Set initial value
            input.val(api.page.info().page + 1);

            // Handle input events
            input.on('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const pageNum = parseInt($(this).val(), 10);
                    const maxPage = api.page.info().pages;

                    if (pageNum > 0 && pageNum <= maxPage) {
                        api.page(pageNum - 1).draw('page');
                    } else {
                        // Reset to current page if invalid
                        $(this).val(api.page.info().page + 1);
                        toastr.warning(`Please enter a page number between 1 and ${maxPage}`);
                    }
                }
            });

            // Find the pagination container and append our input
            // This uses a more reliable selector to find the pagination area
            const paginationContainer = $(api.table().container()).find('.dataTables_paginate');

            // Insert before the pagination to avoid layout issues
            paginationContainer.prepend(inputContainer);

            // Make sure the pagination and our input are displayed properly
            paginationContainer.css({
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'flex-end'
            });
        }, 100); // Short delay to ensure the pagination is rendered
    },

    updatePageInputValue: function(api) {
        const container = $(api.table().container());
        const input = container.find('.page-number-input');
        const totalPagesSpan = container.find('.page-number-input-container .input-group-text:last-child');

        if (input.length > 0) {
            input.val(api.page.info().page + 1);

            // Also update the "of X" text in case total pages changed
            if (totalPagesSpan.length > 0) {
                totalPagesSpan.text(`of ${api.page.info().pages}`);
            }
        }
    }
};

// Update page input value AND visibility whenever draw event occurs
$(document).on('draw.dt', function(e, settings) {
    const api = new $.fn.dataTable.Api(settings);

    // Very short timeout to ensure DOM is ready
    setTimeout(() => {
        // First check if the input exists, if not add it
        if ($(api.table().container()).find('.page-number-input-container').length === 0) {
            GiyaTable.addPageNumberInput({api: () => api});
        } else {
            GiyaTable.updatePageInputValue(api);
        }
    }, 50);
});

window.GiyaTable = GiyaTable;
