// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { LOOKUPS } from "./config/lookups";
import Sidebar from "./components/Sidebar";
// import LookupTable from "./components/LookupTable";
import ProjectsPage from "./components/ProjectsPage";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ProjectFormPage from "./components/ProjectFormPage";
import TopMenuBar from "./components/TopMenuBar";
import LookupPage from "./components/LookupPage";
import ProjectDetailsPage from "./components/projectDetails/ProjectDetailsPage";


function App() {

  const isEmbed = window.location.search.includes("embed=true");
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Router>


        {/* TOP MENU BAR */}
        {!isEmbed && <TopMenuBar />}

        <div style={{ display: "flex" }}>

          {/* SIDEBAR */}
          {!isEmbed && <Sidebar />}

          {/* MAIN CONTENT AREA */}
          <main
            style={{
              flex: 1,
              padding: isEmbed ? "5px" : "20px",   // remove padding
              marginTop: isEmbed ? "20px" : "80px", // remove top menu offset
              marginLeft: isEmbed ? "10px" : "20px",
              maxWidth: isEmbed ? "1500px" : "auto",
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/lookups/brand" />} />

              {/* Projects */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<ProjectFormPage />} />

              {/* Lookups */}
              {/* {Object.entries(LOOKUPS).map(([key]) => (
                  <Route
                    key={key}
                    path={`/lookups/${key}`}  
                    element={<LookupPage lookupKey={key} />}
                  />
                ))} */}

              <Route
                path={`/lookups/:key`}
                element={<LookupPage />}
              />

              <Route path="/projects/:id" element={<ProjectDetailsPage />} />

              <Route path="*" element={<h3>404 - Page Not Found</h3>} />
            </Routes>
          </main>
        </div>
      </Router>
    </LocalizationProvider>
  );
}

export default App;
