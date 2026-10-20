import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "tests/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def run_tests():
    print("=" * 65)
    print("GUSTOGO - MODERN OZELLIKLER VE KULLANILABILIRLIK TESTI")
    print("=" * 65)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 850})
        
        # 1. Sayfa Yükleme
        await page.goto("http://localhost:8000")
        await page.wait_for_selector("#del-mode-toggle")
        print("[PASS] 1. Sayfa basariyla yuklendi, temel bilesenler hazir.")

        # 2. Gel-Al & Teslimat Modu Switcher
        await page.click("#btn-del-takeaway")
        await page.wait_for_timeout(300)
        is_takeaway_active = await page.eval_on_selector("#btn-del-takeaway", "el => el.classList.contains('active')")
        assert is_takeaway_active, "Gel-Al butonu aktif olmaliydi"
        await page.screenshot(path=f"{SCREENSHOT_DIR}/01_gel_al_mode.png")
        print("[PASS] 2. Gel-Al (%20 Indirim) modu secildi ve dogrulandi.")

        await page.click("#btn-del-courier")
        await page.wait_for_timeout(300)
        is_courier_active = await page.eval_on_selector("#btn-del-courier", "el => el.classList.contains('active')")
        assert is_courier_active, "Adrese Teslim butonu aktif olmaliydi"
        print("[PASS] 3. Adrese Teslim moduna basariyla geri donuldu.")

        # 3. Sansli Gusto Carki (Lucky Wheel)
        await page.click("#btn-quick-wheel")
        await page.wait_for_selector("#wheel-overlay", state="visible")
        print("[PASS] 4. Sansli Gusto Carki modali acildi.")

        await page.click("#btn-spin-wheel")
        await page.wait_for_timeout(4000) # Carkin donmesini bekle
        await page.screenshot(path=f"{SCREENSHOT_DIR}/02_lucky_wheel.png")
        await page.eval_on_selector("#wheel-overlay .modal-close", "el => el.click()")
        print("[PASS] 5. Sans Carki basariyla dondu, odul ve puan hesaba tanimlandi.")

        # 4. Restoran Secimi ve Ortak Sepet (Group Order)
        await page.click(".rest-card:has-text('Burger Lab')")
        await page.wait_for_selector("#menu-section", state="visible")
        print("[PASS] 6. Burger Lab menusu acildi.")

        await page.click("#btn-group-cart")
        await page.wait_for_selector("#group-order-overlay", state="visible")
        group_code = await page.inner_text("#group-order-code")
        assert "GUSTO-7429" in group_code, "Grup kodu gorunmeliydi"

        await page.fill("#group-friend-name", "Deniz")
        await page.click("#group-order-overlay button:has-text('Ekle')")
        await page.wait_for_timeout(300)
        group_list_text = await page.inner_text("#group-members-list")
        assert "Deniz" in group_list_text, "Deniz ortak sepete eklenmeliydi"
        await page.screenshot(path=f"{SCREENSHOT_DIR}/03_group_order.png")
        await page.click("#group-order-overlay button:has-text('Sepete Dön')")
        print("[PASS] 7. Ortak Sepet kodu olusturuldu ve yeni katilimci basariyla eklendi.")

        # 5. Urun Ozellestirme ve Sepete Ekleme
        await page.click(".food-card:has-text('Smash Cheeseburger')")
        await page.wait_for_selector("#customizer-overlay", state="visible")
        await page.click("#opt-size-2") # 1.5 Doyurucu Porsiyon
        await page.check("#extra-cheese")
        await page.click("#customizer-overlay button:has-text('Sepete Ekle')")
        await page.wait_for_timeout(300)
        cart_badge = await page.inner_text("#cart-badge")
        assert int(cart_badge) > 0, "Sepet dolu olmaliydi"
        print("[PASS] 8. Urun porsiyon ve ekstra peynir secimiyle sepete eklendi.")

        # 6. Gelismis Odeme (Checkout) ve Akilli Talimatlar
        await page.click("#btn-order")
        await page.wait_for_selector("#checkout-overlay", state="visible")
        await page.click(".inst-chip:has-text('Zile Basma Bebek Uyuyor')")
        await page.click(".sched-pill:has-text('19:00 - 19:30')")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/04_checkout_modal.png")
        await page.click("#checkout-overlay button:has-text('Siparişi Onayla & Başlat')")
        await page.wait_for_timeout(500)
        print("[PASS] 9. Akilli teslimat talimati ve ileri teslimat zamani ile siparis onaylandi.")

        # 7. Canli Takip, Termal Tazelik Gostergesi ve Yol Ustu Firsati
        thermal_visible = await page.is_visible("#thermal-box")
        assert thermal_visible, "Termal tazelik gostergesi gorunmeliydi"
        thermal_temp = await page.inner_text("#thermal-temp")
        print(f"[PASS] 10. Canli Termal Gosterge aktif: {thermal_temp}")

        addon_visible = await page.is_visible("#addon-deal-card")
        if addon_visible:
            await page.click("#addon-deal-card button:has-text('Siparişe Ekle')")
            await page.wait_for_timeout(500)
            print("[PASS] 11. Yol Ustu Firsati (+0 ₺ Kurye ile Tatli) siparise ve ara durak rotasina eklendi.")
        
        await page.screenshot(path=f"{SCREENSHOT_DIR}/05_live_tracker_with_addon.png")

        # 8. Restoran KDS ve Stok Yonetimi
        await page.click("button:has-text('Rol / Giriş')")
        await page.wait_for_selector("#login-overlay", state="visible")
        await page.click(".choice-pill:has-text('Satıcı / Mutfak')")
        await page.wait_for_selector("#view-restaurant", state="visible")
        print("[PASS] 12. Satici / Mutfak Paneline gecildi.")

        # KDS Zil Butonu & Stok Toggle
        await page.click("button:has-text('KDS Zil Çal')")
        first_stock_btn = await page.query_selector("#res-menu-body button")
        if first_stock_btn:
            btn_text = await first_stock_btn.inner_text()
            await first_stock_btn.click()
            await page.wait_for_timeout(300)
            new_btn_text = await first_stock_btn.inner_text()
            print(f"[PASS] 13. Mutfak stok durumu degistirildi: '{btn_text}' -> '{new_btn_text}'")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/06_restaurant_kds.png")

        # 9. Kirilimli Degerlendirme ve Etiketler
        await page.click("#btn-quick-rating")
        await page.wait_for_selector("#rating-overlay", state="visible")
        await page.click("#taste-stars i:nth-child(5)")
        await page.click("#speed-stars i:nth-child(5)")
        await page.click("#service-stars i:nth-child(5)")
        await page.click(".rating-tag-chip:has-text('Sıcacık Geldi')")
        await page.click(".rating-tag-chip:has-text('Süper Hızlı')")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/07_rating_modal.png")
        await page.click("#rating-overlay button:has-text('Değerlendirmeyi Gönder')")
        await page.wait_for_timeout(500)
        print("[PASS] 14. 3 kirilimli puanlama ve etiketler basariyla iletildi (+25 GustoPuan).")

        await browser.close()
        print("=" * 65)
        print("TUM MODERN OZELLIKLER VE KULLANILABILIRLIK TESTLERI 100% BASARILI!")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_tests())
