let usersData = [];
let filteredData = [];

// sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); //KINZARI
sessionStorage.setItem("baseURL", "http://localhost/api/posts.php"); //uncomment lang ni pag mag localhost


// async function fetchCounts() {
//   try {
//     const baseURL = sessionStorage.getItem("baseURL");
//     const response = await axios.get(`${baseURL}?action=get_counts`);
//     if (response.data.success) {
//       document.getElementById("visitor-count").innerText = response.data.visitors ?? "0";
//       document.getElementById("student-count").innerText = response.data.students ?? "0";
//       document.getElementById("department-count").innerText = response.data.faculties ?? "0";
//     }
//   } catch (error) {
//     console.error("Error fetching counts:", error);
//   }
// }

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


// Initialize DataTable
function initializeDataTable(data) {
  const columns = [
    // { title: "School ID", data: "user_schoolId", defaultContent: "-" },
    // { title: "Full Name", data: "full_name", defaultContent: "-" },
    // { title: "Department", data: "department_name", defaultContent: "-" },
    // { title: "Course", data: "course_name", defaultContent: "-",
    //   visible: !window.location.pathname.includes("all-department") },
      { title: "School ID", data: "user_schoolId", defaultContent: "-" },
      { title: "Full Name", data: "full_name", defaultContent: "-" },
    //   { title: "Department", data: "department_name", defaultContent: "-" },
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

// Initialize Latest Posts DataTable
function initializeLatestPostsTable() {
    if ($.fn.DataTable.isDataTable('#latestPostsTable')) {
        $('#latestPostsTable').DataTable().destroy();
    }

    $('#latestPostsTable').DataTable({
        ajax: {
            url: `${sessionStorage.getItem('baseURL')}?action=get_posts`,
            dataSrc: 'posts'
        },
        columns: [
            {
                data: 'is_read',
                render: function(data) {
                    let status = data ? 'Read' : 'Unread';
                    let color = data ? 'success' : 'secondary';
                    return `<span class="badge bg-${color}">${status}</span>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `<a href="#" class="view-post text-decoration-none" data-post-id="${data.post_id}">
                        ${data.user_fullname}
                    </a>`;
                }
            },
            { data: 'postType_name' },
            { data: 'post_title' },
            {
                data: null,
                render: function(data) {
                    return `${data.post_date} ${data.post_time}`;
                }
            }
        ],
        order: [[4, 'desc']],

    });


    $('#latestPostsTable').on('click', '.view-post', async function(e) {
        e.preventDefault();
        const postId = $(this).data('post-id');


        try {
            await axios.post(`${sessionStorage.getItem('baseURL')}?action=mark_post_read`, {
                post_id: postId
            });


            await showPostDetails(postId);


            $('#latestPostsTable').DataTable().ajax.reload(null, false);
        } catch (error) {
            console.error('Error handling post view:', error);
            toastr.error('Error viewing post details');
        }
    });
}


async function showPostDetails(postId) {
    try {
        const response = await axios.get(`${sessionStorage.getItem('baseURL')}?action=get_post_details&post_id=${postId}`);

        if (response.data.success && response.data.post) {
            const post = response.data.post;
            const container = document.getElementById('postContainer');

            container.innerHTML = `
                <div class="post-card card mb-4">
                    <div class="post-header p-3">
                        <!-- User Info at Top -->
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
                            </div>
                        </div>
                    </div>

                    <div class="post-content px-3 pb-4 position-relative">
                        <p class="mb-4">${post.post_message}</p>
                        <div class="text-muted small position-absolute bottom-0 end-0 pe-3 pb-2">
                            <i class="bi bi-clock"></i> ${post.post_date} ${post.post_time}
                        </div>
                    </div>

                    <div class="replies-section bg-light p-3">
                        <h6 class="fw-bold mb-3">Replies</h6>
                        <div class="replies-container mb-3">
                            ${post.replies ? post.replies.map(reply => `
                                <div class="reply-card mb-2 p-2 border-start border-4 border-primary bg-white">
                                    <div class="d-flex justify-content-between">
                                        <strong>${reply.admin_name}</strong>
                                        <small class="text-muted">${reply.reply_date}</small>
                                    </div>
                                    <p class="mb-0">${reply.reply_message}</p>
                                </div>
                            `).join('') : '<p>No replies yet.</p>'}
                        </div>

                        <form class="reply-form" onsubmit="submitReply(event, ${post.post_id})">
                            <div class="input-group">
                                <input type="text" class="form-control reply-input"
                                    placeholder="Write a reply..." required>
                                <button class="btn btn-primary" type="submit">Reply</button>
                            </div>
                        </form>
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


async function submitReply(event, postId) {
    event.preventDefault();
    const input = event.target.querySelector('.reply-input');
    const message = input.value;

    try {
        const response = await axios.post(`${sessionStorage.getItem('baseURL')}?action=submit_reply`, {
            post_id: postId,
            reply_message: message,
            admin_id: '25'
        });

        if (response.data.success) {
            toastr.success('Reply submitted successfully');
            input.value = '';

            await showPostDetails(postId);
        } else {
            toastr.error('Failed to submit reply');
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
        toastr.error('Error submitting reply');
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("visitor-count")) {
        await fetchCounts();
        await fetchUsers();
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    initializeLatestPostsTable();
});
