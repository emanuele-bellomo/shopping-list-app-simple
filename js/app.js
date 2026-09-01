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
    const copyListsBtn = document.getElementById('copy-lists-btn');
    const shareListsBtn = document.getElementById('share-lists-btn');
    const exportListsBtn = document.getElementById('export-lists-btn');

    // Items
    const currentListTitle = document.getElementById('current-list-title');
    const addItemForm = document.getElementById('add-item-form');
    const newItemInput = document.getElementById('new-item-input');
    const itemsContainer = document.getElementById('items-container');
    const emptyState = document.getElementById('empty-state');
    const emptyStateTitle = document.getElementById('empty-state-title');
    const emptyStateHint = document.getElementById('empty-state-hint');

    // Header Actions
    const headerActions = document.getElementById('header-actions');
    const headerSpacer = document.getElementById('header-spacer');
    const renameListBtn = document.getElementById('rename-list-btn');
    const copyListBtn = document.getElementById('copy-list-btn');
    const shareListBtn = document.getElementById('share-list-btn');

    // Install Banner
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const closeBannerBtn = document.getElementById('close-banner-btn');

    /**
     * SVG markup for the buttons we build in JavaScript. Kept here so the icons
     * live in one place instead of being pasted inline inside render functions.
     */
    const ICONS = {
        trash: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>',
        edit: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        close: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 18L18 6M6 6l12 12"></path></svg>'
    };

    // === Application State ===
    let activeListId = Store.getActiveListId();
    let deferredPrompt = null; // Saved "beforeinstallprompt" event, see setupPwaInstall()

    // === Initialization ===
    init();

    function init() {
        registerServiceWorker();
        setupPwaInstall();
        setupEventListeners();
        render();
    }

    /** Redraws both panes. Every mutation ends with a call to this. */
    function render() {
        renderLists();
        renderActiveList();
    }

    /**
     * Service Worker Registration for PWA offline capabilities
     */
    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .catch(error => console.error('SW registration failed:', error));
        });
    }

    /**
     * Handles PWA Install Banner Logic
     */
    function setupPwaInstall() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the browser from showing its own mini-infobar, then stash the
            // event so we can trigger the prompt from our own button instead.
            e.preventDefault();
            deferredPrompt = e;
            installBanner.classList.add('visible');
        });

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            // The stashed event is single-use, so drop it either way.
            deferredPrompt = null;
            installBanner.classList.remove('visible');
        });

        closeBannerBtn.addEventListener('click', () => {
            installBanner.classList.remove('visible');
        });

        window.addEventListener('appinstalled', () => {
            installBanner.classList.remove('visible');
            deferredPrompt = null;
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
            li.classList.toggle('active', list.id === activeListId);

            const span = document.createElement('span');
            span.className = 'list-name';
            span.textContent = list.name;

            // Click to activate list
            li.addEventListener('click', () => {
                activeListId = list.id;
                Store.setActiveListId(activeListId);
                render();
                closeSidebar(); // Close on mobile after selection
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn danger';
            deleteBtn.innerHTML = ICONS.trash;
            deleteBtn.setAttribute('aria-label', 'Delete list');

            // Educational Note: stopPropagation prevents the li's click event (activate list)
            // from firing when we click the delete button.
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
                    activeListId = Store.deleteList(list.id);
                    render();
                }
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            listsContainer.appendChild(li);
        });

        // Nothing to copy, share or export until at least one list exists.
        const hasLists = lists.length > 0;
        copyListsBtn.disabled = !hasLists;
        shareListsBtn.disabled = !hasLists;
        exportListsBtn.disabled = !hasLists;
    }

    /**
     * Renders the items for the currently active list
     */
    function renderActiveList() {
        const activeList = Store.getList(activeListId);
        itemsContainer.innerHTML = '';

        // Show the title, the add-item form and the per-list actions only when a
        // list is actually selected. The spacer takes the actions' place so the
        // centred title stays centred.
        headerActions.classList.toggle('hidden', !activeList);
        headerSpacer.classList.toggle('hidden', Boolean(activeList));
        addItemForm.classList.toggle('hidden', !activeList);

        if (!activeList) {
            currentListTitle.textContent = 'Select or create a list';
            showEmptyState('No list selected.', 'Create a list from the menu to get started!');
            return;
        }

        currentListTitle.textContent = activeList.name;

        if (activeList.items.length === 0) {
            showEmptyState('No items here yet.', 'Add some items to get started!');
            return;
        }

        emptyState.classList.add('hidden');

        // Educational Note: Event delegation could be used on itemsContainer,
        // but attaching to individual elements is perfectly fine for small lists
        activeList.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'item-row';
            li.classList.toggle('completed', item.completed);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'item-checkbox';
            checkbox.checked = item.completed;
            checkbox.addEventListener('change', () => toggleItem(item.id));

            const span = document.createElement('span');
            span.className = 'item-name';
            span.textContent = item.name;
            // Tapping the text is an easier target than the checkbox on mobile
            span.addEventListener('click', () => toggleItem(item.id));

            const editBtn = document.createElement('button');
            editBtn.className = 'icon-btn';
            editBtn.innerHTML = ICONS.edit;
            editBtn.setAttribute('aria-label', 'Edit item');
            editBtn.addEventListener('click', () => {
                const newName = promptForName('Rename item:', item.name);
                if (newName) {
                    Store.renameItem(activeListId, item.id, newName);
                    renderActiveList();
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn danger';
            deleteBtn.innerHTML = ICONS.close;
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

    function showEmptyState(title, hint) {
        emptyStateTitle.textContent = title;
        emptyStateHint.textContent = hint;
        emptyState.classList.remove('hidden');
    }

    function toggleItem(itemId) {
        Store.toggleItem(activeListId, itemId);
        renderActiveList();
    }

    /** Wraps window.prompt and returns a trimmed name, or null if cancelled/blank. */
    function promptForName(message, currentValue) {
        const answer = prompt(message, currentValue);
        if (answer === null) return null; // User pressed Cancel
        const trimmed = answer.trim();
        return trimmed === '' ? null : trimmed;
    }

    // === Sharing & Export ===

    /**
     * Turns one list into a plain bulleted block, ready to paste anywhere:
     *
     *   Groceries
     *   - Milk
     *   - Bread
     *
     * Completed items are not marked - this is the shopping list as you would
     * write it out for someone else, not a record of what you already ticked off.
     */
    function formatListAsText(list) {
        // An explicit marker beats trailing blank lines when several lists are
        // sent together and one of them happens to be empty.
        const body = list.items.length > 0
            ? list.items.map(item => `- ${item.name}`).join('\n')
            : '- (empty)';
        return `${list.name}\n${body}\n`;
    }

    /** All the lists as one block of text, separated by a blank line. */
    function formatAllListsAsText() {
        return Store.getLists().map(formatListAsText).join('\n');
    }

    /**
     * Shares text through the native share sheet when the browser supports it,
     * and falls back to the clipboard (typically on desktop) when it doesn't.
     */
    async function shareText(title, text) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
            } catch (error) {
                // A user dismissing the share sheet throws AbortError - not a failure.
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
            return;
        }

        await copyText(text, 'Share not supported on this browser. Copied to clipboard instead!');
    }

    async function copyText(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            alert(successMessage);
        } catch (error) {
            console.error('Could not copy text:', error);
            alert('Failed to copy.');
        }
    }

    /**
     * Hands the browser an in-memory file to save.
     *
     * Educational Note: a Blob is a chunk of raw data, and URL.createObjectURL()
     * gives it a temporary local URL. Pointing a hidden <a download> at that URL
     * and clicking it triggers a normal file download with no server involved.
     * The URL keeps the Blob alive in memory until it is revoked, and revoking it
     * in the same tick can cut the download off before the browser has read it -
     * so we release it on the next tick instead.
     */
    function downloadFile(filename, contents, mimeType) {
        const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    /**
     * Saves every list as a dated JSON backup file. The wrapper fields around the
     * lists (app/version/exportedAt) let a future import check that it is looking
     * at a file from this app before trusting its contents.
     */
    function exportAllLists() {
        const exportedAt = new Date().toISOString();
        const backup = {
            app: 'shopping-list',
            version: 1,
            exportedAt,
            lists: Store.getLists()
        };
        downloadFile(
            `shopping-lists-${exportedAt.slice(0, 10)}.json`, // e.g. shopping-lists-2026-09-01.json
            JSON.stringify(backup, null, 2), // `null, 2` indents the file so a human can read it
            'application/json'
        );
    }

    /** Shares every list at once as one readable block of plain text. */
    function shareAllLists() {
        return shareText('My Shopping Lists', formatAllListsAsText());
    }

    // === Event Listeners ===
    function setupEventListeners() {
        // Add new list
        addListForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent page reload
            const name = newListInput.value.trim();
            if (!name) return;

            activeListId = Store.addList(name);
            Store.setActiveListId(activeListId);
            newListInput.value = '';
            render();
        });

        // Add new item
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = newItemInput.value.trim();
            if (!activeListId || !name) return;

            Store.addItem(activeListId, name);
            newItemInput.value = '';
            renderActiveList();
        });

        // Header actions, all operating on the active list
        renameListBtn.addEventListener('click', () => {
            const activeList = Store.getList(activeListId);
            if (!activeList) return;

            const newName = promptForName('Rename list:', activeList.name);
            if (newName) {
                Store.renameList(activeListId, newName);
                render();
            }
        });

        copyListBtn.addEventListener('click', () => {
            const activeList = Store.getList(activeListId);
            if (activeList) {
                copyText(formatListAsText(activeList), 'List copied to clipboard!');
            }
        });

        shareListBtn.addEventListener('click', () => {
            const activeList = Store.getList(activeListId);
            if (activeList) {
                shareText(activeList.name, formatListAsText(activeList));
            }
        });

        // Sidebar actions covering every list at once
        copyListsBtn.addEventListener('click', () => {
            copyText(formatAllListsAsText(), 'All lists copied to clipboard!');
        });
        shareListsBtn.addEventListener('click', shareAllLists);
        exportListsBtn.addEventListener('click', exportAllLists);

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
