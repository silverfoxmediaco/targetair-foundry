// Runtime placeholder for CI only.
//
// The build needs these names to resolve to real ESM exports; nothing ever
// calls them. The test suite covers derive.ts, which does not touch the SDK,
// and anything that does touch it is integration surface that a mock could
// only assert against itself. Never ships — see ../README.md.
const inert = {};
export const Aircraft = inert;
export const BomLine = inert;
export const InventoryLot = inert;
export const NonConformance = inert;
export const Part = inert;
export const Shortage = inert;
export const Station = inert;
export const Supplier = inert;
export const WorkOrder = inert;
export const acknowledgeShortage = inert;
export const dispositionNonConformance = inert;
export const updateForecastDelivery = inert;
export const $ontologyRid = "ri.ontology.main.ontology.ci-stub";
