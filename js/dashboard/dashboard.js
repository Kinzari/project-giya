/**
 * Dashboard.js - Main dashboard functionality
 * Handles statistics, charts, and filtering for the GIYA dashboard
 */

// Global state to track filter settings
const dashboardState = {
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    departmentId: '',
    campusId: '',  // Changed from courseId to campusId
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
    // Set up API baseURL
    setupApiEndpoint();

    // Set initial dates in the input fields
    initDateFields();

    // Load departments for filter dropdown
    loadDepartments();

    // Load campuses for filter dropdown
    loadCampuses();

    // Initialize dashboard data and charts
    initDashboard();

    // Set up event listeners for filters
    setupFilterHandlers();

    // Check if user is POC and apply restrictions
    checkPOCStatus();
});

/**
 * Set up the API endpoint URL
 */
function setupApiEndpoint() {
    // Check if baseURL is already set
    if (!sessionStorage.getItem('baseURL')) {
        // Determine if we're on localhost or live server
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

        // Set the appropriate baseURL
        const baseURL = isLocalhost ? 'http://localhost/api/' : '/api/';
        sessionStorage.setItem('baseURL', baseURL);
    }
}

/**
 * Initialize the date input fields
 */
function initDateFields() {
    // Set default values (30 days ago to today)
    document.getElementById('start-date').value = dashboardState.startDate;
    document.getElementById('end-date').value = dashboardState.endDate;
}

/**
 * Helper function to make API calls with consistent configuration
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options for axios
 * @returns {Promise} - Axios promise
 */
async function apiCall(endpoint, options = {}) {
    const baseURL = sessionStorage.getItem('baseURL') || '';
    const url = `${baseURL}${endpoint}`;

    // Default params
    const params = options.params || {};

    // Add cache busting parameter
    params._t = new Date().getTime();

    // Default config
    const config = {
        params,
        headers: options.headers || {}
    };

    // Add authentication headers if user info exists
    const userInfo = sessionStorage.getItem('user');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            config.headers['X-User-Type'] = user.user_typeId;
            config.headers['X-User-Id'] = user.user_id;
        } catch (e) {
            // Silently continue if user info can't be parsed
        }
    }

    return axios.get(url, config);
}

/**
 * Load departments for the filter dropdown
 */
async function loadDepartments() {
    try {
        const response = await apiCall('masterfile.php', {
            params: { action: 'departments' }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const departmentSelect = document.getElementById('department-filter');

            // Clear existing options except the first one
            const defaultOption = departmentSelect.options[0];
            departmentSelect.innerHTML = '';
            departmentSelect.appendChild(defaultOption);

            // Add department options
            response.data.data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.department_id;
                option.textContent = dept.department_name;
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
        } else {
            console.error('Failed to load departments');
            toastr.error('Failed to load departments. Please check server response.');
        }
    } catch (error) {
        console.error('Failed to load departments');
        toastr.error('Failed to connect to server. Please check your connection.');
    }
}

/**
 * Load campuses for the filter dropdown
 */
async function loadCampuses() {
    try {
        const response = await apiCall('masterfile.php', {
            params: { action: 'campuses' }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const campusSelect = document.getElementById('campus-filter');

            // Clear existing options except the first one
            const defaultOption = campusSelect.options[0];
            campusSelect.innerHTML = '';
            campusSelect.appendChild(defaultOption);

            // Add campus options
            response.data.data.forEach(campus => {
                const option = document.createElement('option');
                option.value = campus.campus_id;
                option.textContent = campus.campus_name;
                campusSelect.appendChild(option);
            });
        } else {
            console.error('Failed to load campuses');
            toastr.error('Failed to load campuses. Please check server response.');
        }
    } catch (error) {
        console.error('Failed to load campuses');
        toastr.error('Failed to connect to server. Please check your connection.');
    }
}

/**
 * Initialize dashboard with data and charts
 */
function initDashboard() {
    fetchDashboardData();
    initCharts();
}

/**
 * Fetch dashboard statistics and update the UI
 */
async function fetchDashboardData() {
    try {
        // Show loading indicators
        setLoadingState(true);

        const params = {
            action: 'get_stats',
            start_date: dashboardState.startDate,
            end_date: dashboardState.endDate,
            department_id: dashboardState.departmentId,
            campus_id: dashboardState.campusId,
            post_type: dashboardState.postType,
            status: dashboardState.status
        };

        const response = await apiCall('dashboard.php', { params });

        if (response.data && response.data.success) {
            updateDashboardStats(response.data);
            updateCharts(response.data);
        } else {
            console.error('Failed to load dashboard data');
            toastr.error(response.data?.message || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error fetching dashboard data');
        toastr.error('Failed to load dashboard statistics. Server might be unavailable.');
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

    // Optional: Add a campus indicator if needed
    if (data.campus && document.getElementById('campus-indicator')) {
        document.getElementById('campus-indicator').classList.remove('d-none');
        document.getElementById('campus-name').textContent = data.campus;
    } else if (document.getElementById('campus-indicator')) {
        document.getElementById('campus-indicator').classList.add('d-none');
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
                backgroundColor: ['#0dcaf0', '#a9a9a9', '#20c997'],
                hoverBackgroundColor: ['#0aa5c5', '#928e85', '#18a87d']
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

    // Feedback Chart with default Bootstrap colors
    const feedbackCtx = document.getElementById('feedback-chart')?.getContext('2d');
    if (feedbackCtx) {
        const feedbackChart = new Chart(feedbackCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(108, 117, 125, 0.8)',  // Bootstrap secondary
                        'rgba(108, 117, 125, 0.5)',  // Lighter secondary
                        'rgba(108, 117, 125, 0.3)'   // Lightest secondary
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        dashboardState.charts.feedback = feedbackChart;
    }
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
 * Set up event listeners for filter controls
 */
function setupFilterHandlers() {
    // Form submission for all filters
    $('#dashboard-filters').on('submit', function(e) {
        e.preventDefault();

        // Gather filter values from the new date inputs
        dashboardState.startDate = $('#start-date').val();
        dashboardState.endDate = $('#end-date').val();
        dashboardState.departmentId = $('#department-filter').val();
        dashboardState.campusId = $('#campus-filter').val();  // Changed from courseId to campusId
        dashboardState.postType = $('#post-type-filter').val();
        dashboardState.status = $('#status-filter').val();

        // Re-fetch data and update dashboard
        fetchDashboardData();
    });

    // Individual filter change handlers
    $('#department-filter, #campus-filter, #post-type-filter, #status-filter').on('change', function() {
        // Update state
        dashboardState.departmentId = $('#department-filter').val();
        dashboardState.campusId = $('#campus-filter').val();  // Changed from courseId to campusId
        dashboardState.postType = $('#post-type-filter').val();
        dashboardState.status = $('#status-filter').val();
    });

    // Date field change handlers
    $('#start-date, #end-date').on('change', function() {
        dashboardState.startDate = $('#start-date').val();
        dashboardState.endDate = $('#end-date').val();
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
            // Removed: loadCoursesByDepartment(user.user_departmentId);
        }
    }
}

/**
 * Set loading state for the dashboard
 */
function setLoadingState(isLoading) {
    // You might want to add a loading indicator to the UI
    document.body.style.cursor = isLoading ? 'wait' : 'default';

    // Optional: Add a loading overlay if needed
}
