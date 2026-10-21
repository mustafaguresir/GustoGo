import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:8000/sunum.html')
        await page.wait_for_timeout(1000)
        
        errors = await page.evaluate('''async () => {
            const pres = document.querySelectorAll("pre.mermaid");
            const results = [];
            for (let i = 0; i < pres.length; i++) {
                const code = pres[i].textContent;
                try {
                    await mermaid.parse(code);
                    results.push({ index: i + 1, ok: true });
                } catch(e) {
                    results.push({ index: i + 1, ok: false, err: e.message });
                }
            }
            return results;
        }''')
        
        with open("tests/mermaid_results.txt", "w", encoding="utf-8") as f:
            for r in errors:
                f.write(f"Diagram {r['index']}: OK={r['ok']}\n")
                if not r['ok']:
                    f.write(f"  Error: {r['err']}\n")
        
        print("Results written to tests/mermaid_results.txt")
        await browser.close()

asyncio.run(check())
