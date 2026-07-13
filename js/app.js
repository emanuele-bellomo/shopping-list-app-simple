/**
 * app.js - Main Application Logic
 * 
 * Handles DOM manipulation, event listeners, and UI updates.
 * Follows Vanilla JS principles without any frameworks.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Lists
    const listsContainer = document.getElementById('lists-container');
    const addListForm = document.getElementById('add-list-form');
    const newListInput = document.getElementById('new-list-input');
    
    // Items
    const currentListTitle = document.getElementById('current-list-title');
    const addItemForm = document.getElementById('add-item-form');
    const newItemInput = document.getElementById('new-item-input');
    const itemsContainer = document.getElementById('items-container');
    const emptyState = document.getElementById('empty-state');

    // Header Actions
    const headerActions = document.getElementById('header-actions');
    const headerSpacer = document.getElementById('header-spacer');
    const renameListBtn = document.getElementById('rename-list-btn');
    const copyListBtn = document.getElementById('copy-list-btn');
    const shareListBtn = document.getElementById('share-list-btn');

    // === Application State ===
    let activeListId = Store.getActiveListId();
    let deferredPrompt; // For PWA install prompt

    // === Initialization ===
    init();

    function init() {
        registerServiceWorker();
        setupPwaInstall();
        renderLists();
        renderActiveList();
        setupEventListeners();
    }

    /**
     * Service Worker Registration for PWA offline capabilities
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('SW registered with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.error('SW registration failed:', error);
                    });
            });
        }
    }

    /**
     * Handles PWA Install Banner Logic
     */
    function setupPwaInstall() {
        const installBanner = document.getElementById('install-banner');
        const installBtn = document.getElementById('install-btn');
        const closeBannerBtn = document.getElementById('close-banner-btn');

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            // Update UI to notify the user they can add to home screen
            installBanner.classList.remove('hidden');
        });

        // Handle the Install button click
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                // We've used the prompt, and can't use it again, throw it away
                deferredPrompt = null;
                // Hide the banner
                installBanner.classList.add('hidden');
            }
        });

        // Handle the Close banner button
        closeBannerBtn.addEventListener('click', () => {
            installBanner.classList.add('hidden');
        });

        // Hide banner if app is successfully installed
        window.addEventListener('appinstalled', () => {
            installBanner.classList.add('hidden');
            deferredPrompt = null;
            console.log('PWA was installed');
        });
    }

    // === UI Rendering ===

    /**
     * Renders the sidebar lists
     */
    function renderLists() {
        const lists = Store.getLists();
        listsContainer.innerHTML = ''; // Clear existing lists

        lists.forEach(list => {
            // Educational Note: Using document.createElement is safer than innerHTML 
            // when dealing with user input to prevent XSS attacks.
            const li = document.createElement('li');
            if (list.id === activeListId) {
                li.classList.add('active');
            }
            
            const span = document.createElement('span');
            span.textContent = list.name;
            span.className = 'list-name';
            // Click to activate list
            li.addEventListener('click', () => {
                activeListId = list.id;
                Store.setActiveListId(activeListId);
                renderLists();
                renderActiveList();
                closeSidebar(); // Close on mobile after selection
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn danger';
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>';
            deleteBtn.setAttribute('aria-label', 'Delete list');
            
            // Educational Note: stopPropagation prevents the li's click event (activate list) 
            // from firing when we click the delete button.
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Are you sure you want to delete "${list.name}"?`)) {
                    activeListId = Store.deleteList(list.id);
                    renderLists();
                    renderActiveList();
                }
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            listsContainer.appendChild(li);
        });
    }

    /**
     * Renders the items for the currently active list
     */
    function renderActiveList() {
        const lists = Store.getLists();
        const activeList = lists.find(l => l.id === activeListId);

        if (!activeList) {
            // No list selected or all lists deleted
            currentListTitle.textContent = 'Select or create a list';
            addItemForm.classList.add('hidden');
            itemsContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = 'No list selected.';
            if (headerActions) headerActions.style.display = 'none';
            if (headerSpacer) headerSpacer.style.display = 'block';
            return;
        }

        currentListTitle.textContent = activeList.name;
        if (headerActions) headerActions.style.display = 'flex';
        if (headerSpacer) headerSpacer.style.display = 'none';
        addItemForm.classList.remove('hidden');
        
        const items = Store.getItems(activeListId);
        itemsContainer.innerHTML = '';

        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = 'No items here yet.';
        } else {
            emptyState.classList.add('hidden');
            
            // Educational Note: Event delegation could be used on itemsContainer, 
            // but attaching to individual elements is perfectly fine for small lists
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = `item-row ${item.completed ? 'completed' : ''}`;
                
                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'item-checkbox';
                checkbox.checked = item.completed;
                checkbox.addEventListener('change', () => {
                    Store.toggleItem(activeListId, item.id);
                    renderActiveList();
                });

                // Item Name
                const span = document.createElement('span');
                span.className = 'item-name';
                span.textContent = item.name;
                // Allow toggling by clicking text
                span.addEventListener('click', () => {
                    Store.toggleItem(activeListId, item.id);
                    renderActiveList();
                });

                // Edit Button
                const editBtn = document.createElement('button');
                editBtn.className = 'icon-btn';
                editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
                editBtn.setAttribute('aria-label', 'Edit item');
                editBtn.addEventListener('click', () => {
                    const newName = prompt('Rename item:', item.name);
                    if (newName !== null && newName.trim() !== '') {
                        Store.renameItem(activeListId, item.id, newName.trim());
                        renderActiveList();
                    }
                });

                // Delete Button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'icon-btn danger';
                deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 18L18 6M6 6l12 12"></path></svg>';
                deleteBtn.setAttribute('aria-label', 'Delete item');
                deleteBtn.addEventListener('click', () => {
                    Store.deleteItem(activeListId, item.id);
                    renderActiveList();
                });

                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(editBtn);
                li.appendChild(deleteBtn);
                itemsContainer.appendChild(li);
            });
        }
    }

    // === Event Listeners ===
    function setupEventListeners() {
        // Add new list
        addListForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent page reload
            const name = newListInput.value.trim();
            if (name) {
                activeListId = Store.addList(name);
                Store.setActiveListId(activeListId);
                newListInput.value = '';
                renderLists();
                renderActiveList();
            }
        });

        // Add new item
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!activeListId) return;
            
            const name = newItemInput.value.trim();
            if (name) {
                Store.addItem(activeListId, name);
                newItemInput.value = '';
                renderActiveList();
            }
        });

        // Header Actions Listeners
        if (renameListBtn) {
            renameListBtn.addEventListener('click', () => {
                const lists = Store.getLists();
                const activeList = lists.find(l => l.id === activeListId);
                if (activeList) {
                    const newName = prompt('Rename list:', activeList.name);
                    if (newName !== null && newName.trim() !== '') {
                        Store.renameList(activeListId, newName.trim());
                        renderLists();
                        renderActiveList();
                    }
                }
            });
        }

        if (copyListBtn) {
            copyListBtn.addEventListener('click', () => {
                const lists = Store.getLists();
                const activeList = lists.find(l => l.id === activeListId);
                if (activeList) {
                    const items = Store.getItems(activeListId);
                    let listText = activeList.name + '\n\n';
                    items.forEach(item => {
                        listText += (item.completed ? '[x] ' : '[ ] ') + item.name + '\n';
                    });
                    navigator.clipboard.writeText(listText).then(() => {
                        alert('List copied to clipboard!');
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy list.');
                    });
                }
            });
        }

        if (shareListBtn) {
            shareListBtn.addEventListener('click', async () => {
                const lists = Store.getLists();
                const activeList = lists.find(l => l.id === activeListId);
                if (activeList) {
                    const items = Store.getItems(activeListId);
                    let listText = activeList.name + '\n\n';
                    items.forEach(item => {
                        listText += (item.completed ? '[x] ' : '[ ] ') + item.name + '\n';
                    });
                    
                    if (navigator.share) {
                        try {
                            await navigator.share({
                                title: activeList.name,
                                text: listText,
                            });
                        } catch (err) {
                            console.error('Error sharing:', err);
                        }
                    } else {
                        // Fallback
                        navigator.clipboard.writeText(listText).then(() => {
                            alert('Share not supported on this browser. List copied to clipboard instead!');
                        });
                    }
                }
            });
        }

        // Mobile Sidebar Toggles
        menuBtn.addEventListener('click', openSidebar);
        closeSidebarBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }
});
