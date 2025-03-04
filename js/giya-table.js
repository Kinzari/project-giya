/**
 * GIYA Tables - Unified Table System for User-Facing Tables
 * Provides consistent initialization and styling for post tables
 * Used in: latest-post.html, students.html, visitors.html
 */

// Create GiyaTable namespace to avoid conflicts
const GiyaTable = {
    // Default settings for all GIYA tables
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
            // Apply consistent styling to pagination
            $('.dataTables_paginate > .pagination').addClass('pagination-md border-0');
            $('.dataTables_paginate').addClass('mt-3');
            $('.page-item .page-link').css({
                'border': 'none',
                'padding': '0.5rem 1rem',
                'margin': '0 0.2rem'
            });

            // Make rows appear clickable
            $('table.dataTable tbody tr').css('cursor', 'pointer');
        }
    },

    /**
     * Initialize a posts table with standard columns and styling
     * @param {string} tableSelector - CSS selector for table
     * @param {string} action - API action to fetch data
     * @param {function} rowClickHandler - Function to handle row clicks
     * @param {object} additionalOptions - Additional options to override defaults
     */
    initPostsTable: function(tableSelector, action, rowClickHandler = null, additionalOptions = {}) {
        // Destroy existing DataTable instance if it exists
        if ($.fn.DataTable.isDataTable(tableSelector)) {
            $(tableSelector).DataTable().destroy();
        }

        // Standard column definitions for post tables
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

        // Base API URL from session storage
        const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/giya-api/';

        // Create options for table
        const tableOptions = {
            ajax: {
                url: `${baseURL}posts.php?action=${action}`,
                type: 'GET',
                dataSrc: function(json) {
                    // Log received data for debugging
                    console.log('Received data for table:', action, json);

                    // Check if data exists and handle errors
                    if (!json || !json.data) {
                        console.error('Invalid data structure received from API');
                        return [];
                    }

                    return json.data;
                },
                error: function(xhr, error, thrown) {
                    console.error('AJAX error:', xhr, error, thrown);
                    toastr.error('Error loading data: ' + (thrown || 'Server error'));
                    return [];
                }
            },
            columns: columns,
            order: [[4, 'desc'], [5, 'desc']],
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

        // Merge with defaults and additional options
        const mergedOptions = $.extend(true, {}, this.defaults, tableOptions, additionalOptions);

        // Initialize the DataTable
        const table = $(tableSelector).DataTable(mergedOptions);

        // Add click handler for rows if specified or use default
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

        // Add custom class to make rows appear clickable
        $(tableSelector).addClass('table-hover');
        $(tableSelector + ' tbody').addClass('cursor-pointer');

        return table;
    },

    /**
     * Render status badge with consistent styling
     * @param {number|string} data - Status code (0: Pending, 1: Ongoing, 2-3: Resolved)
     */
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

    /**
     * Attach filtering functionality to post tables
     * @param {object} table - DataTable instance
     * @param {string} filterSelector - Selector for filter buttons
     */
    attachFiltering: function(table, filterSelector) {
        // Define filter function
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

        // Add filter function to DataTables
        $.fn.dataTable.ext.search.push(filterFunction);
        window.currentFilter = 'all';

        // Add click handlers to filter buttons
        $(filterSelector).on('click', function() {
            const filterValue = $(this).data('filter').toLowerCase();
            window.currentFilter = filterValue;

            $(filterSelector).removeClass('active');
            $(this).addClass('active');

            table.draw();
        });
    },

    /**
     * Reload all GIYA tables on the current page
     */
    refreshTables: function() {
        ['#postsTable', '#latestPostsTable'].forEach(tableId => {
            if ($.fn.DataTable.isDataTable(tableId)) {
                $(tableId).DataTable().ajax.reload(null, false);
            }
        });
    }
};

// Store in global namespace for access
window.GiyaTable = GiyaTable;

console.log('GiyaTable initialized successfully');
