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
    const listActionsBtn = document.getElementById('list-actions-btn');
    const listActionsMenu = document.getElementById('list-actions-menu');
    const copyListsBtn = document.getElementById('copy-lists-btn');
    const shareListsBtn = document.getElementById('share-lists-btn');
    const exportListsBtn = document.getElementById('export-lists-btn');
    const importListsBtn = document.getElementById('import-lists-btn');
    const importFileInput = document.getElementById('import-file-input');

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
        close: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M6 18L18 6M6 6l12 12"></path></svg>',
        drag: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 8h16M4 16h16"></path></svg>'
    };

    // Backup files carry this number so a future format change can be detected.
    const BACKUP_VERSION = 1;

    // === Application State ===
    let activeListId = Store.getActiveListId();
    let deferredPrompt = null; // Saved "beforeinstallprompt" event, see setupPwaInstall()

    // === Initialization ===
    init();

    function init() {
        registerServiceWorker();
        setupPwaInstall();
        setupEventListeners();

        makeSortable(listsContainer, (oldIndex, newIndex) => {
            Store.reorderLists(oldIndex, newIndex);
            renderLists();
        });

        makeSortable(itemsContainer, (oldIndex, newIndex) => {
            Store.reorderItems(activeListId, oldIndex, newIndex);
            renderActiveList();
        });

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

            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = ICONS.drag;
            // Prevent list activation when dragging
            dragHandle.addEventListener('click', (e) => e.stopPropagation());

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

            li.appendChild(dragHandle);
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

            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = ICONS.drag;

            li.appendChild(dragHandle);
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
            version: BACKUP_VERSION,
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

    /** "1 list" / "3 lists", so the messages below read properly either way. */
    function countLists(total) {
        return total === 1 ? '1 list' : `${total} lists`;
    }

    /** True when a parsed file carries the marker fields our exports write. */
    function isBackupFile(parsed) {
        return Boolean(parsed) && parsed.app === 'shopping-list' && Array.isArray(parsed.lists);
    }

    /**
     * Rebuilds the lists from a backup field by field.
     *
     * Educational Note: the file comes from outside the app, so nothing in it is
     * trusted. Copying only the fields we expect - and dropping anything of the
     * wrong shape - means a hand-edited or unrelated JSON file cannot smuggle
     * unexpected data into localStorage.
     */
    function sanitizeLists(rawLists) {
        return rawLists
            .filter(list => list && typeof list.name === 'string' && Array.isArray(list.items))
            .map(list => ({
                name: list.name,
                items: list.items
                    .filter(item => item && typeof item.name === 'string')
                    .map(item => ({ name: item.name, completed: item.completed === true }))
            }));
    }

    /**
     * Reads a backup file the user picked and adds its lists to the ones already
     * stored. Existing lists are never touched - see Store.importLists().
     */
    async function importListsFromFile(file) {
        let parsed;
        try {
            parsed = JSON.parse(await file.text());
        } catch (error) {
            alert('That file could not be read. Pick a backup file exported from this app.');
            return;
        }

        if (!isBackupFile(parsed)) {
            alert('That file is not a Shopping List backup.');
            return;
        }
        if (parsed.version > BACKUP_VERSION) {
            alert('That backup was made by a newer version of this app, so it cannot be read here.');
            return;
        }

        const lists = sanitizeLists(parsed.lists);
        if (lists.length === 0) {
            alert('That backup does not contain any lists.');
            return;
        }

        const existingCount = Store.getLists().length;
        const question = existingCount > 0
            ? `Add ${countLists(lists.length)} to your existing ${countLists(existingCount)}? Nothing will be replaced.`
            : `Import ${countLists(lists.length)}?`;
        if (!confirm(question)) return;

        try {
            activeListId = Store.importLists(lists);
        } catch (error) {
            // localStorage is capped at a few megabytes per site. Nothing is saved
            // when it overflows, so the existing lists survive untouched.
            console.error('Import failed:', error);
            alert('There was not enough storage space to import these lists.');
            return;
        }

        render();
        alert(`Imported ${countLists(lists.length)}.`);
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

        // Sidebar menu holding the actions that cover every list at once
        listActionsBtn.addEventListener('click', (e) => {
            // Without this the document listener below would see the same click
            // and close the menu again the instant it opened.
            e.stopPropagation();
            if (isListActionsOpen()) closeListActions(); else openListActions();
        });

        // Clicking anywhere else, or pressing Escape, dismisses the menu
        document.addEventListener('click', (e) => {
            if (!listActionsMenu.contains(e.target)) closeListActions();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isListActionsOpen()) {
                closeListActions();
                listActionsBtn.focus(); // Return the keyboard to where the menu came from
            }
        });

        copyListsBtn.addEventListener('click', menuAction(() => {
            copyText(formatAllListsAsText(), 'All lists copied to clipboard!');
        }));
        shareListsBtn.addEventListener('click', menuAction(shareAllLists));
        exportListsBtn.addEventListener('click', menuAction(exportAllLists));

        // The styled menu item stands in for the file input, which stays hidden
        importListsBtn.addEventListener('click', menuAction(() => importFileInput.click()));
        importFileInput.addEventListener('change', async () => {
            const file = importFileInput.files[0];
            if (file) await importListsFromFile(file);
            // Clearing the value lets the same file be picked again later:
            // without this, re-selecting it fires no change event.
            importFileInput.value = '';
        });

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
        closeListActions(); // Never leave the menu hanging open behind the drawer
    }

    // === Whole-collection actions menu ===

    function isListActionsOpen() {
        return listActionsMenu.classList.contains('open');
    }

    function openListActions() {
        listActionsMenu.classList.add('open');
        // Screen readers announce the button as expanded, and the CSS turns the
        // chevron over, both driven by this one attribute.
        listActionsBtn.setAttribute('aria-expanded', 'true');
    }

    function closeListActions() {
        listActionsMenu.classList.remove('open');
        listActionsBtn.setAttribute('aria-expanded', 'false');
    }

    /**
     * Wraps a menu action so the menu always closes before it runs. Actions open
     * dialogs and share sheets, and leaving the menu behind them looks broken.
     */
    function menuAction(action) {
        return () => {
            closeListActions();
            action();
        };
    }

    // === Drag and Drop Utilities ===
    
    /**
     * Makes a list container sortable via drag and drop using pointer events.
     * Educational Note: We use pointer events (pointerdown, pointermove, pointerup) 
     * instead of native HTML5 drag-and-drop to ensure seamless support on both 
     * desktop (mouse) and mobile (touch) devices without any external libraries.
     */
    function makeSortable(container, onUpdate) {
        let draggingEle;
        let draggingEleIndex;
        let placeholder;
        let isDragging = false;
        let startY = 0;
        let initialTop = 0;
        
        container.addEventListener('pointerdown', function(e) {
            // Only allow left click / touch
            if (e.button !== 0 && e.pointerType === 'mouse') return; 
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            
            draggingEle = handle.closest('li');
            if (!draggingEle) return;
            
            e.preventDefault(); // Prevent text selection/scrolling
            
            draggingEleIndex = Array.from(container.children).indexOf(draggingEle);
            
            placeholder = document.createElement('li');
            placeholder.className = draggingEle.className + ' placeholder';
            placeholder.style.height = draggingEle.offsetHeight + 'px';
            
            isDragging = true;
            startY = e.clientY;
            
            const rect = draggingEle.getBoundingClientRect();
            initialTop = rect.top;
            
            draggingEle.style.width = rect.width + 'px';
            draggingEle.style.height = rect.height + 'px';
            draggingEle.style.position = 'fixed';
            draggingEle.style.top = initialTop + 'px';
            draggingEle.style.left = rect.left + 'px';
            draggingEle.classList.add('dragging');
            
            container.insertBefore(placeholder, draggingEle.nextSibling);
            
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerUp);
        });
        
        function onPointerMove(e) {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scroll on touch devices during drag
            
            const dy = e.clientY - startY;
            draggingEle.style.top = (initialTop + dy) + 'px';
            
            // Find which item we are hovering over
            const rect = draggingEle.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Temporarily hide dragging element to get the element underneath
            draggingEle.style.display = 'none';
            const elementBelow = document.elementFromPoint(x, y);
            draggingEle.style.display = '';
            
            if (!elementBelow) return;
            
            const droppableBelow = elementBelow.closest('li:not(.dragging):not(.placeholder)');
            
            if (droppableBelow && droppableBelow.parentNode === container) {
                const rectBelow = droppableBelow.getBoundingClientRect();
                const isAbove = y < rectBelow.top + rectBelow.height / 2;
                
                if (isAbove) {
                    container.insertBefore(placeholder, droppableBelow);
                } else {
                    container.insertBefore(placeholder, droppableBelow.nextSibling);
                }
            }
        }
        
        function onPointerUp(e) {
            if (!isDragging) return;
            isDragging = false;
            
            // Reset styles
            draggingEle.style.position = '';
            draggingEle.style.top = '';
            draggingEle.style.left = '';
            draggingEle.style.width = '';
            draggingEle.style.height = '';
            draggingEle.classList.remove('dragging');
            
            // Swap with placeholder
            container.insertBefore(draggingEle, placeholder);
            container.removeChild(placeholder);
            
            const newIndex = Array.from(container.children).indexOf(draggingEle);
            
            // Clean up event listeners
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointercancel', onPointerUp);
            
            // Trigger update if index changed
            if (newIndex !== draggingEleIndex && onUpdate) {
                onUpdate(draggingEleIndex, newIndex);
            }
        }
    }
});
