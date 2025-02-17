let postsData = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    setupEventListeners();
});

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.filter;
            displayPosts();

            document.querySelectorAll('[data-filter]').forEach(btn =>
                btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Add reply form handler
    document.addEventListener('submit', async (e) => {
        if (e.target.matches('.reply-form')) {
            e.preventDefault();
            const postId = e.target.dataset.postId;
            const input = e.target.querySelector('.reply-input');
            await submitReply(postId, input.value);
            input.value = '';
        }
    });
}

async function loadPosts() {
    try {
        const response = await axios.get(`${sessionStorage.getItem('baseURL')}?action=get_visitor_posts`);
        console.log('API Response:', response.data);

        if (response.data.success) {
            postsData = response.data.posts;
            displayPosts();
        } else {
            toastr.error('Failed to load posts: ' + response.data.message);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        toastr.error('Failed to load posts');
    }
}

function displayPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';

    const filteredPosts = postsData.filter(post => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'pending') return post.post_status === 'Pending';
        if (currentFilter === 'resolved') return post.post_status === 'Resolved';
        return true;
    });

    if (filteredPosts.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No posts found.</div>';
        return;
    }

    filteredPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card card mb-4';

        postElement.innerHTML = `
            <div class="post-header d-flex justify-content-between align-items-start p-3">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar-container" data-user-id="${post.post_userId}">
                        <i class="bi bi-person-circle fs-1 text-secondary" style="cursor: pointer;"></i>
                    </div>
                    <div>
                        <h5 class="mb-1 student-name fw-bold">${post.visitor_name}</h5>
                        <small class="text-muted">${post.visitor_id}</small>
                    </div>
                </div>
                <span class="badge bg-${post.post_status === 'Pending' ? 'warning' : 'success'}">
                    ${post.post_status || 'Pending'}
                </span>
            </div>
            <div class="concern-header px-3 pt-2">
                <h4 class="concern-type mb-1">INQUIRY</h4>
                <h6 class="inquiry-category fw-bold text-secondary mb-3">${post.post_title}</h6>
            </div>
            <div class="post-content position-relative pb-4">
                <div class="px-3">
                    <p class="post-message mb-2 fs-5">${post.post_message}</p>
                </div>
                <div class="post-metadata text-muted small position-absolute bottom-0 end-0 pe-3">
                    <i class="bi bi-clock"></i> ${post.post_date} ${post.post_time}
                </div>
            </div>
            <div class="replies-section bg-light">
                <div class="p-3">
                    <h6 class="fw-bold">Replies</h6>
                    <div class="replies-container mb-3">
                        ${(post.replies || []).map(reply => createReplyElement(reply).outerHTML).join('')}
                    </div>
                    <form class="reply-form" data-post-id="${post.post_id}">
                        <div class="input-group">
                            <input type="text" class="form-control reply-input"
                                placeholder="Write a reply..." required>
                            <button class="btn btn-primary" type="submit">Reply</button>
                        </div>
                    </form>
                </div>
            </div>
            ${post.post_status === 'Pending' ? `
                <div class="post-footer">
                    <button class="btn btn-sm btn-success resolve-btn ms-3 mb-3"
                            onclick="resolvePost(${post.post_id})">
                        <i class="bi bi-check-circle"></i> Mark as Resolved
                    </button>
                </div>
            ` : ''}
        `;

        // Add avatar click handler
        const avatarContainer = postElement.querySelector('.avatar-container');
        avatarContainer.addEventListener('click', () => showUserDetails(post.post_userId));

        container.appendChild(postElement);
    });
}

function createReplyElement(reply) {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'reply-card';
    replyDiv.innerHTML = `
        <div class="d-flex justify-content-between">
            <strong>${reply.admin_name}</strong>
            <small class="text-muted">${reply.reply_date}</small>
        </div>
        <p class="mb-0">${reply.reply_message}</p>
    `;
    return replyDiv;
}

async function showUserDetails(userId) {
    try {
        const response = await axios.get(`${sessionStorage.getItem('baseURL')}?action=get_visitor_details&user_id=${userId}`);

        if (response.data.success) {
            const user = response.data.user;
            document.getElementById('detail-schoolId').textContent = user.user_schoolId || '-';
            document.getElementById('detail-firstName').textContent = user.user_firstname || '-';
            document.getElementById('detail-middleName').textContent = user.user_middlename || '-';
            document.getElementById('detail-lastName').textContent = user.user_lastname || '-';
            document.getElementById('detail-suffix').textContent = user.user_suffix || '-';
            document.getElementById('detail-email').textContent = user.user_email || '-';
            document.getElementById('detail-contact').textContent = user.user_contact || '-';

            new bootstrap.Modal(document.getElementById('userDetailsModal')).show();
        } else {
            toastr.error('Failed to load visitor details');
        }
    } catch (error) {
        console.error('Error fetching visitor details:', error);
        toastr.error('Failed to load visitor details');
    }
}

async function submitReply(postId, message) {
    try {
        const adminId = localStorage.getItem('user_id');
        const response = await axios.post(`${sessionStorage.getItem('baseURL')}?action=submit_reply`, {
            post_id: postId,
            reply_message: message,
            admin_id: adminId
        });

        if (response.data.success) {
            toastr.success('Reply sent successfully');
            await loadPosts();
        } else {
            throw new Error(response.data.message || 'Failed to send reply');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        toastr.error(error.message || 'Failed to send reply');
    }
}

async function resolvePost(postId) {
    try {
        const result = await Swal.fire({
            title: 'Resolve Post?',
            text: 'Are you sure you want to mark this post as resolved?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, resolve it',
            cancelButtonText: 'No, cancel'
        });

        if (result.isConfirmed) {
            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}?action=resolve_post`,
                { post_id: postId }
            );

            if (response.data.success) {
                toastr.success('Post marked as resolved');
                await loadPosts();
            } else {
                toastr.error('Failed to resolve post');
            }
        }
    } catch (err) {
        console.error('Error resolving post:', err);
        toastr.error('Failed to resolve post');
    }
}
