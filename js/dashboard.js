let usersData = [];
let filteredData = []; // Keep track of filtered data

// Set the API base URL in sessionStorage
sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); // Update your backend API URL

// Function to update user status
async function updateUserStatus(userId, newStatus, dropdown) {
  dropdown.disabled = true; // Prevent multiple triggers

  // Confirmation dialog
  const confirmed = confirm(
    `Are you sure you want to ${
      newStatus === 1 ? "activate" : "deactivate"
    } this user?`
  );

  if (!confirmed) {
    dropdown.value = newStatus === 1 ? 0 : 1; // Revert selection on cancel
    dropdown.disabled = false;
    return;
  }

  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.post(`${baseURL}?action=update_user_status`, {
      user_id: userId,
      user_status: newStatus,
    });

    if (response.data.success) {
      alert("User status updated successfully.");

      // Update the filtered data
      const userIndex = filteredData.findIndex(
        (user) => user.user_id === userId
      );
      if (userIndex !== -1) {
        filteredData[userIndex].user_status = newStatus;
      }

      // Re-render the table without reloading
      $("#usersTable").DataTable().clear().rows.add(filteredData).draw();
    } else {
      alert("Failed to update user status.");
      dropdown.value = newStatus === 1 ? 0 : 1; // Reset dropdown
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    alert("An error occurred while updating user status.");
    dropdown.value = newStatus === 1 ? 0 : 1; // Reset dropdown on error
  } finally {
    dropdown.disabled = false; // Re-enable dropdown
  }
}

// Render user status dropdown for Admins
function renderUserStatusColumn(row) {
  const isAdmin = localStorage.getItem("user_typeId") === "6"; // Admin check
  if (!isAdmin) return ""; // No dropdown for POC

  return `
    <select class="status-dropdown" data-user-id="${row.user_id}">
      <option value="1" ${
        row.user_status === 1 ? "selected" : ""
      }>Active</option>
      <option value="0" ${
        row.user_status === 0 ? "selected" : ""
      }>Deactivated</option>
    </select>
  `;
}

// Initialize DataTable
function initializeDataTable(data) {
  const userTypeId = localStorage.getItem("user_typeId"); // Logged-in user type
  const isAdmin = userTypeId === "6"; // Admin check

  // Base columns
  const columns = [
    { title: "Full Name", data: "full_name" },
    { title: "School ID", data: "user_schoolId" },
    { title: "Department", data: "department_name" },
    { title: "Course", data: "course_name" },
    { title: "User Type", data: "user_type" },
  ];

  // Add "User Status" column for Admins only
  if (isAdmin) {
    columns.push({
      title: "User Status",
      data: null,
      render: (data, type, row) => renderUserStatusColumn(row),
    });
  }

  // Destroy existing DataTable
  if ($.fn.DataTable.isDataTable("#usersTable")) {
    $("#usersTable").DataTable().destroy();
    $("#usersTable thead tr").empty(); // Clear old headers
  }

  // Initialize the DataTable
  $("#usersTable").DataTable({
    data,
    columns,
    dom: '<"dt-top-container"lfB>rt<"bottom"ip><"clear">',
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
    searching: false,
  });

  // Remove previous event listeners and bind new ones for Admins only
  $("#usersTable").off("change", ".status-dropdown");
  if (isAdmin) {
    $("#usersTable").on("change", ".status-dropdown", function () {
      const userId = $(this).data("user-id");
      const newStatus = parseInt($(this).val());
      const dropdown = this;
      updateUserStatus(userId, newStatus, dropdown);
    });
  }
}

// Populate filters dynamically
function populateFilters() {
  const departments = [
    ...new Set(usersData.map((user) => user.department_name).filter(Boolean)),
  ];
  const courses = [
    ...new Set(usersData.map((user) => user.course_name).filter(Boolean)),
  ];
  const userTypes = [
    ...new Set(usersData.map((user) => user.user_type).filter(Boolean)),
  ];

  populateDropdown("department-filter", departments, "All Departments");
  populateDropdown("course-filter", courses, "All Courses");
  populateDropdown("user-type-filter", userTypes, "All User Types");
}

// Populate a single dropdown
function populateDropdown(elementId, options, defaultText) {
  const dropdown = document.getElementById(elementId);
  dropdown.innerHTML = `<option value="All">${defaultText}</option>`;
  options.forEach((option) => {
    dropdown.innerHTML += `<option value="${option}">${option}</option>`;
  });
}

// Filter users
function filterUsers() {
  const departmentFilter = document.getElementById("department-filter").value;
  const courseFilter = document.getElementById("course-filter").value;
  const userTypeFilter = document.getElementById("user-type-filter").value;
  const searchQuery = document.getElementById("search-bar").value.toLowerCase();

  filteredData = usersData.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery) ||
      user.user_schoolId.toLowerCase().includes(searchQuery);

    const matchesDepartment =
      departmentFilter === "All" || user.department_name === departmentFilter;

    const matchesCourse =
      courseFilter === "All" || user.course_name === courseFilter;

    const matchesUserType =
      userTypeFilter === "All" || user.user_type === userTypeFilter;

    return (
      matchesSearch && matchesDepartment && matchesCourse && matchesUserType
    );
  });

  initializeDataTable(filteredData);
}

// Fetch users
async function fetchUsers() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=get_users`);

    if (Array.isArray(response.data)) {
      usersData = response.data;
      filteredData = [...usersData];
    } else {
      usersData = [];
      filteredData = [];
    }

    initializeDataTable(filteredData);
    populateFilters();
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  const firstName = localStorage.getItem("first_name") || "User";
  document.getElementById("welcome-message").innerText = `Welcome ${firstName}`;

  const userTypeId = localStorage.getItem("user_typeId");
  if (userTypeId === "5") {
    const statusColumn = document.getElementById("status-column");
    if (statusColumn) {
      statusColumn.remove();
    }
  }

  await fetchUsers();

  document
    .getElementById("department-filter")
    .addEventListener("change", filterUsers);
  document
    .getElementById("course-filter")
    .addEventListener("change", filterUsers);
  document
    .getElementById("user-type-filter")
    .addEventListener("change", filterUsers);
  document.getElementById("search-bar").addEventListener("input", filterUsers);
  document.getElementById("logout-button").addEventListener("click", logout);
});
