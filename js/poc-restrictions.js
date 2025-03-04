(function() {
    function isPOC() {
        const userType = localStorage.getItem('userType');
        return userType === '5';
    }

    function isAdmin() {
        const userType = localStorage.getItem('userType');
        return userType === '6';
    }
    function applyPOCRestrictions() {
        if (isPOC()) {
            $('.admin-only').hide();

            $('.edit-row, .delete-row').prop('disabled', true).hide();

            $('main .container').prepend('<div class="alert alert-info">You are viewing this page in read-only mode.</div>');

            $('table').on('draw.dt', function() {
                $('.btn-primary, .btn-danger').prop('disabled', true).hide();
            });
        }
    }

    $(document).ready(function() {
        applyPOCRestrictions();
    });
})();
