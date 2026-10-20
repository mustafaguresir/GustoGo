/**
 * GustoGo — 2D Manhattan Izgara Haritası & Animasyon Motoru
 * Retina (HiDPI) Destekli, Performans Odaklı Canvas Çizimi
 */

const GustoMap = (function () {
    const GRID_SIZE = 35; // 35x35 koordinat düzlemi
    let courierAnimProgress = 0;
    let courierAnimPhase = 'to_restaurant'; // 'to_restaurant' | 'to_customer'
    let courierAnimInterval = null;
    let currentAnimPos = { x: 14, y: 10 };

    /**
     * Canvas'ı Retina / HiDPI ekranlar için piksel kayıpsız ölçeklendirir
     */
    function setupCanvasDPI(canvas) {
        if (!canvas) return null;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // CSS genişliği ve yüksekliğini baz al
        const displayWidth = rect.width || canvas.width || 600;
        const displayHeight = rect.height || canvas.height || 250;
        
        // Gerçek piksel tamponunu ölçeklendir
        if (canvas.width !== Math.round(displayWidth * dpr) || canvas.height !== Math.round(displayHeight * dpr)) {
            canvas.width = Math.round(displayWidth * dpr);
            canvas.height = Math.round(displayHeight * dpr);
        }
        
        const ctx = canvas.getContext('2d');
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        return { ctx, width: displayWidth, height: displayHeight };
    }

    /**
     * Belirtilen ID'deki haritayı çizer. Sadece canvas DOM'da görünürse çizerek CPU tasarrufu yapar.
     */
    function drawMap(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || canvas.offsetParent === null) return; // Görünmüyorsa çizme (Performans optimizasyonu)

        const canvasSetup = setupCanvasDPI(canvas);
        if (!canvasSetup) return;

        const { ctx, width, height } = canvasSetup;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Arka Plan
        ctx.fillStyle = isDark ? '#0D121C' : '#F8FAFC';
        ctx.fillRect(0, 0, width, height);

        const stepX = width / GRID_SIZE;
        const stepY = height / GRID_SIZE;

        // Izgara Çizgileri
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += stepX) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += stepY) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        const state = GustoState.get();
        const restaurants = state.restaurants;
        const customerLocation = state.customerLocation;
        const activeOrder = state.activeOrder;
        const couriers = state.couriers;

        // 1. Restoranları Çiz
        restaurants.forEach(r => {
            const px = r.x * stepX;
            const py = r.y * stepY;

            ctx.fillStyle = '#FA4A0C';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isDark ? '#F1F5FB' : '#0E1726';
            ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(r.name.split(' ')[0], px + 9, py + 3);
        });

        // 2. Müşteri Teslimat Noktasını Çiz
        const mx = customerLocation.x * stepX;
        const my = customerLocation.y * stepY;

        ctx.fillStyle = '#0BBF80';
        ctx.beginPath();
        ctx.arc(mx, my, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#0BBF80';
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${customerLocation.name.split(' ')[0]} 🏠`, mx + 11, my + 3);

        // 3. Aktif Sipariş ve Kurye / Gel-Al Rotası
        if (activeOrder) {
            const r = restaurants.find(x => x.id === activeOrder.rId);
            if (r) {
                const rx = r.x * stepX;
                const ry = r.y * stepY;

                if (activeOrder.deliveryMode === 'takeaway') {
                    // GEL-AL MODU: Müşteri Yürüyüş Rotası (Yeşil Kesikli Çizgi)
                    ctx.save();
                    ctx.setLineDash([4, 4]);
                    ctx.strokeStyle = '#0BBF80';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(mx, my);
                    ctx.lineTo(rx, my);
                    ctx.lineTo(rx, ry);
                    ctx.stroke();
                    ctx.restore();

                    // Yürüyüş İkonu & Etiket
                    ctx.fillStyle = '#0BBF80';
                    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
                    ctx.fillText('🚶 Gel-Al Yürüyüş Rotası', (mx + rx) / 2 - 20, my - 8);
                } else {
                    // KURYE TESLİMATI (Normal veya Çoklu Duraklı Waypoint)
                    ctx.save();
                    ctx.setLineDash([5, 4]);
                    ctx.strokeStyle = '#FA4A0C';
                    ctx.lineWidth = 2.5;

                    // Eğer Yol Üstü Fırsatı (Addon) eklenmişse: Restoran 1 -> Ara Durak Restoran 2 -> Müşteri
                    if (activeOrder.addon) {
                        const addonR = restaurants.find(x => x.id === activeOrder.addon.rId);
                        if (addonR) {
                            const ax = addonR.x * stepX;
                            const ay = addonR.y * stepY;

                            // 1. Etap: Restoran 1 -> Ara Durak
                            ctx.beginPath();
                            ctx.moveTo(rx, ry);
                            ctx.lineTo(ax, ry);
                            ctx.lineTo(ax, ay);
                            ctx.stroke();

                            // 2. Etap: Ara Durak -> Müşteri (Mor Çizgi)
                            ctx.strokeStyle = '#9B5CF6';
                            ctx.beginPath();
                            ctx.moveTo(ax, ay);
                            ctx.lineTo(mx, ay);
                            ctx.lineTo(mx, my);
                            ctx.stroke();

                            // Ara Durak Noktası
                            ctx.fillStyle = '#9B5CF6';
                            ctx.beginPath();
                            ctx.arc(ax, ay, 8, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
                            ctx.fillText('📍', ax - 4, ay + 3);

                            ctx.fillStyle = isDark ? '#C4B5FD' : '#6D28D9';
                            ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
                            ctx.fillText(`Ara Durak: ${addonR.name.split(' ')[0]} 🍰`, ax + 12, ay - 4);
                        }
                    } else {
                        // Standart Manhattan Rotası
                        ctx.beginPath();
                        ctx.moveTo(rx, ry);
                        ctx.lineTo(mx, ry);
                        ctx.lineTo(mx, my);
                        ctx.stroke();
                    }
                    ctx.restore();

                    // Kurye Animasyon Pozisyonu
                    const cx = currentAnimPos.x * stepX;
                    const cy = currentAnimPos.y * stepY;

                    // Radar Pulse (Genişleyen Halka)
                    const pulseSize = 14 + Math.sin(Date.now() / 200) * 4;
                    ctx.strokeStyle = activeOrder.addon ? 'rgba(155, 92, 246, 0.45)' : 'rgba(47, 142, 255, 0.45)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
                    ctx.stroke();

                    // Kurye Noktası
                    ctx.fillStyle = activeOrder.addon ? '#9B5CF6' : '#2F8EFF';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = activeOrder.addon ? '#9B5CF6' : '#2F8EFF';
                    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
                    ctx.fillText(`${activeOrder.courier.split(' ')[0]} 🛵 ${activeOrder.addon ? '(Çoklu Sipariş)' : ''}`, cx + 11, cy + 4);
                }
            }
        } else {
            // Boşta / Görevdeki Normal Kuryeler
            couriers.forEach(c => {
                const px = c.x * stepX;
                const py = c.y * stepY;

                ctx.fillStyle = '#2F8EFF';
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#2F8EFF';
                ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
                ctx.fillText(`${c.name.split(' ')[0]} 🛵`, px + 9, py + 3);
            });
        }
    }

    /**
     * Kurye Yolculuk Animasyonunu Başlatır (Manhattan Koordinat Hareketi)
     */
    function startCourierAnimation(courier, restaurant, customer) {
        if (courierAnimInterval) clearInterval(courierAnimInterval);

        currentAnimPos = { x: courier.x, y: courier.y };
        courierAnimProgress = 0;
        courierAnimPhase = 'to_restaurant';

        courierAnimInterval = setInterval(() => {
            const activeOrder = GustoState.get().activeOrder;
            if (!activeOrder) {
                clearInterval(courierAnimInterval);
                courierAnimInterval = null;
                return;
            }

            // Duruma göre faz belirleme
            if (activeOrder.status === 'hazir' || activeOrder.status === 'alindi' || activeOrder.status === 'hazirlaniyor') {
                courierAnimPhase = 'to_restaurant';
            } else if (activeOrder.status === 'yolda') {
                courierAnimPhase = 'to_customer';
            }

            courierAnimProgress += 0.04;
            if (courierAnimProgress > 1) {
                courierAnimProgress = 0;
            }

            const targetStart = (courierAnimPhase === 'to_restaurant')
                ? { x: courier.x, y: courier.y }
                : { x: restaurant.x, y: restaurant.y };

            const targetEnd = (courierAnimPhase === 'to_restaurant')
                ? { x: restaurant.x, y: restaurant.y }
                : { x: customer.x, y: customer.y };

            // Manhattan Geometrisi ile Hareket: Önce X ekseninde, sonra Y ekseninde
            if (courierAnimProgress <= 0.5) {
                const p = courierAnimProgress * 2;
                currentAnimPos.x = targetStart.x + (targetEnd.x - targetStart.x) * p;
                currentAnimPos.y = targetStart.y;
            } else {
                const p = (courierAnimProgress - 0.5) * 2;
                currentAnimPos.x = targetEnd.x;
                currentAnimPos.y = targetStart.y + (targetEnd.y - targetStart.y) * p;
            }

            drawMap('customer-map-canvas');
            drawMap('admin-map-canvas');
        }, 120);
    }

    function stopCourierAnimation() {
        if (courierAnimInterval) {
            clearInterval(courierAnimInterval);
            courierAnimInterval = null;
        }
    }

    /**
     * Adres Seçici Modalı için Etkileşimli Izgara Çizer
     */
    function drawAddressPicker() {
        const canvas = document.getElementById('address-picker-canvas');
        if (!canvas) return;

        const canvasSetup = setupCanvasDPI(canvas);
        if (!canvasSetup) return;

        const { ctx, width, height } = canvasSetup;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        ctx.fillStyle = isDark ? '#121620' : '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        const stepX = width / GRID_SIZE;
        const stepY = height / GRID_SIZE;

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += stepX) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y <= height; y += stepY) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Restoran Referans Noktaları
        const restaurants = GustoState.get().restaurants;
        restaurants.forEach(r => {
            ctx.fillStyle = 'rgba(250, 74, 12, 0.4)';
            ctx.beginPath();
            ctx.arc(r.x * stepX, r.y * stepY, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Seçilen Nokta
        const inputX = parseInt(document.getElementById('picker-x')?.value) || 18;
        const inputY = parseInt(document.getElementById('picker-y')?.value) || 14;

        const px = inputX * stepX;
        const py = inputY * stepY;

        ctx.fillStyle = '#0BBF80';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#F1F5FB' : '#0E1726';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Seçilen Konum (${inputX}, ${inputY}) 📍`, px + 10, py + 4);
    }

    function handlePickerMapClick(e) {
        const canvas = document.getElementById('address-picker-canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const gridX = Math.min(GRID_SIZE, Math.max(0, Math.round(clickX / (rect.width / GRID_SIZE))));
        const gridY = Math.min(GRID_SIZE, Math.max(0, Math.round(clickY / (rect.height / GRID_SIZE))));

        const inputX = document.getElementById('picker-x');
        const inputY = document.getElementById('picker-y');
        const textCoord = document.getElementById('picker-coord-text');

        if (inputX) inputX.value = gridX;
        if (inputY) inputY.value = gridY;
        if (textCoord) textCoord.innerText = `Seçili: (X: ${gridX}, Y: ${gridY})`;

        drawAddressPicker();
    }

    return {
        drawMap,
        drawAddressPicker,
        startCourierAnimation,
        stopCourierAnimation,
        handlePickerMapClick
    };
})();
window.GustoMap = GustoMap;

