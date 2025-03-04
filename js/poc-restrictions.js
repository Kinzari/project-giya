/**
 * POC Restrictions Module
 * Handles department-based restrictions and UI adjustments for POC users
 */

document.addEventListener('DOMContentLoaded', function() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return;

    try {
        const user = JSON.parse(userInfo);

        // Only apply restrictions to POC users
        if (user.user_typeId == 5) {
            // Check if user has department name but no department ID
            if (user.department_name && !user.user_departmentId) {
                // Add a manual mapping for known departments
                const departmentMap = {
                    'CAHS': 1,
                    'CAS': 2,
                    'CEA': 3,
                    'CITE': 4,
                    'CMA': 5,
                    'COE': 6,
                    'SCCJ': 7,
                    'SHS': 8,
                    'BASIC ED': 9,
                    'GRADUATE SCHOOL': 10,
                    'Registrar': 12,
                    'Marketing': 13,
                    'CSDL': 14,
                    'Finance': 15,
                    'Business Center': 16,
                    'Library': 17,
                    'ITS': 18,
                    'GSD': 19,
                    'Clinic (College)': 20,
                    'Clinic (Basic Ed & SHS)': 21
                };

                // Assigned department ID based on name
                if (departmentMap[user.department_name]) {
                    user.user_departmentId = departmentMap[user.department_name];
                    // Update the user object in sessionStorage
                    sessionStorage.setItem('user', JSON.stringify(user));
                    sessionStorage.setItem('user_departmentId', departmentMap[user.department_name].toString());

                    console.log(`Department ID ${user.user_departmentId} automatically assigned based on name "${user.department_name}"`);
                }
            }

            applyPOCRestrictions(user);

            // Log department info for debugging
            console.info('POC user detected:', {
                department_id: user.user_departmentId,
                department_name: user.department_name
            });

            // If no department is assigned, show a warning
            if (!user.user_departmentId || !user.department_name) {
                toastr.warning('No department is assigned to your account. Please contact the administrator.', '', {
                    timeOut: 5000,
                    closeButton: true
                });
            }
        }
    } catch (e) {
        console.error('Error applying POC restrictions:', e);
    }
});

/**
 * Apply POC-specific restrictions and UI adjustments
 * @param {Object} user - The logged-in user object
 */
function applyPOCRestrictions(user) {
    // Show department name in the header if applicable
    displayDepartmentInfo(user);

    // Modify navigation items to show only relevant sections
    restrictNavigation();

    // Make sure all tables show department columns for POC users
    forceDepartmentColumnDisplay();
}

/**
 * Display department information in the UI
 * @param {Object} user - The user object containing department info
 */
function displayDepartmentInfo(user) {
    if (!user.department_name) return;

    // Add department indicator in the UI - but don't add multiple indicators
    const deptIndicator = document.getElementById('department-indicator');
    if (deptIndicator) {
        deptIndicator.classList.remove('d-none');
        const deptNameEl = document.getElementById('department-name');
        if (deptNameEl) {
            deptNameEl.textContent = user.department_name;
        }
    }
}

/**
 * Add a visible department filter indicator to the page
 * REMOVED - We don't need this anymore
 */
function addDepartmentFilter(departmentName) {
    // This function is intentionally empty now
    return;
}

/**
 * Add info about filtered view (new)
 * REMOVED - We don't need this anymore
 */
function addFilteredViewInfo(departmentName) {
    // This function is intentionally empty now
    return;
}

/**
 * Force department columns to display in all tables
 */
function forceDepartmentColumnDisplay() {
    // Find all department columns and make them visible for POC users
    setTimeout(() => {
        // Fixed: Removed invalid :contains() selector
        const departmentColumns = document.querySelectorAll('.department-column, th');
        departmentColumns.forEach(col => {
            // Only operate on department columns
            if (col.textContent && col.textContent.includes('Department')) {
                col.classList.remove('d-none');
                col.style.display = 'table-cell';
            }
        });

        // Try to access DataTables API if available
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            $('table.dataTable').each(function() {
                try {
                    const table = $(this).DataTable();

                    // Find the department column index
                    const headers = table.columns().header().toArray();
                    let colIndex = -1;

                    for (let i = 0; i < headers.length; i++) {
                        if (headers[i].textContent.includes('Department')) {
                            colIndex = i;
                            break;
                        }
                    }

                    // Show the column
                    if (colIndex >= 0) {
                        table.column(colIndex).visible(true);
                    }
                } catch (e) {
                    console.error('Error showing department column:', e);
                }
            });
        }
    }, 500); // Slight delay to ensure tables are initialized
}

/**
 * Modify navigation to show only department-relevant sections
 */
function restrictNavigation() {
    // Example: Hide links to sections that POC shouldn't access
    const restrictedPages = [
        'all-department.html',
        'master-courses.html',
        'master-departments.html'
    ];

    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && restrictedPages.some(page => href.includes(page))) {
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            }
        }
    });
}

/**
 * Check if the logged-in user is a POC
 * @returns {boolean} True if the user is a POC
 */
function isPOC() {
    try {
        const userInfo = sessionStorage.getItem('user');
        if (!userInfo) return false;

        const user = JSON.parse(userInfo);
        return user.user_typeId == 5;
    } catch (e) {
        return false;
    }
}

// Old jQuery extension removed to prevent errors
