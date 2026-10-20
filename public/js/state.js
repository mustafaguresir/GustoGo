/**
 * GustoGo — Çekirdek Durum Yönetimi (State Machine, Manhattan Algoritması, LocalStorage)
 */

const GustoState = (function () {
    const STORAGE_KEY = 'gustogo_state_v2';

    // İlk Durum
    let state = {
        currentRole: 'customer',
        currentUser: {
            fullName: "Ahmet Yılmaz",
            phone: "0555 111 22 33",
            email: "ahmet.yilmaz@email.com",
            role: "customer"
        },
        customerLocation: { x: 18, y: 14, name: "Evim (Moda)" },
        savedAddresses: [...INITIAL_ADDRESSES],
        userFavorites: [1, 6, 10],
        userPoints: 145,
        activeCoupon: null,

        selectedRestId: null,
        selectedVendorRestId: 1,
        selectedCourierId: 1,
        activeCategory: null,
        currentSortMode: 'fast',

        cart: [],
        activeOrder: null,
        orderHistory: [],
        auditLogs: [],
        orderCounter: 1048,

        restaurants: [...DEFAULT_RESTAURANTS],
        menuItems: [...DEFAULT_MENU_ITEMS],
        couriers: [...DEFAULT_COURIERS],

        isSimulationEnabled: true,

        // Modern Delivery & Order Features
        deliveryMode: 'courier', // 'courier' or 'takeaway' (Gel-Al %20 indirim)
        selectedInstruction: 'baby', // id from DELIVERY_INSTRUCTIONS
        deliveryNote: '',
        isEcoFriendly: false, // Plastik çatal/bıçak istemiyorum
        scheduledTime: 'now', // 'now' or '19:30' etc.
        groupOrder: {
            active: false,
            code: 'GUSTO-7429',
            members: [
                { name: "Ahmet Yılmaz (Siz - Kurucu)", items: ["Smash Cheeseburger"], total: 275 },
                { name: "Selin Demir", items: ["Truffle Burger", "Çıtır Patates"], total: 320 },
                { name: "Burak Kaya", items: ["San Sebastian Cheesecake"], total: 95 }
            ],
            currentMember: 'Ahmet Yılmaz (Siz - Kurucu)'
        },
        outOfStockItemIds: [], // Restoran stok tükendi öğeleri
        wheelSpinsAvailable: 1,
        activeAddon: null
    };

    let simInterval = null;

    /**
     * LocalStorage'dan Durumu Yükler (Varsa)
     */
    function loadPersistedState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.savedAddresses) state.savedAddresses = parsed.savedAddresses;
                if (parsed.customerLocation) state.customerLocation = parsed.customerLocation;
                if (parsed.userFavorites) state.userFavorites = parsed.userFavorites;
                if (typeof parsed.userPoints === 'number') state.userPoints = parsed.userPoints;
                if (parsed.cart) state.cart = parsed.cart;
                if (parsed.activeOrder) state.activeOrder = parsed.activeOrder;
                if (parsed.orderHistory) state.orderHistory = parsed.orderHistory;
                if (parsed.auditLogs) state.auditLogs = parsed.auditLogs;
                if (parsed.orderCounter) state.orderCounter = parsed.orderCounter;
                if (parsed.currentUser) state.currentUser = parsed.currentUser;
                if (parsed.currentRole) state.currentRole = parsed.currentRole;
                if (typeof parsed.wheelSpinsAvailable === 'number') state.wheelSpinsAvailable = parsed.wheelSpinsAvailable;
                else state.wheelSpinsAvailable = 1;
                if (parsed.deliveryMode) state.deliveryMode = parsed.deliveryMode;
                if (typeof parsed.isEcoFriendly === 'boolean') state.isEcoFriendly = parsed.isEcoFriendly;
            }
        } catch (e) {
            console.warn('LocalStorage yükleme hatası:', e);
        }
    }

    /**
     * Durumu LocalStorage'a Kaydeder
     */
    function persist() {
        try {
            const dataToSave = {
                savedAddresses: state.savedAddresses,
                customerLocation: state.customerLocation,
                userFavorites: state.userFavorites,
                userPoints: state.userPoints,
                cart: state.cart,
                activeOrder: state.activeOrder,
                orderHistory: state.orderHistory,
                auditLogs: state.auditLogs,
                orderCounter: state.orderCounter,
                currentUser: state.currentUser,
                currentRole: state.currentRole
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            // QuotaExceededError vb. durumlarda sessizce geç
        }
    }

    /**
     * Haversine Büyük Daire Küresel Mesafesi (km) (Şartname Gereksinimi)
     * d = 2R * asin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
     */
    function calculateHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371.0;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    }

    /**
     * Manhattan Mesafesi Hesabı: |x1 - x2| + |y1 - y2|
     */
    function calculateManhattan(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    /**
     * Akıllı Kurye Puanı: Puan = Mesafe (km) + (2 * AktifSiparis)
     */
    function calculateCourierScore(distKm, activeOrders) {
        return parseFloat((distKm + (2.0 * activeOrders)).toFixed(2));
    }

    /**
     * Hedef restorana en uygun kuryeyi seçer (Haversine & İş Yükü Puanlaması)
     */
    function findBestCourier(restX, restY, restLat = null, restLon = null) {
        let bestCourier = null;
        let lowestScore = Infinity;

        state.couriers.forEach(c => {
            let distKm = 0;
            if (restLat && restLon && c.lat && c.lon) {
                distKm = calculateHaversine(c.lat, c.lon, restLat, restLon);
            } else {
                const lat1 = 40.9900 + (c.y * 0.005);
                const lon1 = 29.0250 + (c.x * 0.005);
                const lat2 = 40.9900 + (restY * 0.005);
                const lon2 = 29.0250 + (restX * 0.005);
                distKm = calculateHaversine(lat1, lon1, lat2, lon2);
            }

            const manhattanDist = calculateManhattan(c.x, c.y, restX, restY);
            const score = calculateCourierScore(distKm, c.active);

            if (score < lowestScore) {
                lowestScore = score;
                bestCourier = { ...c, dist: manhattanDist, distKm, score };
            }
        });

        return bestCourier;
    }

    /**
     * Audit Log Ekleme
     */
    function logAudit(orderId, prevStatus, newStatus, actor, comment) {
        const entry = {
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            orderId,
            prevStatus: prevStatus || '—',
            newStatus,
            actor,
            comment
        };
        state.auditLogs.unshift(entry);
        persist();
    }

    /**
     * Sipariş Durum Makinesi Geçiş Metodu (State Pattern)
     */
    function transitionOrderStatus(newStatus, actor, comment) {
        if (!state.activeOrder) return false;

        const allowedTransitions = {
            'alindi': ['hazirlaniyor', 'iptal'],
            'hazirlaniyor': ['hazir'],
            'hazir': ['yolda'],
            'yolda': ['teslim_edildi'],
            'teslim_edildi': [],
            'iptal': []
        };

        const currentStatus = state.activeOrder.status;
        const validNextStates = allowedTransitions[currentStatus] || [];

        if (!validNextStates.includes(newStatus)) {
            console.error(`Geçersiz durum geçişi: ${currentStatus} -> ${newStatus}`);
            return false;
        }

        const oldStatus = state.activeOrder.status;
        state.activeOrder.status = newStatus;

        logAudit(state.activeOrder.id, oldStatus, newStatus, actor, comment);

        if (newStatus === 'teslim_edildi') {
            const cObj = state.couriers.find(c => c.id === state.activeOrder.courierId);
            if (cObj && cObj.active > 0) {
                cObj.active--;
            }
        }

        persist();
        return true;
    }

    /**
     * Sipariş İptali (Yalnızca 'alindi' durumunda izin verilir!)
     */
    function cancelActiveOrder(actor = null, reason = 'Müşteri siparişi iptal etti.') {
        if (!state.activeOrder) return { success: false, message: 'Aktif sipariş yok.' };

        if (state.activeOrder.status !== 'alindi') {
            return {
                success: false,
                message: "Hazırlanmaya başlanan sipariş iptal edilemez (Mimari kural gereği kilitlendi)!"
            };
        }

        if (simInterval) clearInterval(simInterval);
        GustoMap.stopCourierAnimation();

        const cObj = state.couriers.find(c => c.id === state.activeOrder.courierId);
        if (cObj && cObj.active > 0) cObj.active--;

        const cancelledOrder = { ...state.activeOrder, status: 'iptal' };
        logAudit(cancelledOrder.id, cancelledOrder.status, 'iptal', actor || `${state.currentUser.fullName} (Müşteri)`, reason);

        state.orderHistory.unshift(cancelledOrder);
        state.activeOrder = null;
        persist();

        return { success: true, message: 'Sipariş başarıyla iptal edildi.' };
    }

    /**
     * Otomatik Simülasyonu Başlatır
     */
    function startSimulation(onStepCallback) {
        if (simInterval) clearInterval(simInterval);

        const transitions = [
            { next: 'hazirlaniyor', role: 'Restoran Mutfak', delay: 4200, comment: 'Restoran siparişi onayladı ve hazırlamaya başladı.' },
            { next: 'hazir', role: 'Restoran Mutfak', delay: 4800, comment: 'Yemek hazırlandı ve paketlendi.' },
            { next: 'yolda', role: 'Kurye', delay: 4200, comment: 'Kurye paketi teslim aldı ve yola çıktı.' },
            { next: 'teslim_edildi', role: 'Kurye', delay: 4800, comment: 'Sipariş müşteriye başarıyla teslim edildi.' }
        ];

        let stepIdx = transitions.findIndex(t => t.next === state.activeOrder?.status);
        let nextStep = stepIdx >= 0 ? stepIdx + 1 : 0;

        simInterval = setInterval(() => {
            if (!state.activeOrder || !state.isSimulationEnabled || nextStep >= transitions.length) {
                clearInterval(simInterval);
                simInterval = null;
                return;
            }

            const tr = transitions[nextStep];
            const ok = transitionOrderStatus(tr.next, tr.role, tr.comment);
            if (ok && onStepCallback) {
                onStepCallback(tr.next);
            }
            nextStep++;
        }, 4400);
    }

    function stopSimulation() {
        if (simInterval) {
            clearInterval(simInterval);
            simInterval = null;
        }
    }

    function setDeliveryMode(mode) {
        state.deliveryMode = mode;
        persist();
    }

    function toggleStock(itemId) {
        const idx = state.outOfStockItemIds.indexOf(itemId);
        if (idx >= 0) {
            state.outOfStockItemIds.splice(idx, 1);
        } else {
            state.outOfStockItemIds.push(itemId);
        }
        persist();
        return state.outOfStockItemIds.includes(itemId);
    }

    function applyRoadsideAddon(addon) {
        if (!state.activeOrder) return false;
        state.activeAddon = addon;
        state.activeOrder.addon = addon;
        state.activeOrder.items.push({
            name: `${addon.name} (${addon.restName})`,
            price: addon.price,
            qty: 1,
            options: 'Yol Üstü Lezzeti • 0 ₺ Kurye'
        });
        state.activeOrder.total += addon.price;
        logAudit(state.activeOrder.id, state.activeOrder.status, state.activeOrder.status, 'Müşteri', `Yol üstü lezzeti eklendi: ${addon.name} (+${addon.price} ₺)`);
        persist();
        return true;
    }

    function addGustoPoints(pts) {
        state.userPoints = (state.userPoints || 0) + pts;
        persist();
        return state.userPoints;
    }

    return {
        get: () => state,
        loadPersistedState,
        persist,
        calculateHaversine,
        calculateManhattan,
        calculateCourierScore,
        findBestCourier,
        logAudit,
        transitionOrderStatus,
        cancelActiveOrder,
        startSimulation,
        stopSimulation,
        setDeliveryMode,
        toggleStock,
        applyRoadsideAddon,
        addGustoPoints
    };
})();
window.GustoState = GustoState;

