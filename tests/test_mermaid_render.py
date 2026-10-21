import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on('console', lambda msg: print('CONSOLE:', msg.text))
        page.on('pageerror', lambda err: print('PAGE ERROR:', err))
        
        await page.goto("http://localhost:8000/sunum.html")
        await page.wait_for_timeout(1500)
        
        # Click on Tab 4 (UML & Mimari Diyagramlar)
        await page.click('button:has-text("4. UML & Mimari Diyagramlar")')
        await page.wait_for_timeout(2000)
        
        # Check if there are any "Syntax error in text"
        content = await page.content()
        has_syntax_error = "Syntax error in text" in content
        print("HAS SYNTAX ERROR:", has_syntax_error)
        
        # Take a screenshot to verify visually
        await page.screenshot(path="tests/screenshots/sunum_diagrams_fixed.png", full_page=True)
        print("Screenshot saved to tests/screenshots/sunum_diagrams_fixed.png")
        
        await browser.close()

asyncio.run(test())
