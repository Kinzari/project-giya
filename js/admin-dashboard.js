let usersData = [];
let filteredData = [];

// Set the API base URL in sessionStorage
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
  if (window.location.pathname.includes("all-visitor.html")) {
    return usersData.filter(user => user.user_typeId == 1); // Visitors
  } else if (window.location.pathname.includes("all-student.html")) {
    return usersData.filter(user => user.user_typeId == 2); // Students
  } else if (window.location.pathname.includes("all-department.html")) {
    return usersData.filter(user => [3, 4, 5].includes(user.user_typeId)); // Departments
  }
  return [];
}

// Function to update user status
async function updateUserStatus(userId, newStatus) {
  const confirmed = confirm(`Are you sure you want to ${newStatus === 1 ? "activate" : "deactivate"} this user?`);
  if (!confirmed) return;

  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.post(`${baseURL}?action=update_user_status`, {
      user_id: userId,
      user_status: newStatus,
    });

    if (response.data.success) {
      alert("User status updated successfully.");
      filteredData = filteredData.map(user =>
        user.user_id === userId ? { ...user, user_status: newStatus } : user
      );
      $("#usersTable").DataTable().clear().rows.add(filteredData).draw();
    } else {
      alert("Failed to update user status.");
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    alert("An error occurred while updating user status.");
  }
}

// Function to reset user password
async function resetUserPassword(userId) {
  const confirmed = confirm("Are you sure you want to reset this user's password to 'phinma-coc'?");
  if (!confirmed) return;

  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.post(`${baseURL}?action=reset_password`, {
      user_id: userId,
    });

    if (response.data.success) {
      alert("Password has been reset successfully to 'phinma-coc'.");
    } else {
      alert("Failed to reset password.");
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    alert("An error occurred while resetting the password.");
  }
}

// Initialize DataTable
function initializeDataTable(data) {
  const columns = [
    { title: "School ID", data: "user_schoolId" },
    { title: "Full Name", data: "full_name" },
    { title: "Department", data: "department_name" },
    { title: "Course", data: "course_name" },
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
    $("#usersTable thead tr").empty();
  }

  $("#usersTable").DataTable({
    data,
    columns,
    dom: '<"top"lf>rt<"bottom"ip>',
    buttons: [
      {
        extend: "excelHtml5",
        text: "Export to Excel",
        className: "btn btn-success",
      },
      {
        extend: "pdfHtml5",
        text: "Export to PDF",
        className: "btn btn-danger",
      },
      { extend: "print", text: "Print", className: "btn btn-primary" },
    ],
    lengthMenu: [10, 15, 20],
    pageLength: 10,
    responsive: true,
    ordering: true,
    searching: true,
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
      filteredData = filterUsersByType(usersData);
    } else {
      usersData = [];
      filteredData = [];
      console.error("Error: users array missing in API response");
    }

    initializeDataTable(filteredData);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
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
