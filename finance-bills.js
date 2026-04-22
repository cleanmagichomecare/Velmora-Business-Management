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

        // CREATE async saveBill() FUNCTION
        async function saveBill() {
            const mainCatRaw = billMainCat ? billMainCat.value : '';
            const amountRaw = document.getElementById('bill-amount').value;
            const dueDateRaw = document.getElementById('bill-due-date').value;

            const mainCat = mainCatRaw.trim();
            const amount = parseFloat(amountRaw);
            const dueDate = dueDateRaw.trim();

            if (!mainCat || isNaN(amount) || !dueDate) {
                if (window.showToast) window.showToast('Please fill all required fields.', '⚠');
                else alert('Please fill all required fields.');
                return;
            }

            // Optional fields (trim and handle empty as null)
            const getVal = (id) => {
                const el = document.getElementById(id);
                if (!el) return null;
                const val = el.value.trim();
                return val === '' ? null : val;
            };

            const sub1 = getVal('bill-sub-category1');
            const sub2 = getVal('bill-sub-category2');
            const billingCycle = getVal('bill-cycle');
            const payMode = getVal('bill-pay-mode');
            const account = getVal('bill-account');
            const email = getVal('bill-email');
            const notes = getVal('bill-notes');

            // Payment type radio
            const pTypeEl = document.querySelector('input[name="bill-payment-type"]:checked');
            const paymentType = pTypeEl ? pTypeEl.value.trim() : null;

            const payload = {
                main_category: mainCat,
                sub_category1: sub1,
                sub_category2: sub2,
                amount: amount,
                due_date: dueDate,
                billing_cycle: billingCycle,
                payment_type: paymentType,
                mode_of_pay: payMode,
                which_account: account,
                email: email,
                notes: notes
            };

            console.log("Saving bill:", payload);

            try {
                // Disable button
                const saveBtn = document.getElementById('btn-save-bill');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                }

                const { data, error } = await window.supabase
                    .from('finance_bills')
                    .insert([payload]);

                if (error) throw error;

                console.log("Bill saved successfully");
                if (window.showToast) window.showToast('Bill saved successfully!', '✅');

                // Reset entire form cleanly
                if (addBillForm) addBillForm.reset();
                
                // Clear dropdowns explicitly
                if (billSub1) {
                    billSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
                    billSub1.disabled = true;
                }
                if (billSub2) {
                    billSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
                    billSub2.disabled = true;
                }

                // Hide form, show default
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');

            } catch (err) {
                console.error("Supabase insert error:", err);
                if (window.showToast) window.showToast("Failed to save bill", '❌');
                else alert("Failed to save bill");
            } finally {
                const saveBtn = document.getElementById('btn-save-bill');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Bill';
                }
            }
        }

        if (btnSaveBill) {
            // Prevent duplicate listeners by replacing node
            const newBtn = btnSaveBill.cloneNode(true);
            btnSaveBill.parentNode.replaceChild(newBtn, btnSaveBill);
            newBtn.addEventListener('click', saveBill);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinanceBillsLogic);
    } else {
        initFinanceBillsLogic();
    }
})();
