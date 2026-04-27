/**
 * finance-category.js
 * Dedicated script for Finance Category Hierarchy
 * Data is stored and retrieved from Supabase table "finance_categories"
 */

(function() {
    // Isolated Data Structure for Finance Categories
    window.financeCategories = [];

    // Helper: UUID
    function generateUUID() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // ─── Supabase: Fetch all finance categories ───
    async function loadFinanceCategoryData() {
        try {
            const { data, error } = await supabase
                .from('finance_categories')
                .select('*');

            if (error) throw error;

            // Map Supabase rows to local format (add client-side id if missing)
            window.financeCategories = (data || []).map(row => ({
                id: row.id ? String(row.id) : generateUUID(),
                main: row.main || null,
                sub1: row.sub1 || null,
                sub2: row.sub2 || null,
                sub3: row.sub_sub_sub_category || row.sub3 || null,
                status: row.status || 'active'
            }));
        } catch (e) {
            console.error("Failed to load finance categories from Supabase:", e);
            alert("Error loading finance categories: " + (e.message || "Unknown error"));
            window.financeCategories = [];
        }
    }

    // ─── Supabase: Insert a single category row ───
    async function insertFinanceCategory(catObj) {
        try {
            const { data, error } = await supabase
                .from('finance_categories')
                .insert([{
                    main: catObj.main || null,
                    sub1: catObj.sub1 || null,
                    sub2: catObj.sub2 || null,
                    sub_sub_sub_category: catObj.sub3 || null,
                    status: catObj.status || 'active'
                }]);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to insert finance category:", e);
            alert("Error saving finance category: " + (e.message || "Unknown error"));
            return false;
        }
    }

    // ─── Supabase: Update status (for archive) ───
    async function updateFinanceCategoryStatus(catObj, newStatus) {
        try {
            // Match by main/sub1/sub2 since the Supabase table may use its own id
            let query = supabase
                .from('finance_categories')
                .update({ status: newStatus });

            // Build filter to find the exact row
            if (catObj.main) query = query.eq('main', catObj.main);
            else query = query.is('main', null);

            if (catObj.sub1) query = query.eq('sub1', catObj.sub1);
            else query = query.is('sub1', null);

            if (catObj.sub2) query = query.eq('sub2', catObj.sub2);
            else query = query.is('sub2', null);

            if (catObj.sub3) query = query.eq('sub_sub_sub_category', catObj.sub3);
            else query = query.is('sub_sub_sub_category', null);

            query = query.eq('status', 'active');

            const { error } = await query;
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to update finance category status:", e);
            alert("Error archiving finance category: " + (e.message || "Unknown error"));
            return false;
        }
    }

    // Helper: Sync Flat Array to Globals for Dropdowns
    function syncFinanceCategoryGlobals() {
        const uniqueMains = [];
        const uniqueSub1 = {};
        const uniqueSub2 = {};
        const uniqueSub3 = {};

        window.financeCategories.filter(c => c.status !== 'archived').forEach(cat => {
            const { main, sub1, sub2, sub3 } = cat;
            if (main && main !== '-') {
                if (!uniqueMains.includes(main)) {
                    uniqueMains.push(main);
                }
                if (sub1 && sub1 !== '-') {
                    if (!uniqueSub1[main]) uniqueSub1[main] = [];
                    if (!uniqueSub1[main].includes(sub1)) {
                        uniqueSub1[main].push(sub1);
                    }
                    
                    if (sub2 && sub2 !== '-') {
                        if (!uniqueSub2[sub1]) uniqueSub2[sub1] = [];
                        if (!uniqueSub2[sub1].includes(sub2)) {
                            uniqueSub2[sub1].push(sub2);
                        }
                        
                        if (sub3 && sub3 !== '-') {
                            if (!uniqueSub3[sub2]) uniqueSub3[sub2] = [];
                            if (!uniqueSub3[sub2].includes(sub3)) {
                                uniqueSub3[sub2].push(sub3);
                            }
                        }
                    }
                }
            }
        });

        // Store internally for population
        window._financeCatGlobals = {
            mains: uniqueMains,
            sub1: uniqueSub1,
            sub2: uniqueSub2,
            sub3: uniqueSub3
        };
        
        // Populate Finance specific dropdowns if any
        if (typeof window.populateFinanceCategoryDropdowns === 'function') {
            window.populateFinanceCategoryDropdowns();
        }
    }

    // ─── Refresh: Fetch from Supabase + sync globals + re-render table ───
    async function refreshFromSupabase() {
        await loadFinanceCategoryData();
        syncFinanceCategoryGlobals();
    }

    window.populateFinanceCategoryDropdowns = function() {
        const _globals = window._financeCatGlobals || { mains: [], sub1: {}, sub2: {} };
        
        if (saveSub3Btn) saveSub3Btn.addEventListener('click', async () => {
            const parentSub2 = subCategory2Select ? subCategory2Select.value : '';
            if (!parentSub2) { notify("⚠ Select Sub Category 2!", '⚠'); return; }
            
            const ref = window.financeCategories.find(c => c.sub2 === parentSub2 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;
            const parentSub1 = ref ? ref.sub1 : null;

            if (await collectAndSaveNew('financeSub3Inputs', 'sub3', [parentMain, parentSub1, parentSub2], "✅ Finance Sub Category 3 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        const financeCat = document.getElementById('mainCategory');
        const financeSub1 = document.getElementById('subCategory1');
        const financeSub2 = document.getElementById('subCategory2');
        const financeSub3 = document.getElementById('subCategory3');

        if (!financeCat) return;

        // Preserve current selection if possible
        const currentCat = financeCat.value;
        const currentSub1 = financeSub1 ? financeSub1.value : '';
        const currentSub2 = financeSub2 ? financeSub2.value : '';
        const currentSub3 = financeSub3 ? financeSub3.value : '';

        // 1. Populate Main Category
        financeCat.innerHTML = '<option value="">Select Main Category</option>';
        _globals.mains.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            financeCat.appendChild(opt);
        });
        financeCat.value = currentCat; // Restore

        // 2. Populate Sub 1 based on selected Main Category
        if (financeSub1) {
            financeSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
            if (financeCat.value && _globals.sub1[financeCat.value]) {
                financeSub1.disabled = false;
                _globals.sub1[financeCat.value].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    financeSub1.appendChild(opt);
                });
                financeSub1.value = currentSub1; // Restore
            } else {
                financeSub1.disabled = true;
            }
        }

        // 3. Populate Sub 2 based on selected Sub 1
        if (financeSub2) {
            financeSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
            if (financeSub1 && financeSub1.value && _globals.sub2[financeSub1.value]) {
                financeSub2.disabled = false;
                _globals.sub2[financeSub1.value].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    financeSub2.appendChild(opt);
                });
                financeSub2.value = currentSub2; // Restore
            } else {
                financeSub2.disabled = true;
            }
        }

        // 4. Populate Sub 3 based on selected Sub 2
        if (financeSub3) {
            financeSub3.innerHTML = '<option value="">Select Sub Category 3</option>';
            if (financeSub2 && financeSub2.value && _globals.sub3[financeSub2.value]) {
                financeSub3.disabled = false;
                _globals.sub3[financeSub2.value].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    financeSub3.appendChild(opt);
                });
                financeSub3.value = currentSub3; // Restore
            } else {
                financeSub3.disabled = true;
            }
        }
    };



    async function initFinanceCategoryLogic() {
        console.log('finance-category.js: initFinanceCategoryLogic called');
        
        // Load from Supabase on init
        await refreshFromSupabase();

        // Header Buttons
        const btnMainShow = document.getElementById('btn-add-finance-main-category');
        const btnSub1Show = document.getElementById('btn-add-finance-sub-category-1');
        const btnSub2Show = document.getElementById('btn-add-finance-sub-category-2');
        const btnViewShow = document.getElementById('btn-view-finance-category-list');
        const btnRefreshList = document.getElementById('btn-refresh-finance-category-list');

        const btnSub3Show = document.getElementById('btn-add-finance-sub-category-3');
        const sub3Form = document.getElementById('financeSubCategory3Form');
        const subCategory2Select = document.getElementById('financeSubCategory2Select');
        const sub3InputsContainer = document.getElementById('financeSub3Inputs');
        const addSub3InputBtn = document.getElementById('addFinanceSub3Input');
        const saveSub3Btn = document.getElementById('saveFinanceSub3');

        
        // Forms / Containers
        const mainForm = document.getElementById('financeMainCategoryForm');
        const sub1Form = document.getElementById('financeSubCategory1Form');
        const sub2Form = document.getElementById('financeSubCategory2Form');
        const listView = document.getElementById('financeCategoryListView');
        const categoryDefaultState = document.getElementById('finance-category-default-state');

        // Main Category Elements
        const mainInputsContainer = document.getElementById('financeCategoryInputs');
        const addMainInputBtn = document.getElementById('addFinanceCategoryInput');
        const saveMainBtn = document.getElementById('saveFinanceCategory');

        // Sub Category 1 Elements
        const mainCategorySelect = document.getElementById('financeMainCategorySelect');
        const sub1InputsContainer = document.getElementById('financeSub1Inputs');
        const addSub1InputBtn = document.getElementById('addFinanceSub1Input');
        const saveSub1Btn = document.getElementById('saveFinanceSub1');

        // Sub Category 2 Elements
        const subCategory1Select = document.getElementById('financeSubCategory1Select');
        const sub2InputsContainer = document.getElementById('financeSub2Inputs');
        const addSub2InputBtn = document.getElementById('addFinanceSub2Input');
        const saveSub2Btn = document.getElementById('saveFinanceSub2');

        // Notification Wrapper
        function notify(msg, icon = '✅') {
            if (window.showToast) {
                window.showToast(msg, icon);
            } else {
                console.log(`Toast fallback: [${icon}] ${msg}`);
                alert(msg);
            }
        }

        function hideAllCategoryForms() {
            [mainForm, sub1Form, sub2Form, sub3Form, listView, categoryDefaultState].forEach(f => {
                if (f) f.classList.add('hidden');
            });
        }

        function resetFormInputs(container, placeholder) {
            if (!container) return;
            container.innerHTML = `
                <input type="text" placeholder="${placeholder}" class="category-input-field" />
            `;
        }

        function updateDropdown(selectId, data, placeholder) {
            const select = document.getElementById(selectId);
            if (!select) return;
            select.innerHTML = `<option value="">Select ${placeholder}</option>`;
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            });
        }

        function loadMainCategories() {
            const _globals = window._financeCatGlobals || { mains: [] };
            updateDropdown('financeMainCategorySelect', _globals.mains, 'Main Category');
        }

        function loadSubCategory1() {
            const _globals = window._financeCatGlobals || { sub1: {} };
            const allSubs = [];
            for (const main in _globals.sub1) {
                _globals.sub1[main].forEach(sub => {
                    if (!allSubs.includes(sub)) allSubs.push(sub);
                });
            }
            updateDropdown('financeSubCategory1Select', allSubs, 'Sub Category 1');
        }

        // --- List Rendering ---
        function renderCategoryTable() {
            const container = document.getElementById('financeCategoryListContent');
            if (!container) return;

            let html = `
                <table class="vendor-table">
                    <thead>
                        
                        <tr>
                            <th>Main Category</th>
                            <th>Sub Category 1</th>
                            <th>Sub Category 2</th>
                            <th>Sub Category 3</th>
                            <th>Actions</th>
                        </tr>

                    </thead>
                    <tbody>
            `;

            const activeCats = window.financeCategories.filter(c => c.status !== 'archived');

            if (activeCats.length === 0) {
                html += '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No finance categories found.</td></tr>';
            } else {
                activeCats.forEach(row => {
                    html += `
                        <tr>
                            <td>${row.main || '-'}</td>
                            <td>${row.sub1 || '-'}</td>
                            <td>${row.sub2 || '-'}</td>
                            <td>${row.sub3 || '-'}</td>
                            <td>
                                <div class="category-actions">
                                    <button class="btn-edit" onclick="event.stopPropagation(); window.editFinanceCategoryRow('${row.id}')">Edit</button>
                                    <button class="btn-archive" onclick="event.stopPropagation(); window.archiveFinanceCategoryRow('${row.id}')">Archive</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        window.archiveFinanceCategoryRow = async function(id) {
            if (!confirm("Are you sure you want to archive this finance category? This cannot be undone.")) return;

            const target = window.financeCategories.find(c => c.id === id);
            if (!target) return;

            const success = await updateFinanceCategoryStatus(target, 'archived');
            if (success) {
                // Refresh from Supabase to get latest state
                await refreshFromSupabase();
                renderCategoryTable();
                notify('🗑️ Finance Category Archived', '🗑️');
            }
        };

        window.editFinanceCategoryRow = function(id) {
            const target = window.financeCategories.find(c => c.id === id);
            if (!target) return;
            
            if (target.sub2 && target.sub2 !== '-') {
                if(btnSub2Show) btnSub2Show.click();
                if(subCategory1Select) subCategory1Select.value = target.sub1;
                const inputs = document.querySelectorAll('#financeSub2Inputs input');
                if (inputs[0]) inputs[0].value = target.sub2;
            } else if (target.sub1 && target.sub1 !== '-') {
                if(btnSub1Show) btnSub1Show.click();
                if(mainCategorySelect) mainCategorySelect.value = target.main;
                const inputs = document.querySelectorAll('#financeSub1Inputs input');
                if (inputs[0]) inputs[0].value = target.sub1;
            } else {
                if(btnMainShow) btnMainShow.click();
                const inputs = document.querySelectorAll('#financeCategoryInputs input');
                if (inputs[0]) inputs[0].value = target.main;
            }
            notify('ℹ️ Edit mode active (Currently saves as duplicate)', 'ℹ️');
        };

        // --- View Switching ---
        if (btnMainShow) btnMainShow.addEventListener('click', () => {
            hideAllCategoryForms();
            resetFormInputs(mainInputsContainer, 'Enter Category Name');
            if (mainForm) mainForm.classList.remove('hidden');
        });

        if (btnSub1Show) btnSub1Show.addEventListener('click', () => {
            hideAllCategoryForms();
            loadMainCategories();
            resetFormInputs(sub1InputsContainer, 'Enter Sub Category 1 Name');
            if (sub1Form) sub1Form.classList.remove('hidden');
        });

        if (btnSub2Show) btnSub2Show.addEventListener('click', () => {
            hideAllCategoryForms();
            loadSubCategory1();
            resetFormInputs(sub2InputsContainer, 'Enter Sub Category 2 Name');
            if (sub2Form) sub2Form.classList.remove('hidden');
        });

        
        function loadSubCategory2() {
            const _globals = window._financeCatGlobals || { sub2: {} };
            const allSubs = [];
            for (const sub1 in _globals.sub2) {
                _globals.sub2[sub1].forEach(sub => {
                    if (!allSubs.includes(sub)) allSubs.push(sub);
                });
            }
            updateDropdown('financeSubCategory2Select', allSubs, 'Sub Category 2');
        }

        if (btnSub3Show) btnSub3Show.addEventListener('click', () => {
            hideAllCategoryForms();
            loadSubCategory2();
            resetFormInputs(sub3InputsContainer, 'Enter Sub Category 3 Name');
            if (sub3Form) sub3Form.classList.remove('hidden');
        });

        if (addSub3InputBtn) addSub3InputBtn.addEventListener('click', () => createInput(sub3InputsContainer, 'Enter Sub Category 3 Name'));

        if (btnViewShow) btnViewShow.addEventListener('click', async () => {
            hideAllCategoryForms();
            if (listView) listView.classList.remove('hidden');
            // Refresh from Supabase before showing list
            await refreshFromSupabase();
            renderCategoryTable();
        });

        if (btnRefreshList) btnRefreshList.addEventListener('click', async () => {
            await refreshFromSupabase();
            renderCategoryTable();
            notify('🔄 List refreshed from database', '🔄');
        });

        // --- Dynamic Adds ---
        function createInput(container, placeholder) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder;
            input.classList.add('category-input-field');
            container.appendChild(input);
        }

        if (addMainInputBtn) addMainInputBtn.addEventListener('click', () => createInput(mainInputsContainer, 'Enter Category Name'));
        if (addSub1InputBtn) addSub1InputBtn.addEventListener('click', () => createInput(sub1InputsContainer, 'Enter Sub Category 1 Name'));
        if (addSub2InputBtn) addSub2InputBtn.addEventListener('click', () => createInput(sub2InputsContainer, 'Enter Sub Category 2 Name'));

        // --- Save Handlers (async — insert into Supabase) ---
        async function collectAndSaveNew(containerId, level, parents, successMsg) {
            const inputs = document.querySelectorAll(`#${containerId} input`);
            const values = [];
            inputs.forEach(i => {
                const v = i.value.trim();
                if (v) values.push(v);
            });

            if (values.length === 0) {
                notify("⚠ Please enter at least one name.", '⚠');
                return false;
            }

            let allSuccess = true;

            for (const val of values) {
                const newCat = {
                    main: level === 'main' ? val : parents[0] || null,
                    sub1: level === 'sub1' ? val : (level === 'sub2' ? parents[1] : null),
                    sub2: level === 'sub2' ? val : (level === 'sub3' ? parents[2] : null),
                    sub3: level === 'sub3' ? val : null,
                    status: 'active'
                };

                const success = await insertFinanceCategory(newCat);
                if (!success) {
                    allSuccess = false;
                }
            }

            if (allSuccess) {
                // Refresh from Supabase to get latest data
                await refreshFromSupabase();
                renderCategoryTable();
                notify(successMsg);
            }

            return allSuccess;
        }

        if (saveMainBtn) saveMainBtn.addEventListener('click', async () => {
            if (await collectAndSaveNew('financeCategoryInputs', 'main', [], "✅ Finance Main Categories saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub1Btn) saveSub1Btn.addEventListener('click', async () => {
            const parent = mainCategorySelect ? mainCategorySelect.value : '';
            if (!parent) { notify("⚠ Select Main Category!", '⚠'); return; }
            if (await collectAndSaveNew('financeSub1Inputs', 'sub1', [parent], "✅ Finance Sub Category 1 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub2Btn) saveSub2Btn.addEventListener('click', async () => {
            const parentSub1 = subCategory1Select ? subCategory1Select.value : '';
            if (!parentSub1) { notify("⚠ Select Sub Category 1!", '⚠'); return; }
            
            const ref = window.financeCategories.find(c => c.sub1 === parentSub1 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;

            if (await collectAndSaveNew('financeSub2Inputs', 'sub2', [parentMain, parentSub1], "✅ Finance Sub Category 2 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        // Initial population of dropdowns in Expense Tracker form
        
        if (saveSub3Btn) saveSub3Btn.addEventListener('click', async () => {
            const parentSub2 = subCategory2Select ? subCategory2Select.value : '';
            if (!parentSub2) { notify("⚠ Select Sub Category 2!", '⚠'); return; }
            
            const ref = window.financeCategories.find(c => c.sub2 === parentSub2 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;
            const parentSub1 = ref ? ref.sub1 : null;

            if (await collectAndSaveNew('financeSub3Inputs', 'sub3', [parentMain, parentSub1, parentSub2], "✅ Finance Sub Category 3 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        const financeCat = document.getElementById('mainCategory');
        if (financeCat) {
            financeCat.addEventListener('change', window.populateFinanceCategoryDropdowns);
        }
        const financeSub1 = document.getElementById('subCategory1');
        if (financeSub1) {
            financeSub1.addEventListener('change', window.populateFinanceCategoryDropdowns);
        }

        const financeSub2Ev = document.getElementById('subCategory2');
        if (financeSub2Ev) {
            financeSub2Ev.addEventListener('change', window.populateFinanceCategoryDropdowns);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinanceCategoryLogic);
    } else {
        initFinanceCategoryLogic();
    }
})();
