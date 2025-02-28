document.addEventListener('DOMContentLoaded', function() {
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize tables immediately after checking baseURL
    let table;
    const path = window.location.pathname.toLowerCase();

    // Initialize appropriate table based on page
    if (document.getElementById("latestPostsTable")) {
        table = initializePostsTable('#latestPostsTable', 'get_posts');
    } else if (document.getElementById("postsTable")) {
        let action = "";
        if (path.includes("students.html")) {
            action = "get_student_posts";
        } else if (path.includes("visitors.html")) {
            action = "get_visitor_posts";
        }
        table = initializePostsTable('#postsTable', action);
    }

    // Set up filter buttons after table is initialized
    if (table) {
        attachPostFiltering(table, '.btn-group button');
    }

    // Expose functions to window
    window.showPostDetails = showPostDetails;
    window.submitReply = submitReply;
});

function initializePostsTable(tableSelector, action) {
    // Remove any existing DataTable
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }

    return $(tableSelector).DataTable({
        ajax: {
            url: `${sessionStorage.getItem('baseURL')}posts.php?action=${action}`,
            type: 'GET',
            dataSrc: function(json) {
                // Remove the default filter - let the search function handle it
                return json.data;
            },
            error: function(xhr, error, thrown) {
                console.error('DataTables error:', error, thrown);
                toastr.error('Error loading data');
            }
        },
        processing: true,
        serverSide: false,
        columns: [
            {
                title: "Status",
                data: "post_status",
                render: renderStatus
            },
            {
                title: "Full Name",
                data: "user_fullname" // Simplified to just show name without link
            },
            { title: "Type", data: "postType_name" },
            { title: "Title", data: "post_title" },
            { title: "Date", data: "post_date" },
            {
                title: "Time",
                data: "post_time",
                render: function(data, type, row) {
                    const dt = new Date(row.post_date + " " + data);
                    const options = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' };
                    return dt.toLocaleTimeString('en-US', options);
                }
            }
        ],
        order: [[4, 'desc'], [5, 'desc']], // Sort by date and time in descending order
        pageLength: 10,
        responsive: true,
        scrollX: true,
        scrollCollapse: true,
        autoWidth: false,
        columnDefs: [
            {
                responsivePriority: 1,
                targets: [0, 1] // Status and Full Name columns
            },
            {
                responsivePriority: 2,
                targets: -1 // Action column
            },
            {
                responsivePriority: 3,
                targets: [2, 3] // Type and Title columns
            }
        ],
        dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
        language: {
            searchPlaceholder: "Search records...",
            search: "",
            lengthMenu: "_MENU_ per page",
            paginate: {
                previous: "<i class='bi bi-chevron-left'></i>",
                next: "<i class='bi bi-chevron-right'></i>"
            }
        },
        drawCallback: function() {
            // Add existing pagination styling
            $('.dataTables_paginate > .pagination').addClass('pagination-md border-0');
            $('.dataTables_paginate').addClass('mt-3');
            $('.page-item .page-link').css({
                'border': 'none',
                'padding': '0.5rem 1rem',
                'margin': '0 0.2rem'
            });

            // Add row styling and click handler
            $(tableSelector + ' tbody tr').css('cursor', 'pointer');
        },
        initComplete: function(settings, json) {
            // Add click handler for entire row
            $(tableSelector + ' tbody').on('click', 'tr', function() {
                const data = $(tableSelector).DataTable().row(this).data();
                if (data) {
                    showPostDetails(data.post_id);
                }
            });

            // Adjust columns
            this.api().columns.adjust().draw();
        }
    });
}

function renderStatus(data) {
    let statusText = "";
    let badgeClass = "";
    switch (Number(data)) {
        case 0:
            statusText = "Pending";
            badgeClass = "danger";
            break;
        case 1:
            statusText = "Ongoing";
            badgeClass = "warning";
            break;
        case 2:
            statusText = "Resolved";
            badgeClass = "success";
            break;
        default:
            statusText = "Unknown";
            badgeClass = "dark";
    }
    return `<span class="badge bg-${badgeClass}">${statusText}</span>`;
}

async function showPostDetails(postId) {
    try {
        const response = await axios.get(`${sessionStorage.getItem('baseURL')}posts.php?action=get_post_details&post_id=${postId}`);
        if (response.data.success && response.data.post) {
            const post = response.data.post;

            // Show modal before content update
            const modal = new bootstrap.Modal(document.getElementById('postDetailsModal'));
            modal.show();

            // Wait for modal to be visible
            await new Promise(resolve => setTimeout(resolve, 200));

            // Update header info
            document.getElementById('postUserName').textContent = post.user_fullname;
            document.getElementById('postUserId').textContent = post.user_schoolId;

            // Main post content with inquiry details
            const mainPost = document.querySelector('.main-post');
            mainPost.innerHTML = `
                <div class="d-flex flex-column">
                    <h5>${post.postType_name}</h5>
                    <h6>${post.post_title}</h6>
                    <div class="inquiry-details mb-3">
                        <strong>Type of Inquiry:</strong> ${post.inquiry_type || 'N/A'}
                        <p class="text-muted mb-2">${post.inquiry_description || ''}</p>
                    </div>
                    <p>${post.post_message}</p>
                    <small class="text-muted">${new Date(post.post_date + " " + post.post_time).toLocaleString()}</small>
                </div>
            `;

            // Just show replies
            const repliesContainer = document.querySelector('.replies-container');
            repliesContainer.innerHTML = post.replies && post.replies.length
                ? post.replies.map(reply => `
                    <div class="message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}">
                        <div class="message-content">
                            <strong>${reply.display_name}</strong>
                            <p>${reply.reply_message}</p>
                            <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                        </div>
                    </div>
                `).join('')
                : '<p class="text-center text-muted">No replies yet</p>';

            // Scroll to bottom immediately after modal is shown and content is updated
            if (repliesContainer) {
                repliesContainer.scrollTop = repliesContainer.scrollHeight;

                // Double-check scroll position after a short delay
                setTimeout(() => {
                    repliesContainer.scrollTop = repliesContainer.scrollHeight;
                }, 300);
            }

            // Simple form handler
            document.getElementById('replyForm').onsubmit = (e) => {
                e.preventDefault();
                submitReply(e, postId);
            };

            // Scroll to bottom after content is loaded
            setTimeout(() => {
                repliesContainer.scrollTop = repliesContainer.scrollHeight;
            }, 100);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function submitReply(event, postId) {
    event.preventDefault();
    const message = document.querySelector('.reply-input').value.trim();
    if (!message) return;

    try {
        const formData = new FormData();
        formData.append('post_id', postId);
        formData.append('reply_message', message);
        formData.append('admin_id', sessionStorage.getItem('user_id') || '25');

        // Keep the modal open and clear input immediately
        document.querySelector('.reply-input').value = '';

        const response = await axios.post(
            `${sessionStorage.getItem('baseURL')}posts.php?action=submit_reply`,
            formData
        );

        if (response.data.success) {
            // Update only the replies section
            if (response.data.data && response.data.data.post && response.data.data.post.replies) {
                const repliesContainer = document.querySelector('.replies-container');
                repliesContainer.innerHTML = response.data.data.post.replies.map(reply => `
                    <div class="message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}">
                        <div class="message-content">
                            <strong>${reply.display_name}</strong>
                            <p>${reply.reply_message}</p>
                            <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                        </div>
                    </div>
                `).join('');

                // Smooth scroll to bottom
                setTimeout(() => {
                    repliesContainer.scrollTop = repliesContainer.scrollHeight;
                }, 100);
            }

            // Refresh tables in background
            ['#postsTable', '#latestPostsTable'].forEach(tableId => {
                if ($.fn.DataTable.isDataTable(tableId)) {
                    $(tableId).DataTable().ajax.reload(null, false);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

window.currentFilter = 'all';
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    const statusCell = data[0];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = statusCell;
    const statusText = tempDiv.textContent.trim().toLowerCase();

    switch(window.currentFilter) {
        case 'all':
            // For "All Active", show everything except resolved
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

function attachPostFiltering(table, filterButtonSelector) {
    $(filterButtonSelector).on('click', function() {
        const filterValue = $(this).data('filter').toLowerCase();
        window.currentFilter = filterValue;

        $(filterButtonSelector).removeClass('active');
        $(this).addClass('active');

        table.draw();
    });
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
