// ========== Define Data Model ==========
interface InventoryItem {
    id: string;          // unique
    name: string;
    category: string;
    quantity: number;
    price: number;
    supplier: string;
    stockStatus: 'in stock' | 'Low inventory' | 'out of stock';
    hotItem: 'Yes' | 'No';
    comments: string;
}

// ========== Global State ==========
let inventory: InventoryItem[] = [
    {
        id: "P1001",
        name: "iPhone 15",
        category: "electronic products",
        quantity: 25,
        price: 6999,
        supplier: "Apple Inc.",
        stockStatus: "in stock",
        hotItem: "Yes",
        comments: "Hot selling flagship"
    },
    {
        id: "P1002",
        name: "Office Chair",
        category: "furniture",
        quantity: 3,
        price: 899,
        supplier: "IKEA",
        stockStatus: "Low inventory",
        hotItem: "No",
        comments: "Ergonomic"
    }
];

let editMode: boolean = false;
let editingId: string | null = null;

// DOM elements
const form = document.getElementById('productForm') as HTMLFormElement;
const idInput = document.getElementById('id') as HTMLInputElement;
const nameInput = document.getElementById('name') as HTMLInputElement;
const categorySelect = document.getElementById('category') as HTMLSelectElement;
const quantityInput = document.getElementById('quantity') as HTMLInputElement;
const priceInput = document.getElementById('price') as HTMLInputElement;
const supplierInput = document.getElementById('supplier') as HTMLInputElement;
const stockStatusSelect = document.getElementById('stockStatus') as HTMLSelectElement;
const hotItemSelect = document.getElementById('hotItem') as HTMLSelectElement;
const commentsTextarea = document.getElementById('comments') as HTMLTextAreaElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const cancelEditBtn = document.getElementById('cancelEditBtn') as HTMLButtonElement;
const formTitle = document.getElementById('formTitle') as HTMLHeadingElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const resetSearchBtn = document.getElementById('resetSearchBtn') as HTMLButtonElement;
const showHotBtn = document.getElementById('showHotBtn') as HTMLButtonElement;
const messageArea = document.getElementById('messageArea') as HTMLDivElement;
const productListContainer = document.getElementById('productListContainer') as HTMLDivElement;

// ========== Helper Functions ==========
function showMessage(msg: string, isError: boolean = false): void {
    messageArea.textContent = msg;
    messageArea.style.backgroundColor = isError ? '#fee2e2' : '#e0f2fe';
    messageArea.style.borderLeftColor = isError ? '#dc2626' : '#0284c7';
    setTimeout(() => {
        if (messageArea.textContent === msg) {
            messageArea.textContent = '';
        }
    }, 3000);
}

function isIdUnique(id: string, excludeId?: string): boolean {
    return !inventory.some(item => item.id === id && (!excludeId || item.id !== excludeId));
}

function escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Render product list
function renderInventory(items: InventoryItem[] = inventory): void {
    if (items.length === 0) {
        productListContainer.innerHTML = '<div class="card" style="text-align:center;">No product data available</div>';
        return;
    }
    productListContainer.innerHTML = items.map(item => `
        <div class="card" data-id="${item.id}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>${escapeHtml(item.name)}</h3>
                ${item.hotItem === 'Yes' ? '<span class="badge-hot">🔥 Hot</span>' : ''}
            </div>
            <div class="id">ID: ${escapeHtml(item.id)}</div>
            <p>📂 Category: ${escapeHtml(item.category)} | 📦 Quantity: ${item.quantity}</p>
            <p>💰 Price: ¥${item.price.toFixed(2)} | 🏭 Supplier: ${escapeHtml(item.supplier)}</p>
            <p>📊 Stock Status: ${item.stockStatus} | 💬 Comments: ${escapeHtml(item.comments) || 'None'}</p>
            <div class="card-actions">
                <button class="edit-btn" data-id="${item.id}">✏️ Edit</button>
                <button class="delete-btn" data-id="${item.id}">🗑️ Delete</button>
            </div>
        </div>
    `).join('');

    // Bind edit and delete events
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
            startEdit(id);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).getAttribute('data-id')!;
            deleteProductById(id);
        });
    });
}

// Save (add or update)
function saveProduct(event: Event): void {
    event.preventDefault();
    const id = idInput.value.trim();
    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const quantity = parseInt(quantityInput.value);
    const price = parseFloat(priceInput.value);
    const supplier = supplierInput.value.trim();
    const stockStatus = stockStatusSelect.value as 'in stock' | 'Low inventory' | 'out of stock';
    const hotItem = hotItemSelect.value as 'Yes' | 'No';
    const comments = commentsTextarea.value.trim();

    // Validation
    if (!id || !name || !supplier) {
        showMessage('Please fill in all fields marked with *', true);
        return;
    }
    if (isNaN(quantity) || quantity < 0) {
        showMessage('Quantity must be a number ≥ 0', true);
        return;
    }
    if (isNaN(price) || price < 0) {
        showMessage('Price must be a number ≥ 0', true);
        return;
    }
    if (!isIdUnique(id, editMode ? editingId! : undefined)) {
        showMessage(`Product ID ${id} already exists, please use a unique ID`, true);
        return;
    }

    const newItem: InventoryItem = { id, name, category, quantity, price, supplier, stockStatus, hotItem, comments };

    if (editMode && editingId) {
        // Update
        const index = inventory.findIndex(item => item.id === editingId);
        if (index !== -1) {
            inventory[index] = newItem;
            showMessage(`Product "${name}" updated successfully`);
        }
        resetForm();
    } else {
        // Add
        inventory.push(newItem);
        showMessage(`Product "${name}" added successfully`);
        resetForm();
    }
    renderInventory();
}

// Start edit
function startEdit(id: string): void {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    editMode = true;
    editingId = id;
    formTitle.textContent = '✏️ Edit Product';
    submitBtn.textContent = 'Update Product';
    cancelEditBtn.style.display = 'inline-block';

    idInput.value = item.id;
    nameInput.value = item.name;
    categorySelect.value = item.category;
    quantityInput.value = item.quantity.toString();
    priceInput.value = item.price.toString();
    supplierInput.value = item.supplier;
    stockStatusSelect.value = item.stockStatus;
    hotItemSelect.value = item.hotItem;
    commentsTextarea.value = item.comments;
    idInput.disabled = true;  // ID cannot be changed during edit
}

// Reset form
function resetForm(): void {
    editMode = false;
    editingId = null;
    formTitle.textContent = '➕ Add Product';
    submitBtn.textContent = 'Add Product';
    cancelEditBtn.style.display = 'none';
    form.reset();
    idInput.disabled = false;
    // Set default values
    quantityInput.value = '0';
    priceInput.value = '0';
}

// Delete product (with confirmation)
function deleteProductById(id: string): void {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    const confirmDelete = confirm(`Are you sure you want to delete product "${item.name}"?`);
    if (confirmDelete) {
        inventory = inventory.filter(p => p.id !== id);
        renderInventory();
        showMessage(`Product "${item.name}" has been deleted`);
        if (editMode && editingId === id) resetForm();
    }
}

// Search function (by name)
function searchProducts(): void {
    const keyword = searchInput.value.trim().toLowerCase();
    if (keyword === '') {
        renderInventory();
        return;
    }
    const filtered = inventory.filter(item => item.name.toLowerCase().includes(keyword));
    renderInventory(filtered);
    showMessage(`Found ${filtered.length} matching product(s)`);
}

// Show hot items
function showHotItems(): void {
    const hot = inventory.filter(item => item.hotItem === 'Yes');
    renderInventory(hot);
    showMessage(`🔥 Total ${hot.length} hot product(s)`);
}

// ========== Event Binding ==========
form.addEventListener('submit', saveProduct);
cancelEditBtn.addEventListener('click', resetForm);
searchBtn.addEventListener('click', searchProducts);
resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderInventory();
    showMessage('Showing all products');
});
showHotBtn.addEventListener('click', showHotItems);

// Initial render
renderInventory();