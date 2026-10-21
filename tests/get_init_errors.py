import asyncio
from playwright.async_api import async_playwright

async def get_parse_errors():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Hook mermaid.parseError before page loads
        await page.add_init_script('''
            window.__mermaid_errors = [];
            window.addEventListener("DOMContentLoaded", () => {
                if (window.mermaid) {
                    const origInit = mermaid.initialize;
                    mermaid.initialize = function(config) {
                        config = config || {};
                        config.parseError = function(err, hash) {
                            window.__mermaid_errors.push({ err: err, hash: hash });
                        };
                        return origInit.call(mermaid, config);
                    };
                }
            });
        ''')
        
        file_path = 'c:/Users/musta/.gemini/antigravity-ide/scratch/yemek-kurye-sistemi/docs/sunumda_yapilmasi_gerekenler/INTERAKTIF_SUNUM_VE_REHBER.html'
        await page.goto(f'file:///{file_path}')
        await page.wait_for_timeout(2000)
        
        errs = await page.evaluate('() => window.__mermaid_errors')
        with open("tests/mermaid_init_errors.txt", "w", encoding="utf-8") as f:
            for e in errs:
                f.write(str(e) + "\n---\n")
                
        print("Captured errors:", len(errs))
        await browser.close()

asyncio.run(get_parse_errors())
