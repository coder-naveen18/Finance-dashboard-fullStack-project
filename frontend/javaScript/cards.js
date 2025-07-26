 const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
        }

        const API_BASE_URL = 'http://localhost:3000/api';

        const addCardBtn = document.getElementById('add-card-btn');
        const modal = document.getElementById('add-card-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cardForm = document.getElementById('card-form');
        const cardsGrid = document.getElementById('cards-grid');
        const loadingMsg = document.getElementById('loading-cards-msg');
        const logoutBtn = document.getElementById('logout-btn');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const userNameSidebar = document.getElementById('user-name-sidebar');

        function showModal() { modal.classList.remove('hidden'); }
        function hideModal() { modal.classList.add('hidden'); cardForm.reset(); }

        addCardBtn.addEventListener('click', showModal);
        closeModalBtn.addEventListener('click', hideModal);
        modal.querySelector('#cancel-btn').addEventListener('click', hideModal);

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

        async function fetchAndDisplayCards() {
            try {
                const response = await fetch(`${API_BASE_URL}/cards`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch cards');
                const cards = await response.json();

                cardsGrid.innerHTML = '';
                if (cards.length === 0) {
                    cardsGrid.innerHTML = '<p class="dark:text-slate-400">You have no saved cards. Add one to get started!</p>';
                    return;
                }

                cards.forEach(card => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'credit-card';
                    cardElement.innerHTML = `
                        <button data-card-id="${card.id}" class="delete-card-btn absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                            <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                        </button>
                        <div class="flex justify-between items-start">
                            <span class="font-mono text-lg">${card.type.toUpperCase()}</span>
                            <i data-lucide="wifi" class="w-6 h-6"></i>
                        </div>
                        <div class="font-mono text-xl tracking-widest">
                            •••• •••• •••• ${card.last4}
                        </div>
                        <div class="flex justify-between items-end">
                            <div>
                                <p class="text-xs opacity-70">Card Holder</p>
                                <p class="font-medium">${card.card_holder}</p>
                            </div>
                            <div>
                                <p class="text-xs opacity-70">Expires</p>
                                <p class="font-medium">${card.expiry_date}</p>
                            </div>
                        </div>
                    `;
                    cardsGrid.appendChild(cardElement);
                });
                lucide.createIcons();
            } catch (error) {
                console.error(error);
                loadingMsg.textContent = 'Could not load your cards.';
            }
        }

        // RESTORED: This is the logic that was missing
        cardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(cardForm);
            const cardData = {
                card_number: formData.get('card_number'),
                card_holder: formData.get('card_holder'),
                expiry_date: formData.get('expiry_date'),
                cvv: formData.get('cvv'),
                type: 'visa'
            };
            try {
                const response = await fetch(`${API_BASE_URL}/cards`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(cardData)
                });
                if (!response.ok) throw new Error('Failed to save card');
                hideModal();
                fetchAndDisplayCards();
            } catch (error) {
                alert(`Could not save card: ${error.message}`);
            }
        });

        cardsGrid.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-card-btn');
            if (deleteButton) {
                const cardId = deleteButton.dataset.cardId;
                if (confirm('Are you sure you want to delete this card?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!response.ok) throw new Error('Failed to delete card');
                        fetchAndDisplayCards();
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                }
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            fetchAndDisplayCards();
            fetchUserInfo();
        });