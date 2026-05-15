// purchase-order.js

window.initPurchaseOrderForm = async function() {
    console.log("Initializing Purchase Order Form...");

    // 1. Generate PO Number dynamically
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const increment = "001"; // Default for now
    const poNumber = `PO-${year}-${month}-${increment}`;
    
    const poNumberHeader = document.getElementById('po-number-header');
    if (poNumberHeader) poNumberHeader.textContent = poNumber;

    // 2. Set current date dynamically
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year}`;
    
    const poDateHeader = document.getElementById('po-date-header');
    const poDateInput = document.getElementById('po-date-input');
    if (poDateHeader) poDateHeader.textContent = formattedDate;
    if (poDateInput) poDateInput.value = formattedDate;

    // 3. Load active vendors dynamically from Supabase (Delegated to script.js loadVendors)
    const vendorDropdown = document.getElementById('po-vendor-name');
    if (vendorDropdown && typeof window.loadVendors === 'function') {
        window.loadVendors(vendorDropdown);
    }

    // 4. Initialize Category Cascading System
    const poMainCat = document.getElementById('po-main-category');
    const poSub1 = document.getElementById('po-sub-category1');
    const poSub2 = document.getElementById('po-sub-category2');
    const poSub3Id = 'po-sub-category3';

    const _globals = window._financeCatGlobals || { mains: [], sub1: {}, sub2: {}, sub3: {} };
    
    if (poMainCat && _globals.mains && _globals.mains.length > 0) {
        poMainCat.innerHTML = '<option value="">Select Main Category</option>';
        _globals.mains.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            poMainCat.appendChild(opt);
        });
    }

    // Handlers for Category Cascading
    if (poMainCat) {
        poMainCat.onchange = () => {
            const mainVal = poMainCat.value;
            if (poSub1) poSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
            if (poSub2) poSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
            
            if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
                window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, [], 'Select Sub Category 3', 'No Sub Categories');
            }

            if (poSub2) poSub2.disabled = true;

            if (mainVal && _globals.sub1 && _globals.sub1[mainVal]) {
                if (poSub1) poSub1.disabled = false;
                _globals.sub1[mainVal].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    if (poSub1) poSub1.appendChild(opt);
                });
            } else {
                if (poSub1) poSub1.disabled = true;
            }
        };
    }

    if (poSub1) {
        poSub1.onchange = () => {
            const sub1Val = poSub1.value;
            if (poSub2) poSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
            
            if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
                window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, [], 'Select Sub Category 3', 'No Sub Categories');
            }

            if (sub1Val && _globals.sub2 && _globals.sub2[sub1Val]) {
                if (poSub2) poSub2.disabled = false;
                _globals.sub2[sub1Val].forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = sub;
                    if (poSub2) poSub2.appendChild(opt);
                });
            } else {
                if (poSub2) poSub2.disabled = true;
            }
        };
    }

    if (poSub2) {
        poSub2.onchange = () => {
            const sub2Val = poSub2.value;
            
            if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
                const sub3Data = (sub2Val && _globals.sub3 && _globals.sub3[sub2Val]) ? _globals.sub3[sub2Val] : [];
                window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, sub3Data, 'Select Sub Category 3', 'No Sub Categories');
            }
        };
    }
    
    // Initial clear of Multi-Select Sub Category 3
    if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
        window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, [], 'Select Sub Category 3', 'No Sub Categories');
    }

    // 5. Button Listeners
    const cancelBtn = document.getElementById('btn-cancel-po');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            // Reset form
            const form = document.getElementById('purchase-order-form');
            if (form) form.reset();
            // Reset cascades
            if (poSub1) { poSub1.innerHTML = '<option value="">Select Category First</option>'; poSub1.disabled = true; }
            if (poSub2) { poSub2.innerHTML = '<option value="">Select Category First</option>'; poSub2.disabled = true; }
            if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
                window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, [], 'Select Sub Category 3', 'No Sub Categories');
            }
            // Re-populate readonly fields
            if (poDateInput) poDateInput.value = formattedDate;
        };
    }
    
    const saveBtn = document.getElementById('btn-save-po');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const form = document.getElementById('purchase-order-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Just a console log or mock success notification for now as per instructions (UI + structure only)
            if (window.showToast) {
                window.showToast('Purchase Order Form validated. Backend save disabled.', 'success');
            } else {
                alert('Purchase Order Form validated. Backend save disabled.');
            }
        };
    }

    // 6. Product Table Logic
    const tbody = document.getElementById('po-product-tbody');
    let rowCount = 0;

    const calculateOverallTotals = () => {
        let subTotal = 0;
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const qty = parseFloat(row.querySelector('.po-qty').value) || 0;
                const price = parseFloat(row.querySelector('.po-price').value) || 0;
                subTotal += (qty * price);
            });
        }

        const gstTotal = subTotal * 0.18;
        const shippingInput = document.getElementById('po-shipping-charge');
        const shipping = shippingInput ? parseFloat(shippingInput.value) || 0 : 0;
        const grandTotal = subTotal + gstTotal + shipping;

        const subTotalSpan = document.getElementById('po-sub-total');
        const gstSpan = document.getElementById('po-gst-total');
        const grandTotalSpan = document.getElementById('po-grand-total');

        if (subTotalSpan) subTotalSpan.textContent = `₹${subTotal.toFixed(2)}`;
        if (gstSpan) gstSpan.textContent = `₹${gstTotal.toFixed(2)}`;
        if (grandTotalSpan) grandTotalSpan.textContent = `₹${grandTotal.toFixed(2)}`;
    };
    window.poCalculateOverallTotals = calculateOverallTotals;

    const calculateRowTotal = (row) => {
        const qtyInput = row.querySelector('.po-qty');
        const priceInput = row.querySelector('.po-price');
        const totalSpan = row.querySelector('.po-row-total');

        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        if (totalSpan) totalSpan.textContent = `₹${total.toFixed(2)}`;
        calculateOverallTotals();
    };
    window.poCalculateRowTotal = calculateRowTotal;

    const shippingInput = document.getElementById('po-shipping-charge');
    if (shippingInput) {
        shippingInput.addEventListener('input', calculateOverallTotals);
    }

    const addProductRow = () => {
        rowCount++;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-weight: 600;">${rowCount}</td>
            <td><input type="text" class="form-control po-desc" placeholder="Enter product description..." required></td>
            <td><input type="text" class="form-control po-moq" placeholder="MOQ"></td>
            <td><input type="text" class="form-control po-batch" placeholder="Batch Size"></td>
            <td><input type="number" class="form-control po-qty" placeholder="0" min="1" required></td>
            <td><input type="number" class="form-control po-price" placeholder="0.00" min="0" step="0.01" required></td>
            <td><input type="text" class="form-control po-gst" placeholder="GST"></td>
            <td style="text-align: right; font-weight: 600; color: var(--text-main);"><span class="po-row-total">₹0.00</span></td>
            <td><input type="text" class="form-control po-used" placeholder="Used In"></td>
        `;

        const qtyInput = tr.querySelector('.po-qty');
        const priceInput = tr.querySelector('.po-price');

        if (qtyInput) qtyInput.addEventListener('input', () => calculateRowTotal(tr));
        if (priceInput) priceInput.addEventListener('input', () => calculateRowTotal(tr));

        if (tbody) tbody.appendChild(tr);
        calculateOverallTotals();
    };
    window.poAddProductRow = addProductRow;

    // Initialize with one starter row
    if (tbody) {
        tbody.innerHTML = '';
        rowCount = 0;
        addProductRow();
    }

};
