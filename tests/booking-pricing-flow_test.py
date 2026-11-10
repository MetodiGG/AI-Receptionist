import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('booking_price_audit', ROOT / 'scripts/audit-booking-price-flows.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class BookingPricingFlowTest(unittest.TestCase):
    def test_only_exact_owner_or_linked_owner_subdomains_are_owned(self):
        self.assertTrue(audit.owned_url('https://reservation.business.bg/appointment', 'business.bg'))
        for value in ['https://business.bg.attacker.com/book', 'https://anotherbusiness.bg/book', 'https://127.0.0.1/book', 'https://business.bg/?token=secret']:
            self.assertFalse(audit.owned_url(value, 'business.bg'))

    def test_actual_booking_seeds_are_first_not_a_guessed_booking_route(self):
        row = {'website': 'https://business.bg/', 'booking': {'url': 'https://reservation.business.bg/select'}, 'verification': {'booking': {'url': 'https://business.bg/uslugi'}}}
        self.assertEqual(audit.record_seeds(row)[0], ('https://reservation.business.bg/select', 'booking'))
        self.assertEqual(audit.purpose('https://business.bg/zapazi-chas'), 'booking')
        self.assertEqual(audit.purpose('https://business.bg/ceni'), 'pricing')

    def test_booking_subdomain_is_checked_but_third_party_and_form_actions_are_not_requested(self):
        calls = []
        class FakeFetcher:
            network_requests = 0
            last_start = 0
            def __init__(self, *args):
                pass
            def fetch(self, url, redirect_hosts=None, can_fetch=None):
                calls.append(url)
                if url.endswith('/robots.txt'):
                    return {'url': url, 'status': 404}
                return {'url': url, 'status': 200, 'contentType': 'text/html', 'body': '<a href="https://reservation.business.bg/select">Запази час</a><a href="https://booking-provider.example/book/business">Запази онлайн</a><a href="/ceni">Цени</a><form action="/create-reservation"></form><p>Услуга 30 евро</p>'}
        row = {'id': 'sofia-fixture', 'website': 'https://business.bg/', 'booking': {'url': 'https://reservation.business.bg/select'}}
        with tempfile.TemporaryDirectory() as directory, patch.object(audit.site, 'Fetcher', FakeFetcher):
            report = audit.audit_owner('business.bg', [row], Path(directory), 2)
        self.assertIn('https://reservation.business.bg/select', calls)
        self.assertIn('https://business.bg/', calls)
        self.assertIn('https://business.bg/ceni', calls)
        self.assertFalse(any('booking-provider' in url or 'create-reservation' in url for url in calls))
        self.assertEqual(report['deferred'][0]['reason'], 'third_party_booking_manual_review')
        self.assertFalse(report['humanReviewed'])
        self.assertTrue(any(page.get('priceRows') for page in report['pages']))

    def test_robots_denial_leaves_a_manual_review_not_a_fake_completed_price_check(self):
        calls = []
        class DeniedFetcher:
            network_requests = 0
            last_start = 0
            def __init__(self, *args):
                pass
            def fetch(self, url, *args):
                calls.append(url)
                return {'url': url, 'status': 200, 'contentType': 'text/plain', 'body': 'User-agent: *\nDisallow: /'}
        row = {'id': 'sofia-fixture', 'website': 'https://business.bg/'}
        with tempfile.TemporaryDirectory() as directory, patch.object(audit.site, 'Fetcher', DeniedFetcher):
            report = audit.audit_owner('business.bg', [row], Path(directory), 2)
        self.assertTrue(all(url.endswith('/robots.txt') for url in calls))
        self.assertEqual(report['pages'][0]['status'], 'robots_disallowed')
        self.assertFalse(report['humanReviewed'])


if __name__ == '__main__':
    unittest.main()
