/**
 * finance-bills.js
 * Dedicated script for Finance Bills Management
 */

(function() {
    // Isolated Data Structure for Finance Bills
    window.financeBills = [];

    // Storage interactions
    function loadFinanceBillData() {
        try {
            const data = localStorage.getItem('financeBillData');
            if (data) {
                window.financeBills = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load financeBillData:", e);
            window.financeBills = [];
        }
    }

    function saveFinanceBillData() {
        localStorage.setItem('financeBillData', JSON.stringify(window.financeBills));
    }

    function initFinanceBillsLogic() {
        console.log('finance-bills.js: initFinanceBillsLogic called');
        
        loadFinanceBillData();

        // UI Elements
        const btnShowAddForm = document.getElementById('btn-show-add-bill-form');
        const btnViewBillsList = document.getElementById('btn-view-bills-list');
        const addBillFormContainer = document.getElementById('add-bill-form-container');
        const billListContainer = document.getElementById('bill-list-container');
        const billDefaultState = document.getElementById('bill-default-state');
        const btnCancelBill = document.getElementById('btn-cancel-bill');
        const btnSaveBill = document.getElementById('btn-save-bill');
        const addBillForm = document.getElementById('add-bill-form');

        // Dropdowns
        const billMainCat = document.getElementById('bill-main-category');
        const billSub1 = document.getElementById('bill-sub-category1');
        const billSub2 = document.getElementById('bill-sub-category2');

        function hideAllBillViews() {
            [addBillFormContainer, billListContainer, billDefaultState].forEach(el => {
                if (el) el.classList.add('hidden');
            });
        }

        function populateBillCategories() {
            if (!billMainCat) return;

            const _globals = window._financeCatGlobals || { mains: [], sub1: {}, sub2: {} };
            
            // Populate Main
            billMainCat.innerHTML = '<option value="">Select Main Category</option>';
            _globals.mains.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                billMainCat.appendChild(opt);
            });

            // Listen for changes
            billMainCat.onchange = () => {
                const mainVal = billMainCat.value;
                billSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
                billSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
                billSub2.disabled = true;

                if (mainVal && _globals.sub1[mainVal]) {
                    billSub1.disabled = false;
                    _globals.sub1[mainVal].forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = sub;
                        billSub1.appendChild(opt);
                    });
                } else {
                    billSub1.disabled = true;
                }
            };

            billSub1.onchange = () => {
                const sub1Val = billSub1.value;
                billSub2.innerHTML = '<option value="">Select Sub Category 2</option>';

                if (sub1Val && _globals.sub2[sub1Val]) {
                    billSub2.disabled = false;
                    _globals.sub2[sub1Val].forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = sub;
                        billSub2.appendChild(opt);
                    });
                } else {
                    billSub2.disabled = true;
                }
            };
        }

        function renderBillsTable() {
            const container = document.getElementById('bill-list-content');
            if (!container) return;

            let html = `
                <table class="vendor-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Email</th>
                            <th>Mode / Account</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (window.financeBills.length === 0) {
                html += '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #888;">No bills saved yet.</td></tr>';
            } else {
                window.financeBills.forEach(bill => {
                    html += `
                        <tr>
                            <td>${bill.mainCategory} / ${bill.subCategory1 || '-'}</td>
                            <td>₹${bill.amount}</td>
                            <td>${bill.dueDate}</td>
                            <td>${bill.email || '-'}</td>
                            <td>${bill.modeOfPay} / ${bill.account || '-'}</td>
                            <td>${bill.paymentType}</td>
                        </tr>
                    `;
                });
            }

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        if (btnShowAddForm) {
            btnShowAddForm.addEventListener('click', () => {
                hideAllBillViews();
                if (addBillFormContainer) {
                    addBillFormContainer.classList.remove('hidden');
                    addBillForm.reset();
                    populateBillCategories();
                }
            });
        }

        if (btnViewBillsList) {
            btnViewBillsList.addEventListener('click', () => {
                hideAllBillViews();
                if (billListContainer) {
                    billListContainer.classList.remove('hidden');
                    renderBillsTable();
                }
            });
        }

        if (btnCancelBill) {
            btnCancelBill.addEventListener('click', () => {
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');
            });
        }

        if (btnSaveBill) {
            btnSaveBill.addEventListener('click', () => {
                const mainCat = billMainCat.value;
                const amount = document.getElementById('bill-amount').value;
                const dueDate = document.getElementById('bill-due-date').value;

                if (!mainCat || !amount || !dueDate) {
                    if (window.showToast) window.showToast('Please fill all required fields.', '⚠');
                    else alert('Please fill all required fields.');
                    return;
                }

                const newBill = {
                    id: Date.now(),
                    mainCategory: mainCat,
                    subCategory1: billSub1.value,
                    subCategory2: billSub2.value,
                    amount: amount,
                    dueDate: dueDate,
                    billingCycle: document.getElementById('bill-cycle').value,
                    paymentType: document.querySelector('input[name="bill-payment-type"]:checked').value,
                    modeOfPay: document.getElementById('bill-pay-mode').value,
                    account: document.getElementById('bill-account').value,
                    email: document.getElementById('bill-email').value,
                    notes: document.getElementById('bill-notes').value,
                    createdAt: new Date().toISOString()
                };

                window.financeBills.push(newBill);
                saveFinanceBillData();
                
                if (window.showToast) window.showToast('Bill saved successfully!', '✅');
                
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinanceBillsLogic);
    } else {
        initFinanceBillsLogic();
    }
})();
