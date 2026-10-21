import re
import asyncio
from playwright.async_api import async_playwright

with open("docs/sunumda_yapilmasi_gerekenler/INTERAKTIF_SUNUM_VE_REHBER.html", "r", encoding="utf-8") as f:
    content = f.read()

# Extract all <pre class="mermaid">...</pre>
matches = re.findall(r'<pre class="mermaid">\s*(.*?)\s*</pre>', content, re.DOTALL)
print(f"Found {len(matches)} mermaid blocks in HTML.")

async def test_each():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:8000/sunum.html")
        
        for idx, block in enumerate(matches):
            res = await page.evaluate(f'''async () => {{
                try {{
                    await mermaid.parse({repr(block)});
                    return {{ ok: true }};
                }} catch(e) {{
                    return {{ ok: false, err: e.message }};
                }}
            }}''')
            print(f"Block #{idx+1} ({block.splitlines()[0]}):", res)
            if not res['ok']:
                print("FAILED CODE:")
                print(block)
                print("-" * 50)
                
        await browser.close()

asyncio.run(test_each())
