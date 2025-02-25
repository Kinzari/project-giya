const AuthHelper = {
    isVisitor() {
        return sessionStorage.getItem('user_typeId') === '1';
    },
    isStudent() {
        return sessionStorage.getItem('user_typeId') === '2';
    },
    checkAuth() {
        const userTypeId = sessionStorage.getItem('user_typeId');
        const firstName = sessionStorage.getItem('user_firstname');
        const id = sessionStorage.getItem('user_id');
        return {
            isValid: !!(userTypeId && firstName && id),
            userTypeId,
            firstName,
            id
        };
    }
};
