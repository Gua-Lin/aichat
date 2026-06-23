import { NextRequest } from 'next/server';

/** 标题最大长度 */
const MAX_TITLE_LENGTH = 15;

/** 请求超时时间（毫秒） */
const TIMEOUT_MS = 10_000;

interface GenerateTitleRequest {
  userMessage: string;
  assistantReply: string;
}

interface GenerateTitleResponse {
  title: string;
}

/**
 * POST /api/generate-title
 * 根据第一轮对话内容，调用大模型生成简短的会话标题
 * 失败时静默降级，返回截断的用户消息作为标题
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = (await req.json()) as GenerateTitleRequest;
    const { userMessage, assistantReply } = body;

    if (!userMessage) {
      return Response.json({ title: '新会话' } as GenerateTitleResponse);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    // API Key 缺失时降级为截断标题
    if (!apiKey) {
      return Response.json({
        title: truncateTitle(userMessage),
      } as GenerateTitleResponse);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `你是一个标题生成器。根据用户的提问和AI的回答，生成一个不超过${MAX_TITLE_LENGTH}个字的简短标题。只输出标题文字，不要引号、不要多余解释。`,
            },
            {
              role: 'user',
              content: `用户问：${userMessage}\nAI答：${(assistantReply || '').slice(0, 200)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 30,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn('[generate-title] API 请求失败:', response.status);
        return Response.json({
          title: truncateTitle(userMessage),
        } as GenerateTitleResponse);
      }

      const data = await response.json();
      const generatedTitle = data.choices?.[0]?.message?.content?.trim();

      if (!generatedTitle) {
        return Response.json({
          title: truncateTitle(userMessage),
        } as GenerateTitleResponse);
      }

      // 去除可能的引号
      const cleanTitle = generatedTitle.replace(/^["'"「『【]+|["'"」』】]+$/g, '');

      return Response.json({
        title: cleanTitle.length > MAX_TITLE_LENGTH
          ? cleanTitle.slice(0, MAX_TITLE_LENGTH)
          : cleanTitle,
      } as GenerateTitleResponse);

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.warn('[generate-title] 请求超时');
      } else {
        console.warn('[generate-title] 请求异常:', fetchError);
      }
      return Response.json({
        title: truncateTitle(userMessage),
      } as GenerateTitleResponse);
    }

  } catch {
    return Response.json({
      title: '新会话',
    } as GenerateTitleResponse);
  }
}

/** 截断标题 */
function truncateTitle(text: string): string {
  return text.length > MAX_TITLE_LENGTH
    ? text.slice(0, MAX_TITLE_LENGTH) + '...'
    : text;
}
