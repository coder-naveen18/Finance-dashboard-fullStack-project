
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
        }

        const API_BASE_URL = 'http://localhost:3000/api';

        const profileForm = document.getElementById('profile-form');
        const passwordForm = document.getElementById('password-form');
        const logoutBtn = document.getElementById('logout-btn');
        // CORRECTED: Get sidebar elements
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const userNameSidebar = document.getElementById('user-name-sidebar');

        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = './login.html';
        });


        async function fetchUserInfo() {
             try {
                const response = await fetch(`${API_BASE_URL}/user`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) return;
                const user = await response.json();
                const userAvatar = user.avatar_url || `https://placehold.co/100x100/e0e7ff/3730a3?text=${user.name.charAt(0).toUpperCase()}`;
                sidebarAvatar.src = userAvatar;
                userNameSidebar.textContent = user.name;
            } catch (error) {
                console.error("Could not fetch user info for sidebar", error);
            }
        }
        
        async function fetchUserData() {
            try {
                const response = await fetch(`${API_BASE_URL}/user`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch user data');
                const user = await response.json();
                document.getElementById('name').value = user.name;
                document.getElementById('email').value = user.email;
            } catch (error) {
                alert(`Could not load user data: ${error.message}`);
            }
        }

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email')
            };

            try {
                const response = await fetch(`${API_BASE_URL}/user`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Failed to update profile');
                alert('Profile updated successfully!');
                fetchUserInfo(); // Refresh sidebar name
            } catch (error) {
                alert(`Could not update profile: ${error.message}`);
            }
        });
        
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(passwordForm);
            const newPassword = formData.get('new_password');
            const confirmPassword = formData.get('confirm_password');

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match.');
                return;
            }

            const data = {
                current_password: formData.get('current_password'),
                new_password: newPassword
            };

            try {
                const response = await fetch(`${API_BASE_URL}/user/password`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to update password');

                alert('Password updated successfully!');
                passwordForm.reset();
            } catch (error) {
                alert(`Could not update password: ${error.message}`);
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            fetchUserData();
            fetchUserInfo();
        });