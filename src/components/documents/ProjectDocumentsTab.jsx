import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  Radio,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const INVALID_FILE_REGEX = /[<>'+\/;`%&@#:?!$=*,]/;
const DOCUMENT_TYPES = ["CHARTER", "NONE"];

const ProjectDocumentsTab = ({ formData, setFormData }) => {
  const [selectedRow, setSelectedRow] = useState(null);

  /* 🔹 Draft lives in formData (NOT local state) */
  const draft = formData.documentsDraft || {};
  const docType = draft.documentType || "";
  const file = draft.file || null;

  const documents = formData.documents || [];
  const uploadEnabled = docType && file;

  /* 🔹 Persist document type immediately */
  const handleDocTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      documentsDraft: {
        ...prev.documentsDraft,
        documentType: value,
      },
    }));
  };

  /* 🔹 Persist file immediately */
  const handleFileChange = (file) => {
    setFormData((prev) => ({
      ...prev,
      documentsDraft: {
        ...prev.documentsDraft,
        file,
      },
    }));
  };

  /* 🔹 Upload → move draft to documents + clear draft */
  const handleUpload = () => {
    if (!file || INVALID_FILE_REGEX.test(file.name)) {
      alert(
        "File name should not contains following characters ([<>'+\\/;`%&@#:?!$=*,])"
      );
      return;
    }

    const newDoc = {
      id: crypto.randomUUID(),
      fileName: file.name,
      documentType: docType,
      uploadedBy: "ADMIN USER", // later replace with logged-in user
      file,
    };

    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
      documentsDraft: {}, // ✅ clear draft ONLY after upload
    }));
  };

  /* 🔹 Delete selected uploaded document */
  const handleDelete = () => {
    if (!selectedRow) return;

    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== selectedRow),
    }));

    setSelectedRow(null);
  };
  const handleDownload = (docId) => {
  const url = `${process.env.REACT_APP_API_BASE}/api/mongo/documents/download/${docId}`;

  // 🔑 force browser download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <Box>
      {/* Upload Controls */}
      <Box display="flex" gap={2} alignItems="center" mb={3}>
        <FormControl sx={{ minWidth: 220 }}>
          <Select
            value={docType}
            displayEmpty
            onChange={(e) => handleDocTypeChange(e.target.value)}
          >
            <MenuItem value="">
              -- Select Document Type --
            </MenuItem>
            {DOCUMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selected file name display */}
        <Box sx={{ minWidth: 260 }}>
          <input
            type="text"
            readOnly
            value={file?.name || ""}
            placeholder="No file chosen"
            style={{
              width: "95%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#f5f5f5",
            }}
          />
        </Box>

        {/* Choose file */}
        <Button variant="outlined" component="label">
          Choose file
          <input
            hidden
            type="file"
            onChange={(e) =>
              handleFileChange(e.target.files?.[0] || null)
            }
          />
        </Button>

        {/* Upload */}
        <Button
          variant="contained"
          disabled={!uploadEnabled}
          onClick={handleUpload}
        >
          Upload
        </Button>

        {/* Delete */}
        <Button
          variant="contained"
          color="error"
          disabled={!selectedRow}
          onClick={handleDelete}
        >
          Delete
        </Button>
        {/* Download */}
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedRow}
          onClick={() => handleDownload(selectedRow)}
        >
          Download
        </Button>

        {/* Help icon */}
        <Tooltip
          title="File name should not contains following characters ([<>'+\/;`%&@#:?!$=*,])"
          arrow
        >
          <IconButton>
            <InfoOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Documents Table */}
      <Box border="1px solid #e0e0e0" borderRadius={1}>
        <Box
          display="grid"
          gridTemplateColumns="40px 2fr 1fr 1fr"
          p={1}
          fontWeight={600}
          borderBottom="1px solid #e0e0e0"
        >
          <div />
          <div>Filename</div>
          <div>Upload By</div>
          <div>Document Type</div>
        </Box>

        {documents.length === 0 ? (
          <Box p={2} textAlign="center" color="text.secondary">
            There are no documents associated with this project.
            Use the form above to upload a new document.
          </Box>
        ) : (
          documents.map((d) => (
            <Box
              key={d.id}
              display="grid"
              gridTemplateColumns="40px 2fr 1fr 1fr"
              p={1}
              alignItems="center"
              borderBottom="1px solid #f0f0f0"
            >
              <Radio
                checked={selectedRow === d.id}
                onChange={() => setSelectedRow(d.id)}
              />
              <Typography>{d.fileName}</Typography>
              <Typography>{d.uploadedBy}</Typography>
              <Typography>{d.documentType}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ProjectDocumentsTab;
