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

    let userTypeId = null;
    let departmentId = null;
    const userInfo = sessionStorage.getItem('user');

    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            departmentId = user.user_departmentId;
            userTypeId = user.user_typeId;

            window.userTypeId = userTypeId;
            window.departmentId = departmentId;

            sessionStorage.setItem('user_typeId', userTypeId);
            sessionStorage.setItem('user_departmentId', departmentId);

            if (userTypeId == 5 && !departmentId) {
                toastr.warning('Department ID not found in your profile. Please contact the administrator.');
            }
        } catch (e) {
            // Handle error silently
        }
    }

    function initializeTable(tableId, action) {
        const tableElement = document.getElementById(tableId);
        if (!tableElement) {
            return null;
        }

        if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
            $(`#${tableId}`).DataTable().destroy();
        }

        const originalHtml = tableElement.outerHTML;
        window[`${tableId}_originalHtml`] = originalHtml;

        const table = GiyaTable.initPostsTable(`#${tableId}`, action, null, {
            order: [[7, 'desc'], [8, 'desc']],
            drawCallback: function(settings) {
                tableElement.style.display = '';
                tableElement.style.visibility = 'visible';

                $('table.dataTable thead th').css({
                    'background-color': '#155f37',
                    'color': 'white'
                });
            }
        });

        window[`${tableId}Table`] = table;

        const container = $(tableElement).closest('.student-table-container');
        if (container.length) {
            container.addClass('discord-pagination');
        }

        setInterval(() => {
            const currentElement = document.getElementById(tableId);
            if (!currentElement ||
                currentElement.style.display === 'none' ||
                !currentElement.offsetParent) {

                const container = document.querySelector(`.table-responsive, [data-table-id="${tableId}"]`);
                if (container) {
                    container.innerHTML = window[`${tableId}_originalHtml`];

                    const newTable = GiyaTable.initPostsTable(`#${tableId}`, action);
                    window[`${tableId}Table`] = newTable;
                }
            }
        }, 1000);

        return table;
    }

    let table = null;

    if (document.getElementById("latestPostsTable")) {
        let action = 'get_latest_posts';

        if (userTypeId == 5 && departmentId) {
            action = `get_posts_by_department&department_id=${departmentId}`;
        }

        table = initializeTable("latestPostsTable", action);
        window.latestPostsTable = table;
    }
    else if (document.getElementById("postsTable")) {
        let action = "";

        if (path.includes("students.html")) {
            action = (userTypeId == 5 && departmentId) ?
                `get_student_posts_by_department&department_id=${departmentId}` :
                "get_student_posts";
        }
        else if (path.includes("visitors.html")) {
            action = (userTypeId == 5 && departmentId) ?
                `get_visitor_posts_by_department&department_id=${departmentId}` :
                "get_visitor_posts";
        }
        else if (path.includes("employees.html")) {
            action = (userTypeId == 5 && departmentId) ?
                `get_employee_posts_by_department&department_id=${departmentId}` :
                "get_employee_posts";
        }

        table = initializeTable("postsTable", action);
        window.postsTable = table;
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
    }, 500);

    const attachButton = document.getElementById('attachButton');
    const attachFile = document.getElementById('attachFile');
    if (attachButton && attachFile) {
        attachButton.addEventListener('click', () => {
            attachFile.click();
        });
    }
});

let currentPostId = null;

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

async function safeApiCall(endpoint, options = {}) {
    try {
        const baseURL = sessionStorage.getItem('baseURL') || '';
        const response = await axios.get(`${baseURL}${endpoint}`, options);
        return response.data;
    } catch (error) {
        let errorMessage = 'Failed to load data from server';
        if (error.response) {
            errorMessage = `Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = 'No response from server';
        } else {
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
        const response = await axios.get(`${baseURL}posts.php?action=get_post_details&post_id=${postId}`);
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

            const forwardBtn = document.getElementById('forwardPostBtn');
            if (forwardBtn) {
                const userType = sessionStorage.getItem('user_typeId');
                if (userType === '6') {
                    forwardBtn.style.display = 'inline-block';
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
    if (status === '2') {
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

function isAdminDashboardPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('/dashboard/latest-post.html') ||
           path.includes('/dashboard/visitors.html') ||
           path.includes('/dashboard/students.html') ||
           path.includes('/dashboard/employess.html');
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
    const attachFile = document.getElementById('attachFile');

    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (!message && !attachFile.files[0]) return;
    try {
        messageInput.value = '';
        const adminName = "GIYA Representative";
        const formData = new FormData();
        formData.append('post_id', postId);
        formData.append('reply_message', message);
        formData.append('admin_id', sessionStorage.getItem('user_id') || '25');
        formData.append('auto_update_status', true);

        if (attachFile.files[0]) {
            formData.append('attachment', attachFile.files[0]);
        }

        addReplyToUI(message, adminName, 'admin-message', new Date(), attachFile.files[0]?.name);

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
        toastr.error('Failed to update status');
    }
}

function refreshTables() {
    function safeRefresh(tableVar, tableId) {
        try {
            if (tableVar && typeof tableVar.ajax === 'object' && typeof tableVar.ajax.reload === 'function') {
                tableVar.ajax.reload(function() {
                    const tableEl = document.getElementById(tableId);
                    if (tableEl) {
                        tableEl.style.display = '';
                        tableEl.style.visibility = 'visible';
                    }
                }, false);

                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    const refreshed = [];

    if (window.latestPostsTable) {
        refreshed.push(safeRefresh(window.latestPostsTable, "latestPostsTable"));
    }

    if (window.postsTable) {
        refreshed.push(safeRefresh(window.postsTable, "postsTable"));
    }

    if (window.resolvedPostsTable) {
        refreshed.push(safeRefresh(window.resolvedPostsTable, "resolvedPostsTable"));
    }

    if (!refreshed.some(Boolean)) {
        ['latestPostsTable', 'postsTable', 'resolvedPostsTable'].forEach(tableId => {
            try {
                if (document.getElementById(tableId) && $.fn.DataTable.isDataTable(`#${tableId}`)) {
                    $(`#${tableId}`).DataTable().ajax.reload();
                }
            } catch (error) {
                // Handle error silently
            }
        });
    }
}

function ensureTablesVisible() {
    ['latestPostsTable', 'postsTable', 'resolvedPostsTable'].forEach(tableId => {
        const table = document.getElementById(tableId);
        if (table) {
            table.style.display = '';
            table.style.visibility = 'visible';
        }
    });
}

setInterval(ensureTablesVisible, 500);

function getStatusBadgeHtml(status) {
    return renderStatusBadge(status);
}

window.currentFilter = 'all';

$.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(fn => {
    return !fn.toString().includes('window.currentFilter');
});

$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    if (settings.nTable.id.includes('resolvedPostsTable')) {
        return true;
    }

    const statusCell = data[0];
    if (!statusCell) return true;

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
        default:
            return statusText !== 'resolved';
    }
});

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

axios.interceptors.request.use(function (config) {
    const userInfo = sessionStorage.getItem('user');
    let userTypeId = sessionStorage.getItem('user_typeId');
    let userDepartmentId = sessionStorage.getItem('user_departmentId');

    if (userInfo && (!userTypeId || !userDepartmentId)) {
        try {
            const user = JSON.parse(userInfo);
            userTypeId = userTypeId || user.user_typeId;
            userDepartmentId = userDepartmentId || user.user_departmentId;

            if (user.user_typeId) sessionStorage.setItem('user_typeId', user.user_typeId);
            if (user.user_departmentId) sessionStorage.setItem('user_departmentId', user.user_departmentId);
        } catch (e) {
            // Handle error silently
        }
    }
    config.headers['User-Type'] = userTypeId || '';
    config.headers['User-Department'] = userDepartmentId || '';
    return config;
}, function (error) {
    return Promise.reject(error);
});

axios.interceptors.request.use(function (config) {
    const userInfo = sessionStorage.getItem('user');
    let userTypeId = sessionStorage.getItem('user_typeId');
    let userDepartmentId = sessionStorage.getItem('user_departmentId');

    if (userInfo && (!userTypeId || !userDepartmentId)) {
        try {
            const user = JSON.parse(userInfo);
            userTypeId = userTypeId || user.user_typeId;
            userDepartmentId = userDepartmentId || user.user_departmentId;

            if (user.user_typeId) sessionStorage.setItem('user_typeId', user.user_typeId);
            if (user.user_departmentId) sessionStorage.setItem('user_departmentId', user.user_departmentId);
        } catch (e) {
            // Handle error silently
        }
    }

    config.headers['X-User-Type'] = userTypeId || '';
    config.headers['X-User-Department'] = userDepartmentId || '';

    return config;
}, function (error) {
    return Promise.reject(error);
});
