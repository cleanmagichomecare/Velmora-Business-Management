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
        const billSub3 = document.getElementById('bill-sub-category3');

        function hideAllBillViews() {
            [addBillFormContainer, billListContainer, billDefaultState].forEach(el => {
                if (el) el.classList.add('hidden');
            });
        }

        function setBillsActiveTab(activeId) {
            const billNavButtons = [
                'btn-show-add-bill-form',
                'btn-view-bills-list',
                'btn-finance-upcoming-bill',
                'btn-finance-bill-analytics'
            ];
            billNavButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    if (id === activeId) {
                        btn.classList.remove('btn-secondary');
                        btn.classList.add('btn-primary');
                    } else {
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-secondary');
                    }
                }
            });
        }


        function populateBillCategories() {
            if (!billMainCat) return;

            const _globals = window._financeCatGlobals || { mains: [], sub1: {}, sub2: {}, sub3: {} };
            
            console.log("Finance Globals (mains, sub1, sub2, sub3):", _globals);

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
                console.log("billMainCat changed to:", billMainCat.value);
                const mainVal = billMainCat.value;
                billSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
                billSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
                if (window.SharedCategoryService) window.SharedCategoryService.populateDropdown('bill-sub-category3', [], 'Select Sub Category 3', 'No Sub Categories');
                
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
                console.log("billSub1 changed to:", billSub1.value);
                const sub1Val = billSub1.value;
                billSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
                if (window.SharedCategoryService) window.SharedCategoryService.populateDropdown('bill-sub-category3', [], 'Select Sub Category 3', 'No Sub Categories');

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

            billSub2.onchange = () => {
                console.log("billSub2 changed to:", billSub2.value);
                const sub2Val = billSub2.value;
                if (!billSub3) return;

                if (window.SharedCategoryService) {
                    window.SharedCategoryService.populateDropdown('bill-sub-category3', sub2Val && _globals.sub3[sub2Val] ? _globals.sub3[sub2Val] : [], 'Select Sub Category 3', 'No Sub Categories');
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

                window.currentlyEditingBillId = null;

        window.renderBillsTable = function() {
            const container = document.getElementById('bill-list-content');
            if (!container) return;

            const searchInput = document.getElementById('bill-search');
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

            // Filter in memory
            const activeBills = window.financeBills.filter(bill => {
                if (searchTerm) {
                    const haystack = ${bill.main_category}    .toLowerCase();
                    if (!haystack.includes(searchTerm)) return false;
                }
                return true;
            });

            // Empty States
            if (window.financeBills.length === 0) {
                container.innerHTML = 
                    <div class="vendor-empty-state" style="display:block;">
                        <div class="vendor-empty-icon">??</div>
                        <h3>No bills yet</h3>
                        <p>Click "+ Add Bill" to create your first bill.</p>
                    </div>
                ;
                return;
            }

            if (activeBills.length === 0) {
                container.innerHTML = 
                    <div class="vendor-empty-state" style="display:block;">
                        <div class="vendor-empty-icon">??</div>
                        <h3>No matching bills</h3>
                        <p>Try adjusting your search.</p>
                    </div>
                ;
                return;
            }

            container.innerHTML = '<div class="bill-card-grid" id="bill-cards-grid"></div>';
            const grid = document.getElementById('bill-cards-grid');

            activeBills.forEach(bill => {
                const card = window.createSingleBillCard(bill);
                grid.appendChild(card);
            });
            console.log("Bill cards rendered successfully");
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        window.createSingleBillCard = function(bill) {
            const card = document.createElement('div');
            card.className = 'bill-card mb-20';
            card.setAttribute('data-id', bill.id);
            window.renderSingleBillCard(card, bill);
            return card;
        };

        window.renderSingleBillCard = function(card, bill) {
            card.innerHTML = '';
            card.classList.remove('is-editing');
            
            const pType = bill.payment_type || '-';
            let pTypeBadgeClass = 'bill-badge ';
            if (pType.toLowerCase() === 'manual') pTypeBadgeClass += 'manual';
            else if (pType.toLowerCase() === 'autopay') pTypeBadgeClass += 'autopay';

            let statusBadgeClass = 'bill-badge paid'; 
            const bStatus = bill.bill_status || 'Pending';
            if (bStatus.toLowerCase() === 'paid') statusBadgeClass = 'bill-badge paid';
            else if (bStatus.toLowerCase() === 'pending') statusBadgeClass = 'bill-badge pending';
            else if (bStatus.toLowerCase() === 'overdue') statusBadgeClass = 'bill-badge overdue';

            card.innerHTML = 
                <div class="bill-card-header">
                    <div class="bill-card-header-left">
                        <h3 style="margin:0; font-size: 16px; color: var(--text-main); font-weight: 600;">
                            
                        </h3>
                        <div style="font-size: 12px; color: var(--text-muted);">
                             
                            
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                            <span class=""></span>
                            <span class=""></span>
                            <span class="bill-badge" style="background: rgba(123, 140, 255, 0.1); color: var(--primary-color);">Due: </span>
                        </div>
                    </div>
                    <div class="bill-card-header-right">
                        <button class="btn-secondary btn-edit-bill" style="padding: 6px 16px; font-size: 13px;">Edit</button>
                        <button class="btn-primary btn-save-bill-inline hidden" style="padding: 6px 16px; font-size: 13px;">Save</button>
                        <button class="btn-secondary btn-cancel-bill-inline hidden" style="padding: 6px 16px; font-size: 13px;">Cancel</button>
                        <button class="btn-secondary btn-delete-bill" style="padding: 6px 12px; font-size: 13px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                        </button>
                    </div>
                </div>
                <div class="bill-card-body">
                    <div class="grid-2">
                        <div class="info-group" style="margin:0;"><label>Amount</label><div class="info-val" data-field="amount" style="font-weight: 600; font-size: 15px; color: var(--text-main);">?</div></div>
                        <div class="info-group" style="margin:0;"><label>Billing Cycle</label><div class="info-val" data-field="billing_cycle"></div></div>
                        <div class="info-group" style="margin:0;"><label>Payment Type</label><div class="info-val" data-field="payment_type"></div></div>
                        <div class="info-group" style="margin:0;"><label>Mode of Pay</label><div class="info-val" data-field="mode_of_pay"></div></div>
                        <div class="info-group" style="margin:0;"><label>Account</label><div class="info-val" data-field="account"></div></div>
                        <div class="info-group" style="margin:0;"><label>Email</label><div class="info-val" data-field="email"></div></div>
                    </div>
                    <div class="info-group mt-15"><label>Notes</label><div class="info-val" data-field="notes"></div></div>
                    <div class="hidden category-edit-group mt-15">
                        <div style="font-size: 13px; font-weight: 600; color: var(--primary-color); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">Edit Categories</div>
                        <div class="grid-2">
                            <div class="info-group" style="margin:0;"><label>Main Category</label><div class="info-val" data-field="main_category"></div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 1</label><div class="info-val" data-field="sub_category1"></div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 2</label><div class="info-val" data-field="sub_category2"></div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 3</label><div class="info-val" data-field="sub_category3"></div></div>
                            <div class="info-group" style="margin:0;"><label>Due Date</label><div class="info-val" data-field="due_date"></div></div>
                            <div class="info-group" style="margin:0;"><label>Bill Status</label><div class="info-val" data-field="bill_status"></div></div>
                        </div>
                    </div>
                </div>
            ;

            const btnEdit = card.querySelector('.btn-edit-bill');
            const btnSave = card.querySelector('.btn-save-bill-inline');
            const btnCancel = card.querySelector('.btn-cancel-bill-inline');
            const btnDelete = card.querySelector('.btn-delete-bill');

            btnDelete.addEventListener('click', async () => {
                await window.archiveBill(bill.id);
            });

            btnEdit.addEventListener('click', () => {
                if (window.currentlyEditingBillId && window.currentlyEditingBillId !== bill.id) {
                    if (window.showToast) window.showToast('? Finish editing current bill first');
                    else alert('Finish editing current bill first');
                    return;
                }

                window.currentlyEditingBillId = bill.id;
                card.classList.add('is-editing');
                btnEdit.classList.add('hidden');
                btnDelete.classList.add('hidden');
                btnSave.classList.remove('hidden');
                btnCancel.classList.remove('hidden');

                const body = card.querySelector('.bill-card-body');
                const basicGrid = body.querySelector('.grid-2');
                basicGrid.classList.remove('grid-2');
                basicGrid.classList.add('edit-grid');
                
                body.querySelector('.category-edit-group').classList.remove('hidden');

                const globals = window._financeCatGlobals || { mains: [], sub1: {}, sub2: {}, sub3: {} };

                ['amount', 'billing_cycle', 'account', 'email', 'notes', 'due_date'].forEach(f => {
                    const valDiv = body.querySelector(\ + .info-val[data-field=""]); // Escaping backtick in py
                    if (valDiv) {
                        const val = valDiv.textContent.replace('?', '') === '-' ? '' : valDiv.textContent.replace('?', '').trim();
                        if (f === 'notes') {
                            valDiv.innerHTML = <textarea class="edit-input" data-edit="" rows="2" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-family: inherit;"></textarea>;
                        } else if (f === 'due_date') {
                            valDiv.innerHTML = <input type="date" class="edit-input" data-edit="" value="" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">;
                        } else if (f === 'amount') {
                            valDiv.innerHTML = <input type="number" class="edit-input" data-edit="" value="" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">;
                        } else {
                            valDiv.innerHTML = <input type="text" class="edit-input" data-edit="" value="" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">;
                        }
                    }
                });

                const selects = {
                    'payment_type': ['Manual', 'Autopay'],
                    'mode_of_pay': ['GPay', 'Account Transfer', 'Cash', 'Card'],
                    'bill_status': ['Pending', 'Paid', 'Overdue']
                };
                Object.keys(selects).forEach(f => {
                    const valDiv = body.querySelector(\ + .info-val[data-field=""]);
                    if (valDiv) {
                        const currentVal = valDiv.textContent === '-' ? '' : valDiv.textContent.trim();
                        let options = selects[f].map(opt => <option value="" ></option>).join('');
                        valDiv.innerHTML = <select class="edit-input" data-edit="" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select</option></select>;
                    }
                });

                const mainDiv = body.querySelector('.info-val[data-field="main_category"]');
                const sub1Div = body.querySelector('.info-val[data-field="sub_category1"]');
                const sub2Div = body.querySelector('.info-val[data-field="sub_category2"]');
                const sub3Div = body.querySelector('.info-val[data-field="sub_category3"]');

                let mainOptions = globals.mains.map(m => <option value="" ></option>).join('');
                mainDiv.innerHTML = <select class="edit-input" data-edit="main_category" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Main Category</option></select>;
                sub1Div.innerHTML = <select class="edit-input" data-edit="sub_category1" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Sub Category 1</option></select>;
                sub2Div.innerHTML = <select class="edit-input" data-edit="sub_category2" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Sub Category 2</option></select>;
                
                const sub3Id = 'edit-sub3-' + bill.id;
                sub3Div.innerHTML = 
                    <div class="multi-select-container" id="container-">
                        <div class="multi-select-display disabled" tabindex="0">
                            <span class="multi-select-value multi-select-placeholder">Select Sub Category 3</span>
                            <svg class="multi-select-arrow" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div class="multi-select-dropdown hidden"></div>
                        <input type="hidden" class="edit-input" data-edit="sub_category3" id="" value="">
                    </div>
                ;

                const mainSel = body.querySelector('[data-edit="main_category"]');
                const sub1Sel = body.querySelector('[data-edit="sub_category1"]');
                const sub2Sel = body.querySelector('[data-edit="sub_category2"]');

                const populateSub1 = (mainVal, selectedVal) => {
                    sub1Sel.innerHTML = '<option value="">Select Sub Category 1</option>';
                    if (mainVal && globals.sub1[mainVal]) {
                        sub1Sel.disabled = false;
                        globals.sub1[mainVal].forEach(sub => {
                            const opt = document.createElement('option');
                            opt.value = sub;
                            opt.textContent = sub;
                            if (sub === selectedVal) opt.selected = true;
                            sub1Sel.appendChild(opt);
                        });
                    } else {
                        sub1Sel.disabled = true;
                    }
                };

                const populateSub2 = (sub1Val, selectedVal) => {
                    sub2Sel.innerHTML = '<option value="">Select Sub Category 2</option>';
                    if (sub1Val && globals.sub2[sub1Val]) {
                        sub2Sel.disabled = false;
                        globals.sub2[sub1Val].forEach(sub => {
                            const opt = document.createElement('option');
                            opt.value = sub;
                            opt.textContent = sub;
                            if (sub === selectedVal) opt.selected = true;
                            sub2Sel.appendChild(opt);
                        });
                    } else {
                        sub2Sel.disabled = true;
                    }
                };

                const populateSub3 = (sub2Val) => {
                    if (window.SharedCategoryService) {
                        const dataArray = (sub2Val && globals.sub3[sub2Val]) ? globals.sub3[sub2Val] : [];
                        window.SharedCategoryService.populateDropdown(sub3Id, dataArray, 'Select Sub Category 3', 'No Sub Categories');
                    }
                };

                mainSel.addEventListener('change', () => {
                    populateSub1(mainSel.value, null);
                    populateSub2(null, null);
                    populateSub3(null);
                });

                sub1Sel.addEventListener('change', () => {
                    populateSub2(sub1Sel.value, null);
                    populateSub3(null);
                });

                sub2Sel.addEventListener('change', () => {
                    populateSub3(sub2Sel.value);
                });

                populateSub1(bill.main_category, bill.sub_category1);
                populateSub2(bill.sub_category1, bill.sub_category2);
                
                setTimeout(() => {
                    populateSub3(bill.sub_category2);
                }, 50);
            });

            btnCancel.addEventListener('click', () => {
                window.currentlyEditingBillId = null;
                window.renderSingleBillCard(card, bill);
            });

            btnSave.addEventListener('click', async () => {
                const updated = {};
                card.querySelectorAll('.edit-input').forEach(input => {
                    const field = input.getAttribute('data-edit');
                    if (field) {
                        let val = input.value;
                        if (field === 'amount') val = parseFloat(val) || 0;
                        if (typeof val === 'string') val = val.trim();
                        updated[field] = val;
                    }
                });

                btnSave.textContent = 'Saving...';
                btnSave.disabled = true;
                btnCancel.disabled = true;

                try {
                    const { error } = await window.supabase
                        .from('finance_bills')
                        .update(updated)
                        .eq('id', bill.id);

                    if (error) {
                        if (error.code === '42703' && error.message.includes('bill_status')) {
                            // Column might not exist, silently ignore bill_status or notify user
                            console.warn("bill_status column might not exist. Retrying without bill_status.");
                            delete updated['bill_status'];
                            const retry = await window.supabase.from('finance_bills').update(updated).eq('id', bill.id);
                            if (retry.error) throw retry.error;
                        } else {
                            throw error;
                        }
                    }

                    Object.assign(bill, updated);
                    
                    window.currentlyEditingBillId = null;
                    window.renderSingleBillCard(card, bill);
                    
                    if (window.showToast) window.showToast('? Bill updated successfully');
                } catch (error) {
                    console.error('Update failed:', error);
                    if (window.showToast) window.showToast('? Failed to update bill');
                    else alert('Failed to update bill');
                    
                    btnSave.textContent = 'Save';
                    btnSave.disabled = false;
                    btnCancel.disabled = false;
                }
            });
        };

                window.archiveBill = async function(id) {
            if (!confirm("Archive this bill?")) return;
            try {
                console.log("Attempting to archive bill. Table: finance_bills, ID:", id);
                let response = await window.supabase
                    .from('finance_bills')
                    .update({ status: 'archived' })
                    .eq('id', id);

                if (response.error) {
                    console.error("Supabase Error Object:", response.error);
                    if (response.error.code === '42703') {
                        console.error("The 'status' column does not exist on finance_bills table. Please add it in Supabase: ALTER TABLE finance_bills ADD COLUMN status text DEFAULT 'active';");
                    }
                    throw response.error;
                }

                if (window.showToast) window.showToast('? Bill archived', '?'); else alert('Bill archived');
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
                setBillsActiveTab('btn-show-add-bill-form');
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
                setBillsActiveTab('btn-view-bills-list');
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
                setBillsActiveTab(null);
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
            const sub3 = getVal('bill-sub-category3');
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
                sub_category3: sub3,
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
                if (window.SharedCategoryService) {
                    window.SharedCategoryService.populateDropdown('bill-sub-category3', [], 'Select Sub Category 3', 'No Sub Categories');
                }

                // Hide form, show default
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');
                setBillsActiveTab(null);

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

        // --- Action Panel Routing Logic ---
        
        function showFinanceModule(moduleName) {
            const billsModule = document.getElementById('finance-bills-module');
            const placeholderModule = document.getElementById('finance-placeholder-module');
            const expenseView = document.getElementById('view-expense');
            const mainFinanceView = document.getElementById('view-add-bill');
            
            // Default: hide internal modules
            if (billsModule) billsModule.classList.add('hidden');
            if (placeholderModule) placeholderModule.classList.add('hidden');

            // Manage active button states across ALL finance nav bars
            document.querySelectorAll('[data-finance-route]').forEach(btn => {
                const route = btn.getAttribute('data-finance-route');
                if (route === moduleName) {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                }
            });

            // Handle Top Level view switches safely
            if (moduleName === 'expense') {
                document.querySelectorAll('.content-view').forEach(v => {
                    v.classList.remove('active-view');
                    v.classList.add('hidden');
                });
                if (expenseView) {
                    expenseView.classList.remove('hidden');
                    expenseView.classList.add('active-view');
                }
            } else if (moduleName === 'task') {
                const taskCard = document.querySelector('[data-target="view-task"]');
                if (taskCard) taskCard.click();
            } else {
                // Ensure main finance view is active
                document.querySelectorAll('.content-view').forEach(v => {
                    v.classList.remove('active-view');
                    v.classList.add('hidden');
                });
                if (mainFinanceView) {
                    mainFinanceView.classList.remove('hidden');
                    mainFinanceView.classList.add('active-view');
                }

                // Show specific internal module
                if (moduleName === 'bills' && billsModule) {
                    billsModule.classList.remove('hidden');
                } else if (moduleName === 'placeholder' && placeholderModule) {
                    placeholderModule.classList.remove('hidden');
                } else if (moduleName === 'bank' || moduleName === 'analytics') {
                    // It's a placeholder trigger, do not hide main view, show placeholder
                    if (placeholderModule) placeholderModule.classList.remove('hidden');
                }
            }
        }

        function showFinancePlaceholder(title, description) {
            const titleEl = document.getElementById('finance-placeholder-title');
            const descEl = document.getElementById('finance-placeholder-desc');
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = description || 'This module is currently being built and will be available soon.';
        }

        // Delegate clicks for the primary nav buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-finance-route]');
            if (!btn) return;
            
            const moduleName = btn.getAttribute('data-finance-route');
            if (moduleName === 'task') showFinanceModule('task');
            else if (moduleName === 'expense') showFinanceModule('expense');
            else if (moduleName === 'bills') showFinanceModule('bills');
            else if (moduleName === 'bank') {
                showFinancePlaceholder('Bank Account', 'Bank account management is under development.');
                showFinanceModule('bank');
            }
            else if (moduleName === 'analytics') {
                showFinancePlaceholder('Analytics', 'Comprehensive finance analytics are coming soon.');
                showFinanceModule('analytics');
            }
        });

        // Expense Sub-Buttons
        const btnFinanceAddExpense = document.getElementById('btn-add-expense'); // Existing button ID in view-expense
        const btnFinanceViewExpense = document.getElementById('btn-view-expenses-list');
        const btnFinanceExpenseAnalytics = document.getElementById('btn-finance-expense-analytics');

        // Note: btn-add-expense already has existing listeners, we only bind the new ones safely
        if (btnFinanceViewExpense && !btnFinanceViewExpense.hasAttribute('data-bound')) {
            btnFinanceViewExpense.setAttribute('data-bound', 'true');
            btnFinanceViewExpense.addEventListener('click', () => {
                const formContainer = document.getElementById('expense-form-container');
                if (formContainer) formContainer.classList.add('hidden');
            });
        }

        if (btnFinanceExpenseAnalytics && !btnFinanceExpenseAnalytics.hasAttribute('data-bound')) {
            btnFinanceExpenseAnalytics.setAttribute('data-bound', 'true');
            btnFinanceExpenseAnalytics.addEventListener('click', () => {
                if (typeof showToast === 'function') showToast('Expense Analytics — Coming Soon');
            });
        }

        // Bills Sub-Buttons
        const btnFinanceUpcomingBill = document.getElementById('btn-finance-upcoming-bill');
        const btnFinanceBillAnalytics = document.getElementById('btn-finance-bill-analytics');

        if (btnFinanceUpcomingBill && !btnFinanceUpcomingBill.hasAttribute('data-bound')) {
            btnFinanceUpcomingBill.setAttribute('data-bound', 'true');
            btnFinanceUpcomingBill.addEventListener('click', () => {
                setBillsActiveTab('btn-finance-upcoming-bill');
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');
                if (typeof showToast === 'function') showToast('Upcoming Bills — Coming Soon');
            });
        }

        if (btnFinanceBillAnalytics && !btnFinanceBillAnalytics.hasAttribute('data-bound')) {
            btnFinanceBillAnalytics.setAttribute('data-bound', 'true');
            btnFinanceBillAnalytics.addEventListener('click', () => {
                setBillsActiveTab('btn-finance-bill-analytics');
                hideAllBillViews();
                if (billDefaultState) billDefaultState.classList.remove('hidden');
                if (typeof showToast === 'function') showToast('Bill Analytics — Coming Soon');
            });
        }
        
        // Ensure state resets when entering from sidebar
        const sidebarFinanceBtn = document.getElementById('btn-add-bill-module');
        if (sidebarFinanceBtn && !sidebarFinanceBtn.hasAttribute('data-route-bound')) {
            sidebarFinanceBtn.setAttribute('data-route-bound', 'true');
            sidebarFinanceBtn.addEventListener('click', () => {
                // Delay slightly to let script.js handle the view swap first
                setTimeout(() => {
                    showFinanceModule('bills');
                }, 50);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinanceBillsLogic);
    } else {
        initFinanceBillsLogic();
    }
})();


