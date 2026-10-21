import asyncio
from playwright.async_api import async_playwright

async def verify_clean():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Load local file directly
        file_path = "c:/Users/musta/.gemini/antigravity-ide/scratch/yemek-kurye-sistemi/docs/sunumda_yapilmasi_gerekenler/INTERAKTIF_SUNUM_VE_REHBER.html"
        await page.goto(f"file:///{file_path}")
        await page.wait_for_timeout(2000)
        
        # Switch to tab-diagrams
        await page.click('button:has-text("4. UML & Mimari Diyagramlar")')
        await page.wait_for_timeout(2500)
        
        # Check error divs
        errors = await page.eval_on_selector_all('.error-icon, svg[aria-roledescription="error"]', 'els => els.length')
        has_error_text = await page.evaluate('() => document.body.innerText.includes("Syntax error in text")')
        
        print("ERRORS COUNT:", errors)
        print("HAS SYNTAX ERROR IN TEXT:", has_error_text)
        
        # Screenshot
        await page.screenshot(path="tests/screenshots/verified_clean_diagrams.png")
        print("Screenshot saved to tests/screenshots/verified_clean_diagrams.png")
        
        await browser.close()

asyncio.run(verify_clean())
