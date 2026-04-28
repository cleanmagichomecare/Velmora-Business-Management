/**
 * task-category.js
 * Dedicated script for Task Category Hierarchy with Supabase
 */

console.log('task-category.js Loading...');

(function() {
    // Helper: Notification Wrapper
    function notify(msg, icon = '✅') {
        if (window.showToast) {
            window.showToast(msg, icon);
        } else {
            console.log(`Toast fallback: [${icon}] ${msg}`);
            alert(msg);
        }
    }

    // ==========================================
    // SUPABASE TASK CATEGORY MANAGEMENT SYSTEM
    // ==========================================

        window.insertTaskCategory = async function(category) {
        if (!category) return;

        if (window.currentEditTaskRow) {
            const oldRow = window.currentEditTaskRow;
            const newCat = { category: category.trim() };
            const { error } = await window.supabase.from('task_categories').update(newCat).eq('id', oldRow.id);
            if (!error) {
                await window.cascadeTaskUpdates(oldRow, newCat);
                if(window.showToast) window.showToast("Category updated"); else alert("Category updated");
                window.currentEditTaskRow = null;
                if (window.populateTaskCategoryDropdowns) window.populateTaskCategoryDropdowns();
            } else alert("Update failed");
            return;
        }

        try {
            const { error } = await window.supabase
                .from('task_categories')
                .insert([{
                    category: category.trim(),
                    status: 'active'
                }]);
            if (error) throw error;
            notify("✅ Task Main Category saved!");
            if (window.loadTaskCategories) window.loadTaskCategories('taskMainCategorySelect');
        } catch (e) {
            console.error('Error inserting Task Category:', e);
            notify("❌ Failed to save category", '❌');
            throw e;
        }
    };

        window.insertTaskSubCategory = async function(category, subCategory) {
        if (!category || !subCategory) return;

        if (window.currentEditTaskRow) {
            const oldRow = window.currentEditTaskRow;
            const newCat = { category: category.trim(), sub_category: subCategory.trim() };
            const { error } = await window.supabase.from('task_categories').update(newCat).eq('id', oldRow.id);
            if (!error) {
                await window.cascadeTaskUpdates(oldRow, newCat);
                if(window.showToast) window.showToast("Sub Category updated"); else alert("Sub Category updated");
                window.currentEditTaskRow = null;
            } else alert("Update failed");
            return;
        }

        try {
            const { error } = await window.supabase
                .from('task_categories')
                .insert([{
                    category: category.trim(),
                    sub_category: subCategory.trim(),
                    status: 'active'
                }]);
            if (error) throw error;
            notify("✅ Task Sub Category 1 saved!");
        } catch (e) {
            console.error('Error inserting Task Sub Category 1:', e);
            notify("❌ Failed to save Sub Category 1", '❌');
            throw e;
        }
    };

        window.insertTaskSubSubCategory = async function(category, subCategory, subSubCategory) {
        if (!category || !subCategory || !subSubCategory) return;

        if (window.currentEditTaskRow) {
            const oldRow = window.currentEditTaskRow;
            const newCat = { category: category.trim(), sub_category: subCategory.trim(), sub_sub_category: subSubCategory.trim() };
            const { error } = await window.supabase.from('task_categories').update(newCat).eq('id', oldRow.id);
            if (!error) {
                await window.cascadeTaskUpdates(oldRow, newCat);
                if(window.showToast) window.showToast("Sub Sub Category updated"); else alert("Sub Sub Category updated");
                window.currentEditTaskRow = null;
            } else alert("Update failed");
            return;
        }

        try {
            const { error } = await window.supabase
                .from('task_categories')
                .insert([{
                    category: category.trim(),
                    sub_category: subCategory.trim(),
                    sub_sub_category: subSubCategory.trim(),
                    status: 'active'
                }]);
            if (error) throw error;
            notify("✅ Task Sub Category 2 saved!");
        } catch (e) {
            console.error('Error inserting Task Sub Category 2:', e);
            notify("❌ Failed to save Sub Category 2", '❌');
            throw e;
        }
    };

    // ==========================================
    // DROPDOWN LOADERS
    // ==========================================

    
        window.insertTaskSubSubSubCategory = async function(category, subCategory, subSubCategory, subSubSubCategory) {
        if (!category || !subCategory || !subSubCategory || !subSubSubCategory) return;

        if (window.currentEditTaskRow) {
            const oldRow = window.currentEditTaskRow;
            const newCat = { category: category.trim(), sub_category: subCategory.trim(), sub_sub_category: subSubCategory.trim(), sub_sub_sub_category: subSubSubCategory.trim() };
            const { error } = await window.supabase.from('task_categories').update(newCat).eq('id', oldRow.id);
            if (!error) {
                await window.cascadeTaskUpdates(oldRow, newCat);
                if(window.showToast) window.showToast("Sub Category 3 updated"); else alert("Sub Category 3 updated");
                window.currentEditTaskRow = null;
            } else alert("Update failed");
            return;
        }

        try {
            const { error } = await window.supabase
                .from('task_categories')
                .insert([{
                    category: category.trim(),
                    sub_category: subCategory.trim(),
                    sub_sub_category: subSubCategory.trim(),
                    sub_sub_sub_category: subSubSubCategory.trim(),
                    status: 'active'
                }]);
            if (error) throw error;
            notify("✅ Task Sub Category 3 saved!");
        } catch (e) {
            console.error('Error inserting Task Sub Category 3:', e);
            notify("❌ Failed to save Sub Category 3", '❌');
            throw e;
        }
    };

    window.loadTaskSubSubSubCategories = async function(category, subCategory, subSubCategory, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const previousValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select Sub Category 3</option>';
        if (!category || !subCategory || !subSubCategory) {
            dropdown.disabled = true;
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('sub_sub_sub_category')
                .eq('category', category)
                .eq('sub_category', subCategory)
                .eq('sub_sub_category', subSubCategory)
                .eq('status', 'active')
                .not('sub_sub_sub_category', 'is', null);

            if (error) throw error;

            const uniqueSubSubs = Array.from(new Set(
                data.map(r => r.sub_sub_sub_category).filter(Boolean).map(c => c.trim())
            )).sort();

            uniqueSubSubs.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                dropdown.appendChild(opt);
            });

            dropdown.disabled = false;
            if (previousValue) dropdown.value = previousValue;
        } catch (e) {
            console.error('Error loading Task Sub Categories 3:', e);
        }
    };

    window.loadAllTaskSubSubCategories = async function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select Sub Category 2</option>';
        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('sub_sub_category')
                .eq('status', 'active')
                .not('sub_sub_category', 'is', null);
            if (error) throw error;
            
            const uniqueSubs = Array.from(new Set(data.map(d => d.sub_sub_category).filter(Boolean))).sort();
            uniqueSubs.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                dropdown.appendChild(opt);
            });
        } catch(e) {
            console.error("Error loading All Sub Category 2s", e);
        }
    };

    window.loadTaskCategories = async function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        // Preserve current selection before rebuild
        const previousValue = dropdown.value;

        dropdown.innerHTML = '<option value="">Select Main Category</option>';

        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('category')
                .eq('status', 'active');

            if (error) throw error;

            const uniqueCats = Array.from(new Set(
                data.map(r => r.category).filter(Boolean).map(c => c.trim())
            )).sort();

            uniqueCats.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                dropdown.appendChild(opt);
            });

            // Restore previous selection if it still exists
            if (previousValue) {
                dropdown.value = previousValue;
                console.log(`[loadTaskCategories] Restored "${previousValue}" in #${dropdownId}`);
            }
        } catch (e) {
            console.error('Error loading Task Categories:', e);
        }
    };

    window.loadTaskSubCategories = async function(category, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const previousValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select Sub Category 1</option>';
        if (!category) {
            dropdown.disabled = true;
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('sub_category')
                .eq('category', category)
                .eq('status', 'active')
                .not('sub_category', 'is', null);

            if (error) throw error;

            const uniqueSubs = Array.from(new Set(
                data.map(r => r.sub_category).filter(Boolean).map(c => c.trim())
            )).sort();

            uniqueSubs.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                dropdown.appendChild(opt);
            });

            dropdown.disabled = false;
            if (previousValue) dropdown.value = previousValue;
        } catch (e) {
            console.error('Error loading Task Sub Categories 1:', e);
        }
    };

    window.loadTaskSubSubCategories = async function(category, subCategory, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const previousValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select Sub Category 2</option>';
        if (!category || !subCategory) {
            dropdown.disabled = true;
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('sub_sub_category')
                .eq('category', category)
                .eq('sub_category', subCategory)
                .eq('status', 'active')
                .not('sub_sub_category', 'is', null);

            if (error) throw error;

            const uniqueSubSubs = Array.from(new Set(
                data.map(r => r.sub_sub_category).filter(Boolean).map(c => c.trim())
            )).sort();

            uniqueSubSubs.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                dropdown.appendChild(opt);
            });

            dropdown.disabled = false;
            if (previousValue) dropdown.value = previousValue;
        } catch (e) {
            console.error('Error loading Task Sub Categories 2:', e);
        }
    };

    // Replace old global population call
    window.populateTaskCategoryDropdowns = function() {
        if (window.loadTaskCategories) {
            window.loadTaskCategories('task-category'); // Task manager's dropdown
            window.loadTaskCategories('taskMainCategorySelect'); // Form dropdown
        }
    };

    // ==========================================
    // VIEW SAVED CATEGORY
    // ==========================================
    
    async function renderCategoryTable() {
        const container = document.getElementById('taskCategoryListContent');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding: 40px; color: #888;">Loading categories...</div>';

        try {
            const { data, error } = await window.supabase
                .from('task_categories')
                .select('category, sub_category, sub_sub_category, sub_sub_sub_category')
                .eq('status', 'active');

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color: #888;">No task categories found.</div>';
                return;
            }

            const hierarchy = {};

            data.forEach(row => {
                const main = row.category ? row.category.trim() : null;
                const sub1 = row.sub_category ? row.sub_category.trim() : null;
                const sub2 = row.sub_sub_category ? row.sub_sub_category.trim() : null;
                const sub3 = row.sub_sub_sub_category ? row.sub_sub_sub_category.trim() : null;

                if (!main) return;

                if (!hierarchy[main]) hierarchy[main] = {};

                if (sub1) {
                    if (!hierarchy[main][sub1]) hierarchy[main][sub1] = {};
                    if (sub2) {
                        if (!hierarchy[main][sub1][sub2]) hierarchy[main][sub1][sub2] = new Set();
                        if (sub3) {
                            hierarchy[main][sub1][sub2].add(sub3);
                        }
                    }
                }
            });

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

            Object.keys(hierarchy).sort().forEach(mainCat => {
                const sub1Keys = Object.keys(hierarchy[mainCat]).sort();
                
                if (sub1Keys.length === 0) {
                    html += `
                        <tr class="vendor-category-row">
                            <td style="font-weight: 600; color: #1e293b;">${mainCat}</td>
                            <td style="color: #94a3b8;">-</td>
                            <td style="color: #94a3b8;">-</td>
                            <td style="color: #94a3b8;">-</td>
                            <td>
                                <div class="category-actions">
                                    <button class="btn-archive" onclick="event.stopPropagation(); window.archiveTaskCategory('${mainCat.replace(/'/g, "\\'")}', null, null, null)">Archive</button>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    sub1Keys.forEach(sub1Cat => {
                        const sub2Keys = Object.keys(hierarchy[mainCat][sub1Cat]).sort();

                        if (sub2Keys.length === 0) {
                            html += `
                                <tr class="vendor-category-row">
                                    <td style="font-weight: 600; color: #1e293b;">${mainCat}</td>
                                    <td style="font-weight: 500; color: #334155; padding-left: 20px;">↳ ${sub1Cat}</td>
                                    <td style="color: #94a3b8;">-</td>
                                    <td style="color: #94a3b8;">-</td>
                                    <td>
                                        <div class="category-actions">
                                            <button class="btn-archive" onclick="event.stopPropagation(); window.archiveTaskCategory('${mainCat.replace(/'/g, "\\'")}', '${sub1Cat.replace(/'/g, "\\'")}', null, null)">Archive</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        } else {
                            sub2Keys.forEach(sub2Cat => {
                                const sub3Arr = Array.from(hierarchy[mainCat][sub1Cat][sub2Cat]).sort();
                                
                                if (sub3Arr.length === 0) {
                                    html += `
                                        <tr class="vendor-category-row">
                                            <td style="font-weight: 600; color: #1e293b;">${mainCat}</td>
                                            <td style="font-weight: 500; color: #334155; padding-left: 20px;">↳ ${sub1Cat}</td>
                                            <td style="font-weight: 400; color: #475569; padding-left: 40px;">↳↳ ${sub2Cat}</td>
                                            <td style="color: #94a3b8;">-</td>
                                            <td>
                                                <div class="category-actions">
                                                    <button class="btn-archive" onclick="event.stopPropagation(); window.archiveTaskCategory('${mainCat.replace(/'/g, "\\'")}', '${sub1Cat.replace(/'/g, "\\'")}', '${sub2Cat.replace(/'/g, "\\'")}', null)">Archive</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                } else {
                                    sub3Arr.forEach(sub3Cat => {
                                        html += `
                                            <tr class="vendor-category-row">
                                                <td style="font-weight: 600; color: #1e293b;">${mainCat}</td>
                                                <td style="font-weight: 500; color: #334155; padding-left: 20px;">↳ ${sub1Cat}</td>
                                                <td style="font-weight: 400; color: #475569; padding-left: 40px;">↳↳ ${sub2Cat}</td>
                                                <td style="font-weight: 400; color: #64748b; padding-left: 60px;">↳↳↳ ${sub3Cat}</td>
                                                <td>
                                                    <div class="category-actions">
                                                        <button class="btn-archive" onclick="event.stopPropagation(); window.archiveTaskCategory('${mainCat.replace(/'/g, "\\'")}', '${sub1Cat.replace(/'/g, "\\'")}', '${sub2Cat.replace(/'/g, "\\'")}', '${sub3Cat.replace(/'/g, "\\'")}')">Archive</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    });
                                }
                            });
                        }
                    });
                }
            });

            html += '</tbody></table>';
            container.innerHTML = html;

        } catch (e) {
            console.error("Error rendering task category table:", e);
            container.innerHTML = '<div style="text-align:center; padding: 40px; color: #ff6b6b;">Error loading categories.</div>';
        }
    }

    // ==========================================
    // ARCHIVE LOGIC
    // ==========================================

            window.editTaskCategoryRow = async function(main, sub1, sub2, sub3) {
            window.currentEditTaskRow = null;
            let query = window.supabase.from('task_categories').select('id, category, sub_category, sub_sub_category, sub_sub_sub_category').eq('category', main).eq('status', 'active');
            if (sub1) query = query.eq('sub_category', sub1); else query = query.is('sub_category', null);
            if (sub2) query = query.eq('sub_sub_category', sub2); else query = query.is('sub_sub_category', null);
            if (sub3) query = query.eq('sub_sub_sub_category', sub3); else query = query.is('sub_sub_sub_category', null);
            
            const { data, error } = await query.limit(1);
            if (error || !data || data.length === 0) {
                alert("Error: Could not find the database row for this category.");
                return;
            }
            
            if (sub3) {
                const btn = document.getElementById('btn-add-task-sub-category-3');
                if (btn) btn.click();
                setTimeout(() => {
                    const select = document.getElementById('taskSubCategory2Select');
                    if (select) select.value = sub2;
                    const inputs = document.querySelectorAll('#taskSub3Inputs input');
                    if (inputs[0]) inputs[0].value = sub3;
                }, 500);
            } else if (sub2) {
                const btn = document.getElementById('btn-add-task-sub-category-2');
                if (btn) btn.click();
                setTimeout(() => {
                    const select = document.getElementById('taskSubCategory1Select');
                    if (select) select.value = sub1;
                    const inputs = document.querySelectorAll('#taskSub2Inputs input');
                    if (inputs[0]) inputs[0].value = sub2;
                }, 500);
            } else if (sub1) {
                const btn = document.getElementById('btn-add-task-sub-category-1');
                if (btn) btn.click();
                setTimeout(() => {
                    const select = document.getElementById('taskMainCategorySelect');
                    if (select) select.value = main;
                    const inputs = document.querySelectorAll('#taskSub1Inputs input');
                    if (inputs[0]) inputs[0].value = sub1;
                }, 500);
            } else {
                const btn = document.getElementById('btn-add-task-main-category');
                if (btn) btn.click();
                setTimeout(() => {
                    const inputs = document.querySelectorAll('#taskCategoryInputs input');
                    if (inputs[0]) inputs[0].value = main;
                }, 100);
            }
            if (window.showToast) window.showToast('?? Edit mode active. Modifying existing row.', '??');
        };

        window.cascadeTaskUpdates = async function(oldRow, newCat) {
            if (!oldRow) return;
            try {
                if (oldRow.category && newCat.category && oldRow.category !== newCat.category) {
                    await window.supabase.from('task_categories').update({ category: newCat.category }).eq('category', oldRow.category);
                    oldRow.category = newCat.category;
                }
                if (oldRow.sub_category && newCat.sub_category && oldRow.sub_category !== newCat.sub_category) {
                    await window.supabase.from('task_categories').update({ sub_category: newCat.sub_category }).eq('category', oldRow.category).eq('sub_category', oldRow.sub_category);
                    oldRow.sub_category = newCat.sub_category;
                }
                if (oldRow.sub_sub_category && newCat.sub_sub_category && oldRow.sub_sub_category !== newCat.sub_sub_category) {
                    await window.supabase.from('task_categories').update({ sub_sub_category: newCat.sub_sub_category }).eq('category', oldRow.category).eq('sub_category', oldRow.sub_category).eq('sub_sub_category', oldRow.sub_sub_category);
                }
            } catch (e) {
                console.error("Cascade failed:", e);
            }
        };


        window.archiveTaskCategory = async function(main, sub1, sub2, sub3) {
           if (!confirm("Are you sure you want to archive this category? This cannot be undone.")) return;
        
        try {
            let query = window.supabase
                .from('task_categories')
                .update({ status: 'archived' })
                .eq('category', main);
            
            if (sub1) query = query.eq('sub_category', sub1);
            else query = query.is('sub_category', null);
            
            if (sub2) query = query.eq('sub_sub_category', sub2);
            else query = query.is('sub_sub_category', null);
            
            const { error } = await query;
            if (error) throw error;
            
            notify('🗑️ Task Category Archived', '🗑️');
            renderCategoryTable();
        } catch (e) {
            console.error('Error archiving task category:', e);
            alert("Failed to archive task category");
        }
    };


    // ==========================================
    // UI INITIALIZATION & EVENT LISTENERS
    // ==========================================

    function initTaskCategoryLogic() {
        console.log('task-category.js: initTaskCategoryLogic called');
        
        // Initial population
        window.populateTaskCategoryDropdowns();

        // Header Buttons
        const btnMainShow = document.getElementById('btn-add-task-main-category');
        const btnSub1Show = document.getElementById('btn-add-task-sub-category-1');
        const btnSub2Show = document.getElementById('btn-add-task-sub-category-2');
        const btnViewShow = document.getElementById('btn-view-task-category-list');
        const btnRefreshList = document.getElementById('btn-refresh-task-category-list');
        const btnBackToTaskManager = document.getElementById('btn-back-from-task-category');
        
        // Forms / Containers
        const mainForm = document.getElementById('taskMainCategoryForm');
        const sub1Form = document.getElementById('taskSubCategory1Form');
        const sub2Form = document.getElementById('taskSubCategory2Form');
        
        const btnSub3Show = document.getElementById('btn-add-task-sub-category-3');
        const sub3Form = document.getElementById('taskSubCategory3Form');
        const subCategory2Select = document.getElementById('taskSubCategory2Select');
        const sub3InputsContainer = document.getElementById('taskSub3Inputs');
        const addSub3InputBtn = document.getElementById('addTaskSub3Input');
        const saveSub3Btn = document.getElementById('saveTaskSub3');

        const listView = document.getElementById('taskCategoryListView');
        const categoryDefaultState = document.getElementById('task-category-default-state');

        // Main Category Elements
        const mainInputsContainer = document.getElementById('taskCategoryInputs');
        const addMainInputBtn = document.getElementById('addTaskCategoryInput');
        const saveMainBtn = document.getElementById('saveTaskCategory');

        // Sub Category 1 Elements
        const mainCategorySelect = document.getElementById('taskMainCategorySelect');
        const sub1InputsContainer = document.getElementById('taskSub1Inputs');
        const addSub1InputBtn = document.getElementById('addTaskSub1Input');
        const saveSub1Btn = document.getElementById('saveTaskSub1');

        // Sub Category 2 Elements
        const subCategory1Select = document.getElementById('taskSubCategory1Select');
        const sub2InputsContainer = document.getElementById('taskSub2Inputs');
        const addSub2InputBtn = document.getElementById('addTaskSub2Input');
        const saveSub2Btn = document.getElementById('saveTaskSub2');

        // Routing from Task Manager UI
        const btnAddTaskCategory = document.getElementById('btn-add-category');
        if (btnAddTaskCategory) {
            btnAddTaskCategory.addEventListener('click', () => {
                const viewTask = document.getElementById('view-task');
                const viewTaskCategory = document.getElementById('view-task-category');
                if (viewTask && viewTaskCategory) {
                    viewTask.classList.remove('active-view');
                    viewTask.classList.add('hidden');
                    
                    viewTaskCategory.classList.remove('hidden');
                    viewTaskCategory.classList.add('active-view');
                }
            });
        }

        if (btnBackToTaskManager) {
            btnBackToTaskManager.addEventListener('click', () => {
                const viewTask = document.getElementById('view-task');
                const viewTaskCategory = document.getElementById('view-task-category');
                if (viewTask && viewTaskCategory) {
                    viewTaskCategory.classList.remove('active-view');
                    viewTaskCategory.classList.add('hidden');
                    
                    viewTask.classList.remove('hidden');
                    viewTask.classList.add('active-view');
                }
            });
        }

        function hideAllCategoryForms() {
            window.currentEditTaskRow = null;
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

        // --- View Switching ---
        if (btnMainShow) btnMainShow.addEventListener('click', () => {
            hideAllCategoryForms();
            resetFormInputs(mainInputsContainer, 'Enter Category Name');
            if (mainForm) mainForm.classList.remove('hidden');
        });

        if (btnSub1Show) btnSub1Show.addEventListener('click', () => {
            hideAllCategoryForms();
            window.loadTaskCategories('taskMainCategorySelect');
            resetFormInputs(sub1InputsContainer, 'Enter Sub Category 1 Name');
            if (sub1Form) sub1Form.classList.remove('hidden');
        });

        if (btnSub2Show) btnSub2Show.addEventListener('click', () => {
            hideAllCategoryForms();
            // We need to load all unique sub category 1s regardless of main for this specific flow,
            // or fetch main category automatically during save.
            // Wait, the dropdown in Sub Category 2 form only asks for Sub Category 1!
            // Let's populate subCategory1Select with all active sub_categories.
            const populateAllSub1s = async () => {
                if (!subCategory1Select) return;
                subCategory1Select.innerHTML = '<option value="">Select Sub Category 1</option>';
                try {
                    const { data, error } = await window.supabase
                        .from('task_categories')
                        .select('sub_category')
                        .eq('status', 'active')
                        .not('sub_category', 'is', null);
                    if (error) throw error;
                    
                    const uniqueSubs = Array.from(new Set(data.map(d => d.sub_category).filter(Boolean))).sort();
                    uniqueSubs.forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = sub;
                        subCategory1Select.appendChild(opt);
                    });
                } catch(e) {
                    console.error("Error loading Sub Category 1s", e);
                }
            };
            populateAllSub1s();
            resetFormInputs(sub2InputsContainer, 'Enter Sub Category 2 Name');
            if (sub2Form) sub2Form.classList.remove('hidden');
        });

        
        if (btnSub3Show) btnSub3Show.addEventListener('click', () => {
            hideAllCategoryForms();
            if (window.loadAllTaskSubSubCategories) window.loadAllTaskSubSubCategories('taskSubCategory2Select');
            resetFormInputs(sub3InputsContainer, 'Enter Sub Category 3 Name');
            if (sub3Form) sub3Form.classList.remove('hidden');
        });

        if (addSub3InputBtn) addSub3InputBtn.addEventListener('click', () => createInput(sub3InputsContainer, 'Enter Sub Category 3 Name'));

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
            if (!container) return;
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder;
            input.classList.add('category-input-field');
            container.appendChild(input);
        }

        if (addMainInputBtn) addMainInputBtn.addEventListener('click', () => createInput(mainInputsContainer, 'Enter Category Name'));
        if (addSub1InputBtn) addSub1InputBtn.addEventListener('click', () => createInput(sub1InputsContainer, 'Enter Sub Category 1 Name'));
        if (addSub2InputBtn) addSub2InputBtn.addEventListener('click', () => createInput(sub2InputsContainer, 'Enter Sub Category 2 Name'));

        // --- Save Handlers ---
        if (saveMainBtn) saveMainBtn.addEventListener('click', async () => {
            if (!mainInputsContainer) return;
            const inputs = mainInputsContainer.querySelectorAll('input');
            const values = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
            
            if (values.length === 0) {
                notify("⚠ Please enter at least one Main Category name.", '⚠');
                return;
            }

            for (const val of values) {
                await window.insertTaskCategory(val);
            }
            
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            window.populateTaskCategoryDropdowns();
        });

        if (saveSub1Btn) saveSub1Btn.addEventListener('click', async () => {
            if (!mainCategorySelect || !mainCategorySelect.value) { 
                notify("⚠ Select Main Category!", '⚠'); 
                return; 
            }
            if (!sub1InputsContainer) return;
            const inputs = sub1InputsContainer.querySelectorAll('input');
            const values = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
            
            if (values.length === 0) {
                notify("⚠ Please enter at least one Sub Category 1 name.", '⚠');
                return;
            }

            for (const val of values) {
                await window.insertTaskSubCategory(mainCategorySelect.value, val);
            }
            
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
        });

        if (saveSub2Btn) saveSub2Btn.addEventListener('click', async () => {
            if (!subCategory1Select || !subCategory1Select.value) { 
                notify("⚠ Select Sub Category 1!", '⚠'); 
                return; 
            }
            
            const selectedSub1 = subCategory1Select.value;
            
            if (!sub2InputsContainer) return;
            const inputs = sub2InputsContainer.querySelectorAll('input');
            const values = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
            
            if (values.length === 0) {
                notify("⚠ Please enter at least one Sub Category 2 name.", '⚠');
                return;
            }

            // Fetch Parent Main Category based on selected Sub1
            let mainCatValue = null;
            try {
                const { data, error } = await window.supabase
                    .from('task_categories')
                    .select('category')
                    .eq('sub_category', selectedSub1)
                    .limit(1);
                    
                if (data && data.length > 0) {
                    mainCatValue = data[0].category;
                }
            } catch (e) {
                console.error('Error fetching parent category for Sub Category 1:', e);
            }
            
            if (!mainCatValue) {
                notify("⚠ Could not resolve Main Category for the selected Sub Category 1.", '⚠');
                return;
            }

            for (const val of values) {
                await window.insertTaskSubSubCategory(mainCatValue, selectedSub1, val);
            }
            
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
        });
        
        
        if (saveSub3Btn) saveSub3Btn.addEventListener('click', async () => {
            if (!subCategory2Select || !subCategory2Select.value) { 
                notify("⚠ Select Sub Category 2!", '⚠'); 
                return; 
            }
            
            const selectedSub2 = subCategory2Select.value;
            
            if (!sub3InputsContainer) return;
            const inputs = sub3InputsContainer.querySelectorAll('input');
            const values = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);
            
            if (values.length === 0) {
                notify("⚠ Please enter at least one Sub Category 3 name.", '⚠');
                return;
            }

            // Fetch Parent Main and Sub1 Category based on selected Sub2
            let mainCatValue = null;
            let sub1CatValue = null;
            try {
                const { data, error } = await window.supabase
                    .from('task_categories')
                    .select('category, sub_category')
                    .eq('sub_sub_category', selectedSub2)
                    .limit(1);
                    
                if (data && data.length > 0) {
                    mainCatValue = data[0].category;
                    sub1CatValue = data[0].sub_category;
                }
            } catch (e) {
                console.error('Error fetching parent category for Sub Category 2:', e);
            }
            
            if (!mainCatValue || !sub1CatValue) {
                notify("⚠ Could not resolve parent categories for the selected Sub Category 2.", '⚠');
                return;
            }

            for (const val of values) {
                await window.insertTaskSubSubSubCategory(mainCatValue, sub1CatValue, selectedSub2, val);
            }
            
            hideAllCategoryForms();
            if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
        });

        // Setup dropdown cascading logic for other potential task forms outside this view
        const taskMainDropdown = document.getElementById('task-category'); // Assuming 'task-category' is main category in Task view
        if (taskMainDropdown) {
            taskMainDropdown.addEventListener('change', () => {
                if (window.loadTaskSubCategories) {
                    window.loadTaskSubCategories(taskMainDropdown.value, 'task-sub-category1');
                }
            });
        }
        
        const taskSub1Dropdown = document.getElementById('task-sub-category1');
        if (taskSub1Dropdown) {
            taskSub1Dropdown.addEventListener('change', async () => {
                const mainVal = taskMainDropdown ? taskMainDropdown.value : null;
                const sub1Val = taskSub1Dropdown.value;
                if (window.loadTaskSubSubCategories && mainVal && sub1Val) {
                    window.loadTaskSubSubCategories(mainVal, sub1Val, 'task-sub-category2');
                }
            });
        }

        const taskSub2Dropdown = document.getElementById('task-sub-category2');
        if (taskSub2Dropdown) {
            taskSub2Dropdown.addEventListener('change', async () => {
                const mainVal = taskMainDropdown ? taskMainDropdown.value : null;
                const sub1Val = taskSub1Dropdown ? taskSub1Dropdown.value : null;
                const sub2Val = taskSub2Dropdown.value;
                if (window.loadTaskSubSubSubCategories && mainVal && sub1Val && sub2Val) {
                    window.loadTaskSubSubSubCategories(mainVal, sub1Val, sub2Val, 'task-sub-category3');
                }
            });
        }

    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTaskCategoryLogic);
    } else {
        initTaskCategoryLogic();
    }
})();





