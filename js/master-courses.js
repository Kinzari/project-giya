let coursesTable;
let currentCourseData = null;
const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

$(document).ready(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const departmentFilter = urlParams.get('department');


    initBasicCoursesTable(departmentFilter);

    loadDepartmentsDropdown('departmentFilter');
    setupEventHandlers();
    checkModals();

    if (departmentFilter) {
        $('#departmentFilter').val(departmentFilter);
        $('#departmentFilterLabel').text('Filtered by department:');
    }
});

function initBasicCoursesTable(departmentId = null) {
    try {

        if ($.fn.DataTable.isDataTable('#coursesTable')) {
            $('#coursesTable').DataTable().destroy();
        }

        $('#coursesTable').empty();
        $('#coursesTable').append('<thead><tr>' +

            '<th>Course Name</th>' +
            '<th>Department</th>' +
            '<th>Students</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        let ajaxUrl = `${baseUrl}masterfile.php?action=courses`;
        if (departmentId) {
            ajaxUrl += `&department_id=${departmentId}`;
        }

        coursesTable = $('#coursesTable').DataTable({
            ajax: {
                url: ajaxUrl,
                dataSrc: function(response) {
                    console.log('Course data received:', response);
                    if (!response || !response.success) {
                        console.error('API error:', response ? response.message : 'No response');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('AJAX error:', xhr, error, thrown);
                    return [];
                }
            },
            columns: [
                { data: 'course_name' },
                { data: 'department_name' },
                {
                    data: 'student_count',
                    render: function(data) {
                        return `<span class="badge bg-primary">${data || 0}</span>`;
                    }
                },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-course" data-id="${data.course_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-course" data-id="${data.course_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-course" data-id="${data.course_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No courses available",
                zeroRecords: "No matching courses found",
                searchPlaceholder: "Search courses...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search courses...')
                    .addClass('form-control-search');
                $('#coursesTable tbody tr').css('cursor', 'pointer');
            }
        });

        $('#coursesTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = coursesTable.row(this).data();
                if (data) {
                    showCourseDetails(data.course_id);
                }
            }
        });


        setupActionButtonEvents();

        console.log('Courses table initialized successfully');
    } catch (error) {
        console.error('Error initializing courses table:', error);
        console.error('Detailed error:', error.message, error.stack);
    }
}


function setupActionButtonEvents() {

    $('#coursesTable').on('click', '.view-course', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showCourseDetails(id);
    });


    $('#coursesTable').on('click', '.edit-course', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editCourse(id);
    });


    $('#coursesTable').on('click', '.delete-course', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteCourse(id);
    });
}


function setupEventHandlers() {

    $('#addCourseBtn').on('click', function() {
        showAddCourseForm();
    });


    $('#departmentFilter').on('change', function() {
        const departmentId = $(this).val();
        if (departmentId) {
            initBasicCoursesTable(departmentId);
        } else {
            initBasicCoursesTable();
        }
    });


    $('#courseForm').on('submit', function(e) {
        e.preventDefault();
        if (validateCourseForm()) {
            saveCourse();
        }
    });


    $(document).on('click', '#detailsEdit', function() {
        $('#courseDetailsModal').modal('hide');
        if (currentCourseData) {
            editCourse(currentCourseData.course_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#courseDetailsModal').modal('hide');
        if (currentCourseData) {
            deleteCourse(currentCourseData.course_id);
        }
    });

    $(document).on('click', '#viewStudents', function() {
        if (currentCourseData) {
            window.location.href = `master-students.html?course=${currentCourseData.course_id}`;
        }
    });
}


function checkModals() {
    console.log('Checking for course modals:');
    console.log('Course Form Modal exists:', $('#courseModal').length > 0);
    console.log('Course Details Modal exists:', $('#courseDetailsModal').length > 0);


    if ($('#courseDetailsModal').length === 0) {
        createCourseDetailsModal();
    }
}


function createCourseDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="courseDetailsModal" tabindex="-1" aria-labelledby="courseDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="courseDetailsModalTitle">Course Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>Course ID:</strong> <span id="detailsCourseId"></span></p>
                    <p><strong>Course Name:</strong> <span id="detailsCourseName"></span></p>
                    <p><strong>Department:</strong> <span id="detailsDepartmentName"></span></p>
                    <p><strong>Total Students:</strong> <span id="detailsStudentCount" class="badge bg-primary"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-info" id="viewStudents">View Students</button>
                    <button type="button" class="btn btn-primary" id="detailsEdit">Edit</button>
                    <button type="button" class="btn btn-danger" id="detailsDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
    console.log('Course Details modal created dynamically');
}


function showCourseDetails(courseId) {
    console.log('Showing details for Course ID:', courseId);

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_course`,
        type: 'GET',
        data: { id: courseId },
        success: function(response) {
            if (response.success && response.data) {
                const course = response.data;
                currentCourseData = course;


                $('#detailsCourseId').text(course.course_id);
                $('#detailsCourseName').text(course.course_name);
                $('#detailsDepartmentName').text(course.department_name);
                $('#detailsStudentCount').text(course.student_count || 0);


                const hasStudents = course.student_count > 0;
                $('#detailsDelete').prop('disabled', hasStudents);
                if (hasStudents) {
                    $('#detailsDelete').attr('title', 'Cannot delete courses with associated students');
                } else {
                    $('#detailsDelete').attr('title', 'Delete this course');
                }


                $('#courseDetailsModal').modal('show');

            } else {
                Swal.fire('Error', response.message || 'Failed to load course details', 'error');
            }
        },
        error: handleAjaxError
    });
}


function editCourse(courseId) {
    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_course`,
        type: 'GET',
        data: { id: courseId },
        success: function(response) {
            if (response.success && response.data) {
                const course = response.data;


                $('#courseForm')[0].reset();


                $('#courseForm').data('mode', 'edit');
                $('#courseForm').data('id', course.course_id);
                $('#courseName').val(course.course_name);


                loadDepartmentsDropdown('department', course.course_departmentId);


                $('#courseModalLabel').text('Edit Course');


                $('#courseModal').modal('show');

            } else {
                Swal.fire('Error', response.message || 'Failed to load course data', 'error');
            }
        },
        error: handleAjaxError
    });
}


function showAddCourseForm() {

    $('#courseForm')[0].reset();
    $('#courseForm').removeData('id');
    $('#courseForm').data('mode', 'add');

    loadDepartmentsDropdown('department');


    $('#courseModalLabel').text('Add Course');


    $('#courseModal').modal('show');
}


function deleteCourse(courseId) {
    Swal.fire({
        title: 'Delete Course',
        text: "Are you sure you want to delete this course? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${baseUrl}masterfile.php?action=course_delete`,
                type: 'POST',
                data: { id: courseId },
                success: function(response) {
                    if (response.success) {
                        showSuccessMessage('Course deleted successfully');
                        coursesTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete course', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

function saveCourse() {

    const formData = {
        courseName: $('#courseName').val(),
        departmentId: $('#department').val(),
        mode: $('#courseForm').data('mode') || 'add',
        id: $('#courseForm').data('id')
    };


    $.ajax({
        url: `${baseUrl}masterfile.php?action=submit_course`,
        type: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                $('#courseModal').modal('hide');
                showSuccessMessage(response.message || 'Course saved successfully');
                coursesTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save course', 'error');
            }
        },
        error: handleAjaxError
    });
}


function validateCourseForm() {
    const courseName = $('#courseName').val();
    if (!courseName || courseName.trim() === '') {
        Swal.fire('Error', 'Course name is required', 'error');
        return false;
    }

    const department = $('#department').val();
    if (!department) {
        Swal.fire('Error', 'Please select a department', 'error');
        return false;
    }

    return true;
}


function showSuccessMessage(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}


function handleAjaxError(xhr, status, error) {
    console.error(`AJAX Error: ${status}`, xhr, error);
    Swal.fire({
        title: 'Error',
        text: 'An error occurred while communicating with the server',
        icon: 'error'
    });
}
