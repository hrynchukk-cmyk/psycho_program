import { createContext, useContext, useState, type ReactNode } from 'react'
import type {
  Activity,
  Client,
  Delivery,
  Group,
  JournalEntry,
  Note,
  Program,
  ResourceItem,
  Task,
  ThreadComment,
} from '../types'

let counter = 100
export const uid = (prefix: string) => `${prefix}-${++counter}`

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
const daysAhead = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

const seedClients: Client[] = [
  { id: 'c-1', firstName: 'Олена', lastName: 'Ковальчук', email: 'olena.k@example.com', status: 'active', createdAt: daysAgo(40) },
  { id: 'c-2', firstName: 'Андрій', lastName: 'Шевченко', email: 'andrii.sh@example.com', status: 'active', createdAt: daysAgo(32) },
  { id: 'c-3', firstName: 'Марія', lastName: 'Бондаренко', email: 'maria.b@example.com', status: 'invited', createdAt: daysAgo(3) },
  { id: 'c-4', firstName: 'Ігор', lastName: 'Ткаченко', email: 'ihor.t@example.com', status: 'active', createdAt: daysAgo(21) },
  { id: 'c-5', firstName: 'Світлана', lastName: 'Мельник', email: 'svitlana.m@example.com', status: 'archived', createdAt: daysAgo(90) },
]

const seedGroups: Group[] = [
  {
    id: 'g-1',
    name: 'Група управління тривогою',
    description: 'Щотижнева група для роботи з тривожністю та стресом.',
    memberIds: ['c-1', 'c-2', 'c-4'],
    autoSendEnabled: true,
    autoSendActivityIds: ['a-1'],
    autoSendProgramIds: ['p-1'],
    createdAt: daysAgo(35),
  },
  {
    id: 'g-2',
    name: 'Mindfulness для початківців',
    description: 'Вступний курс усвідомленості, 6 тижнів.',
    memberIds: ['c-2'],
    autoSendEnabled: false,
    autoSendActivityIds: [],
    autoSendProgramIds: [],
    createdAt: daysAgo(14),
  },
]

const seedActivities: Activity[] = [
  {
    id: 'a-1',
    title: 'Щоденник вдячності',
    description: 'Щоденна вправа для фіксації трьох речей, за які ви вдячні.',
    pageBreaksEnabled: false,
    isPremade: false,
    updatedAt: daysAgo(5),
    elements: [
      { id: 'e-1', type: 'text', title: 'Вдячність допомагає зміщувати фокус уваги на позитивні аспекти життя. Запишіть свої думки нижче.' },
      { id: 'e-2', type: 'shortAnswer', title: 'За що ви вдячні сьогодні? (перше)' },
      { id: 'e-3', type: 'shortAnswer', title: 'За що ви вдячні сьогодні? (друге)' },
      { id: 'e-4', type: 'longAnswer', title: 'Опишіть момент дня, який викликав найприємніші емоції.' },
      { id: 'e-5', type: 'scale', title: 'Оцініть свій настрій сьогодні (1–10)' },
    ],
  },
  {
    id: 'a-2',
    title: 'Оцінка рівня стресу',
    description: 'Коротка анкета для самооцінки рівня стресу за останній тиждень.',
    pageBreaksEnabled: true,
    isPremade: false,
    updatedAt: daysAgo(2),
    elements: [
      { id: 'e-10', type: 'section', title: 'Частина 1. Фізичні відчуття' },
      { id: 'e-11', type: 'multipleChoice', title: 'Як часто ви відчували напругу в тілі цього тижня?', options: ['Майже ніколи', 'Іноді', 'Часто', 'Постійно'] },
      { id: 'e-12', type: 'scale', title: 'Якість сну за тиждень (1–10)' },
      { id: 'e-13', type: 'pageBreak', title: '' },
      { id: 'e-14', type: 'multipleChoice', title: 'Чи відчували ви головний біль або втому?', options: ['Ні', 'Один-два рази', 'Декілька разів', 'Щодня'] },
      { id: 'e-15', type: 'section', title: 'Частина 2. Емоційний стан' },
      { id: 'e-16', type: 'longAnswer', title: 'Що було головним джерелом стресу цього тижня?' },
      { id: 'e-17', type: 'scale', title: 'Загальний рівень стресу (1–10)' },
    ],
  },
  {
    id: 'a-3',
    title: 'Колесо життєвого балансу',
    description: 'Оцінка задоволеності ключовими сферами життя.',
    pageBreaksEnabled: false,
    isPremade: true,
    category: 'Коучинг',
    updatedAt: daysAgo(60),
    elements: [
      { id: 'e-20', type: 'text', title: 'Оцініть кожну сферу життя від 1 до 10.' },
      { id: 'e-21', type: 'scale', title: 'Кар’єра' },
      { id: 'e-22', type: 'scale', title: 'Стосунки' },
      { id: 'e-23', type: 'scale', title: 'Здоров’я' },
      { id: 'e-24', type: 'longAnswer', title: 'Яку сферу ви хочете покращити в першу чергу і чому?' },
    ],
  },
  {
    id: 'a-4',
    title: 'Дихальна вправа 4-7-8',
    description: 'Аудіо-інструкція та рефлексія після практики.',
    pageBreaksEnabled: false,
    isPremade: true,
    category: 'Усвідомленість',
    updatedAt: daysAgo(45),
    elements: [
      { id: 'e-30', type: 'video', title: 'Відео-інструкція до техніки дихання 4-7-8' },
      { id: 'e-31', type: 'longAnswer', title: 'Які відчуття виникли після виконання вправи?' },
    ],
  },
]

const seedPrograms: Program[] = [
  {
    id: 'p-1',
    title: 'Програма зниження тривожності (4 тижні)',
    description: 'Поетапна програма з щотижневими активностями для роботи з тривогою.',
    isPremade: false,
    updatedAt: daysAgo(7),
    steps: [
      { id: 's-1', activityId: 'a-2', mode: 'immediately', days: 0 },
      { id: 's-2', activityId: 'a-1', mode: 'afterPrevious', days: 3 },
      { id: 's-3', activityId: 'a-4', mode: 'afterPrevious', days: 7 },
      { id: 's-4', activityId: 'a-3', mode: 'afterStart', days: 21 },
    ],
  },
  {
    id: 'p-2',
    title: 'Старт коучингу: перші кроки',
    description: 'Готова програма онбордингу нового клієнта в коучинговий процес.',
    isPremade: true,
    updatedAt: daysAgo(80),
    steps: [
      { id: 's-10', activityId: 'a-3', mode: 'immediately', days: 0 },
      { id: 's-11', activityId: 'a-1', mode: 'afterPrevious', days: 2 },
    ],
  },
]

const seedResources: ResourceItem[] = [
  { id: 'r-1', kind: 'file', name: 'Пам’ятка про гігієну сну.pdf', fileType: 'PDF', size: '420 КБ', sharedWithClientIds: ['c-1', 'c-2'], createdAt: daysAgo(20) },
  { id: 'r-2', kind: 'file', name: 'Аудіо-медитація 10 хв.mp3', fileType: 'MP3', size: '9.2 МБ', sharedWithClientIds: ['c-4'], createdAt: daysAgo(12) },
  { id: 'r-3', kind: 'link', name: 'Стаття: як працює КПТ', url: 'https://example.com/cbt-basics', sharedWithClientIds: [], createdAt: daysAgo(6) },
]

const seedTasks: Task[] = [
  { id: 't-1', title: 'Підготувати план сесії з Оленою', clientId: 'c-1', dueDate: daysAhead(1), done: false, createdAt: daysAgo(2) },
  { id: 't-2', title: 'Переглянути відповіді Андрія по оцінці стресу', clientId: 'c-2', dueDate: daysAhead(0), done: false, createdAt: daysAgo(1) },
  { id: 't-3', title: 'Надіслати рахунок за травень', clientId: null, dueDate: daysAgo(1), done: true, createdAt: daysAgo(5) },
  { id: 't-4', title: 'Оновити шаблон вітального листа', clientId: null, done: false, createdAt: daysAgo(3) },
]

const seedNotes: Note[] = [
  {
    id: 'n-1',
    title: 'Сесія 12 — прогрес по тривозі',
    body: 'Олена відзначає менше епізодів панічних станів. Домовились про щоденник вдячності щодня протягом 2 тижнів. На наступній сесії — переглянути результати.',
    clientId: 'c-1',
    createdAt: daysAgo(4),
  },
  {
    id: 'n-2',
    title: 'Першa зустріч — запит',
    body: 'Андрій звернувся з запитом на роботу зі стресом на роботі. Висока мотивація. Починаємо з оцінки рівня стресу.',
    clientId: 'c-2',
    createdAt: daysAgo(30),
  },
  {
    id: 'n-3',
    title: 'Ідеї для групової програми',
    body: 'Додати до групи управління тривогою тиждень про сон. Розглянути готовий контент з бібліотеки.',
    clientId: null,
    createdAt: daysAgo(10),
  },
]

const seedDeliveries: Delivery[] = [
  {
    id: 'd-1',
    kind: 'activity',
    refId: 'a-2',
    clientId: 'c-2',
    sentAt: daysAgo(6),
    status: 'completed',
    completedAt: daysAgo(4),
    responses: [
      { elementId: 'e-11', answer: 'Часто' },
      { elementId: 'e-12', answer: '4' },
      { elementId: 'e-14', answer: 'Декілька разів' },
      { elementId: 'e-16', answer: 'Дедлайни на роботі та конфлікт з керівником. Складно вимикатись увечері, думки повертаються до робочих задач.' },
      { elementId: 'e-17', answer: '8' },
    ],
  },
  { id: 'd-2', kind: 'activity', refId: 'a-1', clientId: 'c-1', sentAt: daysAgo(3), status: 'inProgress' },
  { id: 'd-3', kind: 'program', refId: 'p-1', clientId: 'c-4', sentAt: daysAgo(10), status: 'inProgress' },
  { id: 'd-4', kind: 'activity', refId: 'a-1', clientId: 'c-4', sentAt: daysAgo(1), status: 'sent' },
]

const seedComments: ThreadComment[] = [
  { id: 'cm-1', deliveryId: 'd-1', elementId: 'e-16', author: 'practitioner', text: 'Дякую за відвертість. Чи помічали ви, в які саме моменти найважче «вимкнутись» від роботи?', createdAt: daysAgo(4) },
  { id: 'cm-2', deliveryId: 'd-1', elementId: 'e-16', author: 'client', text: 'Найважче перед сном — лежу і прокручую розмови з керівником.', createdAt: daysAgo(3) },
  { id: 'cm-3', deliveryId: 'd-1', elementId: null, author: 'practitioner', text: 'Гарна робота з заповненням анкети! Обговоримо результати на сесії в четвер.', createdAt: daysAgo(4) },
]

const seedJournal: JournalEntry[] = [
  {
    id: 'j-1',
    clientId: 'c-1',
    date: daysAgo(0),
    mood: 'good',
    title: 'Спокійний ранок',
    body: 'Сьогодні прокинулась без тривоги вперше за тиждень. Зробила дихальну вправу одразу після пробудження — допомогло. Вдень була зустріч, яку давно відкладала, і вона пройшла легше, ніж я очікувала.',
    tags: ['тривога', 'дихання'],
    reviewed: false,
    createdAt: daysAgo(0),
  },
  {
    id: 'j-2',
    clientId: 'c-2',
    date: daysAgo(0),
    mood: 'low',
    title: 'Важкий дедлайн',
    body: 'Знову затримався на роботі до ночі. Відчуваю, що не встигаю, і це тисне. Перед сном довго не міг заснути — прокручував робочі розмови.',
    tags: ['робота', 'сон'],
    reviewed: false,
    createdAt: daysAgo(0),
  },
  {
    id: 'j-3',
    clientId: 'c-1',
    date: daysAgo(1),
    mood: 'neutral',
    body: 'День був звичайний. Нічого особливого не сталося, але й тривоги майже не було. Записала три речі, за які вдячна.',
    tags: ['вдячність'],
    reviewed: true,
    reply: 'Чудово, що ведете щоденник вдячності щодня. Помітила, що в дні з вправою тривоги менше — обговоримо це на сесії.',
    createdAt: daysAgo(1),
  },
  {
    id: 'j-4',
    clientId: 'c-4',
    date: daysAgo(1),
    mood: 'great',
    title: 'Гарний день',
    body: 'Ходив на пробіжку вранці, потім провів час із сім\'єю. Відчуваю енергію і бажання продовжувати працювати над собою.',
    tags: ['спорт', 'сім\'я'],
    reviewed: false,
    createdAt: daysAgo(1),
  },
  {
    id: 'j-5',
    clientId: 'c-2',
    date: daysAgo(2),
    mood: 'bad',
    title: 'Зрив',
    body: 'Посварився з керівником. Дуже розізлився, потім почувався виснаженим. Не зміг застосувати техніки, про які ми говорили — все сталося надто швидко.',
    tags: ['робота', 'емоції'],
    reviewed: true,
    reply: 'Дякую, що поділилися навіть складним днем. Те, що ви це помітили й описали — вже важливий крок. Розберемо цю ситуацію разом.',
    createdAt: daysAgo(2),
  },
  {
    id: 'j-6',
    clientId: 'c-1',
    date: daysAgo(3),
    mood: 'good',
    body: 'Гарно поспілкувалася з подругою, відчула підтримку. Тривога була, але я з нею впоралась.',
    reviewed: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'j-7',
    clientId: 'c-4',
    date: daysAgo(4),
    mood: 'neutral',
    body: 'Трохи втомлений, але загалом стабільно. Зробив вправу на усвідомленість перед сном.',
    tags: ['усвідомленість'],
    reviewed: false,
    createdAt: daysAgo(4),
  },
  {
    id: 'j-8',
    clientId: 'c-2',
    date: daysAgo(5),
    mood: 'low',
    body: 'Знову проблеми зі сном. Прокидався кілька разів за ніч. Вранці важко було зібратися.',
    tags: ['сон'],
    reviewed: true,
    createdAt: daysAgo(5),
  },
]

interface Store {
  clients: Client[]
  groups: Group[]
  activities: Activity[]
  programs: Program[]
  resources: ResourceItem[]
  tasks: Task[]
  notes: Note[]
  deliveries: Delivery[]
  comments: ThreadComment[]
  journal: JournalEntry[]
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  addGroup: (g: Omit<Group, 'id' | 'createdAt'>) => void
  updateGroup: (id: string, patch: Partial<Group>) => void
  addActivity: (a: Omit<Activity, 'id' | 'updatedAt'>) => string
  updateActivity: (id: string, patch: Partial<Activity>) => void
  deleteActivity: (id: string) => void
  copyPremadeActivity: (id: string) => string
  addProgram: (p: Omit<Program, 'id' | 'updatedAt'>) => string
  updateProgram: (id: string, patch: Partial<Program>) => void
  deleteProgram: (id: string) => void
  copyPremadeProgram: (id: string) => string
  addResource: (r: Omit<ResourceItem, 'id' | 'createdAt'>) => void
  updateResource: (id: string, patch: Partial<ResourceItem>) => void
  deleteResource: (id: string) => void
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'done'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addNote: (n: Omit<Note, 'id' | 'createdAt'>) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  sendToClients: (kind: 'activity' | 'program', refId: string, clientIds: string[]) => void
  addComment: (deliveryId: string, elementId: string | null, text: string) => void
  reopenDelivery: (id: string) => void
  markJournalReviewed: (id: string, reviewed: boolean) => void
  replyToJournal: (id: string, reply: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState(seedClients)
  const [groups, setGroups] = useState(seedGroups)
  const [activities, setActivities] = useState(seedActivities)
  const [programs, setPrograms] = useState(seedPrograms)
  const [resources, setResources] = useState(seedResources)
  const [tasks, setTasks] = useState(seedTasks)
  const [notes, setNotes] = useState(seedNotes)
  const [deliveries, setDeliveries] = useState(seedDeliveries)
  const [comments, setComments] = useState(seedComments)
  const [journal, setJournal] = useState(seedJournal)

  const now = () => new Date().toISOString()

  const store: Store = {
    clients,
    groups,
    activities,
    programs,
    resources,
    tasks,
    notes,
    deliveries,
    comments,
    journal,
    addClient: (c) => setClients((xs) => [...xs, { ...c, id: uid('c'), createdAt: now() }]),
    updateClient: (id, patch) => setClients((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    addGroup: (g) => setGroups((xs) => [...xs, { ...g, id: uid('g'), createdAt: now() }]),
    updateGroup: (id, patch) => setGroups((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    addActivity: (a) => {
      const id = uid('a')
      setActivities((xs) => [...xs, { ...a, id, updatedAt: now() }])
      return id
    },
    updateActivity: (id, patch) =>
      setActivities((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x))),
    deleteActivity: (id) => setActivities((xs) => xs.filter((x) => x.id !== id)),
    copyPremadeActivity: (id) => {
      const src = activities.find((a) => a.id === id)!
      const newId = uid('a')
      setActivities((xs) => [
        ...xs,
        { ...src, id: newId, title: `${src.title} (копія)`, isPremade: false, updatedAt: now() },
      ])
      return newId
    },
    addProgram: (p) => {
      const id = uid('p')
      setPrograms((xs) => [...xs, { ...p, id, updatedAt: now() }])
      return id
    },
    updateProgram: (id, patch) =>
      setPrograms((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x))),
    deleteProgram: (id) => setPrograms((xs) => xs.filter((x) => x.id !== id)),
    copyPremadeProgram: (id) => {
      const src = programs.find((p) => p.id === id)!
      const newId = uid('p')
      setPrograms((xs) => [
        ...xs,
        { ...src, id: newId, title: `${src.title} (копія)`, isPremade: false, updatedAt: now() },
      ])
      return newId
    },
    addResource: (r) => setResources((xs) => [...xs, { ...r, id: uid('r'), createdAt: now() }]),
    updateResource: (id, patch) => setResources((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    deleteResource: (id) => setResources((xs) => xs.filter((x) => x.id !== id)),
    addTask: (t) => setTasks((xs) => [...xs, { ...t, id: uid('t'), done: false, createdAt: now() }]),
    toggleTask: (id) => setTasks((xs) => xs.map((x) => (x.id === id ? { ...x, done: !x.done } : x))),
    deleteTask: (id) => setTasks((xs) => xs.filter((x) => x.id !== id)),
    addNote: (n) => setNotes((xs) => [{ ...n, id: uid('n'), createdAt: now() }, ...xs]),
    updateNote: (id, patch) => setNotes((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    deleteNote: (id) => setNotes((xs) => xs.filter((x) => x.id !== id)),
    sendToClients: (kind, refId, clientIds) =>
      setDeliveries((xs) => [
        ...xs,
        ...clientIds.map((clientId) => ({
          id: uid('d'),
          kind,
          refId,
          clientId,
          sentAt: now(),
          status: 'sent' as const,
        })),
      ]),
    addComment: (deliveryId, elementId, text) =>
      setComments((xs) => [
        ...xs,
        { id: uid('cm'), deliveryId, elementId, author: 'practitioner', text, createdAt: now() },
      ]),
    reopenDelivery: (id) =>
      setDeliveries((xs) =>
        xs.map((x) => (x.id === id ? { ...x, status: 'inProgress', completedAt: undefined } : x)),
      ),
    markJournalReviewed: (id, reviewed) =>
      setJournal((xs) => xs.map((x) => (x.id === id ? { ...x, reviewed } : x))),
    replyToJournal: (id, reply) =>
      setJournal((xs) => xs.map((x) => (x.id === id ? { ...x, reply, reviewed: true } : x))),
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

export const clientName = (c?: Client) => (c ? `${c.firstName} ${c.lastName}` : '—')
