export const hasRelevantChanges = (baseline, current) => {
  if (!baseline) return false;

  const metaChanged =
    JSON.stringify(baseline.metadata) !==
    JSON.stringify(current.metadata);

  const financialChanged =
    JSON.stringify(baseline.financial) !==
    JSON.stringify(current.financial);

  return metaChanged || financialChanged;
};
