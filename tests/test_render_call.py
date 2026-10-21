import re
import asyncio
from playwright.async_api import async_playwright

with open("docs/sunumda_yapilmasi_gerekenler/INTERAKTIF_SUNUM_VE_REHBER.html", "r", encoding="utf-8") as f:
    html = f.read()

# Grab raw text inside <pre class="mermaid">
blocks = re.findall(r'<pre class="mermaid">\s*(.*?)\s*</pre>', html, re.DOTALL)
print(f"Total blocks in HTML: {len(blocks)}")

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:8000/sunum.html")
        
        for i, code in enumerate(blocks):
            res = await page.evaluate(f'''async () => {{
                try {{
                    const {{ svg }} = await mermaid.render("test_render_{i}", {repr(code)});
                    return {{ ok: true, svgLen: svg.length }};
                }} catch(e) {{
                    return {{ ok: false, err: e.message, str: String(e) }};
                }}
            }}''')
            print(f"Render Block #{i+1}:", res)
            
        await browser.close()

asyncio.run(run())
