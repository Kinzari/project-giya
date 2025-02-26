let usersData = [];
let filteredData = [];

// sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); //KINZARI
sessionStorage.setItem("baseURL", "http://localhost/api/"); // For localhost
// sessionStorage.setItem("baseURL", "http://192.168.137.190/api/posts.php");

function filterUsersByType() {
  const currentPath = window.location.pathname;
  let filtered = usersData.filter(user => user.user_typeId !== "6");

  if (currentPath.includes("all-visitor")) {
    filtered = filtered.filter(user => user.user_typeId == 1);
  } else if (currentPath.includes("all-student")) {
    filtered = filtered.filter(user => user.user_typeId == 2);
  } else if (currentPath.includes("all-department")) {
    filtered = filtered.filter(user => ["3", "4", "5"].includes(user.user_typeId));
  }
  return filtered;
}


function initializeDataTable(data) {
  const columns = [
    { title: "School ID", data: "user_schoolId", defaultContent: "-" },
    { title: "Full Name", data: "full_name", defaultContent: "-" },
    {
      title: "Email",
      data: null,
      render: function(_, type, row) {
        if (type === 'display') {
          return (row.user_typeId == 1 || row.user_typeId == 2) ?
            row.user_email || "-" :
            row.phinmaed_email || "-";
        }
        return row.user_email || row.phinmaed_email || "-";
      }
    },
    {
      title: "Action",
      data: null,
      render: function (data, type, row) {
        return `
          <div class="d-flex gap-1 justify-content-start align-items-center">
            <button class="btn btn-sm btn-info view-btn" data-bs-toggle="modal" data-bs-target="#userModal" title="View">
              <i class="bi bi-eye"></i>
            </button>
            <a href="#" class="btn btn-sm btn-warning" onclick="resetUserPassword(${row.user_id})" title="Reset Password">
              <i class="bi bi-key"></i>
            </a>
            <button class="btn btn-sm ${row.user_status === 1 ? 'btn-success' : 'btn-danger'} status-btn"
              onclick="updateUserStatus(${row.user_id}, ${row.user_status === 1 ? 0 : 1})" title="Status">
              <i class="bi bi-toggle-${row.user_status === 1 ? 'on' : 'off'}"></i>
            </button>
          </div>
        `;
      }
    }
  ];

  if ($.fn.DataTable.isDataTable("#usersTable")) {
    $("#usersTable").DataTable().destroy();
  }

  const table = $("#usersTable").DataTable({
    data: data,
    columns: columns,
    dom: "<'row'<'col-sm-6'l><'col-sm-6'Bf>>rtip",
    buttons: ['excel', 'pdf', 'print'],
    responsive: true,
    ordering: true,
    searching: true,
    lengthMenu: [10, 15, 20],
    pageLength: 10,
    language: {
      emptyTable: "No data available"
    }
  });

  $('#usersTable').on('click', '.view-btn', function(e) {
    e.preventDefault();
    const data = table.row($(this).closest('tr')).data();

    if(data) {
      $('#detail-schoolId').text(data.user_schoolId || '-');
      $('#detail-firstName').text(data.user_firstname || '-');
      $('#detail-middleName').text(data.user_middlename || '-');
      $('#detail-lastName').text(data.user_lastname || '-');
      $('#detail-suffix').text(data.user_suffix || '-');
      $('#detail-contact').text(data.user_contact || '-');
      $('#detail-department').text(data.department_name || '-');
      $('#detail-course').text(data.course_name || '-');
      $('#detail-userType').text(data.user_type || '-');
      $('#detail-status').text(data.user_status === 1 ? 'Active' : 'Inactive');

      if(String(data.user_typeId) === "1") {
        $('#detail-email').text(data.user_email || '-');
      } else {
        $('#detail-email').text(data.phinmaed_email || '-');
      }
      $('#userModal').modal('show');
    }
  });

  $('#userModal').on('hidden.bs.modal', function () {
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  });
}

async function updateUserStatus(userId, newStatus) {
    try {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${newStatus === 1 ? "activate" : "deactivate"} this user?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, proceed!"
        });

        if (!result.isConfirmed) return;

        const baseURL = sessionStorage.getItem("baseURL");
        const response = await axios.post(`${baseURL}giya.php?action=update_user_status`, {
            user_id: userId,
            user_status: newStatus
        });

        if (response.data.success) {
            await Swal.fire("Success!", "User status updated successfully", "success");

            // Refresh both tables if they exist
            if ($.fn.DataTable.isDataTable("#usersTable")) {
                await $("#usersTable").DataTable().ajax.reload(null, false);
            }
            if ($.fn.DataTable.isDataTable("#postsTable")) {
                await $("#postsTable").DataTable().ajax.reload(null, false);
            }
            if ($.fn.DataTable.isDataTable("#latestPostsTable")) {
                await $("#latestPostsTable").DataTable().ajax.reload(null, false);
            }

            // Update any visible user details modal
            if ($('#userModal').is(':visible')) {
                const modalUserId = $('#userModal').data('userId');
                if (modalUserId === userId) {
                    document.getElementById('detail-status').textContent = newStatus === 1 ? 'Active' : 'Inactive';
                }
            }
        } else {
            Swal.fire("Error!", response.data.message || "Failed to update user status", "error");
        }
    } catch (error) {
        console.error("Error updating user status:", error);
        Swal.fire("Error!", "An error occurred while updating user status", "error");
    }
}

async function resetUserPassword(userId) {
  try {
    const result = await Swal.fire({
      title: 'Reset Password?',
      text: "Password will be reset to 'phinma-coc'",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset it!'
    });

    if (result.isConfirmed) {
      const baseURL = sessionStorage.getItem("baseURL");
      const response = await axios.post(`${baseURL}giya.php?action=reset_password`, {
        user_id: userId,
      });

      if (response.data.success) {
        Swal.fire('Success!', "Password has been reset to 'phinma-coc'", 'success');
      } else {
        Swal.fire('Error!', 'Failed to reset password', 'error');
      }
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    Swal.fire('Error!', 'An error occurred while resetting the password', 'error');
  }
}

async function fetchUsers() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}giya.php?action=users`);

    if (response.data.success && Array.isArray(response.data.users)) {
      usersData = response.data.users;
      filteredData = filterUsersByType();
      initializeDataTable(filteredData);
    } else {
      toastr.error("Failed to load user data");
      initializeDataTable([]);
    }
  } catch (error) {
    toastr.error("Error loading user data");
    initializeDataTable([]);
  }
}

function initializeSidebar() {
    // Toggle sidebar collapse
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar-nav');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // Restore sidebar state
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize sidebar
    initializeSidebar();

    // Setup logout handlers
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Add user info to sidebar
    const userString = localStorage.getItem('user');
    if (userString) {
        const user = JSON.parse(userString);
        const userProfile = document.querySelector('.user-profile .user-name');
        if (userProfile) {
            userProfile.textContent = user.user_firstname;
        }
    }

    // Initialize other dashboard features
    if (document.getElementById("visitor-count")) {
        await fetchUsers();
    }
});

// Update initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Handle active nav links
    const currentPath = window.location.pathname;
    document.querySelectorAll('.offcanvas .nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });

    // Update user name in sheet if logged in
    const userString = localStorage.getItem('user');
    if (userString) {
        const user = JSON.parse(userString);
        const userNameElement = document.querySelector('.user-profile .user-name');
        if (userNameElement && user.user_firstname) {
            userNameElement.textContent = user.user_firstname;
        }
    }

    // Initialize tooltips if using them
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Example: define viewUserDetails if not already defined.
async function viewUserDetails(userId, fullName, schoolId, userStatus) {
    try {
        const baseURL = sessionStorage.getItem("baseURL");
        const response = await axios.get(`${baseURL}giya.php?action=get_user_details&user_id=${userId}`);

        if (response.data.success) {
            const user = response.data.user;
            document.getElementById('detail-schoolId').textContent = user.user_schoolId || '-';
            document.getElementById('detail-firstName').textContent = user.user_firstname || '-';
            document.getElementById('detail-middleName').textContent = user.user_middlename || '-';
            document.getElementById('detail-lastName').textContent = user.user_lastname || '-';
            document.getElementById('detail-suffix').textContent = user.user_suffix || '-';
            document.getElementById('detail-email').textContent = user.phinmaed_email || user.user_email || '-';
            document.getElementById('detail-contact').textContent = user.user_contact || '-';
            document.getElementById('detail-department').textContent = user.department_name || '-';
            document.getElementById('detail-course').textContent = user.course_name || '-';
            document.getElementById('detail-userType').textContent = user.user_type || '-';
            document.getElementById('detail-status').textContent = user.user_status == 1 ? 'Active' : 'Inactive';
            var modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        } else {
            toastr.error('Failed to load user details');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        toastr.error('Error loading user details');
    }
}

// Expose functions to global scope
window.updateUserStatus = updateUserStatus;
window.resetUserPassword = resetUserPassword;
window.viewUserDetails = viewUserDetails;
