"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SettingsIcon from "@mui/icons-material/Settings";
import DescriptionIcon from "@mui/icons-material/Description";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import Divider from "@mui/material/Divider";

export const DRAWER_WIDTH = 240;
export const COLLAPSED_DRAWER_WIDTH = 72;

const navItems = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Applications", href: "/applications", icon: <WorkIcon /> },
  { label: "New Application", href: "/applications/new", icon: <AddCircleIcon /> },
  { label: "Job Boards", href: "/job-boards", icon: <OpenInNewIcon /> },
  { label: "Resume", href: "/resume", icon: <DescriptionIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const drawerWidth = collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: collapsed ? "center" : "space-between", px: 1.5 }}>
        {!collapsed && (
          <Typography variant="h6" noWrap fontWeight="bold">
            Job Tracker
          </Typography>
        )}
        {isDesktop && (
          <Tooltip title={collapsed ? "Expand navigation" : "Collapse navigation"} placement="right">
            <IconButton onClick={onToggleCollapse} size="small">
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <Tooltip
            key={item.href}
            title={collapsed && isDesktop ? item.label : ""}
            placement="right"
          >
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname === item.href}
              onClick={isDesktop ? undefined : onClose}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? "center" : "initial",
                px: 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <Tooltip title={collapsed && isDesktop ? "Log out" : ""} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? "center" : "initial",
              px: 2,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 2,
                justifyContent: "center",
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Log Out" />}
          </ListItemButton>
        </Tooltip>
      </List>
      {collapsed && isDesktop && (
        <Box sx={{ px: 1, pt: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center" }}
          >
            JT
          </Typography>
        </Box>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
