
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
        }

        const API_BASE_URL = 'http://localhost:3000/api';
        
        const searchInput = document.getElementById('search-input');
        const typeFilter = document.getElementById('type-filter');
        const tableBody = document.getElementById('transactions-table-body');
        const logoutBtn = document.getElementById('logout-btn');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const userNameSidebar = document.getElementById('user-name-sidebar');
        
        let allTransactions = [];

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

        function formatCurrency(number) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        function renderTransactions(transactionsToRender) {
            tableBody.innerHTML = '';
            if (transactionsToRender.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">No transactions found.</td></tr>';
                return;
            }

            transactionsToRender.forEach(tx => {
                const amountClass = tx.type === 'income' ? 'text-green-500' : 'text-red-500';
                const amountSign = tx.type === 'income' ? '+' : '-';
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                // CORRECTED: Added dark mode text color classes
                row.innerHTML = `
                    <td class="p-4 font-medium dark:text-slate-200">${tx.description}</td>
                    <td class="p-4 text-gray-600 dark:text-slate-400">${tx.category}</td>
                    <td class="p-4 text-gray-600 dark:text-slate-400">${formatDate(tx.date)}</td>
                    <td class="p-4 text-right font-semibold ${amountClass}">${amountSign} ${formatCurrency(Math.abs(tx.amount))}</td>
                    <td class="p-4 text-center">
                        <button data-tx-id="${tx.id}" class="delete-tx-btn text-gray-400 hover:text-red-500">
                            <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            lucide.createIcons();
        }

        function filterAndRender() {
            const searchTerm = searchInput.value.toLowerCase();
            const typeValue = typeFilter.value;

            const filtered = allTransactions.filter(tx => {
                const matchesSearch = tx.description.toLowerCase().includes(searchTerm);
                const matchesType = typeValue === 'all' || tx.type === typeValue;
                return matchesSearch && matchesType;
            });

            renderTransactions(filtered);
        }

        async function fetchAllTransactions() {
            try {
                const response = await fetch(`${API_BASE_URL}/transactions/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch transactions');
                allTransactions = await response.json();
                renderTransactions(allTransactions);
            } catch (error) {
                console.error(error);
                tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Could not load transactions.</td></tr>';
            }
        }

        tableBody.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-tx-btn');
            if (deleteButton) {
                const transactionId = deleteButton.dataset.txId;
                if (confirm('Are you sure you want to delete this transaction? This will also update your total balance.')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!response.ok) throw new Error('Failed to delete transaction');
                        fetchAllTransactions(); // Refresh the list
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                }
            }
        });

        searchInput.addEventListener('input', filterAndRender);
        typeFilter.addEventListener('change', filterAndRender);

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            fetchAllTransactions();
            fetchUserInfo();
        });