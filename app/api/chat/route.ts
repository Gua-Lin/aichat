import { NextRequest } from 'next/server';
import { ALL_MODES } from '@/app/types/chatTypes';
import type { ChatMode } from '@/app/types/chatTypes';

/** 大模型请求超时时间（毫秒） */
const REQUEST_TIMEOUT_MS = 30_000;

/** 上下文消息最大数量（不含 system prompt），超出则截取最近的 */
const MAX_CONTEXT_MESSAGES = 20;

/** 错误类型枚举，前端可据此展示不同提示 */
export type ChatErrorType =
  | 'API_KEY_MISSING'   // API Key 未配置
  | 'INVALID_REQUEST'   // 请求体格式错误
  | 'API_RATE_LIMIT'    // API 限流
  | 'API_AUTH_FAILED'   // API 鉴权失败
  | 'API_TIMEOUT'       // 请求超时
  | 'API_ERROR'         // API 其他错误
  | 'NETWORK_ERROR'     // 网络异常
  | 'UNKNOWN';          // 未知错误

interface ChatErrorResponse {
  error: string;
  errorType: ChatErrorType;
}

/** 截断上下文消息，保留最近的 N 条，避免超出 token 限制 */
function truncateMessages(
  messages: { role: string; content: string }[],
  maxCount: number,
): { role: string; content: string }[] {
  if (messages.length <= maxCount) return messages;
  // 优先保留最近的消息（对话越新越重要）
  return messages.slice(messages.length - maxCount);
}

/** 根据 HTTP 状态码映射错误类型 */
function mapStatusToErrorType(status: number): ChatErrorType {
  if (status === 401 || status === 403) return 'API_AUTH_FAILED';
  if (status === 429) return 'API_RATE_LIMIT';
  if (status === 408 || status === 504) return 'API_TIMEOUT';
  return 'API_ERROR';
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const body: ChatErrorResponse = {
      error: 'API Key 未配置，请在 .env.local 中设置 OPENAI_API_KEY',
      errorType: 'API_KEY_MISSING',
    };
    return Response.json(body, { status: 503 });
  }

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  let body: { messages: { role: string; content: string }[]; mode: ChatMode | null };
  try {
    body = await req.json();
  } catch {
    const errBody: ChatErrorResponse = {
      error: '请求体格式错误，需要有效的 JSON',
      errorType: 'INVALID_REQUEST',
    };
    return Response.json(errBody, { status: 400 });
  }

  const { messages, mode } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    const errBody: ChatErrorResponse = {
      error: 'messages 字段不能为空',
      errorType: 'INVALID_REQUEST',
    };
    return Response.json(errBody, { status: 400 });
  }

  // 根据模式构建 system prompt
  let systemPrompt = '你是一个有帮助的AI助手，请用中文回答。';
  if (mode) {
    const modeConfig = ALL_MODES.find(m => m.key === mode);
    if (modeConfig) {
      systemPrompt = modeConfig.systemPrompt;
    }
  }

  // 截断上下文消息，避免超出 token 限制
  const truncatedMessages = truncateMessages(messages, MAX_CONTEXT_MESSAGES);

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...truncatedMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    })),
  ];

  // 创建超时 AbortController
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  // 将客户端断开信号与超时信号合并：任一触发都取消请求
  const combinedSignal = AbortSignal.any
    ? AbortSignal.any([req.signal, timeoutController.signal])
    : timeoutController.signal; // 旧版 Node 降级处理

  try {
    const apiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      const errorType = mapStatusToErrorType(apiResponse.status);
      console.error(`OpenAI API error: ${apiResponse.status} - ${errorText}`);

      let friendlyMessage = `大模型 API 返回错误（${apiResponse.status}）`;
      if (errorType === 'API_RATE_LIMIT') {
        friendlyMessage = 'API 调用频率过高，请稍后再试';
      } else if (errorType === 'API_AUTH_FAILED') {
        friendlyMessage = 'API Key 无效或已过期，请检查 OPENAI_API_KEY 配置';
      }

      const errBody: ChatErrorResponse = { error: friendlyMessage, errorType };
      return Response.json(errBody, { status: apiResponse.status });
    }

    // 直接将 OpenAI SSE 流返回给前端
    return new Response(apiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // 超时
    if (err instanceof DOMException && err.name === 'AbortError' && !req.signal.aborted) {
      const errBody: ChatErrorResponse = {
        error: `请求超时（${REQUEST_TIMEOUT_MS / 1000}s 无响应），请重试`,
        errorType: 'API_TIMEOUT',
      };
      return Response.json(errBody, { status: 504 });
    }

    // 客户端主动断开，不返回错误
    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    // 网络异常
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('fetch') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      const errBody: ChatErrorResponse = {
        error: '无法连接到大模型服务，请检查网络或 OPENAI_BASE_URL 配置',
        errorType: 'NETWORK_ERROR',
      };
      return Response.json(errBody, { status: 502 });
    }

    console.error('Chat API error:', message);
    const errBody: ChatErrorResponse = {
      error: '服务器内部错误，请稍后重试',
      errorType: 'UNKNOWN',
    };
    return Response.json(errBody, { status: 500 });
  }
}
