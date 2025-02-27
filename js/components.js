function loadComponent(elementId, componentPath) {
    return fetch(componentPath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (typeof initializeNavbarEvents === 'function') {
                initializeNavbarEvents();
            }
            setActiveMenuItem();
        });
}

function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.nav-link');

    menuItems.forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadComponent('navbar-placeholder', 'components/navbar.html');
    loadComponent('sidebar-placeholder', 'components/sidebar.html').then(() => {
        // Add logout handler after components are loaded
        const logoutButton = document.querySelector('#logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async function(e) {
                e.preventDefault();

                const result = await Swal.fire({
                    title: 'Are you sure you want to logout?',
                    text: "You will be logged out of the system",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, logout!',
                    cancelButtonText: 'Cancel'
                });

                if (result.isConfirmed) {
                    localStorage.removeItem('user');
                    sessionStorage.clear();
                    window.location.href = 'index.html';
                }
            });
        }

        // Hide masterfile menu for non-admin users
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user.user_typeId === "6";

        if (!isAdmin) {
            const masterfileElements = document.querySelectorAll([
                '[href*="master-"]',
                '[data-bs-target*="#masterfile"]',
                '.masterfile-menu',
                '#masterfileDropdown',
                'th[data-column="action"]',
                '.action-column'
            ].join(','));

            masterfileElements.forEach(element => {
                if (element?.parentElement) {
                    element.parentElement.style.display = 'none';
                } else if (element) {
                    element.style.display = 'none';
                }
            });
        }
    });
});
