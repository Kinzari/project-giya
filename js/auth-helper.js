const AuthHelper = {
    // Checks if current user is a visitor (user_typeId === '1')
    isVisitor() {
        return localStorage.getItem('user_typeId') === '1';
    },

    // Checks if current user is a student (user_typeId === '2')
    isStudent() {
        return localStorage.getItem('user_typeId') === '2';
    },

    // Gets the appropriate ID based on user type
    // Returns visitorId for visitors, studentId for students
    getId() {
        if (this.isVisitor()) {
            return localStorage.getItem('visitorId');
        }
        return localStorage.getItem('studentId');
    },

    // Does a complete authentication check
    // Returns an object with auth status and user details
    checkAuth() {
        const userTypeId = localStorage.getItem('user_typeId');
        const firstName = localStorage.getItem('first_name');
        const id = this.getId();

        return {
            isValid: !!(userTypeId && firstName && id), // true if all required data exists
            userTypeId,
            firstName,
            id
        };
    }
};
