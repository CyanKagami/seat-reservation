export function normalizeJsonApiResponse(req, res, next) {
  const sendJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 400) {
      const error =
        typeof payload?.error === 'string'
          ? payload.error
          : typeof payload?.body?.error === 'string'
            ? payload.body.error
            : typeof payload?.body?.message === 'string'
              ? payload.body.message
              : typeof payload?.message === 'string'
                ? payload.message
                : 'เกิดข้อผิดพลาดในการประมวลผลคำขอ';
      const code =
        typeof payload?.code === 'string'
          ? payload.code
          : typeof payload?.body?.code === 'string'
            ? payload.body.code
            : undefined;
      return sendJson(code ? { error, code } : { error });
    }

    if (payload && typeof payload === 'object' && Object.hasOwn(payload, 'body')) {
      return sendJson(payload);
    }
    return sendJson({ body: payload });
  };
  next();
}
