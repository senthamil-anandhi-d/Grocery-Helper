// Global State
let comparisonItems = JSON.parse(sessionStorage.getItem('grocery_comparison')) || [];
let billItems = JSON.parse(sessionStorage.getItem('grocery_bill')) || [];

function saveSession() {
    sessionStorage.setItem('grocery_comparison', JSON.stringify(comparisonItems));
    sessionStorage.setItem('grocery_bill', JSON.stringify(billItems));
}

// DOM Elements - Comparison
const compareForm = document.getElementById('compare-form');
const comparisonList = document.getElementById('comparison-list');
const clearBtn = document.getElementById('clear-comparison');
const pNameInput = document.getElementById('p-name');
const pPriceInput = document.getElementById('p-price');
const pWeightInput = document.getElementById('p-weight');
const pUnitSelect = document.getElementById('p-unit');

// DOM Elements - Calculator
const calcResult = document.getElementById('calc-result');
const calcExpression = document.getElementById('calc-expression');
const calcBtns = document.querySelectorAll('.calc-btn');

// --- Comparison Logic ---

compareForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = pNameInput.value;
    const price = parseFloat(pPriceInput.value);
    const weight = parseFloat(pWeightInput.value);
    const unit = pUnitSelect.value;

    // Calculate normalized unit price (per 100 base units for better readability)
    // Grams/ML -> Price per 1KG/1L
    let factor = 1;
    if (unit === 'g' || unit === 'ml') {
        factor = 1000;
    } else if (unit === 'kg' || unit === 'l' || unit === 'unit') {
        factor = 1;
    }

    const unitPrice = (price / weight) * (unit === 'g' || unit === 'ml' ? 100 : 1); // Price per 100g/ml
    const displayUnitPrice = (price / weight) * factor; // Price per Kg/L/Unit

    const item = {
        id: Date.now(),
        name,
        price,
        weight,
        unit,
        unitPrice: (price / weight), // Pure unit price for comparison
        displayUnitPrice: displayUnitPrice.toFixed(2),
        displayUnit: factor === 1000 ? (unit === 'g' ? 'kg' : 'L') : unit
    };

    comparisonItems.push(item);
    saveSession();
    updateComparisonUI();
    compareForm.reset();
    pNameInput.focus();
});

clearBtn.addEventListener('click', () => {
    comparisonItems = [];
    saveSession();
    updateComparisonUI();
});

function updateComparisonUI() {
    if (comparisonItems.length === 0) {
        comparisonList.innerHTML = '<div class="empty-state"><p>No items added yet. Let\'s compare!</p></div>';
        return;
    }

    // Find the best value (lowest unit price)
    const minUnitPrice = Math.min(...comparisonItems.map(item => item.unitPrice));

    comparisonList.innerHTML = '';
    
    // Sort items by unit price (lowest first)
    const sortedItems = [...comparisonItems].sort((a, b) => a.unitPrice - b.unitPrice);

    sortedItems.forEach(item => {
        const isBestValue = item.unitPrice === minUnitPrice && comparisonItems.length > 1;
        
        const li = document.createElement('li');
        li.className = `compare-item ${isBestValue ? 'best-value' : ''}`;
        
        li.innerHTML = `
            <div class="info">
                <span class="name">${item.name}</span>
                <span class="details">₹ ${item.price.toFixed(2)} | ${item.weight}${item.unit}</span>
            </div>
            <div class="price-info">
                <span class="unit-price">₹ ${item.displayUnitPrice}</span>
                <span class="unit-label">per ${item.displayUnit}</span>
            </div>
        `;
        
        comparisonList.appendChild(li);
    });
}

// --- Bill Calculator Logic ---

const billForm = document.getElementById('bill-form');
const billList = document.getElementById('bill-list');
const billTotal = document.getElementById('bill-total');
const clearBillBtn = document.getElementById('clear-bill');

billForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('b-name').value;
    const price = parseFloat(document.getElementById('b-price').value);
    const qty = parseInt(document.getElementById('b-qty').value);
    
    const item = {
        id: Date.now(),
        name,
        price,
        qty,
        subtotal: price * qty
    };
    
    billItems.push(item);
    saveSession();
    updateBillUI();
    billForm.reset();
    document.getElementById('b-name').focus();
});

clearBillBtn.addEventListener('click', () => {
    billItems = [];
    saveSession();
    updateBillUI();
});

function updateBillUI() {
    if (billItems.length === 0) {
        billList.innerHTML = '<div class="empty-state"><p>No items in bill. Add something!</p></div>';
        billTotal.textContent = '₹ 0.00';
        return;
    }
    
    billList.innerHTML = '';
    let grandTotal = 0;
    
    billItems.forEach(item => {
        grandTotal += item.subtotal;
        
        const li = document.createElement('li');
        li.className = 'bill-item';
        li.innerHTML = `
            <span class="bill-name">${item.name}</span>
            <span class="qty-x">${item.qty} × ₹${item.price.toFixed(0)}</span>
            <span class="subtotal">₹ ${item.subtotal.toFixed(2)}</span>
            <button class="remove-bill-item" onclick="removeBillItem(${item.id})">×</button>
        `;
        billList.appendChild(li);
    });
    
    billTotal.textContent = `₹ ${grandTotal.toFixed(2)}`;
}

window.removeBillItem = function(id) {
    billItems = billItems.filter(item => item.id !== id);
    saveSession();
    updateBillUI();
};

// Initial Render
updateComparisonUI();
updateBillUI();

// Simple ripple effect for primary button
document.querySelectorAll('.primary-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        const ripple = btn.querySelector('.btn-ripple');
        if (!ripple) return;
        
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
    });
});
