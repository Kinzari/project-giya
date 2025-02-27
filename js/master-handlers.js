class MasterHandlers {
    constructor() {
        this.baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
        this.initializeHandlers();
    }

    initializeHandlers() {
        // Handle form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formId = e.target.id;
                const formData = new FormData(e.target);

                try {
                    const response = await this.submitForm(formId, formData);
                    if (response.success) {
                        Swal.fire('Success', 'Record saved successfully', 'success');
                        this.refreshTable(formId);
                        bootstrap.Modal.getInstance(e.target.closest('.modal')).hide();
                    } else {
                        throw new Error(response.message);
                    }
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            });
        });

        // Handle delete operations
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.delete-btn').dataset.id;
                const type = this.getCurrentPageType();

                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: "This action cannot be undone",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                });

                if (result.isConfirmed) {
                    try {
                        const response = await this.deleteRecord(type, id);
                        if (response.success) {
                            Swal.fire('Deleted!', 'Record has been deleted.', 'success');
                            this.refreshTable(type);
                        } else {
                            throw new Error(response.message);
                        }
                    } catch (error) {
                        Swal.fire('Error', error.message, 'error');
                    }
                }
            }
        });

        // Initialize edit buttons
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.edit-btn').dataset.id;
                const type = this.getCurrentPageType();
                await this.loadEditForm(type, id);
            }
        });
    }

    getCurrentPageType() {
        const page = window.location.pathname.split('/').pop();
        return page.replace('master-', '').replace('.html', '');
    }

    async submitForm(formId, formData) {
        const type = formId.replace('Form', '');
        const url = `${this.baseURL}masterfile.php?action=save_${type}`;
        const response = await axios.post(url, formData);
        return response.data;
    }

    async deleteRecord(type, id) {
        const url = `${this.baseURL}masterfile.php?action=delete_${type}&id=${id}`;
        const response = await axios.delete(url);
        return response.data;
    }

    async loadEditForm(type, id) {
        try {
            const response = await axios.get(`${this.baseURL}masterfile.php?action=get_${type}&id=${id}`);
            if (response.data.success) {
                const data = response.data.data;
                const form = document.getElementById(`${type}Form`);
                this.populateForm(form, data);
                bootstrap.Modal.getOrCreateInstance(document.getElementById(`${type}Modal`)).show();
            }
        } catch (error) {
            console.error('Error loading record:', error);
            Swal.fire('Error', 'Failed to load record', 'error');
        }
    }

    populateForm(form, data) {
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    refreshTable(type) {
        const table = $(`#${type}Table`).DataTable();
        table.ajax.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.masterHandlers = new MasterHandlers();
});
