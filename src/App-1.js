import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import { LOOKUPS } from "./config/lookups";
import LookupTable from "./components/LookupTable";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" },
      }}
    >
      <List>
        {Object.entries(LOOKUPS).map(([key, config]) => {
          const isActive = location.pathname === `/lookup/${key}`;
          return (
            <ListItemButton
              key={key}
              onClick={() => navigate(`/lookup/${key}`)}
              selected={isActive}
              sx={{
                backgroundColor: isActive ? "#1976d2" : "transparent",
                color: isActive ? "#1976d2" : "inherit",
                "&:hover": { backgroundColor: isActive ? "#1565c0" : "#f0f0f0" },
              }}
            >
              <ListItemText
                primary={config.displayName}
                primaryTypographyProps={{
                  fontWeight: isActive ? "bold" : "normal",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ marginLeft: "20px", flex: 1, padding: "20px" }}>
          <Routes>
            {/* Default route redirects to brand */}
            <Route path="/" element={<Navigate to="/lookup/brand" />} />

            {/* Dynamic routes for all lookup tables */}
            {Object.entries(LOOKUPS).map(([key, config]) => (
              <Route
                key={key}
                path={`/lookup/${key}`}
                element={<LookupTable lookupKey={key} config={config} />}
              />
            ))}

            {/* Fallback for invalid URLs */}
            <Route path="*" element={<h3>404 - Page Not Found</h3>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
