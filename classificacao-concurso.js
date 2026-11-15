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
  return { calculate };
})();

if (typeof module !== 'undefined') module.exports = ContestRanking;