(() => {
  const endpoint = document
    .querySelector('meta[name="analytics-realtime-endpoint"]')
    ?.content.trim();
  const indicator = document.getElementById("realtime-users");
  const value = document.getElementById("realtime-users-value");

  if (!endpoint || !indicator || !value) {
    return;
  }

  const refreshInterval = 60_000;

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
        data.windowMinutes !== 30
      ) {
        throw new Error("Realtime endpoint returned an invalid response.");
      }

      value.textContent = `${new Intl.NumberFormat("pt-BR").format(data.activeUsers)} usuários ativos nos últimos 30 minutos`;
      indicator.dataset.state = "available";
      indicator.title = `Atualizado em ${new Date(data.updatedAt).toLocaleTimeString("pt-BR")}`;
    } catch (error) {
      console.error("Não foi possível consultar os usuários ativos:", error);
      value.textContent = "Contagem temporariamente indisponível";
      indicator.dataset.state = "unavailable";
      indicator.removeAttribute("title");
    }

    indicator.hidden = false;
    window.setTimeout(refreshCount, refreshInterval);
  }

  refreshCount();
})();
