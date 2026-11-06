export interface AiRequest {
  prompt: string;
  locale: string;
  signal?: AbortSignal;
}

export interface AiResponse {
  text: string;
  provider: string;
}

/**
 * Optional boundary: there is no default implementation and no network call
 * unless the operator configures a provider and explicitly sends a request.
 */
export interface AiProvider {
  readonly id: string;
  isConfigured(): boolean;
  complete(request: AiRequest): Promise<AiResponse>;
}
