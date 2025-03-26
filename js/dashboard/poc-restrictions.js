/**
 * POC Restrictions - Handles restrictions for Point of Contact users
 */

document.addEventListener('DOMContentLoaded', function() {
    const userTypeId = sessionStorage.getItem('user_typeId');
    const isAdmin = userTypeId === '6';
    const isPOC = userTypeId === '5';

    const adminOnlyPages = [
        'master-students.html',
        'master-visitors.html',
        'master-employees.html',
        'master-poc.html',
        'master-courses.html',
        'master-departments.html',
        'master-campus.html',
        'master-faq.html',
        'master-inquiry-types.html'
    ];

    if (isPOC && !isAdmin) {
        const currentPath = window.location.pathname;

        const isAdminPage = adminOnlyPages.some(page => currentPath.includes(page));

        if (isAdminPage) {
            window.location.href = '/dashboard/dashboard.html';
        }

        adminOnlyPages.forEach(page => {
            const menuItem = document.querySelector(`a[href*="${page}"]`);
            if (menuItem) {
                const parentLi = menuItem.closest('li');
                if (parentLi) parentLi.style.display = 'none';
            }
        });

        const masterfilesDropdown = document.getElementById('masterFilesDropdown');
        if (masterfilesDropdown) {
            const visibleItems = document.querySelectorAll('#masterfiles-dropdown li:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                masterfilesDropdown.style.display = 'none';
            }
        }
    }
});

window.isPOCUser = function() {
    const userInfo = sessionStorage.getItem('user');
    if (!userInfo) return false;

    try {
        const user = JSON.parse(userInfo);
        return user.user_typeId == 5;
    } catch (e) {
        return false;
    }
};
