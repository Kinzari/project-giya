class MasterFileManager {
    constructor() {
        this.baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
        this.initializeTables();
        this.initializeEventListeners();
    }

    initializeTables() {
        const currentPage = window.location.pathname.split('/').pop();

        switch(currentPage) {
            case 'master-students.html':
                this.initializeStudentsTable();
                break;
            case 'master-poc.html':
                this.initializePOCTable();
                break;
            case 'master-departments.html':
                this.initializeDepartmentsTable();
                break;
            case 'master-courses.html':
                this.initializeCoursesTable();
                break;
            case 'master-inquiry-types.html':
                this.initializeInquiryTypesTable();
                break;
        }
    }

    initializeStudentsTable() {
        $('#studentsTable').DataTable({
            ajax: {
                url: `${this.baseURL}masterfile.php?action=students`,
                dataSrc: 'data'
            },
            columns: [
                { data: 'user_schoolId' },
                { data: 'user_firstname',
                  render: (data, type, row) => `${row.user_firstname} ${row.user_lastname}` },
                { data: 'department_name' },
                { data: 'course_name' },
                { data: 'user_schoolyearId' },
                { data: 'user_status',
                  render: data => `<span class="badge ${data ? 'bg-success' : 'bg-danger'}">${data ? 'Active' : 'Inactive'}</span>` },
                { data: null,
                  render: (data, type, row) => `
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${row.user_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${row.user_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                  `
                }
            ]
        });
    }

    initializePOCTable() {
        $('#pocTable').DataTable({
            ajax: {
                url: `${this.baseURL}masterfile.php?action=poc`,
                dataSrc: 'data'
            },
            columns: [
                { data: 'user_schoolId' },
                { data: 'user_firstname',
                  render: (data, type, row) => `${row.user_firstname} ${row.user_lastname}` },
                { data: 'department_name' },
                { data: 'user_contact' },
                { data: 'phinmaed_email' },
                { data: 'user_status',
                  render: data => `<span class="badge ${data ? 'bg-success' : 'bg-danger'}">${data ? 'Active' : 'Inactive'}</span>` },
                { data: null,
                  render: (data, type, row) => `
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${row.user_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${row.user_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                  `
                }
            ]
        });
    }

    async loadDepartments(selectElement) {
        try {
            const response = await axios.get(`${this.baseURL}masterfile.php?action=departments`);
            if (response.data.success) {
                const departments = response.data.data;
                selectElement.innerHTML = '<option value="">Select Department</option>';
                departments.forEach(dept => {
                    selectElement.innerHTML += `<option value="${dept.department_id}">${dept.department_name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    }

    initializeEventListeners() {

        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });


        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.delete-btn').dataset.id;
                this.handleDelete(id);
            }
        });


        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.edit-btn').dataset.id;
                this.handleEdit(id);
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

    }

    async handleDelete(id) {

    }

    async handleEdit(id) {

    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.masterFileManager = new MasterFileManager();
});
