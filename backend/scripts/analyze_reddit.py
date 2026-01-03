import asyncio
from playwright.async_api import async_playwright
import json

async def fetch_reddit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Reddit is tricky with bots, we might need to set user agent
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        
        print("Navigating to Reddit...")
        await page.goto("https://www.reddit.com/r/bankbonuses/new/", timeout=60000)
        
        # Wait for posts to load
        try:
            await page.wait_for_selector("shreddit-post", timeout=10000)
        except:
            print("Could not find shreddit-post, dumping content...")
            
        content = await page.content()
        with open("reddit_dump.html", "w") as f:
            f.write(content)
            
        # Try to extract some titles to verify
        posts = await page.query_selector_all("shreddit-post")
        print(f"Found {len(posts)} posts")
        
        for post in posts[:3]:
            title = await post.get_attribute("post-title")
            print(f"Title: {title}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(fetch_reddit())
