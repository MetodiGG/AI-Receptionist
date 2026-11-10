"""One owner-requested, cached public website audit; never an application route.

No authentication, cookies, Google, AI, form submission or automatic price import.
Price rows are review candidates, NOT verified prices. Requires lxml in the
bundled maintenance Python runtime; no application dependency is added.
"""
import argparse
import concurrent.futures
import hashlib
import ipaddress
import json
import re
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path

from lxml import html

AGENT = 'GoRezPricingAudit/1.0 (+https://www.gorez.co; info@gorez.co)'
MONEY = re.compile(r'(?:\d[\d\s.,–-]{0,25}\s*(?:€|EUR\b|евро\b|лв\.?|BGN\b)|(?:€|EUR)\s*\d)', re.I)
BOOKING = re.compile(r'резерв|запаз|запиш|записв|часове|book|appointment|reservation|rezerv|zapaz|zapis', re.I)
PRICING = re.compile(r'цен|ценоразпис|price|pricing|tariff|tsen|ceni|cenorazpis', re.I)
RELEVANT = re.compile(r'цен|услуг|ценоразпис|резерв|запаз|запиш|записв|price|pricing|tariff|service|book|appointment|reservation|rezerv|zapaz|zapis|tsen|ceni|uslug|menu|меню|kontakt|contact', re.I)
EXCLUDED = re.compile(r'facebook\.com|instagram\.com|google\.|googleapis\.|gstatic\.|googletagmanager\.|youtube\.com|youtu\.be|tiktok\.com|linkedin\.com|twitter\.com|x\.com', re.I)
SKIP_PATH = re.compile(r'login|log-in|sign-in|checkout|cart|wp-admin|wp-json|account|privacy|terms|cookie|политик|условия|galer|gallery|blog|novini|новин', re.I)
MAX_BYTES = 2_000_000


def clean(value):
    return re.sub(r'\s+', ' ', value or '').strip()


def safe_url(value):
    try:
        u = urllib.parse.urlsplit(value)
        if u.scheme not in ('https', 'http') or u.username or u.password or u.port or not u.hostname or EXCLUDED.search(u.hostname):
            return None
        if not re.fullmatch(r'[a-z0-9.-]+\.[a-z]{2,63}', u.hostname) or u.hostname.endswith(('.local', '.internal', '.test', '.invalid')):
            return None
        if any(re.search(r'token|password|redirect|return_url|add.?to.?cart|action|delete|remove|logout|quantity|coupon|subscribe|register|order|checkout|wc-ajax|nonce|email|phone|message', k, re.I) for k, _ in urllib.parse.parse_qsl(u.query)):
            return None
        if re.search(r'/(?:cart|checkout|logout|signout|delete|remove|subscribe|register)(?:/|$)', u.path, re.I):
            return None
        return urllib.parse.urlunsplit((u.scheme, u.netloc, urllib.parse.quote(u.path or '/', safe="/%:@-._~!$&'()*+,;="), urllib.parse.quote(u.query, safe="%=&?/:@-._~!$'()*+,;"), ''))
    except ValueError:
        return None


def public_dns(host):
    addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise ValueError('non_public_destination')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Fetcher:
    def __init__(self, cache_dir, cache_max_age=86400):
        self.cache_dir = cache_dir
        self.cache_max_age = cache_max_age
        self.last_start = 0
        self.network_requests = 0
        self.opener = urllib.request.build_opener(NoRedirect())

    def fetch(self, value, redirect_hosts=None, can_fetch=None):
        url = safe_url(value)
        if not url:
            return {'url': value, 'status': 'unsafe_or_excluded_url'}
        cache = self.cache_dir / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if cache.exists() and time.time() - cache.stat().st_mtime <= self.cache_max_age:
            cached = json.loads(cache.read_text())
            destination = cached.get('finalUrl', url)
            # A cached redirect is subject to the current path policy too.
            if can_fetch and (not can_fetch(url) or not can_fetch(destination)):
                return {'url': url, 'status': 'robots_disallowed'}
            return cached
        current, visited = url, set()
        for _ in range(5):
            if current in visited:
                return {'url': url, 'status': 'redirect_loop'}
            visited.add(current)
            try:
                host = urllib.parse.urlsplit(current).hostname
                public_dns(host)
                if redirect_hosts and host.removeprefix('www.') not in redirect_hosts:
                    return {'url': url, 'status': 'external_redirect_review', 'destination': current}
                if can_fetch and not can_fetch(current):
                    return {'url': url, 'status': 'robots_disallowed'}
                time.sleep(max(0, 1.2 - (time.monotonic() - self.last_start)))
                self.last_start = time.monotonic()
                self.network_requests += 1
                request = urllib.request.Request(current, headers={'User-Agent': AGENT, 'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.8'})
                with self.opener.open(request, timeout=15) as response:
                    body = response.read(MAX_BYTES + 1)
                    if len(body) > MAX_BYTES:
                        result = {'url': url, 'finalUrl': current, 'status': 'response_too_large'}
                    else:
                        charset = response.headers.get_content_charset() or 'utf-8'
                        result = {'url': url, 'finalUrl': current, 'status': response.status,
                                  'contentType': response.headers.get_content_type(), 'body': body.decode(charset, errors='replace')}
                cache.write_text(json.dumps(result, ensure_ascii=False))
                return result
            except urllib.error.HTTPError as exc:
                if exc.code in (301, 302, 303, 307, 308):
                    next_url = safe_url(urllib.parse.urljoin(current, exc.headers.get('Location', '')))
                    if not next_url or (current.startswith('https:') and not next_url.startswith('https:')):
                        result = {'url': url, 'status': 'unsafe_redirect'}
                        break
                    current = next_url
                    continue
                result = {'url': url, 'finalUrl': current, 'status': exc.code}
                break
            except (OSError, ValueError, TimeoutError, urllib.error.URLError) as exc:
                result = {'url': url, 'finalUrl': current, 'status': 'unavailable', 'reason': type(exc).__name__}
                break
        else:
            result = {'url': url, 'status': 'too_many_redirects'}
        cache.write_text(json.dumps(result, ensure_ascii=False))
        return result


def read_page(result):
    page = {k: v for k, v in result.items() if k != 'body'}
    if result.get('status') != 200:
        return page
    if result.get('contentType') == 'application/pdf':
        return {**page, 'reviewRequired': 'public_pdf_menu'}
    if result.get('contentType') not in ('text/html', 'application/xhtml+xml'):
        return {**page, 'reviewRequired': 'unsupported_content_type'}
    try:
        tree = html.fromstring(result.get('body', ''))
        page['title'] = clean(' '.join(tree.xpath('//title/text()')))[:240]
        page['links'] = []
        for anchor in tree.xpath('//a[@href]'):
            text = clean(anchor.text_content())[:180]
            url = safe_url(urllib.parse.urljoin(result.get('finalUrl', result['url']), anchor.get('href')))
            if url and RELEVANT.search(urllib.parse.unquote(url) + ' ' + text) and not SKIP_PATH.search(urllib.parse.urlsplit(url).path):
                page['links'].append({'url': url, 'text': text})
        page['links'] = list({item['url']: item for item in page['links']}.values())[:100]
        page['embeddedMenus'] = []
        # Public booking widgets can be on an owner subdomain rather than an
        # anchor. Record only read-only frame URLs; never submit any form.
        for frame in tree.xpath('//iframe[@src]'):
            url = safe_url(urllib.parse.urljoin(result.get('finalUrl', result['url']), frame.get('src')))
            label = clean(frame.get('title', ''))[:180]
            if re.search(r'table|цени|price|menu', label, re.I):
                # Embed URLs may carry signed viewer/session parameters.
                # Keep just the provider and label for a rendered review.
                page['embeddedMenus'].append({'provider': urllib.parse.urlsplit(frame.get('src', '')).hostname, 'title': label})
            if url and BOOKING.search(urllib.parse.unquote(url) + ' ' + label):
                page['links'].append({'url': url, 'text': label or 'Public booking frame', 'kind': 'iframe'})
        page['links'] = list({item['url']: item for item in page['links']}.values())[:100]
        page['bookingLinks'] = [item for item in page['links'] if BOOKING.search(urllib.parse.unquote(item['url']) + ' ' + item['text'])]
        page['hasPublicForm'] = bool(tree.xpath('//form'))
        page['structuredOffers'] = []
        for script in tree.xpath('//script[@type="application/ld+json"]'):
            try:
                parsed = json.loads(script.text or '')
                def walk(value, parent_name=''):
                    if isinstance(value, list):
                        for item in value:
                            walk(item, parent_name)
                    elif isinstance(value, dict):
                        name = clean(str(value.get('name', parent_name)))[:200]
                        if value.get('price') is not None or value.get('lowPrice') is not None:
                            page['structuredOffers'].append({k: value[k] for k in ('@type', 'name', 'price', 'priceCurrency', 'lowPrice', 'highPrice', 'unitText', 'validFrom', 'validThrough', 'availability') if k in value} | {'serviceContext': name})
                        for item in value.values():
                            if isinstance(item, (dict, list)):
                                walk(item, name)
                walk(parsed)
            except (ValueError, RecursionError, TypeError):
                continue
        for item in tree.xpath('//script|//style|//noscript|//svg|//nav|//footer|//header'):
            item.drop_tree()
        text = clean(tree.text_content())
        if re.search(r'captcha|verify you are human|just a moment|access denied|checking your browser', text[:3000], re.I):
            return {**page, 'reviewRequired': 'access_control_or_challenge', 'priceRows': []}
        page['headings'] = [clean(item.text_content())[:180] for item in tree.xpath('//h1|//h2|//h3')][:35]
        candidates = []
        for item in tree.xpath('//tr|//li|//p|//dt|//dd|//div[contains(@class,"price") or contains(@class,"pricing") or contains(@class,"service")]'):
            snippet = clean(item.text_content())
            if 3 < len(snippet) <= 1500 and MONEY.search(snippet):
                candidates.append(snippet)
        if not candidates and MONEY.search(text):
            for match in list(MONEY.finditer(text))[:50]:
                candidates.append(text[max(0, match.start() - 140):match.end() + 80])
        page['priceRows'] = list(dict.fromkeys(candidates))[:150]
        page['structuredOffers'] = page['structuredOffers'][:150]
        page['textLength'] = len(text)
        if len(text) < 120 and not page['priceRows']:
            page['reviewRequired'] = 'javascript_or_empty_page'
        if page['embeddedMenus'] and not page['priceRows']:
            page['reviewRequired'] = 'embedded_price_menu'
        return page
    except (ValueError, TypeError) as exc:
        return {**page, 'reviewRequired': 'parse_error', 'reason': type(exc).__name__}


def audit_host(host, records, root, max_extra):
    cache_dir = root / 'http-cache'
    cache_dir.mkdir(parents=True, exist_ok=True)
    fetcher, pages, pending, seen, deferred = Fetcher(cache_dir), [], [], set(), set()
    base = 'https://' + host
    allowed_hosts = {host.removeprefix('www.')}
    robots_result = fetcher.fetch(base + '/robots.txt', allowed_hosts)
    robots = urllib.robotparser.RobotFileParser()
    if robots_result.get('status') == 200:
        robots.parse(robots_result.get('body', '').splitlines())
    elif robots_result.get('status') == 404:
        robots.allow_all = True
    else:
        return {'host': host, 'status': 'robots_unavailable_or_restricted', 'robotsStatus': robots_result.get('status'), 'pages': [], 'records': [r['id'] for r in records], 'networkRequests': fetcher.network_requests}
    delay = robots.crawl_delay(AGENT) or robots.crawl_delay('*') or 0
    if delay > 15:
        return {'host': host, 'status': 'crawl_delay_requires_manual_review', 'pages': [], 'records': [r['id'] for r in records], 'networkRequests': fetcher.network_requests}
    # Each actual record's official URL is a seed, not only the first homepage.
    for row in records:
        for url in [row.get('website'), row.get('verification', {}).get('booking', {}).get('url'), row.get('booking', {}).get('url')]:
            safe = safe_url(url) if url else None
            if safe and urllib.parse.urlsplit(safe).hostname.removeprefix('www.') in allowed_hosts:
                pending.append((safe, True))
    pending = list(dict.fromkeys(pending))
    extra = 0
    while pending:
        url, seed = pending.pop(0)
        if url in seen:
            continue
        if not seed and extra >= max_extra:
            deferred.add(url)
            continue
        seen.add(url)
        if not robots.can_fetch(AGENT, url):
            pages.append({'url': url, 'status': 'robots_disallowed'})
            continue
        if delay:
            time.sleep(max(0, delay - (time.monotonic() - fetcher.last_start)))
        result = fetcher.fetch(url, allowed_hosts)
        page = read_page(result)
        pages.append(page)
        if not seed:
            extra += 1
        if page.get('status') in (429, 503):
            break  # No retries or bypassing a provider's rate/challenge response.
        for link in sorted(page.get('links', []), key=lambda item: (not bool(re.search(r'цен|price|pricing|tariff|ценоразпис', urllib.parse.unquote(item['url']) + ' ' + item['text'], re.I)), len(item['url']))):
            target = link['url']
            same_host = urllib.parse.urlsplit(target).hostname.removeprefix('www.') in allowed_hosts
            if same_host and target not in seen and not re.search(r'\.(?:jpe?g|png|webp|zip|mp4)(?:\?|$)', target, re.I):
                pending.append((target, False))
    return {'host': host, 'status': 'evaluated', 'records': [r['id'] for r in records], 'pages': pages,
            'unvisitedRelevantLinks': sorted(deferred | {url for url, _ in pending if url not in seen}),
            'networkRequests': fetcher.network_requests, 'robotsChecked': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inventory', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--extra-pages-per-host', type=int, default=8)
    args = parser.parse_args()
    if not 1 <= args.workers <= 4 or not 1 <= args.extra_pages_per_host <= 12:
        parser.error('Bound audit concurrency to 1–4 hosts and 1–12 extra pages per host')
    root = Path(args.output).resolve()
    root.mkdir(parents=True, exist_ok=True)
    records = json.loads(Path(args.inventory).read_text())['records']
    groups = {}
    for row in records:
        website = safe_url(row.get('website', ''))
        if website:
            groups.setdefault(urllib.parse.urlsplit(website).hostname, []).append(row)
    done = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(audit_host, host, rows, root, args.extra_pages_per_host): host for host, rows in groups.items()}
        for future in concurrent.futures.as_completed(futures):
            host = futures[future]
            try:
                report = future.result()
            except Exception as exc:
                report = {'host': host, 'status': 'audit_error', 'reason': type(exc).__name__, 'pages': [], 'records': [r['id'] for r in groups[host]]}
            (root / (host + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
            done.append(report)
            if len(done) % 10 == 0 or len(done) == len(groups):
                print(json.dumps({'hostsEvaluated': len(done), 'hostsTotal': len(groups), 'pages': sum(len(r['pages']) for r in done), 'priceCandidateHosts': sum(any(p.get('priceRows') or p.get('structuredOffers') for p in r['pages']) for r in done)}), flush=True)
    by_host = {r['host']: r for r in done}
    audit = []
    for row in records:
        website = safe_url(row.get('website', ''))
        host_report = by_host.get(urllib.parse.urlsplit(website).hostname) if website else None
        pages = host_report.get('pages', []) if host_report else []
        candidates = [p['url'] for p in pages if p.get('priceRows') or p.get('structuredOffers')]
        accessible = any(p.get('status') == 200 and not p.get('reviewRequired') for p in pages)
        audit.append({'id': row['id'], 'name': row['name'], 'source': row['source'], 'ownerManaged': row.get('ownerManaged', False),
                      'website': website, 'websiteAccessed': accessible,
                      'status': 'no_valid_website' if not website else host_report['status'] if host_report['status'] != 'evaluated' else 'price_candidates_require_review' if candidates else 'no_public_price_found_in_checked_pages' if accessible else 'inaccessible_or_rendering_required',
                      'existingServices': len(row.get('services', [])),
                      'existingPrices': sum(s.get('price') is not None for s in row.get('services', [])),
                      'priceCandidatePages': candidates,
                      'attemptedPages': [{'url': p['url'], 'status': p['status'], **({'reviewRequired': p['reviewRequired']} if p.get('reviewRequired') else {})} for p in pages]})
    final = {'recordsEvaluated': len(audit), 'validWebsiteRecords': sum(bool(r['website']) for r in audit), 'websiteAccessedRecords': sum(r['websiteAccessed'] for r in audit),
             'priceCandidateRecords': sum(bool(r['priceCandidatePages']) for r in audit), 'importedAutomatically': 0,
             'notice': 'Every inventory row evaluated. Website discovery is automated and bounded; candidate prices are not verified or imported. Branch scope, units, currencies, promotions, PDFs, dynamic pages and remaining relevant links require review.', 'records': audit}
    (root / 'report.json').write_text(json.dumps(final, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in final.items() if k != 'records'}), flush=True)


if __name__ == '__main__':
    main()
