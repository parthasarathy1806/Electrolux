// src/components/projectDetails/ChangeRequestsTab.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import axios from "axios";

const ChangeRequestsTab = ({ projectId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchChangeRequests = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE}/api/projects/change-requests`,
          { params: { projectId } }
        );
        setData(res.data || []);
      } catch (err) {
        console.error("Failed to load change requests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChangeRequests();
  }, [projectId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Typography color="text.secondary" mt={2}>
        No change requests available for this project.
      </Typography>
    );
  }

  /* ------------------------------------------------------------
     🔹 TOP SUMMARY (Approve Changes)
  ------------------------------------------------------------ */
  const summary = data.reduce(
    (acc, cr) => {
      acc.annual += cr.impact?.annualized || 0;
      acc.year1 += cr.impact?.year1 || 0;
      acc.year2 += cr.impact?.year2 || 0;
      return acc;
    },
    { annual: 0, year1: 0, year2: 0 }
  );

  return (
    <Box>
      {/* ================= SUMMARY BAR ================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "200px repeat(4, 1fr)",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <Typography fontWeight={600}>Approve Changes</Typography>

        <Box>
          <Typography fontWeight={600}>
            ${summary.annual.toLocaleString()}
          </Typography>
          <Typography variant="caption">Total Annualized</Typography>
        </Box>

        <Box>
          <Typography fontWeight={600}>
            ${summary.year1.toLocaleString()}
          </Typography>
          <Typography variant="caption">Total Year 1</Typography>
        </Box>

        <Box>
          <Typography fontWeight={600}>
            ${summary.year2.toLocaleString()}
          </Typography>
          <Typography variant="caption">Total Year 2</Typography>
        </Box>

        <Box>
          <Typography fontWeight={600}>$0.00</Typography>
          <Typography variant="caption">Total Year 3</Typography>
        </Box>
      </Box>

      {/* ================= CHANGE REQUESTS ================= */}
      {data.map((cr) => (
        <Box
          key={cr.changeRequestId}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            mb: 3,
            backgroundColor: "#fff",
          }}
        >
          {/* -------- Header Row -------- */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr",
              p: 1.5,
              backgroundColor: "#f5f7fa",
              fontSize: 13,
            }}
          >
            <div>
              <strong>Project ID:</strong> {cr.projectId}
            </div>
            <div>
              <strong>Request ID:</strong>{" "}
              {cr.changeRequestId.slice(-5)}
            </div>
            <div>
              <strong>Project Description:</strong> test
            </div>
            <div>
              <strong>Entered:</strong>{" "}
              {new Date(cr.createdOn).toLocaleDateString()}
            </div>
            <div>
              <strong>Status:</strong> {cr.status}
            </div>
          </Box>

          {/* -------- Field Changes -------- */}
          <Box sx={{ p: 2 }}>
            {cr.fields.map((f, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr 60px 1fr",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography fontWeight={600}>
                  {f.fieldName}
                </Typography>

                <Typography color="error.main">
                  {f.originalValue}
                </Typography>

                <ArrowRightAltIcon />

                <Typography color="success.main">
                  {f.requestedValue}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider />

          {/* -------- Reason & Comments -------- */}
          <Box sx={{ p: 2 }}>
            <Typography fontWeight={600}>Reason</Typography>
            <Typography variant="body2" mb={1}>
              {cr.reasonCode}
            </Typography>

            <Typography fontWeight={600}>Comments</Typography>
            <Typography variant="body2">
              {cr.commentCode}
            </Typography>
          </Box>

          {/* -------- Impact Section -------- */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              p: 2,
              backgroundColor: "#fafafa",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Box>
              <strong>
                ${cr.impact.annualized.toLocaleString()}
              </strong>
              <div>Total Annualized</div>
            </Box>

            <Box>
              <strong>
                ${cr.impact.year1.toLocaleString()}
              </strong>
              <div>Total Year 1</div>
            </Box>

            <Box>
              <strong>
                ${cr.impact.year2.toLocaleString()}
              </strong>
              <div>Total Year 2</div>
            </Box>

            <Box>
              <strong>$0.00</strong>
              <div>Total Year 3</div>
            </Box>
          </Box>

          {/* -------- Actions (only if not approved) -------- */}
          {cr.status !== "APPROVED" && (
            <Box sx={{ p: 2, textAlign: "right" }}>
              <Button
                color="error"
                variant="contained"
                sx={{ mr: 1 }}
              >
                Reject
              </Button>
              <Button color="success" variant="contained">
                Approve
              </Button>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ChangeRequestsTab;
