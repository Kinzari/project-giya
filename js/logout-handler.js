document.addEventListener('DOMContentLoaded', () => {

    // ambot unsay pulos ani (logout function)
    $('#logoutBtn').click(function() {
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#155f37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                toastr.success('Logging out...');
                localStorage.clear();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    });
});
