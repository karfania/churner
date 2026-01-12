import re
import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from playwright.async_api import async_playwright

from app.models.domain import Promotion, OfferType
from app.db.repository import save_promotions, get_promotions_from_db
from app.services.scorer import Scorer
from app.services.llm import OllamaService
from app.services.cache import SimpleCache

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

PROXIES = []

class Scraper:
    def __init__(self):
        self.cache_duration = timedelta(hours=1)
        self.llm = OllamaService()
        self._cache = SimpleCache()

    def _get_random_context_args(self):
        user_agent = random.choice(USER_AGENTS)
        proxy = random.choice(PROXIES) if PROXIES else None
        
        context_args = {
            "user_agent": user_agent,
        }
        
        if proxy:
            context_args["proxy"] = {"server": proxy}
            
        return context_args

    def _heuristic_parse(self, text: str, url: str) -> dict:
        # Basic regex extraction fallback
        bonus_amount = 0.0
        match = re.search(r"\$([\d,]+)", text)
        if match:
            bonus_amount = float(match.group(1).replace(",", ""))
        
        return {
            "bank_name": "Unknown (Heuristic)",
            "offer_type": OfferType.CHECKING,
            "bonus_amount": bonus_amount,
            "description": text[:200],
            "min_deposit": 0.0,
            "min_balance": 0.0,
            "monthly_fees": 0.0,
            "direct_deposit_required": False,
            "direct_deposit_amount": 0.0,
            "holding_period_days": 0
        }

    async def _process_deal(self, text: str, url: str, source: str, use_llm: bool, subreddit: Optional[str] = None, description_fallback: str = None, created_at: Optional[str] = None) -> Optional[Promotion]:
        try:
            if use_llm:
                extracted = await self.llm.extract_promotion_data(text, url)
            else:
                extracted = self._heuristic_parse(text, url)

            if not extracted or extracted.get("bonus_amount", 0) < 50:
                return None

            return Promotion(
                id=str(uuid.uuid4()),
                bank_name=extracted.get("bank_name", "Unknown Bank"),
                offer_type=extracted.get("offer_type", OfferType.CHECKING),
                bonus_amount=extracted.get("bonus_amount", 0.0),
                description=extracted.get("description", description_fallback or text[:200]),
                promotion_url=url,
                min_deposit=extracted.get("min_deposit", 0.0),
                min_balance=extracted.get("min_balance", 0.0),
                monthly_fees=extracted.get("monthly_fees", 0.0),
                direct_deposit_required=extracted.get("direct_deposit_required", False),
                direct_deposit_amount=extracted.get("direct_deposit_amount", 0.0),
                holding_period_days=extracted.get("holding_period_days", 0),
                source=source,
                subreddit=subreddit,
                created_at=created_at
            )
        except Exception as e:
            print(f"Error processing deal from {source}: {e}")
            return None

    async def get_promotions(self, page: int = 1, limit: int = 10, source: str = "reddit", subreddit: Optional[str] = None, use_llm: bool = False) -> dict:
        # Compose cache key
        cache_key = f"promos:{source}:{subreddit or ''}:{use_llm}:{page}:{limit}"

        # 1. Try cache first
        cached = self._cache.get(cache_key)
        if cached:
            return cached

        # 2. Try to load from DB
        result = get_promotions_from_db(page, limit, source, subreddit)

        # If DB has data, cache and return
        if result["total"] > 0:
            self._cache.set(cache_key, result, ttl=int(self.cache_duration.total_seconds()))
            return result

        # 3. No cached or DB results — perform prioritized scraping
        print(f"No DB/cache for {source}/{subreddit}, running prioritized scraping... (LLM: {use_llm})")

        async def scrape_source(src: str):
            try:
                if src == "reddit":
                    target_sub = subreddit if subreddit else "bankbonuses"
                    return await self.scrape_reddit(target_sub, use_llm)
                elif src == "bankrate":
                    return await self.scrape_bankrate(use_llm)
                elif src == "doc":
                    return await self.scrape_doc(use_llm)
                elif src == "nerdwallet":
                    return await self.scrape_nerdwallet(use_llm)
                elif src == "wallethub":
                    return await self.scrape_wallethub(use_llm)
                elif src == "google":
                    return await self.scrape_google(use_llm)
            except Exception as e:
                print(f"Error scraping {src}: {e}")
            return []

        # List of sources to fetch in background
        all_sources = ["reddit", "bankrate", "doc", "nerdwallet", "wallethub", "google"]

        # Ensure prioritized source is scraped first and awaited so user sees fast results
        prioritized = source if source in all_sources else "reddit"
        prioritized_deals = await scrape_source(prioritized)

        # Score and save prioritized results so they are immediately queryable
        scored = [Scorer.calculate_score(d) for d in prioritized_deals]
        if scored:
            save_promotions(scored)

        # Build response from DB (may include prioritized results)
        result = get_promotions_from_db(page, limit, source, subreddit)

        # Cache the immediate result
        self._cache.set(cache_key, result, ttl=int(self.cache_duration.total_seconds()))

        # Kick off other sources in background
        async def background_fetch_and_save():
            tasks = []
            for s in all_sources:
                if s == prioritized:
                    continue
                tasks.append(asyncio.create_task(scrape_source(s)))

            if not tasks:
                return

            done, _ = await asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED)
            for t in done:
                try:
                    raw = t.result()
                    if raw:
                        scored_more = [Scorer.calculate_score(d) for d in raw]
                        save_promotions(scored_more)
                except Exception as e:
                    print(f"Background task error: {e}")

            # Invalidate relevant caches so subsequent queries see new data
            try:
                self._cache.invalidate(cache_key)
            except Exception:
                pass

        # Fire-and-forget background fetch
        try:
            asyncio.create_task(background_fetch_and_save())
        except Exception:
            # Some runtimes may not allow create_task; run it without awaiting if needed
            pass

        return result

    async def scrape_reddit_comments(self, context, url: str, use_llm: bool = False) -> List[Promotion]:
        deals = []
        page = await context.new_page()
        try:
            await page.goto(url, timeout=60000)
            try:
                await page.wait_for_selector("shreddit-comment", timeout=10000)
            except:
                await page.close()
                return []

            # Scroll a bit
            for _ in range(5):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(1)

            # Get top-level comments only
            comments = await page.query_selector_all("shreddit-comment[depth='0']")
            print(f"Found {len(comments)} top-level comments in weekly thread")
            
            for comment in comments:
                try:
                    text_content = await comment.inner_text()
                    
                    # Quick filter: must have $ or points
                    if "$" not in text_content and "points" not in text_content.lower():
                        continue

                    # 3. Link
                    link_match = re.search(r"(https?://[^\s]+)", text_content)
                    if link_match:
                        link = link_match.group(1)
                    else:
                        permalink = await comment.get_attribute("permalink")
                        link = f"https://www.reddit.com{permalink}"

                    deal = await self._process_deal(
                        text=text_content,
                        url=link,
                        source="reddit",
                        use_llm=use_llm,
                        subreddit="churning"
                    )

                    if deal:
                        deals.append(deal)
                except Exception as e:
                    print(f"Error parsing comment: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error scraping comments: {e}")
        finally:
            await page.close()
        return deals

    async def scrape_bankrate(self, use_llm: bool = False) -> List[Promotion]:
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                await page.goto("https://www.bankrate.com/banking/best-bank-account-bonuses/", timeout=60000)
                await page.wait_for_selector(".BankDetail-overview", timeout=10000)
                overviews = await page.query_selector_all(".BankDetail-overview")
                
                for overview in overviews:
                    try:
                        text_content = await overview.inner_text()
                        
                        description = text_content.strip()
                        stats_handle = await overview.evaluate_handle("el => el.nextElementSibling")
                        stats_text = ""
                        if stats_handle:
                            is_stats = await stats_handle.evaluate("el => el.classList.contains('BankDetail-productStats')")
                            if is_stats:
                                stats_text = await stats_handle.inner_text()
                        
                        full_text = description + "\n" + stats_text
                        
                        deal = await self._process_deal(
                            text=full_text,
                            url="https://www.bankrate.com/banking/best-bank-account-bonuses/",
                            source="bankrate",
                            use_llm=use_llm,
                            description_fallback=description[:200]
                        )

                        if deal:
                            deals.append(deal)
                    except Exception as e:
                        print(f"Error parsing bankrate deal: {e}")
                        continue
                await browser.close()
        except Exception as e:
            print(f"Bankrate scraping failed: {e}")
        return deals

    async def scrape_doc(self, use_llm: bool = False) -> List[Promotion]:
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                
                # Doctor of Credit Category Page (Chronological)
                url = "https://www.doctorofcredit.com/category/bank-account-bonuses/"
                await page.goto(url, timeout=60000)
                
                try:
                    await page.wait_for_selector("article", timeout=10000)
                except:
                    print("Timeout waiting for DoC articles")
                    await browser.close()
                    return []

                articles = await page.query_selector_all("article")
                print(f"Found {len(articles)} articles on DoC")

                for article in articles:
                    try:
                        # Check date
                        time_el = await article.query_selector("time.entry-date")
                        created_ts = None
                        if time_el:
                            created_ts = await time_el.get_attribute("datetime")
                            if created_ts:
                                try:
                                    dt = datetime.fromisoformat(created_ts)
                                    if dt.tzinfo is None:
                                         if datetime.now() - dt > timedelta(days=90):
                                             continue
                                    else:
                                         if datetime.now(dt.tzinfo) - dt > timedelta(days=90):
                                             continue
                                except: pass

                        title_el = await article.query_selector(".entry-title a")
                        if not title_el: continue
                        title = await title_el.inner_text()
                        link = await title_el.get_attribute("href")
                        
                        # Quick filter
                        if "$" not in title: continue

                        # Get snippet
                        content_el = await article.query_selector(".entry-content")
                        content = await content_el.inner_text() if content_el else ""
                        
                        full_text = f"{title}\n{content}"

                        deal = await self._process_deal(
                            text=full_text,
                            url=link,
                            source="doc",
                            use_llm=use_llm,
                            description_fallback=title,
                            created_at=created_ts
                        )

                        if deal:
                            deals.append(deal)
                    except Exception as e:
                        print(f"Error parsing DoC article: {e}")
                        continue
                await browser.close()
        except Exception as e:
            print(f"DoC scraping failed: {e}")
        return deals

    async def scrape_nerdwallet(self, use_llm: bool = False) -> List[Promotion]:
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                
                url = "https://www.nerdwallet.com/best/banking/best-bank-bonuses-promotions"
                await page.goto(url, timeout=60000)
                
                # NerdWallet usually has a list of products. 
                # We'll look for H3s which usually denote the bank/product name
                try:
                    await page.wait_for_selector("main", timeout=10000)
                except:
                    pass

                # Get all text content to parse? No, too big.
                # Let's try to find product cards.
                # They often use a specific class for the card container.
                # But it changes. H3 is safer.
                
                headers = await page.query_selector_all("h3")
                print(f"Found {len(headers)} headers on NerdWallet")
                
                for header in headers:
                    try:
                        title = await header.inner_text()
                        
                        # Get the parent element's text to get context
                        # We'll try to get the text of the section containing this header
                        # This is a bit heuristic.
                        section_text = await header.evaluate("el => { let p = el.parentElement; return p ? p.innerText : el.innerText; }")
                        
                        if "$" not in section_text: continue
                        
                        deal = await self._process_deal(
                            text=section_text,
                            url=url,
                            source="nerdwallet",
                            use_llm=use_llm,
                            description_fallback=title
                        )

                        if deal:
                            deals.append(deal)
                    except: continue
                await browser.close()
        except Exception as e:
            print(f"NerdWallet scraping failed: {e}")
        return deals

    async def scrape_wallethub(self, use_llm: bool = False) -> List[Promotion]:
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                
                url = "https://wallethub.com/best-bank-account-bonuses"
                await page.goto(url, timeout=60000)
                
                # WalletHub usually has 'article' or cards
                try:
                    await page.wait_for_selector("article", timeout=10000)
                except:
                    pass
                
                articles = await page.query_selector_all("article")
                if not articles:
                     # Try finding by class if article tag isn't used
                     articles = await page.query_selector_all(".card") 
                
                print(f"Found {len(articles)} items on WalletHub")

                for article in articles:
                    try:
                        text = await article.inner_text()
                        if "$" not in text: continue
                        
                        deal = await self._process_deal(
                            text=text,
                            url=url,
                            source="wallethub",
                            use_llm=use_llm,
                            description_fallback=text[:100]
                        )

                        if deal:
                            deals.append(deal)
                    except: continue
                await browser.close()
        except Exception as e:
            print(f"WalletHub scraping failed: {e}")
        return deals

    async def scrape_google(self, use_llm: bool = False) -> List[Promotion]:
        # Google scraping is often blocked or returns snippets that are too short for good LLM extraction
        # But we can try.
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"]
                )
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                # Search for best bank bonuses
                current_year = datetime.now().year
                await page.goto(f"https://www.google.com/search?q=best+bank+account+bonuses+{current_year}", timeout=60000)
                
                # Wait for results
                try:
                    await page.wait_for_selector("div.g", timeout=10000)
                except Exception:
                    print("Timeout waiting for div.g")
                
                results = await page.query_selector_all("div.g")
                
                for res in results:
                    try:
                        title_el = await res.query_selector("h3")
                        if not title_el: continue
                        title = await title_el.inner_text()
                        
                        link_el = await res.query_selector("a")
                        if not link_el: continue
                        link = await link_el.get_attribute("href")
                        
                        snippet_el = await res.query_selector("div.VwiC3b")
                        if not snippet_el:
                             snippet_el = await res.query_selector("div[style*='-webkit-line-clamp']")

                        snippet = await snippet_el.inner_text() if snippet_el else ""
                        
                        full_text = title + " " + snippet
                        
                        # Quick filter
                        if "$" not in full_text: continue

                        deal = await self._process_deal(
                            text=full_text,
                            url=link,
                            source="google",
                            use_llm=use_llm,
                            description_fallback=snippet
                        )

                        if deal:
                            deals.append(deal)
                    except:
                        continue
                await browser.close()
        except Exception as e:
            print(f"Google scraping failed: {e}")
        return deals

    async def scrape_reddit(self, subreddit: str = "bankbonuses", use_llm: bool = False) -> List[Promotion]:
        deals = []
        try:
            async with async_playwright() as p:
                context_args = self._get_random_context_args()
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(**context_args)
                page = await context.new_page()
                
                url = f"https://www.reddit.com/r/{subreddit}/new/"
                await page.goto(url, timeout=60000)
                
                try:
                    await page.wait_for_selector("shreddit-post", timeout=10000)
                except:
                    print("Timeout waiting for posts")
                    await browser.close()
                    return []

                for _ in range(3):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await asyncio.sleep(2)

                posts = await page.query_selector_all("shreddit-post")
                print(f"Found {len(posts)} posts on Reddit r/{subreddit}")

                for post in posts:
                    try:
                        title = await post.get_attribute("post-title")
                        if not title:
                            continue
                        
                        # Check timestamp
                        created_ts = await post.get_attribute("created-timestamp")
                        if created_ts:
                            try:
                                dt = datetime.fromisoformat(created_ts.replace('Z', '+00:00'))
                                if datetime.now(dt.tzinfo) - dt > timedelta(days=90):
                                    # print(f"Skipping old post: {title} ({dt})")
                                    continue
                            except Exception as e:
                                print(f"Error parsing timestamp {created_ts}: {e}")

                        # Quick filter
                        if "$" not in title and "points" not in title.lower():
                            continue

                        if subreddit == "churning" and "Bank Bonus Weekly Thread" in title:
                             link = await post.get_attribute("content-href")
                             if not link:
                                  permalink = await post.get_attribute("permalink")
                                  link = f"https://www.reddit.com{permalink}"
                             
                             print(f"Found Weekly Thread: {title}, scraping comments...")
                             thread_deals = await self.scrape_reddit_comments(context, link, use_llm=use_llm)
                             deals.extend(thread_deals)
                             continue

                        link = await post.get_attribute("content-href")
                        if not link:
                            permalink = await post.get_attribute("permalink")
                            link = f"https://www.reddit.com{permalink}"

                        deal = await self._process_deal(
                            text=title,
                            url=link,
                            source="reddit",
                            use_llm=use_llm,
                            subreddit=subreddit,
                            description_fallback=title,
                            created_at=created_ts
                        )

                        if deal:
                            deals.append(deal)

                    except Exception as e:
                        print(f"Error parsing post: {e}")
                        continue

                await browser.close()
        except Exception as e:
            print(f"Scraping failed: {e}")
            return []

        return deals
