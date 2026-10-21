import asyncio
from playwright.async_api import async_playwright

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        file_path = 'c:/Users/musta/.gemini/antigravity-ide/scratch/yemek-kurye-sistemi/docs/sunumda_yapilmasi_gerekenler/INTERAKTIF_SUNUM_VE_REHBER.html'
        await page.goto(f'file:///{file_path}')
        await page.wait_for_timeout(1000)
        
        # Get raw code before or inspect
        # In mermaid, let's see what mermaid.parseError says:
        res = await page.evaluate('''() => {
            const pres = Array.from(document.querySelectorAll(".mermaid-box pre"));
            return pres.map((p, idx) => {
                // If it was processed by mermaid, mermaid puts the original code in data-processed or data-content or attribute
                return {
                    idx: idx + 1,
                    html: p.outerHTML.substring(0, 300)
                };
            });
        }''')
        
        with open("tests/pre_inspect.txt", "w", encoding="utf-8") as f:
            for r in res:
                f.write(f"PRE #{r['idx']}:\n{r['html']}\n\n")
        print("Wrote to tests/pre_inspect.txt")
        await browser.close()

asyncio.run(inspect())
