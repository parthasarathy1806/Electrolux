// src/components/projectDetails/ProjectDetailsPage.js
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Paper, Typography, Button } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";

import projectForm from "../../forms/project_form.json";
import ProjectMetadataView from "./ProjectMetadataView";
import ProjectFinancialView from "./ProjectFinancialView";
import ReviewChangesTab from "../reviewchanges/ReviewChangesTab";
import { computeChanges } from "../../utils/changeDiff";

import ChangeRequestsTab from "./ChangeRequestsTab";


// 🔑 REUSE CREATE PAGE DOCUMENTS UI
import ProjectDocumentsTab from "../documents/ProjectDocumentsTab";

const API = process.env.REACT_APP_API_BASE;


/* ------------------------------------------------------------
   🔑 SAME DROPDOWN MAPPING AS JsonFormWizard
------------------------------------------------------------ */
const buildDropdownData = (sections, payload) => {
  const fieldToCollection = {};
  const dropdowns = {};

  sections.forEach((sec) => {
    sec.groups?.forEach((grp) => {
      grp.fields?.forEach((field) => {
        if (field.type === "dropdown" && typeof field.options === "string") {
          fieldToCollection[field.name] = field.options;
        }
      });
    });
  });

  Object.entries(fieldToCollection).forEach(([fieldName, collection]) => {
    dropdowns[fieldName] = payload[collection] || [];
  });

  return dropdowns;
};

/* ------------------------------------------------------------
   🔑 MAP DB DOCUMENTS → CREATE-PAGE SHAPE
------------------------------------------------------------ */
const mapDbDocumentsToUi = (docs = []) =>
  docs.map(d => ({
    id: String(d._id),
    fileName: d.file_name || d.fileName || "",
    documentType: d.doc_type || d.documentType || "",
    uploadedBy: d.createdBy || d.uploaded_by || "",
    file: null,
    fileRef: d.fileRef,
  }));


const ProjectDetailsPage = () => {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState(0);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 🔑 SAME STATE SHAPE AS CREATE PAGE */
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [labelMap, setLabelMap] = useState({});

  // ✅ ADD THESE HERE
  const [baselineData, setBaselineData] = useState(null);
  const [showReviewChanges, setShowReviewChanges] = useState(false);
  // ADD THIS (one line)

  const [reviewTotals, setReviewTotals] = useState({});
  const [financialDraft, setFinancialDraft] = useState(null);
  const [platformLookups, setPlatformLookups] = useState([]);


  /* ------------------------------------------------------------
     LOAD PROJECT DETAILS
  ------------------------------------------------------------ */
  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await axios.get(
          `${API}/api/mongo/projects/details`,
          { params: { id } }
        );

        const data = res.data;

        const FIELD_ALIAS_MAP = {
          subCommodity: "subcommodity",
          costType: "plCostType",
          supplier: "supplierName",
        };
        /* normalize metadata ObjectId → string */
        const normalizedMetadata = {};
        Object.entries(data.metadata || {}).forEach(([k, v]) => {
          const uiKey = FIELD_ALIAS_MAP[k] || k;
          normalizedMetadata[k] = v != null ? String(v) : v;
          normalizedMetadata[uiKey] = v != null ? String(v) : v;
        });

        const inferSupplierType = (meta) => {
          if (meta.supplierName) return "PMS";
          if (meta.supplierNonPms) return "Non PMS";
          return "";
        };

        normalizedMetadata.supplierType =
          normalizedMetadata.supplierType ||
          inferSupplierType(normalizedMetadata);

        const normalizeLegacyFinancialForUI = (financial) => {
          if (!financial) return financial;
          const legacyPlatforms =
            financial.platforms?.length
              ? financial.platforms
              : [{
                _id: "legacy-0",
                platform_ref_id: "",
                platformName: "Legacy Platform",
                unit_cost: financial?.platforms?.[0]?.unit_cost || 1,
                total_volume: financial?.platforms?.[0]?.total_volume || 0,
                annualized_savings: financial?.platforms?.[0]?.annualized_savings || 0,
              }];
          return {
            ...financial,
            platforms: legacyPlatforms.map(p => ({
              _id: p._id,
              platform_ref_id: p.platform_ref_id || "",
              platformName: p.platformName, // 👈 allow selection
              unit_cost: p.unit_cost || 0,
              total_volume: p.total_volume || 0,
              annualized_savings: p.annualized_savings || 0,
            })),
          };
        };

        setProject({
          ...data,
          financial: normalizeLegacyFinancialForUI(data.financial),
        });

        const metadataWithLabels = { ...normalizedMetadata };

        // 🔑 ADD DISPLAY LABEL FIELDS FOR SCHEMA CONDITIONS
        Object.entries(normalizedMetadata).forEach(([k, v]) => {
          if (labelMap[v]) {
            metadataWithLabels[`${k}__label`] = labelMap[v];
          }
        });

        setFormData(prev => ({
          ...prev,
          ...metadataWithLabels,

          documents: prev.documents?.length
            ? prev.documents
            : mapDbDocumentsToUi(data.documents || []),

          documentsDraft: prev.documentsDraft || {},
        }));

      } catch (e) {
        console.error("Failed to load project", e);
      }
    };

    loadProject();
  }, [id, labelMap]);

  useEffect(() => {
    if (project && !financialDraft) {
      setFinancialDraft(
        project.financial
          ? JSON.parse(JSON.stringify(project.financial))
          : { platforms: [], fixedCostSavings: [] }
      );
    }
  }, [project, financialDraft]);


  /* ------------------------------------------------------------
   🔑 CAPTURE BASELINE ONCE
------------------------------------------------------------ */
  useEffect(() => {
    if (!baselineData && project) {
      setBaselineData({
        metadata: JSON.parse(JSON.stringify(project.metadata || {})),
        financial: JSON.parse(
          JSON.stringify(
            project.financial || { platforms: [], fixedCostSavings: [] }
          )
        ),
      });

    }
  }, [project, baselineData]);


  /* ------------------------------------------------------------
     LOAD LOOKUPS (ONCE)
  ------------------------------------------------------------ */
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const collections = new Set();

        projectForm.dataModel.sections.forEach((sec) => {
          sec.groups?.forEach((grp) => {
            grp.fields?.forEach((field) => {
              if (
                field.type === "dropdown" &&
                typeof field.options === "string"
              ) {
                collections.add(field.options);
              }
            });
          });
        });

        const res = await axios.get(
          `${API}/api/mongo/form-data`,
          {
            params: {
              collections: Array.from(collections).join(","),
              status: "ACTIVE",
            },
          }
        );

        const payload = res.data.dropdowns || {};
        const dropdowns = buildDropdownData(
          projectForm.dataModel.sections,
          payload
        );

        setDropdownData(dropdowns);

        // 🔑 BUILD LABEL MAP (ADD THIS)
        const labels = {};
        Object.values(dropdowns).forEach(list => {
          (list || []).forEach(opt => {
            if (opt._id) {
              labels[String(opt._id)] =
                opt.name ||
                opt.label ||
                opt[Object.keys(opt).find(k => k.endsWith("Name"))];
            }
          });
        });

        setLabelMap(labels);

      } catch (e) {
        console.error("Failed to load lookups", e);
      } finally {
        setLoading(false);
      }
    };

    loadLookups();
  }, []);


  useEffect(() => {
    if (!labelMap || !Object.keys(labelMap).length) return;

    setFormData(prev => {
      const updated = { ...prev };
      Object.entries(prev).forEach(([k, v]) => {
        if (labelMap[v]) {
          updated[`${k}__label`] = labelMap[v];
        }
      });
      return updated;
    });
  }, [labelMap]);


  if (loading || !project) return null;

  const sections = projectForm.dataModel.sections;






  const resolveValue = (field, value) => {
    if (value == null) return "";

    // 🔑 Platform resolution
    if (field === "platforms") {
      const match = platformLookups.find(
        p => String(p.platformId) === String(value)
      );
      return match?.platformName || value;
    }


    const options = dropdownData[field];
    if (!options) return String(value);

    const match = options.find(o => String(o._id) === String(value));
    if (!match) return String(value);

    // prefer display fields
    return (
      match.name ||
      match.label ||
      match[Object.keys(match).find(k => k.endsWith("Name"))] ||
      String(value)
    );
  };

  const changes = baselineData
    ? computeChanges(
      baselineData,
      { metadata: formData, financial: financialDraft },
      resolveValue
    )
    : [];
  const canReviewChanges = changes.length > 0;

  const submitChangeRequest = async ({
    reason,
    comment,
    changes,
    totals,
  }) => {
    try {
      const payload = {
        projectId: project.metadata.projectId,
        projectDesc: formData.description,
        functionGroup: formData.functionGroup,
        reasonCode: reason,
        commentCode: comment,

        impact: {
          anuunalImpact: totals.annualized || 0,
          year1Impact:
            totals.yearly?.[new Date().getFullYear()] || 0,
          year2Impact:
            totals.yearly?.[new Date().getFullYear() + 1] || 0,
        },

        fields: changes.map((c) => ({
          fieldname: c.field,
          originalValue: c.oldValue,
          requestedvalue: c.newValue,
          anuunalImpact: totals.annualized || 0,
          year1Impact:
            totals.yearly?.[new Date().getFullYear()] || 0,
          year2Impact:
            totals.yearly?.[new Date().getFullYear() + 1] || 0,
        })),
      };

      await axios.post(
        `${API}/api/projects/change-requests`,
        payload
      );

      setShowReviewChanges(false);
      setActiveTab(3); // Change Requests tab
    } catch (err) {
      console.error("Failed to submit change request", err);
      alert("Failed to submit change request");
    }
  };


  return (
    <Paper sx={{ p: 2 }}>
      {/* 🔷 PROJECT HEADER (VISIBLE ACROSS ALL TABS) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          pb: 1,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Project Components
        </Typography>

        <Typography variant="h6" fontWeight={600}>
          Project ID : {project?.metadata?.projectId || "-"}
        </Typography>

        <Typography variant="h6" fontWeight={600}>
          Project Number : {project?.metadata?.projectNumber || "-"}
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => {
          setActiveTab(v); // Financial tab index
        }}
      >
        {sections
          .filter(s => s.title !== "Review")
          .map((s, i) => (
            <Tab key={i} label={s.title} />
          ))}

        {/* Change Request tab*/}
        <Tab label="Change Requests" />
      </Tabs>

      <Box mt={3}>
        {showReviewChanges ? (
          <ReviewChangesTab
            formData={formData}
            changes={changes}
            totals={reviewTotals}
            onBack={() => {
              setShowReviewChanges(false);
              setActiveTab(1); // ⬅ back to Financial tab
            }}
            onSubmit={submitChangeRequest}
          />
        ) : (
          <>
            {/* METADATA */}
            {activeTab === 0 && (
              <ProjectMetadataView
                sections={sections[0].groups}
                formData={formData}
                setFormData={setFormData}
                dropdownData={dropdownData}
                mode="details"
              />
            )}

            {/* FINANCIAL */}
            {activeTab === 1 && (
              <>
                <ProjectFinancialView
                  financial={financialDraft}
                  metadata={formData}
                  onFinancialChange={setFinancialDraft}
                  onTotalsChange={setReviewTotals}
                  onPlatformLookups={setPlatformLookups}
                  lookups={{ platforms: dropdownData.platforms || [] }}
                  mode="details"
                />

                {canReviewChanges && (
                  <Box mt={3} textAlign="right">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setShowReviewChanges(true)}
                    >
                      Review Changes
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* DOCUMENTS */}
            {activeTab === 2 && (
              <ProjectDocumentsTab
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {/* CHANGE REQUESTS */}
            {activeTab === 3 && (
              <ChangeRequestsTab
                projectId={project?.metadata?.projectId}
              />
            )}
          </>
        )}
      </Box>

    </Paper>
  );
};

export default ProjectDetailsPage;
