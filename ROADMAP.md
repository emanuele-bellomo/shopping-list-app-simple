## Feature ideas
- [x] "Export all my lists" button
- [x] "Import lists" button 
- [ ] Add iOS device detection for installation UX
- [ ] Add shared lists through invite links
   *Note: To implement this feature while keeping the app entirely client-side, I could serialize the list data (converting it to a JSON string and encoding it to Base64) and attach it to the app's URL as a query parameter or fragment. When someone opens the link, the app checks the URL, decodes the data, and prompts to import it into their local `localStorage`.*
- [ ] add Italian language and language detection
   *Note: To implement this feature without frameworks, I could create a simple translation dictionary object mapping keys to English and Italian strings. I would use `navigator.language` to detect the user's browser language on load and default to Italian if it detects "it". Then, I'd apply translations dynamically by updating the `textContent` of elements based on custom `data-i18n` attributes.*
- [ ] wrap it with PWABuilder and put it on app stores

## Bugs


## Current user list (no email list yet):
- Silvia Preziosa
- Anna Nitti
- Mamma
- Nonna


