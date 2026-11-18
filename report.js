"use strict";

const candidates = ["洪進來", "陳宗壁", "許清安", "洪江懷", "陳國基", "黃雪梨"];
const villages = [
  ["芳苑", 613, 282, 20, 50, 159, 59, 43],
  ["芳中", 238, 117, 19, 15, 58, 11, 18],
  ["仁愛", 512, 188, 21, 48, 184, 36, 35],
  ["信義", 317, 186, 7, 26, 67, 21, 10],
  ["三合", 1350, 170, 576, 144, 129, 107, 224],
  ["新街", 409, 61, 62, 142, 84, 17, 43],
  ["永興", 785, 197, 115, 226, 103, 95, 49],
  ["後寮", 565, 72, 82, 65, 37, 268, 41]
];
// Village, October 2026 population, October 2026 households, 2022 electors.
const electorStatistics = [
  ["芳苑村", 953, 387, 898],
  ["芳中村", 396, 171, 385],
  ["仁愛村", 746, 307, 703],
  ["信義村", 496, 193, 498],
  ["三合村", 2321, 898, 1995],
  ["新街村", 729, 327, 738],
  ["永興村", 1345, 443, 1275],
  ["後寮村", 1030, 380, 926]
];

const groups = [
  ["芳苑四村", villages.slice(0, 4)],
  ["三合", [villages[4]]],
  ["新街、永興", villages.slice(5, 7)],
  ["後寮", [villages[7]]]
];
const sumColumn = (rows, column) => rows.reduce((sum, row) => sum + row[column], 0);
const totalVotes = sumColumn(villages, 1);
const defaultTotal = 4500;
const numbers = new Intl.NumberFormat("zh-TW");
const percent = new Intl.NumberFormat("zh-TW", {style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1});
const candidateSelect = document.querySelector("#candidate");
const metricSelect = document.querySelector("#metric");
const modelInput = document.querySelector("#total");

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function barRow(label, value, fraction) {
  const row = element("li");
  const track = element("span", undefined, "track");
  const fill = element("span", undefined, "fill");
  fill.style.setProperty("--width", (fraction * 100) + "%");
  track.setAttribute("aria-hidden", "true");
  track.append(fill);
  row.append(element("span", label), track, element("strong", value));
  return row;
}

function drawVotes() {
  const column = candidateSelect.selectedIndex + 2;
  const candidateVotes = sumColumn(villages, column);
  const metric = metricSelect.value;
  const highest = Math.max(...villages.map(row => row[column]));
  const bars = villages.map(row => {
    const [village, validVotes] = row;
    const votes = row[column];
    if (metric === "votes") return barRow(village, numbers.format(votes), votes / highest);
    const share = votes / (metric === "village" ? validVotes : candidateVotes);
    return barRow(village, percent.format(share), share);
  });
  document.querySelector("#vote-bars").replaceChildren(...bars);
  const scale = metric === "votes" ? "橫條以此人最高村別票數為滿格" : "橫條以 100% 為滿格";
  document.querySelector("#chart-summary").textContent =
    candidateSelect.value + "全區共 " + numbers.format(candidateVotes) + " 票 ／ " + scale;
}

function appendTableRow(section, values, header = false) {
  const row = element("tr");
  values.forEach((value, index) => {
    const cell = element(header || index === 0 ? "th" : "td", typeof value === "number" ? numbers.format(value) : value);
    if (header) cell.scope = "col";
    else if (index === 0) cell.scope = "row";
    row.append(cell);
  });
  section.append(row);
}

function allocateVotes(total) {
  const allocations = groups.map(([label, rows], index) => {
    const scaled = sumColumn(rows, 1) * total;
    return {label, index, votes: Math.floor(scaled / totalVotes), remainder: scaled % totalVotes};
  });
  const left = total - allocations.reduce((sum, group) => sum + group.votes, 0);
  const ranked = [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  ranked.slice(0, left).forEach(group => { group.votes += 1; });
  return allocations;
}

function drawAllocation(total) {
  const rows = allocateVotes(total).map(group =>
    barRow(group.label, numbers.format(group.votes) + " 票", group.votes / total)
  );
  document.querySelector("#model-results").replaceChildren(...rows);
  document.querySelector("#model-summary").textContent = "四區合計 " + numbers.format(total) + " 票";
}

const electorTable = document.querySelector("#elector-table");
const electorRows = electorTable.tBodies[0];
electorStatistics.forEach(([village, population, households, previousElectors]) =>
  appendTableRow(electorRows, [village, "待公告", population, households, previousElectors])
);
appendTableRow(electorTable.tFoot, ["全區合計", "待公告",
  ...[1, 2, 3].map(column => sumColumn(electorStatistics, column))
]);

appendTableRow(document.querySelector("#vote-table thead"), ["村別", "有效票", ...candidates], true);
villages.forEach(row => appendTableRow(document.querySelector("#vote-table tbody"), row));
appendTableRow(document.querySelector("#vote-table tfoot"),
  ["全區合計", ...villages[0].slice(1).map((_, index) => sumColumn(villages, index + 1))]
);
candidateSelect.addEventListener("change", drawVotes);
metricSelect.addEventListener("change", drawVotes);
document.querySelector("#model-form").addEventListener("submit", event => {
  event.preventDefault();
  drawAllocation(modelInput.valueAsNumber);
});
document.querySelector("#reset").addEventListener("click", () => {
  modelInput.value = defaultTotal;
  drawAllocation(defaultTotal);
});
drawVotes();
drawAllocation(defaultTotal);
