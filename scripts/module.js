function localizeDescription(slug) {
  const key = `CPRCompendiums.EI.${slug}`;
  return game.i18n.has(key) ? game.i18n.localize(key) : null;
}

Hooks.once("i18nInit", () => {
  // CPR inventory lists read the prepared description without HTML enrichment.
  for (const type of ["gear", "vehicle"]) {
    const Model = CONFIG.Item.dataModels[type];
    CONFIG.Item.dataModels[type] = class extends Model {
      _initialize(options) {
        super._initialize(options);
        const reference = /^@EI\[([a-z0-9-]+)\]$/.exec(this.description?.value);
        if (reference) this.description.value = localizeDescription(reference[1]) ?? reference[0];
      }
    };
  }

  CONFIG.TextEditor.enrichers.push({
    pattern: /@EI\[([a-z0-9-]+)\]/g,
    replaceParent: true,
    enricher: ([, slug]) => {
      const translation = localizeDescription(slug);
      if (translation === null) return null;
      const description = document.createElement("div");
      description.innerHTML = translation;
      return description;
    },
  });
});
