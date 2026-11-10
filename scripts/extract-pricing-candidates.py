"""Offline literal extraction from the website audit cache, not an importer.

Only directly paired service/price rows and named, visibly corroborated offers
are candidates. Products, deposits, ambiguous prices and branch scope still
require review before an explicit catalogue enrichment manifest is produced.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from lxml import html

AMOUNT = r'(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,]\d{1,2})?'
MONEY = re.compile(rf'(?<![\w.,])(?P<low>{AMOUNT})(?:\s*(?:[–—-]|до\b|to\b)\s*(?P<high>{AMOUNT}))?\s*(?P<currency>€|EUR\b|евро\b|лв\.?|BGN\b)', re.I)
EXCLUDE = re.compile(r'депозит|капаро|deposit|отстъп|промо|discount|намален|купон|coupon|ваучер|voucher|подаръч|gift|доставка|shipping', re.I)


def norm(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).casefold() if c.isalnum())


def text(node):
    return re.sub(r'\s+', ' ', ' '.join(node.itertext())).strip()


def literal_price(value):
    # Normalize notation only, never currency/amount: "€80" is "80 €".
    prefix = re.compile(rf'(€|\bEUR\b)\s*({AMOUNT}(?:\s*(?:[–—-]|до\b|to\b)\s*{AMOUNT})?)(?![\w.,])', re.I)
    suffixes = list(MONEY.finditer(value))
    # "grade 1 €55" and flattened "36€2 hours" have two numbers touching
    # the same currency symbol. Do not guess which one is the tariff. Table
    # extraction below isolates the actual price cells before parsing them.
    if any(suffix.start('currency') == match.start(1) for match in prefix.finditer(value) for suffix in suffixes):
        return None
    value = prefix.sub(lambda match: f'{match[2]} {match[1]}', value)
    matches = list(MONEY.finditer(value))
    if not matches or EXCLUDE.search(value):
        return None
    euros = [m for m in matches if m['currency'].upper() in ('€', 'EUR', 'ЕВРО')]
    selected = euros or matches
    # Wix often renders the same amount twice ("20 евро 20 €"). This is
    # one literal price only when the repetitions touch with whitespace and
    # have exactly the same amount/range; never merge labelled alternatives.
    if len(selected) > 1 and all((m['low'], m['high']) == (selected[0]['low'], selected[0]['high']) for m in selected) and all(not value[a.end():b.start()].strip() for a, b in zip(selected, selected[1:])):
        selected = selected[:1]
    if len(selected) != 1:
        return None
    match = selected[0]
    amount = float(re.sub(r'\s', '', match['low']).replace(',', '.'))
    if not 0 < amount <= 1_000_000:
        return None
    # A literal dual-currency pair may share one starting-price qualifier.
    # Do not turn "от 20 лв / 10 евро" into a fixed EUR price or convert it.
    basis = match
    if len(matches) == 2 and len(euros) == 1 and matches[0] != match and re.fullmatch(r'\s*[/|()]\s*', value[matches[0].end():match.start()]):
        basis = matches[0]
    before = value[max(0, basis.start() - 8):basis.start()]
    price = {'amount': amount, 'currency': 'EUR' if euros else 'BGN', 'kind': 'from' if re.search(r'(?:от|from)\s*$', before, re.I) else 'fixed'}
    if match['high']:
        maximum = float(re.sub(r'\s', '', match['high']).replace(',', '.'))
        if maximum < amount:
            return None
        price.update(kind='range', maximum=maximum)
    after = value[match.end():]
    unit = re.match(r'\s*/\s*(м²|м2|кв\.?\s*м\.?|час|часа|посещение|бр\.?|нокът|седалка|m²|m2|hour|visit)\b', after, re.I)
    if unit:
        price['unit'] = unit[1]
    return price


def duration(value):
    matches = list(re.finditer(r'(?<!\d)(?:(\d{1,2})\s*(?:час(?:а|ове)?|ч\.?|hours?|h)(?=\s|\d|$)\s*(?:(\d{1,3})\s*(?:мин(?:ути)?|min(?:utes)?)(?!\w))?|(\d{1,3})\s*(?:мин(?:ути)?|min(?:utes)?)(?!\w))', value, re.I))
    if len(matches) != 1:
        return None
    match = matches[0]
    minutes = int(match[1] or 0) * 60 + int(match[2] or match[3] or 0)
    return minutes if 0 < minutes <= 1440 else None


def extract(body, url):
    tree = html.fromstring(body)
    offers = []
    def walk(value, parent_name='', parent_kind='', context=''):
        if isinstance(value, list):
            for item in value:
                walk(item, parent_name, parent_kind, context)
        elif isinstance(value, dict):
            kind = value.get('@type', '')
            kind = ' '.join(kind) if isinstance(kind, list) else str(kind)
            offered = value.get('itemOffered') if isinstance(value.get('itemOffered'), dict) else {}
            name = offered.get('name') or value.get('name') or parent_name
            next_context = str(value.get('name') or context) if 'OfferCatalog' in kind else context
            if ('price' in value or 'lowPrice' in value) and 'Product' not in parent_kind and 'Product' not in str(offered.get('@type', '')):
                if isinstance(name, str) and ('Service' in str(offered.get('@type', '')) or 'Service' in parent_kind or (value.get('name') and 'Offer' in kind)):
                    offers.append({'name': re.sub(r'\s+', ' ', name).strip(), 'offer': value, 'context': next_context})
            for key, child in value.items():
                if isinstance(child, (dict, list)):
                    walk(child, str(name), kind or parent_kind, next_context)
    for script in tree.xpath('//script[@type="application/ld+json"]'):
        try:
            walk(json.loads(script.text or ''))
        except (ValueError, TypeError, RecursionError):
            continue
    for item in tree.xpath('//script|//style|//noscript|//svg|//nav|//header|//footer'):
        item.drop_tree()
    candidates = []
    rows = tree.xpath('//tr|//li|//article|//*[contains(@class,"srv-row") or contains(@class,"service-row") or contains(@class,"price-row") or contains(@class,"price-item") or contains(@class,"service-item")]')
    for row in rows:
        value = text(row)
        if not 5 < len(value) < 800 or row.xpath('.//del|.//s'):
            continue
        cells = row.xpath('./td|./th')
        # Service names can contain numbers (grade 1, 3–4, size 10 kg).
        # They are not part of the tariff and must not bind to a leading €.
        price_text = ' '.join(text(cell) for cell in cells[1:]) if len(cells) >= 2 else value
        price = literal_price(price_text)
        if not price:
            continue
        names = cells[:1] if len(cells) >= 2 else row.xpath('.//*[contains(@class,"name") or contains(@class,"title") or self::h3 or self::h4]')
        name = text(names[0]) if names else ''
        if not 3 <= len(name) <= 200 or MONEY.search(name) or EXCLUDE.search(name):
            continue
        candidates.append({'name': name, 'price': price, 'sourceUrl': url, 'method': 'literal_service_row', 'context': value[:800], **({'durationMin': duration(value)} if duration(value) else {})})
    for offer in offers:
        name, value = offer['name'], offer['offer']
        if not 3 <= len(name) <= 200 or EXCLUDE.search(name) or value.get('priceCurrency') not in ('EUR', 'BGN'):
            continue
        expires = str(value.get('validThrough') or '')[:10]
        if expires and expires < '2026-11-10':
            continue
        amount = value.get('price', value.get('lowPrice'))
        try:
            amount = float(str(amount).replace(',', '.'))
        except ValueError:
            continue
        if not 0 < amount <= 1_000_000:
            continue
        matching = tree.xpath('//*[not(self::html or self::body) and not(*)]')
        for leaf in matching:
            if norm(name) not in norm(text(leaf)):
                continue
            node = leaf
            for _ in range(4):
                if node is None:
                    break
                rendered = text(node)
                if len(rendered) > 1800:
                    break
                price = literal_price(rendered)
                if price and price['currency'] == value['priceCurrency'] and price['amount'] == amount and not node.xpath('.//del|.//s'):
                    if 'lowPrice' in value and 'price' not in value and 'highPrice' not in value:
                        price['kind'] = 'from'
                    if value.get('highPrice') is not None:
                        try:
                            high = float(str(value['highPrice']).replace(',', '.'))
                        except ValueError:
                            break
                        if price.get('maximum') != high:
                            break
                    candidates.append({'name': name, 'price': price, 'sourceUrl': url, 'method': 'visible_named_service_offer', 'context': rendered[:800], 'section': offer['context'], **({'durationMin': duration(rendered)} if duration(rendered) else {})})
                    break
                node = node.getparent()
            else:
                continue
            if candidates and candidates[-1]['name'] == name:
                break
    unique = {}
    for candidate in candidates:
        key = json.dumps([norm(candidate['name']), candidate['price']], sort_keys=True)
        unique.setdefault(key, candidate)
    return list(unique.values())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audit', required=True)
    parser.add_argument('--cache', help='Optional shared HTTP cache used by the booking-flow audit')
    args = parser.parse_args()
    root = Path(args.audit)
    reports = []
    for path in sorted(root.glob('*.json')):
        if path.name in ('report.json', 'price-candidates.json'):
            continue
        report = json.loads(path.read_text())
        host = report.get('host') or report.get('owner')
        if not host:
            continue
        candidates = []
        for page in report.get('pages', []):
            if page.get('status') != 200 or page.get('reviewRequired') or not (page.get('priceRows') or page.get('structuredOffers')):
                continue
            cache = (Path(args.cache) if args.cache else root / 'http-cache') / (hashlib.sha256(page['url'].encode()).hexdigest() + '.json')
            if not cache.exists():
                continue
            result = json.loads(cache.read_text())
            if result.get('contentType') not in ('text/html', 'application/xhtml+xml'):
                continue
            for candidate in extract(result['body'], page['url']):
                candidates.append(candidate)
        unique = {json.dumps([norm(c['name']), c['price'], c['sourceUrl']], sort_keys=True): c for c in candidates}
        reports.append({'host': host, 'businessIds': report.get('records', report.get('businessIds', [])), 'candidates': list(unique.values())})
    output = {'notice': 'OFFLINE CANDIDATES ONLY. No business or price is automatically imported. Source/branch/appointment scope and conflicting prices require review.', 'hosts': reports}
    (root / 'price-candidates.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'hosts': len(reports), 'candidateHosts': sum(bool(row['candidates']) for row in reports), 'candidates': sum(len(row['candidates']) for row in reports)}))


if __name__ == '__main__':
    main()
