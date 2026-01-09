// src/components/Sidebar.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  FolderCopy as FolderCopyIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import InsightsIcon from "@mui/icons-material/Insights";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

import { LOOKUPS } from "../config/lookups";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openLookups, setOpenLookups] = useState(false);
  const [hoverExpand, setHoverExpand] = useState(false);

  const sidebarWidth = hoverExpand ? 240 : 70;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      onMouseEnter={() => setHoverExpand(true)}
      onMouseLeave={() => setHoverExpand(false)}
      sx={{
        width: sidebarWidth,
        transition: "width 0.3s",
        "& .MuiDrawer-paper": {
          width: sidebarWidth,
          height: "calc(100% - 64px)",   // 👈 FIXED HEIGHT
          marginTop: "64px",
          transition: "width 0.3s",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "hidden",
          paddingTop: 0,          // prevents MUI auto padding
          paddingBottom: 0,       // prevents subtle height shift
          boxSizing: "border-box"
        },
      }}
    >
      <List sx={{ flex: 1, overflowY: "auto" }}>

  {/* PROJECTS */}
  <ListItemButton 
    onClick={() => navigate("/projects")}
    selected={location.pathname === "/projects"}
  >
    <ListItemIcon><WorkIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Projects" />}
  </ListItemButton>

  {/* LOOKUPS (2nd position) */}
  <ListItemButton
    onClick={() => setOpenLookups((prev) => !prev)}
    selected={location.pathname.startsWith("/lookups")}
  >
    <ListItemIcon><FolderCopyIcon /></ListItemIcon>

    {hoverExpand && <ListItemText primary="Lookups" />}
    {hoverExpand && (openLookups ? <ExpandLess /> : <ExpandMore />)}
  </ListItemButton>

  <Collapse in={openLookups} timeout="auto" unmountOnExit>
    <List component="div" disablePadding>
      {Object.entries(LOOKUPS).map(([key, config]) => {
        const path = `/lookups/${key}`;
        const isActive = location.pathname === path;

        return (
          <ListItemButton
            key={key}
            onClick={() => navigate(path)}
            selected={isActive}
            sx={{ pl: hoverExpand ? 4 : 2 }}
          >
            {hoverExpand && (
              <ListItemText
                primary={config.displayName}
                primaryTypographyProps={{
                  fontWeight: isActive ? "bold" : "normal",
                }}
              />
            )}
          </ListItemButton>
        );
      })}
    </List>
  </Collapse>

  <Divider />

  {/* ADMIN / OTHER MENUS */}
  <ListItemButton selected={location.pathname === "/financial-admin"}>
    <ListItemIcon><AccountBalanceIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Financial Admin" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/snapshots"}>
    <ListItemIcon><PhotoCameraIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Snapshots" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/users"}>
    <ListItemIcon><PeopleIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Users" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/my-action-items"}>
    <ListItemIcon><AssignmentTurnedInIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="My Action Items" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/change-requests"}>
    <ListItemIcon><ChangeCircleIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Change Requests" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/analytics"}>
    <ListItemIcon><InsightsIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Analytics" />}
  </ListItemButton>

  <ListItemButton selected={location.pathname === "/alerts"}>
    <ListItemIcon><NotificationsActiveIcon /></ListItemIcon>
    {hoverExpand && <ListItemText primary="Alerts" />}
  </ListItemButton>

  <Divider />
</List>

    </Drawer>
  );
};

export default Sidebar;
