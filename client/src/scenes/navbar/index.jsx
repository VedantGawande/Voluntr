import { useEffect, useState } from "react";
import { AppBar, Badge, Box, Button, Container, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useDispatch, useSelector } from "react-redux";
import { setLogout } from "state";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "api";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchor, setAnchor] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest("/api/notifications", token).then((items) => {
      if (active) setUnread(items.filter((item) => !item.isRead).length);
    }).catch(() => {});
    return () => { active = false; };
  }, [token, location.pathname]);

  const links = [
    { label: "Dashboard", to: "/home" },
    ...(user?.role === "volunteer" ? [{ label: "My applications", to: "/applications" }] : []),
    ...(user?.role === "organization" ? [{ label: "Create opportunity", to: "/opportunities/new" }] : []),
    ...(user?.role === "admin" ? [{ label: "Admin", to: "/admin" }] : []),
  ];
  return (
    <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: "1px solid #e6ece9", bgcolor: "rgba(255,255,255,.95)" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 70, gap: 2 }}>
          <Typography component={Link} to="/home" variant="h5" fontWeight={800} color="primary.dark" sx={{ mr: { xs: "auto", md: 4 }, letterSpacing: -1 }}>voluntr<span style={{ color: "#e59a57" }}>.</span></Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, mr: "auto" }}>
            {links.map((link) => <Button key={link.to} component={Link} to={link.to} color={location.pathname === link.to ? "primary" : "inherit"} sx={{ fontWeight: location.pathname === link.to ? 800 : 600 }}>{link.label}</Button>)}
          </Box>
          <IconButton component={Link} to="/notifications" aria-label="Notifications"><Badge badgeContent={unread} color="secondary"><NotificationsNoneIcon /></Badge></IconButton>
          <Button onClick={(event) => setAnchor(event.currentTarget)} startIcon={<AccountCircleOutlinedIcon />} color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>{user?.name || "Account"}</Button>
          <IconButton onClick={(event) => setAnchor(event.currentTarget)} sx={{ display: { xs: "inline-flex", sm: "none" } }}><AccountCircleOutlinedIcon /></IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            {links.map((link) => <MenuItem key={link.to} component={Link} to={link.to} onClick={() => setAnchor(null)} sx={{ display: { xs: "block", md: "none" } }}>{link.label}</MenuItem>)}
            <MenuItem component={Link} to="/profile" onClick={() => setAnchor(null)}>My profile</MenuItem>
            <MenuItem onClick={() => { dispatch(setLogout()); setAnchor(null); navigate("/"); }}>Log out</MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
