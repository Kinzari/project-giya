document.addEventListener('DOMContentLoaded', function() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        fetch('/dashboard-components/navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load navbar component');
                }
                return response.text();
            })
            .then(data => {
                navbarPlaceholder.innerHTML = data;

                setTimeout(setupSidebarToggle, 100);
            })
            .catch(error => {
                createBasicNavbar(navbarPlaceholder);
            });
    }

    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        fetch('/dashboard-components/sidebar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load sidebar component');
                }
                return response.text();
            })
            .then(data => {
                try {
                    const userString = sessionStorage.getItem('user');
                    if (userString) {
                        const user = JSON.parse(userString);
                        if (user.user_typeId == 5) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = data;

                            const masterFilesDropdown = tempDiv.querySelector('#masterFilesDropdown');
                            if (masterFilesDropdown) {
                                masterFilesDropdown.remove();

                                const dropdownMenus = tempDiv.querySelectorAll('.dropdown-menu');
                                dropdownMenus.forEach(menu => {
                                    if (menu.previousElementSibling &&
                                        menu.previousElementSibling.id === 'masterFilesDropdown') {
                                        menu.remove();
                                    }
                                });
                            }

                            sidebarPlaceholder.innerHTML = tempDiv.innerHTML;
                        } else {
                            sidebarPlaceholder.innerHTML = data;
                        }
                    } else {
                        sidebarPlaceholder.innerHTML = data;
                    }
                } catch (e) {
                    sidebarPlaceholder.innerHTML = data;
                }

                highlightActiveMenuItem();

                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', function() {
                        handleLogout();
                    });
                }

                updateUserInfo();
            })
            .catch(error => {
                createBasicSidebar(sidebarPlaceholder);
            });
    }
});

function highlightActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.nav-items a.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPage ||
            (currentPage === 'dashboard.html' && href.includes('dashboard.html')))) {
            link.classList.add('active');
            link.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            link.style.borderRadius = '5px';
        }
    });
}

function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userTitle = document.querySelector('.user-title');

    if (userName) {
        const firstName = sessionStorage.getItem('user_firstname');
        const lastName = sessionStorage.getItem('user_lastname');
        const userTypeId = sessionStorage.getItem('user_typeId');

        if (firstName && lastName) {
            userName.textContent = `${firstName} ${lastName}`;
        }

        if (userTitle) {
            if (userTypeId === '6') {
                userTitle.textContent = 'Administrator';
            } else if (userTypeId === '5') {
                userTitle.textContent = 'Point of Contact';
            } else {
                userTitle.textContent = 'GIYA User';
            }
        }
    }
}

function handleLogout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#155f37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = '/index.html';
        }
    });
}

function createBasicNavbar(container) {
    container.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
            <div class="container-fluid">
                <button class="navbar-toggler sidebar-toggle" type="button">
                    <i class="bi bi-list"></i>
                </button>
                <a class="navbar-brand" href="dashboard.html">
                    <img src="img/logo/cocicon.png" width="30" height="30" class="d-inline-block align-top me-2">
                    GIYA Admin
                </a>
            </div>
        </nav>
    `;

    const sidebarToggle = container.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sideSheet');
            if (sidebar) {
                const bsOffcanvas = new bootstrap.Offcanvas(sidebar);
                bsOffcanvas.toggle();
            }
        });
    }
}

function createBasicSidebar(container) {
    container.innerHTML = `
        <div class="offcanvas offcanvas-start bg-purple text-white" tabindex="-1" id="sideSheet">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title text-white">GIYA Admin</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div class="d-flex flex-column h-100">
                    <div class="nav-items">
                        <a href="dashboard.html" class="nav-link text-white mb-2">
                            <i class="bi bi-house-door me-2"></i> Dashboard
                        </a>
                        <a href="latest-post.html" class="nav-link text-white mb-2">
                            <i class="bi bi-clock-history me-2"></i> Latest Posts
                        </a>
                        <a href="students.html" class="nav-link text-white mb-2">
                            <i class="bi bi-mortarboard me-2"></i> Student Posts
                        </a>
                        <a href="visitors.html" class="nav-link text-white mb-2">
                            <i class="bi bi-person-badge me-2"></i> Visitor Posts
                        </a>
                    </div>
                    <div class="mt-auto pt-3 border-top">
                        <button id="logout-button" class="btn btn-outline-light w-100">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const logoutButton = container.querySelector('#logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    highlightActiveMenuItem();
}

function setupSidebarToggle() {
    setTimeout(() => {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            const newSidebarToggle = sidebarToggle.cloneNode(true);
            sidebarToggle.parentNode.replaceChild(newSidebarToggle, sidebarToggle);

            newSidebarToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const sidebar = document.getElementById('sideSheet');
                if (sidebar) {
                    sidebar.removeAttribute('data-bs-backdrop');

                    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(sidebar);
                    bsOffcanvas.toggle();

                    sidebar.addEventListener('hidden.bs.offcanvas', function() {
                        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                        backdrops.forEach(el => el.remove());
                        document.body.classList.remove('overflow-hidden');
                        document.body.style.paddingRight = '';
                    }, { once: true });
                }
            });
        }
    }, 200);
}
