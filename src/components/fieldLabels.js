/* -------------------------------------------------------------------------- */
/* 🧩 Centralized Field Label Map (UI only — no backend impact)               */
/* -------------------------------------------------------------------------- */
const FIELD_LABELS = {
  brand: {
    brandName: "Brand Name",
    brandStatus: "Status",
    brandCreatedBy: "Created By",
    createdOn: "Created On",
  },
  commodity: {
    name: "Commodity Name",
    status: "Status",
  },
  subcommodity: {
    subcommodityName: "Sub Commodity Name",
    opsGroupNameRef: "Ops Group",
    subcommodityStatus: "Status",
    commodityName: "Commodity Name",
    commodityManager: "Commodity Manager",
  },
  idco: {
    idcoTableName: "IDCO Name",
    idcoTableDescName: "IDCO Description",
    idcoTableStatus: "Status",
    commodityName: "Commodity Name",
    subcommodity_ref: "Subcommodities",
  },
  locations: {
    locationName: "Location Name",
    functionalGroup: "Functional Group",
    opsGrp: "Ops Group",
    status: "Status",
    country: "Country",
    code: "Code",
  },
  opsmode: {
    opsModeName: "Ops Mode",
    opsGroupNameRef: "Ops Group",
    status: "Status",
  },
  opssubmode: {
    opsSubModeName: "Ops Sub Mode",
    opsGroupNameRef: "Ops Group",
    status: "Status",
    ops_Mode_Ref: "Ops Mode",
  },
  productline: {
    name: "Product Line Name",
    status: "Status",
  },
  projectstatus: {
    projectStatusName: "Project Risk",
    projectStatusStatus: "Status",
  },
  bigrocks: {
    bhagTableName: "Big Rock Name",
    bhagTableStatus: "Status",
  },
};
export default FIELD_LABELS;