let usersData = [];
let filteredData = [];

// Set the API base URL in sessionStorage
// sessionStorage.setItem("baseURL", "http://localhost/api/giya.php");
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
    } else {
      console.error("Error: Response success flag is false");
    }
  } catch (error) {
    console.error("Error fetching counts:", error);
  }
}

// Function to filter users based on the current page
function filterUsersByType() {
  const currentPath = window.location.pathname;
  console.log("Current path:", currentPath);
  console.log("All users before filtering:", usersData);

  // First filter out admin users (assuming admin has user_typeId of 0)
  let filtered = usersData.filter(user => user.user_typeId !== "6");

  if (currentPath.includes("all-visitor")) {
    filtered = filtered.filter(user => {
      console.log("Visitor check - user:", user.user_typeId, typeof user.user_typeId);
      return user.user_typeId == 1 || user.user_typeId === "1";
    });
  } else if (currentPath.includes("all-student")) {
    filtered = filtered.filter(user => {
      console.log("Student check - user:", user.user_typeId, typeof user.user_typeId);
      return user.user_typeId == 2 || user.user_typeId === "2";
    });
  } else if (currentPath.includes("all-department")) {
    filtered = filtered.filter(user => {
      console.log("Department check - user:", user.user_typeId, typeof user.user_typeId);
      return ["3", "4", "5", 3, 4, 5].includes(Number(user.user_typeId));
    });
  } else if (currentPath.includes("admin-dashboard") || currentPath.endsWith("/")) {
    // On dashboard, show all except admin
    filtered = filtered;
  }

  console.log("Filtered results:", filtered);
  return filtered;
}

// Configure Toastr
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: 3000
};

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

// Initialize DataTable
function initializeDataTable(data) {
  console.log("Initializing DataTable with data:", data);

  const columns = [
    {
      title: "School ID",
      data: "user_schoolId",
      defaultContent: "-"
    },
    {
      title: "Full Name",
      data: "full_name", // This matches the CONCAT in your PHP query
      defaultContent: "-"
    },
    {
      title: "Department",
      data: "department_name", // Matches the PHP query field
      defaultContent: "-"
    },
    {
      title: "Course",
      data: "course_name", // Matches the PHP query field
      defaultContent: "-"
    },
    {
      title: "Action",
      data: null,
      render: function (data, type, row) {
        return `
          <a href="#" class="btn btn-sm btn-info" title="View"><i class="bi bi-eye"></i></a>
          <a href="#" class="btn btn-sm btn-warning" onclick="resetUserPassword(${row.user_id})" title="Reset Password">
            <i class="bi bi-key"></i>
          </a>
          <button class="btn btn-sm ${row.user_status === 1 ? 'btn-success' : 'btn-danger'} status-btn"
            onclick="updateUserStatus(${row.user_id}, ${row.user_status === 1 ? 0 : 1})" title="Status">
            <i class="bi bi-toggle-${row.user_status === 1 ? 'on' : 'off'}"></i>
          </button>
        `;
      },
    },
  ];

  if ($.fn.DataTable.isDataTable("#usersTable")) {
    $("#usersTable").DataTable().destroy();
  }

  $("#usersTable").DataTable({
    data: data,
    columns: columns,
    dom: '<"top"lf>rt<"bottom"ip>',
    responsive: true,
    ordering: true,
    searching: true,
    lengthMenu: [10, 15, 20],
    pageLength: 10,
    language: {
      emptyTable: "No data available"
    },
    drawCallback: function() {
      console.log("Table redrawn with data count:", data.length);
    }
  });
}

// Fetch users from the API
async function fetchUsers() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=users`);
    console.log("API Response:", response.data);

    if (response.data.success && Array.isArray(response.data.users)) {
      usersData = response.data.users;
      console.log("Raw user data:", usersData);

      // Log a sample user to check data structure
      if (usersData.length > 0) {
        console.log("Sample user data:", usersData[0]);
      }

      filteredData = filterUsersByType();
      console.log("Filtered Data:", filteredData);
      initializeDataTable(filteredData);
    } else {
      console.error("Error: Invalid API response format");
      toastr.error("Failed to load user data");
      initializeDataTable([]);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
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

  if (document.getElementById("logout-button")) {
    document.getElementById("logout-button").addEventListener("click", logout);
  }
});
