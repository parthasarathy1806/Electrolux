// src/components/LookupPage.js
import React from "react";
import LookupTable from "./LookupTable";
import { LOOKUPS } from "../config/lookups";
// import EmbedDashboard from "../superset/EmbedDashboard";
import { useParams } from "react-router-dom";

const LookupPage = () => {

  const {key} = useParams()
  const lookupKey = key.toLowerCase();
  const lookupConfig = LOOKUPS[lookupKey];

  if (!lookupConfig) return <p>Invalid lookup key: {lookupKey}</p>;
  

  // const isEmbed = window.location.search.includes("embed=true");
  // console.log("isEmbed:", isEmbed);
  // console.log("dashboardId:", lookupConfig.dashboardId);

  // EMBED MODE → Render Superset dashboard instead of table
  // if (isEmbed && lookupConfig.dashboardId) {
  //   return (
  //     <EmbedDashboard
  //       dashboardId={lookupConfig.dashboardId}
  //       classname="embed-dashboard-container"
  //     />
  //   );
  // }

  // NORMAL MODE → Render Lookup Table
  return (
    <div style={{ flex: 1 }}>
      <LookupTable lookupKey={lookupKey} config={lookupConfig} />
    </div>
  );
};



export default LookupPage;
