/**
 * Dashboard.js - Main dashboard functionality
 * Handles statistics, charts, and filtering for the GIYA dashboard
 */

// Global state to track filter settings
const dashboardState = {
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    departmentId: '',
    postType: '',
    status: '',
    // Charts references
    charts: {
        postTypes: null,
        status: null
    }
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date range picker
    initDatePicker();

    // Load departments for filter dropdown
    loadDepartments();

    // Initialize dashboard data and charts
    initDashboard();

    // Set up event listeners for filters
    setupFilterHandlers();

    // Check if user is POC and apply restrictions
    checkPOCStatus();
});

/**
 * Initialize the date range picker
 */
function initDatePicker() {
    $('#date-range').daterangepicker({
        startDate: moment().subtract(30, 'days'),
        endDate: moment(),
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, function(start, end) {
        // Update state when date range changes
        dashboardState.startDate = start.format('YYYY-MM-DD');
        dashboardState.endDate = end.format('YYYY-MM-DD');
    });

    // Handle date reset button
    $('#reset-date').on('click', function() {
        $('#date-range').data('daterangepicker').setStartDate(moment().subtract(30, 'days'));
        $('#date-range').data('daterangepicker').setEndDate(moment());
        dashboardState.startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
        dashboardState.endDate = moment().format('YYYY-MM-DD');
    });
}

/**
 * Load departments for the filter dropdown
 */
async function loadDepartments() {
    try {
        const baseURL = sessionStorage.getItem('baseURL');
        const response = await axios.get(`${baseURL}giya.php?action=get_departments`);

        if (response.data.success && response.data.departments) {
            const departmentSelect = document.getElementById('department-filter');

            response.data.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });

            // For POC users, automatically select their department
            const userInfo = sessionStorage.getItem('user');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.user_typeId == 5 && user.user_departmentId) {
                    departmentSelect.value = user.user_departmentId;
                    dashboardState.departmentId = user.user_departmentId;

                    // Disable changing department for POC users
                    departmentSelect.disabled = true;

                    // Add visual indicator
                    const departmentContainer = document.getElementById('department-filter-container');
                    if (departmentContainer) {
                        departmentContainer.classList.add('poc-locked');
                        const lockIcon = document.createElement('div');
                        lockIcon.className = 'poc-lock-icon';
                        lockIcon.innerHTML = '<i class="bi bi-lock-fill text-secondary ms-2"></i>';
                        departmentSelect.parentNode.appendChild(lockIcon);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
        toastr.error('Failed to load departments');
    }
}

/**
 * Initialize dashboard with data and charts
 */
function initDashboard() {
    fetchDashboardData();
    initCharts();
    initLatestPostsTable();
}

/**
 * Fetch dashboard statistics and update the UI
 */
async function fetchDashboardData() {
    try {
        // Show loading indicators
        setLoadingState(true);

        const baseURL = sessionStorage.getItem('baseURL');
        const params = new URLSearchParams({
            start_date: dashboardState.startDate,
            end_date: dashboardState.endDate,
            department_id: dashboardState.departmentId,
            post_type: dashboardState.postType,
            status: dashboardState.status
        });

        const response = await axios.get(`${baseURL}dashboard.php?action=get_stats&${params.toString()}`);

        if (response.data.success) {
            updateDashboardStats(response.data);
            updateCharts(response.data);
        } else {
            toastr.error(response.data.message || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toastr.error('Failed to load dashboard statistics');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Update the dashboard statistics with fetched data
 */
function updateDashboardStats(data) {
    // Update post type counts
    document.getElementById('total-posts-count').textContent = data.total || 0;
    document.getElementById('inquiry-count').textContent = data.post_types?.inquiry || 0;
    document.getElementById('feedback-count').textContent = data.post_types?.feedback || 0;
    document.getElementById('suggestion-count').textContent = data.post_types?.suggestion || 0;

    // Update status counts
    document.getElementById('pending-count').textContent = data.status?.pending || 0;
    document.getElementById('ongoing-count').textContent = data.status?.ongoing || 0;
    document.getElementById('resolved-count').textContent = data.status?.resolved || 0;

    // If department is selected, update the department indicator
    if (data.department) {
        document.getElementById('department-indicator').classList.remove('d-none');
        document.getElementById('department-name').textContent = data.department;
    } else {
        document.getElementById('department-indicator').classList.add('d-none');
    }
}

/**
 * Initialize charts for post types and status distribution
 */
function initCharts() {
    // Post Types Chart
    const postTypesCtx = document.getElementById('post-types-chart').getContext('2d');
    dashboardState.charts.postTypes = new Chart(postTypesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Inquiry', 'Feedback', 'Suggestion'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#0dcaf0', '#ffc107', '#20c997'],
                hoverBackgroundColor: ['#0aa5c5', '#e5ac00', '#18a87d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Status Chart
    const statusCtx = document.getElementById('status-chart').getContext('2d');
    dashboardState.charts.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Ongoing', 'Resolved'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#dc3545', '#ffc107', '#198754'],
                hoverBackgroundColor: ['#bb2d3b', '#e5ac00', '#157347']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update charts with new data
 */
function updateCharts(data) {
    // Update post types chart
    if (dashboardState.charts.postTypes) {
        dashboardState.charts.postTypes.data.datasets[0].data = [
            data.post_types?.inquiry || 0,
            data.post_types?.feedback || 0,
            data.post_types?.suggestion || 0
        ];
        dashboardState.charts.postTypes.update();
    }

    // Update status chart
    if (dashboardState.charts.status) {
        dashboardState.charts.status.data.datasets[0].data = [
            data.status?.pending || 0,
            data.status?.ongoing || 0,
            data.status?.resolved || 0
        ];
        dashboardState.charts.status.update();
    }
}

/**
 * Initialize the latest posts DataTable
 */
function initLatestPostsTable() {
    if ($.fn.DataTable.isDataTable('#latestPostsTable')) {
        $('#latestPostsTable').DataTable().destroy();
    }

    // Get user data for POC filtering
    const userInfo = sessionStorage.getItem('user');
    let departmentId = null;
    let userTypeId = null;

    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            departmentId = user.user_departmentId;
            userTypeId = user.user_typeId;
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    // Determine API action based on user type
    const action = (userTypeId == 5 && departmentId) ?
        `get_posts_by_department&department_id=${departmentId}` : 'get_posts';

    // Initialize table with same structure as posts.js uses
    $('#latestPostsTable').DataTable({
        ajax: {
            url: `${sessionStorage.getItem('baseURL')}posts.php?action=${action}`,
            type: 'GET',
            dataSrc: function(json) {
                // Filter data based on current dashboard filters
                let filteredData = json.data || [];

                if (dashboardState.startDate && dashboardState.endDate) {
                    filteredData = filteredData.filter(item => {
                        const postDate = moment(item.post_date, 'MM-DD-YYYY').format('YYYY-MM-DD');
                        return postDate >= dashboardState.startDate && postDate <= dashboardState.endDate;
                    });
                }

                if (dashboardState.departmentId) {
                    filteredData = filteredData.filter(item => {
                        // In some responses, department_id might not be directly in the data
                        // so we have to check by name (which is always included)
                        const departmentName = document.querySelector(`#department-filter option[value="${dashboardState.departmentId}"]`)?.textContent;
                        return item.department_name === departmentName;
                    });
                }

                if (dashboardState.postType) {
                    filteredData = filteredData.filter(item => {
                        // Filter based on postType_name which matches our filter options
                        if (dashboardState.postType === '1') return item.postType_name === 'Inquiry';
                        if (dashboardState.postType === '2') return item.postType_name === 'Feedback';
                        if (dashboardState.postType === '3') return item.postType_name === 'Suggestion';
                        return true;
                    });
                }

                if (dashboardState.status !== '') {
                    filteredData = filteredData.filter(item => String(item.post_status) === String(dashboardState.status));
                }

                return filteredData;
            },
            error: function(xhr, error, thrown) {
                console.error('AJAX error:', xhr, error, thrown);
                toastr.error('Error loading data: ' + (thrown || 'Server error'));
                return [];
            }
        },
        columns: [
            {
                title: "Status",
                data: "post_status",
                render: renderStatusBadge,
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
                width: "100px",
                render: function(data, type, row) {
                    const dt = new Date(row.post_date + " " + data);
                    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
                    return dt.toLocaleTimeString('en-US', options);
                }
            }
        ],
        order: [[5, 'desc'], [6, 'desc']],
        pageLength: 10,
        responsive: true,
        dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search records...",
            lengthMenu: "_MENU_ records per page",
            zeroRecords: "No matching records found",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            infoEmpty: "Showing 0 to 0 of 0 entries",
            infoFiltered: "(filtered from _MAX_ total entries)",
            paginate: {
                first: '<i class="bi bi-chevron-double-left"></i>',
                previous: '<i class="bi bi-chevron-left"></i>',
                next: '<i class="bi bi-chevron-right"></i>',
                last: '<i class="bi bi-chevron-double-right"></i>'
            }
        },
        drawCallback: function() {
            // Add click handlers to rows for viewing post details
            $('#latestPostsTable tbody tr').on('click', function() {
                const data = $('#latestPostsTable').DataTable().row(this).data();
                if (data && window.showPostDetails) {
                    showPostDetails(data.post_id);
                }
            });
        }
    });
}

/**
 * Set up event listeners for filter controls
 */
function setupFilterHandlers() {
    // Form submission for all filters
    $('#dashboard-filters').on('submit', function(e) {
        e.preventDefault();

        // Gather filter values
        dashboardState.departmentId = $('#department-filter').val();
        dashboardState.postType = $('#post-type-filter').val();
        dashboardState.status = $('#status-filter').val();

        // Re-fetch data and update dashboard
        fetchDashboardData();

        // Refresh the DataTable with the new filters
        if ($.fn.DataTable.isDataTable('#latestPostsTable')) {
            $('#latestPostsTable').DataTable().ajax.reload();
        }
    });

    // Individual filter change handlers (optional, for immediate filtering)
    $('#department-filter, #post-type-filter, #status-filter').on('change', function() {
        // Update state
        dashboardState.departmentId = $('#department-filter').val();
        dashboardState.postType = $('#post-type-filter').val();
        dashboardState.status = $('#status-filter').val();
    });

    // Date range changed event
    $('#date-range').on('apply.daterangepicker', function(ev, picker) {
        dashboardState.startDate = picker.startDate.format('YYYY-MM-DD');
        dashboardState.endDate = picker.endDate.format('YYYY-MM-DD');
    });

    // Status filter buttons in the Latest Posts card
    $('.btn-group button[data-filter]').on('click', function() {
        const filterValue = $(this).data('filter');

        // Update visual state
        $('.btn-group button[data-filter]').removeClass('active');
        $(this).addClass('active');

        // Map filter value to status code
        let statusCode = '';
        switch(filterValue) {
            case 'pending': statusCode = '0'; break;
            case 'ongoing': statusCode = '1'; break;
            case 'resolved': statusCode = '2'; break;
            case 'all': statusCode = ''; break;
        }

        dashboardState.status = statusCode;

        // Refresh the DataTable with the new filters
        if ($.fn.DataTable.isDataTable('#latestPostsTable')) {
            $('#latestPostsTable').DataTable().ajax.reload();
        }
    });
}

/**
 * Check if the user is a POC and apply restrictions
 */
function checkPOCStatus() {
    const userInfo = sessionStorage.getItem('user');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.user_typeId == 5 && user.user_departmentId) {
            // Apply POC restrictions
            dashboardState.departmentId = user.user_departmentId;
            $('#department-filter').val(user.user_departmentId).prop('disabled', true);
            $('#department-filter-container').addClass('poc-locked');
            $('#department-filter-container').append('<div class="poc-lock-icon"><i class="bi bi-lock-fill text-secondary ms-2"></i></div>');
        }
    }
}

/**
 * Set loading state for the dashboard
 */
function setLoadingState(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (isLoading) {
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
        }
    } else {
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
    }
}

/**
 * Render status badge for DataTable
 */
function renderStatusBadge(data, type, row) {
    let badgeClass = '';
    let badgeText = '';

    switch (data) {
        case '0':
            badgeText = 'Pending';
            badgeClass = 'badge bg-warning';
            break;
        case '1':
            badgeText = 'Ongoing';
            badgeClass = 'badge bg-info';
            break;
        case '2':
        case '3':
            badgeText = 'Resolved';
            badgeClass = 'badge bg-success';
            break;
        default:
            badgeText = 'Unknown';
            badgeClass = 'badge bg-secondary';
    }

    return `<span class="${badgeClass}">${badgeText}</span>`;
}
