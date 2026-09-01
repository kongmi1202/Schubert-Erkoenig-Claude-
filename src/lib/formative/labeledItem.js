/**
 * 다중 항목 2단계 피드백 — 항목 구분용 라벨 래퍼
 */
export function labeledStage2Item(label, payload) {
  if (!label) return payload;
  if (typeof payload === 'string') {
    return { kind: 'labeled', label, body: payload };
  }
  if (payload && typeof payload === 'object') {
    return { ...payload, itemLabel: label };
  }
  return payload;
}

export function unwrapStage2ItemPayload(payload) {
  if (payload?.kind === 'labeled') return payload.body;
  if (payload?.kind === 'plain') return payload.text;
  return payload;
}
