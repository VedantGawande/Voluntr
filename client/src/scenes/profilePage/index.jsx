import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import Navbar from "scenes/navbar";
import { apiRequest } from "api";
import { useDispatch, useSelector } from "react-redux";
import { setLogin, setLogout } from "state";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/profile", token).then((data) => {
      setProfile(data);
      setForm(data.role === "volunteer" ? { name: data.name, ...(data.volunteerProfile || {}), skills: (data.volunteerProfile?.skills || []).join(", "), interests: (data.volunteerProfile?.interests || []).join(", ") } : { name: data.name, ...(data.organizationProfile || {}) });
    }).catch((err) => setError(err.message));
  }, [token]);

  const update = (field) => (event) => setForm((old) => ({ ...old, [field]: event.target.value }));
  const saveProfile = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const payload = { ...form };
      if (profile.role === "volunteer") {
        payload.skills = String(form.skills || "").split(",").map((item) => item.trim()).filter(Boolean);
        payload.interests = String(form.interests || "").split(",").map((item) => item.trim()).filter(Boolean);
      }
      const updated = await apiRequest("/api/profile", token, { method: "PATCH", body: JSON.stringify(payload) });
      setProfile(updated);
      setForm(updated.role === "volunteer" ? { name: updated.name, ...(updated.volunteerProfile || {}), skills: (updated.volunteerProfile?.skills || []).join(", "), interests: (updated.volunteerProfile?.interests || []).join(", ") } : { name: updated.name, ...(updated.organizationProfile || {}) });
      dispatch(setLogin({ user: updated, token }));
      setMessage("Profile saved successfully.");
    } catch (err) { setError(err.message); }
  };

  const changePassword = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const result = await apiRequest("/auth/change-password", token, { method: "PATCH", body: JSON.stringify(passwords) });
      setMessage(result.message); setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) { setError(err.message); }
  };

  const deactivate = async () => {
    if (!window.confirm("Deactivate your account? You will be logged out and will not be able to sign in again until an administrator reactivates it.")) return;
    try {
      await apiRequest("/api/profile", token, { method: "DELETE" });
      dispatch(setLogout()); navigate("/");
    } catch (err) { setError(err.message); }
  };

  if (!profile) return <><Navbar /><Box className="page-wrap"><Typography color="text.secondary">Loading profile…</Typography>{error && <Alert severity="error">{error}</Alert>}</Box></>;
  const isVolunteer = profile.role === "volunteer";
  const isOrganization = profile.role === "organization";
  const field = (name, label, multiline = false) => <TextField fullWidth label={label} value={form[name] || ""} onChange={update(name)} multiline={multiline} minRows={multiline ? 3 : undefined} />;

  return <><Navbar /><Box className="page-wrap">
    <Typography variant="h4" fontWeight={800} sx={{ mb: .5 }}>My profile</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Manage your {profile.role} information and account settings.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined"><CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Profile information</Typography>
          <form onSubmit={saveProfile}><Stack spacing={2}>
            {field("name", isOrganization ? "Account holder name" : "Full name")}
            <TextField fullWidth label="Email address" value={profile.email} disabled helperText="Email address cannot be changed in this project." />
            {isVolunteer && <>
              {field("phone", "Phone number")}{field("city", "City / location")}{field("bio", "Short bio", true)}
              {field("skills", "Skills (comma separated)")}{field("interests", "Interests (comma separated)")}{field("availability", "Availability")}
            </>}
            {isOrganization && <>
              {field("organizationName", "Organization name")}{field("description", "Organization description", true)}
              {field("category", "Organization category")}{field("contactPerson", "Contact person")}{field("phone", "Phone number")}{field("city", "City / location")}{field("website", "Website URL (optional)")}
            </>}
            <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>Save profile</Button>
          </Stack></form>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card variant="outlined"><CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800}>Account details</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>Account type: <b>{profile.role}</b></Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>Status: <b>{profile.isActive ? "Active" : "Inactive"}</b></Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>Member since: {new Date(profile.createdAt).toLocaleDateString()}</Typography>
          {isVolunteer && <Button color="error" variant="outlined" sx={{ mt: 3 }} onClick={deactivate}>Deactivate my account</Button>}
        </CardContent></Card>
        <Card variant="outlined" sx={{ mt: 2 }}><CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Change password</Typography>
          <form onSubmit={changePassword}><Stack spacing={2}>
            <TextField label="Current password" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords((old) => ({ ...old, currentPassword: e.target.value }))} required />
            <TextField label="New password" type="password" value={passwords.newPassword} onChange={(e) => setPasswords((old) => ({ ...old, newPassword: e.target.value }))} required helperText="At least 8 characters" />
            <Button type="submit" variant="outlined">Update password</Button>
          </Stack></form>
        </CardContent></Card>
      </Grid>
    </Grid>
  </Box></>;
};

export default ProfilePage;
