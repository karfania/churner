import asyncio
from playwright.async_api import async_playwright

async def fetch_html():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.bankrate.com/banking/best-bank-account-bonuses/", timeout=60000)
        content = await page.content()
        with open("bankrate_dump.html", "w") as f:
            f.write(content)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(fetch_html())
