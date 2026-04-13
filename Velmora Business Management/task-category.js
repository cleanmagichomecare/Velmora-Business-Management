/**
 * task-category.js
 * Dedicated script for Task Category Hierarchy
 */

console.log('task-category.js Loading...');

(function() {
    // NEW Data Structure: True Row-Based Objects for Task Categories
    window.taskCategories = [];

    // Helper: UUID
    function generateUUID() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Storage interactions
    function loadTaskCategoryData() {
        try {
            const data = localStorage.getItem('taskCategoryData');
            if (data) {
                window.taskCategories = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load taskCategoryData:", e);
            window.taskCategories = [];
        }
    }

    function saveTaskCategoryData() {
        localStorage.setItem('taskCategoryData', JSON.stringify(window.taskCategories));
        syncTaskCategoryGlobals();
    }

    // Helper: Sync Flat Array to Globals for Dropdowns
    function syncTaskCategoryGlobals() {
        const uniqueMains = [];
        const uniqueSub1 = {};
        const uniqueSub2 = {};

        window.taskCategories.filter(c => c.status !== 'archived').forEach(cat => {
            const { main, sub1, sub2 } = cat;
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
                    }
                }
            }
        });

        // Store internally for population
        window._taskCatGlobals = {
            mains: uniqueMains,
            sub1: uniqueSub1,
            sub2: uniqueSub2
        };
        
        // Populate specific dropdowns
        if (typeof window.populateTaskCategoryDropdowns === 'function') {
            window.populateTaskCategoryDropdowns();
        }
    }

    window.populateTaskCategoryDropdowns = function() {
        const _globals = window._taskCatGlobals || { mains: [], sub1: {}, sub2: {} };
        const taskCat = document.getElementById('task-category');
        const taskSub1 = document.getElementById('task-sub-category1');
        const taskSub2 = document.getElementById('task-sub-category2');

        if (!taskCat) return;

        // Preserve current selection if possible
        const currentCat = taskCat.value;
        const currentSub1 = taskSub1 ? taskSub1.value : '';
        const currentSub2 = taskSub2 ? taskSub2.value : '';

        // 1. Populate Department (Main Category)
        taskCat.innerHTML = '<option value="">Select Department</option>';
        _globals.mains.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            taskCat.appendChild(opt);
        });
        taskCat.value = currentCat; // Restore

        // 2. Populate Sub 1 based on selected Department
        if (taskSub1) {
            taskSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
            if (taskCat.value && _globals.sub1[taskCat.value]) {
                taskSub1.disabled = false;
                _globals.sub1[taskCat.value].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    taskSub1.appendChild(opt);
                });
                taskSub1.value = currentSub1; // Restore
            } else {
                taskSub1.disabled = true;
            }
        }

        // 3. Populate Sub 2 based on selected Sub 1
        if (taskSub2) {
            taskSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
            if (taskSub1 && taskSub1.value && _globals.sub2[taskSub1.value]) {
                taskSub2.disabled = false;
                _globals.sub2[taskSub1.value].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    taskSub2.appendChild(opt);
                });
                taskSub2.value = currentSub2; // Restore
            } else {
                taskSub2.disabled = true;
            }
        }
    };


    function initTaskCategoryLogic() {
        console.log('task-category.js: initTaskCategoryLogic called');
        
        loadTaskCategoryData();
        syncTaskCategoryGlobals();

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
        const btnAddTaskCategory = document.getElementById('btn-add-category'); // + Add Task Category button in View Task
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
            [mainForm, sub1Form, sub2Form, listView, categoryDefaultState].forEach(f => {
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
            const _globals = window._taskCatGlobals || { mains: [] };
            updateDropdown('taskMainCategorySelect', _globals.mains, 'Main Category');
        }

        function loadSubCategory1() {
            const _globals = window._taskCatGlobals || { sub1: {} };
            const allSubs = [];
            for (const main in _globals.sub1) {
                _globals.sub1[main].forEach(sub => {
                    if (!allSubs.includes(sub)) allSubs.push(sub);
                });
            }
            updateDropdown('taskSubCategory1Select', allSubs, 'Sub Category 1');
        }

        // --- List Rendering ---
        function renderCategoryTable() {
            const container = document.getElementById('taskCategoryListContent');
            if (!container) return;

            let html = `
                <table class="vendor-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Sub Category 1</th>
                            <th>Sub Category 2</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            const activeCats = window.taskCategories.filter(c => c.status !== 'archived');

            if (activeCats.length === 0) {
                html += '<tr><td colspan="4" style="text-align:center; padding: 40px; color: #888;">No task categories found.</td></tr>';
            } else {
                activeCats.forEach(row => {
                    html += `
                        <tr>
                            <td>${row.main || '-'}</td>
                            <td>${row.sub1 || '-'}</td>
                            <td>${row.sub2 || '-'}</td>
                            <td>
                                <div class="category-actions">
                                    <button class="btn-edit" onclick="event.stopPropagation(); window.editTaskCategoryRow('${row.id}')">Edit</button>
                                    <button class="btn-archive" onclick="event.stopPropagation(); window.archiveTaskCategoryRow('${row.id}')">Archive</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        window.archiveTaskCategoryRow = function(id) {
            if (!confirm("Are you sure you want to archive this task category? This cannot be undone.")) return;

            const targetIdx = window.taskCategories.findIndex(c => c.id === id);
            if (targetIdx !== -1) {
                window.taskCategories[targetIdx].status = 'archived';
                saveTaskCategoryData();
                renderCategoryTable();
                notify('🗑️ Task Category Archived', '🗑️');
            }
        };

        window.editTaskCategoryRow = function(id) {
            const target = window.taskCategories.find(c => c.id === id);
            if (!target) return;
            
            if (target.sub2 && target.sub2 !== '-') {
                if(btnSub2Show) btnSub2Show.click();
                if(subCategory1Select) subCategory1Select.value = target.sub1;
                const inputs = document.querySelectorAll('#taskSub2Inputs input');
                if (inputs[0]) inputs[0].value = target.sub2;
            } else if (target.sub1 && target.sub1 !== '-') {
                if(btnSub1Show) btnSub1Show.click();
                if(mainCategorySelect) mainCategorySelect.value = target.main;
                const inputs = document.querySelectorAll('#taskSub1Inputs input');
                if (inputs[0]) inputs[0].value = target.sub1;
            } else {
                if(btnMainShow) btnMainShow.click();
                const inputs = document.querySelectorAll('#taskCategoryInputs input');
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
                    if (level === 'sub1') targetCat = window.taskCategories.find(c => c.main === parents[0] && (!c.sub1 || c.sub1 === '-') && c.status !== 'archived');
                    else if (level === 'sub2') targetCat = window.taskCategories.find(c => c.sub1 === parents[1] && (!c.sub2 || c.sub2 === '-') && c.status !== 'archived');
                }

                if (targetCat) {
                    if (level === 'sub1') targetCat.sub1 = val;
                    if (level === 'sub2') targetCat.sub2 = val;
                } else {
                    const newCat = {
                        id: generateUUID(),
                        main: level === 'main' ? val : parents[0] || null,
                        sub1: level === 'sub1' ? val : (level === 'sub2' ? parents[1] : null),
                        sub2: level === 'sub2' ? val : null,
                        status: 'active'
                    };
                    window.taskCategories.push(newCat);
                }
            });

            saveTaskCategoryData();
            renderCategoryTable();
            notify(successMsg);
            return true;
        }

        if (saveMainBtn) saveMainBtn.addEventListener('click', () => {
            if (collectAndSaveNew('taskCategoryInputs', 'main', [], "✅ Task Main Categories saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub1Btn) saveSub1Btn.addEventListener('click', () => {
            const parent = mainCategorySelect ? mainCategorySelect.value : '';
            if (!parent) { notify("⚠ Select Main Category!", '⚠'); return; }
            if (collectAndSaveNew('taskSub1Inputs', 'sub1', [parent], "✅ Task Sub Category 1 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });

        if (saveSub2Btn) saveSub2Btn.addEventListener('click', () => {
            const parentSub1 = subCategory1Select ? subCategory1Select.value : '';
            if (!parentSub1) { notify("⚠ Select Sub Category 1!", '⚠'); return; }
            
            const ref = window.taskCategories.find(c => c.sub1 === parentSub1 && c.status !== 'archived');
            const parentMain = ref ? ref.main : null;

            if (collectAndSaveNew('taskSub2Inputs', 'sub2', [parentMain, parentSub1], "✅ Task Sub Category 2 saved!")) {
                hideAllCategoryForms();
                if (categoryDefaultState) categoryDefaultState.classList.remove('hidden');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTaskCategoryLogic);
    } else {
        initTaskCategoryLogic();
    }
})();
