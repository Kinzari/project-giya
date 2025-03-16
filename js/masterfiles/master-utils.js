const baseApiUrl = 'http://localhost/api';
$.ajaxSetup({
    beforeSend: function(xhr) {
        const userType = localStorage.getItem('userType') || '6';
        xhr.setRequestHeader('X-User-Type', userType);
    }
});

function handleAjaxError(xhr, status, error) {
    let errorMsg = 'An error occurred while processing your request.';

    if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
        errorMsg = xhr.responseJSON.message;
    } else if (status) {
        errorMsg += ` Status: ${status}`;
    } else if (error) {
        errorMsg += ` Error: ${error}`;
    }

    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
    });
}

function showSuccessMessage(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

function destroyExistingDataTable(tableId) {
    if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().destroy();
    }
}

function createDataTable(tableId, columns, endpoint, options = {}) {
    if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
        $(`#${tableId}`).DataTable().destroy();
    }

    const defaultOptions = {
        processing: true,
        responsive: true,
        autoWidth: false,
        pageLength: 10,
        language: {
            emptyTable: "No data available",
            zeroRecords: "No matching records found",
            searchPlaceholder: "Search records...",
            lengthMenu: "_MENU_ per page",
            paginate: {
                previous: "<i class='bi bi-chevron-left'></i>",
                next: "<i class='bi bi-chevron-right'></i>"
            }
        },
        dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7 d-flex justify-content-end"p>>',
        drawCallback: function() {
            $('.dataTables_paginate > .pagination').addClass('pagination-md');
            $('.page-item .page-link').addClass('border-0 mx-1');
            $(`#${tableId} tbody tr`).addClass('cursor-pointer');
        },
        initComplete: function() {
            this.api().columns.adjust().responsive.recalc();

            if (options.rowClickHandler) {
                $(`#${tableId} tbody`).on('click', 'tr', function() {
                    const data = $(`#${tableId}`).DataTable().row(this).data();
                    if (data && options.rowClickHandler) {
                        options.rowClickHandler(data);
                    }
                });
            }
        }
    };

    const mergedOptions = $.extend(true, {}, defaultOptions, options);

    if (endpoint) {
        mergedOptions.ajax = {
            url: `${baseApiUrl}/${endpoint}`,
            dataSrc: function(response) {
                if (!response || !response.success) {
                    showErrorMessage(response ? response.message : 'Failed to load data');
                    return [];
                }
                return response.data || [];
            },
            error: function(xhr, status, error) {
                handleAjaxError(xhr, status, error);
                return [];
            }
        };
    }

    mergedOptions.columns = columns;

    return $(`#${tableId}`).DataTable(mergedOptions);
}

function renderStatusBadge(status) {
    let statusText = "";
    let badgeClass = "";

    switch (Number(status)) {
        case 0:
            statusText = "Pending";
            badgeClass = "status-pending";
            break;
        case 1:
            statusText = "Ongoing";
            badgeClass = "status-ongoing";
            break;
        case 2:
        case 3:
            statusText = "Resolved";
            badgeClass = "status-resolved";
            break;
        default:
            statusText = "Unknown";
            badgeClass = "bg-secondary";
    }

    return `<span class="badge ${badgeClass}">${statusText}</span>`;
}

function deleteRecord(endpoint, id, tableInstance) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${baseApiUrl}/masterfile.php?action=${endpoint}_delete`,
                type: 'POST',
                data: { id: id },
                success: function(response) {
                    if (response.success) {
                        showSuccessMessage('Record deleted successfully');
                        tableInstance.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete record', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

function loadDepartmentsDropdown(selectId, selectedValue = null) {
    $.ajax({
        url: `${baseApiUrl}/masterfile.php?action=departments`,
        type: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Department</option>';
                response.data.forEach(function(dept) {
                    const selected = selectedValue == dept.department_id ? 'selected' : '';
                    options += `<option value="${dept.department_id}" ${selected}>${dept.department_name}</option>`;
                });
                $(`#${selectId}`).html(options);
            } else {
                $(`#${selectId}`).html('<option value="">Failed to load departments</option>');
            }
        },
        error: function(xhr, status, error) {
            handleAjaxError(xhr, status, error);
            $(`#${selectId}`).html('<option value="">Failed to load departments</option>');
        }
    });
}

function loadCoursesForDepartment(departmentId, selectId, selectedCourseId = null) {
    $.ajax({
        url: `${baseApiUrl}/masterfile.php?action=courses_by_department`,
        type: 'GET',
        data: { department_id: departmentId },
        success: function(response) {
            if (response.success && response.data) {
                let options = '';
                response.data.forEach(function(course) {
                    const selected = selectedCourseId == course.course_id ? 'selected' : '';
                    options += `<option value="${course.course_id}" ${selected}>${course.course_name}</option>`;
                });
                $(`#${selectId}`).html(options);
            } else {
                $(`#${selectId}`).html('<option value="">Failed to load courses</option>');
            }
        },
        error: function(xhr, status, error) {
            handleAjaxError(xhr, status, error);
            $(`#${selectId}`).html('<option value="">Failed to load courses</option>');
        }
    });
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@phinmaed\.com$/;
    return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
    const re = /^(09|\+639)\d{9}$/;
    return re.test(String(phone));
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
