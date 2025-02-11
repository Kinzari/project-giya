let usersData = [];
let filteredData = [];

// Set the API base URL in sessionStorage
sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); // Update your backend API URL

// Function to fetch visitor, student, and department counts
async function fetchCounts() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=get_counts`);

    if (response.data.success) {
      const visitorCountEl = document.getElementById("visitor-count");
      const studentCountEl = document.getElementById("student-count");
      const departmentCountEl = document.getElementById("department-count");

      // Ensure elements exist before updating
      if (visitorCountEl)
        visitorCountEl.innerText = response.data.visitors ?? "0";
      if (studentCountEl)
        studentCountEl.innerText = response.data.students ?? "0";
      if (departmentCountEl)
        departmentCountEl.innerText = response.data.faculties ?? "0";
    } else {
      console.error("Error: Response success flag is false");
    }
  } catch (error) {
    console.error("Error fetching counts:", error);
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
      render: function () {
        return `
                  <a href="#" class="btn btn-sm btn-warning"><i class="bi bi-pencil-square"></i></a>
                  <a href="#" class="btn btn-sm btn-danger"><i class="bi bi-trash-fill"></i></a>
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
    searching: true,
  });
}

// Fetch users from the API
async function fetchUsers() {
  try {
    const baseURL = sessionStorage.getItem("baseURL");
    const response = await axios.get(`${baseURL}?action=latest_users`);

    console.log("API Response:", response.data); // Debugging output

    if (response.data.success && Array.isArray(response.data.latest_users)) {
      usersData = response.data.latest_users;
      filteredData = [...usersData];
    } else {
      usersData = [];
      filteredData = [];
      console.error("Error: latest_users array missing in API response");
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
  const firstName = localStorage.getItem("first_name") || "User";
  const welcomeMessage = document.getElementById("welcome-message");

  if (welcomeMessage) {
    welcomeMessage.innerText = `Welcome ${firstName}`;
  }

  await fetchCounts();
  await fetchUsers();

  document.getElementById("logout-button").addEventListener("click", logout);
});
