# Auto, sport and home expansion v2 — source index

Checked 2026-11-06; recheck by 2027-02-04. 25 new records: 4 appointment car washes, 8 detailing studios, 8 auto repair premises and 5 reserved sport providers. Each row retains explicit first-party appointment evidence and a public phone or owner-linked appointment request. This index is not permission to copy photographs, ratings or calendars.

No self-service car washes, ordinary gym admission, retail visits or outside-Sofia branches were added. Additional repeated departments at the same premises were not counted as new businesses. Neighborhoods/points not supported by the owner remain null. Three owner-published coordinates are retained separately from the later licensed OSM address layer. No paid provider calls, reservations, contact submissions, account creation or live database writes were made.

| Record | Category | Appointment evidence | Contact source | Action |
| --- | --- | --- | --- | --- |
| sofia-motorista-carwash | car_wash | [Owner evidence](https://www.motorista.bg/avtomivka) | [Contact](https://www.motorista.bg/avtomivka) | form |
| sofia-lux-mbal-sveta-sofia-carwash | car_wash | [Owner evidence](https://www.mbal-sofia.com/services/) | [Contact](https://www.mbal-sofia.com/contacts/) | phone |
| sofia-superior-pickup-carwash | car_wash | [Owner evidence](https://detailingsuperior.online/) | [Contact](https://detailingsuperior.online/) | form |
| sofia-wash-go-detailing | car_wash | [Owner evidence](https://washandgodetail.com/contact) | [Contact](https://washandgodetail.com/contact) | phone |
| sofia-topchiev-detailed | detailing | [Owner evidence](https://topchievdetailed.com/) | [Contact](https://topchievdetailed.com/) | phone |
| sofia-carkings | detailing | [Owner evidence](https://carkings.bg/b2c/services/full-detailing) | [Contact](https://carkings.bg/b2c/services/full-detailing) | phone |
| sofia-signature-detailing | detailing | [Owner evidence](https://signaturedetailing.bg/) | [Contact](https://signaturedetailing.bg/) | phone |
| sofia-carbox-studio | detailing | [Owner evidence](https://carboxbg.com/) | [Contact](https://carboxbg.com/zapishi-chas/) | phone |
| sofia-speed-garage-sofia | auto_repair | [Owner evidence](https://www.speedgarages.com/) | [Contact](https://www.speedgarages.com/) | phone |
| sofia-factor-detailing | detailing | [Owner evidence](https://factordetailing.com/tseni/) | [Contact](https://factordetailing.com/nashite-obekti/) | phone |
| sofia-nhs-detailing | detailing | [Owner evidence](https://www.nhsdetailingsofia.com/) | [Contact](https://www.nhsdetailingsofia.com/) | phone |
| sofia-cosmos-detailing | detailing | [Owner evidence](https://cosmosgarage.bg/) | [Contact](https://cosmosgarage.bg/) | phone |
| sofia-virage-details | detailing | [Owner evidence](https://viragedetails.com/) | [Contact](https://viragedetails.com/) | phone |
| sofia-sarafovi-auto | auto_repair | [Owner evidence](https://sarafoviauto.bg/bg/book) | [Contact](https://sarafoviauto.bg/bg/book) | form |
| sofia-gumi-slick-krasna-polyana | auto_repair | [Owner evidence](https://gumi-slick.eu/) | [Contact](https://gumi-slick.eu/) | form |
| sofia-gumi-slick-simeonovsko | auto_repair | [Owner evidence](https://gumi-slick.eu/) | [Contact](https://gumi-slick.eu/) | form |
| sofia-sandi-auto | auto_repair | [Owner evidence](https://sandiautoshop.bg/zapazi-chas/) | [Contact](https://sandiautoshop.bg/zapazi-chas/) | form |
| sofia-clean-ride-autoservice | auto_repair | [Owner evidence](https://carsrepair.bg/contact/) | [Contact](https://carsrepair.bg/contact/) | phone |
| sofia-drivealot | auto_repair | [Owner evidence](https://drivealot.bg/appointment/) | [Contact](https://drivealot.bg/appointment/) | form |
| sofia-auto-park-solutions | auto_repair | [Owner evidence](https://autoparksolutions.bg/) | [Contact](https://autoparksolutions.bg/) | phone |
| sofia-cherven-bryag-boxing-sofia | fitness | [Owner evidence](https://club.boxingnasri.bg/) | [Contact](https://club.boxingnasri.bg/) | phone |
| sofia-steel-style-boxing | fitness | [Owner evidence](https://boksovatazala.com/) | [Contact](https://boksovatazala.com/) | phone |
| sofia-sila-karate-children | fitness | [Owner evidence](https://sportclubsila.com/карате-за-деца/) | [Contact](https://sportclubsila.com/kontakti/) | phone |
| sofia-heal-fit-gymnastics | fitness | [Owner evidence](https://healfit.bg/kontakti?paket=individualna-trenirovka) | [Contact](https://healfit.bg/kontakti?paket=individualna-trenirovka) | phone |
| sofia-xzona-sport | fitness | [Owner evidence](https://xzonasport.com/za-trenirovkata/) | [Contact](https://xzonasport.com/za-trenirovkata/) | form |

Run `pnpm catalogue:check` and the full test suite after integration; compare IDs, normalized public phone + address and owner host + address against the full catalogue, not just this file.
