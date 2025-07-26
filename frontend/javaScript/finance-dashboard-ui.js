const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
        }

        const API_BASE_URL = 'http://localhost:3000/api';
        
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const modal = document.getElementById('add-transaction-modal');
        const transactionForm = document.getElementById('transaction-form');
        const logoutBtn = document.getElementById('logout-btn');
        let spendingChart;

        function showModal() { modal.classList.remove('hidden'); }
        function hideModal() { modal.classList.add('hidden'); transactionForm.reset(); }
        addTransactionBtn.addEventListener('click', showModal);
        closeModalBtn.addEventListener('click', hideModal);
        cancelBtn.addEventListener('click', hideModal);

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });

        transactionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(transactionForm);
            const transactionData = {
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                type: formData.get('type'),
                category_id: parseInt(formData.get('category')),
                account_id: 1 
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(transactionData),
                });
                if (!response.ok) throw new Error('Failed to add transaction');
                hideModal();
                fetchSummaryData();
                fetchTransactions();
                fetchChartData();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });

        function formatCurrency(number) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
        }

        async function fetchSummaryData() {
            try {
                const response = await fetch(`${API_BASE_URL}/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Could not fetch summary');
                const data = await response.json();
                const balanceEl = document.getElementById('total-balance');
                const incomeEl = document.getElementById('total-income');
                const expensesEl = document.getElementById('total-expenses');
                const savingsEl = document.getElementById('total-savings');
                balanceEl.textContent = formatCurrency(data.totalBalance);
                incomeEl.textContent = formatCurrency(data.totalIncome);
                expensesEl.textContent = formatCurrency(data.totalExpenses);
                savingsEl.textContent = formatCurrency(data.savings);
                [balanceEl, incomeEl, expensesEl, savingsEl].forEach(el => el.classList.remove('skeleton', 'h-9'));
            } catch (error) {
                console.error(error);
            }
        }
        
        async function fetchTransactions() {
            try {
                const response = await fetch(`${API_BASE_URL}/transactions?limit=5`, {
                         headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Could not fetch transactions');
                const transactions = await response.json();
                const listEl = document.getElementById('transactions-list');
                listEl.innerHTML = ''; 
                transactions.forEach(tx => {
                    // Dark Mode Change: Updated text and background colors for dark theme
                    const amountClass = tx.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
                    const amountSign = tx.type === 'income' ? '+' : '-';
                    const transactionEl = document.createElement('div');
                    transactionEl.className = 'flex items-center justify-between';
                    transactionEl.innerHTML = `
                        <div class="flex items-center">
                            <div class="icon-wrapper bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"><i data-lucide="${tx.icon || 'dollar-sign'}"></i></div>
                            <div class="ml-3">
                                <p class="font-semibold dark:text-slate-200">${tx.description}</p>
                                <p class="text-sm text-gray-500 dark:text-slate-400">${tx.category}</p>
                            </div>
                        </div>
                        <p class="font-semibold ${amountClass}">${amountSign}${formatCurrency(Math.abs(tx.amount))}</p>
                    `;
                    listEl.appendChild(transactionEl);
                });
                lucide.createIcons();
            } catch (error) {
                console.error(error);
            }
        }
        
        async function fetchUserName() {
            try {
                const response = await fetch(`${API_BASE_URL}/user`, {
                         headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) return;
                const user = await response.json();
                document.getElementById('welcome-header').textContent = `Welcome Back, ${user.name}!`;
                document.getElementById('user-name-sidebar').textContent = user.name;
            } catch (error) {
                console.error("Could not fetch user's name", error);
            }
        }

        function initializeChart() {
            // Dark Mode Change: Set chart colors based on theme
            const isDarkMode = document.documentElement.classList.contains('dark');
            const textColor = isDarkMode ? '#cbd5e1' : '#6b7280';
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const expenseColor = isDarkMode ? 'rgba(220, 38, 38, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            const incomeColor = isDarkMode ? 'rgba(74, 222, 128, 0.8)' : 'rgba(34, 197, 94, 0.8)';

            const ctx = document.getElementById('spendingChart').getContext('2d');
            spendingChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Expenses',
                        data: [],
                        backgroundColor: expenseColor,
                        borderColor: expenseColor.replace('0.8', '1'),
                        borderWidth: 1,
                        borderRadius: 8,
                        barPercentage: 0.6,
                    },
                    {
                        label: 'Income',
                        data: [],
                        backgroundColor: incomeColor,
                        borderColor: incomeColor.replace('0.8', '1'),
                        borderWidth: 1,
                        borderRadius: 8,
                        barPercentage: 0.6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            grid: { drawBorder: false, color: gridColor },
                            ticks: { color: textColor }
                        }, 
                        x: { 
                            grid: { display: false },
                            ticks: { color: textColor }
                        } 
                    },
                    plugins: { 
                        legend: { 
                            position: 'top', 
                            align: 'end',
                            labels: { color: textColor }
                        } 
                    },
                    interaction: { intersect: false, mode: 'index' }
                }
            });
        }

        async function fetchChartData() {
            try {
                const response = await fetch(`${API_BASE_URL}/chart-data`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Could not fetch chart data');
                const chartData = await response.json();

                spendingChart.data.labels = chartData.labels;
                spendingChart.data.datasets[0].data = chartData.expenseData;
                spendingChart.data.datasets[1].data = chartData.incomeData;
                spendingChart.update();

            } catch (error) {
                console.error("Chart data error:", error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            initializeChart();
            fetchUserName();
            fetchSummaryData();
            fetchTransactions();
            fetchChartData();
        });