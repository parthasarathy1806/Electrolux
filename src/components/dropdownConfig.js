// src/components/dropdownConfig.js
const DROPDOWN_SOURCES = {
  subcommodity: {
    // Fetch commodity names from commodity collection
    commodityName: { collection: "commodity", labelField: "name" },
    // Fetch Ops Group names from opsGroup collection
    opsGroupNameRef: { collection: "opsGroup", labelField: "opsGroupName" },
  },
  opsmode: {
    // Fetch Ops Group for Ops Mode dropdown
    opsGroupNameRef: { collection: "opsGroup", labelField: "opsGroupName" },
  },
  // 🔧 Add more dropdown mappings here as needed
  idco: {
    // Fetch subcommodity names from subcommodity collection
    subcommodity_ref: { collection: "subcommodity", labelField: "subcommodityName" },
  },
  locations: {
    // Fetch functionalGroupName names from functionalGroupName collection
    functionalGroup: { collection: "functionalGroup", labelField: "functionalGroupName" },
    // Fetch OpsGrp names from opsGroup collection
    opsGrp: { collection: "opsGroup", labelField: "opsGroupName" },
  },
  opssubmode: {
    // Fetch functionalGroupName names from functionalGroupName collection
    ops_Mode_Ref: { collection: "opsMode", labelField: "opsModeName" },
    // Fetch OpsGrp names from opsGroup collection
    opsGroupNameRef: { collection: "opsGroup", labelField: "opsGroupName" },
  },
};

export default DROPDOWN_SOURCES;
