const ContestRanking = (() => {
  function calculate(results) {
    const updated = results.map(result => ({
      ...result,
      classificacao: null,
      final: result.discursiva === null ? null : (Math.round(result.objetiva * 100) + Math.round(result.discursiva * 100)) / 100
    }));
    const ranked = updated.filter(result => result.final !== null).sort((first, second) => {
      const byScore = second.final - first.final;
      const firstBirth = first.nascimento.split('/').reverse().join('-');
      const secondBirth = second.nascimento.split('/').reverse().join('-');
      return byScore || firstBirth.localeCompare(secondBirth);
    });
    ranked.forEach((result, index) => {
      const previous = ranked[index - 1];
      result.classificacao = previous && result.final === previous.final && result.nascimento === previous.nascimento ? previous.classificacao : index + 1;
    });
    return updated;
  }
  function findWithdrawals(results, quotaGroups, isAppointed) {
    const latestAppointedRanks = quotaGroups.map(group => results.reduce((latest, candidate) => {
      if (!Number.isFinite(candidate.classificacao) || !group.statuses.has(candidate.situacao) || !isAppointed(candidate)) return latest;
      return Math.max(latest, candidate.classificacao);
    }, -Infinity));
    return new Set(results.filter(candidate => Number.isFinite(candidate.classificacao) &&
      !isAppointed(candidate) &&
      quotaGroups.some((group, index) => group.statuses.has(candidate.situacao) && latestAppointedRanks[index] > candidate.classificacao)
    ));
  }
  return { calculate, findWithdrawals };
})();

if (typeof module !== 'undefined') module.exports = ContestRanking;