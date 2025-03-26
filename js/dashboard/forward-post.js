document.addEventListener('DOMContentLoaded', function() {
    fetch('/dashboard/components/forward-modal.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            setupForwardingFunctionality();
        })
        .catch(error => {
            // Handle error silently
        });
});

function setupForwardingFunctionality() {
    document.addEventListener('click', function(event) {
        if (event.target.matches('#forwardPostBtn') || event.target.closest('#forwardPostBtn')) {
            openForwardModal();
        }
    });

    document.addEventListener('click', function(event) {
        if (event.target.matches('#confirmForwardBtn')) {
            forwardCurrentPost();
        }
    });

    const userType = sessionStorage.getItem('user_typeId');
    if (userType !== '6') {
        const forwardBtns = document.querySelectorAll('#forwardPostBtn');
        forwardBtns.forEach(btn => {
            btn.style.display = 'none';
        });
    }

    const forwardPostModal = document.getElementById('forwardPostModal');
    if (forwardPostModal) {
        forwardPostModal.addEventListener('show.bs.modal', function () {
            loadDepartmentsAndCampuses();
        });
    }
}

function openForwardModal() {
    if (!currentPostId) {
        toastr.error('No post selected for forwarding');
        return;
    }

    const form = document.getElementById('forwardPostForm');
    if (form) form.reset();

    const modal = new bootstrap.Modal(document.getElementById('forwardPostModal'));
    modal.show();
}

async function loadDepartmentsAndCampuses() {
    try {
        const baseURL = sessionStorage.getItem('baseURL');

        const departmentsResponse = await axios.get(`${baseURL}giya.php?action=get_departments`);
        if (departmentsResponse.data.success) {
            populateSelect('forwardDepartment', departmentsResponse.data.departments);
        } else {
            toastr.error('Failed to load departments');
        }

        const campusesResponse = await axios.get(`${baseURL}giya.php?action=get_campuses`);
        if (campusesResponse.data.success) {
            populateSelect('forwardCampus', campusesResponse.data.campuses);
        } else {
            toastr.error('Failed to load campuses');
        }
    } catch (error) {
        toastr.error('Failed to load form data');
    }
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const defaultOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(defaultOption);

    if (Array.isArray(options)) {
        options.forEach(option => {
            const value = option.department_id || option.campus_id;
            const text = option.department_name || option.campus_name;

            if (value && text) {
                const optionEl = document.createElement('option');
                optionEl.value = value;
                optionEl.textContent = text;
                select.appendChild(optionEl);
            }
        });
    }
}

async function forwardCurrentPost() {
    try {
        if (!currentPostId) {
            toastr.error('No post selected for forwarding');
            return;
        }

        const userType = sessionStorage.getItem('user_typeId');
        if (userType !== '6') {
            toastr.error('Only administrators can forward posts');
            return;
        }

        const departmentSelect = document.getElementById('forwardDepartment');
        const campusSelect = document.getElementById('forwardCampus');

        if (!departmentSelect || !campusSelect) {
            toastr.error('Form elements not found');
            return;
        }

        const departmentId = departmentSelect.value;
        const campusId = campusSelect.value;

        if (!departmentId || !campusId) {
            toastr.error('Please select both department and campus');
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Confirm Forward',
            text: 'Are you sure you want to forward this post?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, forward it!'
        });

        if (!confirmResult.isConfirmed) return;

        const loadingToast = toastr.info('Forwarding post...', '', { timeOut: 0 });

        const response = await axios.post(
            `${sessionStorage.getItem('baseURL')}posts.php?action=forward_post`,
            {
                post_id: currentPostId,
                department_id: departmentId,
                campus_id: campusId,
                forwarded_by: sessionStorage.getItem('user_id')
            }
        );

        toastr.clear(loadingToast);

        if (response.data.success) {
            toastr.success('Post forwarded successfully');

            const forwardModal = bootstrap.Modal.getInstance(document.getElementById('forwardPostModal'));
            if (forwardModal) forwardModal.hide();

            await showPostDetails(currentPostId);

            refreshTables();
        } else {
            toastr.error(response.data.message || 'Failed to forward post');
        }
    } catch (error) {
        toastr.error('Failed to forward post');
    }
}
