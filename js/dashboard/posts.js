document.addEventListener('DOMContentLoaded', function() {
    const elementsExist = checkRequiredElements();
    if (!elementsExist) {
        // Continue silently
    }

    const path = window.location.pathname.toLowerCase();

    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        sessionStorage.setItem('baseURL', 'http://localhost/api/');
        toastr.warning('API URL not found. Using default URL. You may need to login again.');
    }

    let table;
    const userInfo = sessionStorage.getItem('user');
    window.userTypeId = null;
    window.departmentId = null;
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            window.departmentId = user.user_departmentId;
            window.userTypeId = user.user_typeId;
            if (window.userTypeId == 5 && !window.departmentId) {
                toastr.warning('Department ID not found in your profile. Please contact the administrator.');
            }

            sessionStorage.setItem('user_typeId', window.userTypeId);
            sessionStorage.setItem('user_departmentId', window.departmentId);
        } catch (e) {
            // Silent catch
        }
    }

    if (document.getElementById("latestPostsTable")) {
        let action = 'get_latest_posts';

        if (window.userTypeId == 5 && window.departmentId) {
            action = `get_posts_by_department&department_id=${window.departmentId}`;
            console.log(`POC user: Using endpoint ${action} with department ID ${window.departmentId}`);
        }

        $('.student-table-container').addClass('discord-pagination');

        table = GiyaTable.initPostsTable('#latestPostsTable', action, null, {
            order: [[7, 'desc'], [8, 'desc']]
        });
    } else if (document.getElementById("postsTable")) {
        let action = "";
        if (path.includes("students.html")) {
            action = (window.userTypeId == 5 && window.departmentId) ?
                `get_student_posts_by_department&department_id=${window.departmentId}` :
                "get_student_posts";
        } else if (path.includes("visitors.html")) {
            action = (window.userTypeId == 5 && window.departmentId) ?
                `get_visitor_posts_by_department&department_id=${window.departmentId}` :
                "get_visitor_posts";
        } else if (path.includes("employees.html")) {
            action = (window.userTypeId == 5 && window.departmentId) ?
                `get_employee_posts_by_department&department_id=${window.departmentId}` :
                "get_employee_posts";
        }

        console.log(`Initializing table with endpoint: ${action}`);

        // Add error handling wrapper for debugging
        try {
            $('.student-table-container').addClass('discord-pagination');
            table = GiyaTable.initPostsTable('#postsTable', action, null);
        } catch (error) {
            console.error(`Error initializing table with action ${action}:`, error);
            toastr.error(`Failed to load posts. Please contact support. (Error: ${error.message})`);
        }
    }

    if (table) {
        GiyaTable.attachFiltering(table, '.btn-group button');
    }
    window.showPostDetails = showPostDetails;
    window.submitReply = submitReplyWithoutRefresh;
    window.changeStatus = changeStatus;

    setTimeout(() => {
        document.querySelectorAll('th').forEach(el => {
            el.style.backgroundColor = '#155f37';
            el.style.color = 'white';
        });
        const style = document.createElement('style');
        style.textContent = `
            table.dataTable thead th,
            .table thead th {
                background-color: #155f37 !important;
                color: white !important;
            }

            .table-hover thead tr:hover th {
                color: white !important;
                background-color: #155f37 !important;
            }
        `;
        document.head.appendChild(style);
    }, 500);

    const attachButton = document.getElementById('attachButton');
    const attachFile = document.getElementById('attachFile');
    const attachmentPreview = document.getElementById('attachmentPreview');
    const fileName = document.getElementById('fileName');
    const removeAttachment = document.getElementById('removeAttachment');

    if (attachButton && attachFile) {
        attachButton.addEventListener('click', () => {
            attachFile.click();
        });

        attachFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                attachmentPreview.style.display = 'block';
            }
        });

        removeAttachment.addEventListener('click', () => {
            attachFile.value = '';
            attachmentPreview.style.display = 'none';
            fileName.textContent = '';
        });
    }
});

let currentPostId = null;

// Remove the redundant initializePostsTable function and use GiyaTable instead
// Add this utility function for API calls with better error handling
// Keep these functions as they are specific to post details
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
// Add this utility function for API calls with better error handling
async function safeApiCall(endpoint, options = {}) {
    try {
        const baseURL = sessionStorage.getItem('baseURL') || '';
        const response = await axios.get(`${baseURL}${endpoint}`, options);
        return response.data;
    } catch (error) {
        console.error(`API call error (${endpoint}):`, error);
        let errorMessage = 'Failed to load data from server';
        // Extract more detailed error message if available
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorMessage = `Server error: ${error.response.status}`;
            console.error('Error response:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'No response from server';
        } else {
            // Something happened in setting up the request that triggered an Error
            errorMessage = error.message || 'Unknown error';
        }
        toastr.error(errorMessage);
        throw error;
    }
}
async function showPostDetails(postId) {
    try {
        currentPostId = postId;
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
            const repliesContainer = document.querySelector('.replies-container');
            if (repliesContainer) {
                repliesContainer.innerHTML = '';
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
                if (post.replies && post.replies.length > 0) {
                    post.replies.forEach(reply => {
                        // Skip forward notification messages for all users
                        if ((reply.display_name === 'GIYA Representative' &&
                            reply.reply_message.includes('Post forwarded to'))) {
                            return;
                        }

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
            // Add check for forwarded status and update the UI accordingly
            const forwardBtn = document.getElementById('forwardPostBtn');
            if (forwardBtn) {
                // Only show forward button for admins (user_typeId = 6), not POCs (user_typeId = 5)
                const userType = sessionStorage.getItem('user_typeId');
                if (userType === '6') {
                    forwardBtn.style.display = 'inline-block';
                    // Disable forward button if already forwarded
                    if (post.is_forwarded == 1) {
                        forwardBtn.classList.add('disabled');
                        forwardBtn.setAttribute('data-bs-toggle', 'tooltip');
                        forwardBtn.setAttribute('data-bs-placement', 'top');
                        forwardBtn.setAttribute('title', 'This post has already been forwarded');
                    } else {
                        forwardBtn.classList.remove('disabled');
                        forwardBtn.removeAttribute('data-bs-toggle');
                        forwardBtn.removeAttribute('title');
                    }
                } else {
                    forwardBtn.style.display = 'none';
                }
                // If post is forwarded, show who forwarded it for POC users
                if (post.is_forwarded == 1 && userType === '5' && post.forwarded_by_name) {
                    const forwardInfoEl = document.getElementById('forwardInfo');
                    if (forwardInfoEl) {
                        forwardInfoEl.innerHTML = `
                            <div class="alert alert-info">
                                <i class="bi bi-send me-2"></i>
                                Forwarded by ${post.forwarded_by_name} on ${new Date(post.forwarded_at).toLocaleString()}
                            </div>
                        `;
                        forwardInfoEl.style.display = 'block';
                    }
                }
            }
        } else {
            toastr.error(response.data.message || 'Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post details:', error);
        toastr.error('Failed to load post details');
    }
}
function updateModalButtons() {
    $('#postDetailsModal .btn-primary').addClass('btn-solid-primary').removeClass('btn-primary');
    $('#postDetailsModal .btn-warning').addClass('btn-solid-warning').removeClass('btn-warning');
    $('#postDetailsModal .btn-danger').addClass('btn-solid-danger').removeClass('btn-danger');
    $('#postDetailsModal .btn-success').addClass('btn-solid-success').removeClass('btn-success');
}
function getStatusClass(status) {
    switch (Number(status)) {
        case 0: return 'bg-danger';
        case 1: return 'bg-warning';
        case 2: case 3: return 'bg-success';
        default: return 'bg-secondary';
    }
}
function getStatusText(status) {
    switch (Number(status)) {
        case 0: return 'Pending';
        case 1: return 'Ongoing';
        case 2: case 3: return 'Resolved';
        default: return 'Unknown';
    }
}
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
        `).join('') : '<p class="text-center text-muted">No replies yet</p>';
}
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
                <div class="attachment-container mt-2">
                    <button type="button" class="btn btn-outline-secondary" id="attachButton">
                        <i class="bi bi-paperclip"></i> Attach File
                    </button>
                    <input type="file" id="attachFile" style="display: none;">
                    <div id="attachmentPreview" style="display: none;">
                        <span id="fileName"></span>
                        <button type="button" class="btn btn-sm btn-danger" id="removeAttachment">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
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
// function isAdminDashboardPage() {
//     const path = window.location.pathname.toLowerCase();
//     return path.includes('/dashboard/latest-post.html') ||
//            path.includes('/dashboard/visitors.html') ||
//            path.includes('students.html');
// }
function scrollToBottom() {
    const repliesContainer = document.querySelector('.replies-container');
    if (repliesContainer) {
        repliesContainer.scrollTop = repliesContainer.scrollHeight;
    }
}
async function submitReplyWithoutRefresh(event, postId) {
    event.preventDefault();
    const messageInput = document.querySelector('.reply-input');
    const attachFile = document.getElementById('attachFile');

    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (!message && !attachFile.files[0]) return;
    try {
        messageInput.value = '';
        const adminName = "GIYA Representative";
        // Create FormData object for file upload
        const formData = new FormData();
        formData.append('post_id', postId);
        formData.append('reply_message', message);
        formData.append('admin_id', sessionStorage.getItem('user_id') || '25');
        formData.append('auto_update_status', true);
        // Add file if one is selected
        if (attachFile.files[0]) {
            formData.append('attachment', attachFile.files[0]);
        }
        // Add reply to UI immediately
        addReplyToUI(message, adminName, 'admin-message', new Date(), attachFile.files[0]?.name);

        // Reset attachment UI
        document.getElementById('attachmentPreview').style.display = 'none';
        document.getElementById('fileName').textContent = '';
        attachFile.value = '';
        scrollToBottom();
        await axios.post(
            `${sessionStorage.getItem('baseURL')}posts.php?action=submit_reply`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        refreshTables();
    } catch (error) {
        console.error('Error submitting reply:', error);
        toastr.error('Failed to send reply');
    }
}
function addReplyToUI(message, authorName, cssClass, timestamp, attachment = null) {
    const repliesContainer = document.querySelector('.replies-container');
    if (!repliesContainer) return;
    const newReply = document.createElement('div');
    newReply.className = `message-bubble ${cssClass}`;
    let attachmentHtml = '';
    if (attachment) {
        attachmentHtml = `
            <div class="attachment-preview mt-2">
                <i class="bi bi-paperclip"></i>
                <span>${attachment}</span>
            </div>
        `;
    }
    newReply.innerHTML = `
        <div class="message-content">
            <strong>${authorName}</strong>
            <p>${message}</p>
            ${attachmentHtml}
            <small>${timestamp.toLocaleString()}</small>
        </div>
    `;
    const noRepliesMsg = repliesContainer.querySelector('p.text-muted');
    if (noRepliesMsg) {
        repliesContainer.innerHTML = '';
    }
    repliesContainer.appendChild(newReply);
}
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
function refreshTables() {
    ['#postsTable', '#latestPostsTable', '#resolvedPostsTable'].forEach(tableId => {
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().ajax.reload(null, false);
        }
    });
}
function getStatusBadgeHtml(status) {
    return renderStatusBadge(status);
}
window.currentFilter = 'all';
// Fix the DataTables filtering that's causing maximum call stack exceeded error
// Remove the existing filter and replace with a more stable version
$.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => {
    // Keep all other filters except our problematic one
    return !fn.toString().includes('window.currentFilter');
});
// Add the correct filter for regular tables
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    // Skip filtering for resolved posts tables
    if (settings.nTable.id.includes('resolvedPostsTable')) {
        return true;
    }
    // For regular tables, apply the filter based on status
    const statusCell = data[0];
    if (!statusCell) return true;
    // Extract text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = statusCell;
    const statusText = tempDiv.textContent.trim().toLowerCase();
    // Apply filter
    switch(window.currentFilter) {
        case 'all':
            return statusText !== 'resolved'; // Always exclude resolved posts on main pages
        case 'pending':
            return statusText === 'pending';
        case 'ongoing':
            return statusText === 'ongoing';
        default:
            return statusText !== 'resolved'; // Default to excluding resolved posts
    }
});
// Keep the attachPostFiltering function as a pass-through to GiyaTable
function attachPostFiltering(table, filterButtonSelector) {
    GiyaTable.attachFiltering(table, filterButtonSelector);
}
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
function isPOCUser() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return false;
    const user = JSON.parse(userInfo);
    return user.user_typeId == 5;
}
function getCurrentUserDepartment() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return '';
    const user = JSON.parse(userInfo);
    return user.department_name || '';
}
// Add headers to axios requests to include user type and department
axios.interceptors.request.use(function (config) {
    // Add user type and department headers to all requests
    const userInfo = sessionStorage.getItem('user');
    let userTypeId = sessionStorage.getItem('user_typeId');
    let userDepartmentId = sessionStorage.getItem('user_departmentId');
    // If user info exists but type/department aren't in session storage directly, extract them
    if (userInfo && (!userTypeId || !userDepartmentId)) {
        try {
            const user = JSON.parse(userInfo);
            userTypeId = userTypeId || user.user_typeId;
            userDepartmentId = userDepartmentId || user.user_departmentId;
            // Store these values in session storage for future use
            if (user.user_typeId) sessionStorage.setItem('user_typeId', user.user_typeId);
            if (user.user_departmentId) sessionStorage.setItem('user_departmentId', user.user_departmentId);
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }
    config.headers['User-Type'] = userTypeId || '';
    config.headers['User-Department'] = userDepartmentId || '';
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Update the axios interceptor to use the correct header names that match what posts.php expects
axios.interceptors.request.use(function (config) {
    // Add user type and department headers to all requests
    const userInfo = sessionStorage.getItem('user');
    let userTypeId = sessionStorage.getItem('user_typeId');
    let userDepartmentId = sessionStorage.getItem('user_departmentId');

    // If user info exists but type/department aren't in session storage directly, extract them
    if (userInfo && (!userTypeId || !userDepartmentId)) {
        try {
            const user = JSON.parse(userInfo);
            userTypeId = userTypeId || user.user_typeId;
            userDepartmentId = userDepartmentId || user.user_departmentId;

            // Store these values in session storage for future use
            if (user.user_typeId) sessionStorage.setItem('user_typeId', user.user_typeId);
            if (user.user_departmentId) sessionStorage.setItem('user_departmentId', user.user_departmentId);
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    // Use the exact header names expected in posts.php
    config.headers['X-User-Type'] = userTypeId || '';
    config.headers['X-User-Department'] = userDepartmentId || '';

    return config;
}, function (error) {
    return Promise.reject(error);
});

// Add a function to manually check if endpoints are configured correctly
function testEndpoints() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const departmentId = sessionStorage.getItem('user_departmentId');

    if (!departmentId) {
        console.warn('No department ID available for testing');
        return;
    }

    const endpoints = [
        `posts.php?action=get_posts_by_department&department_id=${departmentId}`,
        `posts.php?action=get_student_posts_by_department&department_id=${departmentId}`,
        `posts.php?action=get_visitor_posts_by_department&department_id=${departmentId}`,
        `posts.php?action=get_employee_posts_by_department&department_id=${departmentId}`
    ];

    console.log('Testing department endpoints...');

    endpoints.forEach(endpoint => {
        fetch(`${baseURL}${endpoint}`)
            .then(response => response.json())
            .then(data => {
                console.log(`Endpoint ${endpoint}: `, data);
            })
            .catch(error => {
                console.error(`Error testing ${endpoint}:`, error);
            });
    });
}

// Run endpoint test if in development
if (window.location.hostname === 'localhost' && window.userTypeId == 5) {
    setTimeout(testEndpoints, 3000);
}
