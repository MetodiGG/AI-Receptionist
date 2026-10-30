export const LEGAL_COPY = {
  privacy: {
    bg: {
      title: 'Политика за поверителност', kicker: 'Поверителност', updated: 'Последна актуализация: 30 октомври 2026 г.',
      sections: [
        ['Ролята на платформата', 'GoRez предоставя технология за онлайн резервации и предава данните за посещението към избрания бизнес. Бизнесът използва тези данни за обслужване на резервацията.'],
        ['Какви данни се обработват', 'Име, телефон, задължителен имейл при нова резервация, избрана услуга, специалист, дата и час, бележки и отговори на въпросите за посещението, разговори с онлайн асистента и технически данни за сигурност. Заявката за присъединяване на бизнес съдържа предоставените данни за контакт и бизнеса.'],
        ['Клиентски профил', 'Регистрацията за клиент е по желание. Supabase Auth обработва данните за вход и потвърждаването на имейла. След потвърждение в профила се показват текущите и миналите резервации с този имейл, включително направените без профил. При споделен имейл адрес се споделя и историята — използвай личен адрес. Вътрешни CRM бележки и разговори не се показват в клиентската история. За въпроси относно профила: info@gorez.co.'],
        ['Защо са нужни', 'За създаване, потвърждение, промяна или отказ на резервация; за връзка при промяна; за обработване на заявките за присъединяване; за защита от злоупотреби и надеждна работа на календара.'],
        ['Имейл доставка', 'При включени имейл известия Resend обработва адреса на получателя и съдържанието на съобщението за резервацията, включително личния линк за управление. Не включваме вътрешните клиентски бележки или отговорите на допълнителните въпроси в тези имейли.'],
        ['Отзиви след посещение', 'При включени покани за отзив и имейл известия за резервацията, след като бизнесът отбележи посещението като приключено, може да получиш една покана по имейл чрез Resend. Личният линк е валиден 30 дни и позволява един отзив. Избраното от теб публично име или инициали, оценките, коментарът и датата на отзива се публикуват само след изрично съгласие и изпращане. Имейлът, телефонът, личният линк и данните от календара не се публикуват с отзива. Не включвай чувствителни данни. Отзивите се пазят до изтриване на свързаните клиентски данни или бизнеса; за изтриване се свържи с бизнеса или info@gorez.co. Администраторът може да скрива и възстановява съдържание с причина, без да променя оригиналната оценка или текст.'],
        ['Карта на бизнеса', 'Карта от OpenStreetMap се зарежда само след натискане на „Покажи карта“, ако бизнесът е предоставил координати. При зареждане браузърът се свързва с OpenStreetMap и доставчика на картни изображения. Външните линкове за упътване се отварят в избраната картографска услуга.'],
        ['Съхранение', 'Собственикът може да изтегли данните на своя бизнес и да изтрие клиентските лични данни. Анонимната история на часа остава в календара. Конкретните срокове за съхранение трябва да бъдат уточнени преди реално използване.'],
        ['Искания за данните ти', 'За достъп, корекция, изтриване или копие на данните по резервация се свържи с бизнеса чрез контактите на неговата страница за резервации.'],
        ['Изтриване на бизнес акаунт', 'От „Настройки → Акаунт“ собственикът може след потвърждение да изтрие входния си акаунт, всички свои бизнеси и свързаните с тях данни от приложението. Действието не може да се отмени през сайта. Преди него трябва да се изтегли нужният архив и да се уведомят клиентите за предстоящите часове; автоматични известия не се изпращат. Вече изтеглени копия не се премахват дистанционно. Резервните копия и техническите логове следват сроковете на доставчиците.'],
        ['Сигурност', 'Достъпът до данните е разделен по бизнес. Публичните операции минават през сървърни маршрути с проверка на данните и ограничения срещу злоупотреби. Линкът за управление на резервацията е личен — не го публикувай.'],
      ],
      note: 'Това е обща информационна основа, не правно становище. Преди реалния пилот трябва да бъдат потвърдени данните и контактът на оператора, използваните доставчици и сроковете за съхранение.',
    },
    en: {
      title: 'Privacy policy', kicker: 'Privacy', updated: 'Last updated: 30 October 2026',
      sections: [
        ['The platform’s role', 'GoRez provides online booking technology and forwards appointment details to the selected business. The business uses this data to handle the appointment.'],
        ['Client accounts', 'A client account is optional. Supabase Auth processes sign-in and email verification. After verification, the account shows upcoming and past bookings with that email, including bookings made without an account. A shared mailbox shares booking history: use a personal address. Internal CRM notes and conversations are excluded from client history. For account questions: info@gorez.co.'],
        ['Data processed', 'Name, phone number, required email for new bookings, selected service, specialist, date and time, notes and answers to appointment questions, online assistant conversations and technical security data. Business applications contain the contact and business details you submit.'],
        ['Why data is needed', 'To create, confirm, reschedule or cancel appointments; contact clients about changes; process business applications; prevent abuse and keep the booking calendar reliable.'],
        ['Email delivery', 'When email notifications are enabled, Resend processes the recipient address and appointment message contents, including the private management link. We do not include internal client notes or answers to additional appointment questions in these emails.'],
        ['Reviews after a visit', 'When review invitations and booking email notifications are enabled, you may receive one email invitation through Resend after the business marks your visit as completed. The private link is valid for 30 days and allows one review. Your chosen public name or initials, ratings, comment and review date are published only after your explicit agreement and submission. Email, phone, the private link and calendar details are not published with the review. Do not include sensitive information. Reviews remain until the linked client data or business is deleted; contact the business or info@gorez.co for deletion. An administrator can hide or restore content with a reason, without changing the original rating or text.'],
        ['Business map', 'An OpenStreetMap map loads only after you select Show map, if the business has supplied coordinates. Loading it connects your browser to OpenStreetMap and its map image provider. External directions links open the selected mapping service.'],
        ['Retention', 'Owners can export their business data and erase client personal details. Anonymous appointment history remains in the calendar. Specific retention periods must be confirmed before live use.'],
        ['Requests about your data', 'For access, correction, deletion or a copy of appointment data, contact the business using the contact details on its booking page.'],
        ['Deleting a business account', 'In Settings → Account, owners can confirm deletion of their sign-in account, all their businesses and the related application data. This cannot be undone through the website. Export any needed archive and contact clients about upcoming appointments beforehand; no automatic notifications are sent. Copies already downloaded cannot be removed remotely. Backups and technical logs follow the providers’ retention periods.'],
        ['Security', 'Data access is separated by business. Public operations use server routes with validation and abuse limits. Your booking management link is private — do not publish it.'],
      ],
      note: 'This is a general information baseline, not a legal opinion. Operator details and contact, service providers and retention periods must be confirmed before a live pilot.',
    },
  },
  terms: {
    bg: {
      title: 'Условия за използване', kicker: 'Условия', updated: 'Версия от 15 октомври 2026 г.',
      sections: [
        ['Резервации', 'Платформата предава избраните от клиента данни към конкретния бизнес. Самият бизнес предоставя услугата и определя цените, работното време, правилата за закъснение и отказ.'],
        ['Потвърждение', 'Резервацията е създадена, когато екранът покаже потвърждение и личен линк за управление. Страницата показва дали имейл известията и напомнянията са включени. Имейлите могат да се забавят или да не достигнат получателя. Запази личния линк; файлът за календар не се обновява автоматично.'],
        ['Промени и отказ', 'Онлайн отказ е възможен в срока, определен от бизнеса. След този срок се свържи директно с бизнеса. Когато имейлите са включени за резервацията, се прави опит за изпращане на известие за преместване или отказ. При непотвърдена доставка собственикът трябва да се свърже директно с клиента.'],
        ['Онлайн асистент', 'Асистентът използва публикуваните услуги, графици и правила. Не използва платен AI модел. Само изрично потвърждение в процеса за резервация може да създаде час.'],
        ['Наличност', 'Временни прекъсвания са възможни. При съмнение използвай контактите на бизнеса. GoRez не обещава непрекъсната достъпност в пилотната фаза.'],
      ],
      note: 'Тези условия са информационна основа, не правно становище. Данните на оператора, поддръжката и условията за участие трябва да бъдат потвърдени преди реално използване.',
    },
    en: {
      title: 'Terms of use', kicker: 'Terms', updated: 'Version: 15 October 2026',
      sections: [
        ['Bookings', 'The platform forwards the client’s booking details to the selected business. The business provides the service and sets its prices, working hours, lateness and cancellation rules.'],
        ['Confirmation', 'A booking is created when the screen displays confirmation and a private management link. The page shows whether email notifications and reminders are enabled. Emails can be delayed or fail to reach the recipient. Save your private link; downloaded calendar files do not update automatically.'],
        ['Changes and cancellation', 'Online cancellation is available before the business’s deadline. After that, contact the business directly. When emails are enabled for the booking, a reschedule or cancellation notification is attempted. The owner should contact the client directly if delivery is not confirmed.'],
        ['Online assistant', 'The assistant uses published services, schedules and rules. It does not use a paid AI model. An appointment is created only after explicit confirmation during booking.'],
        ['Availability', 'Temporary outages are possible. If unsure, use the business’s contact details. GoRez does not promise uninterrupted availability during the pilot.'],
      ],
      note: 'These terms are an information baseline, not a legal opinion. Operator details, support contact and participation terms must be confirmed before live use.',
    },
  },
}
