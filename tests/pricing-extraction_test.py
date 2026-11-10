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

    def test_hours_and_minutes_are_not_silently_shortened(self):
        for value, minutes in [('2ч 30мин', 150), ('1 час', 60), ('3 часа', 180), ('1ч 20мин', 80), ('45 мин', 45), ('90 минути', 90)]:
            self.assertEqual(extractor.duration(value), minutes, value)
        self.assertIsNone(extractor.duration('30 мин или 60 мин'))
        self.assertIsNone(extractor.duration('30 €'))

    def test_explicit_service_rows_keep_their_own_price(self):
        body = '<table><tr><td>Подстригване</td><td>20 €</td></tr><tr><td>Брада</td><td>10 €</td></tr></table>'
        values = extractor.extract(body, 'https://business.bg/prices')
        self.assertEqual([(v['name'], v['price']['amount']) for v in values], [('Подстригване', 20), ('Брада', 10)])

    def test_structured_data_alone_is_not_a_verified_visible_price(self):
        body = '<script type="application/ld+json">{"@type":"Service","name":"Маникюр","offers":{"@type":"Offer","price":20,"priceCurrency":"EUR"}}</script><p>Маникюр</p>'
        self.assertEqual(extractor.extract(body, 'https://business.bg/prices'), [])

    def test_action_links_and_non_public_or_google_destinations_are_not_crawl_targets(self):
        for url in ['https://business.bg/?add-to-cart=1', 'https://business.bg/cart', 'https://business.bg/?action=delete', 'https://business.bg/logout', 'https://business.bg/?token=abc', 'https://127.0.0.1/prices', 'https://maps.google.com/', 'https://example.local/']:
            self.assertIsNone(audit.safe_url(url), url)
        self.assertEqual(audit.safe_url('https://business.bg/цени/'), 'https://business.bg/%D1%86%D0%B5%D0%BD%D0%B8/')
        self.assertEqual(audit.safe_url('https://book.timify.com/?accountId=123'), 'https://book.timify.com/?accountId=123')


if __name__ == '__main__':
    unittest.main()
