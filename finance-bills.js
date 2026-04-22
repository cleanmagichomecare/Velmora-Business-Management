/**
 * finance-bills.js
 * Dedicated script for Finance Bills Management
 */

(function() {
    // Isolated Data Structure for Finance Bills
    window.financeBills = [];

    function initFinanceBillsLogic() {
        console.log('finance-bills.js: initFinanceBillsLogic called');

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

        let isFetchingBills = false;
        let billsSearchTimeout = null;

        window.fetchBillsData = async function() {
            const container = document.getElementById('bill-list-content');
            if (!container) return;

            try {
                isFetchingBills = true;
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Loading bills...</div>';

                let response = await window.supabase
                    .from('finance_bills')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                // Fallback if 'status' column doesn't exist (Code 42703: undefined_column)
                if (response.error && response.error.code === '42703') {
                    console.warn("Column 'status' does not exist in finance_bills. Fetching all rows without filter.");
                    response = await window.supabase
                        .from('finance_bills')
                        .select('*')
                        .order('created_at', { ascending: false });
                }

                const { data, error } = response;
                if (error) throw error;
                
                // If there's a status column but we fetched all, we might want to manually filter out 'archived' just in case the fallback was hit for some other reason, but since the fallback is only for missing column, all rows are effectively active.
                window.financeBills = data || [];
                
                // Filter out archived ones manually just in case status exists but is null or something, though the query handled it.
                window.financeBills = window.financeBills.filter(b => b.status !== 'archived');
                
                console.log("Fetched bills:", window.financeBills);
                
                window.renderBillsTable();
            } catch (error) {
                console.error("Failed to load bills:", error);
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff6b6b;">Failed to load bills.</div>';
            } finally {
                isFetchingBills = false;
            }
        };

        window.renderBillsTable = function() {
            const container = document.getElementById('bill-list-content');
            if (!container) return;

            const searchInput = document.getElementById('bill-search');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

            // Filter in memory
            const activeBills = window.financeBills.filter(bill => {
                if (searchTerm) {
                    const haystack = `${bill.main_category} ${bill.sub_category1} ${bill.sub_category2} ${bill.payment_type}`.toLowerCase();
                    if (!haystack.includes(searchTerm)) return false;
                }
                return true;
            });

            // Empty States
            if (window.financeBills.length === 0) {
                container.innerHTML = `
                    <div class="vendor-empty-state" style="display:block;">
                        <div class="vendor-empty-icon">💸</div>
                        <h3>No bills yet</h3>
                        <p>Click "+ Add Bill" to create your first bill.</p>
                    </div>
                `;
                return;
            }

            if (activeBills.length === 0) {
                container.innerHTML = `
                    <div class="vendor-empty-state" style="display:block;">
                        <div class="vendor-empty-icon">🔍</div>
                        <h3>No matching bills</h3>
                        <p>Try adjusting your search.</p>
                    </div>
                `;
                return;
            }

            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            };

            let html = `
                <table class="vendor-table">
                    <thead>
                        <tr>
                            <th>Main Category</th>
                            <th>Sub Category 1</th>
                            <th>Sub Category 2</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Billing Cycle</th>
                            <th>Payment Type</th>
                            <th>Mode of Pay</th>
                            <th>Email</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            activeBills.forEach(bill => {
                html += `
                    <tr>
                        <td><strong>${bill.main_category || '-'}</strong></td>
                        <td>${bill.sub_category1 || '-'}</td>
                        <td>${bill.sub_category2 || '-'}</td>
                        <td>₹${bill.amount != null ? bill.amount : '-'}</td>
                        <td>${formatDate(bill.due_date)}</td>
                        <td>${bill.billing_cycle || '-'}</td>
                        <td><span class="vendor-status-badge active">${bill.payment_type || '-'}</span></td>
                        <td>${bill.mode_of_pay || '-'}</td>
                        <td>${bill.email || '-'}</td>
                        <td>${bill.notes || '-'}</td>
                        <td>
                            <div class="vendor-actions">
                                <button class="btn-bill-archive" data-id="${bill.id}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                                    Archive
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
            console.log("Bills rendered successfully");

            document.querySelectorAll('.btn-bill-archive').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    await window.archiveBill(id);
                });
            });
        };

        window.archiveBill = async function(id) {
            if (!confirm("Archive this bill?")) return;
            try {
                let response = await window.supabase
                    .from('finance_bills')
                    .update({ status: 'archived' })
                    .eq('id', id);

                if (response.error && response.error.code === '42703') {
                    console.warn("Column 'status' does not exist. Falling back to delete.");
                    response = await window.supabase
                        .from('finance_bills')
                        .delete()
                        .eq('id', id);
                }

                const { error } = response;
                if (error) throw error;
                if (window.showToast) window.showToast('Bill archived', '✅');
                await window.fetchBillsData();
            } catch (err) {
                console.error("Error archiving bill:", err);
                alert("Failed to archive bill");
            }
        };

        // --- Bindings ---
        const billSearchInput = document.getElementById('bill-search');
        if (billSearchInput) {
            billSearchInput.addEventListener('input', () => {
                if (billsSearchTimeout) clearTimeout(billsSearchTimeout);
                billsSearchTimeout = setTimeout(() => {
                    window.renderBillsTable();
                }, 300);
            });
        }

        const btnRefreshBills = document.getElementById('btn-refresh-bills');
        if (btnRefreshBills) {
            btnRefreshBills.addEventListener('click', () => {
                window.fetchBillsData();
            });
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
                    if (billSearchInput) billSearchInput.value = ''; // Clear search on open
                    window.fetchBillsData();
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
                account: account,
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
