// src/components/TopMenuBar.js
import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Avatar, Box, Button, Menu, MenuItem } from "@mui/material";
import { LOOKUPS } from "../config/lookups";
import { useNavigate,useLocation  } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import radiantGloballogo from "./image/radiantGloballogo.png";


const TopMenuBar = () => {
  const navigate = useNavigate();
const location = useLocation();
  // Lookups menu
  const [lookupAnchor, setLookupAnchor] = useState(null);
  const openLookupMenu = (event) => setLookupAnchor(event.currentTarget);
  const closeLookupMenu = () => setLookupAnchor(null);

  // User menu
  const [userAnchor, setUserAnchor] = useState(null);

  // Open user menu on hover or click
  const handleUserOpen = (event) => setUserAnchor(event.currentTarget);
  const handleUserClose = () => setUserAnchor(null);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 2,
        background: "#000",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        
        {/* LEFT SECTION */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img
            src={radiantGloballogo}
            alt="logo"
            href="/lookups/brand"
            style={{ height: "35px", cursor: "pointer" }}
          />

          {/* PROJECTS */}
          <Button color="inherit"
  sx={{
    backgroundColor:
      location.pathname === "/projects"
        ? "rgba(255,255,255,0.25)"
        : "transparent",
        "&:hover": {
      backgroundColor: "rgba(255,255,255,0.15)",
    },
  }}
  onClick={() => navigate("/projects")}
>
            Projects
          </Button>

          {/* LOOKUPS MENU */}
          <Button
            color="inherit"
  sx={{
    backgroundColor:
      location.pathname.startsWith("/lookups")
        ? "rgba(255,255,255,0.25)"
        : "transparent",
        ".MuiButton-endIcon": {
      marginLeft: "2px",      // default is 8px → we reduce it
    },
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.15)",
    },
  }}
  onClick={openLookupMenu}
  endIcon={
    <ArrowDropDownIcon
      style={{
        transform: lookupAnchor ? "rotate(180deg)" : "rotate(0deg)",
        transition: "0.2s",
      }}
 />
  }
>
            Lookups
          </Button>
          {/* FINANCIAL ADMIN */}
<Button color="inherit" 
sx={{"&:hover": {
          backgroundColor: "rgba(255,255,255,0.15)",
                        },
            }}>
  Financial Admin
</Button>

{/* SNAPSHOTS */}
<Button color="inherit">
  Snapshots
</Button>

{/* USERS */}
<Button color="inherit">
  Users
</Button>

{/* MY ACTION ITEMS */}
<Button color="inherit">
  My Action Items
</Button>

{/* CHANGE REQUESTS */}
<Button color="inherit">
  Change Requests
</Button>

{/* ANALYTICS */}
<Button color="inherit">
  Analytics
</Button>

{/* ALERTS */}
<Button color="inherit">
  Alerts
</Button>


          <Menu
            anchorEl={lookupAnchor}
            open={Boolean(lookupAnchor)}
            onClose={closeLookupMenu}
            anchorOrigin={{
    vertical: "bottom",
    horizontal: "left",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "left",
  }}
          >
            {Object.entries(LOOKUPS).map(([key, config]) => (
              <MenuItem
                key={key}
                onClick={() => {
                  navigate(`/lookups/${key}`);
                  closeLookupMenu();
                }}
              >
                {config.displayName}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* RIGHT SECTION (User menu) */}
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
            }}
            onClick={handleUserOpen}
        >
        <Avatar sx={{ bgcolor: "white", color: "black" }}>P</Avatar>
        <Typography variant="body1">Parthasarathy</Typography>
    </Box>

        {/* DROPDOWN MENU FOR USER */}
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={handleUserClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
        }}
        transformOrigin={{
    vertical: "top",
    horizontal: "right",
  }}
  PaperProps={{
    sx: {
      width: "180px",   // 👈 full dropdown width (wider than avatar)
      borderRadius: "8px",
    },
  }}
        >
          <MenuItem onClick={handleUserClose}>Profile</MenuItem>
          <MenuItem onClick={handleUserClose}>Logout</MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
};

export default TopMenuBar;
