import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pricing_extractor', ROOT / 'scripts/extract-pricing-candidates.py')
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)
audit_spec = importlib.util.spec_from_file_location('website_audit', ROOT / 'scripts/audit-business-pricing.py')
audit = importlib.util.module_from_spec(audit_spec)
audit_spec.loader.exec_module(audit)


class PricingExtractionTest(unittest.TestCase):
    def test_literal_prices_do_not_convert_currency_or_invent_totals(self):
        self.assertEqual(extractor.literal_price('Услуга от 15,50 EUR'), {'amount': 15.5, 'currency': 'EUR', 'kind': 'from'})
        self.assertEqual(extractor.literal_price('Услуга 20–40 €'), {'amount': 20, 'maximum': 40, 'currency': 'EUR', 'kind': 'range'})
        self.assertEqual(extractor.literal_price('Услуга 30 лв.'), {'amount': 30, 'currency': 'BGN', 'kind': 'fixed'})
        self.assertIsNone(extractor.literal_price('Услуга 10 €, друга 20 €'))
        self.assertIsNone(extractor.literal_price('Депозит 30 €'))
        self.assertIsNone(extractor.literal_price('Промоция 30 €'))
        self.assertIsNone(extractor.literal_price('Неизвестна цена'))
        self.assertEqual(extractor.literal_price('PPF 800 – 1 400 €'), {'amount': 800, 'maximum': 1400, 'currency': 'EUR', 'kind': 'range'})
        self.assertEqual(extractor.literal_price('PPF от 2\u202f500 €'), {'amount': 2500, 'currency': 'EUR', 'kind': 'from'})
        self.assertIsNone(extractor.literal_price('Код CANIV4 EUR'))
        self.assertEqual(extractor.literal_price('Цялостен груминг от 45 евро'), {'amount': 45, 'currency': 'EUR', 'kind': 'from'})
        self.assertEqual(extractor.literal_price('Маска от 20 лв/10 евро'), {'amount': 10, 'currency': 'EUR', 'kind': 'from'})
        self.assertEqual(extractor.literal_price('Пигмент 1€ / нокът'), {'amount': 1, 'currency': 'EUR', 'kind': 'fixed', 'unit': 'нокът'})
        self.assertEqual(extractor.literal_price('Груминг от 40 до 120 €'), {'amount': 40, 'maximum': 120, 'currency': 'EUR', 'kind': 'range'})
        self.assertEqual(extractor.literal_price('Подстригване 20 евро 20 €'), {'amount': 20, 'currency': 'EUR', 'kind': 'fixed'})
        self.assertIsNone(extractor.literal_price('Вариант А 20 евро, вариант Б 20 €'))
        self.assertEqual(extractor.literal_price('Консултация от €80'), {'amount': 80, 'currency': 'EUR', 'kind': 'from'})
        self.assertEqual(extractor.literal_price('Терапия €80–100'), {'amount': 80, 'maximum': 100, 'currency': 'EUR', 'kind': 'range'})
        self.assertEqual(extractor.literal_price('Почистване от 270лв (€138.04)'), {'amount': 138.04, 'currency': 'EUR', 'kind': 'from'})

    def test_hours_and_minutes_are_not_silently_shortened(self):
        for value, minutes in [('2ч 30мин', 150), ('1 час', 60), ('3 часа', 180), ('1ч 20мин', 80), ('45 мин', 45), ('90 минути', 90)]:
            self.assertEqual(extractor.duration(value), minutes, value)
        self.assertIsNone(extractor.duration('30 мин или 60 мин'))
        self.assertIsNone(extractor.duration('30 €'))

    def test_explicit_service_rows_keep_their_own_price(self):
        body = '<table><tr><td>Подстригване</td><td>20 €</td></tr><tr><td>Брада</td><td>10 €</td></tr></table>'
        values = extractor.extract(body, 'https://business.bg/prices')
        self.assertEqual([(v['name'], v['price']['amount']) for v in values], [('Подстригване', 20), ('Брада', 10)])

    def test_grade_and_duration_numbers_do_not_become_the_price(self):
        body = '<table><tr><td>Dental scaling — grade 1</td><td>€55.00</td></tr><tr><td>Dental scaling — grade 3–4</td><td>€75.00</td></tr></table>'
        values = extractor.extract(body, 'https://business.bg/prices')
        self.assertEqual([(v['name'], v['price']['amount']) for v in values], [('Dental scaling — grade 1', 55), ('Dental scaling — grade 3–4', 75)])
        self.assertTrue(all(v['price']['kind'] == 'fixed' for v in values))
        self.assertIsNone(extractor.literal_price('Dental scaling — grade 1 €55.00'))
        self.assertIsNone(extractor.literal_price('Керамика 36€2 часа'))

    def test_structured_data_alone_is_not_a_verified_visible_price(self):
        body = '<script type="application/ld+json">{"@type":"Service","name":"Маникюр","offers":{"@type":"Offer","price":20,"priceCurrency":"EUR"}}</script><p>Маникюр</p>'
        self.assertEqual(extractor.extract(body, 'https://business.bg/prices'), [])

    def test_action_links_and_non_public_or_google_destinations_are_not_crawl_targets(self):
        for url in ['https://business.bg/?add-to-cart=1', 'https://business.bg/cart', 'https://business.bg/?action=delete', 'https://business.bg/logout', 'https://business.bg/?token=abc', 'https://127.0.0.1/prices', 'https://maps.google.com/', 'https://example.local/']:
            self.assertIsNone(audit.safe_url(url), url)
        self.assertEqual(audit.safe_url('https://business.bg/цени/'), 'https://business.bg/%D1%86%D0%B5%D0%BD%D0%B8/')
        self.assertEqual(audit.safe_url('https://book.timify.com/?accountId=123'), 'https://book.timify.com/?accountId=123')

    def test_booking_links_include_transliterated_routes_and_public_frames_without_forms(self):
        page = audit.read_page({'url': 'https://business.bg/', 'status': 200, 'contentType': 'text/html', 'body': '<a href="/zapazi-chas">Запази</a><a href="/ceni">Цени</a><iframe title="Записване" src="https://reservation.business.bg/"></iframe><iframe src="https://www.googletagmanager.com/track"></iframe><form method="post" action="/create-reservation"></form>'})
        self.assertEqual({link['url'] for link in page['bookingLinks']}, {'https://business.bg/zapazi-chas', 'https://reservation.business.bg/'})
        self.assertTrue(page['hasPublicForm'])
        self.assertFalse(any('create-reservation' in item['url'] or 'googletagmanager' in item['url'] for item in page['links']))

    def test_embedded_price_tables_require_rendered_review_without_storing_session_urls(self):
        page = audit.read_page({'url': 'https://business.bg/prices', 'status': 200, 'contentType': 'text/html', 'body': '<h1>Ценоразпис</h1><iframe title="Table Master" src="https://table.vendor.org/?instance=private-viewer-token"></iframe>'})
        self.assertEqual(page['reviewRequired'], 'embedded_price_menu')
        self.assertEqual(page['embeddedMenus'], [{'provider': 'table.vendor.org', 'title': 'Table Master'}])
        self.assertNotIn('private-viewer-token', str(page))


if __name__ == '__main__':
    unittest.main()
