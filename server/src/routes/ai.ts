import { Router } from 'express'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { asyncHandler } from '../lib/http.js'
import { authenticate, requireRole } from '../lib/auth.js'

// AI-консультант для психологів: пошук доказових матеріалів КПТ і суміжних
// підходів із прив'язкою до довірених джерел. Доступний лише психологам.
export const aiRouter = Router()
aiRouter.use(authenticate, requireRole('PRACTITIONER'))

// Білий список джерел: міжнародні авторитетні організації + українська КПТ-спільнота.
// Пошук Claude обмежується лише цими доменами.
const TRUSTED_DOMAINS = [
  'who.int', // ВООЗ
  'apa.org', // Американська психологічна асоціація
  'psychiatry.org', // Американська психіатрична асоціація
  'ptsd.va.gov', // National Center for PTSD (DSM-5, PCL-5)
  'nimh.nih.gov', // National Institute of Mental Health
  'nice.org.uk', // NICE (клінічні настанови)
  'nhs.uk', // National Health Service
  'cochrane.org', // Кокранівські огляди (доказова медицина)
  'beckinstitute.org', // Beck Institute (першоджерело КПТ)
  'div12.org', // Society of Clinical Psychology (доказові методи)
  'i-cbt.org.ua', // Український інститут КПТ
  'apta.org.ua', // Українська асоціація психотерапії
]

const SYSTEM_PROMPT = `Ти — асистент-консультант із матеріалів для практикуючих психологів і психотерапевтів, що працюють у підходах КПТ та суміжних доказових напрямах. Твоя аудиторія — фахівці, не клієнти.

Твоє завдання: за запитом психолога знаходити й структуровано подавати доказові матеріали, техніки, протоколи, опитувальники та клінічні настанови, спираючись на авторитетні джерела (ВООЗ, APA, NICE, National Center for PTSD, Кокран, Beck Institute, Український інститут КПТ тощо).

Правила:
- Відповідай українською мовою, професійно й по суті.
- Завжди використовуй веб-пошук для актуальної фактичної інформації (настанови, протоколи, шкали) і спирайся на знайдені джерела.
- Структуруй відповідь: короткий огляд → ключові пункти/кроки → на що звернути увагу.
- Це матеріали для професійного судження фахівця, а НЕ готовий діагноз чи припис для конкретного клієнта. За потреби нагадай про це.
- Якщо питання виходить за межі доказової психології/психотерапії — чемно поверни розмову в межі компетенції.
- Не вигадуй джерел і цифр. Якщо чогось не знайшов — так і скажи.`

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
})
const consultSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
})

/* eslint-disable @typescript-eslint/no-explicit-any */
// Збирає унікальні цитовані джерела з фінального повідомлення Claude.
function collectSources(message: any): { title: string; url: string }[] {
  const seen = new Set<string>()
  const sources: { title: string; url: string }[] = []
  for (const block of message?.content ?? []) {
    if (block?.type !== 'text' || !Array.isArray(block.citations)) continue
    for (const c of block.citations) {
      const url: string | undefined = c?.url
      if (!url || seen.has(url)) continue
      seen.add(url)
      sources.push({ title: c?.title || url, url })
    }
  }
  return sources
}

aiRouter.post(
  '/consult',
  asyncHandler(async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res
        .status(503)
        .json({ error: 'AI-консультант не налаштовано: відсутній ANTHROPIC_API_KEY на сервері.' })
    }

    const { messages } = consultSchema.parse(req.body)
    const anthropic = new Anthropic({ apiKey })

    // Серверні події (SSE): стрімимо текст по мірі генерації, у кінці — джерела.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`)

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        tools: [
          {
            type: 'web_search_20260209',
            name: 'web_search',
            allowed_domains: TRUSTED_DOMAINS,
            max_uses: 6,
          } as any,
        ],
      })

      stream.on('text', (delta: string) => send({ type: 'text', text: delta }))

      // Сигналізуємо клієнту, що триває пошук у джерелах.
      stream.on('streamEvent', (event: any) => {
        if (event?.type === 'content_block_start' && event.content_block?.type === 'server_tool_use') {
          send({ type: 'searching' })
        }
      })

      const final = await stream.finalMessage()
      send({ type: 'sources', sources: collectSources(final) })
      send({ type: 'done' })
    } catch (err: any) {
      console.error('AI consult error:', err?.message || err)
      send({ type: 'error', error: 'Не вдалося отримати відповідь від AI. Спробуйте ще раз.' })
    } finally {
      res.end()
    }
  }),
)
