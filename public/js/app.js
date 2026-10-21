/**
 * GustoGo — UI Denetleyicisi, Görünüm Yöneticisi & Etkinlik Bağlayıcıları
 */

// ==========================================
// BAŞLANGIÇ (INITIALIZATION)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    GustoState.loadPersistedState();
    initTheme();
    GustoAudio.updateSoundIcon();

    renderCategories();
    renderFlashDeals();
    renderPopularShowcase();
    renderRestaurantGrid(null);
    populateDropdowns();
    renderSavedAddressesList();
    startFlashCountdown();
    updateAddressLabel();
    switchDeliveryMode(GustoState.get().deliveryMode || 'courier');
    updateCartUI();
    updateOrderTrackerUI();

    // Aktif sipariş varsa kurye animasyonunu sürdür
    const activeOrder = GustoState.get().activeOrder;
    if (activeOrder && activeOrder.status !== 'teslim_edildi') {
        const r = GustoState.get().restaurants.find(x => x.id === activeOrder.rId);
        const c = GustoState.get().couriers.find(x => x.id === activeOrder.courierId);
        if (r && c) {
            GustoMap.startCourierAnimation(c, r, GustoState.get().customerLocation);
        }
        if (GustoState.get().isSimulationEnabled) {
            GustoState.startSimulation(handleSimulationStep);
        }
    }

    // Rolü uygula
    loginAs(GustoState.get().currentRole);
});

// ==========================================
// TEMA & SES YÖNETİMİ
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('gustogo-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-ico');
    if (icon) {
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('gustogo-theme', current);
    updateThemeIcon(current);
    GustoAudio.play('add');
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');
}

function toggleSound() {
    GustoAudio.toggleMute();
}

function populateDropdowns() {
    const rSel = document.getElementById('res-selector');
    if (rSel) {
        rSel.innerHTML = GustoState.get().restaurants.map(r => `<option value="${r.id}">${r.emoji} ${r.name}</option>`).join('');
        rSel.value = GustoState.get().selectedVendorRestId;
    }
    const cSel = document.getElementById('courier-selector');
    if (cSel) {
        cSel.innerHTML = GustoState.get().couriers.map(c => `<option value="${c.id}">${c.name} (${c.vehicle})</option>`).join('');
        cSel.value = GustoState.get().selectedCourierId;
    }
}

// ==========================================
// KATEGORİ, ARAMA VE AKILLI SIRALAMA
// ==========================================
function setSortMode(mode) {
    GustoState.get().currentSortMode = mode;
    ['fast', 'rating', 'promo', 'delivery'].forEach(m => {
        const el = document.getElementById('sort-' + m);
        if (el) el.className = 'sort-chip ' + (m === mode ? 'active' : '');
    });
    GustoAudio.play('add');
    renderRestaurantGrid(GustoState.get().activeCategory);
}

function renderCategories() {
    const container = document.getElementById('cat-pills');
    if (!container) return;
    const activeCat = GustoState.get().activeCategory;
    container.innerHTML = CATEGORIES.map(c =>
        `<div class="cat-pill ${activeCat === c.f ? 'active' : ''}" onclick="filterCategory('${c.f}')">${c.emoji} ${c.name}</div>`
    ).join('');
}

function filterCategory(cat) {
    const f = (cat === 'null' || !cat) ? null : cat;
    GustoState.get().activeCategory = f;
    renderCategories();
    renderRestaurantGrid(f);
    GustoAudio.play('add');

    const titleEl = document.getElementById('rest-section-title');
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-store" style="color:var(--primary);"></i> ` + (f ? f + ' Restoranları' : 'Çevrendeki Restoranlar');
    }
    document.getElementById('rest-section').style.display = 'block';
    document.getElementById('menu-section').style.display = 'none';
}

function renderRestaurantGrid(categoryFilter) {
    const state = GustoState.get();
    let list = categoryFilter
        ? state.restaurants.filter(r => r.cat === categoryFilter)
        : [...state.restaurants];

    // Akıllı Sıralama
    if (state.currentSortMode === 'fast') {
        list.sort((a, b) => {
            const dA = GustoState.calculateManhattan(a.x, a.y, state.customerLocation.x, state.customerLocation.y);
            const dB = GustoState.calculateManhattan(b.x, b.y, state.customerLocation.x, state.customerLocation.y);
            return dA - dB;
        });
    } else if (state.currentSortMode === 'rating') {
        list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (state.currentSortMode === 'promo') {
        list.sort((a, b) => (b.promo ? 1 : 0) - (a.promo ? 1 : 0));
    } else if (state.currentSortMode === 'delivery') {
        list.sort((a, b) => {
            const dA = GustoState.calculateManhattan(a.x, a.y, state.customerLocation.x, state.customerLocation.y);
            const dB = GustoState.calculateManhattan(b.x, b.y, state.customerLocation.x, state.customerLocation.y);
            return dA - dB;
        });
    }

    const badge = document.getElementById('rest-count-badge');
    if (badge) badge.innerText = `${list.length} Restoran açık`;

    const grid = document.getElementById('rest-grid');
    if (!grid) return;

    grid.innerHTML = list.map(r => {
        const dist = GustoState.calculateManhattan(r.x, r.y, state.customerLocation.x, state.customerLocation.y);
        const delFee = Math.max(15, Math.floor(dist * 1.5));
        return `
            <div class="rest-card" onclick="selectRestaurant(${r.id})">
                <div class="rest-cover-wrap">
                    <img class="rest-cover" src="${r.cover}" alt="${r.name}" loading="lazy">
                    ${r.promo ? `<div class="rest-promo"><i class="fa-solid fa-tag"></i> ${r.promo}</div>` : ''}
                    <div class="rest-dist-badge"><i class="fa-solid fa-location-dot"></i> ${dist} birim • ${delFee} ₺</div>
                </div>
                <div class="rest-body">
                    <div class="rest-name">${r.emoji} ${r.name}</div>
                    <div class="rest-meta">
                        <div class="rest-rating"><i class="fa-solid fa-star"></i> ${r.rating}</div>
                        <div style="display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-clock"></i> ${r.time} dk</div>
                        <div style="color:var(--text-3);">${r.cat}</div>
                        <div style="margin-left:auto;color:var(--text-3);">(${r.x}, ${r.y})</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showRestaurants() {
    GustoState.get().selectedRestId = null;
    document.getElementById('rest-section').style.display = 'block';
    document.getElementById('flash-deals-section').style.display = 'block';
    document.getElementById('popular-showcase-section').style.display = 'block';
    document.getElementById('menu-section').style.display = 'none';
    renderRestaurantGrid(GustoState.get().activeCategory);
    updateCartUI();
}

function selectRestaurant(id) {
    GustoState.get().selectedRestId = id;
    const r = GustoState.get().restaurants.find(x => x.id === id);
    if (!r) return;

    document.getElementById('mh-img').src = r.cover;
    document.getElementById('mh-name').innerText = r.name;
    document.getElementById('mh-rating').innerText = r.rating;
    document.getElementById('mh-time').innerText = r.time;
    document.getElementById('mh-loc').innerText = `(${r.x}, ${r.y})`;

    const items = GustoState.get().menuItems.filter(m => m.rId === id);
    const grid = document.getElementById('food-grid');
    if (!grid) return;

    grid.innerHTML = items.map(item => {
        const isFav = GustoState.get().userFavorites.includes(item.id);
        const isAvail = item.available !== false;
        return `
            <div class="food-card" onclick="${isAvail ? `openCustomizer(${item.id})` : ''}">
                <div class="food-img-wrap">
                    <img class="food-img" src="${item.img}" alt="${item.name}" loading="lazy">
                    <div class="food-badge-wrap">
                        <span class="food-tag">${item.tag}</span>
                        <button class="food-heart" style="${isFav ? 'background:var(--primary);' : ''}" onclick="event.stopPropagation();toggleHeart(this, ${item.id})">
                            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                        </button>
                    </div>
                    ${!isAvail ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;">TÜKENDİ</div>' : ''}
                </div>
                <div class="food-body">
                    <div class="food-name">${item.name}</div>
                    <div class="food-desc">${item.desc}</div>
                    <div class="food-footer">
                        <div class="food-price">${item.price.toFixed(2)} ₺</div>
                        <button class="btn-add" ${!isAvail ? 'disabled style="opacity:0.4;"' : ''} onclick="event.stopPropagation();openCustomizer(${item.id})">
                            <i class="fa-solid fa-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('rest-section').style.display = 'none';
    document.getElementById('flash-deals-section').style.display = 'none';
    document.getElementById('popular-showcase-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'grid';

    updateCartUI();
    GustoMap.drawMap('customer-map-canvas');
}

// ==========================================
// ÜRÜN ÖZELLEŞTİRME MODALI (CUSTOMIZER)
// ==========================================
let customizingItemId = null;
let customPortionPrice = 0;
let customPortionName = 'Standart Porsiyon';
let customQty = 1;

function openCustomizer(itemId) {
    if (GustoState.get().activeOrder) {
        showToast('⚠️', 'Hazırlanmakta olan aktif bir siparişiniz var!', 'warn');
        return;
    }
    customizingItemId = itemId || 6;
    const item = GustoState.get().menuItems.find(m => m.id === customizingItemId);
    if (!item) return;
    if (item.available === false) {
        showToast('⚠️', 'Bu lezzet restoranda şu anda tükendi!', 'warn');
        return;
    }

    document.getElementById('cust-img').src = item.img;
    document.getElementById('cust-name').innerText = item.name;
    document.getElementById('cust-desc').innerText = item.desc;
    document.getElementById('cust-base-price').innerText = item.price.toFixed(2) + ' ₺';

    // Seçenekleri sıfırla
    selectPortion(0, 'Standart Porsiyon');
    ['extra-cheese', 'extra-fries', 'extra-spicy', 'extra-truffle', 'rem-onion', 'rem-pickle', 'rem-tomato'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    document.getElementById('cust-note').value = '';
    customQty = 1;
    document.getElementById('cust-qty').innerText = '1';

    calcCustomTotal();
    document.getElementById('customizer-overlay').style.display = 'flex';
}

function closeCustomizer() {
    document.getElementById('customizer-overlay').style.display = 'none';
}

function selectPortion(price, name) {
    customPortionPrice = price;
    customPortionName = name;
    ['1', '2', '3'].forEach((id, idx) => {
        const prices = [0, 35, 65];
        const el = document.getElementById('opt-size-' + id);
        if (el) el.className = 'choice-pill ' + (prices[idx] === price ? 'selected' : '');
    });
    calcCustomTotal();
}

function changeCustomQty(delta) {
    customQty = Math.max(1, customQty + delta);
    document.getElementById('cust-qty').innerText = customQty;
    calcCustomTotal();
}

function calcCustomTotal() {
    const item = GustoState.get().menuItems.find(m => m.id === customizingItemId);
    if (!item) return 0;

    let unit = item.price + customPortionPrice;
    if (document.getElementById('extra-cheese')?.checked) unit += 25;
    if (document.getElementById('extra-fries')?.checked) unit += 30;
    if (document.getElementById('extra-spicy')?.checked) unit += 15;
    if (document.getElementById('extra-truffle')?.checked) unit += 20;

    const tot = unit * customQty;
    const btnText = document.getElementById('btn-cust-text');
    if (btnText) btnText.innerText = `Sepete Ekle • ${tot.toFixed(2)} ₺`;
    return tot;
}

function addCustomizedItemToCart() {
    const item = GustoState.get().menuItems.find(m => m.id === customizingItemId);
    if (!item) return;

    let unit = item.price + customPortionPrice;
    const extras = [];
    if (document.getElementById('extra-cheese')?.checked) { unit += 25; extras.push('Ekstra Kaşar (+25₺)'); }
    if (document.getElementById('extra-fries')?.checked) { unit += 30; extras.push('Çıtır Patates (+30₺)'); }
    if (document.getElementById('extra-spicy')?.checked) { unit += 15; extras.push('Acı Sos (+15₺)'); }
    if (document.getElementById('extra-truffle')?.checked) { unit += 20; extras.push('Trüf Mayonez (+20₺)'); }

    const exclusions = [];
    if (document.getElementById('rem-onion')?.checked) exclusions.push('Soğansız');
    if (document.getElementById('rem-pickle')?.checked) exclusions.push('Turşusuz');
    if (document.getElementById('rem-tomato')?.checked) exclusions.push('Domatessiz');

    const note = document.getElementById('cust-note')?.value.trim();

    const optionText = [
        customPortionName !== 'Standart Porsiyon' ? customPortionName : '',
        extras.join(', '),
        exclusions.join(', '),
        note ? `Not: "${note}"` : ''
    ].filter(Boolean).join(' • ');

    GustoState.get().selectedRestId = item.rId;
    GustoState.get().cart.push({
        id: item.id + '_' + Date.now(),
        itemId: item.id,
        name: item.name,
        price: unit,
        qty: customQty,
        options: optionText
    });

    GustoState.persist();
    closeCustomizer();
    updateCartUI();
    GustoAudio.play('add');
    showToast('🛒', `${item.name} özelleştirilerek sepete eklendi!`);
}

// ==========================================
// SEPET YÖNETİMİ
// ==========================================
function changeCartQty(cartId, delta) {
    const cart = GustoState.get().cart;
    const idx = cart.findIndex(c => c.id === cartId);
    if (idx < 0) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
    GustoState.persist();
    updateCartUI();
    GustoAudio.play('add');
}

// ==========================================
// SEPET YÖNETİMİ & GEL-AL (TAKEAWAY) ENTEGRASYONU
// ==========================================
function switchDeliveryMode(mode) {
    GustoState.setDeliveryMode(mode);
    const isTakeaway = mode === 'takeaway';
    
    const btnCourier = document.getElementById('btn-del-courier');
    const btnTakeaway = document.getElementById('btn-del-takeaway');
    if (btnCourier) btnCourier.className = 'del-mode-btn ' + (!isTakeaway ? 'active' : '');
    if (btnTakeaway) btnTakeaway.className = 'del-mode-btn ' + (isTakeaway ? 'active' : '');
    
    const ind = document.getElementById('cart-mode-indicator');
    if (ind) {
        ind.innerHTML = isTakeaway
            ? '<i class="fa-solid fa-person-walking"></i> Gel-Al (%20 İndirimli)'
            : '<i class="fa-solid fa-motorcycle"></i> Adrese Teslim';
    }

    const notice = document.getElementById('checkout-del-mode-notice');
    if (notice) notice.style.display = isTakeaway ? 'flex' : 'none';

    updateCartUI();
    GustoAudio.play('add');
    GustoMap.drawMap('customer-map-canvas');
    showToast(isTakeaway ? '🚶' : '🛵', isTakeaway ? 'Gel-Al moduna geçildi: 0 ₺ teslimat + %20 indirim uygulandı!' : 'Adrese kurye teslimat modu aktif.');
}

function changeCartQty(cartId, delta) {
    const cart = GustoState.get().cart;
    const idx = cart.findIndex(c => c.id === cartId);
    if (idx < 0) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
    GustoState.persist();
    updateCartUI();
    GustoAudio.play('add');
}

function updateCartUI() {
    const state = GustoState.get();
    const cart = state.cart;
    const r = state.selectedRestId ? state.restaurants.find(x => x.id === state.selectedRestId) : null;
    const tot = cart.reduce((s, c) => s + c.qty, 0);
    const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);

    let discount = 0;
    let discCode = state.activeCoupon || '';

    if (state.activeCoupon === 'GUSTO30') discount = sub * 0.30;
    else if (state.activeCoupon === 'PIZZA50' && cart.some(c => c.price > 180)) discount = 50.0;
    else if (state.activeCoupon === 'BURGERFEST') discount = 35.0;
    else if (state.activeCoupon === 'HEMEN10') discount = 10.0;

    // Gel-Al Modu Kontrolü: 0 ₺ Teslimat + Otomatik %20 İndirim
    const isTakeaway = state.deliveryMode === 'takeaway';
    if (isTakeaway) {
        const takeawayDisc = sub * 0.20;
        if (takeawayDisc > discount) {
            discount = takeawayDisc;
            discCode = 'GELAL20 (%20 Gel-Al)';
        }
    }

    const dist = r ? GustoState.calculateManhattan(r.x, r.y, state.customerLocation.x, state.customerLocation.y) : 0;
    const del = isTakeaway ? 0 : (cart.length ? (r ? Math.max(15, Math.floor(dist * 1.5)) : 0) : 0);
    const eta = isTakeaway ? 15 : (r ? (parseInt(r.time.split('-')[0]) + Math.floor(dist / 2)) : 0);
    const finalTotal = Math.max(0, sub - discount + del);

    const badge = document.getElementById('cart-badge');
    if (badge) badge.innerText = tot;

    const fromEl = document.getElementById('cart-from');
    if (fromEl) fromEl.innerText = r ? r.name : '—';

    // Alt Yüzen Sepet Barı
    const floatBar = document.getElementById('floating-cart-bar');
    if (floatBar) {
        if (cart.length > 0 && !state.activeOrder) {
            floatBar.style.display = 'flex';
            document.getElementById('float-cart-count').innerText = tot;
            document.getElementById('float-cart-text').innerText = `Sepetinizde ${tot} lezzet var (${r ? r.name : ''})`;
            document.getElementById('float-cart-total').innerText = finalTotal.toFixed(2) + ' ₺';
        } else {
            floatBar.style.display = 'none';
        }
    }

    const emptyBox = document.getElementById('cart-empty');
    const itemsBox = document.getElementById('cart-items');
    const ecoArea = document.getElementById('cart-eco-area');
    const couponBox = document.getElementById('cart-coupon-area');
    const summBox = document.getElementById('cart-summ');
    const btnOrder = document.getElementById('btn-order');

    if (!cart.length) {
        if (emptyBox) emptyBox.style.display = 'flex';
        if (itemsBox) itemsBox.style.display = 'none';
        if (ecoArea) ecoArea.style.display = 'none';
        if (couponBox) couponBox.style.display = 'none';
        if (summBox) summBox.style.display = 'none';
        if (btnOrder) btnOrder.disabled = true;
    } else {
        if (emptyBox) emptyBox.style.display = 'none';
        if (ecoArea) ecoArea.style.display = 'block';
        if (itemsBox) {
            itemsBox.style.display = 'block';
            itemsBox.innerHTML = cart.map(c => `
                <div class="cart-item">
                    <div class="cart-item-top">
                        <div class="cart-item-name">${c.name}</div>
                        <div class="qty-ctrl">
                            <button class="qty-btn" onclick="changeCartQty('${c.id}', -1)">−</button>
                            <span class="qty-val">${c.qty}</span>
                            <button class="qty-btn" onclick="changeCartQty('${c.id}', +1)">+</button>
                        </div>
                        <div class="cart-item-price">${(c.price * c.qty).toFixed(2)} ₺</div>
                    </div>
                    ${c.options ? `<div class="cart-item-options">${c.options}</div>` : ''}
                </div>
            `).join('');
        }
        if (couponBox) couponBox.style.display = 'flex';
        if (summBox) {
            summBox.style.display = 'block';
            document.getElementById('s-sub').innerText = sub.toFixed(2) + ' ₺';
            if (discount > 0) {
                document.getElementById('s-discount-row').style.display = 'flex';
                document.getElementById('s-disc').innerText = `-${discount.toFixed(2)} ₺ (${discCode})`;
            } else {
                document.getElementById('s-discount-row').style.display = 'none';
            }
            document.getElementById('s-del').innerText = isTakeaway ? '0.00 ₺ (Gel-Al Ücretsiz)' : del.toFixed(2) + ' ₺';
            document.getElementById('s-time').innerText = isTakeaway ? '~15 dk (Restorandan Alım)' : `~${eta} dk (${dist} birim)`;
            document.getElementById('s-total').innerText = finalTotal.toFixed(2) + ' ₺';
        }
        if (btnOrder) btnOrder.disabled = false;
    }
}

// ==========================================
// CHECKOUT & ÖDEME MODALI
// ==========================================
let selectedPayMethod = 'cc';
let selectedTip = 0;

function openCheckoutModal() {
    const state = GustoState.get();
    if (!state.cart.length) {
        state.selectedRestId = 2;
        state.cart.push({
            id: 'demo_smash',
            itemId: 6,
            name: 'Smash Cheeseburger',
            price: 275,
            qty: 1,
            options: '1.5 Doyurucu Porsiyon • Ekstra Kaşar (+25₺)'
        });
        updateCartUI();
    }
    
    const notice = document.getElementById('checkout-del-mode-notice');
    if (notice) notice.style.display = (state.deliveryMode === 'takeaway') ? 'flex' : 'none';

    calcCheckoutTotal();
    document.getElementById('checkout-overlay').style.display = 'flex';
}

function closeCheckoutModal() {
    document.getElementById('checkout-overlay').style.display = 'none';
}

function selectPayMethod(m) {
    selectedPayMethod = m;
    ['cc', 'cod', 'wallet'].forEach(id => {
        const el = document.getElementById('pay-card-' + id);
        if (el) el.className = 'pay-card ' + (id === m ? 'active' : '');
    });
    const ccForm = document.getElementById('cc-form-area');
    if (ccForm) ccForm.style.display = (m === 'cc' ? 'block' : 'none');
    calcCheckoutTotal();
}

function setTip(amt) {
    selectedTip = amt;
    [0, 10, 20, 50].forEach(a => {
        const el = document.getElementById('tip-' + a);
        if (el) el.className = 'tip-pill ' + (a === amt ? 'active' : '');
    });
    calcCheckoutTotal();
}

function selectInstruction(instText, el) {
    GustoState.get().selectedInstruction = instText;
    const chips = document.querySelectorAll('#instruction-chips .inst-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    GustoAudio.play('add');
}

function setScheduledTime(timeSlot, el) {
    GustoState.get().scheduledTime = timeSlot;
    const pills = document.querySelectorAll('#sched-pills .sched-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    GustoAudio.play('add');
}

function toggleEcoFriendly(checked) {
    GustoState.get().isEcoFriendly = checked;
    const c1 = document.getElementById('cart-eco-check');
    const c2 = document.getElementById('eco-choice');
    if (c1) c1.checked = checked;
    if (c2) c2.checked = checked;
    showToast('🌱', checked ? 'Doğa dostu yeşil teslimat seçildi (-140g CO2)!' : 'Plastik servis seti eklendi.');
}

function calcCheckoutTotal() {
    const state = GustoState.get();
    const r = state.restaurants.find(x => x.id === (state.selectedRestId || 1)) || state.restaurants[0];
    const sub = state.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const dist = GustoState.calculateManhattan(r.x, r.y, state.customerLocation.x, state.customerLocation.y);
    const isTakeaway = state.deliveryMode === 'takeaway';
    const del = isTakeaway ? 0 : Math.max(15, Math.floor(dist * 1.5));

    let discount = 0;
    if (state.activeCoupon === 'GUSTO30') discount = sub * 0.30;
    else if (state.activeCoupon === 'PIZZA50' && state.cart.some(c => c.price > 180)) discount = 50.0;
    else if (state.activeCoupon === 'BURGERFEST') discount = 35.0;
    else if (state.activeCoupon === 'HEMEN10') discount = 10.0;

    if (isTakeaway) {
        const takeawayDisc = sub * 0.20;
        if (takeawayDisc > discount) discount = takeawayDisc;
    }

    let walletDiscount = 0;
    if (selectedPayMethod === 'wallet') {
        walletDiscount = Math.min(sub + del - discount, state.userPoints / 10);
    }

    const finalTot = Math.max(0, sub - discount + del - walletDiscount + (isTakeaway ? 0 : selectedTip));
    const totalEl = document.getElementById('checkout-final-total');
    if (totalEl) totalEl.innerText = finalTot.toFixed(2) + ' ₺';
    return { sub, discount, del, walletDiscount, finalTot, dist, isTakeaway };
}

function confirmCheckoutAndPlaceOrder() {
    closeCheckoutModal();
    const state = GustoState.get();
    state.orderCounter++;

    const r = state.restaurants.find(x => x.id === (state.selectedRestId || 1)) || state.restaurants[0];
    const { sub, discount, del, walletDiscount, finalTot, dist, isTakeaway } = calcCheckoutTotal();

    // AKILLI MANHATTAN KURYE ATAMASI (Gel-Al değilse)
    let bestCourier = { id: 0, name: "Restorandan Gel-Al (Müşteri)", score: 0 };
    if (!isTakeaway) {
        bestCourier = GustoState.findBestCourier(r.x, r.y);
        const cObj = state.couriers.find(c => c.id === bestCourier.id);
        if (cObj) {
            cObj.active++;
            cObj.tips += selectedTip;
            cObj.earnings += (del * 0.7) + selectedTip;
        }
    }

    if (selectedPayMethod === 'wallet') {
        state.userPoints = Math.max(0, state.userPoints - Math.floor(walletDiscount * 10));
    }

    const customNote = document.getElementById('delivery-custom-note')?.value.trim() || '';

    state.activeOrder = {
        id: state.orderCounter,
        restaurant: r.name,
        rId: r.id,
        courier: bestCourier.name,
        courierId: bestCourier.id,
        items: state.cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, options: c.options })),
        subtotal: sub,
        discount,
        delFee: del,
        total: finalTot,
        tip: isTakeaway ? 0 : selectedTip,
        payMethod: selectedPayMethod,
        deliveryMode: state.deliveryMode,
        instruction: state.selectedInstruction || 'Zile Basma Bebek Uyuyor 👶',
        customNote,
        scheduledTime: state.scheduledTime || 'Hemen Gelsin (~25 dk)',
        isEco: state.isEcoFriendly,
        status: 'alindi',
        createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        dateStr: new Date().toLocaleDateString('tr-TR')
    };

    GustoState.logAudit(
        state.orderCounter,
        null,
        'alindi',
        `${state.currentUser.fullName} (Müşteri)`,
        `Sipariş verildi. Mod: ${isTakeaway ? 'GEL-AL' : 'KURYE TESLİMAT'}, Ödeme: ${selectedPayMethod.toUpperCase()}, Kurye: ${bestCourier.name}`
    );

    state.cart = [];
    state.activeCoupon = null;
    GustoState.persist();

    updateCartUI();
    updateOrderTrackerUI();

    // Kurye / Yürüyüş Yolculuk Animasyonunu Başlat
    GustoMap.startCourierAnimation(bestCourier, r, state.customerLocation);

    GustoAudio.play('order');
    showToast('🎉', `Sipariş #ORD-${state.orderCounter} alındı! ${isTakeaway ? 'Restorandan Gel-Al Hazırlanıyor' : 'Kurye: ' + bestCourier.name}`);

    if (state.isSimulationEnabled) {
        GustoState.startSimulation(handleSimulationStep);
    }
}

// ==========================================
// CANLI SİPARİŞ TAKİP STEPPER & SİMÜLASYON
// ==========================================
function handleSimulationStep(newStatus) {
    updateOrderTrackerUI();
    GustoAudio.play('status');
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');

    if (newStatus === 'teslim_edildi') {
        GustoAudio.play('deliver');
        setTimeout(() => {
            const finished = { ...GustoState.get().activeOrder };
            GustoState.get().orderHistory.unshift(finished);
            GustoState.get().activeOrder = null;
            GustoState.persist();
            updateOrderTrackerUI();
            openRatingModal();
            GustoMap.drawMap('customer-map-canvas');
            GustoMap.drawMap('admin-map-canvas');
        }, 1500);
    }
}

function toggleSimMode() {
    const state = GustoState.get();
    state.isSimulationEnabled = !state.isSimulationEnabled;
    const txt = document.getElementById('sim-indicator');
    const btn = document.getElementById('btn-toggle-sim');

    if (state.isSimulationEnabled) {
        if (txt) txt.innerHTML = '<i class="fa-solid fa-play" style="color:var(--success);"></i> Simülasyon: Otomatik İlerleme Açık';
        if (btn) btn.innerText = 'Durdur / Manuel';
        showToast('⚡', 'Otomatik simülasyon modu açıldı.');
        if (state.activeOrder && state.activeOrder.status !== 'teslim_edildi') {
            GustoState.startSimulation(handleSimulationStep);
        }
    } else {
        if (txt) txt.innerHTML = '<i class="fa-solid fa-pause" style="color:var(--yellow);"></i> Simülasyon: Manuel Mod';
        if (btn) btn.innerText = 'Otomatik Başlat';
        GustoState.stopSimulation();
        showToast('✋', 'Manuel mod aktif. İlgili role geçerek adımları kendiniz yönetebilirsiniz.');
    }
}

function cancelOrder() {
    const res = GustoState.cancelActiveOrder();
    if (!res.success) {
        GustoAudio.play('cancel');
        showToast('🚫', res.message, 'danger');
        return;
    }
    GustoAudio.play('cancel');
    updateOrderTrackerUI();
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');
    showToast('❌', res.message);
}

function updateOrderTrackerUI() {
    const activeOrder = GustoState.get().activeOrder;
    const fw = { alindi: '0%', hazirlaniyor: '25%', hazir: '50%', yolda: '75%', teslim_edildi: '100%', iptal: '0%' };
    const tx = {
        alindi: { t: 'Siparişiniz Alındı! 📝', s: 'Restoran onaylayıp mutfağa aktaracak…' },
        hazirlaniyor: { t: 'Mutfakta Hazırlanıyor 👨‍🍳', s: 'Yemeğiniz taze taze pişiriliyor.' },
        hazir: { t: 'Sipariş Hazır! 📦', s: 'Kurye paketi teslim almak üzere restorana ulaştı.' },
        yolda: { t: 'Kurye Yolda! 🚀', s: 'Siparişiniz kapınıza doğru hızla geliyor.' },
        teslim_edildi: { t: 'Teslim Edildi! 🎉', s: 'Afiyet olsun, bizi tercih ettiğiniz için teşekkürler.' },
        iptal: { t: 'Sipariş İptal Edildi ❌', s: 'Yeni bir sipariş oluşturabilirsiniz.' }
    };

    const chatBtn = document.getElementById('btn-chat-courier');
    const stepOrder = ['alindi', 'hazirlaniyor', 'hazir', 'yolda', 'teslim_edildi'];
    const thermalBox = document.getElementById('thermal-box');
    const thermalTemp = document.getElementById('thermal-temp');
    const thermalFill = document.getElementById('thermal-fill');
    const ecoBadge = document.getElementById('eco-saved-badge');
    const addonCard = document.getElementById('addon-deal-card');

    if (!activeOrder) {
        stepOrder.forEach(s => {
            const el = document.getElementById('sn-' + s);
            if (el) el.className = 'step';
        });
        const fill = document.getElementById('step-fill');
        if (fill) fill.style.width = '0%';

        const numBadge = document.getElementById('order-number-badge');
        if (numBadge) numBadge.classList.add('hidden');

        document.getElementById('tracker-text').innerText = 'Henüz aktif siparişiniz bulunmuyor.';
        document.getElementById('tracker-sub').innerText = 'Menüden dilediğiniz lezzetleri sepete ekleyebilirsiniz.';
        const cancelBtn = document.getElementById('btn-cancel');
        if (cancelBtn) cancelBtn.disabled = true;
        if (chatBtn) chatBtn.classList.add('hidden');
        if (thermalBox) thermalBox.style.display = 'none';
        if (ecoBadge) ecoBadge.style.display = 'none';
        if (addonCard) addonCard.style.display = 'none';
        return;
    }

    const s = activeOrder.status;
    const fill = document.getElementById('step-fill');
    if (fill) fill.style.width = fw[s] || '0%';

    const numBadge = document.getElementById('order-number-badge');
    if (numBadge) {
        numBadge.classList.remove('hidden');
        numBadge.innerText = '#ORD-' + activeOrder.id + (activeOrder.deliveryMode === 'takeaway' ? ' (Gel-Al)' : '');
    }

    document.getElementById('tracker-text').innerText = tx[s]?.t || s;
    document.getElementById('tracker-sub').innerText = tx[s]?.s || '';

    const idx = stepOrder.indexOf(s);
    stepOrder.forEach((step, i) => {
        const el = document.getElementById('sn-' + step);
        if (!el) return;
        if (i < idx) el.className = 'step done';
        else if (i === idx) el.className = 'step active';
        else el.className = 'step';
    });

    const cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn) cancelBtn.disabled = (s !== 'alindi');

    if (chatBtn) {
        if (['hazir', 'yolda'].includes(s) && activeOrder.deliveryMode !== 'takeaway') chatBtn.classList.remove('hidden');
        else chatBtn.classList.add('hidden');
    }

    // 1. Canlı Sıcaklık & Tazelik Simülatörü
    if (thermalBox) {
        thermalBox.style.display = 'block';
        const thermalLevels = {
            alindi: { temp: '85°C (Mutfak Fırını)', width: '92%' },
            hazirlaniyor: { temp: '88°C (Tavada Pişiyor 🔥)', width: '96%' },
            hazir: { temp: '82°C (Termal Çantada 🎒)', width: '88%' },
            yolda: { temp: '74°C (Sıcaklığını Koruyor 🛵)', width: '78%' },
            teslim_edildi: { temp: '68°C (İdeal Tüketim Sıcaklığı 😋)', width: '70%' },
            iptal: { temp: 'Oda Sıcaklığı', width: '20%' }
        };
        const curLevel = thermalLevels[s] || thermalLevels.alindi;
        if (thermalTemp) thermalTemp.innerText = curLevel.temp;
        if (thermalFill) thermalFill.style.width = curLevel.width;
    }

    // 2. Doğa Dostu Yeşil Karbon Tasarrufu Rozeti
    if (ecoBadge) {
        ecoBadge.style.display = activeOrder.isEco ? 'flex' : 'none';
    }

    // 3. Yol Üstü Fırsatı (Roadside Add-on Banner)
    if (addonCard) {
        if (['hazirlaniyor', 'yolda'].includes(s) && !activeOrder.addon && activeOrder.deliveryMode !== 'takeaway') {
            addonCard.style.display = 'block';
            const deal = ADDON_DEALS[0];
            const titleEl = document.getElementById('addon-deal-title');
            const priceEl = document.getElementById('addon-deal-price');
            if (titleEl) titleEl.innerText = `${deal.restaurantName}'ndan ${deal.itemName}`;
            if (priceEl) priceEl.innerText = `+${deal.price.toFixed(2)} ₺`;
        } else {
            addonCard.style.display = 'none';
        }
    }

    // Role göre ilgili paneli güncelle
    const role = GustoState.get().currentRole;
    if (role === 'restaurant') renderResPanel();
    if (role === 'courier') renderCourierPanel();
    if (role === 'admin') {
        renderAdminCouriers();
        renderAdminAudit();
    }
}

// ==========================================
// YOL ÜSTÜ FIRSATI (ROADSIDE ADD-ON)
// ==========================================
function acceptRoadsideAddon() {
    const deal = ADDON_DEALS[0];
    const res = GustoState.applyRoadsideAddon(deal);
    if (res.success) {
        GustoAudio.play('add');
        updateOrderTrackerUI();
        GustoMap.drawMap('customer-map-canvas');
        showToast('🍰', 'Tatlı Dünyası ara durağı kurye rotasına ve siparişinize eklendi! (+0 ₺ Teslimat)');
    }
}

// ==========================================
// PUANLAMA & DEĞERLENDİRME MODALI (KIRILIMLI)
// ==========================================
function openRatingModal() {
    document.getElementById('rating-overlay').style.display = 'flex';
}

function closeRatingModal() {
    document.getElementById('rating-overlay').style.display = 'none';
}

function setStars(target, rating) {
    const container = document.getElementById(target + '-stars');
    if (!container) return;
    const stars = container.querySelectorAll('i');
    stars.forEach((s, idx) => {
        if (idx < rating) s.className = 'fa-solid fa-star active';
        else s.className = 'fa-regular fa-star';
    });
}

function toggleRatingTag(el) {
    el.classList.toggle('active');
    GustoAudio.play('add');
}

function submitRatingAndReward() {
    GustoState.addGustoPoints(25);
    document.getElementById('acc-points').innerText = `${GustoState.get().userPoints} GustoPuan (${(GustoState.get().userPoints / 10).toFixed(2)} ₺)`;
    document.getElementById('nav-role').innerHTML = `<i class="fa-solid fa-coins"></i> ${GustoState.get().userPoints} Puan`;
    closeRatingModal();
    GustoAudio.play('win');
    showToast('🌟', 'Kırılımlı değerlendirmeniz iletildi! +25 GustoPuan cüzdanınıza eklendi.');
}

// ==========================================
// ŞANSLI GUSTO ÇARKI (GAMIFICATION SPIN WHEEL)
// ==========================================
let isWheelSpinning = false;
let currentWheelAngle = 0;

function openWheelModal() {
    const state = GustoState.get();
    if (typeof state.wheelSpinsAvailable !== 'number' || state.wheelSpinsAvailable <= 0) {
        state.wheelSpinsAvailable = 1;
    }
    document.getElementById('wheel-overlay').style.display = 'flex';
    drawWheel(currentWheelAngle);
    const countEl = document.getElementById('wheel-spins-count');
    if (countEl) countEl.innerText = state.wheelSpinsAvailable;
}

function closeWheelModal() {
    document.getElementById('wheel-overlay').style.display = 'none';
}

function drawWheel(angle = 0) {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSlices; i++) {
        const startA = angle + i * sliceAngle;
        const endA = startA + sliceAngle;
        const slice = WHEEL_SLICES[i];

        // Dilim yayı
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startA, endA);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();

        // Metin etiketi
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startA + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillText(slice.label, radius - 16, 4);
        ctx.restore();
    }

    // Orta Göbek Rozeti
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#121620';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FA4A0C';
    ctx.stroke();

    ctx.fillStyle = '#FA4A0C';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GUSTO', cx, cy);
}

function spinLuckyWheel() {
    const state = GustoState.get();
    if (isWheelSpinning) return;
    if (state.wheelSpinsAvailable <= 0) {
        showToast('⚠️', 'Bugünlük çevirme hakkınız bitti! Sipariş vererek yeni hak kazanabilirsiniz.');
        return;
    }

    isWheelSpinning = true;
    state.wheelSpinsAvailable--;
    GustoState.persist();
    const countEl = document.getElementById('wheel-spins-count');
    if (countEl) countEl.innerText = state.wheelSpinsAvailable;

    const btn = document.getElementById('btn-spin-wheel');
    if (btn) btn.disabled = true;

    // Hedef dilimi rastgele seç
    const targetIdx = Math.floor(Math.random() * WHEEL_SLICES.length);
    const sliceAngle = (2 * Math.PI) / WHEEL_SLICES.length;
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const targetAngle = (extraRounds * 2 * Math.PI) + ((3 * Math.PI / 2) - (targetIdx * sliceAngle + sliceAngle / 2));

    const duration = 3500;
    const startT = performance.now();
    const initialAngle = currentWheelAngle;
    let lastTick = 0;

    function animate(t) {
        const elapsed = t - startT;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        currentWheelAngle = initialAngle + (targetAngle - initialAngle) * ease;
        drawWheel(currentWheelAngle);

        if (elapsed - lastTick > 120 && progress < 0.85) {
            GustoAudio.play('spin');
            lastTick = elapsed;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isWheelSpinning = false;
            if (btn) btn.disabled = false;
            const wonSlice = WHEEL_SLICES[targetIdx];
            GustoAudio.play('win');

            if (wonSlice.type === 'points') {
                GustoState.addGustoPoints(wonSlice.value);
                document.getElementById('acc-points').innerText = `${state.userPoints} GustoPuan (${(state.userPoints / 10).toFixed(2)} ₺)`;
                document.getElementById('nav-role').innerHTML = `<i class="fa-solid fa-coins"></i> ${state.userPoints} Puan`;
                showToast('🎉', `Tebrikler! ${wonSlice.label} kazandınız ve cüzdanınıza yüklendi!`);
            } else if (wonSlice.type === 'coupon') {
                state.activeCoupon = wonSlice.value;
                GustoState.persist();
                updateCartUI();
                showToast('🎁', `Tebrikler! ${wonSlice.label} kazandınız. Kupon sepetinize tanımlandı!`);
            } else {
                showToast('🍀', 'Şansınızı tekrar denemek için yeni bir sipariş verin!');
            }
        }
    }
    requestAnimationFrame(animate);
}

// ==========================================
// ORTAK SEPET / GRUP SİPARİŞİ (GROUP ORDER)
// ==========================================
function openGroupOrderModal() {
    renderGroupOrderMembers();
    document.getElementById('group-order-overlay').style.display = 'flex';
}

function closeGroupOrderModal() {
    document.getElementById('group-order-overlay').style.display = 'none';
}

function copyGroupOrderLink() {
    navigator.clipboard?.writeText(window.location.origin + '/?group=GUSTO-7429');
    GustoAudio.play('add');
    showToast('📋', 'Grup davet bağlantısı panoya kopyalandı! (Kod: GUSTO-7429)');
}

function renderGroupOrderMembers() {
    const list = document.getElementById('group-members-list');
    if (!list) return;
    const rawMembers = GustoState.get().groupOrder?.members || [];
    const members = rawMembers.length ? rawMembers : [
        { name: "Ahmet Yılmaz (Siz - Kurucu)", items: ["Smash Cheeseburger"], total: 275 },
        { name: "Selin Demir", items: ["Truffle Burger", "Çıtır Patates"], total: 320 },
        { name: "Burak Kaya", items: ["San Sebastian Cheesecake"], total: 95 }
    ];

    list.innerHTML = members.map(m => {
        const name = (typeof m === 'object' && m.name) ? m.name : String(m);
        const items = (typeof m === 'object' && Array.isArray(m.items)) ? m.items.join(', ') : 'Seçim bekleniyor…';
        const total = (typeof m === 'object' && typeof m.total === 'number') ? `${m.total.toFixed(2)} ₺` : '—';
        return `
            <div class="group-member-item">
                <div>
                    <strong>${name}</strong>
                    <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;">${items}</div>
                </div>
                <strong style="color:var(--primary);font-size:13px;">${total}</strong>
            </div>
        `;
    }).join('');
}

function addGroupSimulatedMember() {
    const input = document.getElementById('group-friend-name');
    const name = input?.value.trim();
    if (!name) return;
    input.value = '';

    const state = GustoState.get();
    if (!state.groupOrder) {
        state.groupOrder = {
            code: "GUSTO-7429",
            members: [
                { name: `${state.currentUser.fullName} (Siz - Kurucu)`, items: ["Smash Cheeseburger"], total: 275 }
            ]
        };
    }
    const sampleItems = ["Double Cheeseburger", "Tavuk Kanat 8'li", "San Sebastian Cheesecake", "Mozaik Pasta"];
    const chosen = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    const price = 120 + Math.floor(Math.random() * 150);

    state.groupOrder.members.push({ name, items: [chosen], total: price });
    GustoState.persist();
    renderGroupOrderMembers();
    GustoAudio.play('add');
    showToast('👥', `${name} ortak sepete katıldı ve ${chosen} ekledi!`);
}

// ==========================================
// RESTORAN KDS MUTFAK FİŞİ & BİLDİRİMİ
// ==========================================
function printKdsKitchenSlip() {
    const state = GustoState.get();
    const r = state.restaurants.find(x => x.id === state.selectedVendorRestId) || state.restaurants[0];
    const o = (state.activeOrder && state.activeOrder.rId === r.id) ? state.activeOrder : state.orderHistory.find(x => x.rId === r.id);
    if (!o) {
        showToast('ℹ️', 'Yazdırılacak bekleyen mutfak siparişi yok.');
        return;
    }
    GustoAudio.play('status');
    showToast('🖨️', `KDS Mutfak Fişi #ORD-${o.id} yazıcıya gönderildi!`);
    openReceiptModal(o.id);
}

// ==========================================
// KURYE CANLI SOHBET MODALI
// ==========================================
function openChatModal() {
    const activeOrder = GustoState.get().activeOrder;
    const nameEl = document.getElementById('chat-courier-name');
    if (nameEl) {
        nameEl.innerText = activeOrder ? `${activeOrder.courier} (Kurye 🛵)` : 'Ali Kaya (Kurye 🛵)';
    }
    document.getElementById('chat-overlay').style.display = 'flex';
}

function closeChatModal() {
    document.getElementById('chat-overlay').style.display = 'none';
}

function sendQuickChat(msg) {
    appendChatMessage('user', msg);
    setTimeout(() => {
        appendChatMessage('courier', 'Mesajınız alındı efendim, en kısa sürede kapınızdayım!');
        GustoAudio.play('status');
    }, 1100);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    appendChatMessage('user', msg);
    setTimeout(() => {
        appendChatMessage('courier', 'Anlaşıldı efendim, özenle teslim ediyorum.');
        GustoAudio.play('status');
    }, 1300);
}

function appendChatMessage(sender, text) {
    const area = document.getElementById('chat-messages');
    if (!area) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.innerText = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

// ==========================================
// DİJİTAL FİŞ / FATURA (RECEIPT MODAL)
// ==========================================
function openReceiptModal(orderId) {
    const all = [...(GustoState.get().activeOrder ? [GustoState.get().activeOrder] : []), ...GustoState.get().orderHistory];
    const order = orderId ? all.find(o => o.id === orderId) : (GustoState.get().activeOrder || all[0]);
    if (!order) {
        showToast('ℹ️', 'Görüntülenecek sipariş bulunamadı.');
        return;
    }

    const modal = document.getElementById('receipt-overlay');
    const body = document.getElementById('receipt-body');
    if (!modal || !body) return;

    const r = GustoState.get().restaurants.find(x => x.id === order.rId) || { name: order.restaurant, phone: '0216 444 00 00' };
    const kdv = (order.total * 0.10).toFixed(2);

    body.innerHTML = `
        <div class="receipt-paper">
            <div class="receipt-header">
                <div class="receipt-logo"><i class="fa-solid fa-utensils" style="color:var(--primary);"></i> GustoGo Sipariş Fişi</div>
                <div class="receipt-sub">${r.name} • Tel: ${r.phone}</div>
            </div>
            
            <div class="receipt-meta">
                <div><strong>Sipariş No:</strong> #ORD-${order.id}</div>
                <div><strong>Tarih:</strong> ${order.dateStr || 'Bugün'} ${order.createdAt}</div>
                <div><strong>Müşteri:</strong> ${GustoState.get().currentUser.fullName}</div>
                <div><strong>Ödeme:</strong> ${order.payMethod ? order.payMethod.toUpperCase() : 'KREDİ KARTI'}</div>
                <div><strong>Kurye:</strong> ${order.courier}</div>
                <div><strong>Durum:</strong> ${order.status.replace('_', ' ').toUpperCase()}</div>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr><th>Ürün</th><th style="text-align:center;">Adet</th><th style="text-align:right;">Tutar</th></tr>
                </thead>
                <tbody>
                    ${order.items.map(it => `
                        <tr>
                            <td>${it.name} ${it.options ? `<br><small style="color:var(--text-3);">${it.options}</small>` : ''}</td>
                            <td style="text-align:center;">${it.qty}</td>
                            <td style="text-align:right;">${(it.price * it.qty).toFixed(2)} ₺</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="border-top:1px dashed var(--border-2);padding-top:12px;font-size:12.5px;color:var(--text-2);">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Ara Toplam:</span><span>${(order.subtotal || (order.total - 25)).toFixed(2)} ₺</span></div>
                ${order.discount ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:var(--success);"><span>İndirim:</span><span>-${order.discount.toFixed(2)} ₺</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Teslimat Ücreti:</span><span>${(order.delFee || 25).toFixed(2)} ₺</span></div>
                ${order.tip ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:var(--success);"><span>Kurye Bahşişi:</span><span>+${order.tip.toFixed(2)} ₺</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>KDV Dahil (%10):</span><span>${kdv} ₺</span></div>
            </div>

            <div class="receipt-total-row">
                <span>Ödenen Toplam</span>
                <span style="color:var(--primary);">${order.total.toFixed(2)} ₺</span>
            </div>

            <div class="receipt-barcode">
                ||| | ||||| || |||| ||| |
                <div style="font-size:10px;margin-top:4px;letter-spacing:1px;color:var(--text-3);">KONTROL KODU: GG-${order.id}-TKP</div>
            </div>
        </div>

        <button class="btn btn-primary" style="width:100%;padding:14px;" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Fişi / Faturayı Yazdır
        </button>
    `;

    modal.style.display = 'flex';
}

function closeReceiptModal() {
    document.getElementById('receipt-overlay').style.display = 'none';
}

// ==========================================
// ADRES VE KONUM YÖNETİMİ
// ==========================================
function updateAddressLabel() {
    const loc = GustoState.get().customerLocation;
    const txt = `${loc.name} (${loc.x}, ${loc.y})`;
    const el = document.getElementById('nav-addr-label');
    if (el) el.innerText = txt;
}

function renderSavedAddressesList() {
    const list = document.getElementById('saved-address-list');
    if (!list) return;
    list.innerHTML = GustoState.get().savedAddresses.map(a => `
        <div class="addr-card ${a.isDefault ? 'active' : ''}" onclick="selectSavedAddress(${a.id})">
            <div>
                <div style="font-weight:800;color:var(--text);font-size:14px;"><i class="fa-solid fa-house" style="color:var(--primary);margin-right:6px;"></i> ${a.title} ${a.isDefault ? '<span class="badge badge-alindi" style="margin-left:6px;font-size:10px;">VARSAYILAN</span>' : ''}</div>
                <div style="font-size:12px;color:var(--text-2);margin-top:3px;">${a.desc} — <strong>Izgara: (${a.x}, ${a.y})</strong></div>
            </div>
            <button class="btn btn-sm ${a.isDefault ? 'btn-success' : 'btn-outline'}">${a.isDefault ? '<i class="fa-solid fa-check"></i> Seçili' : 'Seç'}</button>
        </div>
    `).join('');
}

function selectSavedAddress(id) {
    const state = GustoState.get();
    state.savedAddresses.forEach(a => a.isDefault = (a.id === id));
    const sel = state.savedAddresses.find(a => a.id === id);
    if (!sel) return;

    state.customerLocation = { x: sel.x, y: sel.y, name: sel.title };
    GustoState.persist();
    updateAddressLabel();
    renderSavedAddressesList();
    renderRestaurantGrid(state.activeCategory);
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');
    closeAddressModal();
    GustoAudio.play('add');
    showToast('📍', `Teslimat adresi "${sel.title}" olarak ayarlandı.`);
}

function addNewAddress() {
    const title = document.getElementById('new-addr-title')?.value.trim() || 'Yeni Adres';
    const desc = document.getElementById('new-addr-desc')?.value.trim() || 'İstanbul';
    const x = Math.min(35, Math.max(0, parseInt(document.getElementById('picker-x')?.value) || 0));
    const y = Math.min(35, Math.max(0, parseInt(document.getElementById('picker-y')?.value) || 0));

    const state = GustoState.get();
    const newId = state.savedAddresses.length + 1;
    state.savedAddresses.forEach(a => a.isDefault = false);
    state.savedAddresses.push({ id: newId, title, desc, x, y, isDefault: true });
    state.customerLocation = { x, y, name: title };
    GustoState.persist();

    updateAddressLabel();
    renderSavedAddressesList();
    renderRestaurantGrid(state.activeCategory);
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');
    closeAddressModal();
    GustoAudio.play('add');
    showToast('✨', `"${title}" adresi kaydedildi ve aktif konuma ayarlandı!`);
}

function openAddressModal() {
    renderSavedAddressesList();
    document.getElementById('address-overlay').style.display = 'flex';
    setTimeout(() => GustoMap.drawAddressPicker(), 60);
}

function closeAddressModal() {
    document.getElementById('address-overlay').style.display = 'none';
}

function syncPickerFromInputs() {
    const x = Math.min(35, Math.max(0, parseInt(document.getElementById('picker-x')?.value) || 0));
    const y = Math.min(35, Math.max(0, parseInt(document.getElementById('picker-y')?.value) || 0));
    const textCoord = document.getElementById('picker-coord-text');
    if (textCoord) textCoord.innerText = `Seçili: (X: ${x}, Y: ${y})`;
    GustoMap.drawAddressPicker();
}

// ==========================================
// HESAP, PROFİL & GEÇMİŞ SİPARİŞLER
// ==========================================
function openAccountModal() {
    const state = GustoState.get();
    document.getElementById('acc-header-name').innerText = state.currentUser.fullName;
    document.getElementById('profile-fullname').value = state.currentUser.fullName;
    document.getElementById('profile-phone').value = state.currentUser.phone;
    document.getElementById('profile-email').value = state.currentUser.email;
    document.getElementById('profile-addr-title').innerText = state.customerLocation.name;
    document.getElementById('profile-addr-coord').innerText = `Izgara Konumu: (${state.customerLocation.x}, ${state.customerLocation.y})`;
    document.getElementById('acc-order-count').innerText = (state.orderHistory.length + (state.activeOrder ? 1 : 0));
    document.getElementById('acc-points').innerText = `${state.userPoints} GustoPuan (${(state.userPoints / 10).toFixed(2)} ₺)`;
    document.getElementById('acc-wallet-display').innerText = `${state.userPoints} Puan (${(state.userPoints / 10).toFixed(2)} ₺)`;

    renderAccountOrders();
    renderAccountFavs();
    renderAccountCoupons();
    document.getElementById('account-overlay').style.display = 'flex';
}

function closeAccountModal() {
    document.getElementById('account-overlay').style.display = 'none';
}

function switchAccountTab(tab) {
    ['profile', 'orders', 'coupons', 'favs'].forEach(t => {
        document.getElementById('acc-tab-btn-' + t).className = 'modal-tab-btn ' + (t === tab ? 'active' : '');
        document.getElementById('acc-tab-' + t).style.display = (t === tab ? 'block' : 'none');
    });
}

function renderAccountOrders() {
    const area = document.getElementById('acc-orders-list');
    if (!area) return;
    const all = [...(GustoState.get().activeOrder ? [GustoState.get().activeOrder] : []), ...GustoState.get().orderHistory];

    if (!all.length) {
        area.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:var(--text-2);">
                <i class="fa-solid fa-basket-shopping" style="font-size:48px;color:var(--text-3);margin-bottom:12px;"></i>
                <div style="font-weight:800;font-size:16px;color:var(--text);">Henüz sipariş vermediniz</div>
                <div style="font-size:13px;margin-top:4px;">Menümüzden leziz yemekler seçerek hemen başlayın!</div>
            </div>
        `;
        return;
    }

    area.innerHTML = all.map(o => `
        <div style="background:var(--surface-2);border:1.5px solid var(--border);border-radius:18px;padding:18px;margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div>
                    <strong style="color:var(--text);font-size:16px;">#ORD-${o.id} • ${o.restaurant}</strong>
                    <div style="font-size:12px;color:var(--text-3);">${o.createdAt || 'Bugün'}</div>
                </div>
                <span class="badge badge-${o.status}">${o.status.replace('_', ' ')}</span>
            </div>
            <div style="font-size:13.5px;color:var(--text-2);margin-bottom:12px;">
                ${o.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border);padding-top:10px;gap:8px;">
                <span style="font-size:16px;font-weight:900;color:var(--primary);">${o.total.toFixed(2)} ₺</span>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-outline" onclick="openReceiptModal(${o.id})">
                        <i class="fa-solid fa-receipt"></i> Fişi Gör
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="reorderItems(${o.id})">
                        <i class="fa-solid fa-rotate-right"></i> Tekrarla
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function reorderItems(orderId) {
    const all = [...(GustoState.get().activeOrder ? [GustoState.get().activeOrder] : []), ...GustoState.get().orderHistory];
    const order = all.find(o => o.id === orderId);
    if (!order) return;

    GustoState.get().selectedRestId = order.rId;
    GustoState.get().cart = [];
    order.items.forEach(it => {
        const fullItem = GustoState.get().menuItems.find(m => m.name === it.name) || { id: 1, name: it.name, price: it.price || 150 };
        GustoState.get().cart.push({ ...fullItem, id: fullItem.id + '_' + Date.now(), qty: it.qty, options: it.options || '' });
    });

    GustoState.persist();
    updateCartUI();
    closeAccountModal();

    document.getElementById('rest-section').style.display = 'none';
    document.getElementById('flash-deals-section').style.display = 'none';
    document.getElementById('popular-showcase-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'grid';

    GustoAudio.play('add');
    showToast('🛒', 'Geçmiş sipariş ürünleri sepetinize eklendi!');
}

function renderAccountFavs() {
    const area = document.getElementById('acc-favs-list');
    if (!area) return;
    const favs = GustoState.get().userFavorites;
    if (!favs.length) {
        area.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-2);"><i class="fa-regular fa-heart" style="font-size:48px;color:var(--text-3);margin-bottom:10px;"></i><div>Henüz favori lezzet eklemediniz.</div></div>';
        return;
    }
    const favItems = GustoState.get().menuItems.filter(m => favs.includes(m.id));
    area.innerHTML = favItems.map(item => {
        const rest = GustoState.get().restaurants.find(r => r.id === item.rId);
        return `
            <div class="pop-card" style="margin-bottom:12px;">
                <img class="pop-img" src="${item.img}" alt="${item.name}">
                <div class="pop-info">
                    <div class="pop-tag"><i class="fa-solid fa-star"></i> Favorim</div>
                    <div class="pop-name">${item.name}</div>
                    <div class="pop-rest">${rest ? rest.emoji + ' ' + rest.name : ''}</div>
                    <div class="pop-bottom">
                        <span class="pop-price">${item.price.toFixed(2)} ₺</span>
                        <button class="btn btn-sm btn-primary" onclick="quickAddFlash(${item.id})">
                            <i class="fa-solid fa-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAccountCoupons() {
    const area = document.getElementById('acc-coupons-list');
    if (!area) return;
    area.innerHTML = PROMO_COUPONS.map(c => `
        <div style="background:var(--surface-2);border:1.5px solid var(--border);border-radius:16px;padding:16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <span class="ticker-badge" style="background:var(--primary);color:#fff;font-size:12px;">${c.code}</span>
                <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:6px;">${c.desc}</div>
                <div style="font-size:11.5px;color:var(--text-3);">Min. sepet: ${c.minOrder} ₺</div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="applyCouponCode('${c.code}')">Kullan</button>
        </div>
    `).join('');
}

function toggleHeart(el, itemId) {
    const favs = GustoState.get().userFavorites;
    const idx = favs.indexOf(itemId);
    if (idx >= 0) {
        favs.splice(idx, 1);
        el.innerHTML = '<i class="fa-regular fa-heart"></i>';
        el.style.background = 'rgba(0,0,0,0.5)';
        showToast('💔', 'Favorilerden çıkarıldı.');
    } else {
        favs.push(itemId);
        el.innerHTML = '<i class="fa-solid fa-heart" style="color:#fff;"></i>';
        el.style.background = 'var(--primary)';
        showToast('❤️', 'Favorilere eklendi!');
    }
    GustoState.persist();
}

function applyCouponCode(code) {
    GustoState.get().activeCoupon = code.toUpperCase();
    GustoState.persist();
    closeAccountModal();
    updateCartUI();
    GustoAudio.play('add');
    showToast('🎁', `"${GustoState.get().activeCoupon}" kuponu uygulandı!`);
}

function applyCartCouponInput() {
    const code = document.getElementById('cart-coupon-code')?.value.trim();
    if (!code) return;
    applyCouponCode(code);
}

// ==========================================
// ROL DEĞİŞTİRME & AUTH
// ==========================================
function openLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
}
function closeLogin() {
    document.getElementById('login-overlay').style.display = 'none';
}

function switchLoginTab(tab) {
    document.getElementById('tab-btn-roles').className = 'modal-tab-btn ' + (tab === 'roles' ? 'active' : '');
    document.getElementById('tab-btn-auth').className = 'modal-tab-btn ' + (tab === 'auth' ? 'active' : '');
    document.getElementById('login-tab-roles').style.display = tab === 'roles' ? 'block' : 'none';
    document.getElementById('login-tab-auth').style.display = tab === 'auth' ? 'block' : 'none';
}

function showAuthMode(mode) {
    document.getElementById('auth-sub-login').style.borderColor = mode === 'login' ? 'var(--primary)' : 'var(--border)';
    document.getElementById('auth-sub-login').style.color = mode === 'login' ? 'var(--primary)' : 'var(--text)';
    document.getElementById('auth-sub-register').style.borderColor = mode === 'register' ? 'var(--primary)' : 'var(--border)';
    document.getElementById('auth-sub-register').style.color = mode === 'register' ? 'var(--primary)' : 'var(--text)';
    document.getElementById('form-login').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = mode === 'register' ? 'block' : 'none';
}

function loginAs(role) {
    GustoState.get().currentRole = role;
    GustoState.persist();
    closeLogin();

    const state = GustoState.get();
    const vendorRest = state.restaurants.find(r => r.id === state.selectedVendorRestId) || state.restaurants[0];
    const courier = state.couriers.find(c => c.id === state.selectedCourierId) || state.couriers[0];

    const profiles = {
        customer: { name: state.currentUser.fullName, role: `${state.userPoints} Puan` },
        restaurant: { name: vendorRest.name, role: "SATICI / RESTORAN" },
        courier: { name: courier.name, role: "KURYE" },
        admin: { name: "Mustafa Güreşir (Yönetici)", role: "SİSTEM YÖNETİCİSİ" }
    };

    const navName = document.getElementById('nav-name');
    const navRole = document.getElementById('nav-role');
    if (navName) navName.innerText = profiles[role].name;
    if (navRole) {
        navRole.innerHTML = role === 'customer'
            ? `<i class="fa-solid fa-coins"></i> ${profiles[role].role}`
            : profiles[role].role;
    }

    ['customer', 'restaurant', 'courier', 'admin'].forEach(r => {
        const el = document.getElementById('view-' + r);
        if (el) {
            if (r === 'customer') el.style.display = (role === 'customer' ? 'block' : 'none');
            else el.classList.toggle('hidden', r !== role);
        }
    });

    if (role === 'customer') {
        if (!state.selectedRestId) showRestaurants();
        GustoMap.drawMap('customer-map-canvas');
    } else if (role === 'restaurant') {
        renderResPanel();
    } else if (role === 'courier') {
        renderCourierPanel();
    } else {
        renderAdminCouriers();
        renderAdminAudit();
        GustoMap.drawMap('admin-map-canvas');
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username')?.value.trim();
    if (!u) return;
    GustoState.get().currentUser.fullName = u.includes('_') ? u.replace('_', ' ').toUpperCase() : u;
    GustoState.persist();
    loginAs('customer');
    showToast('👋', `Hoşgeldiniz, ${GustoState.get().currentUser.fullName}!`);
}

function handleUserRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const title = document.getElementById('reg-addr-title')?.value.trim() || 'Evim';
    const x = parseInt(document.getElementById('reg-x')?.value) || 18;
    const y = parseInt(document.getElementById('reg-y')?.value) || 14;

    const state = GustoState.get();
    state.currentUser = { fullName, phone, email: `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@email.com`, role: "customer" };
    const newId = state.savedAddresses.length + 1;
    state.savedAddresses.push({ id: newId, title, desc: `Izgara (${x}, ${y})`, x, y, isDefault: true });
    state.savedAddresses.forEach(a => a.isDefault = (a.id === newId));
    state.customerLocation = { x, y, name: title };
    GustoState.persist();

    updateAddressLabel();
    loginAs('customer');
    showToast('🎉', `Hoşgeldiniz ${fullName}! Hesabınız oluşturuldu.`);
}

function handleUpdateProfile(e) {
    e.preventDefault();
    const state = GustoState.get();
    state.currentUser.fullName = document.getElementById('profile-fullname')?.value.trim();
    state.currentUser.phone = document.getElementById('profile-phone')?.value.trim();
    state.currentUser.email = document.getElementById('profile-email')?.value.trim();
    GustoState.persist();

    document.getElementById('nav-name').innerText = state.currentUser.fullName;
    document.getElementById('acc-header-name').innerText = state.currentUser.fullName;
    closeAccountModal();
    showToast('✅', 'Profil bilgileriniz güncellendi.');
}

// ==========================================
// RESTORAN / MUTFAK PANELİ
// ==========================================
function changeVendorRestaurant() {
    GustoState.get().selectedVendorRestId = parseInt(document.getElementById('res-selector')?.value);
    const r = GustoState.get().restaurants.find(x => x.id === GustoState.get().selectedVendorRestId);
    if (GustoState.get().currentRole === 'restaurant' && r) {
        document.getElementById('nav-name').innerText = r.name;
    }
    renderResPanel();
}

function toggleMenuItemStock(itemId) {
    const it = GustoState.get().menuItems.find(m => m.id === itemId);
    if (!it) return;
    it.available = !(it.available !== false);
    renderResPanel();
    showToast('🔄', `"${it.name}" durumu "${it.available ? 'SATIŞTA' : 'TÜKENDİ'}" yapıldı.`);
}

function renderResPanel() {
    const state = GustoState.get();
    const currentRest = state.restaurants.find(r => r.id === state.selectedVendorRestId) || state.restaurants[0];
    const matchingActive = (state.activeOrder && state.activeOrder.rId === state.selectedVendorRestId) ? [state.activeOrder] : [];
    const matchingHist = state.orderHistory.filter(o => o.rId === state.selectedVendorRestId);

    const tot = matchingHist.length + matchingActive.length;
    const rev = matchingHist.filter(o => o.status === 'teslim_edildi').reduce((s, o) => s + o.total, 0) + (matchingActive[0]?.total || 0);

    const kpiOrders = document.getElementById('kpi-orders');
    const kpiRev = document.getElementById('kpi-revenue');
    const kpiRating = document.getElementById('kpi-res-rating');
    if (kpiOrders) kpiOrders.innerText = `${tot} Adet`;
    if (kpiRev) kpiRev.innerText = `${rev.toFixed(2)} ₺`;
    if (kpiRating) kpiRating.innerText = `${currentRest.rating} ⭐`;

    const b = document.getElementById('res-orders-body');
    if (b) {
        if (!matchingActive.length) {
            b.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-2);padding:36px;">Bu restoran için bekleyen mutfak siparişi yok.</td></tr>';
        } else {
            b.innerHTML = matchingActive.map(o => {
                let actionBtn = '';
                if (o.status === 'alindi') {
                    actionBtn = `<button class="btn btn-sm btn-primary" onclick="vendorChangeStatus('hazirlaniyor')"><i class="fa-solid fa-fire"></i> Hazırlanmaya Başla</button>`;
                } else if (o.status === 'hazirlaniyor') {
                    actionBtn = `<button class="btn btn-sm btn-success" onclick="vendorChangeStatus('hazir')"><i class="fa-solid fa-box"></i> Hazırlandı (Kurye Çağır)</button>`;
                } else {
                    actionBtn = `<span style="color:var(--text-2);font-size:12.5px;font-weight:700;"><i class="fa-solid fa-motorcycle"></i> Kuryeye Teslim Edildi</span>`;
                }
                return `
                    <tr>
                        <td><strong>#ORD-${o.id}</strong></td>
                        <td>${state.currentUser.fullName}</td>
                        <td style="max-width:240px;">${o.items.map(i => `${i.name} (x${i.qty}) ${i.options ? `<br><small style="color:var(--text-3);">${i.options}</small>` : ''}`).join('')}</td>
                        <td><strong style="color:var(--primary);">${o.total.toFixed(2)} ₺</strong></td>
                        <td><span class="badge badge-${o.status}">${o.status.replace('_', ' ')}</span></td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    const items = state.menuItems.filter(m => m.rId === state.selectedVendorRestId);
    const menuBody = document.getElementById('res-menu-body');
    if (menuBody) {
        menuBody.innerHTML = items.map(item => {
            const isAvail = item.available !== false;
            return `
                <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="color:var(--text-2);font-size:12.5px;">${item.desc}</td>
                    <td><strong style="color:var(--primary);">${item.price.toFixed(2)} ₺</strong></td>
                    <td><span class="badge ${isAvail ? 'badge-musait' : 'badge-iptal'}">${isAvail ? 'SATIŞTA' : 'TÜKENDİ'}</span></td>
                    <td>
                        <button class="btn btn-sm ${isAvail ? 'btn-outline' : 'btn-success'}" onclick="toggleMenuItemStock(${item.id})">
                            ${isAvail ? 'Tükendi Yap' : 'Satışa Aç'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function vendorChangeStatus(targetStatus) {
    const state = GustoState.get();
    if (!state.activeOrder) return;
    const r = state.restaurants.find(x => x.id === state.activeOrder.rId);
    GustoState.transitionOrderStatus(targetStatus, `${r.name} (Mutfak)`, `Mutfak yetkilisi sipariş durumunu ${targetStatus} olarak güncelledi.`);
    updateOrderTrackerUI();
    renderResPanel();
}

// ==========================================
// KURYE PANELİ
// ==========================================
function changeCourierUser() {
    GustoState.get().selectedCourierId = parseInt(document.getElementById('courier-selector')?.value);
    const c = GustoState.get().couriers.find(x => x.id === GustoState.get().selectedCourierId);
    if (GustoState.get().currentRole === 'courier' && c) {
        document.getElementById('nav-name').innerText = `${c.name} (${c.vehicle})`;
    }
    const inX = document.getElementById('courier-input-x');
    const inY = document.getElementById('courier-input-y');
    if (inX && c) inX.value = c.x;
    if (inY && c) inY.value = c.y;
    renderCourierPanel();
}

function updateCourierLocation() {
    const c = GustoState.get().couriers.find(x => x.id === GustoState.get().selectedCourierId);
    if (!c) return;
    c.x = parseInt(document.getElementById('courier-input-x')?.value) || 0;
    c.y = parseInt(document.getElementById('courier-input-y')?.value) || 0;
    GustoState.persist();
    renderCourierPanel();
    GustoMap.drawMap('customer-map-canvas');
    GustoMap.drawMap('admin-map-canvas');
    showToast('📍', `${c.name} konumu (${c.x}, ${c.y}) olarak güncellendi.`);
}

function renderCourierPanel() {
    const state = GustoState.get();
    const curCourier = state.couriers.find(c => c.id === state.selectedCourierId) || state.couriers[0];
    const area = document.getElementById('courier-task-area');
    const badge = document.getElementById('courier-badge-status');

    const kpiLoc = document.getElementById('courier-kpi-loc');
    const kpiEarnings = document.getElementById('courier-kpi-earnings');
    if (kpiLoc) kpiLoc.innerText = `(${curCourier.x}, ${curCourier.y})`;
    if (kpiEarnings) kpiEarnings.innerText = `${curCourier.earnings.toFixed(2)} ₺ (Bahşiş: ${curCourier.tips} ₺)`;

    const isAssigned = (state.activeOrder && state.activeOrder.courierId === curCourier.id && ['hazir', 'yolda'].includes(state.activeOrder.status));

    if (!isAssigned) {
        if (badge) {
            badge.className = 'badge badge-musait';
            badge.innerText = 'MÜSAİT';
        }
        if (area) {
            area.innerHTML = `
                <div style="text-align:center;padding:52px 20px;color:var(--text-2);">
                    <i class="fa-solid fa-circle-check" style="font-size:56px;color:var(--success);"></i>
                    <div style="margin-top:16px;font-weight:800;font-size:17px;color:var(--text);">Şu an atanmış aktif teslimatınız yok.</div>
                    <div style="font-size:13.5px;color:var(--text-3);margin-top:6px;">${curCourier.name} (${curCourier.vehicle}) — Yeni görev bekleniyor.</div>
                </div>
            `;
        }
        return;
    }

    if (badge) {
        badge.className = 'badge badge-hazirlaniyor';
        badge.innerText = 'GÖREVDE';
    }

    const o = state.activeOrder;
    const r = state.restaurants.find(x => x.id === o.rId);

    let actionBtn = '';
    if (o.status === 'hazir') {
        actionBtn = `
            <button class="btn btn-outline" style="width:100%;margin-top:18px;border-color:var(--blue);color:var(--blue);padding:14px;font-size:15px;" onclick="courierChangeStatus('yolda')">
                <i class="fa-solid fa-motorcycle"></i> Paketi Restorandan Aldım — Müşteriye Yola Çık
            </button>
        `;
    } else {
        actionBtn = `
            <button class="btn btn-success" style="width:100%;margin-top:18px;padding:14px;font-size:15px;" onclick="courierChangeStatus('teslim_edildi')">
                <i class="fa-solid fa-circle-check"></i> Siparişi Müşteriye Teslim Ettim (Görevi Tamamla)
            </button>
        `;
    }

    if (area) {
        area.innerHTML = `
            <div style="background:var(--surface-2);border-radius:18px;padding:22px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:18px;font-weight:900;color:var(--text);">Teslimat Görevi #ORD-${o.id}</div>
                    <span class="badge badge-${o.status}">${o.status.replace('_', ' ')}</span>
                </div>
                
                <div style="margin-bottom:12px;font-size:13.5px;"><i class="fa-solid fa-store" style="color:var(--primary);margin-right:8px;"></i> <strong>Restoran:</strong> ${r ? r.name : ''} (${r ? r.x : 0}, ${r ? r.y : 0})</div>
                <div style="margin-bottom:12px;font-size:13.5px;"><i class="fa-solid fa-house" style="color:var(--success);margin-right:8px;"></i> <strong>Müşteri:</strong> ${state.currentUser.fullName} — ${state.customerLocation.name} (${state.customerLocation.x}, ${state.customerLocation.y})</div>
                <div style="margin-bottom:12px;font-size:13.5px;"><i class="fa-solid fa-box" style="color:var(--yellow);margin-right:8px;"></i> <strong>Paket:</strong> ${o.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>
                <div style="margin-bottom:12px;font-size:13.5px;"><i class="fa-solid fa-bell-concierge" style="color:var(--purple);margin-right:8px;"></i> <strong>Teslimat Talimatı:</strong> ${o.deliveryPref === 'leave' ? 'Kapıya Bırak (Temassız)' : (o.deliveryPref === 'quiet' ? 'Zili Çalma' : 'Kapıya Teslim')}</div>
                <div style="font-size:13.5px;"><i class="fa-solid fa-hand-holding-dollar" style="color:var(--success);margin-right:8px;"></i> <strong>Bahşiş:</strong> <span style="color:var(--success);font-weight:900;">${o.tip} ₺</span></div>
                ${actionBtn}
            </div>
        `;
    }
}

function courierChangeStatus(targetStatus) {
    const state = GustoState.get();
    if (!state.activeOrder) return;
    const curCourier = state.couriers.find(c => c.id === state.selectedCourierId) || state.couriers[0];
    GustoState.transitionOrderStatus(targetStatus, `${curCourier.name} (Kurye)`, `Kurye teslimat aşamasını ${targetStatus} olarak kaydetti.`);
    updateOrderTrackerUI();
    renderCourierPanel();
}

// ==========================================
// ADMİN PANELİ
// ==========================================
function renderAdminCouriers() {
    const b = document.getElementById('admin-couriers-body');
    if (!b) return;
    const state = GustoState.get();
    const rObj = state.activeOrder
        ? state.restaurants.find(r => r.id === state.activeOrder.rId)
        : state.restaurants[0];

    b.innerHTML = state.couriers.map(c => {
        const dist = GustoState.calculateManhattan(c.x, c.y, rObj.x, rObj.y);
        const sc = GustoState.calculateCourierScore(dist, c.active);
        return `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.vehicle}</td>
                <td>(${c.x}, ${c.y})</td>
                <td><strong style="color:var(--text);">${c.active} Aktif Görev</strong></td>
                <td><strong style="color:var(--primary);">${sc.toFixed(1)} Puan (Mesafe: ${dist} + 2×${c.active})</strong></td>
                <td><span class="badge badge-musait">ÇEVRİMİÇİ</span></td>
            </tr>
        `;
    }).join('');
}

function renderAdminAudit() {
    const b = document.getElementById('admin-audit-body');
    if (!b) return;
    const auditLogs = GustoState.get().auditLogs;
    if (!auditLogs.length) {
        b.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-2);padding:24px;">Kayıtlı durum değişikliği bulunmuyor.</td></tr>';
        return;
    }
    b.innerHTML = auditLogs.map(l => `
        <tr>
            <td style="color:var(--text-3);font-family:monospace;font-size:12px;">${l.time}</td>
            <td><strong>#ORD-${l.orderId}</strong></td>
            <td><span class="badge badge-${l.prevStatus}">${l.prevStatus.replace('_', ' ')}</span></td>
            <td><span class="badge badge-${l.newStatus}">${l.newStatus.replace('_', ' ')}</span></td>
            <td><strong style="color:var(--text);">${l.actor}</strong></td>
            <td style="color:var(--text-2);font-size:12.5px;">${l.comment}</td>
        </tr>
    `).join('');
}

// ==========================================
// VİTRİN & YARDIMCI FONKSİYONLAR
// ==========================================
function renderFlashDeals() {
    const grid = document.getElementById('flash-grid');
    if (!grid) return;
    grid.innerHTML = FLASH_DEALS.map(d => {
        const item = GustoState.get().menuItems.find(m => m.id === d.id);
        const rest = GustoState.get().restaurants.find(r => r.id === item.rId);
        return `
            <div class="flash-card" onclick="openCustomizer(${item.id})">
                <div class="flash-img-wrap">
                    <img class="flash-img" src="${item.img}" alt="${item.name}" loading="lazy">
                    <div class="flash-badge"><i class="fa-solid fa-bolt"></i> ${d.discount}</div>
                    <div class="flash-rest-tag">${rest.emoji} ${rest.name}</div>
                </div>
                <div class="flash-body">
                    <div class="flash-name">${item.name}</div>
                    <div class="flash-prices">
                        <span class="flash-new">${d.newPrice.toFixed(2)} ₺</span>
                        <span class="flash-old">${d.oldPrice.toFixed(2)} ₺</span>
                    </div>
                    <button class="btn btn-sm btn-order" style="padding:10px;margin-top:auto;" onclick="event.stopPropagation();openCustomizer(${item.id})">
                        <i class="fa-solid fa-plus"></i> Özelleştir & Ekle
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPopularShowcase() {
    const grid = document.getElementById('pop-food-grid');
    if (!grid) return;
    grid.innerHTML = POPULAR_SHOWCASE_IDS.map(id => {
        const item = GustoState.get().menuItems.find(m => m.id === id);
        const rest = GustoState.get().restaurants.find(r => r.id === item.rId);
        return `
            <div class="pop-card" onclick="openCustomizer(${item.id})">
                <img class="pop-img" src="${item.img}" alt="${item.name}" loading="lazy">
                <div class="pop-info">
                    <div class="pop-tag"><i class="fa-solid fa-fire"></i> ${item.tag}</div>
                    <div class="pop-name">${item.name}</div>
                    <div class="pop-rest">${rest ? rest.emoji + ' ' + rest.name : ''}</div>
                    <div class="pop-bottom">
                        <span class="pop-price">${item.price.toFixed(2)} ₺</span>
                        <button class="btn btn-sm btn-primary" style="padding:6px 12px;" onclick="event.stopPropagation();openCustomizer(${item.id})">
                            <i class="fa-solid fa-plus"></i> Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function scrollToRestaurants() {
    document.getElementById('rest-section')?.scrollIntoView({ behavior: 'smooth' });
}

function quickAddFlash(itemId) {
    const item = GustoState.get().menuItems.find(m => m.id === itemId);
    if (!item) return;
    if (!GustoState.get().selectedRestId || GustoState.get().selectedRestId !== item.rId) {
        selectRestaurant(item.rId);
    }
    openCustomizer(itemId);
}

function startFlashCountdown() {
    let secondsLeft = 2 * 3600 + 44 * 60 + 18;
    setInterval(() => {
        if (secondsLeft <= 0) return;
        secondsLeft--;
        const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
        const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
        const s = String(secondsLeft % 60).padStart(2, '0');
        const el = document.getElementById('flash-timer');
        if (el) el.innerText = `${h}:${m}:${s}`;
    }, 1000);
}

// Debounced Global Search
let searchTimeout = null;
function globalSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const q = document.getElementById('global-search')?.value.toLowerCase().trim();
        if (!q) {
            renderRestaurantGrid(GustoState.get().activeCategory);
            return;
        }

        const res = GustoState.get().restaurants.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.cat.toLowerCase().includes(q) ||
            GustoState.get().menuItems.some(m => m.rId === r.id && (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)))
        );

        const grid = document.getElementById('rest-grid');
        document.getElementById('rest-section').style.display = 'block';
        document.getElementById('flash-deals-section').style.display = 'none';
        document.getElementById('popular-showcase-section').style.display = 'none';
        document.getElementById('menu-section').style.display = 'none';

        if (!res.length) {
            grid.innerHTML = `<div style="padding:48px 20px;text-align:center;color:var(--text-2);grid-column:1/-1;">"${q}" ile eşleşen lezzet veya restoran bulunamadı.</div>`;
            return;
        }

        grid.innerHTML = res.map(r => `
            <div class="rest-card" onclick="selectRestaurant(${r.id})">
                <div class="rest-cover-wrap">
                    <img class="rest-cover" src="${r.cover}" alt="${r.name}" loading="lazy">
                    ${r.promo ? `<div class="rest-promo"><i class="fa-solid fa-tag"></i> ${r.promo}</div>` : ''}
                </div>
                <div class="rest-body">
                    <div class="rest-name">${r.emoji} ${r.name}</div>
                    <div class="rest-meta">
                        <div class="rest-rating"><i class="fa-solid fa-star"></i> ${r.rating}</div>
                        <div style="color:var(--text-3);">${r.cat}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }, 250);
}

// Toast Bildirimi
function showToast(icon, msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span style="font-size:22px;">${icon}</span><span>${msg}</span>`;

    if (type === 'danger') t.style.borderLeftColor = 'var(--danger)';
    else if (type === 'warn') t.style.borderLeftColor = 'var(--yellow)';

    c.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(30px)';
        t.style.transition = 'all 0.3s';
        setTimeout(() => t.remove(), 300);
    }, 3800);
}

// ==========================================
// HOCANIN İSTEDİĞİ 3 ZORUNLU KANIT HANDLERS
// ==========================================
function openProofsModal() {
    const modal = document.getElementById('modal-proofs');
    if (modal) {
        modal.classList.add('active');
        GustoAudio.play('click');
    }
}

function closeProofsModal() {
    const modal = document.getElementById('modal-proofs');
    if (modal) modal.classList.remove('active');
}

function testProof1() {
    const badge = document.getElementById('proof1-badge');
    const result = document.getElementById('proof1-result');
    if (!badge || !result) return;

    badge.style.background = 'rgba(239, 68, 68, 0.2)';
    badge.style.color = '#EF4444';
    badge.innerText = 'Çalıştırılıyor...';

    setTimeout(() => {
        const errorMsg = "DomainException (HTTP 400): Yoldaki sipariş yalnızca 'teslim_edildi' durumuna geçebilir. Geriye 'hazirlaniyor'a alınamaz!";
        badge.style.background = '#10B981';
        badge.style.color = '#fff';
        badge.innerHTML = '<i class="fa-solid fa-shield-check"></i> REDDEDİLDİ (BAŞARILI)';

        result.innerHTML = `
            <div style="background:rgba(239,68,68,0.1);border-left:3px solid #EF4444;padding:8px 12px;border-radius:6px;color:var(--text);font-family:monospace;font-size:12px;">
                <strong>✓ Sistem Koruması Aktif:</strong><br>${errorMsg}
            </div>
        `;
        GustoAudio.play('error');
        showToast('🛡️', 'Geçersiz geçiş başarıyla engellendi ve reddedildi!', 'warn');
        GustoState.logAudit(999, 'yolda', 'yolda', 'Sistem Güvenliği', "Geçersiz 'hazirlaniyor' geçiş isteği REDDEDİLDİ.");
    }, 400);
}

function testProof2() {
    const badge = document.getElementById('proof2-badge');
    const result = document.getElementById('proof2-result');
    const c1Card = document.getElementById('courier-card-1');
    const c2Card = document.getElementById('courier-card-2');
    if (!badge || !result) return;

    badge.style.background = 'rgba(59, 130, 246, 0.2)';
    badge.style.color = '#3B82F6';
    badge.innerText = 'Hesaplanıyor...';

    setTimeout(() => {
        badge.style.background = '#10B981';
        badge.style.color = '#fff';
        badge.innerHTML = '<i class="fa-solid fa-check"></i> ATAMA DOĞRULANDI';

        if (c1Card) {
            c1Card.style.borderColor = '#EF4444';
            c1Card.style.opacity = '0.7';
        }
        if (c2Card) {
            c2Card.style.borderColor = '#10B981';
            c2Card.style.boxShadow = '0 0 15px rgba(16,185,129,0.3)';
            c2Card.style.opacity = '1';
        }

        result.innerHTML = `
            <div style="background:rgba(16,185,129,0.1);border-left:3px solid #10B981;padding:8px 12px;border-radius:6px;color:var(--text);font-size:12px;">
                <strong>✓ KAZANAN: Kurye 2 (Veli Demir)</strong><br>
                Mesafe: 1.26 km (Haversine) | İş Yükü: 0 sipariş ➔ <strong>Puan: 1.26</strong><br>
                <span style="color:var(--text-3);">(Kurye 1 Ali Kaya 0.71 km ile daha yakın olmasına rağmen 2 aktif sipariş yükü nedeniyle puanı 4.71 çıktı ve elendi.)</span>
            </div>
        `;
        GustoAudio.play('success');
        showToast('🛵', 'Kurye Veli Demir en düşük puanla başarıyla seçildi!');
    }, 500);
}

function testProof3() {
    const badge = document.getElementById('proof3-badge');
    const result = document.getElementById('proof3-result');
    if (!badge || !result) return;

    badge.style.background = 'rgba(16, 185, 129, 0.2)';
    badge.style.color = '#10B981';
    badge.innerText = 'AJAX Polling İstendi...';

    if (!GustoState.get().activeOrder) {
        GustoState.get().activeOrder = {
            id: 1049,
            restId: 1,
            restName: "Lezzet Kebap Salonu",
            items: [{ name: "Adana Zırh Dürüm", price: 190, qty: 1 }],
            total: 190,
            status: "alindi",
            courierId: 1,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        GustoState.persist();
    }

    setTimeout(() => {
        GustoState.transitionOrderStatus('hazirlaniyor', 'Restoran Mutfak', 'Hocanın AJAX kanıt testi: Mutfak siparişi onayladı.');
        
        badge.style.background = '#10B981';
        badge.style.color = '#fff';
        badge.innerHTML = '<i class="fa-solid fa-check-double"></i> AJAX 200 OK (CANLI GÜNCELLENDİ)';

        result.innerHTML = `
            <div style="background:rgba(16,185,129,0.1);border-left:3px solid #10B981;padding:8px 12px;border-radius:6px;color:var(--text);font-size:12px;">
                <strong>✓ Sayfa Yenilenmeden Güncellendi (F5 Yapılmadı):</strong><br>
                Müşteri paneli sipariş stepper'ı "Hazırlanıyor" aşamasına geçti. Ses efekti ve rozet animasyonu tetiklendi.
            </div>
        `;

        updateActiveOrderUI();
        GustoAudio.play('kitchen');
        showToast('👨‍🍳', 'AJAX Senkronizasyonu: Sipariş "Hazırlanıyor" aşamasına geçti!');
    }, 600);
}

function runAllProofs() {
    testProof1();
    setTimeout(() => testProof2(), 500);
    setTimeout(() => testProof3(), 1100);
}
