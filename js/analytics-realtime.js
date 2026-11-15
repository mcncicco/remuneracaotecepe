(() => {
  const endpoint = document
    .querySelector('meta[name="analytics-realtime-endpoint"]')
    ?.content.trim();
  const indicator = document.getElementById("realtime-metrics");
  const value = document.getElementById("realtime-metrics-value");

  if (!endpoint || !indicator || !value) {
    return;
  }

  const refreshInterval = 30_000;

  async function refreshCount() {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Realtime endpoint returned ${response.status}.`);
      }

      const data = await response.json();
      if (
        !Number.isSafeInteger(data.activeUsers) ||
        data.activeUsers < 0 ||
        !Number.isSafeInteger(data.screenPageViews) ||
        data.screenPageViews < 0 ||
        data.windowMinutes !== 30
      ) {
        throw new Error("Realtime endpoint returned an invalid response.");
      }

      const formatter = new Intl.NumberFormat("pt-BR");
      value.textContent = `${formatter.format(data.activeUsers)} usuários ativos · ${formatter.format(data.screenPageViews)} visualizações nos últimos 30 minutos`;
      indicator.dataset.state = "available";
      indicator.title = `Atualizado em ${new Date(data.updatedAt).toLocaleTimeString("pt-BR")}`;
    } catch (error) {
      console.error("Não foi possível consultar as métricas em tempo real:", error);
      value.textContent = "Contagem temporariamente indisponível";
      indicator.dataset.state = "unavailable";
      indicator.removeAttribute("title");
    }

    indicator.hidden = false;
    window.setTimeout(refreshCount, refreshInterval);
  }

  refreshCount();
})();
