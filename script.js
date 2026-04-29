window.influencerData = [];
window.dispatchRecords = [];
window.mainCategories = window.mainCategories || [];
window.subCategory1 = window.subCategory1 || {};
window.subCategory2 = window.subCategory2 || {};
window.subCategory3 = window.subCategory3 || {};

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Navigation Injection ---
    // Remove any hardcoded global nav group to prevent duplicates
    const globalNav = document.querySelector('#content-views > .dept-nav-group');
    if (globalNav) globalNav.remove();

    // Inject into all content views except home and dashboard
    document.querySelectorAll('.content-view').forEach(view => {
        if (view.id === 'view-home' || view.id === 'view-dashboard') return;
        
        // Remove any existing hardcoded ones in specific headers to avoid duplicates
        const existingNavs = view.querySelectorAll('.dept-nav-group');
        existingNavs.forEach(nav => nav.remove());

        // Inject the standard dual-button group at the top
        const navHtml = `
            <div class="dept-nav-group" style="display:flex;">
                <button type="button" class="dept-nav-btn dept-back-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back
                </button>
                <button type="button" class="dept-nav-btn dept-home-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    Home
                </button>
            </div>
        `;
        view.insertAdjacentHTML('afterbegin', navHtml);
    });

    // --- Core UI Elements ---
    const landingPage = document.getElementById('landing-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const brandBtn = document.getElementById('brand-btn');
    const backBtn = document.getElementById('back-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const cards = document.querySelectorAll('.sidebar-item, .active-item');
    const contentViews = document.querySelectorAll('.content-view');

    // --- Vendor Management Selectors ---
    const btnAddVendor = document.getElementById('btn-add-vendor');
    const vendorFormContainer = document.getElementById('vendor-form-container');
    const vendorForm = document.getElementById('vendor-form');
    const vendorListContainer = document.getElementById('vendor-list-container');
    const vendorCategorySelect = document.getElementById('vendorCategory');
    const vendorSubCategorySelect = document.getElementById('subCategory');
    const vendorSubSubCategorySelect = document.getElementById('subSubCategory');
    const vendorSubCategoryLabel = document.getElementById('vendor-sub-category-label');
    const vendorSubSubLabel = document.getElementById('vendor-sub-sub-label');

    // --- Category Dropdown Helpers ---
    function populateVendorDropdown(select, data, placeholder) {
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        if (data && Array.isArray(data)) {
            data.forEach(opt => {
                const optEl = document.createElement('option');
                optEl.value = opt;
                optEl.textContent = opt;
                select.appendChild(optEl);
            });
        }
    }

    // Load Vendor Main Categories dynamically from Supabase
    async function loadVendorCategories() {
        if (!vendorCategorySelect) return;
        
        vendorCategorySelect.innerHTML = '<option value="">Loading...</option>';
        
        try {
            const { data, error } = await supabase
                .from('finance_categories')
                .select('main');
                
            if (error) throw error;
            
            vendorCategorySelect.innerHTML = '<option value="">Select Category</option>';
            
            const uniqueMains = [...new Set(data.map(row => row.main).filter(Boolean).map(v => v.trim()).filter(v => v !== '-'))];
            
            uniqueMains.forEach(main => {
                const opt = document.createElement('option');
                opt.value = main;
                opt.textContent = main;
                vendorCategorySelect.appendChild(opt);
            });
            
        } catch (err) {
            console.error("Failed to load vendor categories", err);
            vendorCategorySelect.innerHTML = '<option value="">Select Category</option>';
        }
    }
    
    loadVendorCategories();

    // Navigation functions
    function showDashboard() {
        if (landingPage) {
            landingPage.classList.remove('fade-in');
            landingPage.classList.add('fade-out');
        }

        setTimeout(() => {
            if (landingPage) {
                landingPage.style.display = 'none';
                landingPage.classList.add('hidden');
                landingPage.classList.remove('active', 'fade-out');
            }

            if (dashboardPage) {
                dashboardPage.style.display = 'flex';
                dashboardPage.classList.remove('hidden');
                dashboardPage.classList.add('active', 'stage-enter');

                cards.forEach(card => {
                    card.classList.remove('animate-in');
                    card.style.animationDelay = '0s';
                });

                void dashboardPage.offsetWidth;
                dashboardPage.classList.add('fade-in');

                cards.forEach((card, index) => {
                    card.style.animationDelay = `${index * 0.05 + 0.2}s`;
                    card.classList.add('animate-in');
                });
            }
        }, 400);
    }

    const brandSelectBtns = document.querySelectorAll('.brand-select-btn');
    brandSelectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            let selectedBrand = e.target.getAttribute('data-brand') || e.target.textContent || 'Justmixx';
            window.selectedBrand = selectedBrand;
            console.log('Brand selected:', selectedBrand);
            
            // Call showDashboard which handles the CSS animations and display toggles
            showDashboard();
        });
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (dashboardPage) {
                dashboardPage.classList.add('hidden');
                dashboardPage.classList.remove('active', 'fade-in');
            }
            if (landingPage) {
                landingPage.classList.remove('hidden');
                landingPage.classList.add('active', 'fade-in');
            }
        });
    }

    // View Switching Logic
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const expenseSidebar = document.getElementById('expenseSidebar');
    const vendorSidebar = document.getElementById('vendorSidebar');

    function hideAllSidebars() {
        document.querySelectorAll(".sub-sidebar").forEach(el => {
            el.classList.add("hidden");
        });
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active-item'));
            item.classList.add('active-item');
            hideAllSidebars();

            // Exit focused department view when clicking main sidebar items
            const dashLayout = document.querySelector('.dashboard-layout');
            if (dashLayout) dashLayout.classList.remove('department-view-active');

            if (item.classList.contains('expense-btn')) {
                if (expenseSidebar) expenseSidebar.classList.remove('hidden');
            } else if (item.classList.contains('vendor-management-btn')) {
                if (vendorSidebar) vendorSidebar.classList.remove('hidden');
            }

            const targetId = item.getAttribute('data-target');
            if (targetId) {
                contentViews.forEach(view => {
                    view.classList.remove('active-view');
                    view.classList.add('hidden');
                });
                const activeView = document.getElementById(targetId);
                if (activeView) {
                    activeView.classList.remove('hidden');
                    activeView.classList.add('active-view');
                }

                // Department Notification Logic
                const deptMap = {
                    'view-inventory': 'Inventory',
                    'view-sales': 'Sales',
                    'view-document': 'Document Room',
                    'view-marketing': 'Marketing',
                    'view-expense': 'Expense Tracker',
                    'view-vendor': 'Vendor Management',
                    'view-category': 'Category',
                    'view-research': 'Research & Development',
                    'view-hr': 'Human Resources',
                    'view-logistics': 'Logistics',
                    'view-operations': 'Operations'
                };

                const mappedDept = deptMap[targetId];
                if (mappedDept && window.tasks && window.shownNotifications) {
                    const deptTasks = window.tasks.filter(t => t.assignedTo === mappedDept && t.status !== 'Completed');
                    if (deptTasks.length > 0 && !window.shownNotifications[mappedDept]) {
                        window.shownNotifications[mappedDept] = true;
                        if (typeof window.showDeptToast === 'function') {
                            window.showDeptToast(mappedDept, deptTasks.length);
                        }
                    }
                }
            }
        });
    });

    // Reset marketing view when sidebar Marketing is clicked
    const marketingSidebarBtn = document.querySelector('[data-target="view-marketing"]');
    if (marketingSidebarBtn) {
        marketingSidebarBtn.addEventListener('click', () => {
            const mOptions = document.getElementById('marketing-options');
            const iDashboard = document.getElementById('influencer-dashboard');
            if (mOptions && iDashboard) {
                mOptions.classList.remove('hidden');
                iDashboard.classList.add('hidden');
            }
        });
    }

    // --- Home Card Navigation ---
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.home-card');
        if (!card) return;

        const targetId = card.getAttribute('data-navigate');


        // Placeholder cards (no view yet)
        if (!targetId) {
            const title = card.querySelector('.home-card-title');
            const name = title ? title.textContent : 'This module';
            if (typeof showToast === 'function') showToast(`${name} — Coming Soon`);
            return;
        }

        // Hide all sub-sidebars
        hideAllSidebars();

        // Show sub-sidebar for expense/vendor if needed
        if (targetId === 'view-expense' && expenseSidebar) {
            expenseSidebar.classList.remove('hidden');
            if (typeof setExpenseSidebarActive === 'function') {
                setExpenseSidebarActive(btnExpenseModule);
            }
        } else if (targetId === 'view-vendor' && vendorSidebar) {
            vendorSidebar.classList.remove('hidden');
        }

        // Switch content views
        contentViews.forEach(view => {
            view.classList.remove('active-view');
            view.classList.add('hidden');
        });
        // Also hide the home view (since it was queried at load and is in contentViews)
        const homeView = document.getElementById('view-home');
        if (homeView) {
            homeView.classList.remove('active-view');
            homeView.classList.add('hidden');
        }
        const settingsView = document.getElementById('view-settings');
        if (settingsView) {
            settingsView.classList.remove('active-view');
            settingsView.classList.add('hidden');
        }

        const activeView = document.getElementById(targetId);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active-view');
        }

        // Update sidebar active state — deselect Home
        sidebarItems.forEach(i => i.classList.remove('active-item'));

        // Activate focused department view (hide main sidebar)
        const nonFocusedViews = ['view-home', 'view-dashboard', 'view-settings'];
        const dashLayout = document.querySelector('.dashboard-layout');
        if (dashLayout) {
            if (!nonFocusedViews.includes(targetId)) {
                dashLayout.classList.add('department-view-active');
            } else {
                dashLayout.classList.remove('department-view-active');
            }
        }

        // Department notification logic
        const deptMap = {
            'view-inventory': 'Inventory',
            'view-sales': 'Sales',
            'view-document': 'Document Room',
            'view-marketing': 'Marketing',
            'view-expense': 'Expense Tracker',
            'view-vendor': 'Vendor Management',
            'view-category': 'Category',
            'view-research': 'Research & Development',
            'view-hr': 'Human Resources',
            'view-finance': 'Finance',
            'view-logistics': 'Logistics',
            'view-operations': 'Operations'
        };
        const mappedDept = deptMap[targetId];
        if (mappedDept && window.tasks && window.shownNotifications) {
            const deptTasks = window.tasks.filter(t => t.assignedTo === mappedDept && t.status !== 'Completed');
            if (deptTasks.length > 0 && !window.shownNotifications[mappedDept]) {
                window.shownNotifications[mappedDept] = true;
                if (typeof window.showDeptToast === 'function') {
                    window.showDeptToast(mappedDept, deptTasks.length);
                }
            }
        }

        // Reset marketing view if navigating to it
        if (targetId === 'view-marketing') {
            const mOptions = document.getElementById('marketing-options');
            const iDashboard = document.getElementById('influencer-dashboard');
            if (mOptions && iDashboard) {
                mOptions.classList.remove('hidden');
                iDashboard.classList.add('hidden');
            }
        }
    });

    // --- Expense Sidebar Navigation ---
    const btnExpenseModule = document.getElementById('btn-expense-module');
    const btnFinanceCategoryModule = document.getElementById('btn-finance-category-module');
    const btnAddBillModule = document.getElementById('btn-add-bill-module');

    function setExpenseSidebarActive(activeBtn) {
        if (!expenseSidebar) return;
        expenseSidebar.querySelectorAll('.sub-sidebar-item').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnExpenseModule) {
        btnExpenseModule.addEventListener('click', () => {
            setExpenseSidebarActive(btnExpenseModule);
            contentViews.forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });
            const expenseView = document.getElementById('view-expense');
            if (expenseView) {
                expenseView.classList.remove('hidden');
                expenseView.classList.add('active-view');
            }
        });
    }

    if (btnFinanceCategoryModule) {
        btnFinanceCategoryModule.addEventListener('click', () => {
            setExpenseSidebarActive(btnFinanceCategoryModule);
            contentViews.forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });
            const financeView = document.getElementById('view-finance-category');
            if (financeView) {
                financeView.classList.remove('hidden');
                financeView.classList.add('active-view');
            }
        });
    }

    if (btnAddBillModule) {
        btnAddBillModule.addEventListener('click', () => {
            setExpenseSidebarActive(btnAddBillModule);
            contentViews.forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });
            const addBillView = document.getElementById('view-add-bill');
            if (addBillView) {
                addBillView.classList.remove('hidden');
                addBillView.classList.add('active-view');
            }
        });
    }
    // --- Global Navigation Functions & Internal SPA History ---
    window.velmoraNavigationStack = [];
    let velmoraCurrentStateStr = null;

    function captureVelmoraState() {
        const state = {};
        // Capture visibility of any major block with an ID
        const elements = document.querySelectorAll('main[id], section[id], div[id]');
        elements.forEach(el => {
            const h = el.classList.contains('hidden');
            const a = el.classList.contains('active-view');
            const d = el.style.display;
            if (h || a || d || el.classList.contains('content-view')) {
                state[el.id] = { h, a, d };
            }
        });
        
        // Capture global layouts
        const dashLayout = document.querySelector('.dashboard-layout');
        if (dashLayout) {
            state['__dashboardLayout'] = dashLayout.classList.contains('department-view-active');
        }
        
        // Capture active sidebar items
        const activeSidebar = document.querySelector('.sidebar-item.active-item');
        if (activeSidebar) state['__activeSidebar'] = activeSidebar.getAttribute('data-target');
        
        const activeSubSidebar = document.querySelector('.sub-sidebar-item.active');
        if (activeSubSidebar) state['__activeSubSidebar'] = activeSubSidebar.id;
        
        return JSON.stringify(state);
    }

    function restoreVelmoraState(stateStr) {
        if (!stateStr) return;
        const state = JSON.parse(stateStr);
        
        const dashLayout = document.querySelector('.dashboard-layout');
        if (dashLayout) {
            if (state['__dashboardLayout']) dashLayout.classList.add('department-view-active');
            else dashLayout.classList.remove('department-view-active');
        }
        
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active-item'));
        if (state['__activeSidebar']) {
            const btn = document.querySelector(`.sidebar-item[data-target="${state['__activeSidebar']}"]`);
            if (btn) btn.classList.add('active-item');
        }
        
        document.querySelectorAll('.sub-sidebar-item').forEach(i => i.classList.remove('active'));
        if (state['__activeSubSidebar']) {
            const btn = document.getElementById(state['__activeSubSidebar']);
            if (btn) btn.classList.add('active');
        }
        
        for (const id in state) {
            if (id.startsWith('__')) continue; // Skip metadata keys
            const el = document.getElementById(id);
            if (el) {
                if (state[id].h) el.classList.add('hidden');
                else el.classList.remove('hidden');
                
                if (state[id].a) el.classList.add('active-view');
                else el.classList.remove('active-view');
                
                if (state[id].d !== undefined) el.style.display = state[id].d;
            }
        }
        velmoraCurrentStateStr = stateStr;
    }

    // Initialize initial state shortly after load
    setTimeout(() => { velmoraCurrentStateStr = captureVelmoraState(); }, 200);

    // Intercept clicks to capture SPA forward navigation
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;
        
        // Ignore back/home clicks so we don't corrupt the history
        if (target.closest('.dept-back-btn') || target.closest('.dept-home-btn') || target.closest('.btn-dept-back')) {
            return;
        }

        const btn = target.closest('button');
        let isForwardNav = false;
        
        if (target.closest('.sidebar-item') || target.closest('.home-card') || target.closest('.sub-sidebar-item') || target.closest('.option-card')) {
            isForwardNav = true;
        } else if (btn) {
            const id = btn.id ? btn.id.toLowerCase() : '';
            const cls = btn.className ? btn.className.toLowerCase() : '';
            const text = btn.innerText ? btn.innerText.toLowerCase() : '';
            
            // Heuristic to ignore reverse/terminating actions
            const isReverseAction = 
                id.includes('back') || id.includes('close') || id.includes('cancel') || id.includes('save') || id.includes('submit') ||
                cls.includes('back') || cls.includes('close') || cls.includes('cancel') || cls.includes('save') || cls.includes('submit') ||
                text.includes('back') || text.includes('close') || text.includes('cancel') || text.includes('save') || text.includes('submit');
                
            if (!isReverseAction) {
                isForwardNav = true;
            } else if (isReverseAction) {
                // If the user clicks "Cancel" or "Close", it is effectively a back action.
                // We pop the stack so the history doesn't track closed states
                if (window.velmoraNavigationStack.length > 0) {
                    window.velmoraNavigationStack.pop();
                    setTimeout(() => { velmoraCurrentStateStr = captureVelmoraState(); }, 50);
                }
                return;
            }
        }
        
        if (isForwardNav) {
            if (!velmoraCurrentStateStr) velmoraCurrentStateStr = captureVelmoraState();
            const preClickState = velmoraCurrentStateStr;
            
            setTimeout(() => {
                const postClickState = captureVelmoraState();
                if (preClickState !== postClickState) {
                    window.velmoraNavigationStack.push(preClickState);
                    velmoraCurrentStateStr = postClickState;
                }
            }, 50);
        }
    }, true); // Capture phase to see state before click handlers modify DOM

    window.velmoraNavBack = function() {
        if (window.velmoraNavigationStack.length > 0) {
            const prevState = window.velmoraNavigationStack.pop();
            restoreVelmoraState(prevState);
        } else {
            window.velmoraNavHome();
        }
    };

    window.velmoraNavHome = function() {
        try {
            // 1. Force main dashboard container visible and landing page hidden
            const dashboardPage = document.getElementById('dashboard-page');
            if (dashboardPage) {
                dashboardPage.classList.remove('hidden');
                dashboardPage.style.display = 'flex';
            }
            const landingPage = document.getElementById('landing-page');
            if (landingPage) landingPage.classList.add('hidden');

            // 2. Reset layout state (brings back main sidebar)
            const dashLayout = document.querySelector('.dashboard-layout');
            if (dashLayout) dashLayout.classList.remove('department-view-active');

            // 3. Hide all sub-sidebars safely
            if (typeof hideAllSidebars === 'function') {
                hideAllSidebars();
            } else {
                document.querySelectorAll('.sub-sidebar').forEach(s => s.classList.add('hidden'));
            }

            // 4. Live query all content views to hide them (prevents stale NodeList issues)
            document.querySelectorAll('.content-view').forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });

            // 5. Explicitly activate and show the Home view
            const homeView = document.getElementById('view-home');
            if (homeView) {
                homeView.classList.remove('hidden');
                homeView.classList.add('active-view');
            }

            // 6. Reset sidebar item active states
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active-item'));
            const homeBtn = document.querySelector('[data-target="view-home"]');
            if (homeBtn) homeBtn.classList.add('active-item');

            // 7. Clear the navigation stack to start fresh
            window.velmoraNavigationStack = [];
            setTimeout(() => { velmoraCurrentStateStr = captureVelmoraState(); }, 50);
        } catch (error) {
            console.error("Error in velmoraNavHome execution:", error);
        }
    };

    // --- Department Navigation Event Delegation ---
    // If there are buttons dynamically created with these classes
    document.addEventListener('click', (e) => {
        if (e.target.closest('.dept-back-btn')) {
            // If it's a specific dynamic component back button, let its own listener handle it
            if (!e.target.closest('.btn-dept-back')) {
                window.velmoraNavBack();
            }
        }
        if (e.target.closest('.dept-home-btn')) {
            window.velmoraNavHome();
        }
    });

    // --- Department Back Button (Legacy fallback) ---
    const deptBackBtn = document.getElementById('dept-back-btn');
    if (deptBackBtn) {
        deptBackBtn.addEventListener('click', () => {
            window.velmoraNavBack();
        });
    }

    const deptHomeBtn = document.getElementById('dept-home-btn');
    if (deptHomeBtn) {
        deptHomeBtn.addEventListener('click', () => {
            window.velmoraNavHome();
        });
    }

    // --- Vendor Sidebar Navigation ---
    const btnVendorModule = document.getElementById('btn-vendor-module');
    const btnCategoryModule = document.getElementById('btn-category-module');

    function setVendorSidebarActive(activeBtn) {
        document.querySelectorAll('#vendorSidebar .sub-sidebar-item').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnVendorModule) {
        btnVendorModule.addEventListener('click', () => {
            setVendorSidebarActive(btnVendorModule);
            contentViews.forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });
            const vendorView = document.getElementById('view-vendor');
            if (vendorView) {
                vendorView.classList.remove('hidden');
                vendorView.classList.add('active-view');
            }
            const vfc = document.getElementById('vendor-form-container');
            const vlc = document.getElementById('vendor-list-container');
            if (vfc) vfc.classList.remove('hidden');
            if (vlc) vlc.classList.add('hidden');
            initVendorFormPopulator();
        });
    }

    if (btnCategoryModule) {
        btnCategoryModule.addEventListener('click', () => {
            setVendorSidebarActive(btnCategoryModule);
            contentViews.forEach(view => {
                view.classList.remove('active-view');
                view.classList.add('hidden');
            });
            const categoryView = document.getElementById('view-category');
            if (categoryView) {
                categoryView.classList.remove('hidden');
                categoryView.classList.add('active-view');
            }
        });
    }

    // --- Vendor Management Population Logic ---
    function initVendorFormPopulator() {
        if (vendorCategorySelect) {
            if (window.mainCategories && window.mainCategories.length > 0) {
                populateVendorDropdown(vendorCategorySelect, window.mainCategories, 'Select Category');
            } else {
                console.warn('Vendor Form: window.mainCategories is empty.');
                populateVendorDropdown(vendorCategorySelect, [], 'Select Category');
            }

            if (vendorSubCategorySelect) {
                vendorSubCategorySelect.innerHTML = '<option value="">Select Category First</option>';
                vendorSubCategorySelect.disabled = true;
            }
            if (vendorSubSubCategorySelect) {
                vendorSubSubCategorySelect.innerHTML = '<option value="">Select Sub Category First</option>';
                vendorSubSubCategorySelect.disabled = true;
            }
        }
    }
    window.refreshVendorCategoryDropdown = initVendorFormPopulator;

    if (btnAddVendor && vendorFormContainer) {
        btnAddVendor.addEventListener('click', () => {
            const vendorView = document.getElementById('view-vendor');
            if (vendorView) {
                contentViews.forEach(view => {
                    view.classList.remove('active-view');
                    view.classList.add('hidden');
                });
                vendorView.classList.remove('hidden');
                vendorView.classList.add('active-view');
            }
            vendorFormContainer.classList.remove('hidden');
            if (vendorListContainer) vendorListContainer.classList.add('hidden');

            initVendorFormPopulator();
        });
    }

    // --- Vendor Cascading Dropdown Listeners ---
    if (vendorCategorySelect && vendorSubCategorySelect) {
        vendorCategorySelect.addEventListener('change', () => {
            const selectedCategory = vendorCategorySelect.value;
            vendorSubCategorySelect.innerHTML = selectedCategory
                ? `<option value="">Select ${selectedCategory} Type</option>`
                : '<option value="">Select Category First</option>';
            vendorSubCategorySelect.disabled = !selectedCategory;

            if (vendorSubSubCategorySelect) {
                vendorSubSubCategorySelect.innerHTML = '<option value="">Select Sub Category First</option>';
                vendorSubSubCategorySelect.disabled = true;
            }

            if (selectedCategory && window.subCategory1 && window.subCategory1[selectedCategory]) {
                const options = window.subCategory1[selectedCategory];
                options.forEach(opt => {
                    const optEl = document.createElement('option');
                    optEl.value = opt;
                    optEl.textContent = opt;
                    vendorSubCategorySelect.appendChild(optEl);
                });
            }
        });
    }

    if (vendorSubCategorySelect && vendorSubSubCategorySelect) {
        vendorSubCategorySelect.addEventListener('change', () => {
            const mainVal = vendorCategorySelect ? vendorCategorySelect.value : null;
            const subVal = vendorSubCategorySelect.value;
            if (window.loadVendorSubSubCategories && mainVal && subVal) {
                window.loadVendorSubSubCategories(mainVal, subVal, 'subSubCategory');
            }
        });
    }
    
    const vendorSubCategory3Select = document.getElementById('vendorSubCategory3');
    if (vendorSubSubCategorySelect && vendorSubCategory3Select) {
        vendorSubSubCategorySelect.addEventListener('change', () => {
            const mainVal = vendorCategorySelect ? vendorCategorySelect.value : null;
            const subVal = vendorSubCategorySelect.value;
            const sub2Val = vendorSubSubCategorySelect.value;
            if (window.loadVendorSubSubSubCategories && mainVal && subVal && sub2Val) {
                window.loadVendorSubSubSubCategories(mainVal, subVal, sub2Val, 'vendorSubCategory3');
            }
        });
    }

    // Dark Mode Toggle
    const savedTheme = localStorage.getItem('theme');

    // Check local storage or system preference
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // Influencer Dashboard Logic
    const btnInfluencerDashboard = document.getElementById('btn-influencer-dashboard');
    const marketingOptions = document.getElementById('marketing-options');
    const influencerDashboard = document.getElementById('influencer-dashboard');
    const marketingSidebarTab = document.querySelector('.sidebar-item[data-target="view-marketing"]');

    if (btnInfluencerDashboard) {
        btnInfluencerDashboard.addEventListener('click', () => {
            if (marketingOptions && influencerDashboard) {
                marketingOptions.classList.add('hidden');
                influencerDashboard.classList.remove('hidden');
            }
        });
    }

    const contentPlaceholder = document.getElementById('content-viewer-placeholder');
    const campaignFormContainer = document.getElementById('campaign-form-container');
    const dashboardViewGlob = document.getElementById('campaign-dashboard-view');
    const addInfluencerViewGlob = document.getElementById('add-influencer-view');

    // Reset Marketing view when sidebar Marketing tab is clicked
    if (marketingSidebarTab) {
        marketingSidebarTab.addEventListener('click', () => {
            if (marketingOptions && influencerDashboard) {
                marketingOptions.classList.remove('hidden');
                influencerDashboard.classList.add('hidden');

                // Reset form visibility inside influencer dashboard
                if (contentPlaceholder && campaignFormContainer) {
                    contentPlaceholder.classList.remove('hidden');
                    campaignFormContainer.classList.add('hidden');
                    if (dashboardViewGlob) dashboardViewGlob.classList.add('hidden');
                    if (addInfluencerViewGlob) addInfluencerViewGlob.classList.add('hidden');

                    const influencerList = document.getElementById('influencer-list-view');
                    if (influencerList) influencerList.classList.add('hidden');

                    const dispatchedListView = document.getElementById('view-dispatched-list');
                    if (dispatchedListView) {
                        dispatchedListView.classList.add('hidden');
                        dispatchedListView.classList.remove('active-view');
                    }
                }
            }
        });
    }

    // Removed global dispatched list logic

    // Campaign Form Trigger
    const btnCreateCampaign = document.querySelector('.btn-create-campaign');

    if (btnCreateCampaign && contentPlaceholder && campaignFormContainer) {
        btnCreateCampaign.addEventListener('click', () => {
            // Hide existing views in right panel
            contentPlaceholder.classList.add('hidden');

            const dashboardView = document.getElementById('campaign-dashboard-view');
            const addInfluencerView = document.getElementById('add-influencer-view');
            const influencerListView = document.getElementById('influencer-list-view');
            if (dashboardView) dashboardView.classList.add('hidden');
            if (addInfluencerView) addInfluencerView.classList.add('hidden');
            if (influencerListView) influencerListView.classList.add('hidden');

            const dispatchedListView = document.getElementById('view-dispatched-list');
            if (dispatchedListView) {
                dispatchedListView.classList.add('hidden');
                dispatchedListView.classList.remove('active-view');
            }

            // Clear active folder selection logically
            const activeFolders = document.querySelectorAll('.campaign-folder-item.active-folder');
            activeFolders.forEach(f => f.classList.remove('active-folder'));

            // Show Form
            campaignFormContainer.classList.remove('hidden');
        });
    }

    // Campaign Creation Form Submission Logic
    const campaignForm = document.getElementById('campaign-form');
    const campaignNameInput = document.getElementById('campaign-name-input');
    const emptyCampaignList = document.querySelector('.empty-campaign-list');
    const toastContainer = document.getElementById('toast-container');

    // Helper: Show Alert Message
    function showAlert(message) {
        alert(message);
    }

    // Helper: Show Toast Notification
    // Helper: Show Toast Notification
    window.showToast = function (message, icon = '✅') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    };

    function validateCampaignForm() {
        // Validation: Required Fields
        const requiredNames = [
            'campaign_name', 'campaign_type', 'total_budget',
            'expected_influencers', 'expected_videos', 'avg_video_cost',
            'start_date', 'end_date', 'campaign_goal'
        ];

        let hasEmptyRequired = false;
        for (const name of requiredNames) {
            const element = campaignForm.elements[name];
            if (!element || !element.value.trim()) {
                hasEmptyRequired = true;
                break;
            }
        }

        if (hasEmptyRequired) {
            showAlert("⚠ Please fill all required fields before creating the campaign.");
            return false;
        }

        // Validation: Target Language Checkboxes
        const selectedLanguages = document.querySelectorAll('input[name="target_language"]:checked');
        if (selectedLanguages.length === 0) {
            showAlert("⚠ Please select at least one target language.");
            return false;
        }

        // Validation: Numeric Fields > 0
        const numericNames = ['total_budget', 'expected_influencers', 'expected_videos', 'avg_video_cost'];
        let hasInvalidNumeric = false;
        for (const name of numericNames) {
            const val = parseFloat(campaignForm.elements[name].value);
            if (isNaN(val) || val <= 0) {
                hasInvalidNumeric = true;
                break;
            }
        }

        if (hasInvalidNumeric) {
            showAlert("⚠ Budget and influencer values must be greater than zero.");
            return false;
        }

        // Validation: Date Logic
        const startDate = new Date(campaignForm.elements['start_date'].value);
        const endDate = new Date(campaignForm.elements['end_date'].value);
        if (endDate < startDate) {
            showAlert("⚠ End Date cannot be earlier than Start Date.");
            return false;
        }

        return true;
    }

    // Handle Form Submit
    if (campaignForm) {
        campaignForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent page reload

            if (!validateCampaignForm()) {
                return;
            }

            const btnSubmit = campaignForm.querySelector('.btn-submit');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Creating...';
            }

            try {
                // Collect target languages
                const selectedLanguages = Array.from(document.querySelectorAll('input[name="target_language"]:checked'))
                    .map(checkbox => checkbox.value);

                // Collect form data matching DB schema
                const payload = {
                    campaign_name: campaignForm.elements['campaign_name'].value.trim() || 'Untitled Campaign',
                    campaign_type: campaignForm.elements['campaign_type'].value,
                    total_budget: parseFloat(campaignForm.elements['total_budget'].value),
                    expected_influencers: parseInt(campaignForm.elements['expected_influencers'].value, 10),
                    expected_total_videos: parseInt(campaignForm.elements['expected_videos'].value, 10),
                    avg_per_video_cost: parseFloat(campaignForm.elements['avg_video_cost'].value),
                    target_languages: selectedLanguages, // Send array directly for JSON type
                    campaign_goal: campaignForm.elements['campaign_goal'].value,
                    start_date: campaignForm.elements['start_date'].value,
                    end_date: campaignForm.elements['end_date'].value,
                    status: 'active'
                };

                const { data, error } = await window.supabase
                    .from('influencer_create_campaigns')
                    .insert([payload])
                    .select();

                if (error) throw error;

                if (typeof showToast === 'function') {
                    showToast('Campaign created successfully');
                }

                campaignForm.reset();

                // Clear active states and hide form
                if (emptyCampaignList) {
                    const existingFolders = emptyCampaignList.querySelectorAll('.campaign-folder-item');
                    existingFolders.forEach(folder => folder.classList.remove('active-folder'));
                }

                if (contentPlaceholder) contentPlaceholder.classList.add('hidden');
                if (campaignFormContainer) campaignFormContainer.classList.add('hidden');

                // Reload the sidebar list
                if (typeof renderCampaignList === 'function') {
                    await renderCampaignList();
                }

            } catch (err) {
                console.error("Failed to create campaign:", err);
                if (typeof showToast === 'function') {
                    showToast('❌ Failed to create campaign: ' + (err.message || 'Unknown error'));
                } else {
                    alert("Failed to create campaign: " + (err.message || 'Unknown error'));
                }
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Create Campaign';
                }
            }
        });

        // Campaign Submission Trigger
        const btnSubmitCampaign = campaignForm.querySelector('.btn-submit');
        if (btnSubmitCampaign) {
            btnSubmitCampaign.addEventListener('click', () => {
                campaignForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            });
        }
    }

    async function renderCampaignList() {
        if (!emptyCampaignList) return;
        emptyCampaignList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 10px;">Loading campaigns...</div>';

        try {
            const { data, error } = await window.supabase
                .from('influencer_create_campaigns')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                emptyCampaignList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 10px;">No campaigns created yet.</div>';
                return;
            }

            emptyCampaignList.innerHTML = ''; // Clear container

            data.forEach(campaign => {
                const folderItem = document.createElement('div');
                folderItem.className = 'campaign-folder-item';
                
                // Highlight if it's the currently selected campaign
                if (window.selectedCampaignId == campaign.id) {
                    folderItem.classList.add('active-folder');
                }

                folderItem.setAttribute('data-id', campaign.id);

                folderItem.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span class="folder-name">${campaign.campaign_name || 'Untitled Campaign'}</span>
                `;

                folderItem.addEventListener('click', () => {
                    emptyCampaignList.querySelectorAll('.campaign-folder-item').forEach(f => f.classList.remove('active-folder'));
                    folderItem.classList.add('active-folder');

                    window.selectedCampaignId = campaign.id;
                    window.selectedCampaign = campaign;
                    localStorage.setItem('selectedCampaignId', campaign.id);
                    
                    console.log("Selected Campaign:", window.selectedCampaign);
                    
                    if (typeof renderCampaignDashboard === 'function') {
                        renderCampaignDashboard(campaign);
                    }
                });

                emptyCampaignList.appendChild(folderItem);
            });

        } catch (err) {
            console.error('Error fetching campaigns:', err);
            emptyCampaignList.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 10px;">Failed to load campaigns.</div>';
        }
    }


    function renderCampaignDashboard(campaign) {
        const contentPlaceholder = document.getElementById('content-viewer-placeholder');
        const campaignFormContainer = document.getElementById('campaign-form-container');
        const addInfluencerView = document.getElementById('add-influencer-view');
        const influencerListView = document.getElementById('influencer-list-view');
        const dashboardView = document.getElementById('campaign-dashboard-view');
        const dispatchedListView = document.getElementById('view-dispatched-list');
        const statusTrackingView = document.getElementById('view-status-tracking');

        // Hide other views
        if (contentPlaceholder) contentPlaceholder.classList.add('hidden');
        if (campaignFormContainer) campaignFormContainer.classList.add('hidden');
        if (addInfluencerView) addInfluencerView.classList.add('hidden');
        if (influencerListView) influencerListView.classList.add('hidden');
        if (dispatchedListView) dispatchedListView.classList.add('hidden');
        if (statusTrackingView) statusTrackingView.classList.add('hidden');

        // Show Dashboard View
        if (dashboardView) {
            dashboardView.classList.remove('fade-in');
            void dashboardView.offsetWidth; // Trigger reflow for animation
            dashboardView.classList.remove('hidden');
            dashboardView.classList.add('fade-in'); // Smooth transition
            
            // Set Campaign Title
            const titleEl = document.getElementById('campaign-dashboard-title');
            if (titleEl) {
                titleEl.textContent = `${campaign.campaign_name || 'Untitled'} Campaign`;
            }
        }
    }

    // Call on load
    window.selectedCampaignId = localStorage.getItem('selectedCampaignId') || null;
    renderCampaignList();



    // --- Vendor CRUD Logic ---
    const btnSaveVendor = document.getElementById('btn-save-vendor');
    // vendorForm and vendorListContainer already declared at the top of DOMContentLoaded
    const vendorTableBody = document.getElementById('vendor-table-body');
    const vendorEmptyState = document.getElementById('vendor-empty-state');
    const vendorTable = document.getElementById('vendor-table');
    const vendorSearchInput = document.getElementById('vendor-search');
    const vendorFilterCategory = document.getElementById('vendor-filter-category');
    const vendorFormHeader = vendorFormContainer ? vendorFormContainer.querySelector('.form-header') : null;

    const vendors = [];
    const expenses = [];
    let currentEditVendorId = null;

    function validateVendorForm() {
        const vendorName = document.getElementById('vendorName').value;
        const vendorCategory = document.getElementById('vendorCategory').value;
        const subCategory = document.getElementById('subCategory').value;

        if (!vendorName || !vendorCategory || !subCategory) {
            showAlert("Please fill all required fields before saving the vendor.");
            return false;
        }
        return true;
    }

    // ─── addVendor: INSERT vendor into Supabase ───
    async function addVendor() {
        if (!validateVendorForm()) return;

        const saveBtn = document.getElementById('btn-save-vendor');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        // Collect Used In checkboxes
        const usedInCheckboxes = document.querySelectorAll('input[name="usedIn"]:checked');
        const usedInArray = Array.from(usedInCheckboxes).map(cb => cb.value);

        // Collect all values & convert types
        const vendorData = {
            vendor_type1: document.getElementById('vendorType1').value || null,
            vendor_type2: document.getElementById('vendorType2').value || null,
            vendor_category: document.getElementById('vendorCategory').value || null,
            sub_category: document.getElementById('subCategory').value || null,
            sub_sub_category: document.getElementById('subSubCategory').value || null,
            sub_sub_sub_category: document.getElementById('vendorSubCategory3') ? document.getElementById('vendorSubCategory3').value : null,
            
            moq: document.getElementById('moq').value ? Number(document.getElementById('moq').value) : null,
            price_per_unit: document.getElementById('pricePerUnit').value ? Number(document.getElementById('pricePerUnit').value) : null,
            gst_applicable: document.getElementById('gstApplicable').checked,
            batch_size: document.getElementById('batchSize').value || null,
            
            used_in: usedInArray,
            
            vendor_name: document.getElementById('vendorName').value || null,
            company_name: document.getElementById('companyName').value || null,
            phone: document.getElementById('phone').value || null,
            email: document.getElementById('email').value || null,
            address: document.getElementById('address').value || null,
            city: document.getElementById('city').value || null,
            delivery_time: document.getElementById('deliveryTime').value || null,
            gst_number: document.getElementById('gstNumber').value || null,
            
            account_holder: document.getElementById('accountHolder').value || null,
            account_number: document.getElementById('accountNumber').value || null,
            ifsc_code: document.getElementById('ifscCode').value || null,
            upi_id: document.getElementById('upiId').value || null,
            
            status: 'active'
        };

        try {
            const { data, error } = await supabase
                .from('vendors')
                .insert([vendorData]);

            if (error) throw error;

            alert("Vendor saved successfully");
            
            // Reset form and mode
            if (vendorForm) vendorForm.reset();
            resetVendorFormMode();
            
            if (vendorFormContainer) vendorFormContainer.classList.add('hidden');
            if (vendorListContainer) vendorListContainer.classList.remove('hidden');
            
            // Auto-refresh the vendor list after insert
            if (typeof window.fetchVendors === 'function') window.fetchVendors();
            
        } catch (err) {
            console.error('Supabase vendor insert error:', err);
            alert('Failed to save vendor: ' + (err.message || 'Unknown error'));
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Vendor';
            }
        }
    }

    function loadVendorIntoForm(vendor) {
        document.getElementById('vendorType1').value = vendor.vendorType1 || '';
        document.getElementById('vendorType2').value = vendor.vendorType2 || '';
        document.getElementById('vendorCategory').value = vendor.vendorCategory || '';

        // Trigger category change to populate sub-category options
        const catEvent = new Event('change', { bubbles: true });
        document.getElementById('vendorCategory').dispatchEvent(catEvent);

        // Set sub-category after options are populated
        setTimeout(() => {
            document.getElementById('subCategory').value = vendor.subCategory || '';
            // Trigger sub-category change for sub-sub-category
            const subEvent = new Event('change', { bubbles: true });
            document.getElementById('subCategory').dispatchEvent(subEvent);

            setTimeout(() => {
                document.getElementById('subSubCategory').value = vendor.sub_sub_category || vendor.subSubCategory || '';
                if (document.getElementById('vendorSubCategory3')) document.getElementById('vendorSubCategory3').value = vendor.sub_sub_sub_category || '';
            }, 50);
        }, 50);

        document.getElementById('moq').value = vendor.moq || '';
        document.getElementById('pricePerUnit').value = vendor.pricePerUnit || '';
        document.getElementById('gstApplicable').checked = vendor.gstApplicable || false;
        document.getElementById('batchSize').value = vendor.batchSize || '';

        document.getElementById('vendorName').value = vendor.vendorName || '';
        document.getElementById('companyName').value = vendor.companyName || '';
        document.getElementById('phone').value = vendor.phone || '';
        document.getElementById('email').value = vendor.email || '';
        document.getElementById('address').value = vendor.address || '';
        document.getElementById('city').value = vendor.city || '';
        document.getElementById('deliveryTime').value = vendor.deliveryTime || '';
        document.getElementById('gstNumber').value = vendor.gstNumber || '';

        document.getElementById('accountHolder').value = vendor.accountHolder || '';
        document.getElementById('accountNumber').value = vendor.accountNumber || '';
        document.getElementById('ifscCode').value = vendor.ifscCode || '';
        document.getElementById('upiId').value = vendor.upiId || '';
    }

    function editVendor(id) {
        // Will need migrating to Supabase GET in the future
        const vendor = vendors.find(v => v.id === id);
        if (!vendor) return;

        currentEditVendorId = id;

        // Show form
        if (vendorFormContainer) vendorFormContainer.classList.remove('hidden');

        // Update form header and button
        if (vendorFormHeader) vendorFormHeader.textContent = 'Update Vendor';
        if (btnSaveVendor) btnSaveVendor.textContent = 'Update Vendor';

        // Populate form with vendor data
        loadVendorIntoForm(vendor);

        // Scroll to form
        if (vendorFormContainer) {
            vendorFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function archiveVendor(id) {
        // Will need migrating to Supabase UPDATE in the future
        const vendor = vendors.find(v => v.id === id);
        if (!vendor) return;
        vendor.status = 'archived';
        renderVendorList();
        showToast('Vendor archived successfully');
    }

    function resetVendorFormMode() {
        currentEditVendorId = null;
        if (vendorFormHeader) vendorFormHeader.textContent = 'Add Vendor';
        if (btnSaveVendor) btnSaveVendor.textContent = 'Save Vendor';
    }

    // Save Vendor Form Submit Event Listener
    if (btnSaveVendor && vendorForm) {
        btnSaveVendor.addEventListener('click', async (e) => {
            e.preventDefault();
            // Assuming for now they only want insertions based on requirements
            // (Updates to existing records require a separate PR usually)
            await addVendor();
        });
    }

    // --- Vendor List Variables & State ---
    let fetchedVendorsCache = [];
    let isFetchingVendors = false;
    let vendorSearchTimeout = null;

    // --- 1. Fetch Vendors from Supabase ---
    window.fetchVendors = async function() {
        if (!vendorTableBody) return;
        
        isFetchingVendors = true;
        vendorTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #888;">Loading vendors...</td></tr>';
        if (vendorEmptyState) vendorEmptyState.style.display = 'none';
        if (vendorTable) vendorTable.style.display = 'table';

        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('id, vendor_name, company_name, vendor_type1, vendor_type2, vendor_category, sub_category, price_per_unit, moq, gst_applicable, phone, used_in, created_at')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            fetchedVendorsCache = data || [];
            
            // Populate category filter dynamically from fetched vendors
            updateCategoryFilterDropdown();

            // Render
            window.renderVendorList();

        } catch (error) {
            console.error("Error fetching vendors:", error);
            showToast("Failed to load vendors: " + error.message);
            vendorTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #ff6b6b;">Error loading vendors.</td></tr>';
        } finally {
            isFetchingVendors = false;
        }
    };

    function updateCategoryFilterDropdown() {
        if (!vendorFilterCategory) return;
        
        const currentSelection = vendorFilterCategory.value;
        const categories = new Set(
            fetchedVendorsCache
                .map(v => v.vendor_category)
                .filter(Boolean)
                .map(c => c.trim())
        );
        
        let optionsHtml = '<option value="">All Categories</option>';
        Array.from(categories).sort().forEach(cat => {
            optionsHtml += `<option value="${cat}">${cat}</option>`;
        });
        
        vendorFilterCategory.innerHTML = optionsHtml;
        if (categories.has(currentSelection)) {
            vendorFilterCategory.value = currentSelection;
        }
    }

    // --- 2. Render & 5. Filter Vendor List ---
    window.renderVendorList = function() {
        if (!vendorTableBody) return;

        const searchTerm = vendorSearchInput ? vendorSearchInput.value.toLowerCase().trim() : '';
        const filterCat = vendorFilterCategory ? vendorFilterCategory.value : '';

        // In-memory Filter
        const activeVendors = fetchedVendorsCache.filter(v => {
            if (filterCat && v.vendor_category !== filterCat) return false;
            
            if (searchTerm) {
                const name = (v.vendor_name || '').toLowerCase();
                const company = (v.company_name || '').toLowerCase();
                if (!name.includes(searchTerm) && !company.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });

        // 7. Empty States
        if (fetchedVendorsCache.length === 0) {
            if (vendorTable) vendorTable.style.display = 'none';
            if (vendorEmptyState) {
                vendorEmptyState.style.display = 'block';
                vendorEmptyState.innerHTML = `
                    <div class="vendor-empty-icon">🏪</div>
                    <h3>No vendors yet</h3>
                    <p>Click "+ Vendor" in the sidebar to add your first vendor.</p>
                `;
            }
            return;
        }

        if (activeVendors.length === 0) {
            if (vendorTable) vendorTable.style.display = 'none';
            if (vendorEmptyState) {
                vendorEmptyState.style.display = 'block';
                vendorEmptyState.innerHTML = `
                    <div class="vendor-empty-icon">🔍</div>
                    <h3>No matching vendors</h3>
                    <p>Try adjusting your search or filter.</p>
                `;
            }
            return;
        }

        // Render Table
        if (vendorTable) vendorTable.style.display = 'table';
        if (vendorEmptyState) vendorEmptyState.style.display = 'none';
        
        vendorTableBody.innerHTML = '';

        activeVendors.forEach(vendor => {
            // Safe Data Handling
            console.log("used_in value:", vendor.used_in, typeof vendor.used_in);
            
            let usedInFormatted = "-";
            if (Array.isArray(vendor.used_in)) {
                usedInFormatted = vendor.used_in.length > 0 ? vendor.used_in.join(", ") : "-";
            } else if (typeof vendor.used_in === 'string') {
                usedInFormatted = vendor.used_in;
            } else if (vendor.used_in != null) {
                usedInFormatted = String(vendor.used_in);
            }

            const gstFormatted = vendor.gst_applicable ? "Yes" : "No";

            const row = document.createElement('tr');
            row.setAttribute('data-vendor-id', vendor.id);
            row.innerHTML = `
                <td><strong>${vendor.vendor_name || '-'}</strong></td>
                <td>${vendor.vendor_type1 || '-'}</td>
                <td>${vendor.vendor_type2 || '-'}</td>
                <td>${vendor.vendor_category || '-'}</td>
                <td>${vendor.sub_category || '-'}</td>
                <td>${vendor.price_per_unit != null ? vendor.price_per_unit : '-'}</td>
                <td>${vendor.moq != null ? vendor.moq : '-'}</td>
                <td>${gstFormatted}</td>
                <td>${vendor.phone || '-'}</td>
                <td>
                    <div class="vendor-actions">
                        <button class="btn-vendor-archive" data-id="${vendor.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                            Archive
                        </button>
                    </div>
                </td>
            `;
            vendorTableBody.appendChild(row);
        });
    };

    // --- 8. Archive Vendor ---
    window.archiveVendor = async function(id) {
        if (!confirm("Are you sure you want to archive this vendor?")) return;
        
        try {
            const { error } = await supabase
                .from('vendors')
                .update({ status: 'archived' })
                .eq('id', id);

            if (error) throw error;
            
            showToast('Vendor archived successfully');
            await window.fetchVendors(); // Auto refresh
        } catch (error) {
            console.error("Error archiving vendor:", error);
            alert("Failed to archive vendor: " + error.message);
        }
    };

    // --- Search & Filter Listeners ---
    if (vendorSearchInput) {
        vendorSearchInput.addEventListener('input', () => {
            if (vendorSearchTimeout) clearTimeout(vendorSearchTimeout);
            vendorSearchTimeout = setTimeout(() => {
                window.renderVendorList();
            }, 300); // 300ms debounce
        });
    }

    if (vendorFilterCategory) {
        vendorFilterCategory.addEventListener('change', () => window.renderVendorList());
    }

    // --- Delegate Edit/Archive Clicks ---
    if (vendorTableBody) {
        vendorTableBody.addEventListener('click', (e) => {
            const archiveBtn = e.target.closest('.btn-vendor-archive');
            if (archiveBtn) {
                const id = parseInt(archiveBtn.getAttribute('data-id'), 10);
                window.archiveVendor(id);
            }
        });
    }

    // "Vendor List" sidebar button — show list, hide form
    const btnVendorList = document.getElementById('btn-vendor-list');
    if (btnVendorList) {
        btnVendorList.addEventListener('click', () => {
            // Ensure vendor view is active
            const vendorView = document.getElementById('view-vendor');
            if (vendorView) {
                contentViews.forEach(view => {
                    view.classList.remove('active-view');
                    view.classList.add('hidden');
                });
                vendorView.classList.remove('hidden');
                vendorView.classList.add('active-view');
            }
            // Hide form, show list
            if (vendorFormContainer) vendorFormContainer.classList.add('hidden');
            if (vendorListContainer) vendorListContainer.classList.remove('hidden');
            // Fetch fresh data when opening list view
            if (typeof window.fetchVendors === 'function') window.fetchVendors();
        });
    }

    // Initial Fetch
    if (typeof window.fetchVendors === 'function') window.fetchVendors();

    // --- Campaign Dashboard Logic ---
    const btnAddInfluencer = document.getElementById('btn-add-influencer');
    const campaignDashboardView = document.getElementById('campaign-dashboard-view');
    const addInfluencerView = document.getElementById('add-influencer-view');

    if (btnAddInfluencer && campaignDashboardView && addInfluencerView) {
        btnAddInfluencer.addEventListener('click', () => {
            campaignDashboardView.classList.add('hidden');
            addInfluencerView.classList.remove('hidden');
            
            // Initialize fresh state if opening Add Influencer form
            if (!window.newInfluencerData) {
                window.newInfluencerData = {
                    basicInfo: {},
                    platformDetails: {},
                    pricingInfo: {},
                    brandPerformance: {}
                };
            }
        });
    }

    // --- Add Influencer Wizard State ---
    window.newInfluencerData = {
        basicInfo: {},
        platformDetails: {},
        pricingInfo: {},
        brandPerformance: {}
    };

    // Custom Multi-Select Dropdown Logic
    const languageHeader = document.getElementById('language-select-header');
    const languageDropdown = document.getElementById('language-select-dropdown');
    const languageSelectedText = document.getElementById('language-selected-text');
    
    if (languageHeader && languageDropdown) {
        languageHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageHeader.contains(e.target) && !languageDropdown.contains(e.target)) {
                languageDropdown.classList.add('hidden');
            }
        });

        // Update selected text when checkboxes change
        const langCheckboxes = languageDropdown.querySelectorAll('input[type="checkbox"]');
        langCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selected = Array.from(langCheckboxes)
                    .filter(c => c.checked)
                    .map(c => c.value);
                
                if (selected.length > 0) {
                    languageSelectedText.textContent = selected.join(', ');
                } else {
                    languageSelectedText.textContent = 'Select Language(s)';
                }
            });
        });
    }

    // Basic Info Next Button Logic
    const btnNextBasicInfo = document.getElementById('btn-next-basic-info');
    if (btnNextBasicInfo) {
        btnNextBasicInfo.addEventListener('click', () => {
            const form = document.querySelector('#tab-basic-info form');
            if (!form) return;

            const infName = form.elements['inf_name']?.value.trim();
            const infPhone = form.elements['inf_phone']?.value.trim();
            
            // Validate required fields
            if (!infName || !infPhone) {
                if (typeof showToast === 'function') {
                    showToast('❌ Please fill Name and Phone Number');
                } else {
                    alert('Please fill Name and Phone Number');
                }
                return;
            }

            // Collect selected languages
            const checkedLanguages = Array.from(document.querySelectorAll('input[name="inf_language"]:checked'))
                .map(cb => cb.value);

            // Save to memory
            window.newInfluencerData.basicInfo = {
                name: infName,
                influencer_name: form.elements['inf_influencer_name']?.value.trim(),
                phone: infPhone,
                alt_phone: form.elements['inf_alt_phone']?.value.trim(),
                upi: form.elements['inf_upi']?.value.trim(),
                city: form.elements['inf_city']?.value.trim(),
                address: form.elements['inf_address']?.value.trim(),
                state: form.elements['inf_state']?.value.trim(),
                languages: checkedLanguages
            };

            console.log("window.newInfluencerData:", window.newInfluencerData);

            // Move to Platform Details Tab
            const nextTabBtn = document.querySelector('.tab-btn[data-tab="tab-platform-details"]');
            if (nextTabBtn) {
                nextTabBtn.click();
            }
        });
    }

    // Platform Details Next Button Logic
    const btnNextPlatformDetails = document.getElementById('btn-next-platform-details');
    if (btnNextPlatformDetails) {
        btnNextPlatformDetails.addEventListener('click', () => {
            const form = document.querySelector('#tab-platform-details form');
            if (!form) return;

            const availabilitySelect = document.getElementById('platform-availability-select');
            const agreedSelect = document.getElementById('platform-agreed-select');
            
            if (!availabilitySelect) return;

            const val = availabilitySelect.value;
            const renderMap = {
                'Instagram': ['Instagram'],
                'Youtube': ['Youtube'],
                'Facebook': ['Facebook'],
                'Instagram and Youtube': ['Instagram', 'Youtube'],
                'Instagram and Facebook': ['Instagram', 'Facebook'],
                'Youtube and Facebook': ['Youtube', 'Facebook'],
                'All': ['Instagram', 'Youtube', 'Facebook']
            };

            const selectedPlatformsArray = (renderMap[val] || []).map(p => p.toLowerCase());
            
            // Base platform data structure
            const platformDetails = {
                selectedPlatforms: selectedPlatformsArray,
                platformAgreed: agreedSelect ? agreedSelect.value : "All",
                instagram: { username: "", profileLink: "", followers: "", videoViews: [] },
                youtube: { username: "", profileLink: "", followers: "", videoViews: [] },
                facebook: { username: "", profileLink: "", followers: "", videoViews: [] }
            };

            const platformContainer = document.getElementById('platform-forms-container');
            let hasValidVisibleData = false;
            let validationFailed = false;

            if (platformContainer) {
                const allCards = platformContainer.querySelectorAll('.platform-card');
                
                allCards.forEach(card => {
                    const platformName = card.getAttribute('data-platform-id').toLowerCase();
                    const isVisible = !card.classList.contains('hidden');

                    const username = card.querySelector('.plat-username')?.value.trim() || "";
                    const link = card.querySelector('.plat-link')?.value.trim() || "";
                    const followers = card.querySelector('.plat-followers')?.value.trim() || "";
                    
                    const videoInputs = card.querySelectorAll('.plat-video-input');
                    const videoViews = [];
                    videoInputs.forEach(input => {
                        videoViews.push(parseInt(input.value) || 0);
                    });

                    // Update the structured data (save regardless of visibility)
                    if (platformDetails[platformName]) {
                        platformDetails[platformName] = {
                            username: username,
                            profileLink: link,
                            followers: followers,
                            videoViews: videoViews
                        };
                    }

                    // Validate visible sections
                    if (isVisible) {
                        if (!username && !link) {
                            validationFailed = true;
                        } else {
                            hasValidVisibleData = true;
                        }
                    }
                });
            }

            if (selectedPlatformsArray.length > 0 && (validationFailed || !hasValidVisibleData)) {
                if (typeof showToast === 'function') {
                    showToast('❌ Please fill Username or Link for the selected platforms.');
                } else {
                    alert('Please fill Username or Link for the selected platforms.');
                }
                return;
            }

            // Save to memory
            if (!window.newInfluencerData) {
                window.newInfluencerData = { basicInfo: {}, platformDetails: {}, pricingInfo: {}, brandPerformance: {} };
            }
            window.newInfluencerData.platformDetails = platformDetails;

            console.log("window.newInfluencerData:", window.newInfluencerData);

            // Move to Pricing Info Tab
            const nextTabBtn = document.querySelector('.tab-btn[data-tab="tab-pricing-info"]');
            if (nextTabBtn) {
                nextTabBtn.click();
            }
        });
    }

    // Pricing Info Next Button Logic
    const btnNextPricingInfo = document.getElementById('btn-next-pricing-info');
    if (btnNextPricingInfo) {
        btnNextPricingInfo.addEventListener('click', () => {
            const form = document.querySelector('#tab-pricing-info form');
            if (!form) return;

            const finalPriceInput = document.getElementById('pricing-final-price');
            const totalVideosInput = document.getElementById('pricing-total-videos');

            const finalPriceStr = finalPriceInput ? finalPriceInput.value.trim() : "";
            const totalVideosStr = totalVideosInput ? totalVideosInput.value.trim() : "";

            if (!finalPriceStr || !totalVideosStr) {
                if (typeof showToast === 'function') {
                    showToast('❌ Please fill Final Price and Total Videos.');
                } else {
                    alert('Please fill Final Price and Total Videos.');
                }
                return;
            }

            const finalPrice = parseFloat(finalPriceStr);
            const totalVideos = parseInt(totalVideosStr);

            const bargainHistoryContainer = document.getElementById('bargain-history-container');
            const bargainHistory = [];
            let bargainValidationFailed = false;

            if (bargainHistoryContainer) {
                const rows = bargainHistoryContainer.querySelectorAll('.bargain-row');
                rows.forEach(row => {
                    const creatorInput = row.querySelector('.creator-request-input');
                    const brandInput = row.querySelector('.brand-request-input');

                    const creatorStr = creatorInput ? creatorInput.value.trim() : "";
                    const brandStr = brandInput ? brandInput.value.trim() : "";

                    // If one is filled but the other is empty, validation fails
                    if ((creatorStr && !brandStr) || (!creatorStr && brandStr)) {
                        bargainValidationFailed = true;
                    }

                    const cReq = creatorStr ? parseFloat(creatorStr) : null;
                    const bReq = brandStr ? parseFloat(brandStr) : null;

                    bargainHistory.push({
                        creatorRequest: Number.isNaN(cReq) ? null : cReq,
                        brandRequest: Number.isNaN(bReq) ? null : bReq
                    });
                });
            }

            if (bargainValidationFailed) {
                if (typeof showToast === 'function') {
                    showToast('❌ Please fill both Creator Request and Brand Request if entering a Bargain Set.');
                } else {
                    alert('Please fill both Creator Request and Brand Request if entering a Bargain Set.');
                }
                return;
            }

            // Save state
            if (!window.newInfluencerData) {
                window.newInfluencerData = { basicInfo: {}, platformDetails: {}, pricingInfo: {}, brandPerformance: {} };
            }
            
            window.newInfluencerData.pricingInfo = {
                finalPrice: Number.isNaN(finalPrice) ? null : finalPrice,
                totalVideos: Number.isNaN(totalVideos) ? null : totalVideos,
                bargainHistory: bargainHistory
            };

            console.log("window.newInfluencerData:", window.newInfluencerData);

            // Move to Brand Performance Tab
            const nextTabBtn = document.querySelector('.tab-btn[data-tab="tab-brand-performance"]');
            if (nextTabBtn) {
                nextTabBtn.click();
            }
        });
    }

    // --- Profile Image Upload Logic ---
    window.uploadedProfileUrl = null;
    const profileImageInput = document.querySelector('input[name="inf_profile_image"]');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                if (window.showToast) window.showToast('❌ Invalid file type. Only JPG, PNG, WEBP allowed.');
                e.target.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                if (window.showToast) window.showToast('❌ File too large. Max 5MB allowed.');
                e.target.value = '';
                return;
            }

            const campaignId = window.selectedCampaignId || 'general';
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${campaignId}/${timestamp}-${safeName}`;

            try {
                let msgSpan = profileImageInput.parentElement.querySelector('.upload-msg');
                if (!msgSpan) {
                    msgSpan = document.createElement('div');
                    msgSpan.className = 'upload-msg text-muted mt-5';
                    profileImageInput.parentElement.appendChild(msgSpan);
                }
                msgSpan.textContent = 'Uploading...';
                msgSpan.style.color = 'var(--text-muted)';

                const { data, error } = await window.supabase.storage
                    .from('influencer-profiles')
                    .upload(filePath, file);

                if (error) throw error;

                const { data: publicData } = window.supabase.storage
                    .from('influencer-profiles')
                    .getPublicUrl(filePath);

                window.uploadedProfileUrl = publicData.publicUrl;
                msgSpan.textContent = '✅ Image uploaded successfully';
                msgSpan.style.color = '#28a745';
            } catch (err) {
                console.error("Upload error:", err);
                if (window.showToast) window.showToast('❌ Upload failed: ' + err.message);
                const msgSpan = profileImageInput.parentElement.querySelector('.upload-msg');
                if (msgSpan) {
                    msgSpan.textContent = '❌ Upload failed';
                    msgSpan.style.color = '#ff6b6b';
                }
            }
        });
    }

    // --- Tabs Navigation Logic (Add Influencer Form) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs
            tabBtns.forEach(t => t.classList.remove('active'));
            // Hide all tab content
            tabPanes.forEach(p => p.classList.add('hidden'));

            // Activate clicked tab
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.remove('hidden');
        });
    });

    // --- Next Button Navigation ---
    const nextBtns = document.querySelectorAll('.btn-next');
    const tabOrder = ['tab-basic-info', 'tab-platform-details', 'tab-pricing-info', 'tab-brand-performance'];

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Find currently active tab
            const activeBtn = document.querySelector('.tab-btn.active');
            if (activeBtn) {
                const currentTabId = activeBtn.getAttribute('data-tab');
                const currentIndex = tabOrder.indexOf(currentTabId);

                // If there is a next tab in the sequence
                if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
                    const nextTabId = tabOrder[currentIndex + 1];
                    const nextTabBtn = document.querySelector(`.tab-btn[data-tab="${nextTabId}"]`);

                    if (nextTabBtn) {
                        // Trigger the click logic of the next tab natively
                        nextTabBtn.click();

                        // Scroll smoothly to the top of the form wrapper
                        const formContainer = document.querySelector('.add-influencer-header-card');
                        if (formContainer) {
                            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                }
            }
        });
    });

    // --- Dynamic Influencer Forms Logic ---

    // 1. Platform Details Dynamic Rendering
    const platformSelect = document.getElementById('platform-availability-select');
    const platformContainer = document.getElementById('platform-forms-container');

    const generatePlatformHTML = (platformName) => {
        let videoInputs = '';
        for (let i = 1; i <= 15; i++) {
            videoInputs += `
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="color: var(--text-muted); font-size: 11px; font-weight: 500; margin-bottom: 4px; display: block;">Video ${i}</label>
                    <input type="number" class="plat-video-input edit-input compact-input" data-platform="${platformName}" data-index="${i}" placeholder="Views" style="padding: 6px 10px; font-size: 13px; text-align: center;">
                </div>
            `;
        }

        return `
            <div class="nested-card platform-card platform-edit-card" data-platform-id="${platformName}">
                <div class="platform-header">${platformName}</div>
                <div class="platform-edit-grid mb-15">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Username</label>
                        <input type="text" class="plat-username edit-input" placeholder="@username">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Profile Link</label>
                        <input type="url" class="plat-link edit-input" placeholder="https://...">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Followers Count</label>
                        <input type="number" class="plat-followers edit-input" placeholder="e.g. 100000">
                    </div>
                </div>
                <h4 class="mb-10 text-muted" style="font-size: 13px; margin-bottom: 12px; margin-top: 20px;">Previous 15 Videos Views</h4>
                <div class="video-views-grid">
                    ${videoInputs}
                </div>
            </div>
        `;
    };

    // Use Event Delegation for dynamically generated or cloned forms inside Profile Cards
    document.body.addEventListener('change', (e) => {
        // 1. Platform Details Dynamic Rendering
        if (e.target && e.target.classList.contains('platform-availability-select')) {
            const val = e.target.value;
            // Find the sibling container that belongs to this specific dropdown
            const wrapper = e.target.closest('.tab-pane') || e.target.closest('.scoped-pane');
            if (!wrapper) return;
            const platformContainer = wrapper.querySelector('.platform-forms-container');
            if (!platformContainer) return;

            const renderMap = {
                'Instagram': ['Instagram'],
                'Youtube': ['Youtube'],
                'Facebook': ['Facebook'],
                'Instagram and Youtube': ['Instagram', 'Youtube'],
                'Instagram and Facebook': ['Instagram', 'Facebook'],
                'Youtube and Facebook': ['Youtube', 'Facebook'],
                'All': ['Instagram', 'Youtube', 'Facebook']
            };

            const platformsToRender = renderMap[val] || [];
            
            // Ensure all 3 platforms exist in the DOM
            const allPlatforms = ['Instagram', 'Youtube', 'Facebook'];
            
            allPlatforms.forEach(plat => {
                let existingCard = platformContainer.querySelector(`.platform-card[data-platform-id="${plat}"]`);
                if (!existingCard) {
                    // Create it if it doesn't exist, initially hidden
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = generatePlatformHTML(plat);
                    existingCard = tempDiv.firstElementChild;
                    existingCard.classList.add('hidden');
                    platformContainer.appendChild(existingCard);
                }
            });

            // Show/hide based on selection without destroying data
            allPlatforms.forEach(plat => {
                const card = platformContainer.querySelector(`.platform-card[data-platform-id="${plat}"]`);
                if (card) {
                    if (platformsToRender.includes(plat)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        }

        // Brand Performance Link Visibility Toggling
        if (e.target && e.target.classList.contains('perf-platform-select')) {
            const val = e.target.value;
            const parentCard = e.target.closest('.performance-card');
            if (!parentCard) return;

            const igWrapper = parentCard.querySelector('.ig-link-wrapper');
            const ytWrapper = parentCard.querySelector('.yt-link-wrapper');
            const fbWrapper = parentCard.querySelector('.fb-link-wrapper');

            if (!igWrapper || !ytWrapper || !fbWrapper) return;

            const renderMap = {
                'Instagram': ['ig'],
                'Youtube': ['yt'],
                'Facebook': ['fb'],
                'Instagram and Youtube': ['ig', 'yt'],
                'Instagram and Facebook': ['ig', 'fb'],
                'Youtube and Facebook': ['yt', 'fb'],
                'All': ['ig', 'yt', 'fb']
            };

            const platformsToRender = renderMap[val] || [];
            
            if (platformsToRender.includes('ig')) igWrapper.classList.remove('hidden');
            else igWrapper.classList.add('hidden');

            if (platformsToRender.includes('yt')) ytWrapper.classList.remove('hidden');
            else ytWrapper.classList.add('hidden');

            if (platformsToRender.includes('fb')) fbWrapper.classList.remove('hidden');
            else fbWrapper.classList.add('hidden');
        }
    });

    document.body.addEventListener('click', (e) => {
        // 2. Pricing Info - Dynamic Bargain Rows
        if (e.target && e.target.classList.contains('btn-add-bargain-set')) {
            // Check if within a read-only profile card (edit mode OFF checks)
            const parentCard = e.target.closest('.influencer-profile-card');
            if (parentCard && e.target.disabled) {
                return; // Edit mode is off, do nothing
            }

            const wrapper = e.target.closest('.pricing-bargain-section');
            if (!wrapper) return;
            const bargainContainer = wrapper.querySelector('.bargain-history-container');
            if (!bargainContainer) return;

            const currentCount = bargainContainer.querySelectorAll('.bargain-row').length + 1;
            const newRow = document.createElement('div');
            newRow.className = 'bargain-row bargain-edit-card mt-15';
            newRow.innerHTML = `
                <div class="bargain-set-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Set ${currentCount}</span>
                    <button type="button" class="btn-remove-bargain-set btn-danger" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; margin: 0;">Remove</button>
                </div>
                <div class="edit-grid" style="margin-bottom: 0;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Creator Request</label>
                        <input type="number" class="creator-request-input edit-input pricing-input" placeholder="Amount">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Brand Request</label>
                        <input type="number" class="brand-request-input edit-input pricing-input" placeholder="Amount">
                    </div>
                </div>
            `;
            bargainContainer.appendChild(newRow);
        }

        // Handle Remove Bargain Set
        if (e.target && e.target.classList.contains('btn-remove-bargain-set')) {
            const rowToRemove = e.target.closest('.bargain-row');
            if (rowToRemove) {
                const container = rowToRemove.closest('.bargain-history-container');
                if (container && container.querySelectorAll('.bargain-row').length > 1) {
                    rowToRemove.remove();
                } else {
                    if (typeof showToast === 'function') {
                        showToast('❌ At least one bargain history set must remain.');
                    } else {
                        alert('At least one bargain history set must remain.');
                    }
                }
            }
        }

        // 3. Brand Performance - Dynamic Cards
        if (e.target && e.target.classList.contains('btn-add-performance')) {
            // Check if within a read-only profile card (edit mode OFF checks)
            const parentCard = e.target.closest('.influencer-profile-card');
            if (parentCard && e.target.disabled) {
                return; // Edit mode is off, do nothing
            }

            const wrapper = e.target.closest('.tab-pane') || e.target.closest('.scoped-pane');
            if (!wrapper) return;
            const performanceContainer = wrapper.querySelector('.brand-performance-container');
            if (!performanceContainer) return;

            const newCard = document.createElement('div');
            newCard.className = 'performance-card brand-performance-edit-card mt-15';
            newCard.innerHTML = `
                <div class="edit-grid" style="margin-bottom: 15px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Brand</label>
                        <input type="text" class="perf-brand-input edit-input" placeholder="Enter brand name">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Product</label>
                        <input type="text" class="perf-product-input edit-input" placeholder="Enter product name">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Views</label>
                        <input type="number" class="perf-views-input edit-input" placeholder="Enter total views">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Uploaded Platforms</label>
                        <select class="perf-platform-select edit-input">
                            <option value="All">All</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Youtube">Youtube</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram and Youtube">Instagram and Youtube</option>
                            <option value="Instagram and Facebook">Instagram and Facebook</option>
                            <option value="Youtube and Facebook">Youtube and Facebook</option>
                        </select>
                    </div>
                </div>
                <div class="links-section">
                    <h4 class="mb-10 text-muted" style="font-size: 14px; font-weight: 600;">Platform Links</h4>
                    <div class="brand-links-grid">
                        <div class="form-group ig-link-wrapper" style="margin-bottom: 0;">
                            <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Instagram Link</label>
                            <input type="url" class="perf-ig-link edit-input" placeholder="https://instagram.com/...">
                        </div>
                        <div class="form-group yt-link-wrapper" style="margin-bottom: 0;">
                            <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Youtube Link</label>
                            <input type="url" class="perf-yt-link edit-input" placeholder="https://youtube.com/...">
                        </div>
                        <div class="form-group fb-link-wrapper" style="margin-bottom: 0;">
                            <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Facebook Link</label>
                            <input type="url" class="perf-fb-link edit-input" placeholder="https://facebook.com/...">
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn-remove-performance btn-danger" style="padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 0;">Remove Set</button>
                </div>
            `;
            performanceContainer.appendChild(newCard);
            
            // Trigger change event to set initial visibility of links
            const select = newCard.querySelector('.perf-platform-select');
            if (select) {
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Handle Remove Performance
        if (e.target && e.target.classList.contains('btn-remove-performance')) {
            const cardToRemove = e.target.closest('.performance-card');
            if (cardToRemove) {
                const container = cardToRemove.closest('.brand-performance-container');
                if (container && container.querySelectorAll('.performance-card').length > 1) {
                    cardToRemove.remove();
                } else {
                    if (typeof showToast === 'function') {
                        showToast('❌ At least one performance card must remain.');
                    } else {
                        alert('At least one performance card must remain.');
                    }
                }
            }
        }
    });

    // --- Influencer Profile Card Generation & Logic ---
    const btnSaveInfluencer = document.getElementById('btn-save-influencer');
    const influencerListView = document.getElementById('influencer-list-view');
    const influencerListContainer = document.getElementById('influencer-list-container');
    const btnInfluencerListNav = document.getElementById('btn-influencer-list');

    const btnCampaignDispatch = document.getElementById('btn-campaign-dispatch');

    // Route from Dashboard to List View
    if (btnInfluencerListNav && campaignDashboardView && influencerListView) {
        btnInfluencerListNav.addEventListener('click', () => {
            campaignDashboardView.classList.add('hidden');
            influencerListView.classList.remove('hidden');
            const dispatchedListView = document.getElementById('view-dispatched-list');
            if (dispatchedListView) dispatchedListView.classList.add('hidden');
            const statusTrackingView = document.getElementById('view-status-tracking');
            if (statusTrackingView) statusTrackingView.classList.add('hidden');
            
            if (window.selectedCampaignId) {
                loadCampaignInfluencers(window.selectedCampaignId);
            } else {
                if (window.showToast) window.showToast('⚠ No active campaign selected');
            }
        });
    }

    // --- Campaign Influencer Fetch & Render Logic ---
    async function loadCampaignInfluencers(campaignId) {
        const container = document.getElementById('influencer-list-container');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Loading influencers...</div>';

        const activeCampaignId = Number(campaignId);
        
        console.log('ACTIVE CAMPAIGN:', window.selectedCampaign);
        console.log('ACTIVE CAMPAIGN ID (original):', campaignId);
        console.log('ACTIVE CAMPAIGN ID (Number):', activeCampaignId);

        try {
            // 1. Fetch main info
            const { data: infoData, error: infoError } = await window.supabase
                .from('influencers_info')
                .select('*')
                .eq('campaign_id', activeCampaignId)
                .order('created_at', { ascending: false });

            console.log('FETCHED INFLUENCERS (infoData):', infoData);
            
            if (infoError) throw infoError;

            if (!infoData || infoData.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">📇</div>
                        <h3 style="color: var(--text-main); margin-bottom: 5px;">No influencers added to this campaign yet.</h3>
                        <p style="color: var(--text-muted);">Click "+ Add Influencer" to get started.</p>
                    </div>`;
                return;
            }

            const influencerIds = infoData.map(inf => inf.id);

            // 2. Fetch all relational data concurrently
            const [
                { data: platformsData },
                { data: pricingData },
                { data: bargainData },
                { data: performanceData },
                { data: dispatchData }
            ] = await Promise.all([
                window.supabase.from('influencer_platforms_details').select('*').in('influencer_id', influencerIds),
                window.supabase.from('influencer_pricing').select('*').in('influencer_id', influencerIds),
                window.supabase.from('influencer_bargain_history').select('*'), // Filtered locally via pricing_id
                window.supabase.from('influencer_brand_performance').select('*').in('influencer_id', influencerIds),
                window.supabase.from('influencer_dispatch_details').select('*').in('influencer_id', influencerIds)
            ]);

            // Combine data
            const combinedData = infoData.map(inf => {
                const platforms = (platformsData || []).filter(p => p.influencer_id === inf.id);
                const pricing = (pricingData || []).find(p => p.influencer_id === inf.id) || {};
                const bargainHistory = (bargainData || []).filter(b => b.pricing_id === pricing.id);
                const performance = (performanceData || []).filter(p => p.influencer_id === inf.id);
                const dispatchDetails = (dispatchData || []).find(d => d.influencer_id === inf.id && d.campaign_id === activeCampaignId) || null;

                return {
                    ...inf,
                    platforms,
                    pricing: { ...pricing, bargainHistory },
                    performance,
                    dispatchDetails
                };
            });

            renderInfluencerCards(combinedData, container);

        } catch (error) {
            console.error("Error loading campaign influencers:", error);
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #ff6b6b;">Failed to load influencers.</div>';
            if (window.showToast) window.showToast('❌ Error loading influencers: ' + error.message);
        }
    }

    function renderInfluencerCards(dataList, container) {
        container.innerHTML = '';
        dataList.forEach(data => {
            const card = document.createElement('div');
            card.className = 'influencer-profile-card popup-card mb-20';
            card.setAttribute('data-id', data.id);
            card.style.position = 'relative';

            // Data storage directly on DOM for easy edit extraction
            card._influencerData = data;

            // Generate Tabs UI
            const tabNavHtml = `
                <div class="tabs-nav mb-15">
                    <button class="tab-btn active" data-tab="basic-${data.id}">Basic Info</button>
                    <button class="tab-btn" data-tab="platform-${data.id}">Platform Details</button>
                    <button class="tab-btn" data-tab="pricing-${data.id}">Pricing Info</button>
                    <button class="tab-btn" data-tab="performance-${data.id}">Brand Performance</button>
                </div>
            `;

            const basicHtml = `
                <div id="basic-${data.id}" class="tab-pane">
                    <div class="grid-2">
                        <div class="info-group"><label>Name</label><div class="info-val" data-field="name">${data.name || '-'}</div></div>
                        <div class="info-group"><label>Influencer Name</label><div class="info-val" data-field="influencer_name">${data.influencer_name || '-'}</div></div>
                        <div class="info-group"><label>Phone</label><div class="info-val" data-field="phone_number">${data.phone_number || '-'}</div></div>
                        <div class="info-group"><label>Alt Phone</label><div class="info-val" data-field="alternative_number">${data.alternative_number || '-'}</div></div>
                        <div class="info-group"><label>UPI</label><div class="info-val" data-field="upi_number">${data.upi_number || '-'}</div></div>
                        <div class="info-group"><label>City</label><div class="info-val" data-field="city">${data.city || '-'}</div></div>
                        <div class="info-group"><label>State</label><div class="info-val" data-field="state">${data.state || '-'}</div></div>
                        <div class="info-group"><label>Languages</label><div class="info-val" data-field="languages">${Array.isArray(data.languages) ? data.languages.join(', ') : '-'}</div></div>
                    </div>
                    <div class="info-group mt-10"><label>Address</label><div class="info-val" data-field="complete_address">${data.complete_address || '-'}</div></div>
                </div>
            `;

            let platformHtml = `<div id="platform-${data.id}" class="tab-pane hidden" style="display: flex; flex-direction: column; gap: 20px;">`;
            if (data.platforms && data.platforms.length > 0) {
                data.platforms.forEach(p => {
                    let videoViewsHtml = '';
                    if (p.video_views && Array.isArray(p.video_views) && p.video_views.length > 0) {
                        videoViewsHtml = `<div class="video-views-grid mt-15">`;
                        p.video_views.forEach((view, idx) => {
                            videoViewsHtml += `
                                <div class="video-metric-card">
                                    <div class="video-metric-label">Video ${idx + 1}</div>
                                    <div class="video-metric-val">${view}</div>
                                </div>
                            `;
                        });
                        videoViewsHtml += `</div>`;
                    } else {
                        videoViewsHtml = `<div class="text-muted mt-10" style="font-size: 13px;">No video views recorded.</div>`;
                    }

                    platformHtml += `
                        <div class="platform-display-card">
                            <div class="platform-meta-row">
                                <div class="platform-header">${p.platform}</div>
                                ${p.profile_link ? `<a href="${p.profile_link}" target="_blank" class="btn-secondary" style="font-size: 12px; padding: 6px 12px; border-radius: 6px; text-decoration: none;">View Profile</a>` : ''}
                            </div>
                            <div class="platform-stats-grid">
                                <div class="info-group"><label>Username</label><div class="info-val">${p.username || '-'}</div></div>
                                <div class="info-group"><label>Followers</label><div class="info-val">${p.followers_count || '-'}</div></div>
                            </div>
                            <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Previous 15 Videos Views</div>
                            ${videoViewsHtml}
                        </div>
                    `;
                });
            } else {
                platformHtml += `<div class="text-muted">No platform details added.</div>`;
            }
            platformHtml += `</div>`;

            let pricingHtml = `<div id="pricing-${data.id}" class="tab-pane hidden" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="pricing-summary-grid">
                    <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Final Price</label><div class="info-val" data-field="final_price" style="font-weight: 600; font-size: 15px; color: var(--text-main);">₹${data.pricing?.final_price || 0}</div></div>
                    <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Total Videos</label><div class="info-val" data-field="total_videos" style="font-weight: 600; font-size: 15px; color: var(--text-main);">${data.pricing?.total_videos || 0}</div></div>
                </div>
                <div class="pricing-bargain-section">
                    <h3 style="font-size: 18px; font-weight: 600; color: var(--primary-color); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">Bargain History</h3>
                    <div class="bargain-history-grid">
            `;
            if (data.pricing?.bargainHistory && data.pricing.bargainHistory.length > 0) {
                data.pricing.bargainHistory.forEach((b, i) => {
                    pricingHtml += `
                        <div class="bargain-card">
                            <div class="bargain-set-title">Set ${i+1}</div>
                            <div class="pricing-summary-grid" style="margin-bottom: 0;">
                                <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Creator Request</label><div class="info-val" style="font-weight: 600; font-size: 15px; color: var(--text-main);">₹${b.creator_request || '-'}</div></div>
                                <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Brand Request</label><div class="info-val" style="font-weight: 600; font-size: 15px; color: var(--text-main);">₹${b.brand_request || '-'}</div></div>
                            </div>
                        </div>`;
                });
            } else {
                pricingHtml += `<div class="text-muted">No bargain history recorded.</div>`;
            }
            pricingHtml += `</div></div></div>`;

            let perfHtml = `<div id="performance-${data.id}" class="tab-pane hidden" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="brand-performance-grid">`;
            if (data.performance && data.performance.length > 0) {
                data.performance.forEach(p => {
                    const platforms = Array.isArray(p.uploaded_platforms) ? p.uploaded_platforms.join(', ') : '-';
                    perfHtml += `
                        <div class="brand-performance-card">
                            <div class="performance-meta-row" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Brand Name</div>
                                    <div style="font-size: 16px; font-weight: 600; color: var(--primary-color);">${p.brand_name || '-'}</div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 4px; text-align: right;">
                                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Product</div>
                                    <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${p.product_name || '-'}</div>
                                </div>
                            </div>
                            <div class="edit-grid" style="margin-bottom: 15px;">
                                <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Total Views</label><div class="info-val" style="font-weight: 600; font-size: 15px; color: var(--text-main);">${p.views || '-'}</div></div>
                                <div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Uploaded Platforms</label><div class="info-val" style="font-weight: 600; font-size: 15px; color: var(--text-main);">${platforms}</div></div>
                            </div>
                            <div class="brand-links-grid">
                                ${p.instagram_link ? `<div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Instagram</label><div class="info-val"><a href="${p.instagram_link}" target="_blank" style="font-weight: 600; font-size: 14px; color: var(--accent-color); text-decoration: none;">View Link</a></div></div>` : ''}
                                ${p.youtube_link ? `<div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Youtube</label><div class="info-val"><a href="${p.youtube_link}" target="_blank" style="font-weight: 600; font-size: 14px; color: var(--accent-color); text-decoration: none;">View Link</a></div></div>` : ''}
                                ${p.facebook_link ? `<div class="info-group" style="margin: 0;"><label style="font-size: 13px;">Facebook</label><div class="info-val"><a href="${p.facebook_link}" target="_blank" style="font-weight: 600; font-size: 14px; color: var(--accent-color); text-decoration: none;">View Link</a></div></div>` : ''}
                            </div>
                        </div>`;
                });
            } else {
                perfHtml += `<div class="text-muted">No brand performance recorded.</div>`;
            }
            perfHtml += `</div></div>`;

            const avatarUrl = data.profile_file_url || 'assets/images/default-profile.png';

            card.innerHTML = `
                <div class="influencer-header-section flex-row align-center" style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                    <div class="avatar-wrapper" style="flex-shrink: 0;">
                        <img src="${avatarUrl}" alt="Profile Image" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color); background: var(--card-bg);">
                    </div>
                    <div style="flex-grow: 1;">
                        <h2 style="margin: 0 0 5px 0; font-size: 20px; color: var(--text-main); font-weight: 600;">${data.name || 'Unknown'}</h2>
                        <div class="text-muted" style="font-size: 13px; margin-bottom: 8px;">Handle: ${data.influencer_name || '-'}</div>
                        <span class="badge" style="background: rgba(40, 167, 69, 0.15); color: #28a745; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid rgba(40, 167, 69, 0.3);">Active</span>
                    </div>
                    <div class="influencer-card-actions flex-row align-center" style="display: flex; gap: 10px; margin-left: auto;">
                        ${data.dispatchDetails 
                            ? `<button class="btn-secondary btn-dispatch-inf" data-id="${data.id}" style="padding: 6px 16px; font-size: 13px; border-radius: 6px; background-color: rgba(40, 167, 69, 0.1); color: #28a745; border-color: rgba(40, 167, 69, 0.3); pointer-events: none;" disabled>Dispatched</button>` 
                            : `<button class="btn-secondary btn-dispatch-inf" data-id="${data.id}" style="padding: 6px 16px; font-size: 13px; border-radius: 6px;">Dispatch</button>`}
                        <button class="btn-secondary btn-edit-inf" data-id="${data.id}" style="padding: 6px 16px; font-size: 13px; border-radius: 6px;">Edit</button>
                        <button class="btn-danger btn-archive-inf" data-id="${data.id}" style="padding: 6px 16px; font-size: 13px; border-radius: 6px;">Archive</button>
                    </div>
                </div>
                ${tabNavHtml}
                <div class="tabs-content" style="padding: 10px 0;">
                    ${basicHtml}
                    ${platformHtml}
                    ${pricingHtml}
                    ${perfHtml}
                </div>
            `;

            // Isolated Tab Logic
            const localTabBtns = card.querySelectorAll('.tab-btn');
            const localPanes = card.querySelectorAll('.tab-pane');
            localTabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    localTabBtns.forEach(b => b.classList.remove('active'));
                    localPanes.forEach(p => p.classList.add('hidden'));
                    btn.classList.add('active');
                    const targetPane = card.querySelector('#' + btn.getAttribute('data-tab'));
                    if (targetPane) targetPane.classList.remove('hidden');
                });
            });

            // Action Buttons
            const btnDispatch = card.querySelector('.btn-dispatch-inf');
            const btnEdit = card.querySelector('.btn-edit-inf');
            const btnArchive = card.querySelector('.btn-archive-inf');

            btnDispatch.addEventListener('click', () => {
                if (btnDispatch.disabled) return;
                const campaignId = data.campaign_id || window.selectedCampaignId;
                if (!campaignId) {
                    if (window.showToast) window.showToast("❌ Error: No active campaign found.");
                    return;
                }
                console.log("Dispatching workflow for influencer ID:", data.id, "Campaign ID:", campaignId);
                if (typeof openDispatchModal === 'function') {
                    openDispatchModal(data.id, campaignId);
                } else {
                    console.error("openDispatchModal is not defined.");
                }
            });

            btnArchive.addEventListener('click', async () => {
                if (!confirm("Are you sure you want to archive this influencer?")) return;
                
                const originalText = btnArchive.textContent;
                btnArchive.textContent = 'Archiving...';
                btnArchive.disabled = true;

                try {
                    const { error } = await window.supabase
                        .from('influencers_info')
                        .update({ is_archived: true })
                        .eq('id', data.id);
                    
                    if (error) throw error;
                    
                    if (window.showToast) window.showToast('✅ Influencer archived');
                    card.remove(); // Remove immediately without refetch
                    
                    // Show empty state if this was the last card
                    if (container.children.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state" style="text-align: center; padding: 40px;">
                                <div style="font-size: 40px; margin-bottom: 10px;">📇</div>
                                <h3 style="color: var(--text-main); margin-bottom: 5px;">No influencers added to this campaign yet.</h3>
                            </div>`;
                    }
                } catch (err) {
                    console.error("Archive error:", err);
                    if (window.showToast) window.showToast('❌ Failed to archive: ' + err.message);
                    btnArchive.textContent = originalText;
                    btnArchive.disabled = false;
                }
            });

            btnEdit.addEventListener('click', async () => {
                const isEditing = card.classList.contains('is-editing');
                if (!isEditing) {
                    // Turn ON Edit Mode
                    card.classList.add('is-editing');
                    card.classList.add('edit-mode-card');
                    btnEdit.textContent = 'Save Changes';
                    btnEdit.classList.remove('btn-secondary');
                    btnEdit.classList.add('btn-primary');
                    btnArchive.style.display = 'none'; // Hide archive while editing

                    // Convert grids to edit-grid
                    const basicPane = card.querySelector(`#basic-${data.id} .grid-2`);
                    if (basicPane) {
                        basicPane.classList.remove('grid-2');
                        basicPane.classList.add('edit-grid');
                    }


                    // Convert basic fields to inputs
                    const editableFields = ['name', 'influencer_name', 'phone_number', 'alternative_number', 'upi_number', 'city', 'state', 'complete_address'];
                    editableFields.forEach(f => {
                        const valDiv = card.querySelector(`.info-val[data-field="${f}"]`);
                        if (valDiv) {
                            const val = valDiv.textContent === '-' ? '' : valDiv.textContent;
                            valDiv.innerHTML = `<input type="text" class="edit-input" data-field="${f}" value="${val.replace(/"/g, '&quot;')}">`;
                        }
                    });

                    // Pricing final price and total videos
                    const fpDiv = card.querySelector(`.info-val[data-field="final_price"]`);
                    if (fpDiv) {
                        const val = fpDiv.textContent.replace('₹', '') === '-' ? '' : fpDiv.textContent.replace('₹', '');
                        fpDiv.innerHTML = `<input type="number" class="edit-input" data-field="final_price" value="${val}">`;
                    }
                    const tvDiv = card.querySelector(`.info-val[data-field="total_videos"]`);
                    if (tvDiv) {
                        const val = tvDiv.textContent === '-' ? '' : tvDiv.textContent;
                        tvDiv.innerHTML = `<input type="number" class="edit-input" data-field="total_videos" value="${val}">`;
                    }

                    // Append File Upload for Edit Mode
                    const editHeader = card.querySelector('.influencer-header-section');
                    if (editHeader) {
                        const imgUploadDiv = document.createElement('div');
                        imgUploadDiv.className = 'edit-img-upload-div custom-upload';
                        imgUploadDiv.innerHTML = `
                            <label class="btn-secondary" style="cursor:pointer; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; margin-right: 10px; display:inline-block;">
                                Upload Image
                                <input type="file" class="edit-img-upload hidden" accept=".jpg,.jpeg,.png,.webp">
                            </label>
                            <span class="upload-filename text-muted" style="font-size: 12px; font-weight: 500;">No file selected</span>
                        `;
                        // Insert it before the actions div
                        const actionsDiv = card.querySelector('.influencer-card-actions');
                        if (actionsDiv) {
                            editHeader.insertBefore(imgUploadDiv, actionsDiv);
                        } else {
                            editHeader.appendChild(imgUploadDiv);
                        }

                        // Add listener for filename display
                        const fileInp = imgUploadDiv.querySelector('.edit-img-upload');
                        const fileSpan = imgUploadDiv.querySelector('.upload-filename');
                        fileInp.addEventListener('change', (e) => {
                            if (e.target.files && e.target.files[0]) {
                                fileSpan.textContent = e.target.files[0].name;
                            } else {
                                fileSpan.textContent = 'No file selected';
                            }
                        });
                    }

                    // Platform Details Inline Editing
                    const platformPane = card.querySelector(`#platform-${data.id}`);
                    if (platformPane) {
                        const existingPlats = (data.platforms || []).map(p => p.platform.toLowerCase());
                        let availVal = "All";
                        if (existingPlats.length === 1) availVal = existingPlats[0].charAt(0).toUpperCase() + existingPlats[0].slice(1);
                        else if (existingPlats.includes('instagram') && existingPlats.includes('youtube') && !existingPlats.includes('facebook')) availVal = "Instagram and Youtube";
                        else if (existingPlats.includes('instagram') && existingPlats.includes('facebook') && !existingPlats.includes('youtube')) availVal = "Instagram and Facebook";
                        else if (existingPlats.includes('youtube') && existingPlats.includes('facebook') && !existingPlats.includes('instagram')) availVal = "Youtube and Facebook";
                        
                        let platEditHtml = `
                            <div class="edit-grid" style="margin-bottom: 25px;">
                                <div class="form-group">
                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Platform Availability</label>
                                    <select class="inf-edit-platform-avail edit-input">
                                        <option value="All">All</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Youtube">Youtube</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram and Youtube">Instagram and Youtube</option>
                                        <option value="Instagram and Facebook">Instagram and Facebook</option>
                                        <option value="Youtube and Facebook">Youtube and Facebook</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Platform Agreed</label>
                                    <select class="inf-edit-platform-agreed edit-input">
                                        <option value="All">All</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Youtube">Youtube</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram and Youtube">Instagram and Youtube</option>
                                        <option value="Instagram and Facebook">Instagram and Facebook</option>
                                        <option value="Youtube and Facebook">Youtube and Facebook</option>
                                    </select>
                                </div>
                            </div>
                            <div class="inf-edit-platform-forms platform-forms-container"></div>
                        `;
                        platformPane.innerHTML = platEditHtml;
                        const pfContainer = platformPane.querySelector('.inf-edit-platform-forms');
                        const availSelect = platformPane.querySelector('.inf-edit-platform-avail');
                        availSelect.value = availVal;
                        platformPane.querySelector('.inf-edit-platform-agreed').value = availVal;

                        const allPlats = ['Instagram', 'Youtube', 'Facebook'];
                        allPlats.forEach(plat => {
                            const pData = (data.platforms || []).find(p => p.platform.toLowerCase() === plat.toLowerCase());
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = generatePlatformHTML(plat);
                            const pCard = tempDiv.firstElementChild;
                            
                            if (pData) {
                                pCard.querySelector('.plat-username').value = pData.username || '';
                                pCard.querySelector('.plat-link').value = pData.profile_link || '';
                                pCard.querySelector('.plat-followers').value = pData.followers_count || '';
                                const viewInputs = pCard.querySelectorAll('.plat-video-input');
                                if (pData.video_views && Array.isArray(pData.video_views)) {
                                    pData.video_views.forEach((v, idx) => {
                                        if (viewInputs[idx]) viewInputs[idx].value = v;
                                    });
                                }
                            } else {
                                pCard.classList.add('hidden');
                            }
                            pfContainer.appendChild(pCard);
                        });

                        availSelect.addEventListener('change', (e) => {
                            const val = e.target.value;
                            const renderMap = {
                                'Instagram': ['Instagram'],
                                'Youtube': ['Youtube'],
                                'Facebook': ['Facebook'],
                                'Instagram and Youtube': ['Instagram', 'Youtube'],
                                'Instagram and Facebook': ['Instagram', 'Facebook'],
                                'Youtube and Facebook': ['Youtube', 'Facebook'],
                                'All': ['Instagram', 'Youtube', 'Facebook']
                            };
                            const toRender = renderMap[val] || [];
                            allPlats.forEach(plat => {
                                const pCard = pfContainer.querySelector(`.platform-card[data-platform-id="${plat}"]`);
                                if (pCard) {
                                    if (toRender.includes(plat)) pCard.classList.remove('hidden');
                                    else pCard.classList.add('hidden');
                                }
                            });
                        });
                        
                        availSelect.dispatchEvent(new Event('change'));
                    }

                    // Bargain History Inline Editing
                    const pricingPane = card.querySelector(`#pricing-${data.id}`);
                    if (pricingPane) {
                        const bargainContainer = pricingPane.querySelector('.bargain-history-grid');
                        if (bargainContainer) {
                            let bargainEditHtml = '';
                            if (data.pricing?.bargainHistory && data.pricing.bargainHistory.length > 0) {
                                data.pricing.bargainHistory.forEach((b, i) => {
                                    bargainEditHtml += `
                                        <div class="bargain-row bargain-edit-card">
                                            <div class="bargain-set-title" style="display: flex; justify-content: space-between; align-items: center;">
                                                <span>Set ${i+1}</span>
                                                <button type="button" class="btn-remove-bargain-set btn-danger" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; margin: 0;">Remove</button>
                                            </div>
                                            <div class="edit-grid" style="margin-bottom: 0;">
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Creator Request</label>
                                                    <input type="number" class="creator-request-input edit-input pricing-input" placeholder="Amount" value="${b.creator_request !== null ? b.creator_request : ''}">
                                                </div>
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Brand Request</label>
                                                    <input type="number" class="brand-request-input edit-input pricing-input" placeholder="Amount" value="${b.brand_request !== null ? b.brand_request : ''}">
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                });
                            } else {
                                bargainEditHtml += `
                                    <div class="bargain-row bargain-edit-card">
                                        <div class="bargain-set-title" style="display: flex; justify-content: space-between; align-items: center;">
                                            <span>Set 1</span>
                                            <button type="button" class="btn-remove-bargain-set btn-danger" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; margin: 0;">Remove</button>
                                        </div>
                                        <div class="edit-grid" style="margin-bottom: 0;">
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Creator Request</label>
                                                <input type="number" class="creator-request-input edit-input pricing-input" placeholder="Amount">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Brand Request</label>
                                                <input type="number" class="brand-request-input edit-input pricing-input" placeholder="Amount">
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                            bargainContainer.innerHTML = bargainEditHtml;
                            bargainContainer.classList.add('bargain-history-container');
                            
                            const bargainSection = pricingPane.querySelector('.pricing-bargain-section');
                            if (bargainSection && !bargainSection.querySelector('.btn-add-bargain-set')) {
                                const addBtn = document.createElement('button');
                                addBtn.type = 'button';
                                addBtn.className = 'btn-add-bargain-set btn-secondary mt-15';
                                addBtn.style = 'padding: 8px 16px; border-radius: 8px; font-size: 13px;';
                                addBtn.textContent = '+ Add Set';
                                bargainSection.appendChild(addBtn);
                            }
                        }
                    }

                    // Brand Performance Inline Editing
                    const perfPane = card.querySelector(`#performance-${data.id}`);
                    if (perfPane) {
                        const perfContainer = perfPane.querySelector('.brand-performance-grid');
                        if (perfContainer) {
                            let perfEditHtml = '';
                            if (data.performance && data.performance.length > 0) {
                                data.performance.forEach((p, i) => {
                                    const plats = Array.isArray(p.uploaded_platforms) ? p.uploaded_platforms.join(' and ') : 'All';
                                    const opts = ['All', 'Instagram', 'Youtube', 'Facebook', 'Instagram and Youtube', 'Instagram and Facebook', 'Youtube and Facebook'];
                                    let optionsHtml = '';
                                    opts.forEach(opt => {
                                        optionsHtml += `<option value="${opt}" ${plats === opt ? 'selected' : ''}>${opt}</option>`;
                                    });

                                    perfEditHtml += `
                                        <div class="performance-card brand-performance-edit-card">
                                            <div class="edit-grid" style="margin-bottom: 15px;">
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Brand</label>
                                                    <input type="text" class="perf-brand-input edit-input" placeholder="Enter brand name" value="${(p.brand_name || '').replace(/"/g, '&quot;')}">
                                                </div>
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Product</label>
                                                    <input type="text" class="perf-product-input edit-input" placeholder="Enter product name" value="${(p.product_name || '').replace(/"/g, '&quot;')}">
                                                </div>
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Views</label>
                                                    <input type="number" class="perf-views-input edit-input" placeholder="Enter total views" value="${p.views || ''}">
                                                </div>
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Uploaded Platforms</label>
                                                    <select class="perf-platform-select edit-input">
                                                        ${optionsHtml}
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="links-section">
                                                <h4 class="mb-10 text-muted" style="font-size: 14px; font-weight: 600;">Platform Links</h4>
                                                <div class="brand-links-grid">
                                                    <div class="form-group ig-link-wrapper" style="margin-bottom: 0;">
                                                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Instagram Link</label>
                                                        <input type="url" class="perf-ig-link edit-input" placeholder="https://instagram.com/..." value="${(p.instagram_link || '').replace(/"/g, '&quot;')}">
                                                    </div>
                                                    <div class="form-group yt-link-wrapper" style="margin-bottom: 0;">
                                                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Youtube Link</label>
                                                        <input type="url" class="perf-yt-link edit-input" placeholder="https://youtube.com/..." value="${(p.youtube_link || '').replace(/"/g, '&quot;')}">
                                                    </div>
                                                    <div class="form-group fb-link-wrapper" style="margin-bottom: 0;">
                                                        <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Facebook Link</label>
                                                        <input type="url" class="perf-fb-link edit-input" placeholder="https://facebook.com/..." value="${(p.facebook_link || '').replace(/"/g, '&quot;')}">
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="display: flex; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                                                <button type="button" class="btn-remove-performance btn-danger" style="padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 0;">Remove Set</button>
                                            </div>
                                        </div>
                                    `;
                                });
                            } else {
                                perfEditHtml += `
                                    <div class="performance-card brand-performance-edit-card">
                                        <div class="edit-grid" style="margin-bottom: 15px;">
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Brand</label>
                                                <input type="text" class="perf-brand-input edit-input" placeholder="Enter brand name">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Which Product</label>
                                                <input type="text" class="perf-product-input edit-input" placeholder="Enter product name">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Views</label>
                                                <input type="number" class="perf-views-input edit-input" placeholder="Enter total views">
                                            </div>
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Uploaded Platforms</label>
                                                <select class="perf-platform-select edit-input">
                                                    <option value="All">All</option>
                                                    <option value="Instagram">Instagram</option>
                                                    <option value="Youtube">Youtube</option>
                                                    <option value="Facebook">Facebook</option>
                                                    <option value="Instagram and Youtube">Instagram and Youtube</option>
                                                    <option value="Instagram and Facebook">Instagram and Facebook</option>
                                                    <option value="Youtube and Facebook">Youtube and Facebook</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="links-section">
                                            <h4 class="mb-10 text-muted" style="font-size: 14px; font-weight: 600;">Platform Links</h4>
                                            <div class="brand-links-grid">
                                                <div class="form-group ig-link-wrapper" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Instagram Link</label>
                                                    <input type="url" class="perf-ig-link edit-input" placeholder="https://instagram.com/...">
                                                </div>
                                                <div class="form-group yt-link-wrapper" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Youtube Link</label>
                                                    <input type="url" class="perf-yt-link edit-input" placeholder="https://youtube.com/...">
                                                </div>
                                                <div class="form-group fb-link-wrapper" style="margin-bottom: 0;">
                                                    <label style="color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block;">Facebook Link</label>
                                                    <input type="url" class="perf-fb-link edit-input" placeholder="https://facebook.com/...">
                                                </div>
                                            </div>
                                        </div>
                                        <div style="display: flex; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                                            <button type="button" class="btn-remove-performance btn-danger" style="padding: 6px 12px; border-radius: 6px; font-size: 12px; margin: 0;">Remove Set</button>
                                        </div>
                                    </div>
                                `;
                            }
                            perfContainer.innerHTML = perfEditHtml;
                            perfContainer.classList.add('brand-performance-container');
                            
                            // Trigger select change events to apply platform visibility logic
                            const selects = perfContainer.querySelectorAll('.perf-platform-select');
                            selects.forEach(s => s.dispatchEvent(new Event('change')));

                            if (!perfPane.querySelector('.btn-add-performance')) {
                                const addBtn = document.createElement('button');
                                addBtn.type = 'button';
                                addBtn.className = 'btn-add-performance btn-secondary mt-15 mb-20';
                                addBtn.style = 'padding: 8px 16px; border-radius: 8px; font-size: 13px;';
                                addBtn.textContent = '+ Add Performance';
                                perfPane.appendChild(addBtn);
                            }
                        }
                    }
                } else {
                    // Turn OFF Edit Mode (Save)
                    btnEdit.textContent = 'Saving...';
                    btnEdit.disabled = true;

                    try {
                        const updates = {};
                        const editInputs = card.querySelectorAll('.edit-input');
                        
                        let priceUpdates = null;

                        editInputs.forEach(inp => {
                            const field = inp.getAttribute('data-field');
                            if (field) {
                                if (field === 'final_price' || field === 'total_videos') {
                                    if (!priceUpdates) priceUpdates = {};
                                    priceUpdates[field] = inp.value ? Number(inp.value) : null;
                                } else {
                                    updates[field] = inp.value;
                                }
                            }
                        });

                        // Image upload in edit mode
                        const fileInput = card.querySelector('.edit-img-upload');
                        if (fileInput && fileInput.files.length > 0) {
                            const file = fileInput.files[0];
                            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                            if (validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
                                const campaignId = window.selectedCampaignId || 'general';
                                const timestamp = Date.now();
                                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                const filePath = `${campaignId}/${timestamp}-${safeName}`;
                                
                                const { data: upData, error: upError } = await window.supabase.storage
                                    .from('influencer-profiles')
                                    .upload(filePath, file);

                                if (upError) throw upError;

                                const { data: publicData } = window.supabase.storage
                                    .from('influencer-profiles')
                                    .getPublicUrl(filePath);

                                updates.profile_file_url = publicData.publicUrl;
                            }
                        }

                        // Extract Platform Details for Save
                        const platformPane = card.querySelector(`#platform-${data.id}`);
                        let platformDataToSave = [];
                        let platformValidationFailed = false;
                        if (platformPane) {
                            const allCards = platformPane.querySelectorAll('.inf-edit-platform-forms .platform-card');
                            allCards.forEach(pCard => {
                                if (!pCard.classList.contains('hidden')) {
                                    const platName = pCard.getAttribute('data-platform-id').toLowerCase();
                                    const username = pCard.querySelector('.plat-username').value.trim();
                                    const link = pCard.querySelector('.plat-link').value.trim();
                                    const followers = pCard.querySelector('.plat-followers').value.trim();
                                    
                                    if (!username && !link) {
                                        platformValidationFailed = true;
                                    }
                                    
                                    const views = [];
                                    pCard.querySelectorAll('.plat-video-input').forEach(inp => {
                                        views.push(inp.value ? parseInt(inp.value) : 0);
                                    });
                                    platformDataToSave.push({
                                        influencer_id: data.id,
                                        platform: platName,
                                        username: username,
                                        profile_link: link,
                                        followers_count: followers,
                                        video_views: views
                                    });
                                }
                            });
                        }

                        if (platformValidationFailed) {
                            if (window.showToast) window.showToast('❌ Please fill Username or Link for selected platforms.');
                            btnEdit.textContent = 'Save Changes';
                            btnEdit.disabled = false;
                            return;
                        }

                        // Extract Bargain History for Save
                        const pricingPane = card.querySelector(`#pricing-${data.id}`);
                        let bargainDataToSave = [];
                        let bargainValidationFailed = false;
                        if (pricingPane && data.pricing?.id) {
                            const rows = pricingPane.querySelectorAll('.bargain-history-grid .bargain-row');
                            rows.forEach(row => {
                                const creatorInput = row.querySelector('.creator-request-input');
                                const brandInput = row.querySelector('.brand-request-input');
                                
                                const creatorStr = creatorInput ? creatorInput.value.trim() : "";
                                const brandStr = brandInput ? brandInput.value.trim() : "";
                                
                                if ((creatorStr && !brandStr) || (!creatorStr && brandStr)) {
                                    bargainValidationFailed = true;
                                }
                                
                                const cReq = creatorStr ? parseFloat(creatorStr) : null;
                                const bReq = brandStr ? parseFloat(brandStr) : null;
                                
                                if (cReq !== null || bReq !== null) {
                                    bargainDataToSave.push({
                                        pricing_id: data.pricing.id,
                                        creator_request: cReq,
                                        brand_request: bReq
                                    });
                                }
                            });
                        }

                        if (bargainValidationFailed) {
                            if (window.showToast) window.showToast('❌ Please fill both Creator Request and Brand Request if entering a Bargain Set.');
                            btnEdit.textContent = 'Save Changes';
                            btnEdit.disabled = false;
                            return;
                        }

                        // 1. Update basic info
                        if (Object.keys(updates).length > 0) {
                            const { error: infoErr } = await window.supabase
                                .from('influencers_info')
                                .update(updates)
                                .eq('id', data.id);
                            if (infoErr) throw infoErr;
                        }
                        
                        // 1.5 Update platform info (Delete & Re-insert strategy)
                        if (platformPane) {
                            const { error: platDelErr } = await window.supabase
                                .from('influencer_platforms_details')
                                .delete()
                                .eq('influencer_id', data.id);
                            if (platDelErr) throw platDelErr;
                            
                            if (platformDataToSave.length > 0) {
                                const { error: platInsErr } = await window.supabase
                                    .from('influencer_platforms_details')
                                    .insert(platformDataToSave);
                                if (platInsErr) throw platInsErr;
                            }
                        }

                        // 2. Update pricing info
                        if (priceUpdates && data.pricing?.id) {
                            const { error: priceErr } = await window.supabase
                                .from('influencer_pricing')
                                .update(priceUpdates)
                                .eq('id', data.pricing.id);
                            if (priceErr) throw priceErr;
                        }
                        
                        // 2.5 Update bargain info (Delete & Re-insert strategy)
                        if (pricingPane && data.pricing?.id) {
                            const { error: bargDelErr } = await window.supabase
                                .from('influencer_bargain_history')
                                .delete()
                                .eq('pricing_id', data.pricing.id);
                            if (bargDelErr) throw bargDelErr;
                            
                            if (bargainDataToSave.length > 0) {
                                const { error: bargInsErr } = await window.supabase
                                    .from('influencer_bargain_history')
                                    .insert(bargainDataToSave);
                                if (bargInsErr) throw bargInsErr;
                            }
                        }

                        // 3. Extract and Update Brand Performance (Delete & Re-insert strategy)
                        const perfPane = card.querySelector(`#performance-${data.id}`);
                        let perfDataToSave = [];
                        let perfValidationFailed = false;

                        if (perfPane) {
                            const rows = perfPane.querySelectorAll('.brand-performance-grid .performance-card');
                            rows.forEach(row => {
                                const brandInput = row.querySelector('.perf-brand-input');
                                const productInput = row.querySelector('.perf-product-input');
                                const viewsInput = row.querySelector('.perf-views-input');
                                const platformSelect = row.querySelector('.perf-platform-select');
                                
                                const igLink = row.querySelector('.perf-ig-link');
                                const ytLink = row.querySelector('.perf-yt-link');
                                const fbLink = row.querySelector('.perf-fb-link');

                                const bName = brandInput ? brandInput.value.trim() : '';
                                const pName = productInput ? productInput.value.trim() : '';
                                const vVal = viewsInput ? viewsInput.value.trim() : '';
                                const platVal = platformSelect ? platformSelect.value : 'All';
                                
                                if (bName || pName || vVal) {
                                    if (!bName) perfValidationFailed = true;
                                    
                                    let uploadedPlatforms = [];
                                    if (platVal === 'All') {
                                        uploadedPlatforms = ['Instagram', 'Youtube', 'Facebook'];
                                    } else {
                                        uploadedPlatforms = platVal.split(' and ');
                                    }
                                    
                                    perfDataToSave.push({
                                        influencer_id: data.id,
                                        brand_name: bName,
                                        product_name: pName || null,
                                        views: vVal ? parseInt(vVal) : null,
                                        uploaded_platforms: uploadedPlatforms,
                                        instagram_link: igLink ? igLink.value.trim() : null,
                                        youtube_link: ytLink ? ytLink.value.trim() : null,
                                        facebook_link: fbLink ? fbLink.value.trim() : null
                                    });
                                }
                            });
                        }

                        if (perfValidationFailed) {
                            if (window.showToast) window.showToast('❌ Brand Name is required for all entered performance sets.');
                            btnEdit.textContent = 'Save Changes';
                            btnEdit.disabled = false;
                            return;
                        }

                        if (perfPane) {
                            const { error: perfDelErr } = await window.supabase
                                .from('influencer_brand_performance')
                                .delete()
                                .eq('influencer_id', data.id);
                            if (perfDelErr) throw perfDelErr;
                            
                            if (perfDataToSave.length > 0) {
                                const { error: perfInsErr } = await window.supabase
                                    .from('influencer_brand_performance')
                                    .insert(perfDataToSave);
                                if (perfInsErr) throw perfInsErr;
                            }
                        }

                        if (window.showToast) window.showToast('✅ Influencer updated successfully');
                        
                        // Re-fetch only this specific campaign list to refresh UI
                        // Using targeted refresh to maintain structure
                        if (window.selectedCampaignId) {
                            loadCampaignInfluencers(window.selectedCampaignId);
                        }

                    } catch (err) {
                        console.error("Edit error:", err);
                        if (window.showToast) window.showToast('❌ Failed to update: ' + err.message);
                        btnEdit.textContent = 'Save Changes';
                        btnEdit.disabled = false;
                    }
                }
            });

            container.appendChild(card);
        });
    }


    // Route from Dashboard to Dispatched List View
    if (btnCampaignDispatch && campaignDashboardView) {
        btnCampaignDispatch.addEventListener('click', () => {
            campaignDashboardView.classList.add('hidden');
            const dispatchedListView = document.getElementById('view-dispatched-list');
            if (dispatchedListView) {
                dispatchedListView.classList.remove('hidden');
                dispatchedListView.classList.add('active-view');

                const campaignId = window.selectedCampaignId;
                if (campaignId) {
                    loadCampaignDispatchList(campaignId);
                } else {
                    if (window.showToast) window.showToast('⚠ No active campaign selected');
                }
            }
            if (influencerListView) influencerListView.classList.add('hidden');
            const statusTrackingView = document.getElementById('view-status-tracking');
            if (statusTrackingView) statusTrackingView.classList.add('hidden');
        });
    }

    // Dashboard navigation specific to the "Add Influencer" view list header back button
    const btnBackToAdd = document.getElementById('btn-back-to-add-influencer');
    if (btnBackToAdd) {
        btnBackToAdd.addEventListener('click', () => {
            influencerListView.classList.add('hidden');
            document.getElementById('add-influencer-view').classList.remove('hidden');
            const dispatchedListView = document.getElementById('view-dispatched-list');
            if (dispatchedListView) dispatchedListView.classList.add('hidden');
            const statusTrackingView = document.getElementById('view-status-tracking');
            if (statusTrackingView) statusTrackingView.classList.add('hidden');
        });
    }

    if (btnSaveInfluencer) {
        btnSaveInfluencer.addEventListener('click', async () => {
            // Loading State ON
            const originalText = btnSaveInfluencer.textContent;
            btnSaveInfluencer.textContent = "Saving...";
            btnSaveInfluencer.disabled = true;

            try {
                // Extract Brand Performance Data
                const performanceContainer = document.getElementById('brand-performance-container');
                const brandPerformance = [];
                let performanceValidationFailed = false;

                if (performanceContainer) {
                    const cards = Array.from(performanceContainer.querySelectorAll('.performance-card')).filter(card => !card.classList.contains('hidden') && card.style.display !== 'none');
                    cards.forEach(card => {
                        const brandInput = card.querySelector('.perf-brand-input');
                        const productInput = card.querySelector('.perf-product-input');
                        const viewsInput = card.querySelector('.perf-views-input');
                        const platformSelect = card.querySelector('.perf-platform-select');
                        
                        const igLink = card.querySelector('.perf-ig-link');
                        const ytLink = card.querySelector('.perf-yt-link');
                        const fbLink = card.querySelector('.perf-fb-link');

                        const brand = brandInput ? brandInput.value.trim() : "";
                        const product = productInput ? productInput.value.trim() : "";
                        const viewsStr = viewsInput ? viewsInput.value.trim() : "";
                        const platformVal = platformSelect ? platformSelect.value : "All";
                        
                        // Ignore completely empty cards
                        if (!brand && !product && !viewsStr && 
                            (!igLink || !igLink.value.trim()) && 
                            (!ytLink || !ytLink.value.trim()) && 
                            (!fbLink || !fbLink.value.trim())) {
                            return;
                        }

                        // Valid if at least Brand OR Product is provided
                        if (brand === "" && product === "") {
                            performanceValidationFailed = true;
                        }

                        const renderMap = {
                            'Instagram': ['instagram'],
                            'Youtube': ['youtube'],
                            'Facebook': ['facebook'],
                            'Instagram and Youtube': ['instagram', 'youtube'],
                            'Instagram and Facebook': ['instagram', 'facebook'],
                            'Youtube and Facebook': ['youtube', 'facebook'],
                            'All': ['instagram', 'youtube', 'facebook']
                        };

                        const views = viewsStr ? parseInt(viewsStr) : null;

                        brandPerformance.push({
                            brand: brand,
                            product: product,
                            views: Number.isNaN(views) ? null : views,
                            uploadedPlatforms: renderMap[platformVal] || [],
                            links: {
                                instagram: igLink ? igLink.value.trim() : "",
                                youtube: ytLink ? ytLink.value.trim() : "",
                                facebook: fbLink ? fbLink.value.trim() : ""
                            }
                        });
                    });
                }

                if (performanceValidationFailed) {
                    throw new Error("Each Brand Performance card requires at least a Brand or Product name.");
                }

                // Save to state
                if (!window.newInfluencerData) {
                    window.newInfluencerData = { basicInfo: {}, platformDetails: {}, pricingInfo: {}, brandPerformance: {} };
                }
                window.newInfluencerData.brandPerformance = brandPerformance;

                // Validate Entire Wizard
                const d = window.newInfluencerData;
                if (!d.basicInfo || Object.keys(d.basicInfo).length === 0) {
                    throw new Error("Basic Info is missing. Please review the first tab.");
                }
                if (!d.platformDetails || Object.keys(d.platformDetails).length === 0) {
                    throw new Error("Platform Details are missing. Please review the second tab.");
                }
                if (!d.pricingInfo || Object.keys(d.pricingInfo).length === 0) {
                    throw new Error("Pricing Info is missing. Please review the third tab.");
                }

                // ALL DATA COLLECTED SUCCESSFULLY
                console.log("========================================");
                console.log("FINAL INFLUENCER DATA READY FOR SUPABASE");
                console.log("========================================");
                console.log(JSON.stringify(window.newInfluencerData, null, 2));
                
                // --- SUPABASE INTEGRATION START ---
                // Verify Save Influencer reads the SAME global state value
                const campaignId = window.selectedCampaignId;

                if (!campaignId) {
                    throw new Error("No active campaign selected. Please select a campaign folder first.");
                }
                
                console.log("Saving Influencer to Campaign ID:", campaignId);

                const basic = d.basicInfo;
                
                // 1. Insert into influencers_info
                const { data: infoData, error: infoError } = await window.supabase
                    .from('influencers_info')
                    .insert([{
                        campaign_id: campaignId,
                        name: basic.name,
                        influencer_name: basic.influencer_name,
                        phone_number: basic.phone,
                        alternative_number: basic.alt_phone,
                        upi_number: basic.upi,
                        city: basic.city,
                        complete_address: basic.address,
                        state: basic.state,
                        languages: basic.languages || [],
                        profile_file_url: window.uploadedProfileUrl || null
                    }])
                    .select();

                if (infoError) {
                    console.error("Error inserting influencer_info:", infoError);
                    throw new Error("Failed to save influencer basic info: " + infoError.message);
                }

                const influencerId = infoData[0].id;
                console.log("Saved Influencer Info. ID:", influencerId);

                // 2. Insert into influencer_platforms_details
                const platformInserts = [];
                const pDetails = d.platformDetails;
                if (pDetails) {
                    for (const [platformName, platData] of Object.entries(pDetails)) {
                        if (platData.username || platData.profileLink) {
                            platformInserts.push({
                                influencer_id: influencerId,
                                platform: platformName,
                                username: platData.username || null,
                                profile_link: platData.profileLink || null,
                                followers_count: platData.followers || null,
                                video_views: platData.videoViews || []
                            });
                        }
                    }
                }
                
                if (platformInserts.length > 0) {
                    await Promise.all(platformInserts.map(async (platData) => {
                        const { error: platError } = await window.supabase
                            .from('influencer_platforms_details')
                            .insert([platData]);
                        if (platError) {
                            console.error("Error inserting platform details:", platError);
                            throw new Error("Failed to save platform details: " + platError.message);
                        }
                    }));
                    console.log("Saved Platform Details.");
                }

                // 3. Insert into influencer_pricing
                const pricing = d.pricingInfo;
                const { data: priceData, error: priceError } = await window.supabase
                    .from('influencer_pricing')
                    .insert([{
                        influencer_id: influencerId,
                        final_price: pricing.finalPrice,
                        total_videos: pricing.totalVideos
                    }])
                    .select();
                
                if (priceError || !priceData || priceData.length === 0) {
                    console.error("Error inserting pricing info:", priceError);
                    throw new Error("Failed to save pricing info: " + (priceError?.message || "No data returned"));
                }
                const pricingId = priceData[0].id;
                console.log("Saved Pricing Info. ID:", pricingId);

                // 4. Insert into influencer_bargain_history
                const bargainInserts = [];
                if (pricing.bargainHistory && pricing.bargainHistory.length > 0) {
                    pricing.bargainHistory.forEach(b => {
                        if (b.creatorRequest || b.brandRequest) {
                            bargainInserts.push({
                                pricing_id: pricingId,
                                creator_request: b.creatorRequest,
                                brand_request: b.brandRequest
                            });
                        }
                    });
                }

                if (bargainInserts.length > 0) {
                    await Promise.all(bargainInserts.map(async (bargainData) => {
                        const { error: bargainError } = await window.supabase
                            .from('influencer_bargain_history')
                            .insert([bargainData]);
                        if (bargainError) {
                            console.error("Error inserting bargain history:", bargainError);
                            throw new Error("Failed to save bargain history: " + bargainError.message);
                        }
                    }));
                    console.log("Saved Bargain History.");
                }

                // 5. Insert into influencer_brand_performance
                const perfInserts = [];
                if (d.brandPerformance && d.brandPerformance.length > 0) {
                    d.brandPerformance.forEach(p => {
                        perfInserts.push({
                            influencer_id: influencerId,
                            brand_name: p.brand,
                            product_name: p.product,
                            views: p.views,
                            uploaded_platforms: p.uploadedPlatforms || [],
                            instagram_link: p.links?.instagram || null,
                            youtube_link: p.links?.youtube || null,
                            facebook_link: p.links?.facebook || null
                        });
                    });
                }

                if (perfInserts.length > 0) {
                    await Promise.all(perfInserts.map(async (perfData) => {
                        const { error: perfError } = await window.supabase
                            .from('influencer_brand_performance')
                            .insert([perfData]);
                        if (perfError) {
                            console.error("Error inserting brand performance:", perfError);
                            throw new Error("Failed to save brand performance: " + perfError.message);
                        }
                    }));
                    console.log("Saved Brand Performance.");
                }

                if (typeof showToast === 'function') {
                    showToast('✅ Influencer Data Saved Successfully!');
                } else {
                    alert('Influencer Data Saved Successfully!');
                }

                // --- RESET FULL WIZARD ---
                // Reset all forms
                document.querySelectorAll('.tab-pane form').forEach(f => f.reset());
                document.querySelectorAll('.scoped-pane form').forEach(f => f.reset());

                // Reset custom language dropdown
                const languageSelectedText = document.getElementById('language-selected-text');
                if (languageSelectedText) languageSelectedText.textContent = 'Select Language(s)';

                // Clear dynamic platform inputs
                document.querySelectorAll('.platform-card:not(.hidden) input').forEach(inp => inp.value = '');

                // Reset bargain rows to 1
                const bargainContainer = document.querySelector('.bargain-history-container');
                if (bargainContainer) {
                    const rows = bargainContainer.querySelectorAll('.bargain-row');
                    rows.forEach((r, idx) => {
                        if (idx > 0) r.remove();
                        else {
                            r.querySelectorAll('input').forEach(inp => inp.value = '');
                        }
                    });
                }

                // Reset performance cards to 1
                const perfContainer = document.querySelector('.brand-performance-container');
                if (perfContainer) {
                    const cards = perfContainer.querySelectorAll('.performance-card');
                    cards.forEach((c, idx) => {
                        if (idx > 0) c.remove();
                        else {
                            c.querySelectorAll('input').forEach(inp => inp.value = '');
                            const select = c.querySelector('select');
                            if (select) {
                                select.value = 'All';
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    });
                }

                // Go to first tab
                const firstTabBtn = document.querySelector('.tab-btn[data-tab="tab-basic-info"]');
                if (firstTabBtn) firstTabBtn.click();

                // Clear temporary wizard state
                window.newInfluencerData = { basicInfo: {}, platformDetails: {}, pricingInfo: {}, brandPerformance: {} };
                window.uploadedProfileUrl = null;

                // Reset upload msg
                const msgSpan = document.querySelector('.upload-msg');
                if (msgSpan) msgSpan.remove();

                // Refresh influencer list UI automatically
                const btnInfluencerListNav = document.getElementById('btn-influencer-list');
                if (btnInfluencerListNav) btnInfluencerListNav.click();

            } catch (err) {
                console.warn(err.message);
                if (typeof showToast === 'function') {
                    showToast('❌ ' + err.message);
                } else {
                    alert('Error: ' + err.message);
                }
            } finally {
                // Loading State OFF
                btnSaveInfluencer.textContent = originalText;
                btnSaveInfluencer.disabled = false;
            }
        });
    }

    // --- Dispatch Modal Fetch Logic ---
    async function openDispatchModal(influencerId, campaignId) {
        const dispatchModal = document.getElementById('dispatch-modal');
        if (!dispatchModal) return;

        window.currentDispatchInfluencerId = influencerId;
        window.currentDispatchCampaignId = campaignId;

        // Reset the form
        const form = document.getElementById('dispatch-form');
        if (form) form.reset();
        
        // Disable product inputs initially
        document.querySelectorAll('.product-quantity-input').forEach(input => {
            input.disabled = true;
            input.value = '';
        });

        // Safe fallback helper
        const safeVal = (val) => (val === null || val === undefined) ? '' : val;

        // Show modal
        dispatchModal.classList.remove('hidden');
        
        try {
            // Fetch Influencer Data
            const { data: infData, error: infError } = await window.supabase
                .from('influencers_info')
                .select('*')
                .eq('id', influencerId)
                .single();
                
            if (infError) throw infError;

            // Fetch Campaign Data
            const { data: campData, error: campError } = await window.supabase
                .from('influencer_create_campaigns')
                .select('campaign_name')
                .eq('id', campaignId)
                .single();
                
            if (campError) throw campError;

            // Map fields
            const fName = document.getElementById('dispatch-creator-name');
            const fPhone = document.getElementById('dispatch-phone');
            const fAltPhone = document.getElementById('dispatch-alt-phone');
            const fAddress = document.getElementById('dispatch-address');
            const fState = document.getElementById('dispatch-state');
            const fCampaign = document.getElementById('dispatch-campaign');

            if (fName) { fName.value = safeVal(infData.name); fName.readOnly = true; }
            if (fPhone) { fPhone.value = safeVal(infData.phone_number); fPhone.readOnly = true; }
            if (fAltPhone) { fAltPhone.value = safeVal(infData.alternative_number); fAltPhone.readOnly = true; }
            if (fAddress) { fAddress.value = safeVal(infData.complete_address); fAddress.readOnly = true; }
            if (fState) { fState.value = safeVal(infData.state); fState.readOnly = true; }
            if (fCampaign) { fCampaign.value = safeVal(campData.campaign_name); fCampaign.readOnly = true; }

        } catch (error) {
            console.error('Error fetching dispatch data:', error);
            if (window.showToast) window.showToast('❌ Error loading dispatch data.');
        }
    }

    // --- Dispatch Modal Logic ---
    const dispatchModal = document.getElementById('dispatch-modal');
    const btnCloseDispatch = document.getElementById('btn-close-dispatch');
    const btnSubmitDispatch = document.getElementById('btn-submit-dispatch');

    if (dispatchModal && btnCloseDispatch && btnSubmitDispatch) {
        btnCloseDispatch.addEventListener('click', () => {
            dispatchModal.classList.add('hidden');
        });

        // --- Quantity Auto Calculation Logic (Campaign Products) ---
        const dispatchTotalProducts = document.getElementById('dispatch-total-products');
        const productCheckboxes = document.querySelectorAll('.product-checkbox');
        const quantityInputs = document.querySelectorAll('.product-quantity-input');

        function updateTotalProducts() {
            if (!dispatchTotalProducts) return;
            let total = 0;
            quantityInputs.forEach(input => {
                if (!input.disabled) {
                    total += parseInt(input.value, 10) || 0;
                }
            });
            dispatchTotalProducts.value = total;
        }

        // Handle Checkbox Toggles
        productCheckboxes.forEach((checkbox, index) => {
            const qtyInput = quantityInputs[index];
            if (!qtyInput) return;

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    qtyInput.disabled = false;
                    qtyInput.value = 1; // Default to 1 when checked
                } else {
                    qtyInput.disabled = true;
                    qtyInput.value = ''; // Reset when unchecked
                }
                updateTotalProducts();
            });
        });

        // Handle Quantity Input Changes
        quantityInputs.forEach(input => {
            input.addEventListener('input', () => {
                updateTotalProducts();
            });
        });

        // Close when clicking outside modal content
        dispatchModal.addEventListener('click', (e) => {
            if (e.target === dispatchModal) {
                dispatchModal.classList.add('hidden');
            }
        });

        btnSubmitDispatch.addEventListener('click', async () => {
            if (!window.currentDispatchInfluencerId || !window.currentDispatchCampaignId) {
                if (window.showToast) window.showToast('❌ Error: Missing Influencer or Campaign ID.');
                return;
            }

            const influencerId = window.currentDispatchInfluencerId;
            const campaignId = window.currentDispatchCampaignId;

            // Form references
            const fCreatorName = document.getElementById('dispatch-creator-name').value;
            const fDate = document.getElementById('dispatch-date').value;
            
            if (!fCreatorName || !fDate) {
                if (window.showToast) window.showToast('❌ Please fill in Creator Name and Dispatch Date.');
                return;
            }

            // Products
            const selectedProducts = [];
            document.querySelectorAll('.product-checkbox:checked').forEach(cb => {
                const qtyInput = cb.closest('.product-item').querySelector('.product-quantity-input');
                selectedProducts.push({
                    product_name: cb.getAttribute('data-product'),
                    quantity: qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1
                });
            });

            if (selectedProducts.length === 0) {
                if (window.showToast) window.showToast('❌ Please select at least one product.');
                return;
            }

            const originalText = btnSubmitDispatch.textContent;
            btnSubmitDispatch.textContent = 'Saving...';
            btnSubmitDispatch.disabled = true;

            try {
                // File uploads helper
                const uploadPhoto = async (inputId) => {
                    const input = document.getElementById(inputId);
                    if (!input || !input.files || input.files.length === 0) return null;
                    const file = input.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `dispatch/${fileName}`;

                    const { data, error } = await window.supabase.storage
                        .from('influencer-profiles')
                        .upload(filePath, file);

                    if (error) throw error;

                    const { data: publicData } = window.supabase.storage
                        .from('influencer-profiles')
                        .getPublicUrl(filePath);

                    return publicData.publicUrl;
                };

                const packPhotoUrl = await uploadPhoto('dispatch-pack-photo');
                const finalPhotoUrl = await uploadPhoto('dispatch-final-photo');

                // Payload
                const payload = {
                    influencer_id: influencerId,
                    campaign_id: campaignId,
                    creator_name: fCreatorName,
                    phone_number: document.getElementById('dispatch-phone').value || null,
                    alternative_phone_number: document.getElementById('dispatch-alt-phone').value || null,
                    address: document.getElementById('dispatch-address').value || null,
                    state: document.getElementById('dispatch-state').value || null,
                    campaign_name: document.getElementById('dispatch-campaign').value || null,
                    product_name: document.getElementById('dispatch-product') ? document.getElementById('dispatch-product').value : null,
                    selected_products: selectedProducts,
                    total_products: parseInt(document.getElementById('dispatch-total-products').value, 10) || 0,
                    total_product_value: parseFloat(document.getElementById('dispatch-total-value').value) || null,
                    total_weight: document.getElementById('dispatch-total-weight').value || null,
                    product_photo_url: packPhotoUrl,
                    courier_partner: document.getElementById('dispatch-courier').value || null,
                    dispatch_photo_url: finalPhotoUrl,
                    tracking_id: document.getElementById('dispatch-track-id') ? document.getElementById('dispatch-track-id').value : null,
                    dispatch_date: fDate,
                    expected_delivery_date: document.getElementById('dispatch-delivery-date').value || null,
                    dispatch_status: 'Dispatched'
                };

                const { error } = await window.supabase
                    .from('influencer_dispatch_details')
                    .insert([payload]);

                if (error) throw error;

                if (window.showToast) window.showToast('✅ Influencer successfully dispatched!');

                // Update Button UI dynamically without reload
                const card = document.querySelector(`.influencer-profile-card[data-id="${influencerId}"]`);
                if (card) {
                    const btnDispatch = card.querySelector('.btn-dispatch-inf');
                    if (btnDispatch) {
                        btnDispatch.textContent = 'Dispatched';
                        btnDispatch.disabled = true;
                        btnDispatch.style.pointerEvents = 'none';
                        btnDispatch.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                        btnDispatch.style.color = '#28a745';
                        btnDispatch.style.borderColor = 'rgba(40, 167, 69, 0.3)';
                    }
                }

                // Reset modal and close
                const form = document.getElementById('dispatch-form');
                if (form) form.reset();
                document.querySelectorAll('.product-quantity-input').forEach(input => {
                    input.disabled = true;
                    input.value = '';
                });
                const packPreview = document.getElementById('preview-pack-photo');
                if (packPreview) packPreview.innerHTML = '<span>No Image</span>';
                
                const finalPreview = document.getElementById('preview-final-photo');
                if (finalPreview) finalPreview.innerHTML = '<span>No Image</span>';

                dispatchModal.classList.add('hidden');
                
                window.currentDispatchInfluencerId = null;
                window.currentDispatchCampaignId = null;

            } catch (err) {
                console.error("Dispatch Error:", err);
                if (window.showToast) window.showToast('❌ Dispatch failed: ' + err.message);
            } finally {
                btnSubmitDispatch.textContent = originalText;
                btnSubmitDispatch.disabled = false;
            }
        });
    }

    // --- Dispatched List Page Rendering Logic ---
    // (Removed global dispatched list folder logic)

    async function loadCampaignDispatchList(campaignId) {
        const dispatchedInfluencersContainer = document.getElementById('dispatched-influencers-container');
        if (!dispatchedInfluencersContainer) return;

        dispatchedInfluencersContainer.classList.remove('hidden');
        dispatchedInfluencersContainer.innerHTML = '<div style="text-align: center; width: 100%; padding: 40px; color: var(--text-muted);">Loading dispatch records...</div>';

        const dispatchedBreadcrumb = document.getElementById('dispatched-breadcrumb');
        if (dispatchedBreadcrumb) dispatchedBreadcrumb.textContent = `${campaignId} Dispatched List`;

        try {
            // Fetch records for this campaign
            const { data: dispatchData, error: dispatchError } = await window.supabase
                .from('influencer_dispatch_details')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });

            if (dispatchError) throw dispatchError;

            if (!dispatchData || dispatchData.length === 0) {
                dispatchedInfluencersContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                        <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;">📦</div>
                        <h3 style="color: var(--text-main); margin-bottom: 10px;">No dispatched influencers found for this campaign.</h3>
                        <p class="text-muted">Dispatched influencers for this campaign will appear here.</p>
                    </div>
                `;
                return;
            }

            // Extract unique influencer IDs
            const influencerIds = [...new Set(dispatchData.map(d => d.influencer_id))];

            // Fetch influencer info
            const { data: infoData, error: infoError } = await window.supabase
                .from('influencers_info')
                .select('id, name, profile_file_url')
                .in('id', influencerIds);

            if (infoError) throw infoError;

            const infoMap = {};
            if (infoData) {
                infoData.forEach(info => {
                    infoMap[info.id] = info;
                });
            }

            dispatchedInfluencersContainer.innerHTML = '';

            dispatchData.forEach(record => {
                const info = infoMap[record.influencer_id] || {};
                const recordCard = document.createElement('div');
                recordCard.className = 'dispatch-full-card'; 

                let productsHTML = '';
                if (record.selected_products && record.selected_products.length > 0) {
                    record.selected_products.forEach(p => {
                        productsHTML += `<div style="font-size: 0.9rem; margin-bottom: 8px; display: flex; justify-content: space-between;">
                            <span style="color: #bbb;">• ${p.product_name}</span>
                            <strong>Qty: ${p.quantity}</strong>
                        </div>`;
                    });
                } else {
                    productsHTML = '<span style="color: #888;">No products selected</span>';
                }

                const avatarUrl = info.profile_file_url || 'assets/images/default-profile.png';
                const avatarHTML = `<div class="avatar-wrapper" style="flex-shrink: 0; width: 44px; height: 44px;">
                    <img src="${avatarUrl}" alt="Profile Image" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid #444; background: #2a2a30;">
                </div>`;

                // Missing image placeholder component
                const imgFallback = `<div class="dispatch-photo-box"><span>No Image</span></div>`;

                const productImg = record.product_photo_url 
                    ? `<div class="dispatch-photo-box"><img src="${record.product_photo_url}" alt="Product Photo"></div>`
                    : imgFallback;

                const dispatchImg = record.dispatch_photo_url 
                    ? `<div class="dispatch-photo-box"><img src="${record.dispatch_photo_url}" alt="Dispatch Photo"></div>`
                    : imgFallback;

                const safeVal = (v) => v || '-';

                recordCard.innerHTML = `
                    <div class="dispatch-full-header">
                        <div class="dispatch-user" style="display: flex; align-items: center; gap: 12px;">
                            ${avatarHTML}
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem;">${record.creator_name}</h3>
                                <span style="font-size: 0.8rem; color: #a0a0a0;">Dispatch ID: ${record.id}</span>
                            </div>
                        </div>
                        <button class="btn-move-status" data-dispatch-id="${record.id}">
                            Move To
                        </button>
                    </div>
                    <div class="dispatch-full-body">
                        <div class="dispatch-details-grid">
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Phone</span><span class="dispatch-info-val">${safeVal(record.phone_number)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Alt Phone</span><span class="dispatch-info-val">${safeVal(record.alternative_phone_number)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Address</span><span class="dispatch-info-val" style="word-break: break-word;">${safeVal(record.address)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">State</span><span class="dispatch-info-val">${safeVal(record.state)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Dispatch Date</span><span class="dispatch-info-val">${safeVal(record.dispatch_date)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Exp. Delivery Date</span><span class="dispatch-info-val">${safeVal(record.expected_delivery_date)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Campaign Name</span><span class="dispatch-info-val">${safeVal(record.campaign_name)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Product Name</span><span class="dispatch-info-val">${safeVal(record.product_name)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Courier Partner</span><span class="dispatch-info-val">${safeVal(record.courier_partner)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Track ID</span><span class="dispatch-info-val">${safeVal(record.tracking_id)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Total Value</span><span class="dispatch-info-val">${safeVal(record.total_product_value)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Total Weight</span><span class="dispatch-info-val">${safeVal(record.total_weight)}</span></div>
                            <div class="dispatch-info-item"><span class="dispatch-info-label">Total Products</span><span class="dispatch-info-val">${safeVal(record.total_products)}</span></div>
                        </div>

                        <div style="margin-top: 10px;">
                            <h4 style="font-size: 0.9rem; color: #fff; margin-bottom: 8px;">Products Sent</h4>
                            <div class="dispatch-products-list">
                                ${productsHTML}
                            </div>
                        </div>

                        <div>
                            <h4 style="font-size: 0.9rem; color: #fff; margin-bottom: 0;">Dispatch Photos</h4>
                            <div class="dispatch-photos-grid">
                                <div class="dispatch-photo-container">
                                    <span class="dispatch-photo-title">Product Photo</span>
                                    ${productImg}
                                </div>
                                <div class="dispatch-photo-container">
                                    <span class="dispatch-photo-title">Dispatch Photo</span>
                                    ${dispatchImg}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Attach Move To button handler
                const moveToBtn = recordCard.querySelector('.btn-move-status');
                if (moveToBtn) {
                    moveToBtn.addEventListener('click', () => {
                        const campaignName = window.selectedCampaignId || record.campaign_name;
                        window.loadCampaignStatusTracking(campaignName, record.id);
                    });
                }

                dispatchedInfluencersContainer.appendChild(recordCard);
            });
            
        } catch (error) {
            console.error('Error fetching dispatch records:', error);
            dispatchedInfluencersContainer.innerHTML = '<div style="text-align: center; width: 100%; padding: 40px; color: #ff6b6b;">Error loading dispatch records.</div>';
            if (window.showToast) window.showToast('❌ Failed to load dispatch list.');
        }
    }

    // --- Status Tracking Page Logic ---
    function getStatusStages(record) {
        let stages = [
            'Delivered',
            'Pay Advance',
            'Send Reference Videos',
            'Expected Delivery Timeline',
            'Draft'
        ];
        if (record && record.workflowState && record.workflowState.hasRework) {
            stages.push('Re-Expected Delivery Timeline', 'Re-Draft');
        }
        stages.push('Pay Remaining Payment', 'Final Post Date');
        return stages;
    }

    function formatTimelinePreview(dateStr, timeStr) {
        if (!dateStr || !timeStr) return '';
        try {
            const d = new Date(`${dateStr}T${timeStr}`);
            const day = d.getDate();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[d.getMonth()];
            const year = d.getFullYear();

            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const hoursStr = String(hours).padStart(2, '0');

            return `${day} ${month} ${year} • ${hoursStr}:${minutes} ${ampm}`;
        } catch (e) {
            return `${dateStr} • ${timeStr}`;
        }
    }

    window.loadCampaignStatusTracking = async function(campaignName, targetDispatchId = null) {
        // Hide all other views in the right panel
        const viewsToHide = [
            'campaign-dashboard-view',
            'add-influencer-view',
            'influencer-list-view',
            'view-dispatched-list',
            'content-viewer-placeholder',
            'campaign-form-container'
        ];
        viewsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('active-view');
            }
        });

        const statusView = document.getElementById('view-status-tracking');
        if (!statusView) return;
        statusView.classList.remove('hidden');
        statusView.classList.add('active-view');

        // Update breadcrumb
        const breadcrumb = document.getElementById('st-breadcrumb');
        if (breadcrumb) {
            breadcrumb.textContent = `${campaignName || 'Campaign'} — Status Tracking`;
        }

        const stCardsContainer = document.getElementById('st-cards-container');
        if (!stCardsContainer) return;

        stCardsContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding:40px;">Loading tracking records...</p>';

        try {
            // Fetch tracking records joined with dispatch details and info
            const { data: trackingData, error: trackingError } = await window.supabase
                .from('influencer_status_tracking')
                .select('*, influencer_dispatch_details!inner(*, influencers_info(name, profile_file_url))');
                
            if (trackingError) throw trackingError;

            // Filter for campaign: handle cases where campaignIdentifier is either ID or Name
            const campaignRecords = trackingData.filter(t => {
                const matchId = String(t.campaign_id) === String(campaignName) || 
                               (t.influencer_dispatch_details && String(t.influencer_dispatch_details.campaign_id) === String(campaignName));
                const matchName = t.influencer_dispatch_details && t.influencer_dispatch_details.campaign_name === campaignName;
                return matchId || matchName;
            });

            if (campaignRecords.length === 0) {
                stCardsContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding:40px;">No dispatched influencers to track.</p>';
                return;
            }

            // Fix breadcrumb to display actual campaign name if an ID was passed
            if (breadcrumb && campaignRecords.length > 0 && campaignRecords[0].influencer_dispatch_details) {
                const actualName = campaignRecords[0].influencer_dispatch_details.campaign_name;
                breadcrumb.textContent = `${actualName || 'Campaign'} — Status Tracking`;
            }

            // Render all records
            stCardsContainer.innerHTML = '';
            campaignRecords.forEach(tracking => {
                // Map to match the template structure
                const dispatch = tracking.influencer_dispatch_details;
                const info = dispatch.influencers_info || {};
                const record = {
                    id: tracking.id,
                    dispatchId: dispatch.id,
                    influencerId: tracking.influencer_id,
                    campaignId: tracking.campaign_id,
                    campaignName: dispatch.campaign_name,
                    creatorName: info.name,
                    address: dispatch.address,
                    state: dispatch.state,
                    phoneNumber: dispatch.phone_number,
                    altPhoneNumber: dispatch.alternative_phone_number,
                    dispatchDate: dispatch.dispatch_date,
                    expectedDelivery: dispatch.expected_delivery_date,
                    productName: dispatch.product_name,
                    totalProducts: dispatch.total_products,
                    totalValue: dispatch.total_product_value,
                    courierPartner: dispatch.courier_partner,
                    trackingIdStr: dispatch.tracking_id,
                    avatar: info.profile_file_url,
                    
                    // Status tracking state mapped
                    current_step: tracking.current_step,
                    deliveredConfirmed: tracking.delivered_confirmed,
                    deliveryPhoto: tracking.delivery_photo_url,
                    payAdvanceCompleted: tracking.pay_advance_completed,
                    payAdvancePhoto: tracking.pay_advance_photo_url,
                    refVideosCompleted: tracking.reference_video_received,
                    draftTimelineCompleted: tracking.expected_delivery_completed,
                    draftCompleted: tracking.draft_received,
                    payRemainingCompleted: tracking.payment_remaining_completed,
                    payRemainingPaid: tracking.payment_remaining_completed, // Maps UI checkbox correctly to backend
                    finalPostCompleted: tracking.final_post_completed,
                    
                    // New Persistence Mappings
                    payAdvanceGPay: tracking.advance_gpay_number || '',
                    payAdvanceTotal: tracking.advance_total_amount || '',
                    payAdvanceAmount: tracking.advance_paid_amount || '',

                    refConcept: tracking.ref_concept || '',
                    refScript: tracking.ref_script || '',
                    refKeyPoints: tracking.ref_keypoints || '',
                    refOffer: tracking.ref_offer || '',
                    refLink: tracking.ref_link || '',
                    refCallExplanation: tracking.ref_call_explanation_required || false,
                    referenceVideos: tracking.reference_videos_list || [''],

                    draftDate: tracking.draft_expected_date || '',
                    draftTime: tracking.draft_expected_time || '',
                    postingTimeline: tracking.posting_timelines || [],

                    draftVideo: tracking.draft_video_url || '',
                    draftApproved: tracking.draft_approval_status || '',
                    draftTiming: tracking.draft_timing_status || '',
                    draftCorrections: tracking.draft_corrections_required || '',
                    draftFinalLink: tracking.draft_final_product_link || '',
                    draftFinalDesc: tracking.draft_final_description || '',

                    payRemainingPhoto: tracking.payment_remaining_photo_url || '',

                    finalPostLink: tracking.final_post_link || '',
                    actualPostTime: tracking.final_post_actual_datetime || null,
                    finalPostConfirmed: !!tracking.final_post_actual_datetime,

                    reDraftDate: tracking.re_draft_expected_date || '',
                    reDraftTime: tracking.re_draft_expected_time || '',
                    rePostingTimeline: tracking.re_posting_timelines || [],
                    reDraftVideo: tracking.re_draft_video_url || '',
                    reDraftApproved: tracking.re_draft_approval_status || '',
                    reDraftTiming: tracking.re_draft_timing_status || '',
                    reDraftCorrections: tracking.re_draft_corrections_required || '',
                    reDraftFinalLink: tracking.re_draft_final_product_link || '',
                    reDraftFinalDesc: tracking.re_draft_final_description || '',

                    workflowState: { hasRework: !!tracking.re_draft_expected_date || !!tracking.re_draft_approval_status }
                };
                
                console.log(`Rendering Tracking Card ID: ${record.id}`);
                console.log(`DB delivery_photo_url:`, tracking.delivery_photo_url);
                console.log(`Mapped record.deliveryPhoto:`, record.deliveryPhoto);

                renderStatusTrackingCard(record, stCardsContainer);
                
                // Add Save workflow event listeners
                attachTrackingSaveListeners(tracking.id);
            });

            // Scroll to specific card if requested
            if (targetDispatchId) {
                setTimeout(() => {
                    const targetCard = document.getElementById(`st-card-${targetDispatchId}`);
                    if (targetCard) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetCard.classList.add('highlight-flash');
                        setTimeout(() => targetCard.classList.remove('highlight-flash'), 2000);
                    }
                }, 100);
            }
        } catch (e) {
            console.error("Error loading status tracking:", e);
            stCardsContainer.innerHTML = '<p class="text-danger" style="text-align:center; padding:40px;">Failed to load tracking data.</p>';
        }
    }

    function generateTimelineHTML(record, isRework = false) {
        const prefix = isRework ? 're-' : '';
        const titlePrefix = isRework ? 'Re-' : '';
        const timelineComplete = isRework ? record.reDraftTimelineCompleted : record.draftTimelineCompleted;
        const dDate = isRework ? record.reDraftDate : record.draftDate;
        const dTime = isRework ? record.reDraftTime : record.draftTime;
        const postComplete = isRework ? record.rePostingTimelineCompleted : record.postingTimelineCompleted;
        const postTimeline = isRework ? record.rePostingTimeline : record.postingTimeline;

        return `
            <!-- Unified Timeline & Posting Section -->
            <div class="st-timeline-form-container" id="${prefix}timeline-form-container-${record.id}">
                <div class="st-timeline-two-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Draft Timeline Section -->
                    <div class="st-timeline-section">
                        <div class="st-delivered-title">${titlePrefix}Draft Timeline</div>
                        <div class="st-timeline-form">
                            <div class="st-timeline-inner-card" style="margin: 0; max-width: 100%;">
                                <label class="st-label mb-10">Estimated Draft Delivery Date</label>
                                <div class="st-timeline-grid">
                                    <div class="form-group">
                                        <input type="date" id="${prefix}draft-date-${record.id}" value="${dDate || ''}" class="st-input">
                                    </div>
                                    <div class="form-group">
                                        <input type="time" id="${prefix}draft-time-${record.id}" value="${dTime || ''}" class="st-input">
                                    </div>
                                </div>
                            </div>
                            <div id="${prefix}timeline-preview-${record.id}" style="text-align: center;">
                                ${timelineComplete ? `
                                    <div class="st-timeline-preview mt-15">
                                        <span class="text-success fs-xs">${titlePrefix}Draft Delivery: ${formatTimelinePreview(dDate, dTime)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Posting Timeline Section -->
                    <div class="st-timeline-section">
                        <div class="st-delivered-title">${titlePrefix}Posting Timeline (If Approved)</div>
                        <div class="st-timeline-form" id="${prefix}posting-platforms-container-${record.id}">
                            ${(() => {
                const platforms = record.platformAgreed ? record.platformAgreed.split(',').map(p => p.trim()).filter(p => p) : [];
                if (platforms.length === 0) {
                    return `<div class="st-value text-muted" style="padding: 20px; text-align: center;">No platform selected</div>`;
                }
                return platforms.map(platform => `
                                    <div class="st-timeline-inner-card posting-platform-block" data-platform="${platform}" style="margin: 0 0 16px 0; max-width: 100%;">
                                        <label class="st-label mb-10">${platform}</label>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                            <div class="form-group">
                                                <input type="date" class="st-input posting-date" value="${(postTimeline || []).find(p => p.platform === platform)?.date || ''}" placeholder="Date">
                                            </div>
                                            <div class="form-group">
                                                <input type="time" class="st-input posting-time" value="${(postTimeline || []).find(p => p.platform === platform)?.time || ''}" placeholder="Time">
                                            </div>
                                        </div>
                                    </div>
                                `).join('');
            })()}
                            <div id="${prefix}posting-preview-${record.id}" style="text-align: center; display: flex; flex-direction: column; gap: 8px; align-items: center;">
                                ${postComplete && postTimeline ? postTimeline.map(p => `
                                    <div class="st-timeline-preview">
                                        <span class="text-success fs-xs">${p.platform}: ${formatTimelinePreview(p.date, p.time)}</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="st-delivered-footer">
                    <button class="btn-save-status-step" id="btn-save-${prefix}timeline-${record.id}">Save Details</button>
                </div>
            </div>
        `;
    }

    function generateDraftHTML(record, isRework = false) {
        const prefix = isRework ? 're-' : '';
        const titlePrefix = isRework ? 'Re-' : '';
        const dVideo = isRework ? record.reDraftVideo : record.draftVideo;
        const dApproved = isRework ? record.reDraftApproved : record.draftApproved;
        const dCorrections = isRework ? record.reDraftCorrections : record.draftCorrections;
        const dFinalLink = isRework ? record.reDraftFinalLink : record.draftFinalLink;
        const dFinalDesc = isRework ? record.reDraftFinalDesc : record.draftFinalDesc;

        return `
            <!-- Expandable Draft Form -->
            <div class="st-draft-form-container" id="${prefix}draft-form-container-${record.id}">
                <div class="st-delivered-title">${titlePrefix}Draft Submission</div>
                
                <div class="st-draft-form">
                    <div class="st-draft-section-container">
                        <!-- Top Section: Upload & Preview -->
                        <div class="st-draft-top-section">
                            <label class="st-upload-label">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span class="fs-xs">Upload Draft</span>
                                <input type="file" id="${prefix}draft-video-input-${record.id}" accept="video/*" class="hidden-input">
                            </label>

                            <div id="${prefix}draft-video-preview-${record.id}" class="st-video-preview-box">
                                ${dVideo ? `
                                    <div class="video-preview-thumb">
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                        <span class="fs-xs mt-5">Preview</span>
                                    </div>
                                ` : '<span class="text-muted fs-xs">No Video</span>'}
                            </div>
                        </div>

                        <!-- Middle Section: Approval & Timing -->
                        <div class="st-draft-middle-section">
                            <div class="st-form-section">
                                <label class="st-label mb-10">Approval Status</label>
                                <div class="toggle-pill-group">
                                    <button class="toggle-pill ${dApproved === 'approved' ? 'active' : ''}" data-value="approved" id="btn-${prefix}draft-approved-${record.id}">Approved</button>
                                    <button class="toggle-pill ${dApproved === 'not-approved' ? 'active' : ''}" data-value="not-approved" id="btn-${prefix}draft-not-approved-${record.id}">Not Approved</button>
                                    <input type="hidden" id="${prefix}draft-status-value-${record.id}" value="${dApproved || ''}">
                                </div>
                            </div>

                            <div class="st-form-section">
                                <label class="st-label mb-10">Timing Status</label>
                                <div class="st-timing-grid">
                                    <label class="checkbox-group">
                                        <input type="checkbox" name="${prefix}draft-timing-${record.id}" value="advance">
                                        <span>Advance</span>
                                    </label>
                                    <label class="checkbox-group">
                                        <input type="checkbox" name="${prefix}draft-timing-${record.id}" value="on-time">
                                        <span>On Time</span>
                                    </label>
                                    <label class="checkbox-group">
                                        <input type="checkbox" name="${prefix}draft-timing-${record.id}" value="late">
                                        <span>Late</span>
                                    </label>
                                    <label class="checkbox-group">
                                        <input type="checkbox" name="${prefix}draft-timing-${record.id}" value="not-submit">
                                        <span>Not Submit</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Full-width Correction Section -->
                        <div id="${prefix}draft-correction-section-${record.id}" class="mt-20" style="display: ${dApproved === 'not-approved' ? 'block' : 'none'};">
                            <label class="st-label mb-10">What Correction Required</label>
                            <textarea id="${prefix}draft-correction-input-${record.id}" placeholder="Enter corrections required..." class="st-textarea" style="min-height: 100px;">${dCorrections || ''}</textarea>
                        </div>

                        <!-- Conditional Approved Section -->
                        <div id="${prefix}draft-approved-section-${record.id}" class="st-draft-approved-fields" style="display: ${dApproved === 'approved' ? 'block' : 'none'};">
                            <div class="st-delivered-title" style="font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">Approved Details</div>
                            <div class="st-grid-two mt-15">
                                <div class="form-group">
                                    <label class="st-label">Final Product Link</label>
                                    <input type="text" id="${prefix}draft-final-link-${record.id}" value="${dFinalLink || ''}" placeholder="Enter product link" class="st-input">
                                </div>
                                <div class="form-group">
                                    <label class="st-label">Final Description</label>
                                    <input type="text" id="${prefix}draft-final-desc-${record.id}" value="${dFinalDesc || ''}" placeholder="Enter final description" class="st-input">
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Section: Save Button -->
                        <div class="st-draft-bottom-section">
                            <button class="btn-save-status-step" id="btn-save-${prefix}draft-${record.id}">Save Details</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStatusTrackingCard(record, container) {
        // Build avatar content
        let avatarContent = record.creatorName ? record.creatorName.charAt(0).toUpperCase() : '?';
        if (record.avatar) {
            if (record.avatar.startsWith('<')) {
                avatarContent = record.avatar;
            } else if (record.avatar.trim() !== '') {
                avatarContent = `<img src="${record.avatar}" alt="${record.creatorName || 'Avatar'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        }

        const cardId = `st-card-${record.id}`;
        const card = document.createElement('div');
        card.className = 'st-unified-card mb-20';
        card.id = cardId;

        card.innerHTML = `
            <!-- Influencer Details Section -->
            <div class="st-details-card">
                <div class="st-profile-row">
                    <div class="st-avatar profile-avatar">${avatarContent}</div>
                    <div class="st-info-grid">
                        <div class="st-info-item">
                            <span class="st-label">Campaign Name</span>
                            <span class="st-value">${record.campaignName || '-'}</span>
                        </div>
                        <div class="st-info-item">
                            <span class="st-label">Influencer Name</span>
                            <span class="st-value">${record.creatorName || '-'}</span>
                        </div>
                        <div class="st-info-item">
                            <span class="st-label">Address</span>
                            <span class="st-value">${record.address || '-'}</span>
                        </div>
                        <div class="st-info-item">
                            <span class="st-label">Ph Number</span>
                            <span class="st-value">${record.phone || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Progress Tracker Section -->
            <div class="st-tracker-wrapper">
                <h3 class="st-tracker-title">Workflow Progress</h3>
                <div class="status-tracker-container" id="tracker-container-${record.id}">
                    <!-- Stages will be injected by JS -->
                </div>
            </div>

            <!-- Expandable Delivered Form -->
            <div class="st-delivered-form-container" id="delivered-form-container-${record.id}">
                <div class="st-delivered-title">Delivery Confirmation</div>
                
                <div class="st-delivered-form">
                    <div class="st-delivered-grid">
                        <!-- Top Row: Checkbox and Photo Preview -->
                        <div class="st-grid-col">
                            <div class="st-input-container">
                                <label class="checkbox-group">
                                    <input type="checkbox" id="delivered-confirmed-${record.id}" ${record.deliveredConfirmed ? 'checked' : ''}>
                                    <span>Delivered Confirmed</span>
                                </label>
                            </div>
                        </div>
                        <div class="st-grid-col flex-center">
                            <div id="delivery-photo-preview-${record.id}" class="st-photo-preview-box">
                                ${record.deliveryPhoto 
                                    ? `<img src="${record.deliveryPhoto}" class="preview-thumb" alt="Delivery Photo">` 
                                    : `<img src="https://izcuwepzeqhfnjcmpekz.supabase.co/storage/v1/object/public/influencer-profiles/dispatch/1777268279927_xgbnip.jpeg" class="preview-thumb" alt="Hardcoded Test">`
                                }
                            </div>
                        </div>

                        <!-- Second Row: Upload Box and Empty/Description -->
                        <div class="st-grid-col">
                            <div class="st-upload-box">
                                <label class="st-upload-label">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span class="fs-xs">Upload Photo</span>
                                    <input type="file" id="delivery-photo-input-${record.id}" accept="image/*" class="hidden-input">
                                </label>
                            </div>
                        </div>
                        <div class="st-grid-col flex-center">
                            <span class="text-muted fs-xs">Photo Preview</span>
                        </div>
                    </div>

                    <div class="st-delivered-footer">
                        <button class="btn-save-status-step" id="btn-save-delivered-${record.id}">Save Details</button>
                    </div>
                </div>
            </div>

            <!-- Expandable Pay Advance Form -->
            <div class="st-pay-advance-form-container" id="pay-advance-form-container-${record.id}">
                <div class="st-delivered-title">Payment Details (Pay Advance)</div>
                
                <div class="st-pay-advance-form">
                    <div class="st-pay-advance-grid">
                        <div class="st-grid-left">
                            <div class="form-group mb-15">
                                <label class="st-label">GPay Number</label>
                                <input type="text" id="pay-advance-gpay-${record.id}" value="${record.payAdvanceGPay || ''}" placeholder="Enter GPay number" class="st-input">
                            </div>
                            <div class="form-group mb-15">
                                <label class="st-label">Total Amount</label>
                                <input type="number" id="pay-advance-total-${record.id}" value="${record.payAdvanceTotal || ''}" placeholder="0.00" class="st-input">
                            </div>
                            <div class="form-group mb-15">
                                <label class="st-label">Advance Amount</label>
                                <input type="number" id="pay-advance-amount-${record.id}" value="${record.payAdvanceAmount || ''}" placeholder="0.00" class="st-input">
                            </div>
                            <div class="st-upload-box" style="justify-content: flex-start;">
                                <label class="st-upload-label">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span class="fs-xs">Upload Screenshot</span>
                                    <input type="file" id="pay-advance-photo-input-${record.id}" accept="image/*" class="hidden-input">
                                </label>
                            </div>
                        </div>
                        <div class="st-grid-right flex-center">
                            <div class="st-photo-preview-wrapper-inner">
                                <div id="pay-advance-photo-preview-${record.id}" class="st-photo-preview-box">
                                    ${record.payAdvancePhoto ? `<img src="${record.payAdvancePhoto}" class="preview-thumb" alt="Payment Screenshot">` : '<span class="text-muted fs-xs">No Image</span>'}
                                </div>
                                <span class="text-muted fs-xs mt-10" style="display:block;">Screenshot Preview</span>
                            </div>
                        </div>
                    </div>

                    <div class="st-delivered-footer">
                        <button class="btn-save-status-step" id="btn-save-pay-advance-${record.id}">Save Details</button>
                    </div>
                </div>
            </div>
            
            <!-- Expandable Send Reference Videos Form -->
            <div class="st-ref-videos-form-container" id="ref-videos-form-container-${record.id}">
                <div class="st-delivered-title">Send Reference Videos</div>
                
                <div class="st-ref-videos-form">
                    <div class="st-ref-videos-grid mb-20">
                        <div class="form-group">
                            <label class="st-label">Campaign Concept</label>
                            <input type="text" id="ref-concept-${record.id}" value="${record.refConcept || ''}" placeholder="Enter concept" class="st-input">
                        </div>
                        <div class="form-group">
                            <label class="st-label">Proposed Script</label>
                            <textarea id="ref-script-${record.id}" placeholder="Enter script here..." class="st-textarea">${record.refScript || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="st-label">Key Points to Mention</label>
                            <textarea id="ref-keypoints-${record.id}" placeholder="Enter key points here..." class="st-textarea">${record.refKeyPoints || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="st-label">Offer to Mention</label>
                            <input type="text" id="ref-offer-${record.id}" value="${record.refOffer || ''}" placeholder="Enter offer" class="st-input">
                        </div>
                        <div class="form-group">
                            <label class="st-label">Creator Product Link</label>
                            <input type="text" id="ref-link-${record.id}" value="${record.refLink || ''}" placeholder="Enter product link" class="st-input">
                        </div>
                        <div class="form-group flex-center" style="justify-content: flex-start; margin-top: 28px; padding-left: 10px;">
                            <label class="premium-toggle">
                                <input type="checkbox" id="ref-call-explanation-${record.id}" ${record.refCallExplanation ? 'checked' : ''} class="hidden-input">
                                <div class="toggle-switch"></div>
                                <span class="toggle-label">Call Explanation Required</span>
                            </label>
                        </div>
                    </div>

                    <div class="st-dynamic-videos-section">
                        <h4 class="st-dynamic-title">Reference Videos</h4>
                        <div id="dynamic-videos-container-${record.id}" class="dynamic-videos-container">
                            <!-- Dynamic inputs JS populated -->
                        </div>
                        <button class="btn-ghost-add mt-10" id="btn-add-video-${record.id}">+ Add More</button>
                    </div>

                    <div class="st-delivered-footer">
                        <button class="btn-save-status-step" id="btn-save-ref-videos-${record.id}">Save Details</button>
                    </div>
                </div>
            </div>

            ${generateTimelineHTML(record, false)}
            ${generateDraftHTML(record, false)}
            
            ${record.workflowState?.hasRework ? `
                ${generateTimelineHTML(record, true)}
                ${generateDraftHTML(record, true)}
            ` : ''}


            <!-- Expandable Pay Remaining Payment Form -->
            <div class="st-remaining-payment-form-container" id="remaining-payment-form-container-${record.id}">
                <div class="st-delivered-title">Payment Details (Remaining)</div>
                <div class="st-pay-remaining-form">
                    <div class="st-pay-remaining-grid">
                        <div class="st-grid-left">
                            <div class="form-group mb-15">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <label class="st-label" style="margin-bottom: 0;">Total Amount</label>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <label class="st-minimal-checkbox" style="cursor: pointer;">
                                            <input id="pay-remaining-paid-${record.id}" type="checkbox" ${record.payRemainingPaid ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                        </label>
                                        <label for="pay-remaining-paid-${record.id}" class="fs-xs" style="color: var(--text-main); font-weight: 600; letter-spacing: 0.3px; cursor: pointer;">PAID</label>
                                    </div>
                                </div>
                                <input type="number" id="pay-remaining-total-${record.id}" value="${record.payAdvanceTotal || ''}" readonly class="st-input" style="opacity: 0.7; cursor: not-allowed;">
                            </div>
                            <div class="form-group mb-15">
                                <label class="st-label">Advance Paid</label>
                                <input type="number" id="pay-remaining-advance-${record.id}" value="${record.payAdvanceAmount || ''}" readonly class="st-input" style="opacity: 0.7; cursor: not-allowed;">
                            </div>
                            <div class="form-group mb-15">
                                <label class="st-label">Remaining Payment</label>
                                <input type="number" id="pay-remaining-amount-${record.id}" readonly class="st-input" style="background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.3); font-weight: bold; color: #22c55e;">
                            </div>
                            <div class="st-upload-box" style="justify-content: flex-start;">
                                <label class="st-upload-label">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span class="fs-xs">Upload Proof</span>
                                    <input type="file" id="pay-remaining-photo-input-${record.id}" accept="image/*" class="hidden-input">
                                </label>
                            </div>
                        </div>
                        <div class="st-grid-right flex-center">
                            <div class="st-photo-preview-wrapper-inner">
                                <div id="pay-remaining-photo-preview-${record.id}" class="st-photo-preview-box">
                                    ${record.payRemainingPhoto ? `<img src="${record.payRemainingPhoto}" class="preview-thumb" alt="Payment Proof">` : '<span class="text-muted fs-xs">No Image</span>'}
                                </div>
                                <span class="text-muted fs-xs mt-10" style="display:block;">Proof Preview</span>
                            </div>
                        </div>
                    </div>

                    <div class="st-delivered-footer">
                        <button class="btn-save-status-step" id="btn-save-pay-remaining-${record.id}">Save Details</button>
                    </div>
                </div>
            </div>

            <div class="st-final-post-date-form-container" id="final-post-date-form-container-${record.id}">
                <div class="st-delivered-title">Final Posting Confirmation</div>
                <div class="st-final-post-form" style="padding: 24px 32px;">
                    <!-- Draft Summary Info Row -->
                    <div id="draft-info-row-${record.id}" class="st-draft-summary-info">
                        <!-- Content injected via refreshFinalPostInfo -->
                        <span class="text-muted fs-xs">Loading draft info...</span>
                    </div>

                    <div class="form-group mb-20">
                        <label class="st-label mb-10">Confirm Final Post Link</label>
                        <input type="text" id="final-post-link-${record.id}" value="${record.finalPostLink || ''}" placeholder="Enter live post link" class="st-input">
                    </div>
                    <div class="checkbox-exclusive-group">
                        <label class="checkbox-group">
                            <input type="checkbox" id="final-post-confirmed-${record.id}" ${record.finalPostConfirmed ? 'checked' : ''}>
                            <span>Confirmed Live</span>
                        </label>
                    </div>

                    <!-- New Platform Status List -->
                    <div id="platform-status-container-${record.id}" class="st-platform-status-list mt-20">
                        <!-- Content injected via refreshFinalPostInfo -->
                    </div>

                    <div class="st-delivered-footer mt-20">
                        <button class="btn-save-status-step" id="btn-save-final-post-${record.id}">Save Details</button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);

        // --- ADD LOCAL PREVIEW LOGIC ---
        setTimeout(() => {
            const photoInput = document.getElementById(`delivery-photo-input-${record.id}`);
            const photoPreviewBox = document.getElementById(`delivery-photo-preview-${record.id}`);
            
            if (photoInput && photoPreviewBox) {
                photoInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        console.log(`File selected for delivery photo (Tracking ID ${record.id}):`, this.files[0].name, 'Size:', this.files[0].size);
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            photoPreviewBox.innerHTML = `<img src="${e.target.result}" class="preview-thumb" alt="Local Preview">`;
                        };
                        reader.readAsDataURL(this.files[0]);
                    } else {
                        console.log(`No file selected or input cleared (Tracking ID ${record.id})`);
                    }
                });
            }
        }, 50);

        renderStatusTracker(record, `tracker-container-${record.id}`);
        setupDeliveredFormEvents(record);
        setupPayAdvanceFormEvents(record);
        setupReferenceVideosFormEvents(record);
        setupTimelineFormEvents(record, false);
        setupDraftFormEvents(record, false);
        if (record.workflowState && record.workflowState.hasRework) {
            setupTimelineFormEvents(record, true);
            setupDraftFormEvents(record, true);
        }
        setupRemainingPaymentFormEvents(record);
        setupFinalPostFormEvents(record);
    }

    function setupDraftFormEvents(record, isRework = false) {
        const prefix = isRework ? 're-' : '';
        const tempVideo = isRework ? 'tempReDraftVideo' : 'tempDraftVideo';
        const keyVideo = isRework ? 'reDraftVideo' : 'draftVideo';
        const keyDate = isRework ? 'reDraftDate' : 'draftDate';
        const keyTime = isRework ? 'reDraftTime' : 'draftTime';
        const keyTiming = isRework ? 'reDraftTiming' : 'draftTiming';
        const keyApproved = isRework ? 'reDraftApproved' : 'draftApproved';
        const keyFinalLink = isRework ? 'reDraftFinalLink' : 'draftFinalLink';
        const keyFinalDesc = isRework ? 'reDraftFinalDesc' : 'draftFinalDesc';
        const keyCorrections = isRework ? 'reDraftCorrections' : 'draftCorrections';
        const keyCompleted = isRework ? 'reDraftCompleted' : 'draftCompleted';

        const videoInput = document.getElementById(`${prefix}draft-video-input-${record.id}`);
        const previewBox = document.getElementById(`${prefix}draft-video-preview-${record.id}`);
        const btnApproved = document.getElementById(`btn-${prefix}draft-approved-${record.id}`);
        const btnNotApproved = document.getElementById(`btn-${prefix}draft-not-approved-${record.id}`);
        const statusHidden = document.getElementById(`${prefix}draft-status-value-${record.id}`);
        const approvedSection = document.getElementById(`${prefix}draft-approved-section-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-${prefix}draft-${record.id}`);

        // Video Upload
        if (videoInput && previewBox) {
            videoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const videoUrl = URL.createObjectURL(file);
                    previewBox.innerHTML = `
                        <div class="video-preview-thumb success">
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span class="fs-xs mt-5">Video Loaded</span>
                        </div>
                    `;
                    record[tempVideo] = videoUrl;
                    updateDraftTiming(record);
                }
            });

            // Click preview to open modal
            previewBox.addEventListener('click', () => {
                const videoUrl = record[tempVideo] || record[keyVideo];
                if (videoUrl) {
                    openVideoZoom(videoUrl);
                } else {
                    showToast('No video uploaded yet', 'info');
                }
            });
        }

        // --- Timing Auto-Selection Logic ---
        function updateDraftTiming(rec) {
            const hasVideo = rec[tempVideo] || rec[keyVideo];
            const checkboxes = document.querySelectorAll(`input[name="${prefix}draft-timing-${rec.id}"]`);
            let status = 'not-submit';

            if (hasVideo) {
                if (rec[keyDate] && rec[keyTime]) {
                    try {
                        const now = new Date();
                        const deadline = new Date(`${rec[keyDate]}T${rec[keyTime]}`);

                        // Create comparison dates without time for "Advance" vs "On Time" check
                        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

                        if (nowDate < deadlineDate) {
                            status = 'advance';
                        } else if (nowDate.getTime() === deadlineDate.getTime()) {
                            // Same day, check time
                            if (now <= deadline) {
                                status = 'on-time';
                            } else {
                                status = 'late';
                            }
                        } else {
                            status = 'late';
                        }
                    } catch (err) {
                        console.error("Timing calculation failed", err);
                        status = 'on-time'; // Fallback
                    }
                } else {
                    status = 'on-time'; // Default if no deadline set
                }
            }

            rec[keyTiming] = status;
            checkboxes.forEach(cb => {
                cb.checked = (cb.value === status);
            });
        }

        // Initial Timing Run
        updateDraftTiming(record);

        // Status Toggle Pills
        const togglePills = (value) => {
            statusHidden.value = value;
            const correctionSection = document.getElementById(`${prefix}draft-correction-section-${record.id}`);
            if (value === 'approved') {
                btnApproved.classList.add('active');
                btnNotApproved.classList.remove('active');
                approvedSection.style.display = 'block';
                if (correctionSection) correctionSection.style.display = 'none';
            } else {
                btnApproved.classList.remove('active');
                btnNotApproved.classList.add('active');
                approvedSection.style.display = 'none';
                if (correctionSection) correctionSection.style.display = 'block';
            }
        };

        if (btnApproved) btnApproved.addEventListener('click', () => togglePills('approved'));
        if (btnNotApproved) btnNotApproved.addEventListener('click', () => togglePills('not-approved'));

        // Timing Exclusive Checkboxes
        const checkboxes = document.querySelectorAll(`input[name="${prefix}draft-timing-${record.id}"]`);
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    checkboxes.forEach(other => {
                        if (other !== cb) other.checked = false;
                    });
                }
            });
        });

        // Save Logic
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const timing = Array.from(checkboxes).find(cb => cb.checked)?.value;

                if (!statusHidden.value) {
                    showToast('Please select Approval Status', 'error');
                    return;
                }
                if (!timing) {
                    showToast('Please select Timing Status', 'error');
                    return;
                }

                record[keyApproved] = statusHidden.value;
                record[keyTiming] = timing;
                record[keyVideo] = record[tempVideo] || record[keyVideo];

                if (record[keyApproved] === 'approved') {
                    record[keyFinalLink] = document.getElementById(`${prefix}draft-final-link-${record.id}`).value;
                    record[keyFinalDesc] = document.getElementById(`${prefix}draft-final-desc-${record.id}`).value;
                    record[keyCorrections] = ''; // Clear if approved
                } else if (record[keyApproved] === 'not-approved') {
                    const correctionsInput = document.getElementById(`${prefix}draft-correction-input-${record.id}`);
                    const corrections = correctionsInput ? correctionsInput.value.trim() : '';
                    if (!corrections) {
                        showToast('Please enter corrections', 'error');
                        return;
                    }
                    record[keyCorrections] = corrections;

                    if (!isRework) {
                        record.workflowState = record.workflowState || {};
                        record.workflowState.hasRework = true;
                    }
                }

                record[keyCompleted] = true;

                // Update tracker status if first time
                if (isRework) {
                    if (record.statusStage === 'Re-Draft' && record[keyApproved] === 'approved') {
                        record.statusStage = 'Pay Remaining Payment';
                    }
                } else {
                    if (record.statusStage === 'Expected Delivery Timeline' || !record.statusStage) {
                        record.statusStage = 'Draft';
                    }
                    if (record[keyApproved] === 'approved' && record.statusStage === 'Draft') {
                        record.statusStage = 'Pay Remaining Payment';
                    } else if (record[keyApproved] === 'not-approved') {
                        // Spawn rework steps
                        record.statusStage = 'Re-Expected Delivery Timeline';
                    }
                }

                showToast('Draft details saved');

                // If it caused a rework, we need a full re-render of this card!
                if (!isRework && record[keyApproved] === 'not-approved') {
                    const trackingCard = document.getElementById(`st-card-${record.id}`);
                    if (trackingCard && trackingCard.parentElement) {
                        // Re-render the entire card because new inline HTML for rework needs to appear!
                        trackingCard.insertAdjacentHTML('beforebegin', '<div id="temp-re-render"></div>');
                        const tempDiv = document.getElementById('temp-re-render');
                        renderStatusTrackingCard(record, tempDiv);
                        const newCard = tempDiv.firstElementChild;
                        trackingCard.parentElement.replaceChild(newCard, trackingCard);
                        tempDiv.remove();
                    }
                } else {
                    renderStatusTracker(record, `tracker-container-${record.id}`);
                    const formContainer = document.getElementById(`${prefix}draft-form-container-${record.id}`);
                    if (formContainer) formContainer.classList.remove('expanded');
                }
            });
        }
    }

    function setupTimelineFormEvents(record, isRework = false) {
        const prefix = isRework ? 're-' : '';
        const titlePrefix = isRework ? 'Re-' : '';
        const keyDate = isRework ? 'reDraftDate' : 'draftDate';
        const keyTime = isRework ? 'reDraftTime' : 'draftTime';
        const keyTimelineComp = isRework ? 'reDraftTimelineCompleted' : 'draftTimelineCompleted';
        const keyPosting = isRework ? 'rePostingTimeline' : 'postingTimeline';
        const keyPostingComp = isRework ? 'rePostingTimelineCompleted' : 'postingTimelineCompleted';

        const saveBtn = document.getElementById(`btn-save-${prefix}timeline-${record.id}`);
        if (!saveBtn) return;

        saveBtn.addEventListener('click', () => {
            const draftDateInput = document.getElementById(`${prefix}draft-date-${record.id}`);
            const draftTimeInput = document.getElementById(`${prefix}draft-time-${record.id}`);

            // Validate Draft
            if (!draftDateInput.value || !draftTimeInput.value) {
                showToast(`Please select both date and time for ${titlePrefix}Draft Timeline`, 'error');
                return;
            }

            // Save Draft
            record[keyDate] = draftDateInput.value;
            record[keyTime] = draftTimeInput.value;
            record[keyTimelineComp] = true;

            // Save Posting Timelines (collect from all platform blocks)
            const platformBlocks = document.querySelectorAll(`#${prefix}posting-platforms-container-${record.id} .posting-platform-block`);
            const postingData = [];

            platformBlocks.forEach(block => {
                const platform = block.getAttribute('data-platform');
                const dateVal = block.querySelector('.posting-date').value;
                const timeVal = block.querySelector('.posting-time').value;

                if (dateVal && timeVal) {
                    postingData.push({ platform, date: dateVal, time: timeVal });
                }
            });

            if (postingData.length > 0) {
                record[keyPosting] = postingData;
                record[keyPostingComp] = true;
            }

            if (isRework) {
                if (record.statusStage === 'Re-Expected Delivery Timeline') {
                    record.statusStage = 'Re-Draft';
                }
            } else {
                if (record.statusStage === 'Send Reference Videos' || !record.statusStage) {
                    record.statusStage = 'Expected Delivery Timeline';
                }
            }

            // Update Draft preview
            const draftPreview = document.getElementById(`${prefix}timeline-preview-${record.id}`);
            if (draftPreview) {
                draftPreview.style.textAlign = "center";
                draftPreview.innerHTML = `
                    <div class="st-timeline-preview mt-15">
                        <span class="text-success fs-xs">${titlePrefix}Draft Delivery: ${formatTimelinePreview(record[keyDate], record[keyTime])}</span>
                    </div>
                `;
            }

            // Update Posting previews
            const postingPreview = document.getElementById(`${prefix}posting-preview-${record.id}`);
            if (postingPreview) {
                postingPreview.innerHTML = (record[keyPosting] || []).map(p => `
                    <div class="st-timeline-preview mt-5">
                        <span class="text-success fs-xs">${p.platform}: ${formatTimelinePreview(p.date, p.time)}</span>
                    </div>
                `).join('');
            }

            showToast('Timeline details saved');
            renderStatusTracker(record, `tracker-container-${record.id}`);

            const formContainer = document.getElementById(`${prefix}timeline-form-container-${record.id}`);
            if (formContainer) formContainer.classList.remove('expanded');
        });
    }

    function setupDeliveredFormEvents(record) {
        const confirmCheck = document.getElementById(`delivered-confirmed-${record.id}`);
        const photoInput = document.getElementById(`delivery-photo-input-${record.id}`);
        const previewBox = document.getElementById(`delivery-photo-preview-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-delivered-${record.id}`);

        if (photoInput && previewBox) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        previewBox.innerHTML = `<img src="${event.target.result}" class="preview-thumb" alt="Delivery Photo">`;
                        record.tempPhoto = event.target.result; // Store temporarily until save
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // --- Photo Zoom Logic ---
        if (previewBox) {
            previewBox.addEventListener('click', () => {
                const img = previewBox.querySelector('img');
                if (img) {
                    openPhotoZoom(img.src);
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                record.deliveredConfirmed = confirmCheck.checked;
                if (record.tempPhoto) {
                    record.deliveryPhoto = record.tempPhoto;
                    delete record.tempPhoto;
                }

                // If confirmed, ensure first step is green
                if (record.deliveredConfirmed) {
                    record.statusStage = record.statusStage || 'Delivered';
                }

                showToast('Delivery details saved');
                renderStatusTracker(record, `tracker-container-${record.id}`);

                // Optionally close form after save
                const container = document.getElementById(`delivered-form-container-${record.id}`);
                if (container) container.classList.remove('expanded');
            });
        }
    }

    function setupPayAdvanceFormEvents(record) {
        const photoInput = document.getElementById(`pay-advance-photo-input-${record.id}`);
        const previewBox = document.getElementById(`pay-advance-photo-preview-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-pay-advance-${record.id}`);

        if (photoInput && previewBox) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        previewBox.innerHTML = `<img src="${event.target.result}" class="preview-thumb" alt="Payment Screenshot">`;
                        record.tempPayAdvancePhoto = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (previewBox) {
            previewBox.addEventListener('click', () => {
                const img = previewBox.querySelector('img');
                if (img) openPhotoZoom(img.src);
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const gpayInp = document.getElementById(`pay-advance-gpay-${record.id}`);
                const totalInp = document.getElementById(`pay-advance-total-${record.id}`);
                const amountInp = document.getElementById(`pay-advance-amount-${record.id}`);

                record.payAdvanceGPay = gpayInp.value;
                record.payAdvanceTotal = totalInp.value;
                record.payAdvanceAmount = amountInp.value;

                if (record.tempPayAdvancePhoto) {
                    record.payAdvancePhoto = record.tempPayAdvancePhoto;
                    delete record.tempPayAdvancePhoto;
                }

                // Complete Step 2
                record.payAdvanceCompleted = true;
                if (record.statusStage === 'Delivered' || !record.statusStage) {
                    record.statusStage = 'Pay Advance';
                }

                showToast('Payment details saved');
                renderStatusTracker(record, `tracker-container-${record.id}`);

                const container = document.getElementById(`pay-advance-form-container-${record.id}`);
                if (container) container.classList.remove('expanded');
            });
        }
    }

    function setupReferenceVideosFormEvents(record) {
        const container = document.getElementById(`dynamic-videos-container-${record.id}`);
        const addBtn = document.getElementById(`btn-add-video-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-ref-videos-${record.id}`);

        if (!container || !addBtn || !saveBtn) return;

        if (!record.referenceVideos || !Array.isArray(record.referenceVideos) || record.referenceVideos.length === 0) {
            record.referenceVideos = [''];
        }

        let currentVideos = [...record.referenceVideos];

        function renderVideoInputs() {
            container.innerHTML = '';
            currentVideos.forEach((videoUrl, index) => {
                const row = document.createElement('div');
                row.className = 'dynamic-input-row';

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'st-input flex-grow';
                input.placeholder = 'Paste video link (YouTube / Instagram)';
                input.value = videoUrl;
                input.addEventListener('input', (e) => {
                    currentVideos[index] = e.target.value;
                });

                row.appendChild(input);

                if (index > 0) {
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'dynamic-remove-icon';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.title = 'Remove video';
                    removeBtn.addEventListener('click', () => {
                        currentVideos.splice(index, 1);
                        renderVideoInputs();
                    });
                    row.appendChild(removeBtn);
                } else {
                    const spacer = document.createElement('span');
                    spacer.className = 'dynamic-remove-spacer';
                    row.appendChild(spacer);
                }

                container.appendChild(row);
            });
        }

        renderVideoInputs();

        addBtn.addEventListener('click', () => {
            if (currentVideos.length > 0 && currentVideos[currentVideos.length - 1].trim() === '') {
                showToast('Please fill the current video link first.', 'error');
                return;
            }
            currentVideos.push('');
            renderVideoInputs();
        });

        saveBtn.addEventListener('click', () => {
            record.refConcept = document.getElementById(`ref-concept-${record.id}`).value;
            record.refScript = document.getElementById(`ref-script-${record.id}`).value;
            record.refKeyPoints = document.getElementById(`ref-keypoints-${record.id}`).value;
            record.refOffer = document.getElementById(`ref-offer-${record.id}`).value;
            record.refLink = document.getElementById(`ref-link-${record.id}`).value;
            record.refCallExplanation = document.getElementById(`ref-call-explanation-${record.id}`).checked;

            record.referenceVideos = currentVideos.map(v => v.trim()).filter(v => v !== '');
            if (record.referenceVideos.length === 0) {
                record.referenceVideos = [''];
            }
            currentVideos = [...record.referenceVideos];
            renderVideoInputs();

            record.refVideosCompleted = true;

            if (record.statusStage === 'Delivered' || record.statusStage === 'Pay Advance' || !record.statusStage) {
                record.statusStage = 'Send Reference Videos';
            }

            showToast('Reference videos saved');
            renderStatusTracker(record, `tracker-container-${record.id}`);

            const formContainer = document.getElementById(`ref-videos-form-container-${record.id}`);
            if (formContainer) formContainer.classList.remove('expanded');
        });
    }

    function setupRemainingPaymentFormEvents(record) {
        const photoInput = document.getElementById(`pay-remaining-photo-input-${record.id}`);
        const previewBox = document.getElementById(`pay-remaining-photo-preview-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-pay-remaining-${record.id}`);

        if (!saveBtn) return;

        // Photo Upload Proof
        if (photoInput && previewBox) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        previewBox.innerHTML = `<img src="${event.target.result}" class="preview-thumb" alt="Payment Proof">`;
                        record.tempPayRemainingPhoto = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (previewBox) {
            previewBox.addEventListener('click', () => {
                const img = previewBox.querySelector('img');
                if (img) openPhotoZoom(img.src);
            });
        }

        saveBtn.addEventListener('click', () => {
            const paidCheck = document.getElementById(`pay-remaining-paid-${record.id}`);
            record.payRemainingPaid = paidCheck.checked;

            if (record.tempPayRemainingPhoto) {
                record.payRemainingPhoto = record.tempPayRemainingPhoto;
                delete record.tempPayRemainingPhoto;
            }

            record.payRemainingCompleted = true;

            if (record.statusStage === 'Draft' || record.statusStage === 'Pay Remaining Payment') {
                record.statusStage = 'Pay Remaining Payment';
            }

            showToast('Remaining payment details saved');
            renderStatusTracker(record, `tracker-container-${record.id}`);

            const container = document.getElementById(`remaining-payment-form-container-${record.id}`);
            if (container) container.classList.remove('expanded');
        });
    }

    function refreshRemainingPayment(record) {
        const totalInp = document.getElementById(`pay-remaining-total-${record.id}`);
        const advanceInp = document.getElementById(`pay-remaining-advance-${record.id}`);
        const remainingInp = document.getElementById(`pay-remaining-amount-${record.id}`);

        if (!totalInp || !advanceInp || !remainingInp) return;

        const total = parseFloat(record.payAdvanceTotal) || 0;
        const advance = parseFloat(record.payAdvanceAmount) || 0;
        const remaining = total - advance;

        totalInp.value = total > 0 ? total.toFixed(2) : "0.00";
        advanceInp.value = advance > 0 ? advance.toFixed(2) : "0.00";
        remainingInp.value = remaining >= 0 ? remaining.toFixed(2) : "0.00";
    }

    function setupFinalPostFormEvents(record) {
        const linkInp = document.getElementById(`final-post-link-${record.id}`);
        const confirmCheck = document.getElementById(`final-post-confirmed-${record.id}`);
        const saveBtn = document.getElementById(`btn-save-final-post-${record.id}`);

        if (!linkInp || !confirmCheck || !saveBtn) return;

        // Real-time status update
        confirmCheck.addEventListener('change', () => {
            if (confirmCheck.checked) {
                record.actualPostTime = new Date().toISOString();
            } else {
                record.actualPostTime = null;
            }
            refreshFinalPostInfo(record);
        });

        saveBtn.addEventListener('click', () => {
            record.finalPostLink = linkInp.value;
            record.finalPostConfirmed = confirmCheck.checked;

            record.finalPostCompleted = true;

            if (record.statusStage === 'Pay Remaining Payment') {
                record.statusStage = 'Final Post Date';
            }

            showToast('Final posting confirmed');
            renderStatusTracker(record, `tracker-container-${record.id}`);

            const container = document.getElementById(`final-post-date-form-container-${record.id}`);
            if (container) container.classList.remove('expanded');
        });
    }

    function refreshFinalPostInfo(record) {
        const infoRow = document.getElementById(`draft-info-row-${record.id}`);
        const platformContainer = document.getElementById(`platform-status-container-${record.id}`);
        if (!infoRow) return;

        const isRework = record.workflowState && record.workflowState.hasRework;

        // 1. Draft Info (Existing)
        const dDate = isRework && record.reDraftDate ? record.reDraftDate : record.draftDate || '';
        const dTime = isRework && record.reDraftTime ? record.reDraftTime : record.draftTime || '';
        const timing = isRework && record.reDraftTiming ? record.reDraftTiming : record.draftTiming || 'not-submit';
        const labelPrefix = isRework && record.reDraftDate ? 'Re-' : '';

        let dateStr = '—';
        if (dDate) {
            const dateObj = new Date(dDate);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dateStr = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        }

        let timeStr = '—';
        if (dTime) {
            const [h, m] = dTime.split(':');
            let hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            if (hour === 0) hour = 12;
            timeStr = `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
        }

        const statusMap = {
            'advance': { label: 'Advance', color: '#22c55e' },
            'on-time': { label: 'On Time', color: '#22c55e' },
            'late': { label: 'Late', color: '#ef4444' },
            'not-submit': { label: 'Not Submit', color: '#ef4444' }
        };

        const statusInfo = statusMap[timing] || statusMap['not-submit'];

        infoRow.innerHTML = `
            <span class="st-info-label">${labelPrefix}Draft Delivery:</span>
            <span class="st-info-value">${dateStr} • ${timeStr}</span>
            <span class="st-info-status" style="color: ${statusInfo.color}">${statusInfo.label}</span>
        `;

        // 2. Multi-Platform Posting Status (New)
        if (!platformContainer) return;
        platformContainer.innerHTML = '';

        const timeline = (isRework && record.rePostingTimeline && record.rePostingTimeline.length > 0)
            ? record.rePostingTimeline
            : record.postingTimeline || [];
        const actualTimeStr = record.actualPostTime;
        const actualTime = actualTimeStr ? new Date(actualTimeStr) : null;

        if (timeline.length === 0) {
            platformContainer.innerHTML = '<span class="text-muted fs-xs">No posting timeline set in Step 4.</span>';
            return;
        }

        timeline.forEach(p => {
            const scheduledTime = new Date(`${p.date}T${p.time}`);
            let status = "Not Submit";
            let color = "#8b949e"; // Muted/Gray
            let statusLabel = "Not Submit";
            let delayDetail = "";

            if (actualTime) {
                const diffMs = actualTime - scheduledTime;
                const tolerance = 5 * 60 * 1000; // 5 minutes tolerance for "On Time"

                if (diffMs < -tolerance) {
                    status = "advance";
                    statusLabel = "Advance";
                    color = "#22c55e"; // Green
                    delayDetail = formatDelayString(Math.abs(diffMs), "early");
                } else if (Math.abs(diffMs) <= tolerance) {
                    status = "on-time";
                    statusLabel = "On Time";
                    color = "#3b82f6"; // Blue
                    delayDetail = "Posted on time";
                } else {
                    status = "late";
                    statusLabel = "Late";
                    color = "#ef4444"; // Red
                    delayDetail = formatDelayString(diffMs, "late");
                }
            }

            // Format scheduled string for UI
            const pDate = new Date(p.date);
            const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const pDateStr = `${pDate.getDate()} ${monthsShort[pDate.getMonth()]} ${pDate.getFullYear()}`;

            const [ph, pm] = p.time.split(':');
            let phour = parseInt(ph);
            const pampm = phour >= 12 ? 'PM' : 'AM';
            phour = phour % 12 || 12;
            const pTimeStr = `${phour.toString().padStart(2, '0')}:${pm} ${pampm}`;

            const item = document.createElement('div');
            item.className = 'st-platform-status-item';
            item.innerHTML = `
                <div class="st-platform-info">
                    <span class="st-platform-name">${p.platform}</span>
                    <span class="st-platform-date">${pDateStr} • ${pTimeStr}</span>
                </div>
                <div class="st-platform-result">
                    <span class="st-status-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">${statusLabel}</span>
                    <span class="st-delay-text">${delayDetail}</span>
                </div>
            `;
            platformContainer.appendChild(item);
        });
    }

    function formatDelayString(ms, type) {
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        let timeStr = "";
        if (hours > 0) {
            timeStr += `${hours} hr${hours > 1 ? 's' : ''} `;
        }
        if (mins > 0 || hours === 0) {
            timeStr += `${mins} min${mins !== 1 ? 's' : ''}`;
        }

        return `Posted ${timeStr} ${type}`;
    }

    function renderStatusTracker(record, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const stages = getStatusStages(record);
        const currentStageIndex = stages.indexOf(record.statusStage || 'Delivered');

        stages.forEach((stage, index) => {
            // Create stage box
            const stageEl = document.createElement('div');
            stageEl.className = 'tracker-stage';
            if (stage.startsWith('Re-')) {
                stageEl.classList.add('rework');
            }

            let isCompleted = index < currentStageIndex;
            let stepName = stage;

            if (stepName === 'Delivered' && record.deliveredConfirmed) isCompleted = true;
            if (stepName === 'Pay Advance' && record.payAdvanceCompleted) isCompleted = true;
            if (stepName === 'Send Reference Videos' && record.refVideosCompleted) isCompleted = true;
            if (stepName === 'Expected Delivery Timeline' && (record.draftTimelineCompleted || record.postingTimelineCompleted)) isCompleted = true;
            if (stepName === 'Draft' && record.draftCompleted) isCompleted = true;
            if (stepName === 'Re-Expected Delivery Timeline' && (record.reDraftTimelineCompleted || record.rePostingTimelineCompleted)) isCompleted = true;
            if (stepName === 'Re-Draft' && record.reDraftCompleted) isCompleted = true;
            if (stepName === 'Pay Remaining Payment' && record.payRemainingCompleted) isCompleted = true;
            if (stepName === 'Final Post Date' && record.finalPostCompleted) isCompleted = true;

            if (isCompleted) {
                stageEl.classList.add('completed');
            } else if (index === currentStageIndex) {
                stageEl.classList.add('current');
            } else {
                stageEl.classList.add('future');
            }

            stageEl.innerHTML = `
                <div class="stage-circle">${index + 1}</div>
                <div class="stage-label">${stage}</div>
            `;

            stageEl.addEventListener('click', () => {
                if (index >= 0 && index < stages.length) {
                    let forms = [
                        `delivered-form-container-${record.id}`,
                        `pay-advance-form-container-${record.id}`,
                        `ref-videos-form-container-${record.id}`,
                        `timeline-form-container-${record.id}`,
                        `draft-form-container-${record.id}`
                    ];
                    if (record.workflowState && record.workflowState.hasRework) {
                        forms.push(`re-timeline-form-container-${record.id}`, `re-draft-form-container-${record.id}`);
                    }
                    forms.push(`remaining-payment-form-container-${record.id}`, `final-post-date-form-container-${record.id}`);

                    const targetFormId = forms[index];

                    if (targetFormId) {
                        const targetForm = document.getElementById(targetFormId);
                        if (targetForm) {
                            // Close others
                            forms.forEach(id => {
                                if (id !== targetFormId) {
                                    const el = document.getElementById(id);
                                    if (el) el.classList.remove('expanded');
                                }
                            });
                            targetForm.classList.toggle('expanded');

                            // Re-calculate remaining payment if form is being opened
                            if (stepName === 'Pay Remaining Payment' && targetForm.classList.contains('expanded')) {
                                refreshRemainingPayment(record);
                            }
                            // Refresh draft info if final post date is being opened
                            if (stepName === 'Final Post Date' && targetForm.classList.contains('expanded')) {
                                refreshFinalPostInfo(record);
                            }
                        }
                    }
                } else {
                    record.statusStage = stage;
                    renderStatusTracker(record, containerId);
                }
            });

            container.appendChild(stageEl);

            // Add connector line between stages (not after last)
            if (index < stages.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'tracker-connector';

                let connCompleted = index < currentStageIndex;
                if (stages[index] === 'Delivered' && record.deliveredConfirmed) connCompleted = true;
                if (stages[index] === 'Pay Advance' && record.payAdvanceCompleted) connCompleted = true;
                if (stages[index] === 'Send Reference Videos' && record.refVideosCompleted) connCompleted = true;
                if (stages[index] === 'Expected Delivery Timeline' && (record.draftTimelineCompleted || record.postingTimelineCompleted)) connCompleted = true;
                if (stages[index] === 'Draft' && record.draftCompleted) connCompleted = true;
                if (stages[index] === 'Re-Expected Delivery Timeline' && (record.reDraftTimelineCompleted || record.rePostingTimelineCompleted)) connCompleted = true;
                if (stages[index] === 'Re-Draft' && record.reDraftCompleted) connCompleted = true;
                if (stages[index] === 'Pay Remaining Payment' && record.payRemainingCompleted) connCompleted = true;
                if (stages[index] === 'Final Post Date' && record.finalPostCompleted) connCompleted = true;

                if (connCompleted) {
                    connector.classList.add('completed');
                }
                container.appendChild(connector);
            }
        });
    }

    // --- Status Tracking button in campaign panel ---
    const btnStatusTracking = document.getElementById('btn-status-tracking');
    if (btnStatusTracking) {
        btnStatusTracking.addEventListener('click', () => {
            const activeFolder = document.querySelector('.campaign-folder-item.active-folder');
            const campaignName = activeFolder ? activeFolder.getAttribute('data-campaign-id') : null;

            if (campaignName) {
                window.loadCampaignStatusTracking(campaignName);
            } else {
                alert("⚠ Please select a campaign folder first.");
            }
        });
    }

    // --- Expense Tracker Logic ---
    const btnAddExpense = document.getElementById('btn-add-expense');
    const expenseForm = document.getElementById('expense-form');
    const expenseMainCatSelect = document.getElementById('mainCategory');
    const expenseSubCat1Select = document.getElementById('subCategory1');
    const expenseSubCat2Select = document.getElementById('subCategory2');
    const expenseVendorSelect = document.getElementById('vendor');

    // Fetch main categories from Supabase and populate dropdown
    async function populateExpenseCategories() {
        if (!expenseMainCatSelect) return;
        expenseMainCatSelect.innerHTML = '<option value="">Select Main Category</option>';
        expenseSubCat1Select.innerHTML = '<option value="">Select Sub Category 1</option>';
        expenseSubCat1Select.disabled = true;
        expenseSubCat2Select.innerHTML = '<option value="">Select Sub Category 2</option>';
        expenseSubCat2Select.disabled = true;

        try {
            const { data, error } = await supabase
                .from('finance_categories')
                .select('main')
                .neq('status', 'archived');

            if (error) throw error;

            // Get unique main category values
            const uniqueMains = [...new Set(data.map(row => row.main).filter(Boolean).filter(v => v !== '-'))];

            uniqueMains.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                expenseMainCatSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }

    // When Main Category changes → fetch Sub Category 1 from Supabase
    if (expenseMainCatSelect) {
        expenseMainCatSelect.addEventListener('change', async () => {
            const mainCat = expenseMainCatSelect.value;
            expenseSubCat1Select.innerHTML = '<option value="">Select Sub Category 1</option>';
            expenseSubCat1Select.disabled = !mainCat;
            expenseSubCat2Select.innerHTML = '<option value="">Select Sub Category 2</option>';
            expenseSubCat2Select.disabled = true;

            if (!mainCat) return;

            try {
                const { data, error } = await supabase
                    .from('finance_categories')
                    .select('sub1')
                    .eq('main', mainCat)
                    .neq('status', 'archived');

                if (error) throw error;

                // Clear dropdown before inserting to prevent duplicates from overlapping synchronous listeners
                expenseSubCat1Select.innerHTML = '<option value="">Select Sub Category 1</option>';

                // Remove duplicates at JavaScript level using Set() and trim()
                const uniqueSubs = [...new Set(data.map(row => row.sub1).filter(Boolean).map(v => v.trim()).filter(v => v !== '-'))];

                uniqueSubs.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    expenseSubCat1Select.appendChild(opt);
                });
            } catch (err) {
                console.error('Failed to load sub categories 1:', err);
            }
        });
    }

    // When Sub Category 1 changes → fetch Sub Category 2 from Supabase
    if (expenseSubCat1Select) {
        expenseSubCat1Select.addEventListener('change', async () => {
            const mainCat = expenseMainCatSelect ? expenseMainCatSelect.value : null;
            const subCat1 = expenseSubCat1Select.value;
            
            expenseSubCat2Select.innerHTML = '<option value="">Select Sub Category 2</option>';
            expenseSubCat2Select.disabled = !subCat1;

            if (!subCat1 || !mainCat) return;

            try {
                // Ensure filtering logic: Sub Category 2 depends on selected main and sub1
                const { data, error } = await supabase
                    .from('finance_categories')
                    .select('sub2')
                    .eq('main', mainCat)
                    .eq('sub1', subCat1)
                    .neq('status', 'archived');

                if (error) throw error;

                // Clear dropdown before inserting to prevent duplicate appends
                expenseSubCat2Select.innerHTML = '<option value="">Select Sub Category 2</option>';

                // Remove duplicates at JavaScript level using Set() and filter valid values
                const uniqueSubs = [...new Set(data.map(row => row.sub2).filter(Boolean).map(v => v.trim()).filter(v => v !== '-'))];

                uniqueSubs.forEach(sub => {
                    // Do not add duplicate <option> elements (Set already guarantees uniqueness)
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    expenseSubCat2Select.appendChild(opt);
                });
            } catch (err) {
                console.error('Failed to load sub categories 2:', err);
            }
        });
    }

    // Fetch vendors for expense dropdown
    async function populateExpenseVendors() {
        if (!expenseVendorSelect) return;
        expenseVendorSelect.innerHTML = '<option value="">Select Vendor</option>';

        try {
            // Try Supabase first
            const { data, error } = await supabase
                .from('vendors')
                .select('name')
                .neq('status', 'archived');

            if (error) throw error;

            const uniqueVendors = [...new Set(data.map(row => row.name).filter(Boolean))];
            uniqueVendors.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                expenseVendorSelect.appendChild(opt);
            });
        } catch (err) {
            // Fallback to local vendors array if Supabase table doesn't exist yet
            console.warn('Vendors table not found in Supabase, using local data:', err.message);
            if (window.vendors && Array.isArray(window.vendors)) {
                window.vendors.filter(v => v.status !== 'archived').forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.name;
                    opt.textContent = v.name;
                    expenseVendorSelect.appendChild(opt);
                });
            }
        }
    }

    if (btnAddExpense) {
        btnAddExpense.addEventListener('click', () => {
            // Show the expense view if hidden (e.g. if navigating directly)
            const expenseView = document.getElementById('view-expense');
            if (expenseView && expenseView.classList.contains('hidden')) {
                contentViews.forEach(view => {
                    view.classList.remove('active-view');
                    view.classList.add('hidden');
                });
                expenseView.classList.remove('hidden');
                expenseView.classList.add('active-view');
            }

            // Toggle form visibility
            const expenseFormContainer = document.getElementById('expense-form-container');
            if (expenseFormContainer) {
                expenseFormContainer.classList.toggle('hidden');
            }

            populateExpenseCategories();
            populateExpenseVendors();
        });
    }

    // Also trigger on sidebar button click
    const btnExpenseSidebar = document.querySelector('.expense-btn');
    if (btnExpenseSidebar) {
        btnExpenseSidebar.addEventListener('click', () => {
            populateExpenseCategories();
            populateExpenseVendors();
        });
    }

    // ─── addExpense: INSERT expense into Supabase ───
    async function addExpense() {
        // 1. Read all form values by ID
        const expenseData = {
            main_category: document.getElementById('mainCategory').value || null,
            sub_category1:  document.getElementById('subCategory1').value || null,
            sub_category2:  document.getElementById('subCategory2').value || null,
            quantity:       document.getElementById('quantity').value ? Number(document.getElementById('quantity').value) : null,
            amount:         document.getElementById('amount').value   ? Number(document.getElementById('amount').value)   : null,
            vendor:         document.getElementById('vendor').value || null,
            gst_status:     document.getElementById('gstStatus').value || null,
            payment_mode:   document.getElementById('paymentMode').value || null,
            bank_account:   document.getElementById('bankAccount').value || null,
            purchased_by:   document.getElementById('purchasedBy').value || null,
            approved_by:    document.getElementById('approvedBy').value || null,
            notes:          document.getElementById('notes').value || null
        };

        // 2. Validate required fields
        if (!expenseData.main_category || !expenseData.amount) {
            alert('Please fill in at least the Category and Amount.');
            return;
        }

        // 3. Disable button to prevent double-click
        const saveBtn = document.getElementById('btn-save-expense');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        try {
            // 4. Insert into Supabase
            const { data, error } = await supabase
                .from('expenses')
                .insert([expenseData]);

            if (error) throw error;

            // 5. Success: alert + reset form
            alert('Expense saved successfully');
            if (expenseForm) expenseForm.reset();
            if (expenseSubCat1Select) expenseSubCat1Select.disabled = true;
            if (expenseSubCat2Select) expenseSubCat2Select.disabled = true;

        } catch (err) {
            // 6. Error handling
            console.error('Supabase insert error:', err);
            alert('Failed to save expense: ' + (err.message || 'Unknown error'));
        } finally {
            // 7. Re-enable button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Expense';
            }
        }
    }

    // ─── Event Listener: Save Expense button click ───
    const btnSaveExpense = document.getElementById('btn-save-expense');
    if (btnSaveExpense) {
        btnSaveExpense.addEventListener('click', async (e) => {
            e.preventDefault();
            await addExpense();
        });
    }

    // --- Task Manager Logic ---
    const btnAddNewTask = document.getElementById('btn-add-new-task');
    const newTaskFormContainer = document.getElementById('new-task-form-container');
    const newTaskForm = document.getElementById('new-task-form');
    const taskContentArea = document.getElementById('task-content-area');
    const taskCategorySelect = document.getElementById('task-category');
    const taskSubCategory1Select = document.getElementById('task-sub-category1');
    const taskSubCategory2Select = document.getElementById('task-sub-category2');

    // Add Sub Task specific elements
    const btnAddSubTask = document.getElementById('btn-add-sub-task');
    const newSubTaskFormContainer = document.getElementById('new-sub-task-form-container');
    const newSubTaskForm = document.getElementById('new-sub-task-form');
    const subTaskInputsWrapper = document.getElementById('sub-task-inputs-wrapper');
    const btnAddMoreSubTask = document.getElementById('btn-add-more-sub-task');

    // View Sub Task specific elements
    const btnViewSubTask = document.getElementById('btn-view-sub-task');
    const subTasksListContainer = document.getElementById('sub-tasks-list-container');
    const subTasksGrid = document.getElementById('sub-tasks-grid');

    // View Created Task specific elements
    const btnViewCreatedTask = document.getElementById('btn-view-created-task');
    const createdTasksListContainer = document.getElementById('created-tasks-list-container');
    const createdTasksGrid = document.getElementById('created-tasks-grid');

    // Task Status View specific elements
    const btnTaskStatus = document.getElementById('btn-task-status');
    const taskStatusView = document.getElementById('taskStatusView');
    const taskStatusGrid = document.getElementById('task-status-grid');
    const taskStatusSearchInput = document.getElementById('task-status-search');

    // Dashboard Task View specific elements
    const dashboardTasksContainer = document.getElementById('dashboard-tasks-container');
    const taskDefaultState = document.getElementById('task-default-state');

    window.tasks = window.tasks || [];
    window.subTaskGroups = window.subTaskGroups || [];
    window.shownNotifications = window.shownNotifications || {};
    window.activeTaskFilter = null;

    // Department Toast Logic
    window.showDeptToast = function (deptName, count) {
        const toast = document.getElementById('dept-alert-toast');
        const msg = document.getElementById('dept-alert-message');
        if (toast && msg) {
            msg.textContent = `You have ${count} new task${count > 1 ? 's' : ''} assigned to ${deptName}.`;
            toast.classList.remove('hidden');
            // Trigger animation
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            const btnView = document.getElementById('btn-dept-view-tasks');
            const btnClose = document.getElementById('btn-dept-close');

            const closeHandler = () => window.hideDeptToast();
            const viewHandler = () => {
                window.hideDeptToast();
                window.activeTaskFilter = deptName;

                // Route to Task Manager
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active-item'));
                const taskSidebarBtn = document.querySelector('[data-target="view-task"]');
                if (taskSidebarBtn) taskSidebarBtn.classList.add('active-item');

                document.querySelectorAll('.content-view').forEach(view => {
                    view.classList.remove('active-view');
                    view.classList.add('hidden');
                });
                const activeView = document.getElementById('view-task');
                if (activeView) {
                    activeView.classList.remove('hidden');
                    activeView.classList.add('active-view');
                }

                // Sync UI
                if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
            };

            // Clean up old listeners
            const oldViewProps = btnView.cloneNode(true);
            const oldCloseProps = btnClose.cloneNode(true);
            btnView.parentNode.replaceChild(oldViewProps, btnView);
            btnClose.parentNode.replaceChild(oldCloseProps, btnClose);

            oldViewProps.addEventListener('click', viewHandler);
            oldCloseProps.addEventListener('click', closeHandler);
        }
    };

    window.hideDeptToast = function () {
        const toast = document.getElementById('dept-alert-toast');
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 500);
        }
    };

    // Global Sync Rule implementation
    window.renderAllTasks = function () {
        if (typeof renderDashboardTasks === 'function') renderDashboardTasks();
        if (typeof renderCreatedTasks === 'function') renderCreatedTasks();
        if (typeof renderSubTaskGroups === 'function') renderSubTaskGroups();
    };

    function renderDashboardTasks() {
        if (!dashboardTasksContainer || !taskDefaultState) return;
        dashboardTasksContainer.innerHTML = '';

        let displayTasks = window.tasks;
        if (window.activeTaskFilter) {
            displayTasks = displayTasks.filter(t => t.assignedTo === window.activeTaskFilter);

            // Injection of Banner
            const banner = document.createElement('div');
            banner.className = 'task-filter-banner';
            banner.innerHTML = `
                <div class="task-filter-banner-text">Viewing tasks assigned to <span>${window.activeTaskFilter}</span></div>
                <button type="button" class="btn-clear-task-filter" id="btn-clear-task-filter">Clear Filter</button>
            `;
            dashboardTasksContainer.appendChild(banner);

            const clearBtn = banner.querySelector('#btn-clear-task-filter');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    window.activeTaskFilter = null;
                    if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
                });
            }
        }

        if (!displayTasks || displayTasks.length === 0) {
            const noResMsg = document.createElement('div');
            noResMsg.style.textAlign = 'center';
            noResMsg.style.padding = '40px';
            noResMsg.style.color = 'var(--text-muted)';
            noResMsg.textContent = window.activeTaskFilter ? `No tasks assigned to ${window.activeTaskFilter}.` : 'No tasks assigned yet.';
            dashboardTasksContainer.appendChild(noResMsg);

            // Keep default state visually hidden because we are showing active views
            taskDefaultState.classList.add('hidden');
            dashboardTasksContainer.classList.remove('hidden');
            return;
        }

        taskDefaultState.classList.add('hidden');
        dashboardTasksContainer.classList.remove('hidden');

        // Render tasks in reverse order (newest first)
        const sortedTasks = [...displayTasks].reverse();

        sortedTasks.forEach(task => {
            const card = document.createElement('div');
            card.style.background = 'var(--card-bg)';
            card.style.borderRadius = '10px';
            card.style.border = '1px solid var(--border-color)';
            card.style.padding = '20px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '12px';
            card.style.transition = 'all 0.3s ease';
            card.style.position = 'relative';

            card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; });
            card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; });

            // Priority badge colors
            let priorityColor = '#22c55e'; // Low - green
            let priorityBg = 'rgba(34,197,94,0.12)';
            if (task.priority === 'Medium') { priorityColor = '#f59e0b'; priorityBg = 'rgba(245,158,11,0.12)'; }
            if (task.priority === 'High') { priorityColor = '#ef4444'; priorityBg = 'rgba(239,68,68,0.12)'; }

            // Status badge
            let statusColor = '#f59e0b';
            let statusBg = 'rgba(245,158,11,0.12)';
            if (task.status === 'Completed') { statusColor = '#22c55e'; statusBg = 'rgba(34,197,94,0.12)'; }

            // Format date
            let formattedDate = task.date || '';
            if (task.date) {
                try {
                    const d = new Date(task.date + 'T00:00:00');
                    formattedDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
                } catch (e) { formattedDate = task.date; }
            }

            // Format time
            let formattedTime = task.time || '';
            if (task.time) {
                try {
                    const [h, m] = task.time.split(':');
                    const ampm = parseInt(h) >= 12 ? 'PM' : 'AM';
                    const h12 = parseInt(h) % 12 || 12;
                    formattedTime = `${h12}:${m} ${ampm}`;
                } catch (e) { formattedTime = task.time; }
            }

            // Build Tracking Status list
            let trackingHtml = '';
            if (task.subTasks && task.subTasks.length > 0) {
                let stepsHtml = task.subTasks.map(st => {
                    const title = typeof st === 'string' ? st : (st.title || 'Untitled');
                    const statusClass = typeof st === 'object' && st.status === 'done' ? ' done' : '';
                    return `<div class="tracking-step${statusClass}">${title}</div>`;
                }).join('<div class="tracking-connector"></div>');

                trackingHtml = `
                    <div class="task-tracking-container">
                        <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Tracking Status</div>
                        <div class="task-tracking-steps">
                            ${stepsHtml}
                        </div>
                    </div>
                `;
            }

            // Category breadcrumb
            let categoryParts = [task.category];
            if (task.subCategory1) categoryParts.push(task.subCategory1);
            if (task.subCategory2) categoryParts.push(task.subCategory2);
            const categoryBreadcrumb = categoryParts.join(' › ');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${categoryBreadcrumb}</div>
                        <h4 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-main);">${task.title}</h4>
                    </div>
                    <div style="text-align: right; margin-left: 15px; flex-shrink: 0;">
                        <div style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">📅 ${formattedDate}</div>
                        <div style="font-size: 12px; font-weight: 500; color: var(--text-muted);">⏰ ${formattedTime}</div>
                    </div>
                </div>
                
                ${task.assignedBy && task.assignedTo ? `<div style="font-size: 13px; font-weight: 500; color: var(--text-main); margin-bottom: 10px; background: var(--input-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: inline-block;">Assigned: <span style="color: var(--primary-color); font-weight:600;">${task.assignedBy}</span> → <span style="color: var(--primary-color); font-weight:600;">${task.assignedTo}</span></div>` : ''}
                
                ${task.description ? `<div style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${task.description}</div>` : ''}
                
                ${trackingHtml}
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span style="font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; color: ${priorityColor}; background: ${priorityBg};">${task.priority} Priority</span>
                    <span style="font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; color: ${statusColor}; background: ${statusBg};">${task.status}</span>
                </div>
            `;

            dashboardTasksContainer.appendChild(card);
        });
    }

    // ─── Archive Created Task ───
    async function archiveCreatedTask(id) {
        if (!confirm('Are you sure you want to archive this task?')) return;
        try {
            const { error } = await window.supabase
                .from('tasks')
                .update({ status: 'archived' })
                .eq('id', id);
            if (error) throw error;
            console.log('Archived task id:', id);
            if (typeof showToast === 'function') showToast('Task archived successfully');
            if (typeof renderCreatedTasks === 'function') renderCreatedTasks();
            if (typeof renderTaskStatus === 'function') renderTaskStatus();
        } catch (err) {
            console.error('Error archiving task:', err);
            if (typeof showToast === 'function') showToast('❌ Failed to archive task');
        }
    }

    // ─── Search listener ───
    const createdTasksSearchInput = document.getElementById('created-tasks-search');
    if (createdTasksSearchInput) {
        let searchDebounce = null;
        createdTasksSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => renderCreatedTasks(), 300);
        });
    }

    if (taskStatusSearchInput) {
        let tsDebounce = null;
        taskStatusSearchInput.addEventListener('input', () => {
            clearTimeout(tsDebounce);
            tsDebounce = setTimeout(() => { if (typeof renderTaskStatus === 'function') renderTaskStatus(); }, 300);
        });
    }

    async function renderCreatedTasks() {
        if (!createdTasksGrid) return;
        createdTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">Loading tasks...</div>';

        const countEl = document.getElementById('created-tasks-count');

        try {
            const { data, error } = await window.supabase
                .from('tasks')
                .select('*, task_items(*)')
                .neq('status', 'archived')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('Fetched created tasks:', data);

            // Search filter
            const searchEl = document.getElementById('created-tasks-search');
            const searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : '';
            let filteredTasks = data || [];

            if (searchTerm) {
                filteredTasks = filteredTasks.filter(t => {
                    const title = (t.task_title || '').toLowerCase();
                    const assignedTo = (t.assigned_to || '').toLowerCase();
                    const dept = (t.department || '').toLowerCase();
                    return title.includes(searchTerm) || assignedTo.includes(searchTerm) || dept.includes(searchTerm);
                });
            }

            if (!filteredTasks || filteredTasks.length === 0) {
                createdTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No tasks created yet.</div>';
                if (countEl) countEl.textContent = searchTerm ? '0 results' : '';
                return;
            }

            if (countEl) countEl.textContent = `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
            createdTasksGrid.innerHTML = '';

            filteredTasks.forEach(task => {
                const s = v => (v != null && v !== '') ? v : '-';
                const card = document.createElement('div');
                card.style.cssText = 'background:var(--card-bg);border-radius:10px;border:1px solid var(--border-color);padding:20px;display:flex;flex-direction:column;gap:10px;transition:all 0.3s ease;position:relative;overflow:hidden;';
                card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; });
                card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; });

                // Priority colors
                let pColor = '#22c55e', pBg = 'rgba(34,197,94,0.12)';
                if (task.priority === 'Medium') { pColor = '#f59e0b'; pBg = 'rgba(245,158,11,0.12)'; }
                if (task.priority === 'High') { pColor = '#ef4444'; pBg = 'rgba(239,68,68,0.12)'; }

                // Status colors (active = green)
                const sColor = '#22c55e', sBg = 'rgba(34,197,94,0.12)';

                // Format date
                let fDate = s(task.due_date);
                if (task.due_date) { try { fDate = new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch(e) {} }

                // Format time
                let fTime = s(task.due_time);
                if (task.due_time) { try { const [h,m] = task.due_time.split(':'); const ap = parseInt(h) >= 12 ? 'PM' : 'AM'; fTime = `${parseInt(h) % 12 || 12}:${m} ${ap}`; } catch(e) {} }

                // Sub tasks
                let subTasksHtml = '';
                let subTasks = task.task_items;
                if (typeof subTasks === 'string') { try { subTasks = JSON.parse(subTasks); } catch(e) { subTasks = null; } }
                if (Array.isArray(subTasks) && subTasks.length > 0) {
                    subTasksHtml = '<div style="margin-top:4px;"><div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Selected Sub Tasks</div><ul style="list-style:none;padding:0;margin:0;">';
                    subTasks.forEach(st => {
                        const label = typeof st === 'string' ? st : (st.title || st.sub_task || '-');
                        subTasksHtml += `<li style="font-size:13px;color:var(--text-main);padding:3px 0;">• ${label}</li>`;
                    });
                    subTasksHtml += '</ul></div>';
                }

                const row = (label, val) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;"><span style="color:var(--text-muted);font-weight:500;">${label}</span><span style="color:var(--text-main);font-weight:500;text-align:right;max-width:60%;word-break:break-word;">${s(val)}</span></div>`;

                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
                        <h4 style="margin:0;font-size:16px;font-weight:700;color:var(--text-main);flex:1;padding-right:10px;">${s(task.task_title)}</h4>
                        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap;color:${pColor};background:${pBg};">${s(task.priority)}</span>
                    </div>
                    <div style="border-bottom:1px solid var(--border-color);padding-bottom:10px;margin-bottom:4px;">
                        ${row('Department', task.department)}
                        ${row('Sub Category 1', task.sub_category1)}
                        ${row('Sub Category 2', task.sub_category2)}
                    </div>
                    ${task.task_description ? `<div style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:4px;">${task.task_description}</div>` : ''}
                    ${row('Assigned By', task.assigned_by)}
                    ${row('Assigned To', task.assigned_to)}
                    <div style="display:flex;gap:14px;font-size:12px;color:var(--text-muted);margin-top:2px;">
                        <span>📅 ${fDate}</span>
                        <span>⏰ ${fTime}</span>
                    </div>
                    ${subTasksHtml}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;border-top:1px solid var(--border-color);padding-top:10px;">
                        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;color:${sColor};background:${sBg};">${s(task.status)}</span>
                        <button type="button" class="btn-archive-created-task" data-id="${task.id}" style="font-size:12px;padding:5px 14px;border-radius:6px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);cursor:pointer;transition:all 0.2s ease;">Archive</button>
                    </div>
                `;

                // Archive button handler
                const archBtn = card.querySelector('.btn-archive-created-task');
                if (archBtn) {
                    archBtn.addEventListener('mouseenter', () => { archBtn.style.borderColor = '#ef4444'; archBtn.style.color = '#ef4444'; });
                    archBtn.addEventListener('mouseleave', () => { archBtn.style.borderColor = 'var(--border-color)'; archBtn.style.color = 'var(--text-muted)'; });
                    archBtn.addEventListener('click', () => archiveCreatedTask(task.id));
                }

                createdTasksGrid.appendChild(card);
            });

        } catch (err) {
            console.error('Error fetching created tasks:', err);
            createdTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b; padding: 40px;">Failed to load tasks.</div>';
        }
    }

    // ─── Render Task Status View ───
    async function renderTaskStatus() {
        if (!taskStatusGrid) return;
        taskStatusGrid.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Loading task status...</div>';

        const countEl = document.getElementById('task-status-count');

        try {
            const { data, error } = await window.supabase
                .from('tasks')
                .select('*, task_items(*)')
                .neq('status', 'archived')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const searchEl = document.getElementById('task-status-search');
            const searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : '';
            let filteredTasks = data || [];

            if (searchTerm) {
                filteredTasks = filteredTasks.filter(t => {
                    const title = (t.task_title || '').toLowerCase();
                    const assignedTo = (t.assigned_to || '').toLowerCase();
                    const dept = (t.department || '').toLowerCase();
                    return title.includes(searchTerm) || assignedTo.includes(searchTerm) || dept.includes(searchTerm);
                });
            }

            if (filteredTasks.length === 0) {
                taskStatusGrid.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">No active tasks found.</div>';
                if (countEl) countEl.textContent = searchTerm ? '0 results' : '';
                return;
            }

            if (countEl) countEl.textContent = `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
            taskStatusGrid.innerHTML = '';

            filteredTasks.forEach(task => {
                const s = v => (v != null && v !== '') ? v : '-';
                const card = document.createElement('div');
                card.style.cssText = 'background:var(--card-bg);border-radius:10px;border:1px solid var(--border-color);padding:20px;display:flex;flex-direction:column;gap:12px;transition:all 0.3s ease;position:relative;overflow:hidden;width:100%;';
                card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; });
                card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; });

                // Priority colors
                let pColor = '#22c55e', pBg = 'rgba(34,197,94,0.12)';
                if (task.priority === 'Medium') { pColor = '#f59e0b'; pBg = 'rgba(245,158,11,0.12)'; }
                if (task.priority === 'High') { pColor = '#ef4444'; pBg = 'rgba(239,68,68,0.12)'; }

                // Status colors
                let sColor = '#f59e0b', sBg = 'rgba(245,158,11,0.12)'; // Pending (orange)
                let statusText = task.status || 'Pending';
                if (statusText.toLowerCase() === 'completed') {
                    sColor = '#22c55e'; sBg = 'rgba(34,197,94,0.12)';
                } else if (statusText.toLowerCase() === 'in progress') {
                    sColor = '#3b82f6'; sBg = 'rgba(59,130,246,0.12)';
                }

                // Format date
                let fDate = s(task.due_date);
                if (task.due_date) { try { fDate = new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }); } catch(e) {} }

                // Format time
                let fTime = s(task.due_time);
                if (task.due_time) { try { const [h,m] = task.due_time.split(':'); const ap = parseInt(h) >= 12 ? 'PM' : 'AM'; fTime = `${parseInt(h) % 12 || 12}:${m} ${ap}`; } catch(e) {} }

                // Sub tasks (Tracking Status)
                let subTasksHtml = '';
                let subTasks = task.task_items;
                if (typeof subTasks === 'string') { try { subTasks = JSON.parse(subTasks); } catch(e) { subTasks = null; } }
                if (Array.isArray(subTasks) && subTasks.length > 0) {
                    let pillsHtml = subTasks.map(st => {
                        const label = typeof st === 'string' ? st : (st.title || st.sub_task || '-');
                        return `<span style="display:inline-block;font-size:12px;font-weight:500;color:var(--text-main);background:var(--input-bg);border:1px solid var(--border-color);padding:5px 12px;border-radius:20px;">${label}</span>`;
                    }).join('');

                    subTasksHtml = `
                        <div style="margin-bottom:12px;">
                            <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">Tracking Status</div>
                            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                                ${pillsHtml}
                            </div>
                        </div>
                    `;
                }

                // Category breadcrumb
                let categoryParts = [task.department];
                if (task.sub_category1) categoryParts.push(task.sub_category1);
                if (task.sub_category2) categoryParts.push(task.sub_category2);
                const categoryBreadcrumb = categoryParts.filter(p => p).join(' › ');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">${categoryBreadcrumb}</div>
                            <h4 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-main);">${s(task.task_title)}</h4>
                        </div>
                        <div style="text-align: right; margin-left: 15px; flex-shrink: 0;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">📅 ${fDate}</div>
                            <div style="font-size: 12px; font-weight: 500; color: var(--text-muted);">⏰ ${fTime}</div>
                        </div>
                    </div>
                    
                    ${task.assigned_by && task.assigned_to ? `<div style="font-size: 13px; font-weight: 500; color: var(--text-main); margin-bottom: 10px; background: var(--input-bg); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: inline-block; width: fit-content;">Assigned: <span style="color: var(--primary-color); font-weight:600;">${task.assigned_by}</span> → <span style="color: var(--primary-color); font-weight:600;">${task.assigned_to}</span></div>` : ''}
                    
                    ${task.task_description ? `<div style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${task.task_description}</div>` : ''}
                    
                    ${subTasksHtml}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <span style="font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; color: ${pColor}; background: ${pBg};">${s(task.priority)} Priority</span>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; color: ${sColor}; background: ${sBg}; text-transform: capitalize;">${s(task.status)}</span>
                            <button type="button" class="btn-archive-created-task" data-id="${task.id}" style="font-size:12px;padding:4px 14px;border-radius:6px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);cursor:pointer;transition:all 0.2s ease;">Archive</button>
                        </div>
                    </div>
                `;

                // Archive button handler
                const archBtn = card.querySelector('.btn-archive-created-task');
                if (archBtn) {
                    archBtn.addEventListener('mouseenter', () => { archBtn.style.borderColor = '#ef4444'; archBtn.style.color = '#ef4444'; });
                    archBtn.addEventListener('mouseleave', () => { archBtn.style.borderColor = 'var(--border-color)'; archBtn.style.color = 'var(--text-muted)'; });
                    archBtn.addEventListener('click', () => archiveCreatedTask(task.id));
                }

                taskStatusGrid.appendChild(card);
            });

        } catch (err) {
            console.error('Error fetching task status:', err);
            taskStatusGrid.innerHTML = '<div style="text-align: center; color: #ff6b6b; padding: 40px;">Failed to load task status.</div>';
        }
    }

    async function renderSubTaskGroups() {
        if (!subTasksGrid) return;
        subTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">Loading tasks...</div>';

        try {
            // Fetch all active main tasks
            const { data: mainTasks, error: mainError } = await window.supabase
                .from('main_tasks')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (mainError) throw mainError;

            if (!mainTasks || mainTasks.length === 0) {
                subTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No Main Tasks saved yet.</div>';
                // Sync local cache
                window.subTaskGroups = [];
                return;
            }

            // Fetch all active sub tasks in one batch
            const mainTaskIds = mainTasks.map(t => t.id);
            const { data: allSubTasks, error: subError } = await window.supabase
                .from('sub_tasks')
                .select('*')
                .in('main_task_id', mainTaskIds)
                .eq('status', 'active')
                .order('created_at', { ascending: true });

            if (subError) throw subError;

            // Group sub tasks by main_task_id
            const subTaskMap = {};
            (allSubTasks || []).forEach(st => {
                if (!subTaskMap[st.main_task_id]) subTaskMap[st.main_task_id] = [];
                subTaskMap[st.main_task_id].push(st);
            });

            // Sync local cache for dropdown population
            window.subTaskGroups = mainTasks.map(mt => ({
                id: mt.id,
                title: mt.task_title,
                subTasks: (subTaskMap[mt.id] || []).map(st => st.sub_task)
            }));

            subTasksGrid.innerHTML = '';

            mainTasks.forEach((mainTask) => {
                const groupSubTasks = subTaskMap[mainTask.id] || [];
                const card = document.createElement('div');
                card.className = 'sub-task-card';
                card.style.background = 'var(--card-bg)';
                card.style.borderRadius = '8px';
                card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                card.style.padding = '20px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.transition = 'all 0.3s ease';
                card.style.position = 'relative';

                card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
                card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');

                let listHtml = '';
                groupSubTasks.forEach(st => {
                    listHtml += `<li style="margin-bottom: 8px; font-size: 14px; color: var(--text-color);">${st.sub_task}</li>`;
                });

                let editInputsHtml = '';
                groupSubTasks.forEach((st) => {
                    editInputsHtml += `
                        <div class="edit-sub-task-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <input type="text" value="${st.sub_task}" data-sub-id="${st.id}" style="flex-grow: 1; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-color);" class="edit-sub-task-input">
                            <button type="button" class="btn-remove-edit-st" style="background:none; border:none; cursor:pointer;" title="Remove">❌</button>
                        </div>
                    `;
                });

                card.innerHTML = `
                    <div class="view-mode-title">
                        <h4 style="margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; font-size: 16px;">${mainTask.task_title}</h4>
                    </div>
                    <div class="edit-mode-title hidden">
                        <input type="text" class="edit-group-title" value="${mainTask.task_title}" style="width: 100%; margin-bottom: 15px; font-weight: bold; font-size: 16px; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-color);">
                    </div>

                    <div class="view-mode-content" style="flex-grow: 1; margin-bottom: 20px;">
                        <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
                            ${listHtml || '<li style="color: var(--text-muted);">No sub tasks</li>'}
                        </ul>
                    </div>
                    
                    <div class="edit-mode-content hidden" style="flex-grow: 1; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
                        <div class="edit-sub-tasks-list">
                            ${editInputsHtml}
                        </div>
                        <button type="button" class="btn-add-edit-st btn-secondary" style="border: 1px dashed var(--border-color); padding: 5px; width: 100%; background: transparent; font-size: 13px;">+ Add Sub Task</button>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 15px; gap: 8px;">
                        <button type="button" class="btn-secondary btn-edit-group">Edit</button>
                        <button type="button" class="btn-submit btn-save-group hidden">Save</button>
                    </div>
                `;

                subTasksGrid.appendChild(card);

                // Wire edit/save buttons
                const btnEdit = card.querySelector('.btn-edit-group');
                const btnSave = card.querySelector('.btn-save-group');
                const viewModeContent = card.querySelector('.view-mode-content');
                const editModeContent = card.querySelector('.edit-mode-content');
                const viewModeTitle = card.querySelector('.view-mode-title');
                const editModeTitle = card.querySelector('.edit-mode-title');
                const editStList = card.querySelector('.edit-sub-tasks-list');
                const btnAddEditSt = card.querySelector('.btn-add-edit-st');

                btnEdit.addEventListener('click', () => {
                    viewModeContent.classList.add('hidden');
                    viewModeTitle.classList.add('hidden');
                    editModeContent.classList.remove('hidden');
                    editModeTitle.classList.remove('hidden');
                    btnEdit.classList.add('hidden');
                    btnSave.classList.remove('hidden');
                });

                btnSave.addEventListener('click', async () => {
                    const newTitleElement = card.querySelector('.edit-group-title');
                    const newTitle = newTitleElement ? newTitleElement.value.trim() : mainTask.task_title;
                    if (!newTitle) {
                        if (typeof showAlert === 'function') showAlert("Title cannot be empty.");
                        return;
                    }

                    const newInputs = editStList.querySelectorAll('.edit-sub-task-input');
                    const newSubTasks = [];
                    newInputs.forEach(inp => {
                        const val = inp.value.trim();
                        if (val) newSubTasks.push(val);
                    });

                    if (newSubTasks.length === 0) {
                        if (typeof showAlert === 'function') showAlert("Need at least one sub task.");
                        return;
                    }

                    try {
                        // Update main task title
                        const { error: updateError } = await window.supabase
                            .from('main_tasks')
                            .update({ task_title: newTitle })
                            .eq('id', mainTask.id);
                        if (updateError) throw updateError;

                        // Archive old sub tasks and insert new ones
                        const { error: archiveError } = await window.supabase
                            .from('sub_tasks')
                            .update({ status: 'archived' })
                            .eq('main_task_id', mainTask.id);
                        if (archiveError) throw archiveError;

                        const newPayloads = newSubTasks.map(st => ({
                            main_task_id: mainTask.id,
                            sub_task: st,
                            status: 'active'
                        }));
                        const { error: insertError } = await window.supabase
                            .from('sub_tasks')
                            .insert(newPayloads);
                        if (insertError) throw insertError;

                        if (typeof showToast === 'function') showToast("Updated successfully.");
                        renderSubTaskGroups();
                        if (typeof populateTaskCategories === 'function') populateTaskCategories();
                    } catch (err) {
                        console.error("Error updating task:", err);
                        if (typeof showToast === 'function') showToast('❌ Update failed');
                    }
                });

                btnAddEditSt.addEventListener('click', () => {
                    const newDiv = document.createElement('div');
                    newDiv.className = 'edit-sub-task-item';
                    newDiv.style.display = 'flex';
                    newDiv.style.alignItems = 'center';
                    newDiv.style.gap = '8px';
                    newDiv.style.marginBottom = '8px';
                    newDiv.innerHTML = `
                        <input type="text" placeholder="New Sub Task" style="flex-grow: 1; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-color);" class="edit-sub-task-input">
                        <button type="button" class="btn-remove-edit-st" style="background:none; border:none; cursor:pointer;" title="Remove">❌</button>
                    `;
                    editStList.appendChild(newDiv);

                    const removeBtn = newDiv.querySelector('.btn-remove-edit-st');
                    removeBtn.addEventListener('click', () => newDiv.remove());
                    newDiv.querySelector('input').focus();
                });

                // Wire existing remove buttons
                const existingRemoveBtns = card.querySelectorAll('.btn-remove-edit-st');
                existingRemoveBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.target.closest('.edit-sub-task-item').remove();
                    });
                });
            });

        } catch (err) {
            console.error("Error loading main tasks:", err);
            subTasksGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b; padding: 40px;">Failed to load tasks.</div>';
        }
    }

    async function populateTaskCategories() {
        if (typeof window.populateTaskCategoryDropdowns === 'function') {
            window.populateTaskCategoryDropdowns();
        }

        const taskSubTaskTitleSelect = document.getElementById('task-sub-task-title');
        if (taskSubTaskTitleSelect) {
            const previousTaskValue = taskSubTaskTitleSelect.value;
            taskSubTaskTitleSelect.innerHTML = '<option value="">Select Task</option>';

            try {
                // Fetch main tasks from Supabase for dropdown
                const { data, error } = await window.supabase
                    .from('main_tasks')
                    .select('id, task_title')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Also sync local cache
                    if (!window.subTaskGroups || window.subTaskGroups.length === 0) {
                        window.subTaskGroups = data.map(d => ({ id: d.id, title: d.task_title, subTasks: [] }));
                    }
                    data.forEach(task => {
                        const opt = document.createElement('option');
                        opt.value = task.task_title;
                        opt.textContent = task.task_title;
                        taskSubTaskTitleSelect.appendChild(opt);
                    });
                }
            } catch (e) {
                console.error("Error loading main tasks for dropdown:", e);
                // Fallback to local cache
                if (window.subTaskGroups) {
                    window.subTaskGroups.forEach(group => {
                        const opt = document.createElement('option');
                        opt.value = group.title;
                        opt.textContent = group.title;
                        taskSubTaskTitleSelect.appendChild(opt);
                    });
                }
            }

            // Restore previous selection
            if (previousTaskValue) {
                taskSubTaskTitleSelect.value = previousTaskValue;
                console.log(`[populateTaskCategories] Restored task: "${previousTaskValue}"`);
            }
        }
        // Hide display area when repopulating
        const displayArea = document.getElementById('selected-sub-tasks-display');
        if (displayArea) displayArea.classList.add('hidden');
    }

    // Sub Task Title dropdown change → auto-display sub tasks
    const taskSubTaskTitleSelect = document.getElementById('task-sub-task-title');
    if (taskSubTaskTitleSelect) {
        taskSubTaskTitleSelect.addEventListener('change', async () => {
            const selectedTitle = taskSubTaskTitleSelect.value;
            const displayArea = document.getElementById('selected-sub-tasks-display');
            const listEl = document.getElementById('selected-sub-tasks-list');

            if (!selectedTitle || !displayArea || !listEl) {
                if (displayArea) displayArea.classList.add('hidden');
                return;
            }

            listEl.innerHTML = '<li style="color: var(--text-muted);">Loading...</li>';
            displayArea.classList.remove('hidden');

            try {
                // Find the main task by title to get its id
                const { data: mainData, error: mainErr } = await window.supabase
                    .from('main_tasks')
                    .select('id')
                    .eq('task_title', selectedTitle)
                    .eq('status', 'active')
                    .limit(1);

                if (mainErr) throw mainErr;

                if (mainData && mainData.length > 0) {
                    const mainId = mainData[0].id;
                    const { data: subData, error: subErr } = await window.supabase
                        .from('sub_tasks')
                        .select('sub_task')
                        .eq('main_task_id', mainId)
                        .eq('status', 'active');

                    if (subErr) throw subErr;

                    if (subData && subData.length > 0) {
                        listEl.innerHTML = '';
                        subData.forEach(st => {
                            const li = document.createElement('li');
                            li.style.marginBottom = '6px';
                            li.style.fontSize = '14px';
                            li.style.color = 'var(--text-color)';
                            li.textContent = st.sub_task;
                            listEl.appendChild(li);
                        });
                    } else {
                        listEl.innerHTML = '<li style="color: var(--text-muted);">No sub tasks</li>';
                    }
                } else {
                    displayArea.classList.add('hidden');
                }
            } catch (e) {
                console.error("Error fetching sub tasks for display:", e);
                // Fallback to local cache
                const matchedGroup = window.subTaskGroups.find(g => g.title === selectedTitle);
                if (matchedGroup && matchedGroup.subTasks.length > 0) {
                    listEl.innerHTML = '';
                    matchedGroup.subTasks.forEach(st => {
                        const li = document.createElement('li');
                        li.style.marginBottom = '6px';
                        li.style.fontSize = '14px';
                        li.style.color = 'var(--text-color)';
                        li.textContent = st;
                        listEl.appendChild(li);
                    });
                } else {
                    displayArea.classList.add('hidden');
                }
            }
        });
    }

    if (btnAddNewTask && newTaskFormContainer) {
        btnAddNewTask.addEventListener('click', () => {
            newTaskFormContainer.classList.remove('hidden');
            if (newSubTaskFormContainer) newSubTaskFormContainer.classList.add('hidden');
            if (subTasksListContainer) subTasksListContainer.classList.add('hidden');
            if (createdTasksListContainer) createdTasksListContainer.classList.add('hidden');
            taskContentArea.classList.add('hidden');
            if (taskStatusView) taskStatusView.classList.add('hidden');
            populateTaskCategories();

            // Set default date and time
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            document.getElementById('task-date').value = `${yyyy}-${mm}-${dd}`;

            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('task-time').value = `${hh}:${min}`;
        });
    }

    // Handle Sidebar "Task Manager" click to reset to dashboard view
    const btnSidebarTask = document.querySelector('.sidebar-item[data-target="view-task"]');
    if (btnSidebarTask) {
        btnSidebarTask.addEventListener('click', () => {
            if (newTaskFormContainer) newTaskFormContainer.classList.add('hidden');
            if (newSubTaskFormContainer) newSubTaskFormContainer.classList.add('hidden');
            if (subTasksListContainer) subTasksListContainer.classList.add('hidden');
            if (createdTasksListContainer) createdTasksListContainer.classList.add('hidden');
            if (taskContentArea) taskContentArea.classList.add('hidden');
            if (taskStatusView) taskStatusView.classList.remove('hidden');
            if (typeof renderTaskStatus === 'function') renderTaskStatus();
        });
    }

    if (btnAddSubTask && newSubTaskFormContainer) {
        btnAddSubTask.addEventListener('click', () => {
            newSubTaskFormContainer.classList.remove('hidden');
            if (newTaskFormContainer) newTaskFormContainer.classList.add('hidden');
            if (subTasksListContainer) subTasksListContainer.classList.add('hidden');
            if (createdTasksListContainer) createdTasksListContainer.classList.add('hidden');
            taskContentArea.classList.add('hidden');
            if (taskStatusView) taskStatusView.classList.add('hidden');
        });
    }

    if (btnViewSubTask && subTasksListContainer) {
        btnViewSubTask.addEventListener('click', () => {
            subTasksListContainer.classList.remove('hidden');
            if (newTaskFormContainer) newTaskFormContainer.classList.add('hidden');
            if (newSubTaskFormContainer) newSubTaskFormContainer.classList.add('hidden');
            if (createdTasksListContainer) createdTasksListContainer.classList.add('hidden');
            taskContentArea.classList.add('hidden');
            if (taskStatusView) taskStatusView.classList.add('hidden');
            renderSubTaskGroups();
        });
    }

    if (btnViewCreatedTask && createdTasksListContainer) {
        btnViewCreatedTask.addEventListener('click', () => {
            createdTasksListContainer.classList.remove('hidden');
            if (newTaskFormContainer) newTaskFormContainer.classList.add('hidden');
            if (newSubTaskFormContainer) newSubTaskFormContainer.classList.add('hidden');
            if (subTasksListContainer) subTasksListContainer.classList.add('hidden');
            taskContentArea.classList.add('hidden');
            if (taskStatusView) taskStatusView.classList.add('hidden');
            renderCreatedTasks();
        });
    }

    if (btnTaskStatus && taskStatusView) {
        btnTaskStatus.addEventListener('click', () => {
            taskStatusView.classList.remove('hidden');
            if (newTaskFormContainer) newTaskFormContainer.classList.add('hidden');
            if (newSubTaskFormContainer) newSubTaskFormContainer.classList.add('hidden');
            if (subTasksListContainer) subTasksListContainer.classList.add('hidden');
            if (createdTasksListContainer) createdTasksListContainer.classList.add('hidden');
            taskContentArea.classList.add('hidden');
            if (typeof renderTaskStatus === 'function') renderTaskStatus();
        });
    }

    if (btnAddMoreSubTask && subTaskInputsWrapper) {
        btnAddMoreSubTask.addEventListener('click', () => {
            const currentInputs = subTaskInputsWrapper.querySelectorAll('.sub-task-item-input').length;
            const newIndex = currentInputs + 1;

            const newGroup = document.createElement('div');
            newGroup.className = 'sub-task-input-group';
            newGroup.style.display = 'flex';
            newGroup.style.alignItems = 'flex-end';
            newGroup.style.gap = '10px';
            newGroup.style.width = '100%';

            newGroup.innerHTML = `
                <div class="form-group" style="flex-grow: 1; margin: 0;">
                    <label class="sub-task-label" style="display:block; margin-bottom:5px;">Sub Task ${newIndex} <span style="color:red">*</span></label>
                    <input type="text" class="sub-task-item-input" placeholder="Enter sub task details" required style="width: 100%;">
                </div>
                <button type="button" class="btn-remove-sub-task" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 10px;" title="Remove">❌</button>
            `;

            subTaskInputsWrapper.appendChild(newGroup);

            const removeBtn = newGroup.querySelector('.btn-remove-sub-task');
            removeBtn.addEventListener('click', () => {
                newGroup.remove();
                // Recalculate labels to keep it sequential
                const labels = subTaskInputsWrapper.querySelectorAll('.sub-task-label');
                labels.forEach((lbl, idx) => {
                    lbl.innerHTML = `Sub Task ${idx + 1} <span style="color:red">*</span>`;
                });
            });

            // Auto focus
            const newInput = newGroup.querySelector('.sub-task-item-input');
            if (newInput) newInput.focus();
        });
    }

    if (newSubTaskForm) {
        newSubTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const titleInput = document.getElementById('sub-task-group-title');
            const title = titleInput ? titleInput.value.trim() : '';
            if (!title) {
                if (typeof showAlert === 'function') showAlert("Main Task Title is required.");
                return;
            }

            const inputs = subTaskInputsWrapper.querySelectorAll('.sub-task-item-input');
            const subTasks = [];
            inputs.forEach(input => {
                const val = input.value.trim();
                if (val) subTasks.push(val);
            });

            if (subTasks.length === 0) {
                if (typeof showAlert === 'function') showAlert("Please add at least one valid sub task.");
                return;
            }

            // Disable save button during operation
            const saveBtn = document.getElementById('btn-save-sub-task');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            try {
                // Step 1: Insert Main Task into Supabase
                const { data: mainTaskData, error: mainTaskError } = await window.supabase
                    .from('main_tasks')
                    .insert([{
                        task_title: title,
                        status: 'active'
                    }])
                    .select();

                if (mainTaskError) throw mainTaskError;

                if (!mainTaskData || mainTaskData.length === 0) {
                    throw new Error("Main task inserted but no data returned. Check RLS policies.");
                }

                const insertedTask = mainTaskData[0];
                const mainTaskId = insertedTask.id;
                console.log("Main task saved:", insertedTask);

                // Step 2: Insert all Sub Tasks linked to the main task
                const subTaskPayloads = subTasks.map(st => ({
                    main_task_id: mainTaskId,
                    sub_task: st,
                    status: 'active'
                }));

                const { data: subTaskData, error: subTaskError } = await window.supabase
                    .from('sub_tasks')
                    .insert(subTaskPayloads)
                    .select();

                if (subTaskError) throw subTaskError;

                console.log("Sub tasks saved:", subTaskData);

                // Also push to local cache for immediate dropdown availability
                window.subTaskGroups.push({
                    id: mainTaskId,
                    title: title,
                    subTasks: subTasks
                });

                if (typeof showToast === 'function') showToast('Task saved successfully');

                // Step 3: Reset form
                newSubTaskForm.reset();
                subTaskInputsWrapper.innerHTML = `
                    <div class="sub-task-input-group" style="display: flex; align-items: flex-end; gap: 10px; width: 100%;">
                        <div class="form-group" style="flex-grow: 1; margin: 0;">
                            <label class="sub-task-label" style="display:block; margin-bottom:5px;">Sub Task 1 <span style="color:red">*</span></label>
                            <input type="text" class="sub-task-item-input" placeholder="Enter sub task details" required style="width: 100%;">
                        </div>
                    </div>
                `;

                newSubTaskFormContainer.classList.add('hidden');
                taskContentArea.classList.remove('hidden');

            } catch (err) {
                console.error("Failed to save task:", err);
                if (typeof showToast === 'function') {
                    showToast('❌ Failed to save task: ' + (err.message || 'Unknown error'));
                } else {
                    alert("Failed to save task: " + (err.message || 'Unknown error'));
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save';
                }
            }
        });
    }

    // Removed legacy listeners

    if (newTaskForm) {
        newTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // --- Read all form values ---
            const department = document.getElementById('task-category').value;
            const subCategory1 = document.getElementById('task-sub-category1') ? document.getElementById('task-sub-category1').value : '';
            const subCategory2 = document.getElementById('task-sub-category2') ? document.getElementById('task-sub-category2').value : '';
            const taskTitle = document.getElementById('task-title').value.trim();
            const taskDescription = document.getElementById('task-description') ? document.getElementById('task-description').value.trim() : '';
            const assignedBy = document.getElementById('task-assigned-by') ? document.getElementById('task-assigned-by').value : '';
            const assignedTo = document.getElementById('task-assigned-to') ? document.getElementById('task-assigned-to').value : '';
            const priority = document.getElementById('task-priority').value;
            const dueDate = document.getElementById('task-date').value;
            const dueTime = document.getElementById('task-time').value;
            const subTaskTitleSelect = document.getElementById('task-sub-task-title');
            const selectedMainTaskTitle = subTaskTitleSelect ? subTaskTitleSelect.value : '';

            // --- Validation ---
            if (!department) {
                if (typeof showAlert === 'function') showAlert("Department is required.");
                return;
            }
            if (!taskTitle) {
                if (typeof showAlert === 'function') showAlert("Task Title is required.");
                return;
            }
            if (!priority) {
                if (typeof showAlert === 'function') showAlert("Priority is required.");
                return;
            }
            if (!assignedTo) {
                if (typeof showAlert === 'function') showAlert("Assigned To is required.");
                return;
            }
            if (!selectedMainTaskTitle) {
                if (typeof showAlert === 'function') showAlert("Please select a Main Task.");
                return;
            }

            // --- Disable button during save ---
            const createBtn = document.getElementById('btn-save-task');
            if (createBtn) {
                createBtn.disabled = true;
                createBtn.textContent = 'Creating...';
            }

            try {
                // ===== STEP 1: Fetch main_task_id from main_tasks =====
                const { data: mainTaskLookup, error: mainLookupErr } = await window.supabase
                    .from('main_tasks')
                    .select('id')
                    .eq('task_title', selectedMainTaskTitle)
                    .eq('status', 'active')
                    .limit(1);

                if (mainLookupErr) throw mainLookupErr;

                if (!mainTaskLookup || mainTaskLookup.length === 0) {
                    throw new Error("Selected Main Task not found in database.");
                }

                const mainTaskId = mainTaskLookup[0].id;
                console.log("Resolved main_task_id:", mainTaskId);

                // ===== STEP 2: Insert into tasks table =====
                const taskPayload = {
                    department: department,
                    sub_category1: subCategory1 || null,
                    sub_category2: subCategory2 || null,
                    task_title: taskTitle,
                    task_description: taskDescription || null,
                    assigned_by: assignedBy || null,
                    assigned_to: assignedTo,
                    priority: priority,
                    main_task_id: mainTaskId,
                    due_date: dueDate || null,
                    due_time: dueTime || null,
                    status: 'pending'
                };

                const { data: insertedTaskData, error: insertTaskErr } = await window.supabase
                    .from('tasks')
                    .insert([taskPayload])
                    .select();

                if (insertTaskErr) throw insertTaskErr;

                if (!insertedTaskData || insertedTaskData.length === 0) {
                    throw new Error("Task inserted but no data returned. Check RLS policies.");
                }

                const insertedTask = insertedTaskData[0];
                const insertedTaskId = insertedTask.id;
                console.log("Task inserted:", insertedTask);

                // ===== STEP 3: Fetch related sub_tasks from sub_tasks table =====
                const { data: relatedSubTasks, error: subFetchErr } = await window.supabase
                    .from('sub_tasks')
                    .select('sub_task')
                    .eq('main_task_id', mainTaskId)
                    .eq('status', 'active');

                if (subFetchErr) throw subFetchErr;

                console.log("Fetched subtasks:", relatedSubTasks);

                // ===== STEP 4: Copy sub_tasks into task_items =====
                if (relatedSubTasks && relatedSubTasks.length > 0) {
                    const taskItemPayloads = relatedSubTasks.map(st => ({
                        task_id: insertedTaskId,
                        sub_task: st.sub_task,
                        is_completed: false,
                        status: 'pending'
                    }));

                    const { data: taskItemsData, error: taskItemsErr } = await window.supabase
                        .from('task_items')
                        .insert(taskItemPayloads)
                        .select();

                    if (taskItemsErr) throw taskItemsErr;

                    console.log("Task items inserted:", taskItemsData);
                } else {
                    console.log("No sub tasks to copy into task_items.");
                }

                // ===== STEP 5: Also push to local cache for immediate UI =====
                const matchedGroup = window.subTaskGroups ? window.subTaskGroups.find(g => g.title === selectedMainTaskTitle) : null;
                window.tasks.push({
                    id: insertedTaskId,
                    category: department,
                    date: dueDate,
                    time: dueTime,
                    subCategory1: subCategory1,
                    subCategory2: subCategory2,
                    title: taskTitle,
                    description: taskDescription,
                    priority: priority,
                    subTaskTitle: selectedMainTaskTitle,
                    subTasks: matchedGroup ? matchedGroup.subTasks.map(st => ({
                        title: typeof st === 'string' ? st : (st.title || 'Untitled'),
                        status: 'not_started'
                    })) : [],
                    assignedBy: assignedBy,
                    assignedTo: assignedTo,
                    status: "Pending",
                    createdAt: new Date().toISOString()
                });

                if (typeof showToast === 'function') {
                    showToast('Task created successfully');
                }

                // ===== STEP 6: Reset UI =====
                newTaskForm.reset();
                const stDisplay = document.getElementById('selected-sub-tasks-display');
                if (stDisplay) stDisplay.classList.add('hidden');
                newTaskFormContainer.classList.add('hidden');
                taskContentArea.classList.remove('hidden');
                if (typeof window.renderAllTasks === 'function') window.renderAllTasks();

            } catch (err) {
                console.error("Failed to create task:", err);
                if (typeof showToast === 'function') {
                    showToast('❌ Failed to create task: ' + (err.message || 'Unknown error'));
                } else {
                    alert("Failed to create task: " + (err.message || 'Unknown error'));
                }
            } finally {
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.textContent = 'Create Task';
                }
            }
        });
    }

});

// Setup image upload previews for Dispatch Modal
function setupImagePreview(inputId, previewBoxId) {
    const input = document.getElementById(inputId);
    const previewBox = document.getElementById(previewBoxId);

    if (input && previewBox) {
        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const imgUrl = URL.createObjectURL(file);
                previewBox.innerHTML = `<img src="${imgUrl}" alt="Preview">`;
            } else {
                previewBox.innerHTML = '<span>No Image</span>';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupImagePreview('dispatch-pack-photo', 'preview-pack-photo');
    setupImagePreview('dispatch-final-photo', 'preview-final-photo');
});

// --- Global Photo Zoom Functions ---
function openPhotoZoom(src) {
    const modal = document.getElementById('photo-zoom-modal');
    const zoomedImg = document.getElementById('zoomed-image');
    if (modal && zoomedImg) {
        zoomedImg.src = src;
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

function closePhotoZoom() {
    const modal = document.getElementById('photo-zoom-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const zoomModal = document.getElementById('photo-zoom-modal');
    const btnCloseZoom = document.getElementById('btn-close-zoom');

    if (zoomModal) {
        zoomModal.addEventListener('click', (e) => {
            // Close if clicking the overlay (itself) or the close button
            if (e.target === zoomModal || e.target === btnCloseZoom) {
                closePhotoZoom();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePhotoZoom();
    });
});

// --- Global Video Zoom Functions ---
function openVideoZoom(src) {
    const modal = document.getElementById('video-zoom-modal');
    const zoomedVideo = document.getElementById('zoomed-video');
    if (modal && zoomedVideo) {
        zoomedVideo.src = src;
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        zoomedVideo.play().catch(err => console.log("Video autoplay blocked or failed", err));
    }
}

function closeVideoZoom() {
    const modal = document.getElementById('video-zoom-modal');
    const zoomedVideo = document.getElementById('zoomed-video');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (zoomedVideo) {
            zoomedVideo.pause();
            zoomedVideo.src = ""; // Clear src to stop loading/playing
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const videoZoomModal = document.getElementById('video-zoom-modal');
    const btnCloseVideoZoom = document.getElementById('btn-close-video-zoom');

    if (videoZoomModal) {
        videoZoomModal.addEventListener('click', (e) => {
            if (e.target === videoZoomModal || e.target === btnCloseVideoZoom) {
                closeVideoZoom();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeVideoZoom();
    });
});

// ========== Department Inline Task View ==========

// --- Render tasks for a specific department ---
window.renderDeptTasks = function (deptName) {
    const container = document.querySelector(`.dept-task-container[data-dept="${deptName}"]`);
    if (!container) return;

    const tasks = (window.tasks || []).filter(t => t.assignedTo === deptName);

    let html = `
            <div class="dept-task-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <h3>Tasks – ${deptName}</h3>
                    <span class="dept-task-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="dept-nav-group" style="display:flex; margin-bottom:0;">
                    <button class="dept-nav-btn dept-back-btn btn-dept-back" data-dept="${deptName}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back
                    </button>
                    <button class="dept-nav-btn dept-home-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Home
                    </button>
                </div>
            </div>
        `;

    if (tasks.length === 0) {
        html += `
                <div class="dept-task-empty">
                    <div class="dept-task-empty-icon">📋</div>
                    <h3>No tasks assigned to this department</h3>
                    <p>Tasks assigned to "${deptName}" will appear here.</p>
                </div>
            `;
    } else {
        html += '<div class="dept-task-grid">';
        tasks.forEach(task => {
            const priorityClass = (task.priority || '').toLowerCase();
            const statusClass = (task.status || 'pending').toLowerCase().replace(/\s+/g, '-');

            // Build category breadcrumb
            let catBreadcrumb = task.category || '';
            if (task.subCategory1) catBreadcrumb += ` > ${task.subCategory1}`;
            if (task.subCategory2) catBreadcrumb += ` > ${task.subCategory2}`;

            // Sub tasks
            let subTasksHtml = '';
            if (task.subTasks && task.subTasks.length > 0) {
                subTasksHtml = '<div class="dept-card-subtasks-container" style="margin-bottom: 12px;">';
                task.subTasks.forEach((st, idx) => {
                    const title = typeof st === 'string' ? st : (st.title || 'Untitled');
                    const status = typeof st === 'string' ? 'not_started' : (st.status || 'not_started');

                    let actionHtml = '';
                    let titleClass = '';

                    if (status === 'not_started') {
                        actionHtml = `<button class="btn-subtask-action" data-task-id="${task.id}" data-subtask-idx="${idx}">Start</button>`;
                    } else if (status === 'in_progress') {
                        actionHtml = `<button class="btn-subtask-action in-progress" data-task-id="${task.id}" data-subtask-idx="${idx}">Complete</button>`;
                    } else if (status === 'done') {
                        actionHtml = `<span class="subtask-done-badge">✔ Done</span>`;
                        titleClass = 'done';
                    }

                    subTasksHtml += `
                            <div class="subtask-item">
                                <span class="subtask-title ${titleClass}">${title}</span>
                                ${actionHtml}
                            </div>
                        `;
                });
                subTasksHtml += '</div>';
            }

            html += `
                    <div class="dept-task-card">
                        <div class="dept-card-top">
                            <span class="dept-card-title">${task.title || 'Untitled Task'}</span>
                            <span class="dept-priority-badge ${priorityClass}">${task.priority || 'N/A'}</span>
                        </div>
                        ${catBreadcrumb ? `<div class="dept-card-category">${catBreadcrumb}</div>` : ''}
                        <div class="dept-card-meta">
                            <span>📅 ${task.date || '-'}</span>
                            <span>⏰ ${task.time || '-'}</span>
                        </div>
                        <div class="dept-card-assigned">
                            Assigned: <strong>${task.assignedBy || '-'}</strong> → <strong>${task.assignedTo || '-'}</strong>
                        </div>
                        ${task.description ? `<div class="dept-card-description">${task.description}</div>` : ''}
                        ${subTasksHtml}
                        <div class="dept-card-footer">
                            <span class="dept-status-tag ${statusClass}">${task.status || 'Pending'}</span>
                            <div style="display:flex; gap:6px;">
                                <button class="btn-dept-submit-review" data-task-id="${task.id}">Submit Review</button>
                                <button class="btn-dept-edit-task" data-task-id="${task.id}">Edit</button>
                            </div>
                        </div>
                    </div>
                `;
        });
        html += '</div>';
    }

    container.innerHTML = html;

    // Wire back button
    const backBtn = container.querySelector('.btn-dept-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const parentView = container.closest('.content-view');
            if (parentView) {
                const defaultContent = parentView.querySelector('.dept-default-content');
                if (defaultContent) defaultContent.classList.remove('hidden');
                container.classList.add('hidden');
            }
        });
    }

    // Wire edit buttons
    container.querySelectorAll('.btn-dept-edit-task').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskId = parseInt(btn.getAttribute('data-task-id'));
            const task = window.tasks.find(t => t.id === taskId);
            if (!task) return;

            const newStatus = prompt(`Update status for "${task.title}":\nCurrent: ${task.status}\n\nEnter new status (Pending / In Progress / Completed):`);
            if (newStatus && ['Pending', 'In Progress', 'Completed'].includes(newStatus)) {
                task.status = newStatus;
                window.renderDeptTasks(deptName);
                if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
                if (typeof showToast === 'function') showToast(`Task status updated to ${newStatus}`);
            }
        });
    });

    // Wire Submit Review buttons
    container.querySelectorAll('.btn-dept-submit-review').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskId = parseInt(btn.getAttribute('data-task-id'));
            const task = window.tasks.find(t => t.id === taskId);
            if (!task) return;

            const review = prompt(`Submit review for "${task.title}":\n\nEnter your review notes:`);
            if (review && review.trim()) {
                task.review = review.trim();
                task.reviewedAt = new Date().toISOString();
                if (typeof showToast === 'function') showToast(`Review submitted for "${task.title}"`);
                window.renderDeptTasks(deptName);
            }
        });
    });
};
// --- Task-Specific Modal Handlers ---
const taskVendorModal = document.getElementById('task-vendor-modal');
const taskVendorForm = document.getElementById('task-vendor-form');

if (taskVendorModal) {
    document.getElementById('btn-close-task-vendor').addEventListener('click', () => taskVendorModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-vendor').addEventListener('click', () => taskVendorModal.classList.add('hidden'));
}

const taskCallModal = document.getElementById('task-call-modal');
const taskCallForm = document.getElementById('task-call-form');
const catalogRadios = document.querySelectorAll('input[name="callCatalog"]');
const uploadWrapper = document.getElementById('task-call-upload-wrapper');

if (taskCallModal) {
    document.getElementById('btn-close-task-call').addEventListener('click', () => taskCallModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-call').addEventListener('click', () => taskCallModal.classList.add('hidden'));

    // Conditional Logic for Upload Photo
    catalogRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'Yes') {
                uploadWrapper.classList.remove('hidden');
            } else {
                uploadWrapper.classList.add('hidden');
            }
        });
    });
}

if (taskVendorForm) {
    taskVendorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-vendor-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-vendor-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const vendorData = {
            vendorName: document.getElementById('task-vendor-name').value.trim(),
            platform: document.getElementById('task-vendor-platform').value,
            gst: document.getElementById('task-vendor-gst').value.trim(),
            contact: document.getElementById('task-vendor-contact').value.trim(),
            city: document.getElementById('task-vendor-city').value.trim(),
            notes: document.getElementById('task-vendor-notes').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = vendorData;
        st.status = 'done'; // Skip 'in_progress' and go straight to done after form submit

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Vendor data saved to task!`);
        }

        taskVendorModal.classList.add('hidden');
        taskVendorForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

if (taskCallForm) {
    taskCallForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-call-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-call-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const contactChecks = Array.from(document.querySelectorAll('input[name="callContactStatus"]:checked')).map(cb => cb.value);
        const availChecks = Array.from(document.querySelectorAll('input[name="callAvailability"]:checked')).map(cb => cb.value);
        const catalogValue = document.querySelector('input[name="callCatalog"]:checked')?.value || 'No';

        const fileInput = document.getElementById('task-call-photo');
        let photoRef = null;
        if (catalogValue === 'Yes' && fileInput.files && fileInput.files[0]) {
            photoRef = fileInput.files[0].name; // Just storing filename for task isolation mockup
        }

        const callData = {
            vendorName: document.getElementById('task-call-vendor').value.trim(),
            contactStatus: contactChecks,
            rate: document.getElementById('task-call-rate').value,
            moq: document.getElementById('task-call-moq').value,
            availability: availChecks,
            catalogReceived: catalogValue,
            catalogFile: photoRef,
            leadTime: document.getElementById('task-call-lead').value,
            notes: document.getElementById('task-call-notes').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = callData;
        st.status = 'done'; // Skip 'in_progress'

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Call & Enquiry data saved to task!`);
        }

        taskCallModal.classList.add('hidden');
        taskCallForm.reset();
        uploadWrapper.classList.add('hidden'); // reset conditional field

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

const taskPaymentModal = document.getElementById('task-payment-modal');
const taskPaymentForm = document.getElementById('task-payment-form');

if (taskPaymentModal) {
    document.getElementById('btn-close-task-payment').addEventListener('click', () => taskPaymentModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-payment').addEventListener('click', () => taskPaymentModal.classList.add('hidden'));
}

if (taskPaymentForm) {
    taskPaymentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-payment-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-payment-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const paymentChecks = Array.from(document.querySelectorAll('input[name="paymentStatus"]:checked')).map(cb => cb.value);
        const fileInput = document.getElementById('task-payment-receipt');
        let receiptRef = null;
        if (fileInput.files && fileInput.files[0]) {
            receiptRef = fileInput.files[0].name; // store filename for simulation
        }

        const paymentData = {
            vendorName: document.getElementById('task-payment-vendor').value.trim(),
            sampleCost: document.getElementById('task-payment-cost').value,
            paymentMethod: document.getElementById('task-payment-method').value,
            paymentStatus: paymentChecks,
            receiptFile: receiptRef,
            deliveryAddress: document.getElementById('task-payment-address').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = paymentData;
        st.status = 'done'; // Skip 'in_progress' and jump to completed

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Payment data saved to task!`);
        }

        taskPaymentModal.classList.add('hidden');
        taskPaymentForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

const taskDispatchModal = document.getElementById('task-dispatch-modal');
const taskDispatchForm = document.getElementById('task-dispatch-form');

if (taskDispatchModal) {
    document.getElementById('btn-close-task-dispatch').addEventListener('click', () => taskDispatchModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-dispatch').addEventListener('click', () => taskDispatchModal.classList.add('hidden'));
}

if (taskDispatchForm) {
    taskDispatchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-dispatch-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-dispatch-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const statusChecks = Array.from(document.querySelectorAll('input[name="dispatchStatus"]:checked')).map(cb => cb.value);

        const dispatchData = {
            vendorName: document.getElementById('task-dispatch-vendor').value.trim(),
            courierService: document.getElementById('task-dispatch-courier').value.trim(),
            trackingNumber: document.getElementById('task-dispatch-tracking').value.trim(),
            dispatchDate: document.getElementById('task-dispatch-date').value,
            expectedDeliveryDate: document.getElementById('task-dispatch-delivery-date').value,
            dispatchStatus: statusChecks,
            courierContact: document.getElementById('task-dispatch-contact').value.trim(),
            deliveryAddress: document.getElementById('task-dispatch-address').value.trim(),
            notes: document.getElementById('task-dispatch-notes').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = dispatchData;
        st.status = 'done'; // Skip 'in_progress' and jump to completed

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Dispatch details saved to task!`);
        }

        taskDispatchModal.classList.add('hidden');
        taskDispatchForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

const taskReceiveModal = document.getElementById('task-receive-modal');
const taskReceiveForm = document.getElementById('task-receive-form');

if (taskReceiveModal) {
    document.getElementById('btn-close-task-receive').addEventListener('click', () => taskReceiveModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-receive').addEventListener('click', () => taskReceiveModal.classList.add('hidden'));
}

if (taskReceiveForm) {
    taskReceiveForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-receive-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-receive-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const trackingChecks = Array.from(document.querySelectorAll('input[name="receiveTrackingStatus"]:checked')).map(cb => cb.value);
        const conditionChecks = Array.from(document.querySelectorAll('input[name="receiveCondition"]:checked')).map(cb => cb.value);

        const fileInput = document.getElementById('task-receive-photo');
        let photoRef = null;
        if (fileInput.files && fileInput.files[0]) {
            photoRef = fileInput.files[0].name; // store filename for simulation
        }

        const receiveData = {
            vendorName: document.getElementById('task-receive-vendor').value.trim(),
            trackingStatus: trackingChecks,
            deliveryDate: document.getElementById('task-receive-date').value,
            receivedBy: document.getElementById('task-receive-person').value.trim(),
            packingCondition: conditionChecks,
            packagePhoto: photoRef,
            quantityReceived: document.getElementById('task-receive-quantity').value,
            notes: document.getElementById('task-receive-notes').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = receiveData;
        st.status = 'done'; // Skip 'in_progress' and jump to completed

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Receive Sample details saved to task!`);
        }

        taskReceiveModal.classList.add('hidden');
        taskReceiveForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

const taskEvaluateModal = document.getElementById('task-evaluate-modal');
const taskEvaluateForm = document.getElementById('task-evaluate-form');

if (taskEvaluateModal) {
    document.getElementById('btn-close-task-evaluate').addEventListener('click', () => taskEvaluateModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-evaluate').addEventListener('click', () => taskEvaluateModal.classList.add('hidden'));

    // Dynamic Parameters Logic
    const btnAddParam = document.getElementById('btn-add-parameter');
    const paramsContainer = document.getElementById('testing-parameters-container');
    if (btnAddParam && paramsContainer) {
        btnAddParam.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'eval-param-input';
            input.placeholder = 'e.g. Another Parameter';
            input.required = true;
            paramsContainer.appendChild(input);
        });
    }

    // Star Rating Interactive Logic
    const stars = document.querySelectorAll('#evaluate-stars .star');
    const ratingInput = document.getElementById('task-evaluate-rating-value');
    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('mouseover', function () {
                const val = parseInt(this.getAttribute('data-value'));
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= val) s.classList.add('hover');
                    else s.classList.remove('hover');
                });
            });
            star.addEventListener('mouseout', function () {
                stars.forEach(s => s.classList.remove('hover'));
            });
            star.addEventListener('click', function () {
                const val = parseInt(this.getAttribute('data-value'));
                ratingInput.value = val;
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= val) s.classList.add('active');
                    else s.classList.remove('active');
                });
            });
        });
    }
}

if (taskEvaluateForm) {
    taskEvaluateForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-evaluate-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-evaluate-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Collect Form Data
        const paramInputs = document.querySelectorAll('#testing-parameters-container .eval-param-input');
        const parameters = Array.from(paramInputs).map(inp => inp.value.trim()).filter(v => v);

        const resultValue = document.querySelector('input[name="evaluateResult"]:checked')?.value || '';
        const ratingVal = parseInt(document.getElementById('task-evaluate-rating-value').value) || 0;

        const fileInput = document.getElementById('task-evaluate-file');
        let filesArr = [];
        if (fileInput.files && fileInput.files.length > 0) {
            filesArr = Array.from(fileInput.files).map(f => f.name); // store filenames for simulation
        }

        const evalData = {
            vendorName: document.getElementById('task-evaluate-vendor').value.trim(),
            sampleName: document.getElementById('task-evaluate-sample').value.trim(),
            receivedQuantity: document.getElementById('task-evaluate-quantity').value,
            testingParameters: parameters,
            resultSummary: document.getElementById('task-evaluate-summary').value.trim(),
            testResult: resultValue,
            testingReports: filesArr,
            testedBy: document.getElementById('task-evaluate-tester').value.trim(),
            rating: ratingVal,
            comments: document.getElementById('task-evaluate-comment').value.trim(),
            notes: document.getElementById('task-evaluate-notes').value.trim()
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = evalData;
        st.status = 'done'; // Skip 'in_progress' and jump to completed

        // Check if ALL are done to auto-complete main task
        const allDone = task.subTasks.every(item => (typeof item === 'object' ? item.status : 'not_started') === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        } else {
            if (typeof showToast === 'function') showToast(`Evaluate Sample details saved to task!`);
        }

        taskEvaluateModal.classList.add('hidden');
        taskEvaluateForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

// --- Vendor Research Final Decision Modal Handlers ---
const taskFdModal = document.getElementById('task-final-decision-modal');
const taskFdForm = document.getElementById('task-final-decision-form');

if (taskFdModal) {
    document.getElementById('btn-close-task-final-decision').addEventListener('click', () => taskFdModal.classList.add('hidden'));
    document.getElementById('btn-cancel-task-final-decision').addEventListener('click', () => taskFdModal.classList.add('hidden'));

    // Click outside to close
    taskFdModal.addEventListener('click', (e) => {
        if (e.target === taskFdModal) taskFdModal.classList.add('hidden');
    });

    // Auto-fill Status based on radio selection
    const fdRadios = document.querySelectorAll('input[name="finalDecision"]');
    fdRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const statusField = document.getElementById('task-fd-status');
            if (statusField) {
                statusField.value = e.target.value === 'Approve' ? 'Approved' : 'Rejected';
            }
        });
    });
}

if (taskFdForm) {
    taskFdForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskId = parseInt(document.getElementById('task-fd-task-id').value);
        const subTaskIdx = parseInt(document.getElementById('task-fd-subtask-idx').value);

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Validation
        const vendorName = document.getElementById('task-fd-vendor-name').value.trim();
        if (!vendorName) {
            alert('⚠ Vendor Name is required.');
            return;
        }

        const decisionRadio = document.querySelector('input[name="finalDecision"]:checked');
        if (!decisionRadio) {
            alert('⚠ Please select a Final Decision (Approve or Reject).');
            return;
        }

        // Collect Form Data
        const fdData = {
            vendorName: vendorName,
            contact: document.getElementById('task-fd-contact').value.trim(),
            sampleEvaluation: document.getElementById('task-fd-sample-eval').value.trim(),
            decision: decisionRadio.value,
            status: document.getElementById('task-fd-status').value,
            startDate: document.getElementById('task-fd-start-date').value
        };

        let st = task.subTasks[subTaskIdx];
        if (typeof st === 'string') {
            st = { title: st, status: 'not_started' };
            task.subTasks[subTaskIdx] = st;
        }

        // Save inside task object & update status
        st.data = fdData;
        st.status = 'done';

        // Mark full task as COMPLETED per requirement
        task.status = 'Completed';
        if (typeof showToast === 'function') showToast(`Final decision saved. Task "${task.title}" marked Completed.`);

        taskFdModal.classList.add('hidden');
        taskFdForm.reset();

        // Re-render UI
        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();
        const activeDeptView = document.querySelector('.content-view.active-view .dept-task-container:not(.hidden)');
        if (activeDeptView) {
            const activeDept = activeDeptView.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    });
}

// --- Sub-Task Action Flow (Global Delegate) ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-subtask-action')) {
        const taskId = parseInt(e.target.getAttribute('data-task-id'));
        const subTaskIdx = parseInt(e.target.getAttribute('data-subtask-idx'));

        const task = window.tasks.find(t => t.id === taskId);
        if (!task || !task.subTasks || task.subTasks.length <= subTaskIdx) return;

        // Normalize old string sub-tasks to objects inside the array if needed
        task.subTasks = task.subTasks.map(st =>
            typeof st === 'string' ? { title: st, status: 'not_started' } : st
        );

        let st = task.subTasks[subTaskIdx];

        if (st.status === 'not_started') {
            // Task-Specific Modal Routing
            const stTitle = (typeof st === 'string' ? st : (st.title || '')).trim().toLowerCase();

            switch (stTitle) {
                case 'add vendor':
                    const vModal = document.getElementById('task-vendor-modal');
                    if (vModal) {
                        document.getElementById('task-vendor-task-id').value = task.id;
                        document.getElementById('task-vendor-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-vendor-form').reset();
                        vModal.classList.remove('hidden');
                    }
                    return; // Prevent immediate status change
                case 'call & enquiry':
                    const cModal = document.getElementById('task-call-modal');
                    if (cModal) {
                        document.getElementById('task-call-task-id').value = task.id;
                        document.getElementById('task-call-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-call-form').reset();
                        const uWrapper = document.getElementById('task-call-upload-wrapper');
                        if (uWrapper) uWrapper.classList.add('hidden'); // reset conditional
                        cModal.classList.remove('hidden');
                    }
                    return;
                case 'pay for sample':
                    const pModal = document.getElementById('task-payment-modal');
                    if (pModal) {
                        document.getElementById('task-payment-task-id').value = task.id;
                        document.getElementById('task-payment-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-payment-form').reset();
                        pModal.classList.remove('hidden');
                    }
                    return;
                case 'dispatch details':
                    const dModal = document.getElementById('task-dispatch-modal');
                    if (dModal) {
                        document.getElementById('task-dispatch-task-id').value = task.id;
                        document.getElementById('task-dispatch-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-dispatch-form').reset();
                        dModal.classList.remove('hidden');
                    }
                    return;
                case 'receive sample':
                    const rModal = document.getElementById('task-receive-modal');
                    if (rModal) {
                        document.getElementById('task-receive-task-id').value = task.id;
                        document.getElementById('task-receive-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-receive-form').reset();
                        rModal.classList.remove('hidden');
                    }
                    return;
                case 'evaluate sample':
                    const eModal = document.getElementById('task-evaluate-modal');
                    if (eModal) {
                        document.getElementById('task-evaluate-task-id').value = task.id;
                        document.getElementById('task-evaluate-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-evaluate-form').reset();

                        // Reset dynamic parameters back to 1
                        const pContainer = document.getElementById('testing-parameters-container');
                        if (pContainer) pContainer.innerHTML = '<input type="text" class="eval-param-input" placeholder="e.g. Fabric Durability" required>';

                        // Reset stars
                        document.getElementById('task-evaluate-rating-value').value = 0;
                        document.querySelectorAll('#evaluate-stars .star').forEach(s => {
                            s.classList.remove('active');
                            s.classList.remove('hover');
                        });

                        eModal.classList.remove('hidden');
                    }
                    return;
                case 'vendor research final decision':
                    const fdModal = document.getElementById('task-final-decision-modal');
                    if (fdModal) {
                        document.getElementById('task-fd-task-id').value = task.id;
                        document.getElementById('task-fd-subtask-idx').value = subTaskIdx;
                        document.getElementById('task-final-decision-form').reset();
                        document.getElementById('task-fd-status').value = '';
                        fdModal.classList.remove('hidden');
                    }
                    return;
                // Add future cases here
            }

            // Default behavior if no special form
            st.status = 'in_progress';
        } else if (st.status === 'in_progress') {
            st.status = 'done';
        }

        // Check if ALL are done
        const allDone = task.subTasks.every(item => item.status === 'done');
        if (allDone && task.status !== 'Completed') {
            task.status = 'Completed';
            if (typeof showToast === 'function') showToast(`All sub-tasks finished. Task "${task.title}" marked Completed.`);
        }

        if (typeof window.renderAllTasks === 'function') window.renderAllTasks();

        // If we are currently inside Dept Task View, explicitly re-render it
        const contentContainer = e.target.closest('.dept-task-container');
        if (contentContainer) {
            const activeDept = contentContainer.getAttribute('data-dept');
            if (activeDept) window.renderDeptTasks(activeDept);
        }
    }
});

// --- Toggle: "Task" button in department views ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-dept-task-toggle')) {
        const deptName = e.target.getAttribute('data-dept');
        if (!deptName) return;

        const parentView = e.target.closest('.content-view');
        if (!parentView) return;

        const defaultContent = parentView.querySelector('.dept-default-content');
        const taskContainer = parentView.querySelector('.dept-task-container');

        if (!taskContainer) return;

        // Toggle between views
        const isShowingTasks = !taskContainer.classList.contains('hidden');

        if (isShowingTasks) {
            // Switch back to default
            taskContainer.classList.add('hidden');
            if (defaultContent) defaultContent.classList.remove('hidden');
        } else {
            // Switch to task view
            if (defaultContent) defaultContent.classList.add('hidden');
            taskContainer.classList.remove('hidden');
            window.renderDeptTasks(deptName);
        }
    }
});

// --- Popup "View Tasks" → Navigate to department & auto-open task view ---
// Update the existing showDeptToast viewHandler
const _origShowDeptToast = window.showDeptToast;
window.showDeptToast = function (deptName, count) {
    const toast = document.getElementById('dept-alert-toast');
    const msg = document.getElementById('dept-alert-message');
    if (toast && msg) {
        msg.textContent = `You have ${count} new task${count > 1 ? 's' : ''} assigned to ${deptName}.`;
        toast.classList.remove('hidden');
        requestAnimationFrame(() => toast.classList.add('show'));

        const btnView = document.getElementById('btn-dept-view-tasks');
        const btnClose = document.getElementById('btn-dept-close');

        const closeHandler = () => window.hideDeptToast();
        const viewHandler = () => {
            window.hideDeptToast();
            // Navigate to the department's own page and auto-open task view
            window.navigateToDeptAndShowTasks(deptName);
        };

        // Clone to remove old listeners
        const newBtnView = btnView.cloneNode(true);
        const newBtnClose = btnClose.cloneNode(true);
        btnView.parentNode.replaceChild(newBtnView, btnView);
        btnClose.parentNode.replaceChild(newBtnClose, btnClose);

        newBtnView.addEventListener('click', viewHandler);
        newBtnClose.addEventListener('click', closeHandler);
    }
};

// Utility: Navigate to a department view and show its tasks
window.navigateToDeptAndShowTasks = function (deptName) {
    // Map department names to their view IDs
    const deptViewMap = {
        'Inventory': 'view-inventory',
        'Sales': 'view-sales',
        'Document Room': 'view-document',
        'Marketing': 'view-marketing',
        'Research & Development': 'view-research',
        'Human Resources': 'view-hr',
        'Archive': 'view-archive',
        'Category': 'view-category',
        'Vendor Management': 'view-vendor',
        'Logistics': 'view-logistics',
        'Operations': 'view-operations'
    };

    const viewId = deptViewMap[deptName];
    if (!viewId) return;

    // Activate the sidebar item
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active-item'));
    const sidebarBtn = document.querySelector(`[data-target="${viewId}"]`);
    if (sidebarBtn) sidebarBtn.classList.add('active-item');

    // Switch content views
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active-view');
        view.classList.add('hidden');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active-view');

        // Auto-open task view inside the department
        const defaultContent = targetView.querySelector('.dept-default-content');
        const taskContainer = targetView.querySelector('.dept-task-container');
        if (defaultContent) defaultContent.classList.add('hidden');
        if (taskContainer) {
            taskContainer.classList.remove('hidden');
            window.renderDeptTasks(deptName);
        }
    }
};
document.addEventListener('DOMContentLoaded', () => {
    const taskCat = document.getElementById('task-category');
    const taskSub1 = document.getElementById('task-sub-category1');
    const taskSub2 = document.getElementById('task-sub-category2');

    // Department change → reset children, load Sub Category 1
    if (taskCat) {
        taskCat.addEventListener('change', () => {
            console.log("Selected department:", taskCat.value);
            if (taskSub1) taskSub1.value = '';
            if (taskSub2) taskSub2.value = '';
            // Sub categories are loaded by task-category.js change listeners
        });
    }

    // Sub Category 1 change → reset Sub Category 2
    if (taskSub1) {
        taskSub1.addEventListener('change', () => {
            console.log("Selected Sub Category 1:", taskSub1.value);
            if (taskSub2) taskSub2.value = '';
            // Sub Category 2 is loaded by task-category.js change listeners
        });
    }

    // Initial dropdown hydration (one-time only)
    setTimeout(() => {
        if (typeof window.populateTaskCategoryDropdowns === 'function') {
            window.populateTaskCategoryDropdowns();
        }
    }, 200);
});






    window.attachTrackingSaveListeners = function(trackingId) {
        // Upload helper
        const uploadPhoto = async (inputId) => {
            const input = document.getElementById(inputId);
            console.log(`[uploadPhoto] Checking input ID: ${inputId}`);
            if (!input) {
                console.error(`[uploadPhoto] Input element NOT FOUND for ID: ${inputId}`);
                return null;
            }
            if (!input.files || input.files.length === 0) {
                console.warn(`[uploadPhoto] Input element found, but NO FILES selected. Length: ${input.files ? input.files.length : 'undefined'}`);
                return null;
            }
            
            const file = input.files[0];
            console.log(`[uploadPhoto] File found: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `status-tracking/${fileName}`;

            console.log("=== UPLOADING PHOTO ===");
            console.log("Bucket: influencer-profiles, Path:", filePath);

            const { data, error } = await window.supabase.storage
                .from('influencer-profiles')
                .upload(filePath, file);

            if (error) {
                console.error("Upload Error:", error);
                throw error;
            }

            console.log("Upload Response Data:", data);

            const { data: publicData } = window.supabase.storage
                .from('influencer-profiles')
                .getPublicUrl(filePath);

            console.log("Generated Public URL:", publicData.publicUrl);

            return publicData.publicUrl;
        };

        const executeSave = async (btn, stepIndex, payload) => {
            const originalText = btn.textContent;
            btn.textContent = 'Saving...';
            btn.disabled = true;

            console.log("=== SAVING STATUS TRACKING ===");
            console.log("Tracking ID:", trackingId);
            console.log("Payload:", payload);

            try {
                // Auto advance step logic
                if (stepIndex !== null) {
                    let nextStep = payload.current_step || stepIndex;
                    if (stepIndex === 1 && payload.delivered_confirmed) nextStep = 2;
                    if (stepIndex === 2 && payload.pay_advance_completed) nextStep = 3;
                    if (stepIndex === 3 && payload.reference_video_received) nextStep = 4;
                    if (stepIndex === 4 && payload.expected_delivery_completed) nextStep = 5;
                    if (stepIndex === 5 && payload.draft_received) nextStep = 6;
                    if (stepIndex === 6 && payload.payment_remaining_completed) nextStep = 7;
                    
                    payload.current_step = nextStep;
                }

                const { error } = await window.supabase
                    .from('influencer_status_tracking')
                    .update(payload)
                    .eq('id', trackingId);

                if (error) throw error;

                // Task 4: After save, query the updated row again and log
                const { data: updatedRow, error: fetchError } = await window.supabase
                    .from('influencer_status_tracking')
                    .select('delivery_photo_url')
                    .eq('id', trackingId)
                    .single();
                    
                if (!fetchError && updatedRow) {
                    console.log(`[executeSave] Verified DB update -> trackingRow.delivery_photo_url:`, updatedRow.delivery_photo_url);
                } else {
                    console.error(`[executeSave] Failed to verify DB update:`, fetchError);
                }

                if (window.showToast) window.showToast('✅ Progress Saved!', '✅');

                // Find campaign name to reload only this UI
                const activeFolder = document.querySelector('.campaign-folder-item.active-folder');
                const campaignName = activeFolder ? activeFolder.getAttribute('data-campaign-id') : null;
                if (campaignName) {
                    window.loadCampaignStatusTracking(campaignName, trackingId);
                }
            } catch (err) {
                console.error("Save Tracking Error:", err);
                if (window.showToast) window.showToast('? Save failed: ' + err.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };

        // 1. Delivered
        const btnDelivered = document.getElementById(`btn-save-delivered-${trackingId}`);
        if (btnDelivered) {
            btnDelivered.addEventListener('click', async () => {
                const confirmed = document.getElementById(`delivered-confirmed-${trackingId}`)?.checked || false;
                let payload = { delivered_confirmed: confirmed };
                let photoUrl = await uploadPhoto(`delivery-photo-input-${trackingId}`);
                if (photoUrl) {
                    payload.delivery_photo_url = photoUrl;
                }
                await executeSave(btnDelivered, 1, payload);
            });
        }

        // 2. Pay Advance
        const btnAdvance = document.getElementById(`btn-save-pay-advance-${trackingId}`);
        if (btnAdvance) {
            btnAdvance.addEventListener('click', async () => {
                let photoUrl = await uploadPhoto(`pay-advance-photo-input-${trackingId}`);
                let payload = { pay_advance_completed: true };
                
                const gpayInp = document.getElementById(`pay-advance-gpay-${trackingId}`);
                const totalInp = document.getElementById(`pay-advance-total-${trackingId}`);
                const amountInp = document.getElementById(`pay-advance-amount-${trackingId}`);
                
                if (gpayInp) payload.advance_gpay_number = gpayInp.value;
                if (totalInp) payload.advance_total_amount = totalInp.value ? parseFloat(totalInp.value) : null;
                if (amountInp) payload.advance_paid_amount = amountInp.value ? parseFloat(amountInp.value) : null;
                if (photoUrl) payload.pay_advance_photo_url = photoUrl;
                
                await executeSave(btnAdvance, 2, payload);
            });
        }

        // 3. Send Reference Videos
        const btnRef = document.getElementById(`btn-save-ref-videos-${trackingId}`);
        if (btnRef) {
            btnRef.addEventListener('click', async () => {
                let payload = { reference_video_received: true };
                
                const concept = document.getElementById(`ref-concept-${trackingId}`);
                const script = document.getElementById(`ref-script-${trackingId}`);
                const keypoints = document.getElementById(`ref-keypoints-${trackingId}`);
                const offer = document.getElementById(`ref-offer-${trackingId}`);
                const link = document.getElementById(`ref-link-${trackingId}`);
                const callExp = document.getElementById(`ref-call-explanation-${trackingId}`);
                
                if (concept) payload.ref_concept = concept.value;
                if (script) payload.ref_script = script.value;
                if (keypoints) payload.ref_keypoints = keypoints.value;
                if (offer) payload.ref_offer = offer.value;
                if (link) payload.ref_link = link.value;
                if (callExp) payload.ref_call_explanation_required = callExp.checked;
                
                const container = document.getElementById(`dynamic-videos-container-${trackingId}`);
                if (container) {
                    const inputs = container.querySelectorAll('input[type="text"]');
                    payload.reference_videos_list = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v !== '');
                }
                
                await executeSave(btnRef, 3, payload);
            });
        }

        // 4. Expected Delivery Timeline
        const btnTimeline = document.getElementById(`btn-save-timeline-${trackingId}`);
        if (btnTimeline) {
            btnTimeline.addEventListener('click', async () => {
                let payload = { expected_delivery_completed: true };
                
                const dateInp = document.getElementById(`draft-date-${trackingId}`);
                const timeInp = document.getElementById(`draft-time-${trackingId}`);
                if (dateInp) payload.draft_expected_date = dateInp.value || null;
                if (timeInp) payload.draft_expected_time = timeInp.value || null;
                
                const platformBlocks = document.querySelectorAll(`#posting-platforms-container-${trackingId} .posting-platform-block`);
                const postingData = [];
                platformBlocks.forEach(block => {
                    const platform = block.getAttribute('data-platform');
                    const dateVal = block.querySelector('.posting-date').value;
                    const timeVal = block.querySelector('.posting-time').value;
                    if (dateVal && timeVal) postingData.push({ platform, date: dateVal, time: timeVal });
                });
                payload.posting_timelines = postingData;
                
                await executeSave(btnTimeline, 4, payload);
            });
        }

        // 5. Draft
        const btnDraft = document.getElementById(`btn-save-draft-${trackingId}`);
        if (btnDraft) {
            btnDraft.addEventListener('click', async () => {
                let videoUrl = await uploadPhoto(`draft-video-input-${trackingId}`);
                let payload = { draft_received: true };
                if (videoUrl) payload.draft_video_url = videoUrl;
                
                const approvedStatus = document.getElementById(`draft-status-value-${trackingId}`);
                const timingStatus = document.querySelector(`input[name="draft-timing-${trackingId}"]:checked`);
                const corrections = document.getElementById(`draft-correction-input-${trackingId}`);
                const finalLink = document.getElementById(`draft-final-link-${trackingId}`);
                const finalDesc = document.getElementById(`draft-final-desc-${trackingId}`);
                
                if (approvedStatus) payload.draft_approval_status = approvedStatus.value;
                if (timingStatus) payload.draft_timing_status = timingStatus.value;
                if (corrections) payload.draft_corrections_required = corrections.value;
                if (finalLink) payload.draft_final_product_link = finalLink.value;
                if (finalDesc) payload.draft_final_description = finalDesc.value;
                
                await executeSave(btnDraft, 5, payload);
            });
        }

        // 6. Pay Remaining
        const btnRemaining = document.getElementById(`btn-save-pay-remaining-${trackingId}`);
        if (btnRemaining) {
            btnRemaining.addEventListener('click', async () => {
                const paidCheckbox = document.getElementById(`pay-remaining-paid-${trackingId}`);
                const isPaid = paidCheckbox ? paidCheckbox.checked : false;
                
                let payload = { payment_remaining_completed: isPaid };
                let photoUrl = await uploadPhoto(`pay-remaining-photo-input-${trackingId}`);
                if (photoUrl) payload.payment_remaining_photo_url = photoUrl;
                
                await executeSave(btnRemaining, 6, payload);
            });
        }

        // 7. Final Post Date
        const btnFinal = document.getElementById(`btn-save-final-post-${trackingId}`);
        if (btnFinal) {
            btnFinal.addEventListener('click', async () => {
                let payload = { final_post_completed: true };
                
                const linkInp = document.getElementById(`final-post-link-${trackingId}`);
                const confirmCheck = document.getElementById(`final-post-confirmed-${trackingId}`);
                
                if (linkInp) payload.final_post_link = linkInp.value;
                if (confirmCheck && confirmCheck.checked) {
                    payload.final_post_actual_datetime = new Date().toISOString();
                } else {
                    payload.final_post_actual_datetime = null;
                }
                
                await executeSave(btnFinal, 7, payload);
            });
        }
        
        // 8. Re-Timeline
        const btnReTimeline = document.getElementById(`btn-save-re-timeline-${trackingId}`);
        if (btnReTimeline) {
            btnReTimeline.addEventListener('click', async () => {
                let payload = {};
                const dateInp = document.getElementById(`re-draft-date-${trackingId}`);
                const timeInp = document.getElementById(`re-draft-time-${trackingId}`);
                if (dateInp) payload.re_draft_expected_date = dateInp.value || null;
                if (timeInp) payload.re_draft_expected_time = timeInp.value || null;
                
                const platformBlocks = document.querySelectorAll(`#re-posting-platforms-container-${trackingId} .posting-platform-block`);
                const postingData = [];
                platformBlocks.forEach(block => {
                    const platform = block.getAttribute('data-platform');
                    const dateVal = block.querySelector('.posting-date').value;
                    const timeVal = block.querySelector('.posting-time').value;
                    if (dateVal && timeVal) postingData.push({ platform, date: dateVal, time: timeVal });
                });
                payload.re_posting_timelines = postingData;
                
                // Keep the current step if it's rework
                await executeSave(btnReTimeline, null, payload); 
            });
        }
        
        // 9. Re-Draft
        const btnReDraft = document.getElementById(`btn-save-re-draft-${trackingId}`);
        if (btnReDraft) {
            btnReDraft.addEventListener('click', async () => {
                let videoUrl = await uploadPhoto(`re-draft-video-input-${trackingId}`);
                let payload = {};
                if (videoUrl) payload.re_draft_video_url = videoUrl;
                
                const approvedStatus = document.getElementById(`re-draft-status-value-${trackingId}`);
                const timingStatus = document.querySelector(`input[name="re-draft-timing-${trackingId}"]:checked`);
                const corrections = document.getElementById(`re-draft-correction-input-${trackingId}`);
                const finalLink = document.getElementById(`re-draft-final-link-${trackingId}`);
                const finalDesc = document.getElementById(`re-draft-final-desc-${trackingId}`);
                
                if (approvedStatus) payload.re_draft_approval_status = approvedStatus.value;
                if (timingStatus) payload.re_draft_timing_status = timingStatus.value;
                if (corrections) payload.re_draft_corrections_required = corrections.value;
                if (finalLink) payload.re_draft_final_product_link = finalLink.value;
                if (finalDesc) payload.re_draft_final_description = finalDesc.value;
                
                await executeSave(btnReDraft, null, payload);
            });
        }
    };
