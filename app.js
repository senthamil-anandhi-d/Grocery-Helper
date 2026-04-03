// Global State
let comparisonItems = JSON.parse(localStorage.getItem('grocery_comparison')) || [];
let billItems = JSON.parse(localStorage.getItem('grocery_bill')) || [];
let historyItems = JSON.parse(localStorage.getItem('grocery_history')) || [];

// --- Firebase Configuration (User must fill this) ---
const firebaseConfig = {
    apiKey: "AIzaSyCgPhwywgR5BvDavLgbG1_YDbLR_OiOUow",
    authDomain: "grocery-helper-8dc49.firebaseapp.com",
    projectId: "grocery-helper-8dc49",
    storageBucket: "grocery-helper-8dc49.firebasestorage.app",
    messagingSenderId: "855546431994",
    appId: "1:855546431994:web:4aa09ecfc3d604b399fc43",
    measurementId: "G-2BKR1CTD0E"
};

// Initialize Firebase
let db = null;
let auth = null;
let isCloudEnabled = false;
let currentUser = null;

if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isCloudEnabled = true;
    console.log("Cloud Sync Enabled");
}

// --- View Management ---
window.showView = function (viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        }
    });
};

// --- Authentication Logic ---
if (isCloudEnabled) {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        const authTrigger = document.getElementById('auth-trigger');
        const guide = document.getElementById('firebase-setup-guide');

        if (user) {
            console.log("User Logged In:", user.email);
            authTrigger.textContent = '👤';
            authTrigger.classList.add('logged-in');
            if (guide) guide.classList.add('hidden');
            authModal.classList.add('hidden'); // Ensure modal closes
            syncFromCloud();
        } else {
            console.log("User Logged Out / Guest Mode");
            authTrigger.textContent = '🔑';
            authTrigger.classList.remove('logged-in');
            if (isCloudEnabled && guide) guide.classList.add('hidden'); // Hide guide if configured
            // Explicitly hide modal on load if guest
            authModal.classList.add('hidden');
        }
    });
}

// Nav Click Listeners
document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        showView(viewId);
    });
});

// Auth Modal Logic
const authModal = document.getElementById('auth-modal');
const authTrigger = document.getElementById('auth-trigger');
const closeAuth = document.getElementById('close-auth');
const authForm = document.getElementById('auth-form');
const authToggleLink = document.getElementById('auth-toggle-link');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const userProfile = document.getElementById('user-profile');
const profileEmail = document.getElementById('profile-email');
const logoutBtn = document.getElementById('logout-btn');

let isRegistering = false;

authTrigger.addEventListener('click', () => {
    if (!isCloudEnabled) {
        alert("Cloud Sync is not configured. Please add your Firebase API keys to the top of app.js to use this feature.");
        return;
    }
    if (currentUser) {
        // Show profile / logout
        authForm.classList.add('hidden');
        userProfile.classList.remove('hidden');
        profileEmail.textContent = currentUser.email;
        authTitle.textContent = 'Account';
    } else {
        // Show login/register
        authForm.classList.remove('hidden');
        userProfile.classList.add('hidden');
        authTitle.textContent = isRegistering ? 'Register' : 'Sign In';
    }
    authModal.classList.remove('hidden');
});

closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isRegistering = !isRegistering;
    authTitle.textContent = isRegistering ? 'Register' : 'Sign In';
    authSubmit.textContent = isRegistering ? 'Register' : 'Sign In';
    
    const switchContent = isRegistering ? 
        `Already have an account? <a href="#" id="auth-toggle-link">Sign In</a>` : 
        `Need an account? <a href="#" id="auth-toggle-link">Register</a>`;
    document.querySelector('.auth-switch').innerHTML = switchContent;
    
    // Re-attach listener correctly
    document.getElementById('auth-toggle-link').addEventListener('click', toggleAuthMode);
}

// Initial attachment
if (authToggleLink) {
    authToggleLink.addEventListener('click', toggleAuthMode);
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isCloudEnabled || !auth) {
        alert("Firebase is not initialized. Please check your configuration.");
        return;
    }
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    console.log("Auth Attempt:", isRegistering ? "Register" : "Sign In", email);
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        authSubmit.disabled = false;
        authSubmit.textContent = isRegistering ? 'Register' : 'Sign In';
        return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = 'Processing...';

    try {
        if (isRegistering) {
            await auth.createUserWithEmailAndPassword(email, password);
            alert("Account created! You are now logged in.");
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        authModal.classList.add('hidden');
    } catch (err) {
        let msg = err.message;
        if (err.code === 'auth/wrong-password') msg = "Incorrect password. Please try again.";
        if (err.code === 'auth/user-not-found') msg = "No account found with this email. Please register first.";
        if (err.code === 'auth/email-already-in-use') msg = "This email is already registered. Please Switch to 'Sign In'.";
        alert(msg);
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = isRegistering ? 'Register' : 'Sign In';
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
    authModal.classList.add('hidden');
    location.reload(); // Simple way to clear state
});

function saveSession() {
    localStorage.setItem('grocery_comparison', JSON.stringify(comparisonItems));
    localStorage.setItem('grocery_bill', JSON.stringify(billItems));
    localStorage.setItem('grocery_history', JSON.stringify(historyItems));

    if (isCloudEnabled) {
        saveToCloud();
    }
}

async function saveToCloud() {
    if (!currentUser) return;
    try {
        updateCloudStatus('Syncing...');
        await db.collection('users').doc(currentUser.uid).set({
            history: historyItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        updateCloudStatus('Synced ✓');
    } catch (e) {
        console.error("Cloud Error:", e);
        updateCloudStatus('Sync Failed ⚠');
    }
}

async function syncFromCloud() {
    if (!isCloudEnabled || !currentUser) return;

    updateCloudStatus('Syncing...');
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.history) {
                // Take the one with more items or handle merge
                if (data.history.length >= historyItems.length) {
                    historyItems = data.history;
                    localStorage.setItem('grocery_history', JSON.stringify(historyItems));
                    updateHistoryUI();
                }
            }
        }
        updateCloudStatus('Synced ✓');
    } catch (e) {
        console.error("Sync Error:", e);
        updateCloudStatus('Offline');
    }
}

function updateCloudStatus(msg) {
    const statusEl = document.getElementById('cloud-status');
    if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = `cloud-status-tag ${msg.toLowerCase().includes('syncing') ? 'syncing' : ''}`;
    }
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
    } else if (unit === 'kg' || unit === 'l' || unit === 'unit' || unit === 'pcs') {
        factor = 1;
    }

    const unitPrice = (price / weight); // Base unit price
    const displayUnitPrice = (price / weight) * factor; // Price per Kg/L/Unit/Pcs

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
    const maxUnitPrice = Math.max(...comparisonItems.map(item => item.unitPrice));

    // Header for comparison
    const listHeader = document.querySelector('.list-header h3');
    if (comparisonItems.length > 1) {
        const factor = comparisonItems[0].displayUnit === 'kg' || comparisonItems[0].displayUnit === 'L' ? 1 : 1; // Simplified
        const savingsPerUnit = (maxUnitPrice - minUnitPrice);
        listHeader.innerHTML = `Compared Items <span class="savings-tag">Save up to ₹${(savingsPerUnit * (comparisonItems[0].unit === 'g' || comparisonItems[0].unit === 'ml' ? 1000 : 1)).toFixed(2)} per unit</span>`;
    } else {
        listHeader.textContent = 'Compared Items';
    }

    comparisonList.innerHTML = '';

    // Sort items by unit price (lowest first)
    const sortedItems = [...comparisonItems].sort((a, b) => a.unitPrice - b.unitPrice);

    sortedItems.forEach(item => {
        const isBestValue = item.unitPrice === minUnitPrice && comparisonItems.length > 1;

        const li = document.createElement('li');
        li.className = `compare-item ${isBestValue ? 'best-value' : ''}`;

        li.innerHTML = `
            <div class="price-main">
                <span class="unit-price">₹ ${item.displayUnitPrice}</span>
                <span class="unit-label">per ${item.displayUnit}</span>
            </div>
            <div class="info">
                <span class="name">${item.name}</span>
                <span class="details">₹ ${item.price.toFixed(2)} total | ${item.weight}${item.unit}</span>
            </div>
            ${isBestValue ? `<div class="badge-container"><span class="badge cheapest-badge">CHEAPEST DEAL</span></div>` : ''}
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

window.removeBillItem = function (id) {
    billItems = billItems.filter(item => item.id !== id);
    saveSession();
    updateBillUI();
};

// --- History Logic ---

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const saveComparisonBtn = document.getElementById('save-comparison');
const saveBillBtn = document.getElementById('save-bill');

saveComparisonBtn.addEventListener('click', () => {
    if (comparisonItems.length === 0) return;

    const bestItem = [...comparisonItems].sort((a, b) => a.unitPrice - b.unitPrice)[0];
    const historyEntry = {
        id: Date.now(),
        type: 'Comparison',
        title: `${comparisonItems.length} items compared`,
        summary: `Best: ${bestItem.name} @ ₹${bestItem.displayUnitPrice}/${bestItem.displayUnit}`,
        items: [...comparisonItems], // Store full copy
        date: new Date().toLocaleString()
    };

    historyItems.unshift(historyEntry);
    saveSession();
    updateHistoryUI();

    // Visual feedback
    saveComparisonBtn.textContent = 'Saved! ✓';
    setTimeout(() => saveComparisonBtn.textContent = 'Save to History', 2000);
});

saveBillBtn.addEventListener('click', () => {
    if (billItems.length === 0) return;

    const total = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    const historyEntry = {
        id: Date.now(),
        type: 'Bill',
        title: `Bill: ${billItems.length} items`,
        summary: `Total: ₹${total.toFixed(2)}`,
        items: [...billItems], // Store full copy
        date: new Date().toLocaleString()
    };

    historyItems.unshift(historyEntry);
    saveSession();
    updateHistoryUI();

    // Visual feedback
    saveBillBtn.textContent = 'Archived! ✓';
    setTimeout(() => saveBillBtn.textContent = 'Archive Bill', 2000);
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all history?')) {
        historyItems = [];
        saveSession();
        updateHistoryUI();
    }
});

function updateHistoryUI() {
    if (historyItems.length === 0) {
        historyList.innerHTML = '<div class="empty-state"><p>No history yet. Save your first session!</p></div>';
        return;
    }

    historyList.innerHTML = '';
    historyItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        let detailsHtml = '';
        const itemsList = item.items || [];
        if (item.type === 'Comparison') {
            detailsHtml = itemsList.map(i => `
                <div class="h-detail-row">
                    <span>${i.name}</span>
                    <span>₹${i.displayUnitPrice}/${i.displayUnit}</span>
                </div>
            `).join('');
        } else {
            detailsHtml = itemsList.map(i => `
                <div class="h-detail-row">
                    <span>${i.name} (${i.qty})</span>
                    <span>₹${i.subtotal.toFixed(2)}</span>
                </div>
            `).join('');
        }

        li.innerHTML = `
            <div class="history-main" onclick="toggleDetails(${item.id})">
                <div class="h-left">
                    <span class="history-type ${item.type.toLowerCase()}">${item.type}</span>
                    <span class="history-date">${item.date}</span>
                </div>
                <button class="remove-history-item" onclick="event.stopPropagation(); removeHistoryItem(${item.id})">×</button>
            </div>
            <div class="history-content" onclick="toggleDetails(${item.id})">
                <span class="history-title">${item.title}</span>
                <span class="history-summary">${item.summary}</span>
            </div>
            <div id="details-${item.id}" class="history-details">
                <div class="details-inner">
                    ${detailsHtml}
                </div>
            </div>
        `;
        historyList.appendChild(li);
    });
}

window.toggleDetails = function (id) {
    const el = document.getElementById(`details-${id}`);
    const parent = el.closest('.history-item');

    if (el.style.maxHeight) {
        el.style.maxHeight = null;
        parent.classList.remove('expanded');
    } else {
        el.style.maxHeight = el.scrollHeight + "px";
        parent.classList.add('expanded');
    }
};

window.removeHistoryItem = function (id) {
    historyItems = historyItems.filter(item => item.id !== id);
    saveSession();
    updateHistoryUI();
};

// Initial Render
updateComparisonUI();
updateBillUI();
updateHistoryUI();
// syncFromCloud is now handled by auth listener

// Simple ripple effect for primary button
document.querySelectorAll('.primary-btn, .secondary-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        const ripple = btn.querySelector('.btn-ripple');
        const rippleSpan = ripple || document.createElement('span');
        if (!ripple) {
            rippleSpan.className = 'btn-ripple';
            btn.appendChild(rippleSpan);
        }

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        rippleSpan.style.left = `${x}px`;
        rippleSpan.style.top = `${y}px`;

        // Restart animation
        rippleSpan.style.animation = 'none';
        rippleSpan.offsetHeight; // trigger reflow
        rippleSpan.style.animation = null;
    });
});
