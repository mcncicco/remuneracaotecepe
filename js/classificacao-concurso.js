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
  function findOtherPlacements(careers, selectedCareer, candidate) {
    const candidateName = candidate.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR').replace(/\s+/g, ' ').trim();
    return careers.flatMap(career => {
      if (career.cargo === selectedCareer.cargo) return [];
      const placement = career.resultados.find(result =>
        result.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR').replace(/\s+/g, ' ').trim() === candidateName &&
        Number.isFinite(result.classificacao) &&
        result.situacao.startsWith('Aprovado')
      );
      return placement ? [{ cargo: career.cargo, classificacao: placement.classificacao }] : [];
    }).sort((first, second) => first.classificacao - second.classificacao);
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
  function assignVacancyTypes(results, quotaGroups, vacancy, isAppointed) {
    const vacancyTypes = new Map();
    quotaGroups.forEach(group => {
      const count = vacancy[group.field];
      const editalCount = vacancy[group.editalField];
      if (!Number.isInteger(count) || count < 0) throw new Error(`Quantidade invalida de vagas: ${group.field}.`);
      if (!Number.isInteger(editalCount) || editalCount < 0) throw new Error(`Quantidade invalida de vagas: ${group.editalField}.`);
      if (!count) return;
      const eligible = results
        .filter(result => Number.isFinite(result.classificacao) && group.statuses.has(result.situacao) && !isAppointed(result))
        .sort((first, second) => first.classificacao - second.classificacao);
      const currentBoundary = eligible[Math.min(count, eligible.length) - 1];
      const editalBoundary = eligible[Math.min(count, editalCount, eligible.length) - 1];
      if (!currentBoundary) return;
      eligible.filter(result => result.classificacao <= currentBoundary.classificacao).forEach(result => {
        if (!vacancyTypes.has(result)) vacancyTypes.set(result, { types: [], editalTypes: [], additionalTypes: [] });
        const candidateVacancies = vacancyTypes.get(result);
        if (!candidateVacancies.types.includes(group.label)) candidateVacancies.types.push(group.label);
        const typeGroup = editalBoundary && result.classificacao <= editalBoundary.classificacao
          ? candidateVacancies.editalTypes
          : candidateVacancies.additionalTypes;
        if (!typeGroup.includes(group.label)) typeGroup.push(group.label);
      });
    });
    return vacancyTypes;
  }
  return { calculate, findOtherPlacements, findWithdrawals, assignVacancyTypes };
})();

if (typeof module !== 'undefined') module.exports = ContestRanking;