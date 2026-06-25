import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const daysAhead = (n: number) => daysAgo(-n)

type ElType =
  | 'SECTION'
  | 'TEXT'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'VIDEO'
  | 'IMAGE'
  | 'PAGE_BREAK'
  | 'BREATHING'
  | 'CARDS'

// Компактний опис елементів активності.
const els = (list: { type: ElType; title?: string; options?: string[] }[]) => ({
  create: list.map((e, order) => ({
    type: e.type,
    title: e.title ?? '',
    options: e.options ?? [],
    order,
  })),
})

async function main() {
  const force = process.env.FORCE_RESEED === 'true' || process.env.FORCE_RESEED === '1'
  // У режимі автозасіву (на старті в проді) не чіпаємо наявні дані, якщо не FORCE_RESEED.
  if (process.env.SEED_ONLY_IF_EMPTY === '1' && !force && (await prisma.user.count()) > 0) {
    console.log('Демо-дані вже існують — пропускаю засів')
    return
  }

  // Очищення в порядку залежностей.
  await prisma.threadComment.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.journalEntry.deleteMany()
  await prisma.resourceShare.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.task.deleteMany()
  await prisma.note.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.activityElement.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.programStep.deleteMany()
  await prisma.program.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('demo1234', 10)

  const practitioner = await prisma.user.create({
    data: { email: 'demo@psychoprogram.com', passwordHash, role: 'PRACTITIONER', firstName: 'Демо', lastName: 'Практик' },
  })
  const pid = practitioner.id

  const clientUser = await prisma.user.create({
    data: { email: 'client@psychoprogram.com', passwordHash, role: 'CLIENT', firstName: 'Олена', lastName: 'Ковальчук' },
  })

  // ===================== КЛІЄНТИ =====================
  const olena = await prisma.client.create({
    data: { firstName: 'Олена', lastName: 'Ковальчук', email: 'client@psychoprogram.com', status: 'ACTIVE', createdAt: daysAgo(40), practitionerId: pid, userId: clientUser.id },
  })
  const andrii = await prisma.client.create({
    data: { firstName: 'Андрій', lastName: 'Шевченко', email: 'andrii.sh@example.com', status: 'ACTIVE', createdAt: daysAgo(32), practitionerId: pid },
  })
  const maria = await prisma.client.create({
    data: { firstName: 'Марія', lastName: 'Бондаренко', email: 'maria.b@example.com', status: 'INVITED', createdAt: daysAgo(3), practitionerId: pid },
  })
  const ihor = await prisma.client.create({
    data: { firstName: 'Ігор', lastName: 'Ткаченко', email: 'ihor.t@example.com', status: 'ACTIVE', createdAt: daysAgo(21), practitionerId: pid },
  })
  await prisma.client.create({
    data: { firstName: 'Світлана', lastName: 'Мельник', email: 'svitlana.m@example.com', status: 'ARCHIVED', createdAt: daysAgo(90), practitionerId: pid },
  })

  // ===================== БІБЛІОТЕКА ГОТОВОГО КОНТЕНТУ (premade) =====================
  const premade = (
    title: string,
    description: string,
    category: string,
    elements: { type: ElType; title?: string; options?: string[] }[],
    opts: { pageBreaks?: boolean; updated?: number } = {},
  ) =>
    prisma.activity.create({
      data: {
        title,
        description,
        category,
        isPremade: true,
        pageBreaksEnabled: opts.pageBreaks ?? false,
        updatedAt: daysAgo(opts.updated ?? 30),
        elements: els(elements),
      },
    })

  const thoughtRecord = await premade(
    'Запис автоматичних думок (КПТ)',
    'Класична техніка когнітивно-поведінкової терапії для роботи з тривожними та депресивними думками.',
    'КПТ',
    [
      { type: 'TEXT', title: 'Коли ви помічаєте сильну емоцію, зробіть паузу й заповніть цей запис. Так ви вчитеся помічати автоматичні думки й перевіряти їх на реалістичність.' },
      { type: 'SECTION', title: '1. Ситуація' },
      { type: 'LONG_ANSWER', title: 'Опишіть ситуацію: де ви були, що сталося, хто був поруч?' },
      { type: 'SECTION', title: '2. Емоції' },
      { type: 'SHORT_ANSWER', title: 'Яку емоцію ви відчули? Назвіть її одним-двома словами.' },
      { type: 'SCALE', title: 'Наскільки сильною була емоція? (1 — ледь помітна, 10 — максимальна)' },
      { type: 'SECTION', title: '3. Автоматична думка' },
      { type: 'LONG_ANSWER', title: 'Яка думка промайнула в голові в той момент? («Я…», «Це означає, що…»)' },
      { type: 'SECTION', title: '4. Перевірка думки' },
      { type: 'LONG_ANSWER', title: 'Які факти ПІДТВЕРДЖУЮТЬ цю думку?' },
      { type: 'LONG_ANSWER', title: 'Які факти СУПЕРЕЧАТЬ їй? Що б ви сказали другові в такій ситуації?' },
      { type: 'LONG_ANSWER', title: 'Більш збалансована, реалістична думка:' },
      { type: 'SCALE', title: 'Наскільки сильна емоція ЗАРАЗ? (1–10)' },
    ],
    { pageBreaks: true, updated: 12 },
  )

  const grounding = await premade(
    'Заземлення 5-4-3-2-1',
    'Швидка техніка повернення в «тут і зараз» при тривозі чи панічній атаці. Задіює всі органи чуття.',
    'Тривога',
    [
      { type: 'TEXT', title: 'Зробіть повільний вдих. Пройдіться по своїх відчуттях, не поспішаючи — це поверне увагу з тривожних думок у теперішній момент.' },
      { type: 'SCALE', title: 'Рівень тривоги ЗАРАЗ (1–10)' },
      { type: 'SHORT_ANSWER', title: '5 речей, які ви БАЧИТЕ навколо' },
      { type: 'SHORT_ANSWER', title: '4 речі, яких ви можете ТОРКНУТИСЯ' },
      { type: 'SHORT_ANSWER', title: '3 звуки, які ви ЧУЄТЕ' },
      { type: 'SHORT_ANSWER', title: '2 запахи, які ви відчуваєте' },
      { type: 'SHORT_ANSWER', title: '1 смак, який ви відчуваєте' },
      { type: 'SCALE', title: 'Рівень тривоги ПІСЛЯ вправи (1–10)' },
    ],
  )

  const worryTree = await premade(
    'Дерево тривоги',
    'Структурований спосіб вирішити, що робити з тривожною думкою: діяти чи відпустити.',
    'Тривога',
    [
      { type: 'TEXT', title: 'Тривога часто крутиться по колу. Це дерево допомагає рознести «продуктивне хвилювання» (де є дія) і «непродуктивне» (де дії немає).' },
      { type: 'LONG_ANSWER', title: 'Про що саме ви тривожитесь зараз?' },
      { type: 'MULTIPLE_CHOICE', title: 'Чи можете ви щось із цим зробити?', options: ['Так, є конкретна дія', 'Ні, це поза моїм контролем', 'Можливо, пізніше'] },
      { type: 'LONG_ANSWER', title: 'Якщо ТАК — який один маленький крок ви зробите і коли?' },
      { type: 'LONG_ANSWER', title: 'Якщо НІ — як ви повернете увагу до теперішнього? (вправа, справа, контакт)' },
    ],
  )

  const behavioral = await premade(
    'Планування приємних активностей',
    'Поведінкова активація — доказовий метод при зниженому настрої та апатії.',
    'Депресія',
    [
      { type: 'TEXT', title: 'Коли настрій падає, ми робимо менше приємного — і настрій падає ще більше. Розірвемо це коло, заздалегідь запланувавши маленькі приємні й важливі справи.' },
      { type: 'LONG_ANSWER', title: 'Назвіть 3–5 справ, що раніше приносили задоволення або відчуття досягнення.' },
      { type: 'SCALE', title: 'Скільки у вас зараз енергії на день? (1–10)' },
      { type: 'LONG_ANSWER', title: 'Яку ОДНУ справу зі списку ви заплануєте на завтра? Вкажіть день і час.' },
      { type: 'MULTIPLE_CHOICE', title: 'Що може завадити? Оберіть головну перешкоду.', options: ['Втома', 'Брак часу', 'Думка «не на часі»', 'Інші люди', 'Нічого'] },
    ],
  )

  const sleepDiary = await premade(
    'Щоденник сну',
    'Тижневий моніторинг сну для роботи з безсонням за принципами КПТ-Б.',
    'Сон',
    [
      { type: 'TEXT', title: 'Заповнюйте щоранку, орієнтовно — точність до хвилини не потрібна. За тиждень побачимо закономірності.' },
      { type: 'SHORT_ANSWER', title: 'О котрій ви лягли в ліжко?' },
      { type: 'SHORT_ANSWER', title: 'Скільки приблизно засинали (хвилин)?' },
      { type: 'SHORT_ANSWER', title: 'Скільки разів прокидались уночі?' },
      { type: 'SHORT_ANSWER', title: 'О котрій остаточно встали?' },
      { type: 'SCALE', title: 'Якість сну цієї ночі (1 — жахливо, 10 — чудово)' },
      { type: 'MULTIPLE_CHOICE', title: 'Що було ввечері напередодні?', options: ['Кава/енергетик після 16:00', 'Екран у ліжку', 'Алкоголь', 'Спокійний вечір', 'Фізичне навантаження'] },
      { type: 'LONG_ANSWER', title: 'Нотатки: що могло вплинути на сон?' },
    ],
  )

  const bodyScan = await premade(
    'Сканування тіла',
    'Базова практика усвідомленості (mindfulness) для зниження напруги й кращого контакту з тілом.',
    'Усвідомленість',
    [
      { type: 'VIDEO', title: 'Відео-практика «Сканування тіла» (10 хв)', options: ['https://www.youtube.com/results?search_query=сканування+тіла+медитація+українською'] },
      { type: 'SCALE', title: 'Напруга в тілі ДО практики (1–10)' },
      { type: 'LONG_ANSWER', title: 'Які зони тіла були найбільш напруженими? Що ви помітили?' },
      { type: 'SCALE', title: 'Напруга в тілі ПІСЛЯ практики (1–10)' },
    ],
  )

  const boxBreathing = await premade(
    'Квадратне дихання',
    'Проста дихальна техніка (4-4-4-4) для швидкого заспокоєння нервової системи.',
    'Усвідомленість',
    [
      { type: 'TEXT', title: 'Вдих на 4 рахунки → затримка на 4 → видих на 4 → пауза на 4. Дихайте за анімацією й голосом.' },
      { type: 'SCALE', title: 'Відчуття спокою ДО (1–10)' },
      { type: 'BREATHING', title: 'Квадратне дихання 4-4-4-4', options: ['4', '4', '4', '4'] },
      { type: 'SCALE', title: 'Відчуття спокою ПІСЛЯ (1–10)' },
    ],
  )

  const selfCards = await premade(
    'Картки самопізнання',
    'Колода рефлексивних карток: гортайте по одній і не поспішаючи відповідайте собі. Без правильних відповідей.',
    'Самопізнання',
    [
      { type: 'TEXT', title: 'Знайдіть кілька спокійних хвилин. Гортайте картки й відповідайте подумки або запишіть думки нижче.' },
      {
        type: 'CARDS',
        title: 'Колода самопізнання',
        options: [
          'За що ви вдячні саме сьогодні?',
          'Що дало вам відчуття опори цього тижня?',
          'Яка емоція була з вами найчастіше? Звідки вона?',
          'Що ви хотіли б відпустити?',
          'Коли ви востаннє пишалися собою — і за що?',
          'Що зараз найбільше потребує вашої турботи?',
          'Який маленький крок наблизить вас до того, що важливо?',
        ],
      },
      { type: 'LONG_ANSWER', title: 'Яка картка зачепила найбільше і чому?' },
    ],
    { updated: 3 },
  )

  const breathing478 = await premade(
    'Дихальна вправа 4-7-8',
    'Заспокійлива техніка дихання: керована анімація з голосовими підказками. Добре допомагає перед сном і при тривозі.',
    'Усвідомленість',
    [
      { type: 'TEXT', title: 'Сядьте зручно, спина рівна. Дихайте за кругом і голосом: вдих 4 с → затримка 7 с → видих 8 с. Виконайте 4 цикли.' },
      { type: 'SCALE', title: 'Рівень напруги ДО вправи (1–10)' },
      { type: 'BREATHING', title: 'Дихальна вправа 4-7-8', options: ['4', '7', '8'] },
      { type: 'SCALE', title: 'Рівень напруги ПІСЛЯ вправи (1–10)' },
      { type: 'LONG_ANSWER', title: 'Що ви помітили у тілі чи думках після вправи?' },
    ],
    { updated: 4 },
  )

  const selfCompassion = await premade(
    'Перерва самоспівчуття',
    'Вправа за підходом Крістін Нефф: три кроки доброти до себе у складний момент.',
    'Самоспівчуття',
    [
      { type: 'TEXT', title: 'Згадайте ситуацію, яка зараз вас ранить. Пройдемо три кроки самоспівчуття.' },
      { type: 'LONG_ANSWER', title: '1. Усвідомленість: «Зараз мені важко». Що саме ви відчуваєте?' },
      { type: 'LONG_ANSWER', title: '2. Спільність людського досвіду: «Я не один. Багато людей переживають подібне». Як це звучить для вас?' },
      { type: 'LONG_ANSWER', title: '3. Доброта до себе: що б ви сказали близькому другові? Скажіть це собі.' },
      { type: 'SCALE', title: 'Скільки тепла до себе ви відчуваєте зараз? (1–10)' },
    ],
  )

  const values = await premade(
    'Прояснення цінностей',
    'Вправа з терапії прийняття та відповідальності (ACT): що для вас по-справжньому важливо.',
    'ACT',
    [
      { type: 'TEXT', title: 'Цінності — це напрямок, а не ціль. Вони відповідають на питання «яким я хочу бути?». Дослідимо ваші.' },
      { type: 'MULTIPLE_CHOICE', title: 'Яка сфера зараз найбільше потребує уваги?', options: ['Стосунки', 'Робота/розвиток', 'Здоровʼя', 'Дозвілля/творчість', 'Спільнота'] },
      { type: 'LONG_ANSWER', title: 'У цій сфері — яким партнером/другом/професіоналом ви хочете бути?' },
      { type: 'LONG_ANSWER', title: 'Який ОДИН маленький крок у напрямку цієї цінності можливий вже цього тижня?' },
      { type: 'SCALE', title: 'Наскільки зараз ваше життя відповідає цій цінності? (1–10)' },
    ],
  )

  const emotionWheel = await premade(
    'Колесо емоцій',
    'Розширення емоційного словника: точніше назвати почуття — перший крок до його регуляції.',
    'Емоційна регуляція',
    [
      { type: 'TEXT', title: 'Часто ми кажемо просто «погано». Спробуймо назвати почуття точніше — це вже знижує його інтенсивність.' },
      { type: 'MULTIPLE_CHOICE', title: 'Яка базова емоція найближча зараз?', options: ['Страх', 'Сум', 'Гнів', 'Радість', 'Огида', 'Здивування'] },
      { type: 'LONG_ANSWER', title: 'Уточніть відтінок: тривога, провина, образа, розчарування, натхнення…? Опишіть своїми словами.' },
      { type: 'LONG_ANSWER', title: 'Про яку потребу сигналить ця емоція?' },
    ],
  )

  const wellbeing = await premade(
    'Щотижнева шкала самопочуття',
    'Структуроване самоспостереження за настроєм і станом за останні 2 тижні (для відстеження динаміки, не діагноз).',
    'Моніторинг',
    [
      { type: 'TEXT', title: 'Оцініть, як часто протягом останніх 2 тижнів вас турбувало наведене нижче. Це допомагає бачити динаміку від зустрічі до зустрічі.' },
      { type: 'MULTIPLE_CHOICE', title: 'Знижений настрій, пригніченість', options: ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня'] },
      { type: 'MULTIPLE_CHOICE', title: 'Втрата інтересу до звичних справ', options: ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня'] },
      { type: 'MULTIPLE_CHOICE', title: 'Проблеми зі сном', options: ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня'] },
      { type: 'MULTIPLE_CHOICE', title: 'Втома або брак енергії', options: ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня'] },
      { type: 'SCALE', title: 'Загальне самопочуття цього тижня (1–10)' },
      { type: 'LONG_ANSWER', title: 'Що цього тижня допомагало? Що було найважче?' },
    ],
  )

  const smart = await premade(
    'Постановка цілі за SMART',
    'Перетворення розпливчастого наміру на конкретну, досяжну ціль. Корисно в коучингу.',
    'Коучинг',
    [
      { type: 'TEXT', title: 'Хороша ціль — Конкретна, Вимірювана, Досяжна, Релевантна й Обмежена в часі. Сформулюймо вашу.' },
      { type: 'SHORT_ANSWER', title: 'S — Конкретно: чого саме ви хочете досягти?' },
      { type: 'SHORT_ANSWER', title: 'M — Вимірювано: як ви зрозумієте, що досягли?' },
      { type: 'MULTIPLE_CHOICE', title: 'A — Досяжно: наскільки ви впевнені, що це реально?', options: ['Цілком реально', 'Складно, але можливо', 'Поки сумніваюсь'] },
      { type: 'SHORT_ANSWER', title: 'R — Релевантно: чому це важливо саме зараз?' },
      { type: 'SHORT_ANSWER', title: 'T — Час: дедлайн або дата першого кроку' },
    ],
  )

  const wheel = await premade(
    'Колесо життєвого балансу',
    'Оцінка задоволеності ключовими сферами життя — гарний старт коучингового процесу.',
    'Коучинг',
    [
      { type: 'TEXT', title: 'Оцініть задоволеність кожною сферою від 1 до 10. Потім подивимось, де найбільший розрив між «є» і «хочу».' },
      { type: 'SCALE', title: 'Кар’єра / робота' },
      { type: 'SCALE', title: 'Фінанси' },
      { type: 'SCALE', title: 'Здоров’я' },
      { type: 'SCALE', title: 'Стосунки' },
      { type: 'SCALE', title: 'Особистісний розвиток' },
      { type: 'SCALE', title: 'Відпочинок і дозвілля' },
      { type: 'LONG_ANSWER', title: 'Яку сферу ви хочете покращити в першу чергу і чому?' },
    ],
  )

  // ===================== СТАНДАРТИЗОВАНІ ТЕСТИ (PHQ-9, GAD-7) =====================
  // Вільні для використання шкали. Бал = сума індексів обраних варіантів (0–3).
  // assessmentKey вмикає авто-оцінку й інтерпретацію в застосунку та адмінці.
  const FREQ = ['Зовсім ні', 'Кілька днів', 'Більше половини днів', 'Майже щодня']

  const assessment = (
    title: string,
    description: string,
    assessmentKey: string,
    intro: string,
    questions: string[],
    updated: number,
  ) =>
    prisma.activity.create({
      data: {
        title,
        description,
        category: 'Тест',
        assessmentKey,
        isPremade: true,
        updatedAt: daysAgo(updated),
        elements: els([
          { type: 'TEXT', title: intro },
          ...questions.map((q) => ({ type: 'MULTIPLE_CHOICE' as ElType, title: q, options: FREQ })),
        ]),
      },
    })

  const phq9 = await assessment(
    'PHQ-9 — шкала депресії',
    'Стандартизована шкала для скринінгу депресії (9 питань, 0–27). Допомагає відстежувати динаміку від тижня до тижня. Це не діагноз.',
    'phq9',
    'Протягом останніх 2 тижнів, як часто вас турбували наведені проблеми? Оберіть варіант для кожного пункту.',
    [
      'Мало інтересу або задоволення від справ',
      'Пригніченість, смуток або відчуття безнадії',
      'Проблеми із засинанням, переривчастий сон або надмірна сонливість',
      'Відчуття втоми або браку енергії',
      'Поганий апетит або переїдання',
      'Погана думка про себе — відчуття невдахи або що підвели себе чи близьких',
      'Труднощі з концентрацією (читання, перегляд телевізора тощо)',
      'Сповільненість у рухах/мовленні або навпаки — надмірна метушливість, помітні іншим',
      'Думки, що краще було б померти, або про те, щоб завдати собі шкоди',
    ],
    9,
  )

  const gad7 = await assessment(
    'GAD-7 — шкала тривоги',
    'Стандартизована шкала для скринінгу тривожності (7 питань, 0–21). Поріг ймовірного розладу — від 10 балів. Це не діагноз.',
    'gad7',
    'Протягом останніх 2 тижнів, як часто вас турбували наведені проблеми? Оберіть варіант для кожного пункту.',
    [
      'Нервозність, тривога або відчуття «на межі»',
      'Неможливість зупинити чи контролювати тривогу',
      'Надмірне хвилювання щодо різних речей',
      'Труднощі з розслабленням',
      'Така непосидючість, що важко всидіти на місці',
      'Легко дратуєтесь або стаєте роздратованим',
      'Відчуття страху, ніби має статися щось жахливе',
    ],
    9,
  )

  // Гнучкий конструктор тесту: у кожного питання власний набір варіантів.
  const mkTest = (
    title: string,
    description: string,
    assessmentKey: string,
    intro: string,
    items: { q: string; options: string[] }[],
    updated: number,
  ) =>
    prisma.activity.create({
      data: {
        title,
        description,
        category: 'Тест',
        assessmentKey,
        isPremade: true,
        updatedAt: daysAgo(updated),
        elements: els([
          { type: 'TEXT', title: intro },
          ...items.map((it) => ({ type: 'MULTIPLE_CHOICE' as ElType, title: it.q, options: it.options })),
        ]),
      },
    })
  const uniform = (qs: string[], options: string[]) => qs.map((q) => ({ q, options }))

  // -- PCL-5 (ПТСР, DSM-5): 20 питань, 0–4 --
  const PCL_OPTS = ['Зовсім ні', 'Трохи', 'Помірно', 'Досить сильно', 'Надзвичайно сильно']
  const pcl5 = await mkTest(
    'PCL-5 — шкала ПТСР',
    'Скринінг симптомів ПТСР за DSM-5 (20 питань, 0–80). Поріг ймовірного ПТСР — від 33. Це не діагноз.',
    'pcl5',
    'За останній місяць, наскільки сильно вас турбувало кожне з наведеного? Оберіть варіант для кожного пункту.',
    uniform(
      [
        'Повторювані, тривожні й небажані спогади про стресову подію',
        'Повторювані тривожні сни про подію',
        'Раптове відчуття або поведінка, ніби стресова подія повторюється знову (флешбек)',
        'Сильні переживання, коли щось нагадує про подію',
        'Сильні фізичні реакції, коли щось нагадує про подію (серцебиття, утруднене дихання, пітливість)',
        'Уникання спогадів, думок чи почуттів, повʼязаних із подією',
        'Уникання зовнішніх нагадувань (людей, місць, розмов, дій, предметів, ситуацій)',
        'Труднощі згадати важливі частини стресової події',
        'Сильні негативні переконання про себе, інших або світ',
        'Звинувачення себе або інших у події чи її наслідках',
        'Сильні негативні почуття (страх, жах, гнів, провина, сором)',
        'Втрата інтересу до раніше приємних занять',
        'Відчуття відстороненості чи відчуженості від інших людей',
        'Труднощі відчувати позитивні емоції (щастя, любов до близьких)',
        'Дратівливість, спалахи гніву чи агресивна поведінка',
        'Надмірно ризикована або шкідлива для себе поведінка',
        'Стан «насторожі», підвищена пильність',
        'Здригання або легке лякання',
        'Труднощі з концентрацією',
        'Проблеми зі сном (важко заснути або переривчастий сон)',
      ],
      PCL_OPTS,
    ),
    8,
  )

  // -- DASS-21: 21 питання, 0–3, три субшкали (порядок пунктів — стандартний) --
  const DASS_OPTS = [
    'Не стосувалося мене зовсім',
    'Стосувалося певною мірою або інколи',
    'Стосувалося значною мірою або значну частину часу',
    'Дуже стосувалося мене або більшість часу',
  ]
  const dass21 = await mkTest(
    'DASS-21 — депресія, тривога, стрес',
    'Оцінює три стани окремо: депресію, тривогу і стрес (21 питання). Субшкали рахуються × 2. Це не діагноз.',
    'dass21',
    'Наскільки кожне твердження стосувалося вас протягом останнього тижня? Оберіть варіант для кожного пункту.',
    uniform(
      [
        'Мені було важко заспокоїтися',
        'Я відчував сухість у роті',
        'Я взагалі не міг відчути жодних позитивних емоцій',
        'Мені було важко дихати (часте дихання, задишка без навантаження)',
        'Мені було важко знайти в собі сили щось робити',
        'Я схильний був надмірно реагувати на ситуації',
        'Я відчував тремтіння (наприклад, у руках)',
        'Я відчував, що витрачаю багато нервової енергії',
        'Я хвилювався через ситуації, де міг запанікувати й виставити себе у безглуздому світлі',
        'Я відчував, що мені нема на що чекати в майбутньому',
        'Я помічав, що легко роздратовуюсь',
        'Мені було важко розслабитися',
        'Я почувався пригніченим і сумним',
        'Я не терпів нічого, що заважало мені робити те, чим я займався',
        'Я відчував, що близький до паніки',
        'Я не міг відчути ентузіазму ні до чого',
        'Я відчував, що небагато вартий як особистість',
        'Я відчував, що досить дратівливий',
        'Я відчував серцебиття без фізичного навантаження (прискорене або нерівне)',
        'Я відчував страх без явної причини',
        'Я відчував, що життя безглузде',
      ],
      DASS_OPTS,
    ),
    8,
  )

  // -- WHO-5: 5 питань, 0–5 (× 4 → 0–100), вищий бал = краще --
  const WHO_OPTS = ['Ніколи', 'Деякий час', 'Менше половини часу', 'Більше половини часу', 'Більшу частину часу', 'Увесь час']
  const who5 = await mkTest(
    'WHO-5 — індекс благополуччя',
    'Коротка шкала загального самопочуття (5 питань, 0–100). Нижче 50 — варто оцінити настрій; нижче 28 — показати PHQ-9.',
    'who5',
    'За останні 2 тижні… Оберіть, як часто це було про вас.',
    uniform(
      [
        'Я почувався бадьорим і в доброму гуморі',
        'Я почувався спокійним і розслабленим',
        'Я почувався активним і енергійним',
        'Я прокидався свіжим і відпочилим',
        'Моє повсякденне життя було наповнене речами, які мене цікавлять',
      ],
      WHO_OPTS,
    ),
    7,
  )

  // -- PSS-10: 10 питань, 0–4, питання 4,5,7,8 — зворотні --
  const PSS_OPTS = ['Ніколи', 'Майже ніколи', 'Іноді', 'Досить часто', 'Дуже часто']
  const pss10 = await mkTest(
    'PSS-10 — сприйнятий стрес',
    'Оцінює, наскільки життя сприймається як стресове (10 питань, 0–40). Питання 4, 5, 7, 8 — зворотні. Це не діагноз.',
    'pss10',
    'За останній місяць, як часто ви почувалися або думали певним чином? Оберіть варіант для кожного пункту.',
    uniform(
      [
        'Засмучувалися через щось, що сталося несподівано?',
        'Відчували, що не можете контролювати важливі речі у своєму житті?',
        'Відчували нервозність і стрес?',
        'Почувалися впевнено щодо своєї здатності впоратися з особистими проблемами?',
        'Відчували, що все йде так, як ви хочете?',
        'Виявляли, що не справляєтеся з усіма справами, які мали зробити?',
        'Могли контролювати роздратування у своєму житті?',
        'Відчували, що володієте ситуацією?',
        'Сердилися через те, що було поза вашим контролем?',
        'Відчували, що труднощі накопичуються так, що ви не можете їх подолати?',
      ],
      PSS_OPTS,
    ),
    7,
  )

  // -- AUDIT: 10 питань; 1–8 по 0–4, 9–10 по 0/2/4 (власні набори варіантів) --
  const AUDIT_FREQ = ['Ніколи', 'Рідше ніж щомісяця', 'Щомісяця', 'Щотижня', 'Щодня або майже щодня']
  const AUDIT_YN = ['Ні', 'Так, але не цього року', 'Так, цього року']
  const audit = await mkTest(
    'AUDIT — вживання алкоголю',
    'Скринінг ризикового вживання алкоголю (ВООЗ, 10 питань, 0–40). ≥8 — ризиковане, ≥16 — шкідливе, ≥20 — ймовірна залежність.',
    'audit',
    'Дайте відповідь на кожне питання якомога точніше.',
    [
      { q: 'Як часто ви вживаєте алкогольні напої?', options: ['Ніколи', 'Щомісяця або рідше', '2–4 рази на місяць', '2–3 рази на тиждень', '4 або більше разів на тиждень'] },
      { q: 'Скільки стандартних доз алкоголю ви випиваєте у типовий день, коли вживаєте?', options: ['1–2', '3–4', '5–6', '7–9', '10 або більше'] },
      { q: 'Як часто ви випиваєте 6 або більше доз за один раз?', options: AUDIT_FREQ },
      { q: 'Як часто за останній рік ви помічали, що не можете зупинитися, почавши пити?', options: AUDIT_FREQ },
      { q: 'Як часто за останній рік через випивку ви не зробили того, що від вас зазвичай очікували?', options: AUDIT_FREQ },
      { q: 'Як часто за останній рік вам потрібно було випити вранці, щоб прийти до тями після важкого пиття?', options: AUDIT_FREQ },
      { q: 'Як часто за останній рік ви відчували провину чи каяття після випивки?', options: AUDIT_FREQ },
      { q: 'Як часто за останній рік ви не могли згадати, що сталося напередодні, через випивку?', options: AUDIT_FREQ },
      { q: 'Чи траплялося, що ви або хтось інший зазнавали травми через вашу випивку?', options: AUDIT_YN },
      { q: 'Чи висловлював хтось (рідні, друзі, лікар) занепокоєння вашою випивкою або радив зменшити?', options: AUDIT_YN },
    ],
    6,
  )

  // ===================== ВЛАСНІ АКТИВНОСТІ ПСИХОЛОГА =====================
  const gratitude = await prisma.activity.create({
    data: {
      title: 'Щоденник вдячності',
      description: 'Щоденна вправа: три речі, за які ви вдячні, і чому.',
      practitionerId: pid,
      updatedAt: daysAgo(5),
      elements: els([
        { type: 'TEXT', title: 'Дослідження показують: регулярна практика вдячності покращує настрій і сон. Витратьте 3 хвилини.' },
        { type: 'SHORT_ANSWER', title: 'За що ви вдячні сьогодні? (1)' },
        { type: 'SHORT_ANSWER', title: 'За що ви вдячні сьогодні? (2)' },
        { type: 'SHORT_ANSWER', title: 'За що ви вдячні сьогодні? (3)' },
        { type: 'LONG_ANSWER', title: 'Оберіть одне з трьох і опишіть детальніше: чому це було важливо?' },
        { type: 'SCALE', title: 'Ваш настрій зараз (1–10)' },
      ]),
    },
  })

  const stress = await prisma.activity.create({
    data: {
      title: 'Оцінка рівня стресу',
      description: 'Коротка анкета для самооцінки стресу за останній тиждень.',
      pageBreaksEnabled: true,
      practitionerId: pid,
      updatedAt: daysAgo(2),
      elements: els([
        { type: 'SECTION', title: 'Частина 1. Фізичні відчуття' },
        { type: 'MULTIPLE_CHOICE', title: 'Як часто ви відчували напругу в тілі цього тижня?', options: ['Майже ніколи', 'Іноді', 'Часто', 'Постійно'] },
        { type: 'SCALE', title: 'Якість сну за тиждень (1–10)' },
        { type: 'PAGE_BREAK' },
        { type: 'MULTIPLE_CHOICE', title: 'Чи відчували ви головний біль або втому?', options: ['Ні', 'Один-два рази', 'Декілька разів', 'Щодня'] },
        { type: 'SECTION', title: 'Частина 2. Емоційний стан' },
        { type: 'LONG_ANSWER', title: 'Що було головним джерелом стресу цього тижня?' },
        { type: 'SCALE', title: 'Загальний рівень стресу (1–10)' },
      ]),
    },
  })

  // ===================== ПРОГРАМИ =====================
  // Власна програма психолога
  const anxietyProgram = await prisma.program.create({
    data: {
      title: 'Подолання тривоги: 4 тижні',
      description: 'Поетапна КПТ-програма: від навичок заспокоєння до роботи з думками й діями.',
      practitionerId: pid,
      updatedAt: daysAgo(7),
      steps: {
        create: [
          { activityId: grounding.id, mode: 'IMMEDIATELY', days: 0, order: 0 },
          { activityId: stress.id, mode: 'AFTER_PREVIOUS', days: 2, order: 1 },
          { activityId: thoughtRecord.id, mode: 'AFTER_PREVIOUS', days: 7, order: 2 },
          { activityId: worryTree.id, mode: 'AFTER_PREVIOUS', days: 7, order: 3 },
          { activityId: behavioral.id, mode: 'AFTER_START', days: 28, order: 4 },
        ],
      },
    },
  })

  // Готові програми (premade)
  const mkProgram = (
    title: string,
    description: string,
    steps: { activityId: string; mode: 'IMMEDIATELY' | 'AFTER_PREVIOUS' | 'AFTER_START'; days: number }[],
    updated = 40,
  ) =>
    prisma.program.create({
      data: {
        title,
        description,
        isPremade: true,
        updatedAt: daysAgo(updated),
        steps: { create: steps.map((s, order) => ({ ...s, order })) },
      },
    })

  await mkProgram('Усвідомленість для початківців: 6 тижнів', 'Мʼякий вступ у практики mindfulness — від дихання до самоспівчуття.', [
    { activityId: boxBreathing.id, mode: 'IMMEDIATELY', days: 0 },
    { activityId: bodyScan.id, mode: 'AFTER_PREVIOUS', days: 7 },
    { activityId: emotionWheel.id, mode: 'AFTER_PREVIOUS', days: 7 },
    { activityId: selfCompassion.id, mode: 'AFTER_PREVIOUS', days: 7 },
    { activityId: values.id, mode: 'AFTER_PREVIOUS', days: 7 },
    { activityId: gratitude.id, mode: 'AFTER_PREVIOUS', days: 7 },
  ])

  await mkProgram('Кращий сон за 2 тижні', 'Поведінкова програма проти безсоння: моніторинг, гігієна сну й заспокоєння перед сном.', [
    { activityId: sleepDiary.id, mode: 'IMMEDIATELY', days: 0 },
    { activityId: boxBreathing.id, mode: 'AFTER_START', days: 3 },
    { activityId: behavioral.id, mode: 'AFTER_START', days: 7 },
    { activityId: sleepDiary.id, mode: 'AFTER_START', days: 10 },
  ])

  await mkProgram('Основи КПТ: робота з думками', 'Чотири кроки, щоб навчитися помічати й перевіряти автоматичні думки.', [
    { activityId: wellbeing.id, mode: 'IMMEDIATELY', days: 0 },
    { activityId: thoughtRecord.id, mode: 'AFTER_PREVIOUS', days: 3 },
    { activityId: behavioral.id, mode: 'AFTER_PREVIOUS', days: 5 },
    { activityId: wellbeing.id, mode: 'AFTER_START', days: 21 },
  ])

  await mkProgram('Старт коучингу: перші кроки', 'Онбординг нового клієнта: цінності, баланс і перша ціль.', [
    { activityId: wheel.id, mode: 'IMMEDIATELY', days: 0 },
    { activityId: values.id, mode: 'AFTER_PREVIOUS', days: 3 },
    { activityId: smart.id, mode: 'AFTER_PREVIOUS', days: 4 },
  ], 80)

  // ===================== ГРУПИ =====================
  await prisma.group.create({
    data: {
      name: 'Група управління тривогою',
      description: 'Щотижнева група для роботи з тривожністю та стресом.',
      autoSendEnabled: true,
      autoSendActivityIds: [grounding.id],
      autoSendProgramIds: [anxietyProgram.id],
      createdAt: daysAgo(35),
      practitionerId: pid,
      members: { create: [{ clientId: olena.id }, { clientId: andrii.id }, { clientId: ihor.id }] },
    },
  })
  await prisma.group.create({
    data: {
      name: 'Mindfulness для початківців',
      description: 'Вступний курс усвідомленості, 6 тижнів.',
      createdAt: daysAgo(14),
      practitionerId: pid,
      members: { create: [{ clientId: andrii.id }] },
    },
  })

  // ===================== РЕСУРСИ / МАТЕРІАЛИ =====================
  const res = (
    kind: 'FILE' | 'LINK',
    name: string,
    extra: { url?: string; fileType?: string; size?: string; shared?: string[]; created?: number },
  ) =>
    prisma.resource.create({
      data: {
        kind,
        name,
        url: extra.url,
        fileType: extra.fileType,
        size: extra.size,
        createdAt: daysAgo(extra.created ?? 20),
        practitionerId: pid,
        shares: extra.shared ? { create: extra.shared.map((clientId) => ({ clientId })) } : undefined,
      },
    })

  await res('FILE', 'Памʼятка: гігієна сну.pdf', { fileType: 'PDF', size: '380 КБ', shared: [olena.id, andrii.id], created: 22 })
  await res('FILE', 'Картка: техніки заземлення при паніці.pdf', { fileType: 'PDF', size: '210 КБ', shared: [andrii.id], created: 18 })
  await res('FILE', 'Колесо емоцій (для друку).pdf', { fileType: 'PDF', size: '640 КБ', shared: [olena.id], created: 15 })
  await res('FILE', 'Інструкція: як вести щоденник думок.pdf', { fileType: 'PDF', size: '290 КБ', created: 12 })
  await res('FILE', 'Аудіо-медитація «Сканування тіла» 10 хв.mp3', { fileType: 'MP3', size: '9.4 МБ', shared: [ihor.id], created: 10 })
  await res('FILE', 'Список цінностей (підказка до вправи).pdf', { fileType: 'PDF', size: '120 КБ', created: 8 })
  await res('LINK', 'Відео: що таке КПТ і як вона працює', { url: 'https://www.youtube.com/results?search_query=cbt+basics', shared: [olena.id], created: 9 })
  await res('LINK', 'Стаття: дихальні техніки для зниження тривоги', { url: 'https://example.com/breathing-techniques', created: 6 })

  // ===================== ЗАДАЧІ =====================
  await prisma.task.createMany({
    data: [
      { title: 'Підготувати план сесії з Оленою', clientId: olena.id, dueDate: daysAhead(1), createdAt: daysAgo(2), practitionerId: pid },
      { title: 'Переглянути відповіді Андрія по оцінці стресу', clientId: andrii.id, dueDate: daysAhead(0), createdAt: daysAgo(1), practitionerId: pid },
      { title: 'Підібрати програму для Марії після інтейку', clientId: maria.id, dueDate: daysAhead(2), createdAt: daysAgo(1), practitionerId: pid },
      { title: 'Надіслати рахунок за травень', done: true, dueDate: daysAgo(1), createdAt: daysAgo(5), practitionerId: pid },
      { title: 'Оновити шаблон вітального листа', createdAt: daysAgo(3), practitionerId: pid },
    ],
  })

  // ===================== НОТАТКИ =====================
  await prisma.note.createMany({
    data: [
      { title: 'Сесія 12 — прогрес по тривозі', body: 'Олена відзначає менше панічних епізодів. Працює із заземленням 5-4-3-2-1. Домовились про щоденник вдячності 2 тижні.', clientId: olena.id, createdAt: daysAgo(4), practitionerId: pid },
      { title: 'Перша зустріч — запит', body: 'Андрій: стрес на роботі, складно «вимикатись» увечері. Висока мотивація. Почали з оцінки стресу + щоденник думок.', clientId: andrii.id, createdAt: daysAgo(30), practitionerId: pid },
      { title: 'Інтейк Марії', body: 'Запит: вигорання, проблеми зі сном. Розглянути програму «Кращий сон за 2 тижні» та моніторинг самопочуття.', clientId: maria.id, createdAt: daysAgo(2), practitionerId: pid },
      { title: 'Ідеї для групової роботи', body: 'Додати в групу тривоги тиждень про сон. Використати готову вправу «Дерево тривоги».', createdAt: daysAgo(10), practitionerId: pid },
    ],
  })

  // ===================== ЩОДЕННИК =====================
  await prisma.journalEntry.createMany({
    data: [
      { clientId: olena.id, date: daysAgo(0), mood: 'GOOD', title: 'Спокійний ранок', body: 'Прокинулась без тривоги вперше за тиждень. Зробила квадратне дихання одразу після пробудження — допомогло.', tags: ['тривога', 'дихання'], createdAt: daysAgo(0) },
      { clientId: andrii.id, date: daysAgo(0), mood: 'LOW', title: 'Важкий дедлайн', body: 'Знову затримався до ночі. Відчуваю тиск. Перед сном довго крутив у голові робочі розмови.', tags: ['робота', 'сон'], createdAt: daysAgo(0) },
      { clientId: olena.id, date: daysAgo(1), mood: 'NEUTRAL', body: 'Звичайний день, тривоги майже не було. Заповнила щоденник вдячності.', tags: ['вдячність'], reviewed: true, reply: 'Чудово, що практика стає звичкою. Помітила, що в дні з вправою тривоги менше — обговоримо на сесії.', createdAt: daysAgo(1) },
      { clientId: ihor.id, date: daysAgo(1), mood: 'GREAT', title: 'Гарний день', body: 'Ранкова пробіжка, час із сімʼєю. Багато енергії.', tags: ['спорт', 'сімʼя'], createdAt: daysAgo(1) },
      { clientId: andrii.id, date: daysAgo(2), mood: 'BAD', title: 'Зрив', body: 'Посварився з керівником, дуже розізлився, потім виснаження. Техніки не встиг застосувати — все швидко.', tags: ['робота', 'емоції'], reviewed: true, reply: 'Дякую, що поділилися складним днем. Те, що ви це помітили — вже крок. Розберемо ситуацію разом.', createdAt: daysAgo(2) },
      { clientId: olena.id, date: daysAgo(3), mood: 'GOOD', body: 'Поспілкувалася з подругою, відчула підтримку. Тривога була, але впоралась.', tags: [], reviewed: true, createdAt: daysAgo(3) },
      { clientId: ihor.id, date: daysAgo(4), mood: 'NEUTRAL', body: 'Трохи втомлений, але стабільно. Зробив сканування тіла перед сном.', tags: ['усвідомленість'], createdAt: daysAgo(4) },
      { clientId: andrii.id, date: daysAgo(5), mood: 'LOW', body: 'Знову прокидався вночі кілька разів. Вранці важко зібратися.', tags: ['сон'], reviewed: true, createdAt: daysAgo(5) },
    ],
  })

  // ===================== ДОСТАВКИ + КОМЕНТАРІ =====================
  // Відповіді мапимо на реальні id елементів активності «Оцінка стресу».
  const stressEls = await prisma.activityElement.findMany({ where: { activityId: stress.id }, orderBy: { order: 'asc' } })
  const byTitle = (needle: string) => stressEls.find((e) => e.title.includes(needle))?.id ?? ''
  const completed = await prisma.delivery.create({
    data: {
      kind: 'ACTIVITY',
      refId: stress.id,
      clientId: andrii.id,
      sentAt: daysAgo(6),
      status: 'COMPLETED',
      completedAt: daysAgo(4),
      responses: [
        { elementId: byTitle('напругу в тілі'), answer: 'Часто' },
        { elementId: byTitle('Якість сну'), answer: '4' },
        { elementId: byTitle('головний біль'), answer: 'Декілька разів' },
        { elementId: byTitle('джерелом стресу'), answer: 'Дедлайни на роботі та конфлікт з керівником. Складно вимикатись увечері — думки повертаються до робочих задач.' },
        { elementId: byTitle('Загальний рівень'), answer: '8' },
      ],
    },
  })
  await prisma.threadComment.createMany({
    data: [
      { deliveryId: completed.id, elementId: byTitle('джерелом стресу'), author: 'PRACTITIONER', text: 'Дякую за відвертість. Чи помічали ви, в які саме моменти найважче «вимкнутись» від роботи?', createdAt: daysAgo(4) },
      { deliveryId: completed.id, elementId: byTitle('джерелом стресу'), author: 'CLIENT', text: 'Найважче перед сном — лежу і прокручую розмови з керівником.', createdAt: daysAgo(3) },
      { deliveryId: completed.id, elementId: null, author: 'PRACTITIONER', text: 'Гарна робота із заповненням! Обговоримо результати на сесії в четвер.', createdAt: daysAgo(4) },
    ],
  })
  // Завершений PHQ-9 від Андрія — щоб у адмінці було видно авто-оцінку (бал/смуга/безпека).
  const phqEls = await prisma.activityElement.findMany({
    where: { activityId: phq9.id, type: 'MULTIPLE_CHOICE' },
    orderBy: { order: 'asc' },
  })
  // Відповіді за індексами варіантів: помірно-важка депресія, без ризику за п.9.
  const phqAnswerIdx = [2, 2, 3, 2, 1, 2, 2, 1, 0] // сума = 15 (помірно-важка)
  await prisma.delivery.create({
    data: {
      kind: 'ACTIVITY',
      refId: phq9.id,
      clientId: andrii.id,
      sentAt: daysAgo(5),
      status: 'COMPLETED',
      completedAt: daysAgo(4),
      responses: phqEls.map((e, i) => ({ elementId: e.id, answer: FREQ[phqAnswerIdx[i] ?? 0] })),
    },
  })

  // Динаміка тестів демо-клієнтки Олени — кілька проходжень у часі (для графіка).
  const gadEls = await prisma.activityElement.findMany({
    where: { activityId: gad7.id, type: 'MULTIPLE_CHOICE' },
    orderBy: { order: 'asc' },
  })
  const whoEls = await prisma.activityElement.findMany({
    where: { activityId: who5.id, type: 'MULTIPLE_CHOICE' },
    orderBy: { order: 'asc' },
  })
  const series = (
    refId: string,
    elsArr: { id: string }[],
    opts: string[],
    idxs: number[],
    when: number,
  ) =>
    prisma.delivery.create({
      data: {
        kind: 'ACTIVITY',
        refId,
        clientId: olena.id,
        sentAt: daysAgo(when + 1),
        status: 'COMPLETED',
        completedAt: daysAgo(when),
        responses: elsArr.map((e, i) => ({ elementId: e.id, answer: opts[idxs[i] ?? 0] })),
      },
    })
  // PHQ-9: помітне покращення 17 → 14 → 10 → 6.
  await series(phq9.id, phqEls, FREQ, [2, 2, 2, 2, 2, 2, 2, 2, 1], 28)
  await series(phq9.id, phqEls, FREQ, [2, 2, 2, 1, 1, 2, 1, 2, 1], 21)
  await series(phq9.id, phqEls, FREQ, [1, 2, 1, 1, 1, 1, 1, 1, 1], 14)
  await series(phq9.id, phqEls, FREQ, [1, 1, 1, 1, 0, 1, 0, 1, 0], 7)
  // GAD-7: 12 → 8 → 4.
  await series(gad7.id, gadEls, FREQ, [2, 2, 2, 2, 1, 2, 1], 28)
  await series(gad7.id, gadEls, FREQ, [1, 1, 2, 1, 1, 1, 1], 14)
  await series(gad7.id, gadEls, FREQ, [1, 1, 1, 0, 0, 1, 0], 7)
  // WHO-5: благополуччя зростає 24 → 40 → 56.
  await series(who5.id, whoEls, WHO_OPTS, [1, 1, 1, 2, 1], 21)
  await series(who5.id, whoEls, WHO_OPTS, [2, 2, 2, 2, 2], 14)
  await series(who5.id, whoEls, WHO_OPTS, [3, 3, 3, 2, 3], 7)

  await prisma.delivery.createMany({
    data: [
      // Демо-клієнт Олена — насичений набір для мобільного застосунку.
      { kind: 'PROGRAM', refId: anxietyProgram.id, clientId: olena.id, sentAt: daysAgo(12), status: 'IN_PROGRESS' },
      { kind: 'ACTIVITY', refId: breathing478.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: selfCards.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: gratitude.id, clientId: olena.id, sentAt: daysAgo(3), status: 'IN_PROGRESS' },
      { kind: 'ACTIVITY', refId: grounding.id, clientId: olena.id, sentAt: daysAgo(1), status: 'SENT' },
      { kind: 'ACTIVITY', refId: bodyScan.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      // Стандартизовані тести — щотижневий моніторинг.
      { kind: 'ACTIVITY', refId: phq9.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: gad7.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: who5.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: pss10.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: pcl5.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: dass21.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      { kind: 'ACTIVITY', refId: audit.id, clientId: olena.id, sentAt: daysAgo(0), status: 'SENT' },
      // Інші клієнти.
      { kind: 'PROGRAM', refId: anxietyProgram.id, clientId: ihor.id, sentAt: daysAgo(10), status: 'IN_PROGRESS' },
      { kind: 'ACTIVITY', refId: grounding.id, clientId: ihor.id, sentAt: daysAgo(1), status: 'SENT' },
    ],
  })

  const counts = {
    activities: await prisma.activity.count(),
    premade: await prisma.activity.count({ where: { isPremade: true } }),
    programs: await prisma.program.count(),
    resources: await prisma.resource.count(),
  }
  console.log('✓ Демо-дані створено', counts)
  console.log('  Психолог: demo@psychoprogram.com / demo1234')
  console.log('  Клієнт:   client@psychoprogram.com / demo1234')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
