![[Pasted image 20240424135452.png]]
# Cookies
Cookies are key-value pairs with additional properties such as expiration date. Cookies are stored in a single SQLite table. You can easily find this file in `about:profiles`.

They were a thing before sessionStorage or localStorage. Then, cookies were plain text files (or, in some browsers, single plain text file). So for some time they were the only way to store key-value data on client side. However, they have one major flaw: cookies are **sent with every request.** 

As you can imagine, this is pretty stupid performance-wise for general client side storage. So it was decided to separate Cookies and Storage.

Now, Cookies have a bunch of additional properties: expiry, lastAccessed, creationTime, isHttpOnly etc. By the way, the last one prevents Javascript from reading this cookie value. It can save you from malicious extension that could otherwise steal your session auth token, for example.
# sessionStorage and localStorage
**Web Storage API** in browsers implements two storage options: `sessionStorage` and `localStorage`. They both are key-value stores.

`sessionStorage`  maintains a separate storage area for each given **origin** that's available for the duration of page session.

`localStorage` does the same thing, but persists when the browser is closed.

**Origin** is scheme + domain + port. So 'http:/\/google.com' and 'https:\//google.com' will have different storage areas.

> Important! Both `sessionStorage` and `localStorage` in Web Storage are synchronous in nature. Every operation is blocking.
# IndexedDB
`IndexedDB` is a **transactional object-oriented database**. So it has no tables, just key-value store of javascript objects. It is also not relational, so any kind of relationships between objects will not be enforced.

As you can imagine already, it **does not support SQL**. The way you usually query is just iterating over cursor.
``` js
const request = window.indexedDB.open("database", 1);

request.onsuccess = () => {  
    const db = request.result;  
    const transaction = db.transaction(['invoices'], 'readwrite');  
    const invStore = transaction.objectStore('invoices');  
    const cursorRequest = invStore.openCursor();
    
    cursorRequest.onsuccess = e => {  
        const cursor = e.target.result;  
        if (cursor) {  
            if (cursor.value.vendor === 'GE') {  
                const invoice = cursor.value;  
                invoice.vendor = 'P&GE';  
                const updateRequest = cursor.update(invoice);  
            }  
            cursor.continue();  
        }  
    }  
};
```

Another, albeit less important, limitation is full-text search. It has none.

Good news, it is mostly **asynchronous**. So when you outgrow localStorage, this is where you go.

**Gets are blazing fast** in IndexedDB. The issue with IDB at scale is typically writes.

Fun fact: chess.com uses IndexedDB to store openings for both performance reasons and offline capabilities (I guess). 
Even better example is devdocs.io that allows searching documentation offline.

# Sources
1. Web Storage API https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
2. IndexedDB https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology
3. Firefox source code https://searchfox.org/mozilla-central/source/dom/storage/LocalStorageCache.h#74
4. IndexedDB Access Speed and Efficiency - https://stackoverflow.com/questions/22577199/indexeddb-access-speed-and-efficiency
5. Browse docs offline with the power of IndexedDB - https://devdocs.io/offline