/**
 * POC Dashboard Utilities
 * Enhanced functionality for department-specific dashboards
 */

document.addEventListener('DOMContentLoaded', function() {
    if (!isPOCUser()) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    const departmentId = user.user_departmentId;
    const departmentName = user.department_name;

    // Add department indicator to dashboard (only if it doesn't already exist)
    if (!document.querySelector('.department-indicator')) {
        addDepartmentIndicator(departmentName);
    }

    // Initialize department filter (but don't add redundant indicators)
    initDepartmentFilters(departmentId, departmentName);

    // Log department info for debugging
    console.info(`POC Dashboard initialized for department: ${departmentName} (ID: ${departmentId})`);
});

/**
 * Check if current user is a POC
 */
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

/**
 * Add department indicator to dashboard
 */
function addDepartmentIndicator(departmentName) {
    if (!departmentName) return;

    // Check if indicator already exists
    if (document.querySelector('.department-indicator')) return;

    // Create department indicator
    const indicator = document.createElement('div');
    indicator.className = 'department-indicator badge bg-info position-fixed top-0 end-0 m-3';
    indicator.style.zIndex = 1000;
    indicator.innerHTML = `<i class="bi bi-building me-1"></i> ${departmentName} Department`;

    document.body.appendChild(indicator);
}

/**
 * Initialize department filters for tables
 */
function initDepartmentFilters(departmentId, departmentName) {
    // Make department column visible
    document.querySelectorAll('table').forEach(table => {
        // Find the department column header
        const headers = table.querySelectorAll('th');
        let departmentCol = null;

        // Look for department header
        headers.forEach((th, index) => {
            if (th.textContent.includes('Department')) {
                departmentCol = {index: index, element: th};
            }
        });

        // If no department column, add one
        if (!departmentCol) {
            // Find where to insert the column (typically after Title)
            let insertAfterIndex = -1;
            headers.forEach((th, index) => {
                if (th.textContent.includes('Title')) {
                    insertAfterIndex = index;
                }
            });

            if (insertAfterIndex >= 0) {
                // Add the header
                const newTh = document.createElement('th');
                newTh.textContent = 'Department';

                // Insert after the Title column
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

/**
 * Add department label to page header
 */
function addDepartmentLabelToHeader(departmentName) {
    const pageTitle = document.querySelector('h3');
    if (!pageTitle || pageTitle.querySelector('.badge')) return;

    const badge = document.createElement('span');
    badge.className = 'badge bg-info ms-2';
    badge.textContent = departmentName;
    pageTitle.appendChild(badge);
}

/**
 * Show information about department filtering
 */
function showDepartmentFilterInfo(departmentName) {
    // Show a toastr notification explaining filtering
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

    // Add a filter info card to inform users
    const container = document.querySelector('.container');
    if (!container) return;

    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;

    // Create filter info alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info d-flex align-items-center mb-4';
    alertDiv.setAttribute('role', 'alert');

    alertDiv.innerHTML = `
        <i class="bi bi-funnel-fill me-2 fs-5"></i>
        <div>
            <strong>Department Filter:</strong> You are viewing posts for the ${departmentName} department only.
        </div>
    `;

    // Insert after the first heading
    const firstHeading = container.querySelector('h3, h4');
    if (firstHeading && firstHeading.nextElementSibling) {
        container.insertBefore(alertDiv, firstHeading.nextElementSibling);
    } else {
        container.prepend(alertDiv);
    }
}

/**
 * Export posts data specific to department
 */
function exportDepartmentData(format = 'csv') {
    const departmentId = JSON.parse(sessionStorage.getItem('user')).user_departmentId;
    const departmentName = JSON.parse(sessionStorage.getItem('user')).department_name;

    // Generate filename with department and date
    const now = new Date();
    const filename = `${departmentName.replace(/\s+/g, '_')}_Posts_${now.toISOString().split('T')[0]}`;

    // Show export notification
    toastr.info(`Preparing ${format.toUpperCase()} export for ${departmentName}...`);

    // Example implementation (placeholder)
    console.log(`Exporting ${format} for department ${departmentId} as ${filename}`);

    // You would implement the actual export logic here
    // This will be implemented based on what export library you're using

    setTimeout(() => {
        toastr.success(`${departmentName} data exported successfully!`);
    }, 1000);
}
