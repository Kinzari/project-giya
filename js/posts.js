/**
 * Posts Management Module
 * Handles all post-related functionality for GIYA admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    const elementsExist = checkRequiredElements();
    if (!elementsExist) {
        console.warn('Missing required elements - post details may not load correctly');
    }

    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        console.error("baseURL not found in sessionStorage");
        // Add a default baseURL as fallback if not set
        sessionStorage.setItem('baseURL', 'http://localhost/giya-api/');
        toastr.warning('API URL not found. Using default URL. You may need to login again.');
    }

    // Initialize tables using standard DataTables
    let table;
    const path = window.location.pathname.toLowerCase();

    // Get user data from session storage for department filtering
    const userInfo = sessionStorage.getItem('user');
    let departmentId = null;
    let userTypeId = null;

    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            departmentId = user.user_departmentId;
            userTypeId = user.user_typeId;

            // If user is a POC (userTypeId 5), make sure we have the department ID
            if (userTypeId == 5 && !departmentId) {
                toastr.warning('Department ID not found in your profile. Please contact the administrator.');
                console.warn('POC user without department ID:', user);
            }
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    if (document.getElementById("latestPostsTable")) {
        // Use department filtering for POC users (userTypeId 5)
        const action = (userTypeId == 5 && departmentId) ? `get_posts_by_department&department_id=${departmentId}` : 'get_posts';
        table = initializePostsTable('#latestPostsTable', action);
    } else if (document.getElementById("postsTable")) {
        let action = "";
        if (path.includes("students.html")) {
            action = (userTypeId == 5 && departmentId) ? `get_student_posts_by_department&department_id=${departmentId}` : "get_student_posts";
        } else if (path.includes("visitors.html")) {
            action = (userTypeId == 5 && departmentId) ? `get_visitor_posts_by_department&department_id=${departmentId}` : "get_visitor_posts";
        }
        table = initializePostsTable('#postsTable', action);
    }

    if (table) {
        attachPostFiltering(table, '.btn-group button');
    }

    window.showPostDetails = showPostDetails;
    window.submitReply = submitReplyWithoutRefresh;
    window.changeStatus = changeStatus;
});

/**
 * Initialize any posts table with consistent styling and behavior
 */
function initializePostsTable(tableSelector, action) {
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }

    // Define common columns for all post tables
    const columns = [
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
        // Department column - always visible
        {
            title: "Department",
            data: null,
            width: "130px",
            render: function(data, type) {
                // For sorting and filtering, use the field if it exists
                if (type === 'sort' || type === 'filter') {
                    return data.department_name || 'Not Assigned';
                }
                // For display, use the field with fallback
                return data.department_name || 'Not Assigned';
            },
            visible: true  // Always visible
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
    ];

    // Create a DataTable with error handling for JSON parse errors
    return $(tableSelector).DataTable({
        ajax: {
            url: `${sessionStorage.getItem('baseURL')}posts.php?action=${action}`,
            type: 'GET',
            dataSrc: function(json) {
                // Debug what's coming back from the API
                console.log("API Response:", json);

                // Check if data exists and handle errors
                if (!json || !json.data) {
                    console.error('Invalid data structure received from API:', json);
                    toastr.error('Error loading data: Invalid response structure');
                    return [];
                }

                // Ensure department_name exists in each item
                json.data.forEach(item => {
                    if (!item.department_name) {
                        item.department_name = "Not Assigned";
                    }
                });

                return json.data;
            },
            error: function(xhr, error, thrown) {
                console.error('AJAX error:', xhr, error, thrown);

                // Try to parse the response to see if it's a valid JSON with an error message
                let errorMessage = 'Server error';
                try {
                    if (xhr.responseText) {
                        const errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.message) {
                            errorMessage = errorResponse.message;
                        } else if (errorResponse.error) {
                            errorMessage = errorResponse.error;
                        }
                    }
                } catch (e) {
                    // If there's a parsing error, use the raw text (truncated)
                    if (xhr.responseText) {
                        errorMessage = xhr.responseText.substring(0, 100) + '...';
                    }
                }

                toastr.error('Error loading data: ' + errorMessage);
            }
        },
        processing: true,
        serverSide: false, // Change to true if your backend supports server-side processing
        columns: columns,
        order: [[4, 'desc'], [5, 'desc']],
        pageLength: 10,
        responsive: true,
        scrollX: false,
        scrollCollapse: true,
        autoWidth: false,
        columnDefs: [
            {
                responsivePriority: 1,
                targets: [0, 1]
            },
            {
                responsivePriority: 2,
                targets: -1
            },
            {
                responsivePriority: 3,
                targets: [2, 3]
            }
        ],
        dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
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

            $(tableSelector + ' tbody tr').css('cursor', 'pointer');
        },
        initComplete: function(settings, json) {

            $(tableSelector + ' tbody').on('click', 'tr', function() {
                const data = $(tableSelector).DataTable().row(this).data();
                if (data) {
                    showPostDetails(data.post_id);
                }
            });

            // Adjust columns to improve appearance
            this.api().columns.adjust().draw();

            // Add custom class to make rows appear clickable
            $(tableSelector + ' tbody').addClass('cursor-pointer');
        }
    });
}

// Function to render status badges consistently
function renderStatusBadge(data) {
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
}

// Variable to track current post ID
let currentPostId = null;

// Show post details in modal
async function showPostDetails(postId) {
    try {
        currentPostId = postId; // Store current post ID for status change buttons

        const baseURL = sessionStorage.getItem('baseURL');
        if (!baseURL) {
            toastr.error('Base URL not found. Please re-login.');
            return;
        }

        const loadingToast = toastr.info('Loading post details...', '', {timeOut: 0});

        const response = await axios.get(`${baseURL}posts.php?action=get_post_details&post_id=${postId}`);

        toastr.clear(loadingToast);

        if (response.data.success && response.data.post) {
            const post = response.data.post;

            const modal = new bootstrap.Modal(document.getElementById('postDetailsModal'));
            modal.show();

            // Update buttons after modal is shown
            setTimeout(updateModalButtons, 300);

            await new Promise(resolve => setTimeout(resolve, 200));

            const userNameElement = document.getElementById('postUserName');
            if (userNameElement) {
                userNameElement.textContent = post.user_fullname;
            }

            const userIdElement = document.getElementById('postUserId');
            if (userIdElement) {
                userIdElement.textContent = post.user_schoolId || '';
            }

            const statusBadgeElement = document.getElementById('postStatusBadge');
            if (statusBadgeElement) {
                statusBadgeElement.innerHTML = renderStatusBadge(post.post_status);
            }

            // Clear replies container
            const repliesContainer = document.querySelector('.replies-container');
            if (repliesContainer) {
                repliesContainer.innerHTML = '';

                // Add the main post as the first message
                const originalPostElement = document.createElement('div');
                originalPostElement.className = 'message-bubble border-start border-4 border-primary bg-light rounded p-3 w-100';
                originalPostElement.innerHTML = `
                    <div class="message-content">
                        <div class="mb-2">
                            <span class="badge bg-secondary">${post.postType_name}</span>
                            ${post.inquiry_type ? `<span class="badge bg-info ms-1">${post.inquiry_type}</span>` : ''}
                        </div>
                        <h5 class="text-primary">${post.post_title}</h5>
                        <p>${post.post_message}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${new Date(post.post_date + " " + post.post_time).toLocaleString()}</small>
                            ${renderStatusBadge(post.post_status)}
                        </div>
                    </div>
                `;
                repliesContainer.appendChild(originalPostElement);

                // Add replies
                if (post.replies && post.replies.length > 0) {
                    post.replies.forEach(reply => {
                        const replyElement = document.createElement('div');
                        replyElement.className = `message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}`;
                        replyElement.innerHTML = `
                            <div class="message-content">
                                <strong>${reply.display_name}</strong>
                                <p>${reply.reply_message}</p>
                                <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                            </div>
                        `;
                        repliesContainer.appendChild(replyElement);
                    });
                }
            }

            updateReplyForm(post.post_status, postId);
            setTimeout(scrollToBottom, 300);
        } else {
            toastr.error(response.data.message || 'Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post details:', error);
        toastr.error('Failed to load post details');
    }
}

// Update the action buttons in the postDetailsModal
function updateModalButtons() {
    // Update the action buttons in the details modal to use solid colors
    $('#postDetailsModal .btn-primary').addClass('btn-solid-primary').removeClass('btn-primary');
    $('#postDetailsModal .btn-warning').addClass('btn-solid-warning').removeClass('btn-warning');
    $('#postDetailsModal .btn-danger').addClass('btn-solid-danger').removeClass('btn-danger');
    $('#postDetailsModal .btn-success').addClass('btn-solid-success').removeClass('btn-success');
}

// Get status class based on status number
function getStatusClass(status) {
    switch (Number(status)) {
        case 0: return 'bg-danger';
        case 1: return 'bg-warning';
        case 2: case 3: return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Get status text based on status number
function getStatusText(status) {
    switch (Number(status)) {
        case 0: return 'Pending';
        case 1: return 'Ongoing';
        case 2: case 3: return 'Resolved';
        default: return 'Unknown';
    }
}

// Render replies in the container
function renderReplies(replies) {
    const repliesContainer = document.querySelector('.replies-container');
    if (!repliesContainer) return;

    repliesContainer.innerHTML = replies && replies.length
        ? replies.map(reply => `
            <div class="message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}">
                <div class="message-content">
                    <strong>${reply.display_name}</strong>
                    <p>${reply.reply_message}</p>
                    <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                </div>
            </div>
        `).join('')
        : '<p class="text-center text-muted">No replies yet</p>';
}

// Update reply form based on post status
function updateReplyForm(status, postId) {
    const formContainer = document.querySelector('.reply-form-container');
    if (!formContainer) return;

    const userType = sessionStorage.getItem('user_typeId');
    status = String(status);

    if (status === '3' || status === '2') {
        formContainer.innerHTML = `
            <div class="alert alert-success mb-0 text-center">
                <i class="bi bi-check-circle me-2"></i>
                This post is resolved and the conversation is closed.
            </div>`;
    } else {
        let extraButtons = '';

        if (!isAdminDashboardPage() && (userType === '1' || userType === '2')) {
            extraButtons = `
                <div class="d-flex justify-content-end mt-2">
                    <button class="btn btn-success btn-sm" onclick="markAsResolved(${postId})">
                        <i class="bi bi-check-circle"></i> Mark as Resolved
                    </button>
                </div>`;
        }

        formContainer.innerHTML = `
            <form id="replyForm" class="reply-form">
                <div class="input-group">
                    <input type="text" class="form-control reply-input" placeholder="Write a reply...">
                    <button class="btn btn-primary" type="submit">
                        <i class="bi bi-send-fill"></i>
                    </button>
                </div>
            </form>
            ${extraButtons}`;

        const replyForm = document.getElementById('replyForm');
        if (replyForm) {
            replyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                submitReplyWithoutRefresh(e, postId);
            });
        }
    }
}

// Check if current page is admin dashboard
function isAdminDashboardPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('latest-post.html') ||
           path.includes('visitors.html') ||
           path.includes('students.html');
}

// Scroll replies container to bottom
function scrollToBottom() {
    const repliesContainer = document.querySelector('.replies-container');
    if (repliesContainer) {
        repliesContainer.scrollTop = repliesContainer.scrollHeight;
    }
}

// Submit reply without refreshing page
async function submitReplyWithoutRefresh(event, postId) {
    event.preventDefault();
    const messageInput = document.querySelector('.reply-input');
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    try {
        messageInput.value = '';
        const adminName = "GIYA Representative";
        addReplyToUI(message, adminName, 'admin-message', new Date());
        scrollToBottom();

        const formData = new FormData();
        formData.append('post_id', postId);
        formData.append('reply_message', message);
        formData.append('admin_id', sessionStorage.getItem('user_id') || '25');
        formData.append('auto_update_status', true);

        await axios.post(
            `${sessionStorage.getItem('baseURL')}posts.php?action=submit_reply`,
            formData
        );

        refreshTables();
    } catch (error) {
        console.error('Error submitting reply:', error);
        toastr.error('Failed to send reply');
    }
}

// Add reply to UI immediately for better UX
function addReplyToUI(message, authorName, cssClass, timestamp) {
    const repliesContainer = document.querySelector('.replies-container');
    if (!repliesContainer) return;

    const newReply = document.createElement('div');
    newReply.className = `message-bubble ${cssClass}`;
    newReply.innerHTML = `
        <div class="message-content">
            <strong>${authorName}</strong>
            <p>${message}</p>
            <small>${timestamp.toLocaleString()}</small>
        </div>
    `;

    const noRepliesMsg = repliesContainer.querySelector('p.text-muted');
    if (noRepliesMsg) {
        repliesContainer.innerHTML = '';
    }

    repliesContainer.appendChild(newReply);
}

// Change post status
async function changeStatus(postId, newStatus) {
    try {
        const statusText = newStatus === '3' ? 'resolved' : 'ongoing';

        const result = await Swal.fire({
            title: `Mark as ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}?`,
            text: newStatus === '3' ? 'This will close the conversation.' : 'This will mark the post as in-progress.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus === '3' ? '#28a745' : '#0d6efd',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes, mark as ${statusText}`
        });

        if (!result.isConfirmed) return;

        const response = await axios.post(
            `${sessionStorage.getItem('baseURL')}posts.php?action=update_post_status`,
            { post_id: postId, status: newStatus }
        );

        if (response.data.success) {
            const statusBadge = document.getElementById('postStatusBadge');
            if (statusBadge) {
                statusBadge.innerHTML = renderStatusBadge(newStatus);
            }

            if (newStatus === '3') {
                updateReplyForm(newStatus, postId);
                toastr.success('Post marked as resolved');
            } else {
                toastr.success('Post marked as ongoing');
            }

            refreshTables();
        } else {
            toastr.error('Failed to update status');
        }
    } catch (error) {
        console.error('Error changing status:', error);
        toastr.error('Failed to update status');
    }
}

// Refresh all post tables
function refreshTables() {
    ['#postsTable', '#latestPostsTable'].forEach(tableId => {
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().ajax.reload(null, false);
        }
    });
}

// Get HTML for status badge
function getStatusBadgeHtml(status) {
    // Use the same renderStatusBadge function for consistency
    return renderStatusBadge(status);
}

// Filter configuration
window.currentFilter = 'all';
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
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
});

// Attach filtering to buttons
function attachPostFiltering(table, filterButtonSelector) {
    $(filterButtonSelector).on('click', function() {
        const filterValue = $(this).data('filter').toLowerCase();
        window.currentFilter = filterValue;

        $(filterButtonSelector).removeClass('active');
        $(this).addClass('active');

        table.draw();
    });
}

// Add filter buttons if not present
function addFilterButtons() {
    const existingFilter = document.querySelector('.filter-buttons-container');
    if (!existingFilter) {
        const container = document.createElement('div');
        container.className = 'filter-buttons-container mb-3';
        container.innerHTML = `
            <div class="btn-group" role="group" aria-label="Filter posts">
                <button type="button" class="btn btn-outline-primary active" data-filter="all">All Active</button>
                <button type="button" class="btn btn-outline-danger" data-filter="pending">Pending</button>
                <button type="button" class="btn btn-outline-warning" data-filter="ongoing">Ongoing</button>
                <button type="button" class="btn btn-outline-success" data-filter="resolved">Resolved</button>
            </div>
        `;

        const table = document.querySelector('table');
        if (table) {
            table.parentNode.insertBefore(container, table);
        }
    }
}

// Check if required elements exist in the DOM
function checkRequiredElements() {
    const elements = [
        'postUserName',
        'postUserId',
        'postStatusBadge',
        '.main-post',
        '.replies-container',
        '.reply-form-container'
    ];

    let allFound = true;
    elements.forEach(selector => {
        let el;
        if (selector.startsWith('.') || selector.startsWith('#')) {
            el = document.querySelector(selector);
        } else {
            el = document.getElementById(selector);
        }

        if (!el) {
            allFound = false;
        }
    });

    return allFound;
}

/**
 * Check if current user is a POC user
 * @returns {boolean} True if user is POC
 */
function isPOCUser() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return false;

    const user = JSON.parse(userInfo);
    return user.user_typeId == 5;
}

/**
 * Get department name for displaying in UI
 * @returns {string} Department name or empty string
 */
function getCurrentUserDepartment() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return '';

    const user = JSON.parse(userInfo);
    return user.department_name || '';
}
