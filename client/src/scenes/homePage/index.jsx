import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import Navbar from "scenes/navbar";
import OpportunityCard from "components/OpportunityCard";
import { apiRequest } from "api";
import { useSelector } from "react-redux";

const StatCard = ({ label, value, helper }) => (
  <Card variant="outlined" sx={{ borderColor: "#e5ece9" }}><CardContent>
    <Typography color="text.secondary" variant="body2">{label}</Typography>
    <Typography variant="h4" fontWeight={800} sx={{ mt: .5 }}>{value ?? "—"}</Typography>
    {helper && <Typography color="text.secondary" variant="caption">{helper}</Typography>}
  </CardContent></Card>
);

const DashboardPage = () => {
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", location: "", mode: "", date: "", skill: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOpportunities = useCallback(async (currentFilters = filters) => {
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const items = await apiRequest(`/api/opportunities${params.toString() ? `?${params.toString()}` : ""}`, token);
      setOpportunities(items);
    } catch (err) { setError(err.message); }
  }, [token, filters]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.all([apiRequest("/api/dashboard", token), ...(user.role === "volunteer" || user.role === "organization" ? [apiRequest("/api/opportunities", token)] : [])])
      .then(([data, items]) => { if (live) { setDashboard(data); if (items) setOpportunities(items); } })
      .catch((err) => { if (live) setError(err.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [token, user.role]);

  const updateFilter = (field) => (event) => setFilters((old) => ({ ...old, [field]: event.target.value }));
  const submitSearch = (event) => { event.preventDefault(); loadOpportunities(filters); };

  return <><Navbar /><Box className="page-wrap">
    <Box className="page-heading"><Box><Typography variant="h4" fontWeight={800}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user.name.split(" ")[0]}.</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Here’s what’s happening on Voluntr.</Typography></Box>
      {user.role === "organization" && <Button component={Link} to="/opportunities/new" variant="contained">Create opportunity</Button>}
      {user.role === "admin" && <Button component={Link} to="/admin" variant="contained">Open admin dashboard</Button>}
    </Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box> : <>
      {user.role === "volunteer" && dashboard && <>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}><StatCard label="Applications" value={dashboard.totalApplications} helper="Total submitted" /></Grid>
          <Grid item xs={12} sm={4}><StatCard label="Pending" value={dashboard.pendingApplications} helper="Waiting for a response" /></Grid>
          <Grid item xs={12} sm={4}><StatCard label="Accepted" value={dashboard.acceptedApplications} helper="Opportunities you joined" /></Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}><Card variant="outlined" sx={{ height: "100%" }}><CardContent><Typography variant="body2" color="text.secondary">Profile completion</Typography><Typography variant="h4" fontWeight={800} sx={{ mt: .5 }}>{dashboard.profileCompletion?.percent ?? 0}%</Typography><Typography variant="caption" color="text.secondary">{dashboard.profileCompletion?.completed ?? 0} of {dashboard.profileCompletion?.total ?? 0} profile details completed</Typography><Button component={Link} to="/profile" size="small" sx={{ display: "block", mt: 1, px: 0 }}>Complete profile</Button></CardContent></Card></Grid>
          <Grid item xs={12} md={8}><Card variant="outlined" sx={{ height: "100%" }}><CardContent><Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Upcoming accepted opportunities</Typography>{dashboard.upcomingAcceptedApplications?.length ? <Stack spacing={.8}>{dashboard.upcomingAcceptedApplications.map((application) => <Box key={application._id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Typography fontWeight={600}>{application.opportunity.title}</Typography><Typography variant="body2" color="text.secondary">{new Date(application.opportunity.date).toLocaleDateString()}</Typography></Box>)}</Stack> : <Typography variant="body2" color="text.secondary">No upcoming accepted opportunities yet.</Typography>}</CardContent></Card></Grid>
        </Grid>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6" fontWeight={800}>Recent applications</Typography><Button component={Link} to="/applications">View all</Button></Stack>
          {dashboard.recentApplications?.length ? <Stack spacing={1}>{dashboard.recentApplications.slice(0, 3).map((application) => <Card key={application._id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}><Box><Typography fontWeight={700}>{application.opportunity?.title || "Opportunity"}</Typography><Typography variant="body2" color="text.secondary">{application.opportunity?.location || ""}</Typography></Box><Chip size="small" label={application.status} color={application.status === "accepted" ? "success" : application.status === "rejected" ? "error" : "warning"} /></CardContent></Card>)}</Stack> : <Alert severity="info">You haven’t applied to any opportunities yet. Explore the listings below.</Alert>}
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5" fontWeight={800}>Explore opportunities</Typography><Chip label={`${opportunities.length} found`} /></Stack>
        <Card variant="outlined" sx={{ mb: 3, borderColor: "#e5ece9" }}><CardContent component="form" onSubmit={submitSearch}><Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Search keyword" value={filters.q} onChange={updateFilter("q")} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="Category" value={filters.category} onChange={updateFilter("category")} /></Grid>
          <Grid item xs={6} md={2}><TextField fullWidth size="small" label="City / location" value={filters.location} onChange={updateFilter("location")} /></Grid>
          <Grid item xs={6} md={2}><TextField select fullWidth size="small" label="Mode" value={filters.mode} onChange={updateFilter("mode")}><MenuItem value="">Any mode</MenuItem><MenuItem value="On-site">On-site</MenuItem><MenuItem value="Remote">Remote</MenuItem><MenuItem value="Hybrid">Hybrid</MenuItem></TextField></Grid>
          <Grid item xs={6} md={2}><Button type="submit" fullWidth variant="contained">Search</Button></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={filters.date} onChange={updateFilter("date")} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Required skill" value={filters.skill} onChange={updateFilter("skill")} /></Grid>
          <Grid item xs={12} md={2}><Button fullWidth onClick={() => { const cleared = { q: "", category: "", location: "", mode: "", date: "", skill: "" }; setFilters(cleared); loadOpportunities(cleared); }} color="inherit">Clear filters</Button></Grid>
        </Grid></CardContent></Card>
        {opportunities.length ? <Grid container spacing={2}>{opportunities.map((item) => <Grid item xs={12} md={6} lg={4} key={item._id}><OpportunityCard opportunity={item} /></Grid>)}</Grid> : <Alert severity="info">No opportunities match your search. Try changing or clearing the filters.</Alert>}
      </>}
      {user.role === "organization" && dashboard && <>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}><StatCard label="Active opportunities" value={(dashboard.ownOpportunities || []).filter((item) => item.status === "open").length} /></Grid>
          <Grid item xs={12} sm={3}><StatCard label="Pending applications" value={dashboard.pendingApplications} helper="Need your review" /></Grid>
          <Grid item xs={12} sm={3}><StatCard label="Accepted applicants" value={dashboard.acceptedApplications} /></Grid>
          <Grid item xs={12} sm={3}><StatCard label="Rejected applicants" value={dashboard.rejectedApplications} /></Grid>
        </Grid>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5" fontWeight={800}>Your opportunities</Typography><Button component={Link} to="/opportunities/new" variant="contained">New opportunity</Button></Stack>
        {opportunities.length ? <Grid container spacing={2}>{opportunities.map((item) => <Grid item xs={12} md={6} lg={4} key={item._id}><OpportunityCard opportunity={item} organizationView /></Grid>)}</Grid> : <Alert severity="info">You haven’t created an opportunity yet. Create your first one to start receiving applications.</Alert>}
        <Box sx={{ mt: 4 }}><Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Recent applications</Typography>{dashboard.recentApplications?.length ? <Stack spacing={1}>{dashboard.recentApplications.map((application) => <Card key={application._id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}><Box><Typography fontWeight={700}>{application.volunteer?.name || "Volunteer"}</Typography><Typography variant="body2" color="text.secondary">{application.opportunity?.title}</Typography></Box><Chip label={application.status} size="small" color={application.status === "pending" ? "warning" : application.status === "accepted" ? "success" : "default"} /></CardContent></Card>)}</Stack> : <Typography color="text.secondary">No applications yet.</Typography>}</Box>
      </>}
      {user.role === "admin" && dashboard && <>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}><StatCard label="Volunteers" value={dashboard.volunteers} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard label="Organizations" value={dashboard.organizations} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard label="Opportunities" value={dashboard.totalOpportunities} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard label="Open opportunities" value={dashboard.openOpportunities} /></Grid>
        </Grid>
        <Alert severity="info">Use the admin dashboard to view users, deactivate or reactivate accounts, and remove invalid or test opportunities.</Alert>
      </>}
    </>}
  </Box></>;
};

export default DashboardPage;
