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
        const btnSub2Show = document.getElementById('addSubCategory2Btn');
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

        // Legacy loaders removed as per strict dependency rules.
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
            if (window.loadVendorMainCategories) window.loadVendorMainCategories('mainCategorySelect');
            resetFormInputs(sub1InputsContainer, 'Enter Sub Category 1 Name');
            if (sub1Form) sub1Form.classList.remove('hidden');
        });

        if (btnSub2Show) btnSub2Show.addEventListener('click', () => {
            hideAllCategoryForms();
            if (window.loadVendorMainCategories) window.loadVendorMainCategories('sub2MainCategorySelect');
            resetFormInputs(sub2InputsContainer, 'Enter Sub Category 2 Name');
            if (sub2Form) sub2Form.classList.remove('hidden');
        });

        if (btnSub3Show) btnSub3Show.addEventListener('click', () => {
            hideAllCategoryForms();
            const mainCat = document.getElementById('mainCategorySelect') ? document.getElementById('mainCategorySelect').value : null;
            const sub1 = document.getElementById('subCategory1Select') ? document.getElementById('subCategory1Select').value : null;
            if (window.loadVendorSubSubCategories) window.loadVendorSubSubCategories(mainCat, sub1, 'subCategory2Select');
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

        if (saveMainBtn) saveMainBtn.addEventListener('click', async () => {
            const inputs = document.querySelectorAll('#categoryInputs input');
            for (let i of inputs) {
                const v = i.value.trim();
                if (v) await window.insertCategory(v);
            }
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
        });

        if (saveSub1Btn) saveSub1Btn.addEventListener('click', async () => {
            const dropdown = document.getElementById('mainCategorySelect');
            const parent = dropdown ? dropdown.value : '';
            if (!parent) { alert("Category required"); return; }
            
            const inputs = document.querySelectorAll('#sub1Inputs input');
            for (let i of inputs) {
                const v = i.value.trim();
                if (v) await window.insertSubCategory(parent, v);
            }
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
        });

        if (saveSub2Btn) saveSub2Btn.addEventListener('click', async () => {
            const parentMain = document.getElementById('sub2MainCategorySelect') ? document.getElementById('sub2MainCategorySelect').value : '';
            const parentSub1 = subCategory1Select ? subCategory1Select.value : '';
            if (!parentMain || !parentSub1) { alert("Main Category and Sub Category 1 required"); return; }

            const inputs = document.querySelectorAll('#sub2Inputs input');
            for (let i of inputs) {
                const v = i.value.trim();
                if (v) await window.insertSubSubCategory(parentMain, parentSub1, v);
            }
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
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

// --- Bombproof Global Delegated Listener for Add Sub Category 2 ---
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'addSubCategory2Btn') {
        console.log("Delegated click caught for Sub Category 2");
        const sub2Form = document.getElementById('subCategory2Form');
        
        // Ensure visibility is stripped strictly
        ['mainCategoryForm', 'subCategory1Form', 'subCategory3Form', 'categoryListView', 'category-default-state'].forEach(formId => {
            const el = document.getElementById(formId);
            if (el) el.classList.add('hidden');
        });
        
        if (sub2Form) sub2Form.classList.remove('hidden');

        // Robustly populate Dropdown directly from source data
        const select = document.getElementById('subCategory1Select');
        if (select) {
            let uniqueSub1s = new Set();
            if (window.categories && Array.isArray(window.categories)) {
                window.categories.forEach(cat => {
                    if (cat.status !== 'archived' && cat.sub1 && cat.sub1 !== '-') {
                        uniqueSub1s.add(cat.sub1);
                    }
                });
            }
            
            select.innerHTML = '<option value="">Select Sub Category 1</option>';
            Array.from(uniqueSub1s).forEach(sub1Name => {
                const opt = document.createElement('option');
                opt.value = sub1Name;
                opt.textContent = sub1Name;
                select.appendChild(opt);
            });
        }

        // Reset text input box
        const container = document.getElementById('sub2Inputs');
        if (container) {
            container.innerHTML = '<input type="text" placeholder="Enter Sub Category 2 Name" class="category-input-field" />';
        }
    }
});

// ==========================================
// SUPABASE VENDOR CATEGORY MANAGEMENT SYSTEM
// ==========================================

window.insertCategory = async function(category) {
    if (!category) {
        alert("Category required");
        return;
    }

    console.log("Inserting:", category);

    const { data, error } = await window.supabase
        .from('vendor_categories')
        .insert([
            {
                category: category.trim(),
                status: 'active'
            }
        ]);

    console.log("Response:", data, error);

    if (error) {
        console.error(error);
        alert("Insert failed");
    } else {
        alert("Category saved");
        if (window.loadVendorMainCategories) window.loadVendorMainCategories('mainCategorySelect');
    }
};

window.insertSubCategory = async function(category, subCategory) {
    if (!category || !subCategory) {
        alert("Category required");
        return;
    }

    console.log("Inserting:", category, subCategory);

    const { data, error } = await window.supabase
        .from('vendor_categories')
        .insert([
            {
                category: category.trim(),
                sub_category: subCategory.trim(),
                status: 'active'
            }
        ]);

    console.log("Response:", data, error);

    if (error) {
        console.error(error);
        alert("Insert failed");
    } else {
        alert("Sub Category saved");
    }
};

window.insertSubSubCategory = async function(category, subCategory, subSubCategory) {
    if (!category || !subCategory || !subSubCategory) {
        alert("Category required");
        return;
    }

    console.log("Inserting:", category, subCategory, subSubCategory);

    const { data, error } = await window.supabase
        .from('vendor_categories')
        .insert([
            {
                category: category.trim(),
                sub_category: subCategory.trim(),
                sub_sub_category: subSubCategory.trim(),
                status: 'active'
            }
        ]);

    console.log("Response:", data, error);

    if (error) {
        console.error(error);
        alert("Insert failed");
    } else {
        alert("Sub Sub Category saved");
    }
};

window.loadVendorMainCategories = async function(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error("DOM Binding Error: Dropdown not found with ID:", dropdownId);
        return;
    }

    // Reset dropdown
    dropdown.innerHTML = '<option value="">Select Main Category</option>';

    const { data, error } = await window.supabase
        .from('vendor_categories')
        .select('category');

    console.log("Supabase fetched data for main categories:", data, error);

    if (error) {
        console.error("Query issue:", error);
        return;
    }

    // Remove null + duplicates
    const unique = [...new Set(
        data
            .map(item => item.category)
            .filter(Boolean)
            .map(v => v.trim())
    )];

    console.log("Unique main categories to append:", unique);

    unique.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
    });
};

window.loadVendorSubCategories = async function(category, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select Sub Category 1</option>';

    if (!category) {
        console.log("Missing Main Category. Cannot load Sub Category 1.");
        return;
    }

    try {
        const { data, error } = await window.supabase
            .from('vendor_categories')
            .select('sub_category')
            .eq('category', category)
            .not('sub_category', 'is', null);
            
        console.log(`Supabase fetched data for Sub Category 1 (Category: ${category}):`, data, error);

        if (error) {
            console.error("Query issue:", error);
            return;
        }

        const unique = [...new Set(
            data
                .map(item => item.sub_category)
                .filter(Boolean)
                .map(v => v.trim())
        )];

        console.log("Unique sub category 1 to append:", unique);

        unique.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            dropdown.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading vendor sub categories:', e);
    }
};

window.loadVendorSubSubCategories = async function(category, subCategory, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error("DOM Binding Error: Dropdown not found with ID:", dropdownId);
        return;
    }

    dropdown.innerHTML = '<option value="">Select Sub Category 2</option>';

    if (!category || !subCategory) {
        console.log("Missing Main Category or Sub Category 1. Cannot load Sub Category 2.");
        return;
    }

    try {
        const { data, error } = await window.supabase
            .from('vendor_categories')
            .select('sub_sub_category')
            .eq('category', category)
            .eq('sub_category', subCategory)
            .not('sub_sub_category', 'is', null);
            
        console.log("Supabase fetched data for sub category 2:", data, error);

        if (error) {
            console.error("Query issue:", error);
            return;
        }

        const unique = [...new Set(
            data
                .map(item => item.sub_sub_category)
                .filter(Boolean)
                .map(v => v.trim())
        )];

        console.log("Unique sub category 2 to append:", unique);

        unique.forEach(subSub => {
            const opt = document.createElement('option');
            opt.value = subSub;
            opt.textContent = subSub;
            dropdown.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading vendor sub sub categories:', e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.loadVendorMainCategories) {
        window.loadVendorMainCategories('mainCategorySelect');
    }

    function clearSubCategory2() {
        const subCat2Dropdown = document.getElementById('subCategory2Select');
        if (subCat2Dropdown) {
            subCat2Dropdown.innerHTML = '<option value="">Select Sub Category 2</option>';
        }
        const sub2Inputs = document.getElementById('sub2Inputs');
        if (sub2Inputs) {
            sub2Inputs.innerHTML = '';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Enter Sub Category 2 Name';
            input.classList.add('category-input-field');
            sub2Inputs.appendChild(input);
        }
    }
    
    const mainCatDropdown = document.getElementById('mainCategorySelect');
    if (mainCatDropdown) {
        mainCatDropdown.addEventListener('change', () => {
            console.log("Main Category changed to:", mainCatDropdown.value);
            clearSubCategory2();
            if (window.loadVendorSubCategories) {
                window.loadVendorSubCategories(mainCatDropdown.value, 'subCategory1Select');
            }
        });
    }

    const sub2MainCatDropdown = document.getElementById('sub2MainCategorySelect');
    if (sub2MainCatDropdown) {
        sub2MainCatDropdown.addEventListener('change', () => {
            console.log("Sub 2 Form - Main Category changed to:", sub2MainCatDropdown.value);
            clearSubCategory2();
            if (window.loadVendorSubCategories) {
                window.loadVendorSubCategories(sub2MainCatDropdown.value, 'subCategory1Select');
            }
        });
    }

    const subCat1Dropdown = document.getElementById('subCategory1Select');
    if (subCat1Dropdown) {
        subCat1Dropdown.addEventListener('change', () => {
            clearSubCategory2();
            
            let mainCatValue = null;
            const sub2Form = document.getElementById('subCategory2Form');
            if (sub2Form && !sub2Form.classList.contains('hidden')) {
                mainCatValue = sub2MainCatDropdown ? sub2MainCatDropdown.value : null;
            } else {
                mainCatValue = mainCatDropdown ? mainCatDropdown.value : null;
            }
            
            console.log("Sub Category 1 changed to:", subCat1Dropdown.value);
            if (window.loadVendorSubSubCategories) {
                window.loadVendorSubSubCategories(mainCatValue, subCat1Dropdown.value, 'subCategory2Select');
            }
        });
    }
});
