/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  isFavorite?: boolean
}

export interface Message {
  images: any
  id: string
  content: string
  type: "user" | "system"
  completed?: boolean
  newSection?: boolean
  isLoading?: boolean

}

export interface MessageSection {
  id: string
  messages: Message[]
  isNewSection: boolean
  isActive?: boolean
  sectionIndex: number
}

export interface StreamingWord {
  id: number
  text: string
}

export type ActiveButton = "none" | "add" | "deepSearch" | "think"
