
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = 'login.html'; }

        const API_BASE_URL = 'http://localhost:3000/api';

        // RESTORED: DOM elements for sidebar
        const logoutBtn = document.getElementById('logout-btn');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const userNameSidebar = document.getElementById('user-name-sidebar');

        const addGoalBtn = document.getElementById('add-goal-btn');
        const addModal = document.getElementById('add-goal-modal');
        const closeAddModalBtn = document.getElementById('close-modal-btn');
        const cancelAddBtn = document.getElementById('cancel-btn');
        const addGoalForm = document.getElementById('goal-form');
        
        const editModal = document.getElementById('edit-goal-modal');
        const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const editGoalForm = document.getElementById('edit-goal-form');

        const goalsGrid = document.getElementById('goals-grid');
        const loadingMsg = document.getElementById('loading-goals-msg');

        addGoalBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
        closeAddModalBtn.addEventListener('click', () => addModal.classList.add('hidden'));
        cancelAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));
        closeEditModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
        cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));
        
        // RESTORED: Logout and User Info logic
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
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

        function formatCurrency(number) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
        }

        async function fetchAndDisplayGoals() {
            try {
                const response = await fetch(`${API_BASE_URL}/savings`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Failed to fetch savings goals');
                const goals = await response.json();
                goalsGrid.innerHTML = ''; 
                if (goals.length === 0) {
                    goalsGrid.innerHTML = '<p class="col-span-full dark:text-slate-400">You have no savings goals.</p>';
                    return;
                }

                goals.forEach(goal => {
                    const progress = (goal.current_amount / goal.target_amount) * 100;
                    const goalElement = document.createElement('div');
                    goalElement.className = 'goal-card';
                    goalElement.innerHTML = `
                        <div class="absolute top-4 right-4 flex space-x-2">
                            <button data-goal-id="${goal.id}" data-name="${goal.name}" data-target="${goal.target_amount}" data-current="${goal.current_amount}" class="edit-goal-btn text-white/70 hover:text-white transition-colors">
                                <i data-lucide="pencil" class="w-5 h-5 pointer-events-none"></i>
                            </button>
                            <button data-goal-id="${goal.id}" class="delete-goal-btn text-white/70 hover:text-white transition-colors">
                                <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                            </button>
                        </div>
                        <h3 class="text-xl font-semibold">${goal.name}</h3>
                        <div class="w-full">
                            <div class="progress-bar-bg rounded-full h-2.5"><div class="progress-bar-fill h-2.5 rounded-full" style="width: ${progress.toFixed(2)}%;"></div></div>
                        </div>
                        <div class="flex justify-between items-end">
                            <div><p class="text-xs opacity-70">Current</p><p class="font-medium">${formatCurrency(goal.current_amount)}</p></div>
                            <div><p class="text-xs opacity-70">Target</p><p class="font-medium">${formatCurrency(goal.target_amount)}</p></div>
                        </div>
                    `;
                    goalsGrid.appendChild(goalElement);
                });
                lucide.createIcons();
            } catch (error) {
                console.error(error);
                loadingMsg.textContent = 'Could not load your savings goals.';
            }
        }

        addGoalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addGoalForm);
            const goalData = {
                name: formData.get('goal_name'),
                target_amount: parseFloat(formData.get('target_amount')),
                current_amount: parseFloat(formData.get('current_amount')),
            };
            try {
                const response = await fetch(`${API_BASE_URL}/savings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(goalData)
                });
                if (!response.ok) throw new Error('Failed to save goal');
                addModal.classList.add('hidden');
                addGoalForm.reset();
                fetchAndDisplayGoals();
            } catch (error) { alert(`Could not save goal: ${error.message}`); }
        });

        editGoalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editGoalForm);
            const goalId = formData.get('goal_id');
            const goalData = {
                name: formData.get('goal_name'),
                target_amount: parseFloat(formData.get('target_amount')),
                current_amount: parseFloat(formData.get('current_amount')),
            };
            try {
                const response = await fetch(`${API_BASE_URL}/savings/${goalId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(goalData)
                });
                if (!response.ok) throw new Error('Failed to update goal');
                editModal.classList.add('hidden');
                fetchAndDisplayGoals();
            } catch (error) { alert(`Could not update goal: ${error.message}`); }
        });

        goalsGrid.addEventListener('click', async (e) => {
            const targetButton = e.target.closest('button');
            if (!targetButton) return;
            const goalId = targetButton.dataset.goalId;
            if (targetButton.classList.contains('delete-goal-btn')) {
                if (confirm('Are you sure you want to delete this savings goal?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/savings/${goalId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!response.ok) throw new Error('Failed to delete goal');
                        fetchAndDisplayGoals();
                    } catch (error) { alert(`Error: ${error.message}`); }
                }
            } else if (targetButton.classList.contains('edit-goal-btn')) {
                document.getElementById('edit-goal-id').value = goalId;
                document.getElementById('edit-goal-name').value = targetButton.dataset.name;
                document.getElementById('edit-target-amount').value = targetButton.dataset.target;
                document.getElementById('edit-current-amount').value = targetButton.dataset.current;
                editModal.classList.remove('hidden');
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            fetchAndDisplayGoals();
            fetchUserInfo(); 
        });