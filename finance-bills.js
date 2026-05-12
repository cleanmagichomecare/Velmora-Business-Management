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
            const billAnalyticsContainer = document.getElementById('bill-analytics-container');
            [addBillFormContainer, billListContainer, billDefaultState, billAnalyticsContainer].forEach(el => {
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
                    const haystack = `${bill.main_category} ${bill.sub_category1} ${bill.sub_category2} ${bill.sub_category3 || ''} ${bill.payment_type}`.toLowerCase();
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

            card.innerHTML = `
                <div class="bill-card-header">
                    <div class="bill-card-header-left">
                        <h3 style="margin:0; font-size: 16px; color: var(--text-main); font-weight: 600;">
                            ${bill.main_category || '-'}
                        </h3>
                        <div style="font-size: 12px; color: var(--text-muted);">
                            ${bill.sub_category1 || ''} 
                            ${bill.sub_category2 ? ' › ' + bill.sub_category2 : ''}
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                            <span class="${pTypeBadgeClass}">${pType}</span>
                            <span class="${statusBadgeClass}">${bStatus}</span>
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
                    <div class="grid-2" style="column-gap: 24px; row-gap: 4px;">
                        <div class="info-group"><label>Amount</label><div class="info-val" data-field="amount" style="font-weight: 600; font-size: 15px; color: var(--text-main);">₹${bill.amount != null ? bill.amount : '-'}</div></div>
                        <div class="info-group"><label>Mode of Pay</label><div class="info-val" data-field="mode_of_pay">${bill.mode_of_pay || '-'}</div></div>
                        
                        <div class="info-group"><label>Billing Cycle</label><div class="info-val" data-field="billing_cycle">${bill.billing_cycle || '-'}</div></div>
                        <div class="info-group"><label>Account</label><div class="info-val" data-field="account">${bill.account || '-'}</div></div>
                        
                        <div class="info-group"><label>Payment Type</label><div class="info-val" data-field="payment_type">${bill.payment_type || '-'}</div></div>
                        <div class="info-group"><label>Email</label><div class="info-val" data-field="email">${bill.email || '-'}</div></div>
                        
                        <div class="info-group"><label>Due Date</label><div class="info-val" data-field="due_date">${formatDate(bill.due_date)}</div></div>
                        <div class="info-group"><label>Notes</label><div class="info-val" data-field="notes">${bill.notes || '-'}</div></div>
                    </div>
                    <div class="hidden category-edit-group mt-15">
                        <div style="font-size: 13px; font-weight: 600; color: var(--primary-color); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">Edit Categories</div>
                        <div class="grid-2">
                            <div class="info-group" style="margin:0;"><label>Main Category</label><div class="info-val" data-field="main_category">${bill.main_category || ''}</div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 1</label><div class="info-val" data-field="sub_category1">${bill.sub_category1 || ''}</div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 2</label><div class="info-val" data-field="sub_category2">${bill.sub_category2 || ''}</div></div>
                            <div class="info-group" style="margin:0;"><label>Sub Category 3</label><div class="info-val" data-field="sub_category3">${bill.sub_category3 || ''}</div></div>
                            <div class="info-group" style="margin:0;"><label>Due Date</label><div class="info-val" data-field="due_date">${bill.due_date || ''}</div></div>
                            <div class="info-group" style="margin:0;"><label>Bill Status</label><div class="info-val" data-field="bill_status">${bStatus}</div></div>
                        </div>
                    </div>
                </div>
            `;

            const btnEdit = card.querySelector('.btn-edit-bill');
            const btnSave = card.querySelector('.btn-save-bill-inline');
            const btnCancel = card.querySelector('.btn-cancel-bill-inline');
            const btnDelete = card.querySelector('.btn-delete-bill');

            btnDelete.addEventListener('click', async () => {
                await window.archiveBill(bill.id);
            });

            btnEdit.addEventListener('click', () => {
                if (window.currentlyEditingBillId && window.currentlyEditingBillId !== bill.id) {
                    if (window.showToast) window.showToast('⚠ Finish editing current bill first');
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
                    const valDiv = body.querySelector(`.info-val[data-field="${f}"]`);
                    if (valDiv) {
                        const val = valDiv.textContent.replace('₹', '') === '-' ? '' : valDiv.textContent.replace('₹', '').trim();
                        if (f === 'notes') {
                            valDiv.innerHTML = `<textarea class="edit-input" data-edit="${f}" rows="2" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-family: inherit;">${val}</textarea>`;
                        } else if (f === 'due_date') {
                            valDiv.innerHTML = `<input type="date" class="edit-input" data-edit="${f}" value="${val}" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">`;
                        } else if (f === 'amount') {
                            valDiv.innerHTML = `<input type="number" class="edit-input" data-edit="${f}" value="${val}" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">`;
                        } else {
                            valDiv.innerHTML = `<input type="text" class="edit-input" data-edit="${f}" value="${val}" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);">`;
                        }
                    }
                });

                const selects = {
                    'payment_type': ['Manual', 'Autopay'],
                    'mode_of_pay': ['GPay', 'Account Transfer', 'Cash', 'Card'],
                    'bill_status': ['Pending', 'Paid', 'Overdue']
                };
                Object.keys(selects).forEach(f => {
                    const valDiv = body.querySelector(`.info-val[data-field="${f}"]`);
                    if (valDiv) {
                        const currentVal = valDiv.textContent === '-' ? '' : valDiv.textContent.trim();
                        let options = selects[f].map(opt => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('');
                        valDiv.innerHTML = `<select class="edit-input" data-edit="${f}" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select</option>${options}</select>`;
                    }
                });

                const mainDiv = body.querySelector('.info-val[data-field="main_category"]');
                const sub1Div = body.querySelector('.info-val[data-field="sub_category1"]');
                const sub2Div = body.querySelector('.info-val[data-field="sub_category2"]');
                const sub3Div = body.querySelector('.info-val[data-field="sub_category3"]');

                let mainOptions = globals.mains.map(m => `<option value="${m}" ${m === bill.main_category ? 'selected' : ''}>${m}</option>`).join('');
                mainDiv.innerHTML = `<select class="edit-input" data-edit="main_category" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Main Category</option>${mainOptions}</select>`;
                sub1Div.innerHTML = `<select class="edit-input" data-edit="sub_category1" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Sub Category 1</option></select>`;
                sub2Div.innerHTML = `<select class="edit-input" data-edit="sub_category2" style="width: 100%; border-radius: 6px; padding: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main);"><option value="">Select Sub Category 2</option></select>`;
                
                const sub3Id = 'edit-sub3-' + bill.id;
                sub3Div.innerHTML = `
                    <div class="multi-select-container" id="container-${sub3Id}">
                        <div class="multi-select-display disabled" tabindex="0">
                            <span class="multi-select-value multi-select-placeholder">Select Sub Category 3</span>
                            <svg class="multi-select-arrow" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div class="multi-select-dropdown hidden"></div>
                        <input type="hidden" class="edit-input" data-edit="sub_category3" id="${sub3Id}" value="${bill.sub_category3 || ''}">
                    </div>
                `;

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
                    
                    if (window.showToast) window.showToast('✅ Bill updated successfully');
                } catch (error) {
                    console.error('Update failed:', error);
                    if (window.showToast) window.showToast('❌ Failed to update bill');
                    else alert('Failed to update bill');
                    
                    btnSave.textContent = 'Save';
                    btnSave.disabled = false;
                    btnCancel.disabled = false;
                }
            });
        };

        // ========== Bill Analytics ==========
        window._billDoughnutChart = null;
        window._drilldownDoughnutChart = null;
        window._analyticsBills = [];
        window._selectedMainCategory = null;

        const formatINR = (val) => '₹' + Number(val).toLocaleString('en-IN');

        // Secondary palette for drilldown chart
        const drilldownPalette = [
            '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16',
            '#e11d48', '#a855f7', '#3b82f6', '#f59e0b', '#22c55e',
            '#ec4899', '#6366f1', '#10b981', '#ef4444'
        ];

        window.renderBillAnalytics = async function() {
            const canvas = document.getElementById('billCategoryDoughnut');
            const legendEl = document.getElementById('billCategoryLegend');
            const centerNum = document.getElementById('doughnutCenterNumber');
            if (!canvas || !legendEl) return;

            // Fetch fresh bill data for analytics
            let bills = window.financeBills || [];
            if (bills.length === 0) {
                try {
                    const { data, error } = await window.supabase
                        .from('finance_bills')
                        .select('*');
                    if (!error && data) {
                        bills = data.filter(b => b.status !== 'archived');
                    }
                } catch (e) {
                    console.error('Analytics fetch error:', e);
                }
            }
            window._analyticsBills = bills;

            // Group by main_category → SUM(amount) + COUNT
            const categoryMap = {};
            bills.forEach(bill => {
                const cat = bill.main_category || 'Uncategorized';
                if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
                categoryMap[cat].amount += Number(bill.amount || 0);
                categoryMap[cat].count += 1;
            });

            const labels = Object.keys(categoryMap);
            const amounts = labels.map(l => categoryMap[l].amount);
            const counts = labels.map(l => categoryMap[l].count);
            const total = amounts.reduce((a, b) => a + b, 0);

            // Premium color palette
            const palette = [
                '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6',
                '#ec4899', '#14b8a6', '#a855f7', '#f97316', '#06b6d4',
                '#84cc16', '#e11d48', '#8b5cf6', '#10b981'
            ];

            // Update center number with ₹ formatted total
            if (centerNum) centerNum.textContent = formatINR(total);

            // Destroy old chart if exists
            if (window._billDoughnutChart) {
                window._billDoughnutChart.destroy();
                window._billDoughnutChart = null;
            }

            // Render doughnut
            const ctx = canvas.getContext('2d');
            window._billDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: palette.slice(0, labels.length),
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${formatINR(context.raw)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 800
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            const idx = elements[0].index;
                            const cat = labels[idx];
                            selectMainCategory(cat);
                        }
                    }
                }
            });

            // Render legend with click handlers
            legendEl.innerHTML = '';
            labels.forEach((label, i) => {
                const color = palette[i % palette.length];
                const amt = amounts[i];
                const cnt = counts[i];
                const item = document.createElement('div');
                item.className = 'analytics-legend-item clickable';
                item.setAttribute('data-category', label);
                item.innerHTML = `
                    <div class="legend-label">
                        <span class="legend-dot" style="background: ${color};"></span>
                        <span>${label}</span>
                    </div>
                    <span class="legend-count">${formatINR(amt)} <span style="color: var(--text-muted); font-weight: 500; font-size: 0.8rem;">| ${cnt} Bill${cnt !== 1 ? 's' : ''}</span></span>
                `;
                item.addEventListener('click', () => selectMainCategory(label));
                legendEl.appendChild(item);
            });

            // Empty state
            if (labels.length === 0) {
                legendEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No bill data available yet.</p>';
            }

            // Auto-select largest category
            if (labels.length > 0) {
                let maxIdx = 0;
                amounts.forEach((a, i) => { if (a > amounts[maxIdx]) maxIdx = i; });
                selectMainCategory(labels[maxIdx]);
            }
        };

        function selectMainCategory(category) {
            window._selectedMainCategory = category;

            // Highlight active legend item
            const legendEl = document.getElementById('billCategoryLegend');
            if (legendEl) {
                legendEl.querySelectorAll('.analytics-legend-item').forEach(el => {
                    el.classList.toggle('active', el.getAttribute('data-category') === category);
                });
            }

            // Hide Level 3 when switching main category
            const level3Container = document.getElementById('bill-level3-container');
            if (level3Container) level3Container.classList.add('hidden');

            // Render drilldown
            renderDrilldown(category);
        }

        // Third palette for Level 3 chart
        const level3Palette = [
            '#f43f5e', '#0ea5e9', '#d946ef', '#eab308', '#22d3ee',
            '#a3e635', '#fb923c', '#818cf8', '#2dd4bf', '#f472b6',
            '#38bdf8', '#facc15', '#c084fc', '#34d399'
        ];

        window._level3DoughnutChart = null;

        function renderDrilldown(mainCategory) {
            const titleEl = document.getElementById('drilldownTitle');
            const canvas = document.getElementById('billDrilldownDoughnut');
            const legendEl = document.getElementById('billDrilldownLegend');
            const centerNum = document.getElementById('drilldownCenterNumber');
            if (!canvas || !legendEl) return;

            // Update title
            if (titleEl) titleEl.textContent = mainCategory + ' Breakdown';

            // Filter bills for this main category
            const filtered = (window._analyticsBills || []).filter(
                b => (b.main_category || 'Uncategorized') === mainCategory
            );

            // Group by sub_category1 → SUM(amount) + COUNT
            const subMap = {};
            filtered.forEach(bill => {
                const sub = bill.sub_category1 || 'Other';
                if (!subMap[sub]) subMap[sub] = { amount: 0, count: 0 };
                subMap[sub].amount += Number(bill.amount || 0);
                subMap[sub].count += 1;
            });

            const labels = Object.keys(subMap);
            const amounts = labels.map(l => subMap[l].amount);
            const counts = labels.map(l => subMap[l].count);
            const total = amounts.reduce((a, b) => a + b, 0);

            // Update center
            if (centerNum) centerNum.textContent = formatINR(total);

            // Destroy old drilldown chart
            if (window._drilldownDoughnutChart) {
                window._drilldownDoughnutChart.destroy();
                window._drilldownDoughnutChart = null;
            }

            // Empty state
            if (labels.length === 0) {
                canvas.style.display = 'none';
                const centerLabel = document.getElementById('drilldownCenterLabel');
                if (centerLabel) centerLabel.style.display = 'none';
                legendEl.innerHTML = `
                    <div class="drilldown-empty">
                        <div class="drilldown-empty-icon">📭</div>
                        <p>No breakdown data available for ${mainCategory}.</p>
                    </div>
                `;
                return;
            }

            canvas.style.display = 'block';
            const centerLabel = document.getElementById('drilldownCenterLabel');
            if (centerLabel) centerLabel.style.display = 'flex';

            // Render drilldown doughnut
            const ctx = canvas.getContext('2d');
            window._drilldownDoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: drilldownPalette.slice(0, labels.length),
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${formatINR(context.raw)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 600
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            const idx = elements[0].index;
                            selectSubCategory(mainCategory, labels[idx]);
                        }
                    }
                }
            });

            // Render drilldown legend (clickable)
            legendEl.innerHTML = '';
            labels.forEach((label, i) => {
                const color = drilldownPalette[i % drilldownPalette.length];
                const amt = amounts[i];
                const cnt = counts[i];
                const item = document.createElement('div');
                item.className = 'analytics-legend-item clickable';
                item.setAttribute('data-subcategory', label);
                item.innerHTML = `
                    <div class="legend-label">
                        <span class="legend-dot" style="background: ${color};"></span>
                        <span>${label}</span>
                    </div>
                    <span class="legend-count">${formatINR(amt)} <span style="color: var(--text-muted); font-weight: 500; font-size: 0.8rem;">| ${cnt} Bill${cnt !== 1 ? 's' : ''}</span></span>
                `;
                item.addEventListener('click', () => selectSubCategory(mainCategory, label));
                legendEl.appendChild(item);
            });

            // Auto-select the largest sub-category
            if (labels.length > 0) {
                let maxIdx = 0;
                amounts.forEach((a, i) => { if (a > amounts[maxIdx]) maxIdx = i; });
                selectSubCategory(mainCategory, labels[maxIdx]);
            }
        }

        function selectSubCategory(mainCategory, subCategory) {
            // Highlight active sub-category legend item
            const legendEl = document.getElementById('billDrilldownLegend');
            if (legendEl) {
                legendEl.querySelectorAll('.analytics-legend-item').forEach(el => {
                    el.classList.toggle('active', el.getAttribute('data-subcategory') === subCategory);
                });
            }

            // Show and render Level 3
            const level3Container = document.getElementById('bill-level3-container');
            if (level3Container) level3Container.classList.remove('hidden');

            renderLevel3Drilldown(mainCategory, subCategory);
        }

        function renderLevel3Drilldown(mainCategory, subCategory) {
            const titleEl = document.getElementById('level3Title');
            const legendTitleEl = document.getElementById('level3LegendTitle');
            const canvas = document.getElementById('billLevel3Doughnut');
            const legendEl = document.getElementById('billLevel3Legend');
            const centerNum = document.getElementById('level3CenterNumber');
            if (!canvas || !legendEl) return;



            // Update titles
            if (titleEl) titleEl.textContent = subCategory + ' Breakdown';
            if (legendTitleEl) legendTitleEl.textContent = subCategory + ' Details';

            // Filter bills: main_category + sub_category1
            const filtered = (window._analyticsBills || []).filter(
                b => (b.main_category || 'Uncategorized') === mainCategory &&
                     (b.sub_category1 || 'Other') === subCategory
            );

            // Group by sub_category2 → SUM(amount) + COUNT
            const deepMap = {};
            filtered.forEach(bill => {
                const key = bill.sub_category2 && bill.sub_category2.trim() ? bill.sub_category2.trim() : 'Other';
                if (!deepMap[key]) deepMap[key] = { amount: 0, count: 0 };
                deepMap[key].amount += Number(bill.amount || 0);
                deepMap[key].count += 1;
            });

            const labels = Object.keys(deepMap);
            const amounts = labels.map(l => deepMap[l].amount);
            const counts = labels.map(l => deepMap[l].count);
            const total = amounts.reduce((a, b) => a + b, 0);

            // Update center
            if (centerNum) centerNum.textContent = formatINR(total);

            // Destroy old Level 3 chart
            if (window._level3DoughnutChart) {
                window._level3DoughnutChart.destroy();
                window._level3DoughnutChart = null;
            }

            // Empty state
            if (labels.length === 0 || (labels.length === 1 && labels[0] === 'Other')) {
                canvas.style.display = 'none';
                const centerLabel = document.getElementById('level3CenterLabel');
                if (centerLabel) centerLabel.style.display = 'none';
                legendEl.innerHTML = `
                    <div class="drilldown-empty">
                        <div class="drilldown-empty-icon">📭</div>
                        <p>No deeper breakdown available for ${subCategory}.</p>
                    </div>
                `;
                return;
            }

            canvas.style.display = 'block';
            const centerLabel = document.getElementById('level3CenterLabel');
            if (centerLabel) centerLabel.style.display = 'flex';

            // Render Level 3 doughnut
            const ctx = canvas.getContext('2d');
            window._level3DoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: level3Palette.slice(0, labels.length),
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${formatINR(context.raw)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 600
                    }
                }
            });

            // Render Level 3 legend (clickable → updates right panel)
            legendEl.innerHTML = '';
            labels.forEach((label, i) => {
                const color = level3Palette[i % level3Palette.length];
                const amt = amounts[i];
                const cnt = counts[i];
                const item = document.createElement('div');
                item.className = 'analytics-legend-item clickable';
                item.setAttribute('data-sub2category', label);
                item.innerHTML = `
                    <div class="legend-label">
                        <span class="legend-dot" style="background: ${color};"></span>
                        <span>${label}</span>
                    </div>
                    <span class="legend-count">${formatINR(amt)} <span style="color: var(--text-muted); font-weight: 500; font-size: 0.8rem;">| ${cnt} Bill${cnt !== 1 ? 's' : ''}</span></span>
                `;
                item.addEventListener('click', () => selectSub2Category(mainCategory, subCategory, label));
                legendEl.appendChild(item);
            });

            // Auto-select largest sub_category2
            if (labels.length > 0) {
                let maxIdx = 0;
                amounts.forEach((a, i) => { if (a > amounts[maxIdx]) maxIdx = i; });
                selectSub2Category(mainCategory, subCategory, labels[maxIdx]);
            } else {
                // Clear right panel if no sub2 data
                const titleEl4 = document.getElementById('level4Title');
                if (titleEl4) titleEl4.textContent = 'No Data Available';
                const legendEl4 = document.getElementById('billLevel4Legend');
                if (legendEl4) legendEl4.innerHTML = '';
                const barCanvas = document.getElementById('billLevel4Bar');
                if (barCanvas) barCanvas.style.display = 'none';
            }
        }

        // Level 4 palette
        const level4Palette = [
            '#e879f9', '#67e8f9', '#fbbf24', '#a78bfa', '#34d399',
            '#fb7185', '#38bdf8', '#bef264', '#f9a8d4', '#5eead4',
            '#fca5a5', '#93c5fd', '#d9f99d', '#c4b5fd'
        ];

        window._level4DoughnutChart = null;

        function selectSub2Category(mainCategory, sub1, sub2) {
            const legendEl = document.getElementById('billLevel3Legend');
            if (legendEl) {
                legendEl.querySelectorAll('.analytics-legend-item').forEach(el => {
                    el.classList.toggle('active', el.getAttribute('data-sub2category') === sub2);
                });
            }
            renderLevel4Doughnut(mainCategory, sub1, sub2);
        }

        function renderLevel4Doughnut(mainCategory, sub1, sub2) {
            const titleEl = document.getElementById('level4Title');
            const canvas = document.getElementById('billLevel4Doughnut');
            const legendEl = document.getElementById('billLevel4Legend');
            const centerNum = document.getElementById('level4CenterNumber');
            if (!canvas || !legendEl) return;

            if (titleEl) titleEl.textContent = sub2 + ' Details';

            // Filter bills
            const filtered = (window._analyticsBills || []).filter(
                b => (b.main_category || 'Uncategorized') === mainCategory &&
                     (b.sub_category1 || 'Other') === sub1 &&
                     (b.sub_category2 || 'Other') === sub2
            );

            // Group by sub_category3
            const sub3Map = {};
            filtered.forEach(bill => {
                const key = bill.sub_category3 && bill.sub_category3.trim() ? bill.sub_category3.trim() : '';
                if (!key) return;
                if (!sub3Map[key]) sub3Map[key] = { amount: 0, count: 0 };
                sub3Map[key].amount += Number(bill.amount || 0);
                sub3Map[key].count += 1;
            });

            const labels = Object.keys(sub3Map);
            const amounts = labels.map(l => sub3Map[l].amount);
            const counts = labels.map(l => sub3Map[l].count);
            const total = amounts.reduce((a, b) => a + b, 0);

            if (centerNum) centerNum.textContent = formatINR(total);

            // Destroy old chart
            if (window._level4DoughnutChart) {
                window._level4DoughnutChart.destroy();
                window._level4DoughnutChart = null;
            }

            // Empty state
            if (labels.length === 0) {
                canvas.style.display = 'none';
                const cl = document.getElementById('level4CenterLabel');
                if (cl) cl.style.display = 'none';
                legendEl.innerHTML = `
                    <div class="drilldown-empty">
                        <div class="drilldown-empty-icon">📭</div>
                        <p>No deeper breakdown available for ${sub2}.</p>
                    </div>
                `;
                return;
            }

            canvas.style.display = 'block';
            const cl = document.getElementById('level4CenterLabel');
            if (cl) cl.style.display = 'flex';
            const colors = labels.map((_, i) => level4Palette[i % level4Palette.length]);

            const ctx = canvas.getContext('2d');
            window._level4DoughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: amounts,
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 13, weight: '600' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${formatINR(context.raw)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 600
                    }
                }
            });

            // Render legend
            legendEl.innerHTML = '';
            labels.forEach((label, i) => {
                const color = colors[i];
                const amt = amounts[i];
                const cnt = counts[i];
                legendEl.innerHTML += `
                    <div class="analytics-legend-item">
                        <div class="legend-label">
                            <span class="legend-dot" style="background: ${color};"></span>
                            <span>${label}</span>
                        </div>
                        <span class="legend-count">${formatINR(amt)} <span style="color: var(--text-muted); font-weight: 500; font-size: 0.8rem;">| ${cnt} Bill${cnt !== 1 ? 's' : ''}</span></span>
                    </div>
                `;
            });
        }

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

        function showBillsView(viewName) {
            hideAllBillViews();
            
            const addBillFormContainer = document.getElementById('add-bill-form-container');
            const billListContainer = document.getElementById('bill-list-container');
            const billDefaultState = document.getElementById('bill-default-state');

            if (viewName === 'add') {
                setBillsActiveTab('btn-show-add-bill-form');
                if (addBillFormContainer) {
                    addBillFormContainer.classList.remove('hidden');
                    const addBillForm = document.getElementById('add-bill-form');
                    if (addBillForm) addBillForm.reset();
                    if (typeof populateBillCategories === 'function') populateBillCategories();
                }
            } else if (viewName === 'view') {
                setBillsActiveTab('btn-view-bills-list');
                if (billListContainer) {
                    billListContainer.classList.remove('hidden');
                    const billSearchInput = document.getElementById('bill-search');
                    if (billSearchInput) billSearchInput.value = ''; // Clear search on open
                    if (typeof window.fetchBillsData === 'function') window.fetchBillsData();
                }
            } else if (viewName === 'upcoming') {
                setBillsActiveTab('btn-finance-upcoming-bill');
                if (billDefaultState) billDefaultState.classList.remove('hidden');
                if (typeof showToast === 'function') showToast('Upcoming Bills — Coming Soon');
            } else if (viewName === 'analytics') {
                setBillsActiveTab('btn-finance-bill-analytics');
                const billAnalyticsContainer = document.getElementById('bill-analytics-container');
                if (billAnalyticsContainer) {
                    billAnalyticsContainer.classList.remove('hidden');
                    window.renderBillAnalytics();
                }
            } else if (viewName === 'default') {
                setBillsActiveTab(null);
                if (billDefaultState) billDefaultState.classList.remove('hidden');
            }
        }

        document.addEventListener('click', (e) => {
            // Bills Navigation
            if (e.target.closest('#btn-show-add-bill-form')) {
                console.log('Add Bill clicked');
                showBillsView('add');
            } else if (e.target.closest('#btn-view-bills-list')) {
                console.log('View Bills clicked');
                showBillsView('view');
            } else if (e.target.closest('#btn-finance-upcoming-bill')) {
                console.log('Upcoming Bills clicked');
                showBillsView('upcoming');
            } else if (e.target.closest('#btn-finance-bill-analytics')) {
                console.log('Bill Analytics clicked');
                showBillsView('analytics');
            } else if (e.target.closest('#btn-cancel-bill')) {
                showBillsView('default');
            }

            // Expense Navigation
            if (e.target.closest('#btn-view-expenses-list')) {
                console.log('View Expenses clicked');
                const formContainer = document.getElementById('expense-form-container');
                if (formContainer) formContainer.classList.add('hidden');
            } else if (e.target.closest('#btn-finance-expense-analytics')) {
                console.log('Expense Analytics clicked');
                if (typeof showToast === 'function') showToast('Expense Analytics — Coming Soon');
            }
        });

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

        // Expense Sub-Buttons (Migrated to central delegated click handler)

        // Bills Sub-Buttons (Migrated to central delegated click handler)
        
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


