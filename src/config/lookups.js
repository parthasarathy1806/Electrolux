// src/config/lookups.js

export const LOOKUPS = {
  brand: {
    displayName: "Brand",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/brand`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/brand`,
    graphqlCollection: "brand",
    fieldLabels: {
      brandName: { label: "Brand" },
      brandCreatedBy: { label: "Created By" },
      createdOn: { label: "Created On"},
      brandStatus: { label: "Status" }
    },
    includeFields: ["brandName", "brandCreatedBy", "createdOn" , "brandStatus" ],

  },
  commodity: {
    displayName: "Commodity",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/commodity`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/commodity`,
    graphqlCollection: "commodity",
    fieldLabels: {
      name: { label: "Commodity Name" },
      commodityCreatedBy: { label: "Created By"},
      createdOn: { label: "Created On" },
      status: { label: "Status" }
    },
    includeFields: ["name", "commodityCreatedBy", "createdOn", "status"],
  },
  subcommodity: {
    displayName: "Subcommodities",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/subcommodity`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/subcommodity`,
    graphqlCollection: "subcommodity",
    fieldLabels: {
      subcommodityName: { label: "Subcommodities" },
      opsGroupNameRef: { label: "Ops Group" },
      commodityName: { label: "Commodity Name" },
      commodityManager: { label: "Commodity Manager" },
      subcommodityStatus: { label: "Status" }
    },
    includeFields: ["subcommodityName", "opsGroupNameRef", "commodityName", "commodityManager", "subcommodityStatus"],
  },
  idco: {
    displayName: "IDCO",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/idco`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/idco`,
    includeFields: ["idcoTableName", "idcoTableDescName", "subcommodity_ref", "idcoTableStatus"],
    graphqlCollection: "idco",
    fieldLabels: {
      idcoTableName: { label: "IDCO Name" },
      idcoTableDescName: { label: "IDCO Description" },
      subcommodity_ref: { label: "Subcommodity" },
      idcoTableStatus: { label: "Status" }
    },
  },
  locations: {
    displayName: "Locations",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/locations`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/locations`,
    includeFields: ["locationName", "functionalGroup", "opsGrp", "status", "country", "code"],
    graphqlCollection: "locations",
    fieldLabels: {
      locationName: { label: "Location Name" },
      functionalGroup: { label: "Functional Group" },
      opsGrp: { label: "Ops Group" },
      status: { label: "Status" },
      country: { label: "Country" },
      code: { label: "Code" }
    },
  },
  opsmode: {
    displayName: "Ops Mode",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/opsmode`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/opsmode`,
    includeFields: ["opsModeName", "opsGroupNameRef","createdOn", "status"],
    graphqlCollection: "opsMode",
    fieldLabels: {
      opsModeName: { label: "Ops Mode Name" },
      opsGroupNameRef: { label: "Ops Group" },
      createdOn: { label: "Created On"},
      status: { label: "Status" }
    },
  },
  opssubmode: {
    displayName: "Ops Sub Mode",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/opssubmode`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/opssubmode`,
    includeFields: ["opsSubModeName", "ops_Mode_Ref", "opsGroupNameRef","createdOn", "status"],
    graphqlCollection: "opsSubMode",
    fieldLabels: {
      opsSubModeName: { label: "Ops Sub Mode Name" },
      ops_Mode_Ref: { label: "Ops Mode Name" }, 
      opsGroupNameRef: { label: "Ops Group" },
      createdOn: { label: "Created On"},
      status: { label: "Status" }
    },
  },
  productline: {
    displayName: "Product Line",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/productline`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/productline`,
    graphqlCollection: "productline",
    includeFields: ["name", "createdOn", "status"],
    fieldLabels: {
      name: { label: "Name" },
      createdOn: { label: "Created On"},
      status: { label: "Status" }
    },
  },
  supplier: {
    displayName: "Supplier",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/supplier`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/supplier`,
    includeFields: ["supplierName", "supplierFactory", "supplierCode", "supplierStatus"],
    graphqlCollection: "supplier",
    fieldLabels: {
      supplierFactory: { label: "Supplier Factory" },
      supplierCode: { label: "Supplier Code" },
      supplierName: { label: "Supplier Name" },
      supplierStatus: { label: "Status" }
    },
    filterOptions: [
    { label: "PMS Supplier", value: "supplier" },
    { label: "NonPMS Supplier", value: "supplier_PUR" },
  ],
  enableUpload: true, // 👈 New flag
  },

  projectstatus: {
    displayName: "Project Risk",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/projectstatus`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/projectstatus`,
    includeFields: ["projectStatusName", "projectStatusCreatedBy", "createdOn", "projectStatusStatus"],
    graphqlCollection: "projectstatus",
    fieldLabels: {
      projectStatusName: { label: "Project Risk" },
      projectStatusCreatedBy: { label: "Created By" },
      createdOn: { label: "Created On"},
      projectStatusStatus: { label: "Status" }
    },
  },
  bigrocks: {
    displayName: "Big Rocks",
    mongoApi: `${process.env.REACT_APP_API_BASE}/api/mongo/data/bhag`,
    schemaApi: `${process.env.REACT_APP_API_BASE}/api/omd/schema/bhag`,
    graphqlCollection: "bhag",
    includeFields: ["bhagTableName", "bhagTableCreatedBy", "createdOn", "bhagTableStatus"],
    fieldLabels: {
    bhagTableName: { label: "Big Rocks Name" },
    bhagTableCreatedBy: { label: "Created By" },
    createdOn: { label: "Created On"},
    bhagTableStatus: { label: "Status" }
  }, // 👈 update field names based on schema
  },
};
