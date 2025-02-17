let usersData = [];
let filteredData = [];

// Update baseURL to use the correct IP
sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php");

// Function to fetch visitor, student, and department counts
async function fetchCounts() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=get_counts`);
    if (response.data.success) {
      document.getElementById("visitor-count").innerText = response.data.visitors ?? "0";
      document.getElementById("student-count").innerText = response.data.students ?? "0";
      document.getElementById("department-count").innerText = response.data.faculties ?? "0";
    }
  } catch (error) {
    console.error("Error fetching counts:", error);
  }
}

// Function to filter users based on the current page
function filterUsersByType() {
  const currentPath = window.location.pathname;
  let filtered = usersData.filter(user => user.user_typeId !== "6");

  if (currentPath.includes("all-visitor")) {
    filtered = filtered.filter(user => user.user_typeId == 1 || user.user_typeId === "1");
  } else if (currentPath.includes("all-student")) {
    filtered = filtered.filter(user => user.user_typeId == 2 || user.user_typeId === "2");
  } else if (currentPath.includes("all-department")) {
    filtered = filtered.filter(user => ["3", "4", "5", 3, 4, 5].includes(Number(user.user_typeId)));
  }

  return filtered;
}

// Configure Toastr
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: 3000
};

// Initialize DataTable
function initializeDataTable(data) {
  const columns = [
    { title: "School ID", data: "user_schoolId", defaultContent: "-" },
    { title: "Full Name", data: "full_name", defaultContent: "-" },
    { title: "Department", data: "department_name", defaultContent: "-" },
    { title: "Course", data: "course_name", defaultContent: "-",
      visible: !window.location.pathname.includes("all-department") },
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
      },
    }
  ];

  if ($.fn.DataTable.isDataTable("#usersTable")) {
    $("#usersTable").DataTable().destroy();
  }

  const table = $("#usersTable").DataTable({
    data: data,
    columns: columns,
    // dom: "<'row'<'col-sm-6'l><'col-sm-6'Bf>>" +
    //      "<'row'<'col-sm-12'tr>>" +
    //      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
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

  // Handle view button click
  $('#usersTable').on('click', '.view-btn', function(e) {
    e.preventDefault();
    const data = table.row($(this).closest('tr')).data();

    if(data) {
      // Match field names with your database columns from tblusers table
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

      // Handle email display based on user type
      if(String(data.user_typeId) === "1") {
        $('#detail-email').text(data.user_email || '-');  // For visitors
      } else {
        $('#detail-email').text(data.phinmaed_email || '-');  // For students/faculty/staff
      }

      // Show modal using Bootstrap's method
      $('#userModal').modal('show');
    }
  });

  // Add this cleanup code for modal handling
  $('#userModal').on('hidden.bs.modal', function () {
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  });
}

// Function to update user status
async function updateUserStatus(userId, newStatus) {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${newStatus === 1 ? "activate" : "deactivate"} this user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, proceed!'
    });

    if (result.isConfirmed) {
      const baseURL = sessionStorage.getItem("baseURL");
      const response = await axios.post(`${baseURL}?action=update_user_status`, {
        user_id: userId,
        user_status: newStatus,
      });

      if (response.data.success) {
        toastr.success("User status updated successfully");
        filteredData = filteredData.map(user =>
          user.user_id === userId ? { ...user, user_status: newStatus } : user
        );
        $("#usersTable").DataTable().clear().rows.add(filteredData).draw();
      } else {
        toastr.error("Failed to update user status");
      }
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    toastr.error("An error occurred while updating user status");
  }
}

// Function to reset user password
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
      const response = await axios.post(`${baseURL}?action=reset_password`, {
        user_id: userId,
      });

      if (response.data.success) {
        Swal.fire(
          'Success!',
          "Password has been reset to 'phinma-coc'",
          'success'
        );
      } else {
        Swal.fire(
          'Error!',
          'Failed to reset password',
          'error'
        );
      }
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    Swal.fire(
      'Error!',
      'An error occurred while resetting the password',
      'error'
    );
  }
}

// Fetch users from the API
async function fetchUsers() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=users`);

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

// Logout function
function logout() {
  Swal.fire({
    title: 'Are you sure?',
    text: "You will be logged out of the system",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, logout!'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      window.location.href = "index.html";
    }
  });
}

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("visitor-count")) {
    await fetchCounts();
  }
  await fetchUsers();

  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});
