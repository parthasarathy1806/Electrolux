// src/components/LookupRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import { LOOKUPS } from "../config/lookups";
import LookupTable from "./LookupTable";

const LookupRoutes = () => {
  return (
    // <Routes>
    //   {Object.entries(LOOKUPS).map(([key, config]) => (
    //     <Route
    //       key={key}
    //       path={`/lookup/${key}`}
    //       element={<LookupTable lookupKey={key} config={config} />}
    //     />
    //   ))}
    // </Routes>
    <Route 
                    path={`/lookups/:key`}  
                    element={<LookupPage/>}
                  />


  );
};

export default LookupRoutes;
