// purchase-order.js

window.initPurchaseOrderForm = async function() {
    console.log("Initializing Purchase Order Form...");

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // 1. Generate PO Number dynamically with DB check
    const generatePONumber = async () => {
        let increment = "001";
        
        try {
            const { data, error } = await window.supabase
                .from('purchase_orders')
                .select('po_number')
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (!error && data && data.length > 0 && data[0].po_number) {
                const lastPO = data[0].po_number;
                // Expected format: PO-YYYY-MM-XXX
                const parts = lastPO.split('-');
                if (parts.length === 4 && parts[1] == year && parts[2] == month) {
                    const lastInc = parseInt(parts[3], 10);
                    if (!isNaN(lastInc)) {
                        increment = String(lastInc + 1).padStart(3, '0');
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching latest PO number", e);
        }
        
        const poNumber = `PO-${year}-${month}-${increment}`;
        const poNumberHeader = document.getElementById('po-number-header');
        if (poNumberHeader) poNumberHeader.textContent = poNumber;
        return poNumber;
    };
    
    generatePONumber();

    // 2. Set current date dynamically
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
            
            const vendorDropdown = document.getElementById('po-vendor-name');
            if (vendorDropdown) {
                vendorDropdown.dispatchEvent(new Event('change'));
            }
            
            // Re-populate readonly fields
            const poDateInput = document.getElementById('po-date-input');
            if (poDateInput) poDateInput.value = formattedDate;
            
            // Regenerate PO Number
            generatePONumber();
        };
    }
    
    const saveBtn = document.getElementById('btn-save-po');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const form = document.getElementById('purchase-order-form');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const vendorDropdown = document.getElementById('po-vendor-name');
            if (!vendorDropdown || !vendorDropdown.value) {
                if (window.showToast) window.showToast('Please select a vendor', 'error');
                return;
            }
            
            // Check product rows
            const tbody = document.getElementById('po-product-tbody');
            if (!tbody || tbody.querySelectorAll('tr').length === 0) {
                if (window.showToast) window.showToast('Please add at least one product row', 'error');
                return;
            }
            
            const originalBtnText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            try {
                // 1. Collect Header Data
                const poNumberHeader = document.getElementById('po-number-header');
                const poNumber = poNumberHeader ? poNumberHeader.textContent.trim() : '';
                
                const vendorId = vendorDropdown.value;
                const vendorName = vendorDropdown.options[vendorDropdown.selectedIndex].text;
                
                const mainCategory = document.getElementById('po-main-category')?.value || null;
                const subCategory1 = document.getElementById('po-sub-category1')?.value || null;
                const subCategory2 = document.getElementById('po-sub-category2')?.value || null;
                const subCategory3Input = document.getElementById('po-sub-category3');
                const subCategory3 = subCategory3Input ? subCategory3Input.value : null;
                
                const paymentMode = document.getElementById('po-payment-mode')?.value || null;
                const initiatedBy = document.getElementById('po-initiated-by')?.value || null;
                const approvedBy = document.getElementById('po-approved-by')?.value || null;
                
                const deliveryAddress = document.getElementById('po-delivery-address')?.value || null;
                const deliveryDate = document.getElementById('po-delivery-date')?.value || null;
                
                const parseCurrency = (id) => {
                    const el = document.getElementById(id);
                    if (!el) return 0;
                    const text = el.tagName === 'INPUT' ? el.value : el.textContent;
                    return parseFloat(text.replace(/[₹,]/g, '')) || 0;
                };
                
                const shippingCharges = parseCurrency('po-shipping-charge');
                const subTotal = parseCurrency('po-sub-total');
                const gstTotal = parseCurrency('po-gst-total');
                const grandTotal = parseCurrency('po-grand-total');
                
                const termsConditions = "1. Products supplied must match approved samples and agreed specifications.\n2. Any damaged or defective goods may be rejected.\n3. Delivery delays must be informed in advance.\n4. GST invoice must be provided along with goods.\n5. Packaging should be secure and suitable for transportation.";

                const headerPayload = {
                    po_number: poNumber,
                    vendor_id: vendorId,
                    vendor_name: vendorName,
                    main_category: mainCategory,
                    sub_category_1: subCategory1,
                    sub_category_2: subCategory2,
                    sub_category_3: subCategory3,
                    payment_mode: paymentMode,
                    initiated_by: initiatedBy,
                    approved_by: approvedBy,
                    delivery_address: deliveryAddress,
                    expected_delivery_date: deliveryDate,
                    shipping_charges: shippingCharges,
                    subtotal: subTotal,
                    gst_total: gstTotal,
                    grand_total: grandTotal,
                    terms_conditions: termsConditions
                };
                
                const { data: insertedPO, error: headerErr } = await window.supabase
                    .from('purchase_orders')
                    .insert([headerPayload])
                    .select('id')
                    .single();
                    
                if (headerErr) throw headerErr;
                
                const purchaseOrderId = insertedPO.id;
                
                // 2. Collect Product Rows Data
                const productsPayload = [];
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const getVal = (selector) => {
                        const el = row.querySelector(selector);
                        return el ? el.value || '' : '';
                    };
                    
                    const pName = getVal('.po-desc');
                    const moq = getVal('.po-moq');
                    const batchSize = getVal('.po-batch');
                    const qty = parseFloat(getVal('.po-qty')) || 0;
                    const price = parseFloat(getVal('.po-price')) || 0;
                    const gst = getVal('.po-gst');
                    
                    const rowTotalSpan = row.querySelector('.po-row-total');
                    const totalAmt = rowTotalSpan ? (parseFloat(rowTotalSpan.textContent.replace(/[₹,]/g, '')) || 0) : 0;
                    
                    const usedIn = getVal('.po-used');
                    
                    productsPayload.push({
                        purchase_order_id: purchaseOrderId,
                        product_name: pName,
                        moq: moq,
                        batch_size: batchSize,
                        quantity: qty,
                        unit_price: price,
                        gst: gst,
                        total_amount: totalAmt,
                        used_in: usedIn
                    });
                });
                
                if (productsPayload.length > 0) {
                    const { error: productsErr } = await window.supabase
                        .from('purchase_order_products')
                        .insert(productsPayload);
                        
                    if (productsErr) throw productsErr;
                }
                
                if (window.showToast) window.showToast('Purchase Order saved successfully!', 'success');
                
                // 3. Reset form
                if (form) form.reset();
                if (vendorDropdown) {
                    vendorDropdown.dispatchEvent(new Event('change'));
                }
                
                const poDateInput = document.getElementById('po-date-input');
                if (poDateInput) poDateInput.value = formattedDate;
                
                // Regenerate PO Number
                await generatePONumber();
                
            } catch (err) {
                console.error("Failed to save Purchase Order", err);
                if (window.showToast) {
                    window.showToast('Failed to save Purchase Order', 'error');
                } else {
                    alert('Failed to save Purchase Order');
                }
            } finally {
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
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
