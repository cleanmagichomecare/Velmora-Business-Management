/**
 * category.js
 * Dedicated script for Category Management Hierarchy
 */

console.log('category.js Loading...');

(function() {
    // Legacy Data Structures for dropdown compatibilities
    window.mainCategories = window.mainCategories || [];
    window.subCategory1 = window.subCategory1 || {};
    window.subCategory2 = window.subCategory2 || {};
    window.subCategory3 = window.subCategory3 || {};
    
    // NEW Data Structure: True Row-Based Objects
    window.categories = window.categories || [];

    // Storage interactions
    function loadCategoryData() {
        try {
            const data = localStorage.getItem('categoryData');
            if (data) {
                window.categories = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load categoryData:", e);
        }
    }

    function saveCategoryData() {
        localStorage.setItem('categoryData', JSON.stringify(window.categories));
    }

    // Helper: UUID
    function generateUUID() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Helper: Sync Flat Array to Legacy Grouped Arrays
    function syncCategoryGlobals() {
        window.mainCategories.length = 0; // Clear array while keeping reference
        for (let key in window.subCategory1) delete window.subCategory1[key];
        for (let key in window.subCategory2) delete window.subCategory2[key];
        for (let key in window.subCategory3) delete window.subCategory3[key];

        window.categories.filter(c => c.status !== 'archived').forEach(cat => {
            const { main, sub1, sub2, sub3 } = cat;
            if (main && main !== '-') {
                if (!window.mainCategories.includes(main)) {
                    window.mainCategories.push(main);
                }
                if (sub1 && sub1 !== '-') {
                    if (!window.subCategory1[main]) window.subCategory1[main] = [];
                    if (!window.subCategory1[main].includes(sub1)) {
                        window.subCategory1[main].push(sub1);
                    }
                    
                    if (sub2 && sub2 !== '-') {
                        if (!window.subCategory2[sub1]) window.subCategory2[sub1] = [];
                        if (!window.subCategory2[sub1].includes(sub2)) {
                            window.subCategory2[sub1].push(sub2);
                        }

                        if (sub3 && sub3 !== '-') {
                            if (!window.subCategory3[sub2]) window.subCategory3[sub2] = [];
                            if (!window.subCategory3[sub2].includes(sub3)) {
                                window.subCategory3[sub2].push(sub3);
                            }
                        }
                    }
                }
            }
        });
        
        // Let legacy forms know
        if (typeof window.refreshVendorCategoryDropdown === 'function') {
            window.refreshVendorCategoryDropdown();
        }
    }

    function initCategoryLogic() {
        console.log('ANTIGRAVITY_CHECK: initCategoryLogic called');
        
        loadCategoryData();
        
        // Initial sync to ensure legacy structures are populated if data exists
        syncCategoryGlobals();

        // Header Buttons
        const btnMainShow = document.getElementById('btn-add-main-category');
        const btnSub1Show = document.getElementById('btn-add-sub-category-1');
        const btnSub2Show = document.getElementById('btn-add-sub-category-2');
        const btnSub3Show = document.getElementById('btn-add-sub-category-3');
        const btnViewShow = document.getElementById('btn-view-category-list');
        const btnRefreshList = document.getElementById('btn-refresh-category-list');
        
        // Forms / Containers
        const mainForm = document.getElementById('mainCategoryForm');
        const sub1Form = document.getElementById('subCategory1Form');
        const sub2Form = document.getElementById('subCategory2Form');
        const sub3Form = document.getElementById('subCategory3Form');
        const listView = document.getElementById('categoryListView');
        const categoryDefaultState = document.getElementById('category-default-state');

        // Main Category Elements
        const mainInputsContainer = document.getElementById('categoryInputs');
        const addMainInputBtn = document.getElementById('addCategoryInput');
        const saveMainBtn = document.getElementById('saveCategory');

        // Sub Category 1 Elements
        const mainCategorySelect = document.getElementById('mainCategorySelect');
        const sub1InputsContainer = document.getElementById('sub1Inputs');
        const addSub1InputBtn = document.getElementById('addSub1Input');
        const saveSub1Btn = document.getElementById('saveSub1');

        // Sub Category 2 Elements
        const subCategory1Select = document.getElementById('subCategory1Select');
        const sub2InputsContainer = document.getElementById('sub2Inputs');
        const addSub2InputBtn = document.getElementById('addSub2Input');
        const saveSub2Btn = document.getElementById('saveSub2');

        // Sub Category 3 Elements
        const subCategory2Select = document.getElementById('subCategory2Select');
        const sub3InputsContainer = document.getElementById('sub3Inputs');
        const addSub3InputBtn = document.getElementById('addSub3Input');
        const saveSub3Btn = document.getElementById('saveSub3');

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
            updateDropdown('mainCategorySelect', window.mainCategories, 'Main Category');
        }

        function loadSubCategory1() {
            const allSubs = [];
            for (const main in window.subCategory1) {
                window.subCategory1[main].forEach(sub => {
                    if (!allSubs.includes(sub)) allSubs.push(sub);
                });
            }
            updateDropdown('subCategory1Select', allSubs, 'Sub Category 1');
        }

        function loadSubCategory2() {
            const allSubs = [];
            for (const sub1 in window.subCategory2) {
                window.subCategory2[sub1].forEach(sub => {
                    if (!allSubs.includes(sub)) allSubs.push(sub);
                });
            }
            updateDropdown('subCategory2Select', allSubs, 'Sub Category 2');
        }

        // --- List Rendering ---
        function renderCategoryTable() {
            const container = document.getElementById('categoryListContent');
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

            const activeCats = window.categories.filter(c => c.status !== 'archived');

            if (activeCats.length === 0) {
                html += '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No categories found.</td></tr>';
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
                                    <button class="btn-edit" onclick="event.stopPropagation(); window.editCategoryRow('${row.id}')">Edit</button>
                                    <button class="btn-archive" onclick="event.stopPropagation(); window.archiveCategoryRow('${row.id}')">Archive</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        window.archiveCategoryRow = function(id) {
            if (!confirm("Are you sure you want to archive this category row? This cannot be undone.")) return;

            const targetIdx = window.categories.findIndex(c => c.id === id);
            if (targetIdx !== -1) {
                window.categories[targetIdx].status = 'archived';
                saveCategoryData();
                syncCategoryGlobals();
                renderCategoryTable();
                notify('🗑️ Category Archived & Removed', '🗑️');
            }
        };

        window.editCategoryRow = function(id) {
            const target = window.categories.find(c => c.id === id);
            if (!target) return;
            
            // Logic to open correct form based on deepest level
            if (target.sub3 && target.sub3 !== '-') {
                if(btnSub3Show) btnSub3Show.click();
                if(subCategory2Select) subCategory2Select.value = target.sub2;
                const inputs = document.querySelectorAll('#sub3Inputs input');
                if (inputs[0]) inputs[0].value = target.sub3;
            } else if (target.sub2 && target.sub2 !== '-') {
                if(btnSub2Show) btnSub2Show.click();
                if(subCategory1Select) subCategory1Select.value = target.sub1;
                const inputs = document.querySelectorAll('#sub2Inputs input');
                if (inputs[0]) inputs[0].value = target.sub2;
            } else if (target.sub1 && target.sub1 !== '-') {
                if(btnSub1Show) btnSub1Show.click();
                if(mainCategorySelect) mainCategorySelect.value = target.main;
                const inputs = document.querySelectorAll('#sub1Inputs input');
                if (inputs[0]) inputs[0].value = target.sub1;
            } else {
                if(btnMainShow) btnMainShow.click();
                const inputs = document.querySelectorAll('#categoryInputs input');
                if (inputs[0]) inputs[0].value = target.main;
            }
            // For true edits it would need to save under the same ID instead of duplicating
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

        // Removed internal listener for Sub Category 2 as per user request to handle it externally for debugging and timing overrides.

        if (btnSub3Show) btnSub3Show.addEventListener('click', () => {
            hideAllCategoryForms();
            loadSubCategory2();
            resetFormInputs(sub3InputsContainer, 'Enter Sub Category 3 Name');
            if (sub3Form) sub3Form.classList.remove('hidden');
        });

        if (btnViewShow) btnViewShow.addEventListener('click', () => {
            hideAllCategoryForms();
            if (listView) listView.classList.remove('hidden');
            renderCategoryTable();
        });

        if (btnRefreshList) btnRefreshList.addEventListener('click', () => {
            renderCategoryTable();
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
        if (addSub3InputBtn) addSub3InputBtn.addEventListener('click', () => createInput(sub3InputsContainer, 'Enter Sub Category 3 Name'));

        // --- Save Handlers ---
        function collectAndSaveNew(containerId, level, parents, successMsg) {
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

            values.forEach((val, idx) => {
                let targetCat = null;
                // Try to append into an empty parent slot on the first index
                if (idx === 0) {
                    if (level === 'sub1') targetCat = window.categories.find(c => c.main === parents[0] && (!c.sub1 || c.sub1 === '-') && c.status !== 'archived');
                    else if (level === 'sub2') targetCat = window.categories.find(c => c.sub1 === parents[1] && (!c.sub2 || c.sub2 === '-') && c.status !== 'archived');
                    else if (level === 'sub3') targetCat = window.categories.find(c => c.sub2 === parents[2] && (!c.sub3 || c.sub3 === '-') && c.status !== 'archived');
                }

                if (targetCat) {
                    if (level === 'sub1') targetCat.sub1 = val;
                    if (level === 'sub2') targetCat.sub2 = val;
                    if (level === 'sub3') targetCat.sub3 = val;
                } else {
                    const newCat = {
                        id: generateUUID(),
                        main: level === 'main' ? val : parents[0] || null,
                        sub1: level === 'sub1' ? val : (level === 'sub2' || level === 'sub3' ? parents[1] : null),
                        sub2: level === 'sub2' ? val : (level === 'sub3' ? parents[2] : null),
                        sub3: level === 'sub3' ? val : null,
                        status: 'active'
                    };
                    window.categories.push(newCat);
                }
            });

            saveCategoryData();
            syncCategoryGlobals();
            renderCategoryTable();
            notify(successMsg);
            return true;
        }

        if (saveMainBtn) saveMainBtn.addEventListener('click', () => {
            if (collectAndSaveNew('categoryInputs', 'main', [], "✅ Main Categories saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub1Btn) saveSub1Btn.addEventListener('click', () => {
            const parent = mainCategorySelect ? mainCategorySelect.value : '';
            if (!parent) { notify("⚠ Select Main Category!", '⚠'); return; }
            if (collectAndSaveNew('sub1Inputs', 'sub1', [parent], "✅ Sub Category 1 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub2Btn) saveSub2Btn.addEventListener('click', () => {
            const parentSub1 = subCategory1Select ? subCategory1Select.value : '';
            if (!parentSub1) { notify("⚠ Select Sub Category 1!", '⚠'); return; }
            
            const ref = window.categories.find(c => c.sub1 === parentSub1 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;

            if (collectAndSaveNew('sub2Inputs', 'sub2', [parentMain, parentSub1], "✅ Sub Category 2 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub3Btn) saveSub3Btn.addEventListener('click', () => {
            const parentSub2 = subCategory2Select ? subCategory2Select.value : '';
            if (!parentSub2) { notify("⚠ Select Sub Category 2!", '⚠'); return; }
            
            const ref = window.categories.find(c => c.sub2 === parentSub2 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;
            const parentSub1 = ref ? ref.sub1 : null;

            if (collectAndSaveNew('sub3Inputs', 'sub3', [parentMain, parentSub1, parentSub2], "✅ Sub Category 3 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryLogic);
    } else {
        initCategoryLogic();
    }
})();

// --- Debug & External Event Handler for Sub Category 2 Button ---
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('addSubCategory2Btn');
    if (btn) {
        btn.addEventListener('click', showSubCategory2Form);
    } else {
        console.error("Button not found");
    }
});

function showSubCategory2Form() {
    console.log("Sub Category 2 button clicked");

    const form = document.getElementById('subCategory2Form');
    console.log("Form element:", form);

    if (!form) {
        console.error("Form not found");
        return;
    }

    // Hide all other forms explicitly
    const formsToHide = [
        'mainCategoryForm',
        'subCategory1Form',
        'subCategory3Form',
        'categoryListView',
        'category-default-state'
    ];
    
    formsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Show correct form
    form.classList.remove('hidden');

    // Restore required inner functionality
    if (typeof window.subCategory1 !== 'undefined') {
        const allSubs = [];
        for (const main in window.subCategory1) {
            window.subCategory1[main].forEach(sub => {
                if (!allSubs.includes(sub)) allSubs.push(sub);
            });
        }
        const select = document.getElementById('subCategory1Select');
        if (select) {
            select.innerHTML = '<option value="">Select Sub Category 1</option>';
            allSubs.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            });
        }
    }
    
    const sub2InputsContainer = document.getElementById('sub2Inputs');
    if (sub2InputsContainer) {
        sub2InputsContainer.innerHTML = '<input type="text" placeholder="Enter Sub Category 2 Name" class="category-input-field" />';
    }
}
