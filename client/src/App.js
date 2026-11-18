import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import LoginPage from "scenes/loginPage";
import DashboardPage from "scenes/homePage";
import ProfilePage from "scenes/profilePage";
import OpportunityDetailPage from "scenes/opportunityPage/Detail";
import OpportunityFormPage from "scenes/opportunityPage/Form";
import ApplicationsPage from "scenes/applicationsPage";
import NotificationsPage from "scenes/notificationsPage";
import AdminPage from "scenes/adminPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#236b67", dark: "#174c49", light: "#e4f2ef" },
    secondary: { main: "#e59a57" },
    background: { default: "#f5f7f6", paper: "#ffffff" },
    text: { primary: "#1e302f", secondary: "#607371" },
  },
  typography: { fontFamily: "Inter, Arial, sans-serif", button: { textTransform: "none", fontWeight: 600 } },
  shape: { borderRadius: 12 },
});

function Protected({ children, roles }) {
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  if (!token || !user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

function App() {
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={token && user ? <Navigate to="/home" replace /> : <LoginPage />} />
          <Route path="/home" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/opportunities/new" element={<Protected roles={["organization"]}><OpportunityFormPage /></Protected>} />
          <Route path="/opportunities/:id/edit" element={<Protected roles={["organization"]}><OpportunityFormPage /></Protected>} />
          <Route path="/opportunities/:id" element={<Protected><OpportunityDetailPage /></Protected>} />
          <Route path="/applications" element={<Protected roles={["volunteer"]}><ApplicationsPage /></Protected>} />
          <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
          <Route path="/admin" element={<Protected roles={["admin"]}><AdminPage /></Protected>} />
          <Route path="*" element={<Navigate to={token ? "/home" : "/"} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
