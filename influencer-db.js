/**
 * influencer-db.js
 * Logic for Influence Data Base Module in Marketing
 */

(function() {
    window.influencerDB = [];

    function loadInfluencerDBData() {
        try {
            const data = localStorage.getItem('influencerDBData');
            if (data) {
                window.influencerDB = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load influencerDBData:", e);
            window.influencerDB = [];
        }
    }

    function saveInfluencerDBData() {
        localStorage.setItem('influencerDBData', JSON.stringify(window.influencerDB));
    }

    function initInfluencerDBLogic() {
        console.log('influencer-db.js: initInfluencerDBLogic called');
        loadInfluencerDBData();

        // UI Elements
        const btnShowForm = document.getElementById('btn-show-influencer-form');
        const btnViewList = document.getElementById('btn-view-influencer-list');
        const btnBackToMarketing = document.getElementById('btn-back-to-marketing');
        const formContainer = document.getElementById('influencer-form-container');
        const listContainer = document.getElementById('influencer-list-container');
        const defaultState = document.getElementById('influencer-db-default');
        const influencerForm = document.getElementById('influencer-db-form');
        const btnCancel = document.getElementById('btn-cancel-influencer');
        const btnSave = document.getElementById('btn-save-influencer-db');

        // Form Fields
        const infBrand = document.getElementById('inf-brand');
        const infProduct = document.getElementById('inf-product');
        const infPlatformAvail = document.getElementById('inf-platform-avail');
        const infAvailContainers = document.getElementById('inf-avail-containers');
        const infPostedIn = document.getElementById('inf-posted-in');
        const infPostedContainers = document.getElementById('inf-posted-containers');

        const btnInfluencerDB = document.getElementById('btn-influencer-db');

        function hideAllViews() {
            [formContainer, listContainer, defaultState].forEach(el => {
                if (el) el.classList.add('hidden');
            });
        }

        // --- Entry Point ---
        if (btnInfluencerDB) {
            btnInfluencerDB.addEventListener('click', () => {
                const marketingOptions = document.getElementById('marketing-options');
                const influenceDbView = document.getElementById('view-influence-db');
                if (marketingOptions && influenceDbView) {
                    marketingOptions.classList.add('hidden');
                    influenceDbView.classList.remove('hidden');
                    influenceDbView.classList.add('active-view');
                }
            });
        }

        // --- Brand & Product Logic ---
        if (infBrand) {
            infBrand.addEventListener('change', () => {
                const brand = infBrand.value;
                infProduct.innerHTML = '<option value="">Select Product</option>';
                
                if (brand === "Better Magic") {
                    infProduct.disabled = false;
                    ["Magic Gel", "Tiles Cleaner", "Both"].forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p;
                        opt.textContent = p;
                        infProduct.appendChild(opt);
                    });
                } else if (brand === "Neat Magic") {
                    infProduct.disabled = false;
                    ["Sponge"].forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p;
                        opt.textContent = p;
                        infProduct.appendChild(opt);
                    });
                } else {
                    infProduct.disabled = true;
                    infProduct.innerHTML = '<option value="">Select Brand First</option>';
                }
            });
        }

        // --- Platform Logic ---
        function parsePlatforms(selection) {
            if (!selection) return [];
            if (selection === "All") return ["Instagram", "Youtube", "Facebook"];
            if (selection.includes(" and ")) {
                return selection.split(" and ");
            }
            return [selection];
        }

        function renderPlatformForms(platforms, containerId, type) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';

            platforms.forEach(p => {
                const card = document.createElement('div');
                card.className = 'vendor-form-container'; // Reuse styling
                card.style.background = 'var(--card-bg)';
                card.style.padding = '15px';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = '8px';
                card.style.marginBottom = '10px';
                
                const label = type === 'followers' ? 'Followers Count' : 'Views Count';
                const prefix = type === 'followers' ? 'avail' : 'posted';
                const idPrefix = `${prefix}-${p.toLowerCase()}`;

                card.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 10px; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        ${p} ${type === 'followers' ? 'Availability' : 'Performance'}
                    </div>
                    <div class="grid-3">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="${idPrefix}-username" placeholder="Username">
                        </div>
                        <div class="form-group">
                            <label>Link</label>
                            <input type="url" id="${idPrefix}-link" placeholder="Link">
                        </div>
                        <div class="form-group">
                            <label>${label}</label>
                            <input type="number" id="${idPrefix}-count" placeholder="Count">
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        if (infPlatformAvail) {
            infPlatformAvail.addEventListener('change', () => {
                const platforms = parsePlatforms(infPlatformAvail.value);
                renderPlatformForms(platforms, 'inf-avail-containers', 'followers');
            });
        }

        if (infPostedIn) {
            infPostedIn.addEventListener('change', () => {
                const platforms = parsePlatforms(infPostedIn.value);
                renderPlatformForms(platforms, 'inf-posted-containers', 'views');
            });
        }

        // --- Navigation ---
        if (btnShowForm) {
            btnShowForm.addEventListener('click', () => {
                hideAllViews();
                if (formContainer) {
                    formContainer.classList.remove('hidden');
                    influencerForm.reset();
                    infAvailContainers.innerHTML = '';
                    infPostedContainers.innerHTML = '';
                    infProduct.disabled = true;
                }
            });
        }

        if (btnViewList) {
            btnViewList.addEventListener('click', () => {
                hideAllViews();
                if (listContainer) {
                    listContainer.classList.remove('hidden');
                    renderInfluencerTable();
                }
            });
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                hideAllViews();
                if (defaultState) defaultState.classList.remove('hidden');
            });
        }

        if (btnBackToMarketing) {
            btnBackToMarketing.addEventListener('click', () => {
                // Return to Marketing Home
                const marketingView = document.getElementById('view-marketing');
                const influenceDbView = document.getElementById('view-influence-db');
                if (marketingView && influenceDbView) {
                    influenceDbView.classList.add('hidden');
                    marketingView.classList.remove('hidden');
                    marketingView.classList.add('active-view');
                    
                    // Show marketing options
                    const marketingOptions = document.getElementById('marketing-options');
                    if (marketingOptions) marketingOptions.classList.remove('hidden');
                }
            });
        }

        // --- Save Logic ---
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const name = document.getElementById('inf-name').value;
                const handle = document.getElementById('inf-handle').value;
                const brand = infBrand.value;

                if (!name || !brand) {
                    if (window.showToast) window.showToast('Please enter Name and Brand.', '⚠');
                    else alert('Please enter Name and Brand.');
                    return;
                }

                const influencer = {
                    id: Date.now(),
                    name: name,
                    handle: handle,
                    payment: document.getElementById('inf-payment').value,
                    brand: brand,
                    product: infProduct.value,
                    contact: {
                        phone: document.getElementById('inf-phone').value,
                        altPhone: document.getElementById('inf-alt-phone').value,
                        upi: document.getElementById('inf-upi').value,
                        city: document.getElementById('inf-city').value,
                        state: document.getElementById('inf-state').value,
                        language: document.getElementById('inf-language').value,
                        address: document.getElementById('inf-address').value
                    },
                    availability: [],
                    performance: [],
                    createdAt: new Date().toISOString()
                };

                // Capture Availability Data
                const availPlatforms = parsePlatforms(infPlatformAvail.value);
                availPlatforms.forEach(p => {
                    const lowP = p.toLowerCase();
                    influencer.availability.push({
                        platform: p,
                        username: document.getElementById(`avail-${lowP}-username`)?.value || '',
                        link: document.getElementById(`avail-${lowP}-link`)?.value || '',
                        count: document.getElementById(`avail-${lowP}-count`)?.value || 0
                    });
                });

                // Capture Performance Data
                const performancePlatforms = parsePlatforms(infPostedIn.value);
                performancePlatforms.forEach(p => {
                    const lowP = p.toLowerCase();
                    influencer.performance.push({
                        platform: p,
                        username: document.getElementById(`posted-${lowP}-username`)?.value || '',
                        link: document.getElementById(`posted-${lowP}-link`)?.value || '',
                        count: document.getElementById(`posted-${lowP}-count`)?.value || 0
                    });
                });

                window.influencerDB.push(influencer);
                saveInfluencerDBData();

                if (window.showToast) window.showToast('Influencer saved successfully!', '✅');
                
                hideAllViews();
                if (defaultState) defaultState.classList.remove('hidden');
            });
        }

        function renderInfluencerTable() {
            const container = document.getElementById('influencer-list-content');
            if (!container) return;

            let html = `
                <table class="vendor-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Brand</th>
                            <th>Product</th>
                            <th>Payment</th>
                            <th>City</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (window.influencerDB.length === 0) {
                html += '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No influencers saved yet.</td></tr>';
            } else {
                window.influencerDB.forEach(inf => {
                    html += `
                        <tr>
                            <td>${inf.name} <br> <span style="font-size: 11px; color:#888;">${inf.handle || ''}</span></td>
                            <td>${inf.brand}</td>
                            <td>${inf.product || '-'}</td>
                            <td>₹${inf.payment || 0}</td>
                            <td>${inf.contact.city || '-'}</td>
                        </tr>
                    `;
                });
            }

            html += '</tbody></table>';
            container.innerHTML = html;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInfluencerDBLogic);
    } else {
        initInfluencerDBLogic();
    }
})();
