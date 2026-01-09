import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

/* -----------------------------
   Lookup maps (same as elsewhere)
------------------------------*/
const LOOKUP_FIELD_MAP = {
  operationsGroup: "opsgroup",
  activityType: "activityType",
  risk: "projectStatus",
  projectOwner: "usersClean",
  conversionMode: "conversionOpsMode",
  operationsMode: "opsMode",
};

const PREFERRED_LABEL_FIELD = {
  opsgroup: "opsGroupName",
  activityType: "name",
  projectStatus: "projectStatusName",
  usersClean: "firstName",
  conversionOpsMode: "conversionOpsModeName",
    opsMode: "opsModeName",
};

/* -----------------------------
   Helpers
------------------------------*/
const formatDate = (d) =>
  d ? dayjs(d).format("MM/DD/YYYY") : "-";

const formatCurrency = (n) =>
  typeof n === "number"
    ? `$${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "-";

const buildYearlySentence = (yearly = {}) => {
  const entries = Object.entries(yearly);
  if (!entries.length) return "";

  if (entries.length === 1) {
    const [year] = entries[0];
    return `, all in the year ${year}`;
  }

  return (
    ", but only " +
    entries
      .map(
        ([year, value]) =>
          `${formatCurrency(value)} in the year ${year}`
      )
      .join(" and ")
  );
};

const replaceTokens = (template, values) =>
  template.replace(/\{\{(.*?)\}\}/g, (_, key) => values[key.trim()] ?? "-");

/* -----------------------------
   MAIN COMPONENT
------------------------------*/
const ProjectReviewTab = ({ formData, section }) => {
  const groups = section.groups || [];
  const lookupCache = formData._lookupCache || {};

  /* 🔹 Resolve dropdown ID → label */
  const resolveLabel = (fieldName, value) => {
    if (!value) return "-";

    const collection = LOOKUP_FIELD_MAP[fieldName];
    if (!collection) return value;

    const list = lookupCache[collection] || [];
    const found = list.find(
      (item) =>
        String(item._id) === String(value) ||
        Object.values(item).some((v) => String(v) === String(value))
    );

    if (!found) return value;

    const pref = PREFERRED_LABEL_FIELD[collection];
    return found[pref] || found.name || found.label || value;
  };

  /* -----------------------------
     Build value map
  ------------------------------*/
  const values = useMemo(() => {
    const totals = formData.financial?.totals || {};

    return {
      operationsGroup: resolveLabel("operationsGroup", formData.operationsGroup),
      operationsMode: resolveLabel("operationsMode", formData.operationsMode),
      risk: resolveLabel("risk", formData.risk),
      startDate: formatDate(formData.startDate),
      status: formData.status || "-",
      projectOwner: resolveLabel("projectOwner", formData.projectOwner),
      conversionMode: resolveLabel("conversionMode", formData.conversionMode),
      annualizedTotal: formatCurrency(totals.annualized),
      yearlyBreakdown: buildYearlySentence(totals.yearly),
    };
  }, [formData, lookupCache]);

  return (
    <Box
      sx={{
        border: "1px dashed #d0d0d0",
        borderRadius: 1,
        p: 3,
        maxWidth: 900,
        mx: "auto",
      }}
    >
      {groups.map((group, gIdx) => (
        <Box key={gIdx}>
          {group.fields?.map((field, fIdx) => {
            if (field.type !== "sentence") return null;

            const text = replaceTokens(field.template, values);

            return (
              <Typography
                key={fIdx}
                sx={{ mb: 2, fontSize: "1rem", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: text }}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default ProjectReviewTab;
