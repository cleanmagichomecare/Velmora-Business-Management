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

    // Handlers for Category Cascading (User manual changes — never overwritten by vendor auto-fill)
    if (poMainCat) {
        poMainCat.onchange = () => {
            const mainVal = poMainCat.value;
            // Repopulate Sub Category 1 from master data based on new Main Category
            if (poSub1) {
                poSub1.innerHTML = '<option value="">Select Sub Category 1</option>';
                if (mainVal && _globals.sub1 && _globals.sub1[mainVal]) {
                    _globals.sub1[mainVal].forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = sub;
                        poSub1.appendChild(opt);
                    });
                }
            }
            // Reset Sub Category 2
            if (poSub2) poSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
            
            // Refresh Sub Category 3 products (filtered by Sub Cat 2 match)
            if (typeof window.refreshPOProductMultiSelect === 'function') {
                window.refreshPOProductMultiSelect();
            }
        };
    }

    if (poSub1) {
        poSub1.onchange = () => {
            const sub1Val = poSub1.value;
            // Repopulate Sub Category 2 from master data based on new Sub Category 1
            if (poSub2) {
                poSub2.innerHTML = '<option value="">Select Sub Category 2</option>';
                if (sub1Val && _globals.sub2 && _globals.sub2[sub1Val]) {
                    _globals.sub2[sub1Val].forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub;
                        opt.textContent = sub;
                        poSub2.appendChild(opt);
                    });
                }
            }
            
            // Refresh Sub Category 3 products (filtered by Sub Cat 2 match)
            if (typeof window.refreshPOProductMultiSelect === 'function') {
                window.refreshPOProductMultiSelect();
            }
        };
    }

    if (poSub2) {
        poSub2.onchange = () => {
            // Sub Category 2 changed — refresh products filtered by category match
            if (typeof window.refreshPOProductMultiSelect === 'function') {
                window.refreshPOProductMultiSelect();
            }
        };
    }
    
    // Attach Sub Category 3 hidden input change listener for Auto-Filling the Product Table
    const poSub3Input = document.getElementById(poSub3Id);
    if (poSub3Input) {
        poSub3Input.addEventListener('change', () => {
            if (typeof window.handleSubCategory3Selection === 'function') {
                window.handleSubCategory3Selection();
            }
        });
    }
    
    // Initial state of Multi-Select Sub Category 3
    if (window.SharedCategoryService && window.SharedCategoryService.populateMultiSelectDropdown) {
        window.SharedCategoryService.populateMultiSelectDropdown(poSub3Id, [], 'Select Vendor First', 'Select Vendor First');
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
    
    // Event delegation is used globally at the bottom of the file to ensure the Save PO button ALWAYS works.

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

// Global Event Delegation for Save PO Button to guarantee it always works
document.addEventListener('click', async (e) => {
    const saveBtn = e.target.closest('#btn-save-po');
    if (!saveBtn) return;
    
    e.preventDefault();
    console.log("Save PO button clicked");
    console.log("Step 1... Event listener successfully executed globally via delegation.");
    
    try {
        console.log("Step 2... Initializing save process");

        // Step 3: Validate Required Data
        const vendorDropdown = document.getElementById('po-vendor-name');
        if (!vendorDropdown || !vendorDropdown.value) {
            const msg = 'Please select a vendor before saving.';
            console.warn('Validation error:', msg);
            alert(msg);
            return;
        }
        
        const tbody = document.getElementById('po-product-tbody');
        if (!tbody || tbody.querySelectorAll('tr').length === 0) {
            const msg = 'Please add at least one product row.';
            console.warn('Validation error:', msg);
            alert(msg);
            return;
        }
        
        let allValid = true;
        tbody.querySelectorAll('tr').forEach(tr => {
            const qtyInput = tr.querySelector('.po-qty');
            const priceInput = tr.querySelector('.po-price');
            const qty = parseFloat(qtyInput ? qtyInput.value : 0);
            const price = parseFloat(priceInput ? priceInput.value : 0);
            
            if (isNaN(qty) || qty <= 0 || isNaN(price)) {
                allValid = false;
            }
        });
        
        if (!allValid) {
            const msg = 'Quantity must be > 0 and Unit Price must exist for all products.';
            console.warn('Validation error:', msg);
            alert(msg);
            return;
        }
        
        console.log("Step 3... Validation passed");
        
        const originalBtnText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        // Collect Header Payload
        const poNumberHeader = document.getElementById('po-number-header');
        const poNumber = poNumberHeader ? poNumberHeader.textContent.trim() : '';
        
        const parseCurrency = (id) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            const text = el.tagName === 'INPUT' ? el.value : el.textContent;
            return parseFloat(text.replace(/[₹,]/g, '')) || 0;
        };

        const poPayload = {
            po_number: poNumber,
            vendor_id: vendorDropdown.value,
            vendor_name: vendorDropdown.options[vendorDropdown.selectedIndex].text,
            main_category: document.getElementById('po-main-category')?.value || null,
            sub_category_1: document.getElementById('po-sub-category1')?.value || null,
            sub_category_2: document.getElementById('po-sub-category2')?.value || null,
            sub_category_3: document.getElementById('po-sub-category3')?.value || null,
            payment_mode: document.getElementById('po-payment-mode')?.value || null,
            initiated_by: document.getElementById('po-initiated-by')?.value || null,
            approved_by: document.getElementById('po-approved-by')?.value || null,
            delivery_address: document.getElementById('po-delivery-address')?.value || null,
            expected_delivery_date: document.getElementById('po-delivery-date')?.value || null,
            shipping_charges: parseCurrency('po-shipping-charge'),
            subtotal: parseCurrency('po-sub-total'),
            gst_total: parseCurrency('po-gst-total'),
            grand_total: parseCurrency('po-grand-total'),
            terms_conditions: "1. Products supplied must match approved samples and agreed specifications.\n2. Any damaged or defective goods may be rejected.\n3. Delivery delays must be informed in advance.\n4. GST invoice must be provided along with goods.\n5. Packaging should be secure and suitable for transportation."
        };
        
        // Collect Products Payload
        const productRows = [];
        tbody.querySelectorAll('tr').forEach(row => {
            const getVal = (selector) => {
                const el = row.querySelector(selector);
                return el ? el.value || '' : '';
            };
            const rowTotalSpan = row.querySelector('.po-row-total');
            const totalAmt = rowTotalSpan ? (parseFloat(rowTotalSpan.textContent.replace(/[₹,]/g, '')) || 0) : 0;
            
            productRows.push({
                product_name: getVal('.po-desc'),
                moq: getVal('.po-moq'),
                batch_size: getVal('.po-batch'),
                quantity: parseFloat(getVal('.po-qty')) || 0,
                unit_price: parseFloat(getVal('.po-price')) || 0,
                gst: getVal('.po-gst'),
                total_amount: totalAmt,
                used_in: getVal('.po-used')
            });
        });

        // Step 4: Verify Supabase Insert and Payload
        console.log("Step 4... Payloads prepared");
        console.log("PO Payload:", poPayload);
        console.log("Products Payload:", productRows);
        
        // Step 5: Execute Header Insert
        console.log("Step 5... Executing Supabase Insert for Header");
        
        const { data: insertedPO, error: headerErr } = await window.supabase
            .from('purchase_orders')
            .insert([poPayload])
            .select('id')
            .single();
            
        if (headerErr) {
            console.error("Supabase Header Insert Failed:", headerErr);
            throw headerErr;
        }
        
        console.log("Header Insert Success! Inserted PO ID:", insertedPO.id);
        
        // Step 6: Verify Product Table Insert
        console.log("Step 6... Linking foreign key and inserting product rows");
        
        const purchaseOrderId = insertedPO.id;
        
        // Add FK to each product row
        productRows.forEach(row => {
            row.purchase_order_id = purchaseOrderId;
        });
        
        const { error: productsErr } = await window.supabase
            .from('purchase_order_products')
            .insert(productRows);
            
        if (productsErr) {
            console.error("Supabase Products Insert Failed:", productsErr);
            throw productsErr;
        }
        
        console.log("Product Insert Success!");
        
        // Step 7: Add Success Feedback
        console.log("Step 7... Resetting form and UI");
        
        if (window.showToast) window.showToast('Purchase Order saved successfully!', 'success');
        else alert('Purchase Order saved successfully!');
        
        const form = document.getElementById('purchase-order-form');
        if (form) form.reset();
        if (vendorDropdown) vendorDropdown.dispatchEvent(new Event('change'));
        
        // Trigger generic re-initialization
        if (typeof window.initPurchaseOrderForm === 'function') {
            await window.initPurchaseOrderForm();
        }

        console.log("Step 8... Flow complete!");

    } catch (error) {
        console.error("PO Save Error:", error);
        alert("Failed to save Purchase Order: " + (error.message || JSON.stringify(error)));
    } finally {
        saveBtn.textContent = 'Save Purchase Order';
        saveBtn.disabled = false;
    }
});
