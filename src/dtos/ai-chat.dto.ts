export interface ChatMessageDTO {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestDTO {
  message: string;
  history: ChatMessageDTO[];
}

export interface ChatResponseDTO {
  reply: string;
}
