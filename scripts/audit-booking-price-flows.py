"""Bounded public booking-first audit. Candidates, never verified price imports.

Follows official booking entries, relevant pages and linked owner subdomains.
Third-party booking platforms are recorded for manual, terms-aware review.
No browser automation, login, form submission, Google, AI or live DB writes.
"""
import argparse
import concurrent.futures
import importlib.util
import json
import re
import time
import urllib.parse
import urllib.robotparser
from pathlib import Path

spec = importlib.util.spec_from_file_location('pricing_site_audit', Path(__file__).with_name('audit-business-pricing.py'))
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


def hostname(url):
    return (urllib.parse.urlsplit(url).hostname or '').removeprefix('www.')


def owned_url(url, owner):
    return bool(site.safe_url(url)) and (hostname(url) == owner or hostname(url).endswith('.' + owner))


def purpose(url, label=''):
    value = urllib.parse.unquote(url) + ' ' + label
    return 'booking' if site.BOOKING.search(value) else 'pricing' if site.PRICING.search(value) else 'services' if re.search(r'услуг|service|uslug|menu', value, re.I) else 'contact'


def record_seeds(row):
    choices = [(row.get('booking', {}).get('url'), 'booking'),
               (row.get('verification', {}).get('booking', {}).get('url'), 'booking'),
               (row.get('website'), 'official')]
    return list(dict.fromkeys((safe, kind) for url, kind in choices if url and (safe := site.safe_url(url))))


def audit_owner(owner, rows, cache, budget):
    fetcher = site.Fetcher(cache)
    robots, blocked = {}, {}
    pages, pending, seen, deferred = [], [], set(), {}
    allowed = {owner}

    def permitted(url):
        host = hostname(url)
        if host not in allowed:
            return False
        if host not in robots and host not in blocked:
            origin = urllib.parse.urlsplit(url)
            response = fetcher.fetch(f'{origin.scheme}://{origin.netloc}/robots.txt', {host})
            parser = urllib.robotparser.RobotFileParser()
            if response.get('status') == 404:
                parser.allow_all = True
            elif response.get('status') == 200:
                parser.parse(response.get('body', '').splitlines())
            else:
                blocked[host] = f"robots_unavailable:{response.get('status')}"
                return False
            delay = parser.crawl_delay(site.AGENT) or parser.crawl_delay('*') or 0
            if delay > 15:
                blocked[host] = 'crawl_delay_requires_manual_review'
                return False
            robots[host] = (parser, delay)
        if host in blocked:
            return False
        parser, delay = robots[host]
        if delay:
            time.sleep(max(0, delay - (time.monotonic() - fetcher.last_start)))
        return parser.can_fetch(site.AGENT, url)

    def enqueue(url, kind, parent=None, depth=0):
        safe = site.safe_url(url)
        if not safe:
            return
        if not owned_url(safe, owner):
            if kind == 'booking':
                deferred[safe] = {'url': safe, 'purpose': kind, 'linkedFrom': parent, 'reason': 'third_party_booking_manual_review'}
            return
        if safe not in seen and not any(item['url'] == safe for item in pending):
            allowed.add(hostname(safe))
            pending.append({'url': safe, 'purpose': kind, 'linkedFrom': parent, 'depth': depth})

    for row in rows:
        for url, kind in record_seeds(row):
            enqueue(url, kind)
    # Every actual seed is checked, including separate branch landing pages.
    seed_count = len(pending)
    limit = seed_count + budget
    while pending and len(seen) < limit:
        pending.sort(key=lambda item: (item['depth'] > 0, {'booking': 0, 'pricing': 1, 'official': 2, 'services': 3, 'contact': 4}[item['purpose']], item['depth']))
        item = pending.pop(0)
        url = item['url']
        if url in seen:
            continue
        seen.add(url)
        if not permitted(url):
            pages.append({**item, 'status': blocked.get(hostname(url), 'robots_disallowed')})
            continue
        page = {**site.read_page(fetcher.fetch(url, allowed, permitted)), 'purpose': item['purpose'], 'linkedFrom': item['linkedFrom'], 'depth': item['depth']}
        pages.append(page)
        if page.get('status') in (429, 503) or page.get('reviewRequired') == 'access_control_or_challenge':
            blocked[hostname(url)] = 'rate_limit_or_access_challenge'
            continue
        if item['depth'] >= 3 or page.get('reviewRequired') == 'public_pdf_menu':
            continue
        for link in page.get('links', []):
            if re.search(r'\.(?:jpe?g|png|webp|zip|mp4)(?:\?|$)', link['url'], re.I):
                continue
            enqueue(link['url'], purpose(link['url'], link['text']), page.get('finalUrl', url), item['depth'] + 1)
    for item in pending:
        deferred.setdefault(item['url'], {**item, 'reason': 'page_budget_manual_review'})
    return {'owner': owner, 'businessIds': [row['id'] for row in rows], 'pages': pages,
            'deferred': list(deferred.values()), 'networkRequests': fetcher.network_requests,
            'humanReviewed': False, 'notice': 'Public read-only discovery only. A reviewer must inspect branch/staff/units and the actual booking UI before any price import.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inventory', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--cache', required=True)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--extra-pages', type=int, default=12)
    args = parser.parse_args()
    if not 1 <= args.workers <= 4 or not 1 <= args.extra_pages <= 20:
        parser.error('Use 1–4 independent hosts and 1–20 extra pages per owner')
    output, cache = Path(args.output).resolve(), Path(args.cache).resolve()
    output.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    rows = json.loads(Path(args.inventory).read_text())['records']
    groups = {}
    for row in rows:
        if site.safe_url(row.get('website', '')):
            groups.setdefault(hostname(row['website']), []).append(row)
    reports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(audit_owner, owner, records, cache, args.extra_pages): (owner, records) for owner, records in groups.items()}
        for future in concurrent.futures.as_completed(futures):
            owner, records = futures[future]
            try:
                report = future.result()
            except Exception as exc:
                report = {'owner': owner, 'businessIds': [r['id'] for r in records], 'pages': [], 'deferred': [], 'humanReviewed': False, 'error': type(exc).__name__}
            (output / (owner + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
            reports.append(report)
            if len(reports) % 10 == 0 or len(reports) == len(groups):
                print(json.dumps({'owners': len(reports), 'total': len(groups), 'networkRequests': sum(r.get('networkRequests', 0) for r in reports)}), flush=True)
    by_owner = {r['owner']: r for r in reports}
    businesses = []
    for row in rows:
        report = by_owner.get(hostname(row.get('website', '')), {})
        pages = report.get('pages', [])
        businesses.append({'id': row['id'], 'name': row['name'], 'website': row.get('website'),
                           'bookingEntry': row.get('booking', {}).get('url'),
                           'checkedUrls': [{k: p[k] for k in ('url', 'status', 'purpose', 'linkedFrom', 'reviewRequired') if k in p} for p in pages],
                           'pricingSignals': [p['url'] for p in pages if p.get('priceRows') or p.get('structuredOffers')],
                           'deferred': report.get('deferred', []), 'humanReviewed': False})
    summary = {'recordsEvaluated': len(rows), 'ownersEvaluated': len(reports),
               'bookingPagesAttempted': sum(p.get('purpose') == 'booking' for r in reports for p in r['pages']),
               'recordsWithPricingSignals': sum(bool(r['pricingSignals']) for r in businesses),
               'networkRequests': sum(r.get('networkRequests', 0) for r in reports), 'automaticImports': 0, 'paidRequests': 0}
    (output / 'report.json').write_text(json.dumps({'summary': summary, 'businesses': businesses}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
