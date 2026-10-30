# Search quality — offline observations

This is a PARTIAL offline evaluation, not completion of the attached Search Engine 2.0 audit. Category labels have one reviewer only; independent candidate judgments are pending. No claims of live Google quality, availability or end-to-end latency.

Fixed clock: 2026-10-30T12:00:00.000+02:00. No network, database, bookings, email or paid API activity.

- Definitions executed through the actual rules parser: 172.
- Parser errors: 0.
- Category recognized: 167/172 (NOT a correctness rate).
- Clarification requested: 17.
- Parser p50/p95: 1.789/2.497 ms, not end-to-end latency.
- Precision@5, relevance, provider counts and actual availability: **unmeasured**, not zero.
- Near-me scenarios have no geolocation consent in this offline run; city fallback observations are not successful geolocation tests.
- Taxonomy currently has Therapies/physiotherapy, not medical-specialty categories. Neurologists, dentists, vets, restaurants and other conditional cases require taxonomy review, not invented automatic classifications.

| ID | Query | Category | Neighborhood | Clarification | E2E status |
| --- | --- | --- | --- | --- | --- |
| GZ-001 | фризьор в София | hair | — | — | BLOCKED |
| GZ-002 | мъжко подстригване Младост 1 | hair | Младост 1 | — | BLOCKED |
| GZ-003 | барбершоп Студентски град | barber | Студентски град | — | BLOCKED |
| GZ-004 | подстригване днес след 18:00 | hair | — | — | BLOCKED |
| GZ-005 | фризьор за боядисване Омбре в Лозенец | hair | Лозенец | — | BLOCKED |
| GZ-006 | фризьор за къдрава коса | hair | — | — | BLOCKED |
| GZ-007 | детско подстригване Люлин | hair | Люлин | — | BLOCKED |
| GZ-008 | бръснар в центъра до 20 евро | barber | — | — | BLOCKED |
| GZ-009 | frizior v sofia | hair | — | — | BLOCKED |
| GZ-010 | barber near me | barber | — | coordinates | BLOCKED |
| GZ-011 | маникюр утре след 17:00 | nails | — | — | BLOCKED |
| GZ-012 | гел лак в Дружба 2 | nails | Дружба 2 | — | BLOCKED |
| GZ-013 | педикюр близо до мен | nails | — | coordinates | BLOCKED |
| GZ-014 | изграждане на нокти | nails | — | — | BLOCKED |
| GZ-015 | козметик за почистване на лице | beauty | — | — | BLOCKED |
| GZ-016 | ламиниране на вежди | beauty | — | — | BLOCKED |
| GZ-017 | миглопластика Младост | beauty | Младост | — | BLOCKED |
| GZ-018 | лазерна епилация София | beauty | — | — | BLOCKED |
| GZ-019 | manikur sofiq | nails | — | — | BLOCKED |
| GZ-020 | ноктопластика събота сутрин | nails | — | — | BLOCKED |
| GZ-021 | автосервиз София | auto_repair | — | — | BLOCKED |
| GZ-022 | смяна на масло в Младост 4 | auto_repair | Младост 4 | — | BLOCKED |
| GZ-023 | автомивка близо до мен | car_wash | — | coordinates | BLOCKED |
| GZ-024 | автодетайлинг Лозенец | detailing | Лозенец | — | BLOCKED |
| GZ-025 | смяна на гуми утре сутрин | auto_repair | — | — | BLOCKED |
| GZ-026 | диагностика на мерцедес | auto_repair | — | — | BLOCKED |
| GZ-027 | ремонт на климатик на кола | auto_repair | — | — | BLOCKED |
| GZ-028 | тенекеджия София | auto_repair | — | — | BLOCKED |
| GZ-029 | автосервиз за спирачки | auto_repair | — | — | BLOCKED |
| GZ-030 | self service автомивка | car_wash | — | — | BLOCKED |
| GZ-031 | пилатес реформър в София | fitness | — | — | BLOCKED |
| GZ-032 | йога в центъра | fitness | — | — | BLOCKED |
| GZ-033 | персонален треньор Младост | fitness | Младост | — | BLOCKED |
| GZ-034 | тенис треньор за начинаещи | fitness | — | — | BLOCKED |
| GZ-035 | падел корт утре | fitness | — | — | BLOCKED |
| GZ-036 | футболно игрище за час | fitness | — | — | BLOCKED |
| GZ-037 | танци салса вечер | fitness | — | — | BLOCKED |
| GZ-038 | фитнес с тренировка за двама | fitness | — | — | BLOCKED |
| GZ-039 | плуване за деца | fitness | — | — | BLOCKED |
| GZ-040 | pilates near me | fitness | — | coordinates | BLOCKED |
| GZ-041 | уроци по английски Манастирски ливади | education | Манастирски ливади | — | BLOCKED |
| GZ-042 | частен учител по математика 6 клас | education | — | — | BLOCKED |
| GZ-043 | уроци по немски онлайн | education | — | — | BLOCKED |
| GZ-044 | уроци по китара | education | — | — | BLOCKED |
| GZ-045 | уроци по пиано за начинаещи | education | — | — | BLOCKED |
| GZ-046 | шофьорски курсове София | education | — | — | BLOCKED |
| GZ-047 | уроци по рисуване за деца | education | — | — | BLOCKED |
| GZ-048 | подготовка IELTS индивидуално | education | — | — | BLOCKED |
| GZ-049 | speaking english teacher sofia | education | — | — | BLOCKED |
| GZ-050 | помощ с матура по БЕЛ | education | — | — | BLOCKED |
| GZ-051 | невролог в София след 13:00 | other | — | — | BLOCKED |
| GZ-052 | дерматолог в Младост | other | Младост | — | BLOCKED |
| GZ-053 | зъболекар утре | other | — | — | BLOCKED |
| GZ-054 | офталмолог в София | other | — | — | BLOCKED |
| GZ-055 | кардиолог Люлин | other | Люлин | — | BLOCKED |
| GZ-056 | психолог онлайн | other | — | — | BLOCKED |
| GZ-057 | физиотерапия след 18 | health | — | — | BLOCKED |
| GZ-058 | логопед за дете | other | — | — | BLOCKED |
| GZ-059 | ортопед близо до мен | other | — | coordinates | BLOCKED |
| GZ-060 | детски невролог София | other | — | — | BLOCKED |
| GZ-061 | масаж след работа в София | other | — | — | BLOCKED |
| GZ-062 | спортен масаж в Лозенец | other | Лозенец | — | BLOCKED |
| GZ-063 | релаксиращ масаж за двама | other | — | — | BLOCKED |
| GZ-064 | тайландски масаж утре | other | — | — | BLOCKED |
| GZ-065 | спа процедури за лице | beauty | — | — | BLOCKED |
| GZ-066 | сауна резервация | other | — | — | BLOCKED |
| GZ-067 | ароматерапия близо до мен | other | — | coordinates | BLOCKED |
| GZ-068 | рефлексотерапия София | other | — | — | BLOCKED |
| GZ-069 | масаж за бременни | other | — | — | BLOCKED |
| GZ-070 | масаж 60 минути до 40 евро | other | — | — | BLOCKED |
| GZ-071 | груминг за той пудел | pets | — | — | BLOCKED |
| GZ-072 | ветеринарен кабинет София | other | — | — | BLOCKED |
| GZ-073 | подстригване на куче Младост | pets | Младост | — | BLOCKED |
| GZ-074 | почистване на зъби на куче | other | — | — | BLOCKED |
| GZ-075 | котешки груминг | pets | — | — | BLOCKED |
| GZ-076 | ветеринар за ваксинация утре | other | — | — | BLOCKED |
| GZ-077 | хотел за кучета | other | — | — | BLOCKED |
| GZ-078 | треньор за кучета | other | — | — | BLOCKED |
| GZ-079 | груминг за малки породи | pets | — | — | BLOCKED |
| GZ-080 | pet grooming near me | pets | — | coordinates | BLOCKED |
| GZ-081 | почистване на апартамент в Лозенец | home_services | Лозенец | — | BLOCKED |
| GZ-082 | професионално пране на диван | home_services | — | — | BLOCKED |
| GZ-083 | електротехник в Младост | home_services | Младост | — | BLOCKED |
| GZ-084 | водопроводчик тази вечер | home_services | — | — | BLOCKED |
| GZ-085 | майстор за монтаж на климатик | home_services | — | — | BLOCKED |
| GZ-086 | преместване на мебели София | home_services | — | — | BLOCKED |
| GZ-087 | домашна помощница веднъж седмично | home_services | — | — | BLOCKED |
| GZ-088 | монтаж на бойлер | home_services | — | — | BLOCKED |
| GZ-089 | почистване след ремонт | home_services | — | — | BLOCKED |
| GZ-090 | градинар София | home_services | — | — | BLOCKED |
| GZ-091 | счетоводна консултация София | consulting | — | — | BLOCKED |
| GZ-092 | адвокат за имотна сделка | consulting | — | — | BLOCKED |
| GZ-093 | данъчен консултант | consulting | — | — | BLOCKED |
| GZ-094 | бизнес консултант за малка фирма | consulting | — | — | BLOCKED |
| GZ-095 | финансов консултант онлайн | consulting | — | — | BLOCKED |
| GZ-096 | кариерна консултация | consulting | — | — | BLOCKED |
| GZ-097 | консултация с архитект | consulting | — | — | BLOCKED |
| GZ-098 | юридическа консултация утре | consulting | — | — | BLOCKED |
| GZ-099 | счетоводител за свободна професия | consulting | — | — | BLOCKED |
| GZ-100 | консултация за дигитален маркетинг | consulting | — | — | BLOCKED |
| GZ-101 | маса за двама тази вечер | — | — | category | BLOCKED |
| GZ-102 | ресторант утре в 19:30 | — | — | category | BLOCKED |
| GZ-103 | фотограф за семейна фотосесия | other | — | — | BLOCKED |
| GZ-104 | сватбен фотограф София | other | — | — | BLOCKED |
| GZ-105 | студио за снимки под наем | other | — | — | BLOCKED |
| GZ-106 | зала за събитие събота | other | — | — | BLOCKED |
| GZ-107 | музикално студио за час | other | — | — | BLOCKED |
| GZ-108 | гримьор за събитие | beauty | — | — | BLOCKED |
| GZ-109 | професионален грим за сватба | beauty | — | — | BLOCKED |
| GZ-110 | фотосесия на куче | other | — | — | BLOCKED |
| GZ-111 | фризьор в София | hair | — | — | BLOCKED |
| GZ-112 | маникюр Младост 1 | nails | Младост 1 | — | BLOCKED |
| GZ-113 | барбершоп Младост 4 | barber | Младост 4 | — | BLOCKED |
| GZ-114 | автомивка Обеля 2 | car_wash | Обеля 2 | — | BLOCKED |
| GZ-115 | тенис в Банкя | fitness | — | — | BLOCKED |
| GZ-116 | уроци по китара в Бояна | education | Бояна | — | BLOCKED |
| GZ-117 | масаж в Горубляне | other | Горубляне | — | BLOCKED |
| GZ-118 | пилатес в Драгалевци | fitness | Драгалевци | — | BLOCKED |
| GZ-119 | автосервиз в Люлин 5 | auto_repair | Люлин 5 | — | BLOCKED |
| GZ-120 | ветеринар в Дружба 1 | other | Дружба 1 | — | BLOCKED |
| GZ-121 | психолог във Варна | other | — | — | BLOCKED |
| GZ-122 | фризьор на 2 км от мен | hair | — | coordinates | BLOCKED |
| GZ-123 | фризьор из цяла София | hair | — | — | BLOCKED |
| GZ-124 | зъболекар наблизо | other | — | coordinates | BLOCKED |
| GZ-125 | пилатес онлайн | fitness | — | — | BLOCKED |
| GZ-126 | маникюр днес след 17:00 | nails | — | — | BLOCKED |
| GZ-127 | маникюр утре преди 12 | nails | — | — | BLOCKED |
| GZ-128 | фризьор следващия понеделник | hair | — | — | BLOCKED |
| GZ-129 | смяна на гуми тази събота | auto_repair | — | — | BLOCKED |
| GZ-130 | пилатес от 19 до 21 | fitness | — | — | BLOCKED |
| GZ-131 | учител по английски всеки вторник | education | — | — | BLOCKED |
| GZ-132 | масаж в 14:30 | other | — | — | BLOCKED |
| GZ-133 | невролог след 13:00 | other | — | — | BLOCKED |
| GZ-134 | маникюр вчера | nails | — | date | BLOCKED |
| GZ-135 | автосервиз сега | auto_repair | — | — | BLOCKED |
| GZ-136 | кабинет отворен в неделя | — | — | category | BLOCKED |
| GZ-137 | уроци по математика за след 3 седмици | education | — | — | BLOCKED |
| GZ-138 | frizior utре | hair | — | — | BLOCKED |
| GZ-139 | mannikur sofia | nails | — | — | BLOCKED |
| GZ-140 | avtoserviz mlados 4 | auto_repair | Младост 4 | — | BLOCKED |
| GZ-141 | кучешки груминг | pets | — | — | BLOCKED |
| GZ-142 | очен лекар | other | — | — | BLOCKED |
| GZ-143 | бръснарница | barber | — | — | BLOCKED |
| GZ-144 | козметичка за лице | beauty | — | — | BLOCKED |
| GZ-145 | някой да ми оправи бойлера | home_services | — | — | BLOCKED |
| GZ-146 | зъболекар без профил | other | — | — | BLOCKED |
| GZ-147 | haircut tomorrow near me | hair | — | coordinates | BLOCKED |
| GZ-148 | репормер пилатес | fitness | — | — | BLOCKED |
| GZ-149 | маникУр | nails | — | — | BLOCKED |
| GZ-150 | масажж | other | — | — | BLOCKED |
| GZ-151 | уроци математика 6ти клас | education | — | — | BLOCKED |
| GZ-152 | консултант за фирмата ми | consulting | — | — | BLOCKED |
| GZ-153 | невролог след 13:00 | other | — | — | BLOCKED |
| GZ-154 | маникюр утре | nails | — | — | BLOCKED |
| GZ-155 | кучешки груминг | pets | — | — | BLOCKED |
| GZ-156 | маса за двама | — | — | category | BLOCKED |
| GZ-157 | фризьор в София | hair | — | — | BLOCKED |
| GZ-158 | пилатес около мен | fitness | — | coordinates | BLOCKED |
| GZ-159 | счетоводител в София | consulting | — | — | BLOCKED |
| GZ-160 | смяна на гуми | auto_repair | — | — | BLOCKED |
| GZ-161 | маникюр | nails | — | — | BLOCKED |
| GZ-162 | невролог | other | — | — | BLOCKED |
| GZ-163 | домашна помощница | home_services | — | — | BLOCKED |
| GZ-164 | фризьор | hair | — | — | BLOCKED |
| GZ-165 | пилатес | fitness | — | — | BLOCKED |
| GZ-166 | масаж | other | — | — | BLOCKED |
| GZ-167 | невролог в София | other | — | — | BLOCKED |
| GZ-168 | йога | fitness | — | — | BLOCKED |
| GZ-169 | автосервиз | auto_repair | — | — | BLOCKED |
| GZ-170 | педикюр | nails | — | — | BLOCKED |
| GZ-171 | лекар | — | — | category | BLOCKED |
| GZ-172 | търся груминг | pets | — | — | BLOCKED |
