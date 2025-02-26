// posts.js
sessionStorage.setItem("baseURL", "http://localhost/api/"); // For localhost
// sessionStorage.setItem("baseURL", "http://192.168.137.190/api/posts.php");
// Expose these functions globally so that event handlers in this file can call them.
window.showPostDetails = showPostDetails;
window.submitReply = submitReply;

// --------------------------
// Helper: Render status badge (text only)
// --------------------------
function renderStatus(data) {
  let statusText = "";
  let badgeClass = "";
  switch (Number(data)) {
    case 0:
      statusText = "Unread";
      badgeClass = "secondary";
      break;
    case 1:
      statusText = "Read";
      badgeClass = "info";
      break;
    case 2:
      statusText = "Pending";
      badgeClass = "warning";
      break;
    case 3:
      statusText = "Resolved";
      badgeClass = "success";
      break;
    default:
      statusText = "Unknown";
      badgeClass = "dark";
  }
  return `<span class="badge bg-${badgeClass}">${statusText}</span>`;
}

// --------------------------
// Function: Show Post Details Modal (opens when clicking Full Name)
// --------------------------
async function showPostDetails(postId) {
  try {
    const response = await axios.get(`${sessionStorage.getItem('baseURL')}posts.php?action=get_post_details&post_id=${postId}`);
    if (response.data.success && response.data.post) {
      const post = response.data.post;
      console.log('Post details:', post); // For debugging

      // Format the date to MM-DD-YYYY with dashes
      const postDate = new Date(post.post_date);
      const formattedDate = postDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-'); // Replace all forward slashes with dashes

      const container = document.getElementById('postContainer');
      const isResolved = post.post_status === 3;

      container.innerHTML = `
        <div class="post-card card mb-4">
          <div class="post-header p-3">
            <div class="mb-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-person-circle fs-4"></i>
                <div>
                  <div class="fs-4 fw-bold">${post.user_fullname}</div>
                  <small class="text-muted">${post.user_schoolId}</small>
                </div>
              </div>
              <div class="mt-2">
                <div class="fs-5 text-primary">${post.postType_name}</div>
                <div class="fs-5 text-secondary">${post.post_title}</div>
                ${post.inquiry_type ? `
                  <div class="mt-2">
                    <div class="fs-6 text-muted">Inquiry Type: ${post.inquiry_type}</div>
                    <div class="small text-muted">${post.inquiry_description || ''}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="post-content px-3 pb-4 position-relative">
            <p class="mb-4">${post.post_message}</p>
            <div class="text-muted small position-absolute bottom-0 end-0 pe-3 pb-2">
              ${formattedDate} ${new Date(post.post_date + " " + post.post_time)
                .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' })}
            </div>
          </div>
          <div class="replies-section bg-light p-3">
            <h6 class="fw-bold mb-3">Replies</h6>
            <div class="replies-container mb-3">
              ${post.replies && post.replies.length ? post.replies.map(reply => `
                <div class="reply-card mb-2 p-2 border-start border-4 border-primary bg-white">
                  <div class="d-flex justify-content-between">
                    <strong>${reply.display_name}</strong>
                    <small class="text-muted">${reply.reply_date}</small>
                  </div>
                  <p class="mb-0">${reply.reply_message}</p>
                </div>
              `).join('') : '<p>No replies yet.</p>'}
            </div>
            ${!isResolved ? `
              <form class="reply-form" onsubmit="submitReply(event, ${post.post_id})">
                <div class="input-group">
                  <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('attachFile${post.post_id}').click()">
                    <i class="bi bi-paperclip"></i>
                  </button>
                  <input type="file" id="attachFile${post.post_id}" style="display: none;">
                  <input type="text" class="form-control reply-input" placeholder="Write a reply..." required>
                  <button class="btn btn-primary" type="submit">Reply</button>
                </div>
              </form>
            ` : '<p class="text-muted">This concern is resolved. Replying is disabled.</p>'}
          </div>
        </div>
      `;

      const modal = new bootstrap.Modal(document.getElementById('postDetailsModal'));
      modal.show();
    } else {
      toastr.error('Failed to load post details');
    }
  } catch (error) {
    console.error('Error fetching post details:', error);
    toastr.error('Error loading post details');
  }
}

// --------------------------
// Function: Initialize Posts DataTable
// --------------------------
function initializePostsTable(tableSelector, action) {
  var table = $(tableSelector).DataTable({
    ajax: {
      url: `${sessionStorage.getItem('baseURL')}posts.php?action=${action}`,
      type: 'GET',
      dataSrc: 'data',
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
        // Full Name rendered as a clickable link for post details.
        title: "Full Name",
        data: null,
        render: function(data) {
          return `<a href="#" class="view-post text-decoration-none" data-post-id="${data.post_id}">
                    ${data.user_fullname}
                  </a>`;
        }
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
      },
      {
        title: "Action",
        data: null,
        render: function(data) {
          return `
            <div class="d-flex gap-1 align-items-center">
              <button class="btn btn-sm btn-info view-user-btn"
                data-user-id="${data.user_id}"
                data-user-fullname="${data.user_fullname}"
                data-user-schoolid="${data.user_schoolId}"
                data-user-status="${data.user_status}"
                title="View">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-warning" onclick="resetUserPassword(${data.user_id})" title="Reset Password">
                <i class="bi bi-key"></i>
              </button>
              <button class="btn btn-sm ${data.user_status == 1 ? 'btn-success' : 'btn-danger'}"
                onclick="updateUserStatus(${data.user_id}, ${data.user_status == 1 ? 0 : 1})"
                title="Status" data-user-id="${data.user_id}">
                <i class="bi bi-toggle-${data.user_status == 1 ? 'on' : 'off'}"></i>
              </button>
            </div>
          `;
        }
      }

    ],
    order: [[4, 'desc']],
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
    dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
         '<"row"<"col-sm-12"tr>>' +
         '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    language: {
        searchPlaceholder: "Search records...",
        search: "",
        lengthMenu: "_MENU_ per page"
    }
  });

  // Handle window resize for table responsiveness
  window.addEventListener('resize', function() {
      table.columns.adjust().responsive.recalc();
  });

  // When clicking the Full Name link, open post details.
  $(tableSelector).on('click', '.view-post', async function(e) {
    e.preventDefault();
    var postId = $(this).data('post-id');
    try {
      await axios.post(`${sessionStorage.getItem('baseURL')}posts.php?action=mark_post_read`, { post_id: postId });
      await showPostDetails(postId);
      table.ajax.reload(null, false);
    } catch (error) {
      console.error('Error handling post view:', error);
      toastr.error('Error viewing post details');
    }
  });

  // When clicking the "View" button in the Action column, open user details.
  $(tableSelector).on('click', '.view-user-btn', function(e) {
    e.preventDefault();
    var btn = $(this);
    var userId = btn.data('user-id');
    var fullName = btn.data('user-fullname');
    var schoolId = btn.data('user-schoolid');
    var userStatus = btn.data('user-status');
    // Call the globally available viewUserDetails (must be defined in admin-dashboard.js)
    if (typeof window.viewUserDetails === 'function') {
      window.viewUserDetails(userId, fullName, schoolId, userStatus);
    } else {
      console.error("viewUserDetails is not defined");
    }
  });

  return table;
}

// --------------------------
// Filtering: Use a global filter variable and attach a search function once.
// --------------------------
window.currentFilter = 'all';
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    if (window.currentFilter === 'all') return true;

    // Get the status text from the first column (status column)
    const statusCell = data[0]; // Get the HTML content of status cell
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = statusCell;
    const statusText = tempDiv.textContent.trim().toLowerCase();

    switch(window.currentFilter) {
        case 'unread':
            return statusText === 'unread';
        case 'read':
            return statusText === 'read';
        case 'pending':
            return statusText === 'pending';
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

        // Update active state of filter buttons
        $(filterButtonSelector).removeClass('active');
        $(this).addClass('active');

        // Redraw the table with the new filter
        table.draw();
    });
}

// --------------------------
// Add filter buttons HTML to the page
// --------------------------
function addFilterButtons() {
    const existingFilter = document.querySelector('.filter-buttons-container');
    if (!existingFilter) {
        const container = document.createElement('div');
        container.className = 'filter-buttons-container mb-3';
        container.innerHTML = `
            <div class="btn-group" role="group" aria-label="Filter posts">
                <button type="button" class="btn btn-outline-primary active" data-filter="all">All</button>
                <button type="button" class="btn btn-outline-secondary" data-filter="unread">Unread</button>
                <button type="button" class="btn btn-outline-info" data-filter="read">Read</button>
                <button type="button" class="btn btn-outline-warning" data-filter="pending">Pending</button>
                <button type="button" class="btn btn-outline-success" data-filter="resolved">Resolved</button>
            </div>
        `;

        // Insert before the DataTable
        const table = document.querySelector('table');
        if (table) {
            table.parentNode.insertBefore(container, table);
        }
    }
}

// --------------------------
// Initialization based on current page
// --------------------------
document.addEventListener("DOMContentLoaded", function() {
    var table;
    var path = window.location.pathname.toLowerCase();

    if (document.getElementById("latestPostsTable")) {
        table = initializePostsTable('#latestPostsTable', 'get_posts');
    } else if (document.getElementById("postsTable")) {
        var action = "";
        if (path.includes("students.html")) {
            action = "get_student_posts";
        } else if (path.includes("visitors.html")) {
            action = "get_visitor_posts";
        }
        table = initializePostsTable('#postsTable', action);
    }

    // Attach filtering after table initialization
    const filterButtons = document.querySelectorAll('.btn-group button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            window.currentFilter = filter;

            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Redraw the table with the new filter
            if (table) {
                table.draw();
            }
        });
    });
});

// --------------------------
// Function: Submit reply (exposed globally)
async function submitReply(event, postId) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('.reply-input');
  const fileInput = document.getElementById(`attachFile${postId}`);
  const message = input.value;

  const formData = new FormData();
  formData.append('post_id', postId);
  formData.append('reply_message', message);
  formData.append('admin_id', '25');
  if (fileInput && fileInput.files[0]) {
    formData.append('attachedFile', fileInput.files[0]);
  }

  try {
    const response = await axios.post(`${sessionStorage.getItem('baseURL')}posts.php?action=submit_reply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data.success) {
      toastr.success('Reply submitted successfully');
      form.reset();
      await showPostDetails(postId);
      if ($.fn.DataTable.isDataTable("#postsTable")) {
        $("#postsTable").DataTable().ajax.reload(null, false);
      }
      if ($.fn.DataTable.isDataTable("#latestPostsTable")) {
        $("#latestPostsTable").DataTable().ajax.reload(null, false);
      }
    } else {
      toastr.error('Failed to submit reply');
    }
  } catch (error) {
    console.error('Error submitting reply:', error);
    toastr.error('Error submitting reply');
  }
}
