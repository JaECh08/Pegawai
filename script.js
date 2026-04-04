// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBxXkli2cEbqnbJToLNgTQtaRVodg6VLHE",
    authDomain: "toko-bermi.firebaseapp.com",
    databaseURL: "https://toko-bermi-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "toko-bermi",
    storageBucket: "toko-bermi.firebasestorage.app",
    messagingSenderId: "647490190912",
    appId: "1:647490190912:web:31aa8592664ad6e2a9a9a5",
    measurementId: "G-R6XXPKKGB3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let dbData = {
    stock: [],
    outgoing: []
};

let outgoingRowCounter = 0;

// Status Login
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if (user) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';

        startDataSync();
        updateDateDisplay();
        document.getElementById('outgoing-date').valueAsDate = new Date();
        initTransactionForms();
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }
});

// Handle Login
const setupLogin = () => {
    const form = document.getElementById('login-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const errorMsg = document.getElementById('login-error');

            try {
                await auth.signInWithEmailAndPassword(email, pass);
            } catch (error) {
                if (errorMsg) {
                    errorMsg.style.color = "#ef4444";
                    errorMsg.textContent = "Email atau Password salah.";
                }
            }
        };
    } else {
        setTimeout(setupLogin, 500);
    }
};
setupLogin();

function logout() {
    showConfirm("Apakah Anda yakin ingin keluar?", () => {
        auth.signOut();
        closeConfirmModal();
    });
}
window.logout = logout;

// Data Sync
function startDataSync() {
    db.ref('stock').on('value', (snapshot) => {
        dbData.stock = snapshot.val() || [];
    });
    db.ref('outgoing').on('value', (snapshot) => {
        dbData.outgoing = snapshot.val() || [];
        renderOutgoingTable();
    });
}

function getData(key) {
    if (!dbData) return [];
    return dbData[key] || [];
}

function saveData(key, data) {
    if (db && db.ref) {
        db.ref(key).set(data).catch(err => console.error(`Error saving ${key}:`, err));
    }
}

// UI Functions
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateDateDisplay() {
    const dateElement = document.getElementById('current-date-display');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('id-ID', options);
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passwordInput && eyeIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.textContent = '👁';
        } else {
            passwordInput.type = 'password';
            eyeIcon.textContent = '👁';
        }
    }
}
window.togglePasswordVisibility = togglePasswordVisibility;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}
window.toggleSidebar = toggleSidebar;

function showAlert(message) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('alert-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('alert-modal').style.display = 'none';
}
window.showAlert = showAlert;
window.closeModal = closeModal;

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const messageEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    if (modal && messageEl && yesBtn) {
        messageEl.textContent = message;
        modal.style.display = 'flex';
        yesBtn.onclick = () => { onConfirm(); closeConfirmModal(); };
    }
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}
window.closeConfirmModal = closeConfirmModal;

// Autocomplete logic
function setupGeneralAutocomplete(inputId, dropdownId, onSelect = null) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    if (input.dataset.bound) return;
    input.dataset.bound = "true";

    const showDropdown = (filter = '') => {
        const stock = getData('stock') || [];
        dropdown.innerHTML = '';
        const trimmedFilter = filter.trim();
        const filtered = stock.filter(item => item.name.toLowerCase().includes(trimmedFilter.toLowerCase()));

        if (filtered.length === 0 || trimmedFilter === '') {
            dropdown.classList.remove('show');
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            const escapedFilter = escapeRegExp(trimmedFilter);
            const highlightedName = escapedFilter ? item.name.replace(new RegExp(`(${escapedFilter})`, 'gi'), '<span class="match-text">$1</span>') : item.name;
            div.innerHTML = `<span>${highlightedName}</span> <small style="opacity: 0.7;">(Stock: ${item.stock})</small>`;
            div.addEventListener('click', () => {
                input.value = item.name;
                if (onSelect) onSelect(item);
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(div);
        });
        dropdown.classList.add('show');
    };

    input.addEventListener('input', () => showDropdown(input.value));
    input.addEventListener('focus', () => showDropdown(input.value));
}

// Click anywhere to close dropdowns
document.addEventListener('click', function (event) {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        if (dropdown.classList.contains('show')) {
            const wrapper = dropdown.closest('.autocomplete-wrapper');
            if (wrapper && !wrapper.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
});

// Outgoing logic tailored for Pegawai
function addOutgoingRow() {
    outgoingRowCounter++;
    const container = document.getElementById('outgoing-items-list');

    const row = document.createElement('div');
    row.className = 'item-row transaction-row';
    row.id = `outgoing-row-${outgoingRowCounter}`;
    row.style.display = 'grid';
    // Simplified Grid: Nama, Jumlah, Satuan, Action button
    row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
    row.style.gap = '10px';
    row.style.alignItems = 'end';
    row.style.marginBottom = '10px';
    row.style.padding = '10px';

    row.innerHTML = `
        <div class="form-group" style="margin-bottom:0; position:relative;">
            <label style="font-size:0.85em;">Nama Barang</label>
            <div class="autocomplete-wrapper">
                <input type="text" class="outgoing-item-name" id="outgoing-name-${outgoingRowCounter}" placeholder="Cari..." required autocomplete="off">
                <div class="custom-dropdown" id="dropdown-outgoing-${outgoingRowCounter}"></div>
            </div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.85em;">Jumlah</label>
            <input type="number" class="outgoing-item-qty" min="0" step="any" required placeholder="0" value="1">
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.85em;">Satuan</label>
            <input type="text" class="outgoing-item-unit" placeholder="Pcs" readonly>
            <!-- Hidden inputs to retain HPP logic if necessary for backend history, we can fetch from stock array later -->
        </div>
        <button type="button" class="delete-button" onclick="removeTransactionRow(this)" style="margin-bottom:2px; height:38px; padding:0 12px; min-width: 40px; background: #ef4444; color: white; border: none; border-radius: 6px;">×</button>
    `;

    container.appendChild(row);

    const nameInput = row.querySelector('.outgoing-item-name');
    const unitInput = row.querySelector('.outgoing-item-unit');

    setupGeneralAutocomplete(`outgoing-name-${outgoingRowCounter}`, `dropdown-outgoing-${outgoingRowCounter}`, (item) => {
        if (item.unit) unitInput.value = item.unit;
    });
}
window.addOutgoingRow = addOutgoingRow;

function removeTransactionRow(btn) {
    const row = btn.closest('.transaction-row');
    if (row) row.remove();
}
window.removeTransactionRow = removeTransactionRow;

function addOutgoingTransaction(event) {
    event.preventDefault();

    const date = document.getElementById('outgoing-date').value;
    const itemRows = document.querySelectorAll('#outgoing-items-list .item-row');

    if (itemRows.length === 0) {
        addOutgoingRow();
        showAlert("Mohon tambahkan setidaknya satu barang.");
        return;
    }

    const items = [];
    let isValid = true;
    let itemsFound = false;

    const stock = getData('stock');
    const tempStockMap = {};
    stock.forEach(s => tempStockMap[s.name] = (parseFloat(s.stock) || 0));

    const itemUpdates = {};

    itemRows.forEach(row => {
        const name = row.querySelector('.outgoing-item-name').value.trim();
        const qty = parseFloat(row.querySelector('.outgoing-item-qty').value);
        const unit = row.querySelector('.outgoing-item-unit').value.trim();

        if (name) {
            itemsFound = true;
            if (isNaN(qty) || qty <= 0) {
                isValid = false;
            }

            if (tempStockMap[name] === undefined) {
                showAlert(`Barang "${name}" tidak ditemukan di stock.`);
                isValid = false;
                return;
            }

            const currentDeduction = (itemUpdates[name] || 0) + qty;
            if (tempStockMap[name] < currentDeduction) {
                showAlert(`Stock "${name}" tidak cukup! (Tersedia: ${tempStockMap[name]})`);
                isValid = false;
                return;
            }
            itemUpdates[name] = currentDeduction;

            // Fetch HPP from stock logic to retain Owner's history calculation
            const stockItem = stock.find(s => s.name === name);
            const hpp = stockItem ? (parseFloat(stockItem.hpp) || 0) : 0;
            const total = hpp * qty;

            items.push({ name, qty, unit, hpp, total });
        }
    });

    if (!itemsFound) {
        showAlert("Mohon isi data barang.");
        return;
    }

    if (!isValid) return;

    // Deduct Stock
    items.forEach(item => {
        const stockItem = stock.find(s => s.name === item.name);
        if (stockItem) {
            stockItem.stock -= item.qty;
        }
    });
    saveData('stock', stock);

    // Save Transaction properly so it appears in owner's history
    const outgoingHistory = getData('outgoing') || [];
    outgoingHistory.push({
        id: Date.now(),
        date,
        items
    });
    saveData('outgoing', outgoingHistory);

    // RESET FORM
    document.getElementById('outgoing-form').reset();
    document.getElementById('outgoing-items-list').innerHTML = '';
    document.getElementById('outgoing-date').valueAsDate = new Date();
    addOutgoingRow();

    showAlert("Barang Keluar berhasil dicatat!");
}
window.addOutgoingTransaction = addOutgoingTransaction;

function initTransactionForms() {
    const outgoingList = document.getElementById('outgoing-items-list');
    if (outgoingList && outgoingList.querySelectorAll('.item-row').length === 0) {
        addOutgoingRow();
    }
}

// --- HISTORY RENDERING ---

function renderOutgoingTable() {
    const tbody = document.querySelector('#outgoing-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const history = getData('outgoing') || [];
    const searchInput = document.getElementById('outgoing-search-input');
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sorted = [...history].sort((a, b) => b.id - a.id);

    sorted.forEach(trans => {
        const items = trans.items || [];

        if (searchValue) {
            const matchItem = items.some(i => i.name.toLowerCase().includes(searchValue));
            if (!matchItem) return;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trans.date}</td>
            <td style="text-align: center;">
                <button class="action-btn" onclick="showOutgoingDetail(${trans.id})" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Rincian Pesanan</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
window.renderOutgoingTable = renderOutgoingTable;

function showOutgoingDetail(id) {
    const history = getData('outgoing');
    const trans = history.find(t => t.id === id);
    if (!trans) return;

    const items = trans.items || [];

    let grandTotal = 0;
    items.forEach(i => grandTotal += (i.total || ((i.hpp || 0) * i.qty) || 0));

    const content = `
        <div style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <p><strong>Tanggal:</strong> ${trans.date}</p>
        </div>
        <div class="table-responsive">
            <table class="detail-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Nama Barang</th>
                        <th style="text-align: left;">Jumlah</th>
                        <th style="text-align: left;">Satuan</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td style="text-align:left;">${item.qty}</td>
                            <td style="text-align:left;">${item.unit || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <p style="margin-top: 15px; color: var(--text-secondary); font-size: 0.9em;">* Murni tampilan riwayat (Read-Only)</p>
    `;

    const detailBody = document.getElementById('detail-modal-body');
    if (detailBody) {
        detailBody.innerHTML = content;
        const modal = document.getElementById('detail-modal');
        modal.style.display = 'block';
    }
}
window.showOutgoingDetail = showOutgoingDetail;

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.style.display = 'none';
}
window.closeDetailModal = closeDetailModal;

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}
window.formatRupiah = formatRupiah;
