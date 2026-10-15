# Bulgarian location data

`lib/bulgarian-cities.mjs` contains the 257 entries whose `t_v_m` is `гр.` in the National Statistical Institute's National Register of Populated Places (EKATTE), retrieved on 15 October 2026.

Source: [NSI / EKATTE](https://www.nsi.bg/nrnm/ekatte/territorial-units), [JSON download](https://www.nsi.bg/nrnm/ekatte/territorial-units/json?page=1), [NSI reuse licence](https://www.nsi.bg/pages/licenz-za-izpolzvaneto-na-statisticheskata-informaciya-proizvejdana-i-razprostranyavana-ot-nacionalniya-statisticheski-institut-485).

Only city code, original name, official Latin transliteration, region code and region name are retained. The five-digit code distinguishes identically named cities (e.g. Byala in Varna and Ruse regions). Do not deduplicate by name or drop leading zeros. Villages are not included, because this feature requests cities.

Neighbourhoods in `lib/business-location.mjs` are non-exhaustive suggestions for Sofia, Plovdiv, Varna, Burgas, Stara Zagora, Ruse and Pleven. They are not an official cadastral register or verified business addresses. A custom option is available for every city, so missing neighbourhoods never block registration. City changes clear the previous neighbourhood. EN transliterations of neighbourhood suggestions are display labels, not translations of the owner's street address.

Municipal reference examples: [Sofia neighbourhoods and regions](https://youare.sofia.bg/bg/iamlivinginsofia/hello-sofia/regions), [Varna regions](https://www.varna.bg/bg/207), [Burgas neighbourhoods](https://www.burgas.bg/bg/novini/dnes-zapochva-obnovlenie-na-osvetlenieto-v-sarafovo-i-kraymorie-sledvat-oshte-nyakolko-kvartala), [Stara Zagora neighbourhoods](https://www.starazagora.bg/bg/novini/nova-avtobusna-liniya-71-za-parvi-pat-shte-svarzhe-kvartalite-zheleznik-i-zora-sas-stadiona-i-ayazmoto/).

There is no Google Places integration, geocoding request or runtime dependency on NSI. Recheck the source and the count before refreshing this static snapshot.
