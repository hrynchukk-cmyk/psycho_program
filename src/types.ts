export type ClientStatus = 'invited' | 'active' | 'archived'

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  status: ClientStatus
  createdAt: string
}

export interface Group {
  id: string
  name: string
  description: string
  memberIds: string[]
  autoSendEnabled: boolean
  autoSendActivityIds: string[]
  autoSendProgramIds: string[]
  createdAt: string
}

export type ElementType =
  | 'section'
  | 'text'
  | 'shortAnswer'
  | 'longAnswer'
  | 'multipleChoice'
  | 'scale'
  | 'video'
  | 'image'
  | 'pageBreak'

export interface ActivityElement {
  id: string
  type: ElementType
  title: string
  options?: string[]
}

export interface Activity {
  id: string
  title: string
  description: string
  elements: ActivityElement[]
  pageBreaksEnabled: boolean
  isPremade: boolean
  category?: string
  updatedAt: string
}

export type DeliveryMode = 'immediately' | 'afterPrevious' | 'afterStart'

export interface ProgramStep {
  id: string
  activityId: string
  mode: DeliveryMode
  days: number
}

export interface Program {
  id: string
  title: string
  description: string
  steps: ProgramStep[]
  isPremade: boolean
  updatedAt: string
}

export interface ResourceItem {
  id: string
  kind: 'file' | 'link'
  name: string
  url?: string
  fileType?: string
  size?: string
  sharedWithClientIds: string[]
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  clientId: string | null
  dueDate?: string
  done: boolean
  createdAt: string
}

export interface Note {
  id: string
  title: string
  body: string
  clientId: string | null
  createdAt: string
}

export type DeliveryStatus = 'sent' | 'inProgress' | 'completed'

export interface Delivery {
  id: string
  kind: 'activity' | 'program'
  refId: string
  clientId: string
  sentAt: string
  status: DeliveryStatus
  completedAt?: string
  responses?: { elementId: string; answer: string }[]
}

export interface ThreadComment {
  id: string
  deliveryId: string
  elementId: string | null
  author: 'practitioner' | 'client'
  text: string
  createdAt: string
}
