document.addEventListener('DOMContentLoaded', function() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return;

    try {
        const user = JSON.parse(userInfo);

        if (user.user_typeId == 5) {
            if (user.department_name && !user.user_departmentId) {
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

                if (departmentMap[user.department_name]) {
                    user.user_departmentId = departmentMap[user.department_name];
                    sessionStorage.setItem('user', JSON.stringify(user));
                    sessionStorage.setItem('user_departmentId', departmentMap[user.department_name].toString());
                }
            }

            applyPOCRestrictions(user);

            if (!user.user_departmentId || !user.department_name) {
                toastr.warning('No department is assigned to your account. Please contact the administrator.', '', {
                    timeOut: 5000,
                    closeButton: true
                });
            }
        }
    } catch (e) {
    }
});

function applyPOCRestrictions(user) {
    displayDepartmentInfo(user);
    restrictNavigation();
    forceDepartmentColumnDisplay();
}

function displayDepartmentInfo(user) {
    if (!user.department_name) return;

    const deptIndicator = document.getElementById('department-indicator');
    if (deptIndicator) {
        deptIndicator.classList.remove('d-none');
        const deptNameEl = document.getElementById('department-name');
        if (deptNameEl) {
            deptNameEl.textContent = user.department_name;
        }
    }
}

function addDepartmentFilter(departmentName) {
    return;
}

function addFilteredViewInfo(departmentName) {
    return;
}

function forceDepartmentColumnDisplay() {
    setTimeout(() => {
        const departmentColumns = document.querySelectorAll('.department-column, th');
        departmentColumns.forEach(col => {
            if (col.textContent && col.textContent.includes('Department')) {
                col.classList.remove('d-none');
                col.style.display = 'table-cell';
            }
        });

        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            $('table.dataTable').each(function() {
                try {
                    const table = $(this).DataTable();

                    const headers = table.columns().header().toArray();
                    let colIndex = -1;

                    for (let i = 0; i < headers.length; i++) {
                        if (headers[i].textContent.includes('Department')) {
                            colIndex = i;
                            break;
                        }
                    }

                    if (colIndex >= 0) {
                        table.column(colIndex).visible(true);
                    }
                } catch (e) {
                }
            });
        }
    }, 500);
}

function restrictNavigation() {
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

    // Add department indicator for POC users
    const departmentEl = document.getElementById('department-indicator');
    if (!departmentEl) {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.user_typeId == 5 && user.department_name) {
            const navbarNav = document.querySelector('.navbar-nav');
            if (navbarNav) {
                const deptIndicator = document.createElement('div');
                deptIndicator.id = 'department-indicator';
                deptIndicator.className = 'ms-3 badge bg-light text-dark d-flex align-items-center';
                deptIndicator.innerHTML = `<i class="bi bi-building me-1"></i><span id="department-name">${user.department_name}</span>`;
                navbarNav.appendChild(deptIndicator);
            }
        }
    }
}

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
