/**
 * Master File - Inquiry Types
 * Handles all inquiry type-related operations
 */

// Global variables
let inquiryTypesTable;
let currentInquiryTypeData = null;

$(document).ready(function() {
    // Initialize with a basic method first
    initBasicInquiryTypesTable();

    // Set up event handlers
    setupEventHandlers();

    // Check if modals exist
    checkModals();
});

/**
 * Initialize a basic table without complex options to avoid DataTables issues
 */
function initBasicInquiryTypesTable() {
    try {
        // Clear any existing DataTable
        if ($.fn.DataTable.isDataTable('#inquiryTypesTable')) {
            $('#inquiryTypesTable').DataTable().destroy();
        }

        // Clean up the table DOM to avoid conflicts
        $('#inquiryTypesTable').empty();
        $('#inquiryTypesTable').append('<thead><tr>' +
            // ID column removed
            '<th>Inquiry Type</th>' +
            '<th>Description</th>' +
            '<th>Department</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
        // Get user type for authentication
        const userType = sessionStorage.getItem('userType') || '6'; // Default to admin if not found

        // Basic initialization
        inquiryTypesTable = $('#inquiryTypesTable').DataTable({
            ajax: {
                url: `${baseUrl}masterfile.php?action=inquiry_types`,
                dataSrc: function(response) {
                    console.log('Inquiry Types data received:', response);
                    if (!response || !response.success) {
                        console.error('API error:', response ? response.message : 'No response');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('AJAX error:', xhr, error, thrown);
                    return [];
                },
                // Add headers for authentication
                headers: {
                    'X-User-Type': userType
                }
            },
            columns: [
                // ID column removed
                { data: 'inquiry_type' },
                {
                    data: 'description',
                    render: function(data) {
                        // Truncate long descriptions
                        return data.length > 50 ? data.substring(0, 50) + '...' : data;
                    }
                },
                { data: 'department_name' },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No inquiry types available",
                zeroRecords: "No matching inquiry types found",
                searchPlaceholder: "Search inquiry types...",
                search: "", // Remove "Search:" label
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search inquiry types...')
                    .addClass('form-control-search');

                // Make rows clickable
                $('#inquiryTypesTable tbody tr').css('cursor', 'pointer');
            }
        });

        // Add row click handler
        $('#inquiryTypesTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = inquiryTypesTable.row(this).data();
                if (data) {
                    showInquiryTypeDetails(data.inquiry_id);
                }
            }
        });

        // Set up action button handlers
        setupActionButtonEvents();

        console.log('Inquiry Types table initialized successfully');
    } catch (error) {
        console.error('Error initializing inquiry types table:', error);
    }
}

/**
 * Set up action button handlers
 */
function setupActionButtonEvents() {
    // View button
    $('#inquiryTypesTable').on('click', '.view-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showInquiryTypeDetails(id);
    });

    // Edit button
    $('#inquiryTypesTable').on('click', '.edit-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editInquiryType(id);
    });

    // Delete button
    $('#inquiryTypesTable').on('click', '.delete-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteInquiryType(id);
    });
}

/**
 * Set up all event handlers for this page
 */
function setupEventHandlers() {
    // Add new inquiry type
    $('#addInquiryTypeBtn').on('click', function() {
        showAddInquiryTypeForm();
    });

    // Inquiry type form submission
    $('#inquiryTypeForm').on('submit', function(e) {
        e.preventDefault();
        if (validateInquiryTypeForm()) {
            saveInquiryType();
        }
    });

    // Inquiry details modal action buttons
    $(document).on('click', '#detailsEdit', function() {
        $('#inquiryTypeDetailsModal').modal('hide');
        if (currentInquiryTypeData) {
            editInquiryType(currentInquiryTypeData.inquiry_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#inquiryTypeDetailsModal').modal('hide');
        if (currentInquiryTypeData) {
            deleteInquiryType(currentInquiryTypeData.inquiry_id);
        }
    });
}

/**
 * Check if modals exist in the DOM and create if missing
 */
function checkModals() {
    console.log('Checking for modals:');
    console.log('Inquiry Type Form Modal exists:', $('#inquiryTypeModal').length > 0);
    console.log('Inquiry Type Details Modal exists:', $('#inquiryTypeDetailsModal').length > 0);

    // Check if we need to create any missing modals
    if ($('#inquiryTypeDetailsModal').length === 0) {
        createInquiryTypeDetailsModal();
    }
}

/**
 * Create inquiry type details modal if it doesn't exist
 */
function createInquiryTypeDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="inquiryTypeDetailsModal" tabindex="-1" aria-labelledby="inquiryTypeDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="inquiryTypeDetailsModalTitle">Inquiry Type Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>ID:</strong> <span id="detailsInquiryId"></span></p>
                    <p><strong>Type Name:</strong> <span id="detailsInquiryType"></span></p>
                    <p><strong>Description:</strong> <span id="detailsDescription"></span></p>
                    <p><strong>Department:</strong> <span id="detailsDepartmentName"></span></p>
                    <!-- Status field removed from details modal -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="detailsEdit">Edit</button>
                    <button type="button" class="btn btn-danger" id="detailsDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
    console.log('Inquiry Type Details modal created dynamically');
}

/**
 * Show inquiry type details in a modal
 */
function showInquiryTypeDetails(inquiryId) {
    console.log('Showing details for inquiry type ID:', inquiryId);

    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6'; // Default to admin

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_inquiry_type`,
        type: 'GET',
        data: { id: inquiryId },
        headers: {
            'X-User-Type': userType
        },
        success: function(response) {
            if (response.success && response.data) {
                const inquiryType = response.data;
                currentInquiryTypeData = inquiryType;

                // Fill in inquiry type details
                $('#detailsInquiryId').text(inquiryType.inquiry_id);
                $('#detailsInquiryType').text(inquiryType.inquiry_type);
                $('#detailsDescription').text(inquiryType.description);
                $('#detailsDepartmentName').text(inquiryType.department_name);

                // Status field removed from details modal

                // Show the modal
                $('#inquiryTypeDetailsModal').modal('show');

            } else {
                Swal.fire('Error', response.message || 'Failed to load inquiry type details', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error loading inquiry type details:', xhr, status, error);
            Swal.fire('Error', 'Failed to load inquiry type details', 'error');
        }
    });
}

/**
 * Show form for adding a new inquiry type
 */
function showAddInquiryTypeForm() {
    // Reset form
    $('#inquiryTypeForm')[0].reset();
    $('#inquiryTypeForm').removeData('id');
    $('#inquiryTypeForm').data('mode', 'add');

    // Status field removed - no need to set default value

    // Load departments dropdown
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    loadDepartmentsDropdown('department');

    // Update modal title
    $('#inquiryTypeModalLabel').text('Add Inquiry Type');

    // Show modal
    $('#inquiryTypeModal').modal('show');
}

/**
 * Edit an inquiry type
 */
function editInquiryType(inquiryId) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6'; // Default to admin

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_inquiry_type`,
        type: 'GET',
        data: { id: inquiryId },
        headers: {
            'X-User-Type': userType
        },
        success: function(response) {
            if (response.success && response.data) {
                const inquiryType = response.data;

                // Set form data
                $('#inquiryTypeForm').data('id', inquiryType.inquiry_id);
                $('#inquiryTypeForm').data('mode', 'edit');

                // Fill form fields
                $('#inquiryType').val(inquiryType.inquiry_type);
                $('#description').val(inquiryType.description);

                // Load department dropdown
                loadDepartmentsDropdown('department', inquiryType.department_id);

                // Update modal title
                $('#inquiryTypeModalLabel').text('Edit Inquiry Type');

                // Show modal
                $('#inquiryTypeModal').modal('show');

            } else {
                Swal.fire('Error', response.message || 'Failed to load inquiry type data', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error:', xhr, status, error);
            Swal.fire('Error', 'Failed to load inquiry type data', 'error');
        }
    });
}

/**
 * Delete an inquiry type
 */
function deleteInquiryType(inquiryId) {
    Swal.fire({
        title: 'Delete Inquiry Type',
        text: "Are you sure you want to delete this inquiry type? This cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
            const userType = sessionStorage.getItem('userType') || '6'; // Default to admin

            $.ajax({
                url: `${baseUrl}masterfile.php?action=inquiry_type_delete`,
                type: 'POST',
                data: { id: inquiryId },
                headers: {
                    'X-User-Type': userType
                },
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'Inquiry type deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        inquiryTypesTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete inquiry type', 'error');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error:', xhr, status, error);
                    Swal.fire('Error', 'An error occurred while trying to delete the inquiry type', 'error');
                }
            });
        }
    });
}

/**
 * Save inquiry type data (add or update)
 */
function saveInquiryType() {
    // Get form data
    const formData = {
        mode: $('#inquiryTypeForm').data('mode') || 'add',
        id: $('#inquiryTypeForm').data('id'),
        inquiryType: $('#inquiryType').val(),
        description: $('#description').val(),
        departmentId: $('#department').val()
    };

    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6'; // Default to admin if not found

    // Log what we're sending to the server for debugging
    console.log('Sending data to server:', formData);

    // Submit form data with proper authentication headers
    $.ajax({
        url: `${baseUrl}masterfile.php?action=submit_inquiry_type`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType
        },
        dataType: 'text', // Change to text instead of assuming JSON
        beforeSend: function() {
            console.log('Starting AJAX request to:', `${baseUrl}masterfile.php?action=submit_inquiry_type`);
            console.log('Using auth header X-User-Type:', userType);
        },
        success: function(responseText) {
            console.log('Raw response text:', responseText);

            try {
                // Try to parse the response as JSON
                const response = JSON.parse(responseText);

                if (response.success) {
                    $('#inquiryTypeModal').modal('hide');

                    Swal.fire({
                        title: 'Success',
                        text: formData.mode === 'add' ? 'Inquiry type added successfully' : 'Inquiry type updated successfully',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    inquiryTypesTable.ajax.reload();
                } else {
                    Swal.fire('Error', response.message || 'Failed to save inquiry type', 'error');
                }
            } catch (e) {
                console.error('Error parsing JSON response:', e, responseText);

                // Check if the response contains multiple JSON objects
                if (responseText.indexOf('}{') > -1) {
                    console.log('Detected multiple JSON objects, trying to extract first one');
                    try {
                        // Extract first JSON object
                        const firstJson = responseText.substring(0, responseText.indexOf('}')+1);
                        const response = JSON.parse(firstJson);

                        if (response.success) {
                            $('#inquiryTypeModal').modal('hide');
                            Swal.fire({
                                title: 'Success',
                                text: 'Operation completed successfully',
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });
                            inquiryTypesTable.ajax.reload();
                            return;
                        }
                    } catch (ex) {
                        console.error('Failed to extract first JSON object:', ex);
                    }
                }

                Swal.fire('Error', 'The server returned an invalid response', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error details:', {
                status: status,
                error: error,
                responseText: xhr.responseText
            });

            // Display a more user-friendly error that includes the server's error message if available
            let errorMessage = 'An error occurred while communicating with the server';

            // Check for PHP errors in the response
            if (xhr.responseText && xhr.responseText.indexOf('<br />') > -1) {
                errorMessage = 'The server encountered an error. Please contact the administrator.';
            }

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error'
            });
        }
    });
}

/**
 * Validate inquiry type form data
 */
function validateInquiryTypeForm() {
    // Check required fields
    const inquiryType = $('#inquiryType').val();
    if (!inquiryType || inquiryType.trim() === '') {
        Swal.fire('Error', 'Inquiry type name is required', 'error');
        return false;
    }

    const description = $('#description').val();
    if (!description || description.trim() === '') {
        Swal.fire('Error', 'Description is required', 'error');
        return false;
    }

    const department = $('#department').val();
    if (!department) {
        Swal.fire('Error', 'Please select a department', 'error');
        return false;
    }

    return true;
}

/**
 * Load departments for dropdown
 */
function loadDepartmentsDropdown(selectId, selectedId = null) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6'; // Default to admin

    $.ajax({
        url: `${baseUrl}masterfile.php?action=departments`,
        type: 'GET',
        headers: {
            'X-User-Type': userType
        },
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Department</option>';
                response.data.forEach(function(dept) {
                    const isSelected = selectedId && dept.department_id == selectedId ? 'selected' : '';
                    options += `<option value="${dept.department_id}" ${isSelected}>${dept.department_name}</option>`;
                });
                $(`#${selectId}`).html(options);
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error loading departments:', xhr, status, error);
            $(`#${selectId}`).html('<option value="">Error loading departments</option>');
        }
    });
}
