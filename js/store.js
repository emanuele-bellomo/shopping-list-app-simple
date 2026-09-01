/**
 * store.js - Handles all data persistence exclusively through localStorage.
 *
 * Educational Note: This module abstracts localStorage interaction so the main app
 * doesn't need to know *how* data is stored, just *what* to store.
 * localStorage can only hold strings, so we use JSON.stringify() on the way in and
 * JSON.parse() on the way out to move whole JavaScript objects in and out of it.
 */

const Store = (function () {
    const STORAGE_KEY = 'shopping_list_data';

    /**
     * Builds the starting data for a browser that has never opened the app.
     *
     * Educational Note: this is a *function* rather than a plain shared object on
     * purpose. If every empty read returned the same object, the first addList()
     * would push into that shared template and quietly corrupt the defaults for
     * the rest of the page's life. Returning a fresh object each time avoids it.
     */
    function createDefaultData() {
        return {
            lists: [
                { id: 'list_1', name: 'Groceries', items: [] }
            ],
            activeListId: 'list_1'
        };
    }

    function getData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return createDefaultData();
        }
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error('Error parsing localStorage data:', error);
            return createDefaultData();
        }
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    /** Nearly every operation below starts by locating one list inside the data. */
    function findList(data, listId) {
        return data.lists.find(list => list.id === listId);
    }

    /**
     * Educational Note: Date.now() alone is not unique enough here - adding two
     * items quickly enough lands them in the same millisecond and produces
     * duplicate ids, which then makes edits and deletes hit the wrong row.
     * A short random suffix makes a collision effectively impossible.
     */
    function createId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    // --- Public API ---

    return {
        getLists() {
            return getData().lists;
        },

        getList(listId) {
            return findList(getData(), listId) || null;
        },

        getActiveListId() {
            return getData().activeListId;
        },

        setActiveListId(listId) {
            const data = getData();
            data.activeListId = listId;
            saveData(data);
        },

        /**
         * @param {string} name - The name of the new list
         * @returns {string} The new list's ID, so the caller can activate it
         */
        addList(name) {
            const data = getData();
            const id = createId('list');
            data.lists.push({ id, name, items: [] });
            saveData(data);
            return id;
        },

        renameList(listId, newName) {
            const data = getData();
            const list = findList(data, listId);
            if (list) {
                list.name = newName;
                saveData(data);
            }
        },

        /**
         * @returns {string|null} The ID that should now be active - deleting the
         * active list falls back to the first remaining one, or null if none are left.
         */
        deleteList(listId) {
            const data = getData();
            data.lists = data.lists.filter(list => list.id !== listId);

            if (data.activeListId === listId) {
                data.activeListId = data.lists.length > 0 ? data.lists[0].id : null;
            }
            saveData(data);
            return data.activeListId;
        },

        addItem(listId, itemName) {
            const data = getData();
            const list = findList(data, listId);
            if (list) {
                list.items.push({ id: createId('item'), name: itemName, completed: false });
                saveData(data);
            }
        },

        renameItem(listId, itemId, newName) {
            const data = getData();
            const item = findList(data, listId)?.items.find(i => i.id === itemId);
            if (item) {
                item.name = newName;
                saveData(data);
            }
        },

        toggleItem(listId, itemId) {
            const data = getData();
            const item = findList(data, listId)?.items.find(i => i.id === itemId);
            if (item) {
                item.completed = !item.completed;
                saveData(data);
            }
        },

        deleteItem(listId, itemId) {
            const data = getData();
            const list = findList(data, listId);
            if (list) {
                list.items = list.items.filter(item => item.id !== itemId);
                saveData(data);
            }
        }
    };
})();
