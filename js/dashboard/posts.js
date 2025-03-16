document.addEventListener('DOMContentLoaded', function() {
    const elementsExist = checkRequiredElements();
    if (!elementsExist) {
        console.warn('Missing required elements - post details may not load correctly');
    }
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        console.error("baseURL not found in sessionStorage");
        sessionStorage.setItem('baseURL', 'http://localhost/giya-api/');

        toastr.warning('API URL not found. Using default URL. You may need to login again.');
    }
    let table;
    const path = window.location.pathname.toLowerCase();
    const userInfo = sessionStorage.getItem('user');
    let departmentId = null;
    let userTypeId = null;
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            departmentId = user.user_departmentId;
            userTypeId = user.user_typeId;
            if (userTypeId == 5 && !departmentId) {
                toastr.warning('Department ID not found in your profile. Please contact the administrator.');
                console.warn('POC user without department ID:', user);
            }
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    // Use GiyaTable for initializing tables instead of custom implementation
    if (document.getElementById("latestPostsTable")) {
        const action = (userTypeId == 5 && departmentId) ? `get_posts_by_department&department_id=${departmentId}` : 'get_posts';

        // Ensure discord-pagination class is added before initializing the table
        $('.student-table-container').addClass('discord-pagination');

        // Initialize table
        table = GiyaTable.initPostsTable('#latestPostsTable', action, null);

        // Don't call addPageNumberInput here - it's now called from initPostsTable
    } else if (document.getElementById("postsTable")) {
        let action = "";
        if (path.includes("students.html")) {
            action = (userTypeId == 5 && departmentId) ? `get_student_posts_by_department&department_id=${departmentId}` : "get_student_posts";
        } else if (path.includes("visitors.html")) {
            action = (userTypeId == 5 && departmentId) ? `get_visitor_posts_by_department&department_id=${departmentId}` : "get_visitor_posts";
        } else if (path.includes("employees.html")) {
            action = (userTypeId == 5 && departmentId) ? `get_employee_posts_by_department&department_id=${departmentId}` : "get_employee_posts";
        }

        // Ensure discord-pagination class is added before initializing the table
        $('.student-table-container').addClass('discord-pagination');

        table = GiyaTable.initPostsTable('#postsTable', action, null);

        // Don't call addPageNumberInput here - it's now called from initPostsTable
    }

    if (table) {
        GiyaTable.attachFiltering(table, '.btn-group button');
    }

    window.showPostDetails = showPostDetails;
    window.submitReply = submitReplyWithoutRefresh;
    window.changeStatus = changeStatus;

    // Remove campus column styling after tables are loaded
    // Remove the entire block that applies styles to campus columns

    // Keep only the table header styling
    setTimeout(() => {
        // Apply styles to all table headers
        document.querySelectorAll('th').forEach(el => {
            el.style.backgroundColor = '#155f37';
            el.style.color = 'white';
        });

        // Make sure the styling persists on hover
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
});

// Remove the redundant initializePostsTable function and use GiyaTable instead

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

let currentPostId = null;

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
        `).join('')
        : '<p class="text-center text-muted">No replies yet</p>';
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

function isAdminDashboardPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('/dashboard/latest-post.html') ||
           path.includes('/dashboard/visitors.html') ||
           path.includes('students.html');
}

function scrollToBottom() {
    const repliesContainer = document.querySelector('.replies-container');
    if (repliesContainer) {
        repliesContainer.scrollTop = repliesContainer.scrollHeight;
    }
}

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

    // Apply filters
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
