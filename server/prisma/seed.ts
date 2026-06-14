import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const daysAhead = (n: number) => daysAgo(-n)

async function main() {
  // Очищення в порядку залежностей (ідемпотентний сід).
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
    data: {
      email: 'demo@psychoprogram.com',
      passwordHash,
      role: 'PRACTITIONER',
      firstName: 'Демо',
      lastName: 'Практик',
    },
  })
  const pid = practitioner.id

  // Клієнт з акаунтом для мобільного додатка.
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@psychoprogram.com',
      passwordHash,
      role: 'CLIENT',
      firstName: 'Олена',
      lastName: 'Ковальчук',
    },
  })

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

  // --- Активності (двi власні + двi готові/premade) ---
  const gratitude = await prisma.activity.create({
    data: {
      title: 'Щоденник вдячності',
      description: 'Щоденна вправа для фіксації трьох речей, за які ви вдячні.',
      pageBreaksEnabled: false,
      practitionerId: pid,
      updatedAt: daysAgo(5),
      elements: {
        create: [
          { type: 'TEXT', title: 'Вдячність допомагає зміщувати фокус уваги на позитивні аспекти життя.', order: 0, options: [] },
          { type: 'SHORT_ANSWER', title: 'За що ви вдячні сьогодні? (перше)', order: 1, options: [] },
          { type: 'SHORT_ANSWER', title: 'За що ви вдячні сьогодні? (друге)', order: 2, options: [] },
          { type: 'LONG_ANSWER', title: 'Опишіть момент дня, який викликав найприємніші емоції.', order: 3, options: [] },
          { type: 'SCALE', title: 'Оцініть свій настрій сьогодні (1–10)', order: 4, options: [] },
        ],
      },
    },
  })
  const stress = await prisma.activity.create({
    data: {
      title: 'Оцінка рівня стресу',
      description: 'Коротка анкета для самооцінки рівня стресу за останній тиждень.',
      pageBreaksEnabled: true,
      practitionerId: pid,
      updatedAt: daysAgo(2),
      elements: {
        create: [
          { type: 'SECTION', title: 'Частина 1. Фізичні відчуття', order: 0, options: [] },
          { type: 'MULTIPLE_CHOICE', title: 'Як часто ви відчували напругу в тілі цього тижня?', order: 1, options: ['Майже ніколи', 'Іноді', 'Часто', 'Постійно'] },
          { type: 'SCALE', title: 'Якість сну за тиждень (1–10)', order: 2, options: [] },
          { type: 'PAGE_BREAK', title: '', order: 3, options: [] },
          { type: 'MULTIPLE_CHOICE', title: 'Чи відчували ви головний біль або втому?', order: 4, options: ['Ні', 'Один-два рази', 'Декілька разів', 'Щодня'] },
          { type: 'SECTION', title: 'Частина 2. Емоційний стан', order: 5, options: [] },
          { type: 'LONG_ANSWER', title: 'Що було головним джерелом стресу цього тижня?', order: 6, options: [] },
          { type: 'SCALE', title: 'Загальний рівень стресу (1–10)', order: 7, options: [] },
        ],
      },
    },
  })
  const wheel = await prisma.activity.create({
    data: {
      title: 'Колесо життєвого балансу',
      description: 'Оцінка задоволеності ключовими сферами життя.',
      isPremade: true,
      category: 'Коучинг',
      updatedAt: daysAgo(60),
      elements: {
        create: [
          { type: 'TEXT', title: 'Оцініть кожну сферу життя від 1 до 10.', order: 0, options: [] },
          { type: 'SCALE', title: 'Кар’єра', order: 1, options: [] },
          { type: 'SCALE', title: 'Стосунки', order: 2, options: [] },
          { type: 'SCALE', title: 'Здоров’я', order: 3, options: [] },
          { type: 'LONG_ANSWER', title: 'Яку сферу ви хочете покращити в першу чергу і чому?', order: 4, options: [] },
        ],
      },
    },
  })
  const breathing = await prisma.activity.create({
    data: {
      title: 'Дихальна вправа 4-7-8',
      description: 'Відео-інструкція та рефлексія після практики.',
      isPremade: true,
      category: 'Усвідомленість',
      updatedAt: daysAgo(45),
      elements: {
        create: [
          { type: 'VIDEO', title: 'Відео-інструкція до техніки дихання 4-7-8', order: 0, options: [] },
          { type: 'LONG_ANSWER', title: 'Які відчуття виникли після виконання вправи?', order: 1, options: [] },
        ],
      },
    },
  })

  // --- Програми ---
  const anxietyProgram = await prisma.program.create({
    data: {
      title: 'Програма зниження тривожності (4 тижні)',
      description: 'Поетапна програма з щотижневими активностями для роботи з тривогою.',
      practitionerId: pid,
      updatedAt: daysAgo(7),
      steps: {
        create: [
          { activityId: stress.id, mode: 'IMMEDIATELY', days: 0, order: 0 },
          { activityId: gratitude.id, mode: 'AFTER_PREVIOUS', days: 3, order: 1 },
          { activityId: breathing.id, mode: 'AFTER_PREVIOUS', days: 7, order: 2 },
          { activityId: wheel.id, mode: 'AFTER_START', days: 21, order: 3 },
        ],
      },
    },
  })
  await prisma.program.create({
    data: {
      title: 'Старт коучингу: перші кроки',
      description: 'Готова програма онбордингу нового клієнта в коучинговий процес.',
      isPremade: true,
      updatedAt: daysAgo(80),
      steps: {
        create: [
          { activityId: wheel.id, mode: 'IMMEDIATELY', days: 0, order: 0 },
          { activityId: gratitude.id, mode: 'AFTER_PREVIOUS', days: 2, order: 1 },
        ],
      },
    },
  })

  // --- Групи з авто-надсиланням ---
  await prisma.group.create({
    data: {
      name: 'Група управління тривогою',
      description: 'Щотижнева група для роботи з тривожністю та стресом.',
      autoSendEnabled: true,
      autoSendActivityIds: [gratitude.id],
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

  // --- Ресурси ---
  await prisma.resource.create({
    data: { kind: 'FILE', name: 'Пам’ятка про гігієну сну.pdf', fileType: 'PDF', size: '420 КБ', createdAt: daysAgo(20), practitionerId: pid, shares: { create: [{ clientId: olena.id }, { clientId: andrii.id }] } },
  })
  await prisma.resource.create({
    data: { kind: 'FILE', name: 'Аудіо-медитація 10 хв.mp3', fileType: 'MP3', size: '9.2 МБ', createdAt: daysAgo(12), practitionerId: pid, shares: { create: [{ clientId: ihor.id }] } },
  })
  await prisma.resource.create({
    data: { kind: 'LINK', name: 'Стаття: як працює КПТ', url: 'https://example.com/cbt-basics', createdAt: daysAgo(6), practitionerId: pid },
  })

  // --- Задачі ---
  await prisma.task.createMany({
    data: [
      { title: 'Підготувати план сесії з Оленою', clientId: olena.id, dueDate: daysAhead(1), createdAt: daysAgo(2), practitionerId: pid },
      { title: 'Переглянути відповіді Андрія по оцінці стресу', clientId: andrii.id, dueDate: daysAhead(0), createdAt: daysAgo(1), practitionerId: pid },
      { title: 'Надіслати рахунок за травень', done: true, dueDate: daysAgo(1), createdAt: daysAgo(5), practitionerId: pid },
      { title: 'Оновити шаблон вітального листа', createdAt: daysAgo(3), practitionerId: pid },
    ],
  })

  // --- Нотатки ---
  await prisma.note.createMany({
    data: [
      { title: 'Сесія 12 — прогрес по тривозі', body: 'Олена відзначає менше епізодів панічних станів. Домовились про щоденник вдячності щодня протягом 2 тижнів.', clientId: olena.id, createdAt: daysAgo(4), practitionerId: pid },
      { title: 'Перша зустріч — запит', body: 'Андрій звернувся з запитом на роботу зі стресом на роботі. Висока мотивація.', clientId: andrii.id, createdAt: daysAgo(30), practitionerId: pid },
      { title: 'Ідеї для групової програми', body: 'Додати до групи управління тривогою тиждень про сон.', createdAt: daysAgo(10), practitionerId: pid },
    ],
  })

  // --- Записи щоденника ---
  await prisma.journalEntry.createMany({
    data: [
      { clientId: olena.id, date: daysAgo(0), mood: 'GOOD', title: 'Спокійний ранок', body: 'Сьогодні прокинулась без тривоги вперше за тиждень. Зробила дихальну вправу одразу після пробудження — допомогло.', tags: ['тривога', 'дихання'], createdAt: daysAgo(0) },
      { clientId: andrii.id, date: daysAgo(0), mood: 'LOW', title: 'Важкий дедлайн', body: 'Знову затримався на роботі до ночі. Відчуваю, що не встигаю, і це тисне.', tags: ['робота', 'сон'], createdAt: daysAgo(0) },
      { clientId: olena.id, date: daysAgo(1), mood: 'NEUTRAL', body: 'День був звичайний. Тривоги майже не було. Записала три речі, за які вдячна.', tags: ['вдячність'], reviewed: true, reply: 'Чудово, що ведете щоденник вдячності щодня. Обговоримо це на сесії.', createdAt: daysAgo(1) },
      { clientId: ihor.id, date: daysAgo(1), mood: 'GREAT', title: 'Гарний день', body: 'Ходив на пробіжку вранці, потім провів час із сім’єю. Відчуваю енергію.', tags: ['спорт', 'сім’я'], createdAt: daysAgo(1) },
      { clientId: andrii.id, date: daysAgo(2), mood: 'BAD', title: 'Зрив', body: 'Посварився з керівником. Дуже розізлився, потім почувався виснаженим.', tags: ['робота', 'емоції'], reviewed: true, reply: 'Дякую, що поділилися навіть складним днем. Розберемо цю ситуацію разом.', createdAt: daysAgo(2) },
      { clientId: olena.id, date: daysAgo(3), mood: 'GOOD', body: 'Гарно поспілкувалася з подругою, відчула підтримку.', tags: [], reviewed: true, createdAt: daysAgo(3) },
      { clientId: ihor.id, date: daysAgo(4), mood: 'NEUTRAL', body: 'Трохи втомлений, але загалом стабільно. Зробив вправу на усвідомленість перед сном.', tags: ['усвідомленість'], createdAt: daysAgo(4) },
      { clientId: andrii.id, date: daysAgo(5), mood: 'LOW', body: 'Знову проблеми зі сном. Прокидався кілька разів за ніч.', tags: ['сон'], reviewed: true, createdAt: daysAgo(5) },
    ],
  })

  // --- Доставки + гілка коментарів ---
  const completed = await prisma.delivery.create({
    data: {
      kind: 'ACTIVITY',
      refId: stress.id,
      clientId: andrii.id,
      sentAt: daysAgo(6),
      status: 'COMPLETED',
      completedAt: daysAgo(4),
      responses: [
        { elementId: 'mc-1', answer: 'Часто' },
        { elementId: 'scale-1', answer: '4' },
        { elementId: 'long-1', answer: 'Дедлайни на роботі та конфлікт з керівником.' },
        { elementId: 'scale-2', answer: '8' },
      ],
    },
  })
  await prisma.threadComment.createMany({
    data: [
      { deliveryId: completed.id, elementId: 'long-1', author: 'PRACTITIONER', text: 'Дякую за відвертість. Чи помічали ви, в які моменти найважче «вимкнутись» від роботи?', createdAt: daysAgo(4) },
      { deliveryId: completed.id, elementId: 'long-1', author: 'CLIENT', text: 'Найважче перед сном — лежу і прокручую розмови з керівником.', createdAt: daysAgo(3) },
      { deliveryId: completed.id, elementId: null, author: 'PRACTITIONER', text: 'Гарна робота! Обговоримо результати на сесії в четвер.', createdAt: daysAgo(4) },
    ],
  })
  await prisma.delivery.createMany({
    data: [
      { kind: 'ACTIVITY', refId: gratitude.id, clientId: olena.id, sentAt: daysAgo(3), status: 'IN_PROGRESS' },
      { kind: 'PROGRAM', refId: anxietyProgram.id, clientId: ihor.id, sentAt: daysAgo(10), status: 'IN_PROGRESS' },
      { kind: 'ACTIVITY', refId: gratitude.id, clientId: ihor.id, sentAt: daysAgo(1), status: 'SENT' },
    ],
  })

  console.log('✓ Демо-дані створено')
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
