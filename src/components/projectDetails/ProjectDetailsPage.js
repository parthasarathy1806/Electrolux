// src/components/projectDetails/ProjectDetailsPage.js
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Paper, Typography, Button} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";

import projectForm from "../../forms/project_form.json";
import ProjectMetadataView from "./ProjectMetadataView";
import ProjectFinancialView from "./ProjectFinancialView";
import ReviewChangesTab from "../reviewchanges/ReviewChangesTab";
import { computeChanges } from "../../utils/changeDiff";
import { hasRelevantChanges } from "../../utils/hasChanges";


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

    // ✅ ADD THESE HERE
  const [baselineData, setBaselineData] = useState(null);
  const [showReviewChanges, setShowReviewChanges] = useState(false);
  // ADD THIS (one line)
  const [financialTouched, setFinancialTouched] = useState(false);
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

        /* normalize metadata ObjectId → string */
        const normalizedMetadata = {};
        Object.entries(data.metadata || {}).forEach(([k, v]) => {
          normalizedMetadata[k] = v != null ? String(v) : v;
        });

        setProject(data);

        setFormData(prev => ({
          ...prev,
          ...normalizedMetadata,

          // 🔑 hydrate only once
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
  }, [id]);

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

        setDropdownData(
          buildDropdownData(projectForm.dataModel.sections, payload)
        );
      } catch (e) {
        console.error("Failed to load lookups", e);
      } finally {
        setLoading(false);
      }
    };

    loadLookups();
  }, []);

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
        {sections.map((s, i) => (
          <Tab key={i} label={s.title} />
        ))}
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
              metadata={project.metadata}
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
    </>
  )}
</Box>

    </Paper>
  );
};

export default ProjectDetailsPage;
