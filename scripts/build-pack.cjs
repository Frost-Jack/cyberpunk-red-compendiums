const { createHash } = require("node:crypto");
const { mkdir } = require("node:fs/promises");
const { resolve } = require("node:path");
const { ClassicLevel } = require("classic-level");
const items = require("../src/everyday-items.json");
const manifest = require("../module.json");
const en = require("../languages/en.json");
const ru = require("../languages/ru.json");

const moduleId = manifest.id;
const systemId = "cyberpunk-red-core";
const pack = manifest.packs[0];
const book = "EI";

function documentId(key) {
  return createHash("sha256").update(`${moduleId}.${pack.name}.${key}`).digest("hex").slice(0, 16);
}

function descriptionToken(slug) {
  const key = `CPRCompendiums.EI.${slug}`;
  if (!en[key] || !ru[key]) throw new Error(`Missing translation for ${key}`);
  return `@EI[${slug}]`;
}

function skillEffect(item, key, name, skill, value, options = {}) {
  const { situational = false, disabled = false, seconds = null } = options;
  return {
    _id: documentId(`${item._id}.${key}`),
    name,
    img: item.img,
    disabled,
    transfer: true,
    duration: { seconds },
    changes: [{ key: `bonuses.${skill}`, mode: 2, value: String(value) }],
    flags: {
      [systemId]: {
        changes: {
          cats: { 0: "skill" },
          situational: { 0: { isSituational: situational, onByDefault: false } },
        },
      },
    },
  };
}

function buildItem(source) {
  const vehicle = source.slug === "dinghy";
  const item = {
    _id: documentId(source.slug),
    name: source.name,
    type: vehicle ? "vehicle" : "gear",
    img: `modules/${moduleId}/assets/${pack.name}/${source.slug}.svg`,
    effects: [],
    flags: {},
    system: {
      description: { value: descriptionToken(source.slug) },
      source: { book, page: source.page },
      price: { market: source.price },
      brand: source.brand ?? "",
      concealable: { concealable: source.concealable ?? false, isConcealed: false },
      installedItems: { allowed: false, slots: 0, list: [] },
    },
  };

  if (vehicle) {
    Object.assign(item.system, {
      sdp: 20, seats: 4, speedCombat: 10, speedNarrative: "15 mph / 24 km/h",
    });
  } else {
    Object.assign(item.system, {
      amount: 1, equipped: "owned", isElectronic: source.electronic ?? false,
    });
  }

  switch (source.slug) {
    case "danshi-badgemaker":
      item.system.usage = "equipped";
      item.effects.push(skillEffect(item, "badge", "Fake ID badges / Поддельные удостоверения", "forgery", 2, {
        situational: true,
      }));
      break;
    case "continental-brands-enduru":
      item.system.usage = "toggled";
      item.effects.push(
        skillEffect(item, "boost", "EndurU +1 (2 h / 2 ч)", "endurance", 1, { disabled: true, seconds: 7200 }),
        skillEffect(item, "crash", "EndurU −1 (1 h / 1 ч)", "endurance", -1, { disabled: true, seconds: 3600 }),
      );
      break;
    case "leads-bodyfree-mask":
      item.system.usage = "equipped";
      item.effects.push({
        _id: documentId(`${item._id}.mask`),
        name: "Bodyfree Mask / Маска Bodyfree",
        img: item.img,
        description: descriptionToken("bodyfree-mask-effect"),
        disabled: false,
        transfer: true,
        changes: [],
      });
      break;
  }
  return item;
}

async function main() {
  const output = resolve(process.argv[2] ?? resolve(__dirname, "..", pack.path));
  await mkdir(resolve(output, ".."), { recursive: true });
  await mkdir(output);
  const db = new ClassicLevel(output, { valueEncoding: "json" });
  await db.open();
  try {
    const batch = db.batch();
    const documents = db.sublevel("items", { valueEncoding: "json" });
    const effects = db.sublevel("items.effects", { valueEncoding: "json" });
    for (const source of items) {
      const item = buildItem(source);
      for (const effect of item.effects) {
        batch.put(`${item._id}.${effect._id}`, effect, { sublevel: effects });
      }
      batch.put(item._id, { ...item, effects: item.effects.map(({ _id }) => _id) }, { sublevel: documents });
    }
    await batch.write();
    await db.compactRange("", "\uffff");
  } finally {
    await db.close();
  }
  console.log(`Packed ${items.length} items into ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
