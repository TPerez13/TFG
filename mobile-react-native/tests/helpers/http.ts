export const jsonResponse = (
  payload: unknown,
  init: ResponseInit = {}
): Response =>
  new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });
