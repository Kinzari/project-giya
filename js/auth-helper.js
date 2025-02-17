const AuthHelper = {
    isVisitor() {
        return localStorage.getItem('user_typeId') === '1';
    },
    isStudent() {
        return localStorage.getItem('user_typeId') === '2';
    },
    checkAuth() {
        const userTypeId = localStorage.getItem('user_typeId');
        const firstName = localStorage.getItem('user_firstname');
        const id = localStorage.getItem('user_id');
        return {
            isValid: !!(userTypeId && firstName && id),
            userTypeId,
            firstName,
            id
        };
    }
};
