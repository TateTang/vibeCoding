const API_BASE_URL = 'https://anytokens.cc';
const API_KEY = 'sk-9dd7bd63f4596b2a940bd751044a5c02f2a0f83be29eaa5df475dbaae88120da';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

function parseJsonSafely(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

export async function onRequestPost(context) {
  let payload;

  try {
    payload = await context.request.json();
  } catch {
    return jsonResponse({ error: '请求体不是有效的 JSON' }, 400);
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return jsonResponse({ error: 'messages 不能为空' }, 400);
  }

  try {
    const upstreamResponse = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: payload.model || 'gpt-5.4',
        messages: payload.messages,
        temperature: payload.temperature ?? 0.8,
        max_tokens: payload.max_tokens ?? 800
      })
    });

    const rawResponse = await upstreamResponse.text();
    const parsedResponse = parseJsonSafely(rawResponse);

    if (!upstreamResponse.ok) {
      return jsonResponse(
        {
          error: '上游接口返回错误',
          details: parsedResponse
        },
        upstreamResponse.status
      );
    }

    return jsonResponse(parsedResponse, 200);
  } catch (error) {
    return jsonResponse(
      {
        error: '代理请求失败',
        details: error.message
      },
      502
    );
  }
}