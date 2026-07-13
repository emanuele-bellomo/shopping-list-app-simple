1. Make app ✔
2. Host it on GitHub Pages ✔
3. Add shared lists through invite links
   - *Note: To implement this feature while keeping the app entirely client-side, I could serialize the list data (converting it to a JSON string and encoding it to Base64) and attach it to the app's URL as a query parameter or fragment. When someone opens the link, the app checks the URL, decodes the data, and prompts to import it into their local `localStorage`.*
4. Add "share list" and "Copy list" function ✔
5. add rename list and element function ✔
6. add Italian language and language detection
   - *Note: To implement this feature without frameworks, I could create a simple translation dictionary object mapping keys to English and Italian strings. I would use `navigator.language` to detect the user's browser language on load and default to Italian if it detects "it". Then, I'd apply translations dynamically by updating the `textContent` of elements based on custom `data-i18n` attributes.*
7. Wrap it with PWABuilder

Bugs found:
- (FIXED) When a user has multiple lists they can only switch from list to list by clicking the list's name, when they should be able to switch by clicking on the whole list tab to avoid confusion.

