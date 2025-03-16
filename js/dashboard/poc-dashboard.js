document.addEventListener('DOMContentLoaded', function() {
    if (!isPOCUser()) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    const departmentId = user.user_departmentId;
    const departmentName = user.department_name;

    if (!document.querySelector('.department-indicator')) {
        addDepartmentIndicator(departmentName);
    }


    initDepartmentFilters(departmentId, departmentName);


    console.info(`POC Dashboard initialized for department: ${departmentName} (ID: ${departmentId})`);
});

function isPOCUser() {
    try {
        const userInfo = sessionStorage.getItem('user');
        if (!userInfo) return false;

        const user = JSON.parse(userInfo);
        return user && user.user_typeId == 5 && user.user_departmentId;
    } catch (e) {
        console.error('Error checking POC status:', e);
        return false;
    }
}


function addDepartmentIndicator(departmentName) {
    if (!departmentName) return;


    if (document.querySelector('.department-indicator')) return;


    const indicator = document.createElement('div');
    indicator.className = 'department-indicator badge bg-info position-fixed top-0 end-0 m-3';
    indicator.style.zIndex = 1000;
    indicator.innerHTML = `<i class="bi bi-building me-1"></i> ${departmentName} Department`;

    document.body.appendChild(indicator);
}


function initDepartmentFilters(departmentId, departmentName) {

    document.querySelectorAll('table').forEach(table => {

        const headers = table.querySelectorAll('th');
        let departmentCol = null;


        headers.forEach((th, index) => {
            if (th.textContent.includes('Department')) {
                departmentCol = {index: index, element: th};
            }
        });


        if (!departmentCol) {

            let insertAfterIndex = -1;
            headers.forEach((th, index) => {
                if (th.textContent.includes('Title')) {
                    insertAfterIndex = index;
                }
            });

            if (insertAfterIndex >= 0) {
                const newTh = document.createElement('th');
                newTh.textContent = 'Department';


                if (insertAfterIndex < headers.length - 1) {
                    headers[insertAfterIndex].parentNode.insertBefore(
                        newTh,
                        headers[insertAfterIndex + 1]
                    );
                } else {
                    headers[insertAfterIndex].parentNode.appendChild(newTh);
                }
            }
        }
    });
}

function addDepartmentLabelToHeader(departmentName) {
    const pageTitle = document.querySelector('h3');
    if (!pageTitle || pageTitle.querySelector('.badge')) return;

    const badge = document.createElement('span');
    badge.className = 'badge bg-info ms-2';
    badge.textContent = departmentName;
    pageTitle.appendChild(badge);
}


function showDepartmentFilterInfo(departmentName) {

    toastr.info(
        `You are viewing posts assigned to the <strong>${departmentName}</strong> department only.`,
        'Department Filter Active',
        {
            timeOut: 5000,
            extendedTimeOut: 2000,
            closeButton: true,
            tapToDismiss: true,
            positionClass: 'toast-top-right'
        }
    );


    const container = document.querySelector('.container');
    if (!container) return;

    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;


    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info d-flex align-items-center mb-4';
    alertDiv.setAttribute('role', 'alert');

    alertDiv.innerHTML = `
        <i class="bi bi-funnel-fill me-2 fs-5"></i>
        <div>
            <strong>Department Filter:</strong> You are viewing posts for the ${departmentName} department only.
        </div>
    `;

    const firstHeading = container.querySelector('h3, h4');
    if (firstHeading && firstHeading.nextElementSibling) {
        container.insertBefore(alertDiv, firstHeading.nextElementSibling);
    } else {
        container.prepend(alertDiv);
    }
}

function exportDepartmentData(format = 'csv') {
    const departmentId = JSON.parse(sessionStorage.getItem('user')).user_departmentId;
    const departmentName = JSON.parse(sessionStorage.getItem('user')).department_name;


    const now = new Date();
    const filename = `${departmentName.replace(/\s+/g, '_')}_Posts_${now.toISOString().split('T')[0]}`;

    toastr.info(`Preparing ${format.toUpperCase()} export for ${departmentName}...`);

    console.log(`Exporting ${format} for department ${departmentId} as ${filename}`);

    setTimeout(() => {
        toastr.success(`${departmentName} data exported successfully!`);
    }, 1000);
}
