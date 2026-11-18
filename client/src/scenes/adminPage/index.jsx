import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import Navbar from "scenes/navbar";
import OpportunityCard from "components/OpportunityCard";
import { apiRequest } from "api";
import { useSelector } from "react-redux";

const AdminPage = () => {
  const token = useSelector((state) => state.token);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [stats, userList, opportunityList] = await Promise.all([
        apiRequest("/api/admin/overview", token),
        apiRequest("/api/admin/users", token),
        apiRequest("/api/opportunities", token),
      ]);
      setOverview(stats); setUsers(userList); setOpportunities(opportunityList);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const setActive = async (user, isActive) => {
    try { await apiRequest(`/api/admin/users/${user._id}/active`, token, { method: "PATCH", body: JSON.stringify({ isActive }) }); await load(); }
    catch (err) { setError(err.message); }
  };
  const removeOpportunity = async (item) => {
    if (!window.confirm(`Remove “${item.title}”? This also removes its applications and notifications.`)) return;
    try { await apiRequest(`/api/admin/opportunities/${item._id}`, token, { method: "DELETE" }); await load(); }
    catch (err) { setError(err.message); }
  };

  return <><Navbar /><Box className="page-wrap">
    <Typography variant="h4" fontWeight={800}>Admin dashboard</Typography><Typography color="text.secondary" sx={{ mt: .5, mb: 3 }}>Basic platform overview and account maintenance.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box> : <>
      {overview && <Grid container spacing={2} sx={{ mb: 4 }}>
        {[["Volunteers", overview.volunteers], ["Organizations", overview.organizations], ["All opportunities", overview.totalOpportunities], ["Open opportunities", overview.openOpportunities], ["Applications", overview.applications]].map(([label, value]) => <Grid item xs={6} md={2.4} key={label}><Card variant="outlined"><CardContent><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={800} sx={{ mt: .5 }}>{value}</Typography></CardContent></Card></Grid>)}
      </Grid>}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>Users ({users.length})</Typography>
      <Stack spacing={1} sx={{ mb: 4 }}>{users.map((user) => <Card key={user._id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.5, "&:last-child": { pb: 1.5 } }}><Box><Typography fontWeight={700}>{user.name}</Typography><Typography variant="body2" color="text.secondary">{user.email}</Typography><Stack direction="row" spacing={1} sx={{ mt: .5 }}><Chip size="small" label={user.role} /><Chip size="small" label={user.isActive ? "Active" : "Inactive"} color={user.isActive ? "success" : "default"} /></Stack></Box>{user.role !== "admin" && <Button size="small" color={user.isActive ? "error" : "primary"} onClick={() => setActive(user, !user.isActive)}>{user.isActive ? "Deactivate" : "Reactivate"}</Button>}</CardContent></Card>)}</Stack>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>Opportunities ({opportunities.length})</Typography>
      {opportunities.length ? <Grid container spacing={2}>{opportunities.map((item) => <Grid item xs={12} md={6} lg={4} key={item._id}><OpportunityCard opportunity={item} organizationView onDelete={removeOpportunity} /></Grid>)}</Grid> : <Alert severity="info">No opportunities have been created yet.</Alert>}
    </>}
  </Box></>;
};

export default AdminPage;
