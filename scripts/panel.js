// Private client-only oracle panel. It creates no chat messages or world settings.
const MASKS_ORACLE_ID = "masks-oracle-panel";
let masksOracleData = null;
let masksOraclePanel = null;

function masksRoll(sides) {
  // Rejection sampling keeps each numbered row equally likely.
  const ceiling = Math.floor(0x100000000 / sides) * sides;
  const random = new Uint32Array(1);
  do { crypto.getRandomValues(random); } while (random[0] >= ceiling);
  return random[0] % sides + 1;
}
function masksLookup(table, roll) {
  return table.entries.find(row => row.min <= roll && roll <= row.max);
}
async function masksLoadData() {
  const response = await fetch(`modules/${MASKS_ORACLE_ID}/data/oracles.json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Oracle data HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.tables)) throw new Error("Oracle data has no tables");
  for (const table of data.tables) {
    if (!Number.isInteger(table.die) || table.die < 1 || !Array.isArray(table.entries)) throw new Error(`Invalid table: ${table.id}`);
    const coverage = Array(table.die).fill(0);
    for (const row of table.entries) {
      if (!Number.isInteger(row.min) || !Number.isInteger(row.max) || row.min < 1 || row.max > table.die || row.max < row.min || typeof row.text !== "string") throw new Error(`Invalid row in ${table.id}`);
      for (let i = row.min; i <= row.max; i++) coverage[i - 1]++;
    }
    if (coverage.some(n => n !== 1)) throw new Error(`Table ${table.id} has a gap or overlapping rows`);
  }
  masksOracleData = data;
  return data;
}
class MasksOraclePanel extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(...args) {
    super(...args);
    this.last = null;
    this.history = [];
    this.odds = 50;
  }
  static DEFAULT_OPTIONS = {
    id: "masks-oracle-control-panel",
    classes: ["masks-oracle-panel"],
    window: { title: "Masks Oracles", resizable: true },
    position: { width: 850, height: 720 },
    actions: {
      rollTable: MasksOraclePanel.onRollTable,
      rollPair: MasksOraclePanel.onRollPair,
      ask: MasksOraclePanel.onAsk,
      reload: MasksOraclePanel.onReload,
      clear: MasksOraclePanel.onClear
    }
  };
  static PARTS = {
    panel: { template: `modules/${MASKS_ORACLE_ID}/templates/panel.html`, scrollable: [".mo-tables", ".mo-history"] }
  };
  async _prepareContext(options) {
    const data = masksOracleData ?? await masksLoadData();
    return {
      groups: data.groups.map(name => ({name, tables: data.tables.filter(t => t.group === name)})),
      last: this.last, history: this.history, odds: this.odds,
      probabilities: [10,25,50,75,90].map(n => ({value:n, label: n === 50 ? "Even (50%)" : `${n}%`, selected: n === this.odds}))
    };
  }
  _onRender(context, options) {
    this.element.querySelector("[data-odds]")?.addEventListener("change", event => { this.odds = Number(event.target.value); });
  }
  showResult(title, parts) {
    const item = { title, parts, time: new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) };
    this.last = item;
    this.history = [item, ...this.history].slice(0, 12);
    this.render();
  }
  rollTable(id) {
    const table = masksOracleData.tables.find(t => t.id === id);
    if (!table) return ui.notifications.error(`Oracle table missing: ${id}`);
    const number = masksRoll(table.die);
    const parts = this.resolveResult(table, number);
    this.showResult(table.title, parts);
  }
  resolveResult(table, number) {
    const result = masksLookup(table, number);
    const parts = [{label: `d${table.die}: ${number}`, text: result.text, questions: result.questions}];
    if (result.effect === "rollTwice") {
      for (let i = 0; i < 2; i++) {
        let next;
        do { next = masksRoll(table.die); } while (masksLookup(table, next).effect === "rollTwice");
        parts.push(...this.resolveResult(table, next));
      }
    } else if (result.effect === "descriptorFocus") {
      for (const id of ["descriptor", "focus"]) {
        const core = masksOracleData.tables.find(t => t.id === id);
        const n = masksRoll(core.die);
        parts.push({label: `${core.title} ${n}`, text: masksLookup(core, n).text});
      }
    }
    return parts;
  }
  static onRollTable(event, target) { this.rollTable(target.dataset.table); }
  static onRollPair() {
    const action = masksOracleData.tables.find(t => t.id === "action");
    const theme = masksOracleData.tables.find(t => t.id === "theme");
    const a = masksRoll(100), b = masksRoll(100);
    this.showResult("Action + Theme", [
      {label:`Action ${a}`, text:masksLookup(action,a).text},
      {label:`Theme ${b}`, text:masksLookup(theme,b).text}
    ]);
  }
  static onAsk() {
    const n = masksRoll(100);
    this.showResult("Ask the Oracle", [{label:`${n} vs ${this.odds}%`,text:n <= this.odds ? "Yes" : "No"}]);
  }
  static async onReload() {
    try { await masksLoadData(); await this.render(); ui.notifications.info("Oracle data reloaded."); }
    catch (error) { console.error(`${MASKS_ORACLE_ID} |`, error); ui.notifications.error(`Oracle data could not be loaded: ${error.message}`); }
  }
  static onClear() { this.last = null; this.history = []; this.render(); }
}
class MasksOracleSidebar extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sidebar.AbstractSidebarTab) {
  static tabName = MASKS_ORACLE_ID;
  static DEFAULT_OPTIONS = {window:{title:"Masks Oracles"},actions:{openPanel:MasksOracleSidebar.onOpen}};
  static PARTS = {[MASKS_ORACLE_ID]:{template:`modules/${MASKS_ORACLE_ID}/templates/sidebar.html`}};
  static onOpen() { masksOpenPanel(); }
}
function masksOpenPanel() {
  if (!masksOraclePanel) masksOraclePanel = new MasksOraclePanel();
  masksOraclePanel.render(true).catch(error => {
    console.error(`${MASKS_ORACLE_ID} |`, error);
    ui.notifications.error(`Masks Oracle Panel: ${error.message}`);
  });
}
Hooks.once("init", () => {
  CONFIG.ui[MASKS_ORACLE_ID] = MasksOracleSidebar;
  foundry.applications.sidebar.Sidebar.TABS[MASKS_ORACLE_ID] = {tooltip:"Masks Oracles",icon:"fas fa-masks-theater"};
});
Hooks.once("ready", () => {
  // A console escape hatch if a system customizes the sidebar.
  globalThis.MasksOraclePanel = {open:masksOpenPanel, reload:masksLoadData};
});
