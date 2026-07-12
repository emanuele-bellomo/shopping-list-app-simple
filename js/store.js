/**
 * store.js - Handles all data persistence exclusively through localStorage.
 * 
 * Educational Note: This module abstracts localStorage interaction so the main app
 * doesn't need to know *how* data is stored, just *what* to store.
 * We use JSON.stringify() to convert JS objects to strings for localStorage,
 * and JSON.parse() to convert strings back into JS objects when retrieving.
 */

const Store = (function() {
    const STORAGE_KEY = 'shopping_list_data';

    // Default structure if localStorage is empty
    const defaultData = {
        lists: [
            { id: 'list_1', name: 'Groceries', items: [] }
        ],
        activeListId: 'list_1'
    };

    /**
     * Fetch all data from localStorage
     */
    function getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return defaultData;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
            return defaultData;
        }
    }

    /**
     * Save full data object to localStorage
     */
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // --- Public API ---

    return {
        /**
         * Get all lists
         */
        getLists: function() {
            return getData().lists;
        },

        /**
         * Get the ID of the currently active list
         */
        getActiveListId: function() {
            return getData().activeListId;
        },

        /**
         * Set the active list ID
         */
        setActiveListId: function(id) {
            const data = getData();
            data.activeListId = id;
            saveData(data);
        },

        /**
         * Add a new list
         * @param {string} name - The name of the list
         * @returns {string} The new list's ID
         */
        addList: function(name) {
            const data = getData();
            const id = 'list_' + Date.now();
            data.lists.push({ id, name, items: [] });
            saveData(data);
            return id;
        },

        /**
         * Delete a list by ID
         */
        deleteList: function(id) {
            const data = getData();
            data.lists = data.lists.filter(list => list.id !== id);
            
            // If we deleted the active list, set active to the first available, or null
            if (data.activeListId === id) {
                data.activeListId = data.lists.length > 0 ? data.lists[0].id : null;
            }
            saveData(data);
            return data.activeListId;
        },

        /**
         * Get all items for a specific list
         */
        getItems: function(listId) {
            const data = getData();
            const list = data.lists.find(l => l.id === listId);
            return list ? list.items : [];
        },

        /**
         * Add an item to a list
         */
        addItem: function(listId, itemName) {
            const data = getData();
            const list = data.lists.find(l => l.id === listId);
            if (list) {
                const item = {
                    id: 'item_' + Date.now(),
                    name: itemName,
                    completed: false
                };
                list.items.push(item);
                saveData(data);
            }
        },

        /**
         * Toggle completion status of an item
         */
        toggleItem: function(listId, itemId) {
            const data = getData();
            const list = data.lists.find(l => l.id === listId);
            if (list) {
                const item = list.items.find(i => i.id === itemId);
                if (item) {
                    item.completed = !item.completed;
                    saveData(data);
                }
            }
        },

        /**
         * Delete an item from a list
         */
        deleteItem: function(listId, itemId) {
            const data = getData();
            const list = data.lists.find(l => l.id === listId);
            if (list) {
                list.items = list.items.filter(i => i.id !== itemId);
                saveData(data);
            }
        }
    };
})();
