import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import { apiRequest } from "api";
import { formatDate } from "components/OpportunityCard";
import { useSelector } from "react-redux";

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [introduction, setIntroduction] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const isOwner = user.role === "organization";
  const load = useCallback(async () => {
    try {
      const item = await apiRequest(`/api/opportunities/${id}`, token);
      setOpportunity(item);
      if (isOwner) {
        const list = await apiRequest(`/api/opportunities/${id}/applications`, token);
        setApplications(list);
      } else if (user.role === "volunteer") {
        const list = await apiRequest("/api/applications/mine", token);
        setMyApplication(list.find((application) => application.opportunity?._id === id) || null);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id, token, isOwner, user.role]);

  useEffect(() => { load(); }, [load]);

  const action = async (path, method = "POST", body) => {
    setError(""); setMessage("");
    try {
      const result = await apiRequest(path, token, { method, body: body ? JSON.stringify(body) : undefined });
      setMessage(result.message || "Updated successfully.");
      await load();
    } catch (err) { setError(err.message); }
  };

  const apply = async (event) => {
    event.preventDefault();
    await action(`/api/opportunities/${id}/applications`, "POST", { introduction });
  };

  const review = async (applicationId, status) => action(`/api/applications/${applicationId}/status`, "PATCH", { status });

  const cancelOpportunity = async () => {
    if (!cancelReason.trim()) return setError("Please enter a cancellation reason.");
    await action(`/api/opportunities/${id}/cancel`, "POST", { reason: cancelReason });
    setCancelOpen(false);
  };

  if (loading) return <><Navbar /><Box className="page-wrap" sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box></>;
  if (!opportunity) return <><Navbar /><Box className="page-wrap">{error && <Alert severity="error">{error}</Alert>}<Button onClick={() => navigate(-1)}>Go back</Button></Box></>;

  return <><Navbar /><Box className="page-wrap">
    <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined"><CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap"><Chip label={opportunity.category || "General"} color="primary" variant="outlined" /><Chip label={opportunity.status} color={opportunity.status === "open" ? "success" : opportunity.status === "cancelled" ? "error" : "default"} /></Stack>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 2 }}>{opportunity.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: .5 }}>{opportunity.organizationName}</Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>About this opportunity</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{opportunity.description || "No description provided."}</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ mt: 3, mb: 1 }}>Required skills</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">{opportunity.requiredSkills?.length ? opportunity.requiredSkills.map((skill) => <Chip key={skill} label={skill} size="small" />) : <Typography color="text.secondary">No specific skills listed.</Typography>}</Stack>
          {opportunity.organization?.organizationProfile && <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f8f6", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>About the organization</Typography>
            <Typography fontWeight={700}>{opportunity.organization.organizationProfile.organizationName || opportunity.organization.name || opportunity.organizationName}</Typography>
            {opportunity.organization.organizationProfile.description && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{opportunity.organization.organizationProfile.description}</Typography>}
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{[opportunity.organization.organizationProfile.category, opportunity.organization.organizationProfile.city].filter(Boolean).join(" · ")}</Typography>
            {opportunity.organization.organizationProfile.website && <Typography variant="body2" sx={{ mt: .5 }}>{opportunity.organization.organizationProfile.website}</Typography>}
          </Box>}
          {opportunity.cancellationReason && <Alert severity="warning" sx={{ mt: 3 }}>Cancellation reason: {opportunity.cancellationReason}</Alert>}
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card variant="outlined"><CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Opportunity details</Typography>
          <Stack spacing={1.5}>
            <Box><Typography variant="caption" color="text.secondary">Date</Typography><Typography fontWeight={600}>{formatDate(opportunity.date)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Schedule</Typography><Typography fontWeight={600}>{[opportunity.startTime, opportunity.endTime].filter(Boolean).join(" – ") || [opportunity.startTime, opportunity.duration].filter(Boolean).join(" · ") || opportunity.duration || "Not specified"}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Location</Typography><Typography fontWeight={600}>{opportunity.location || "Not specified"}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Mode</Typography><Typography fontWeight={600}>{opportunity.mode}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Application deadline</Typography><Typography fontWeight={600}>{formatDate(opportunity.applicationDeadline)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Volunteer places</Typography><Typography fontWeight={600}>{opportunity.volunteerCount}</Typography></Box>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {user.role === "volunteer" && <>
            {myApplication && <Alert severity={myApplication.status === "accepted" ? "success" : myApplication.status === "rejected" ? "error" : "info"} sx={{ mb: 2 }}>Your application status: <b>{myApplication.status}</b></Alert>}
            {!myApplication || ["withdrawn", "rejected"].includes(myApplication.status) ? <Box component="form" onSubmit={apply}>
              <TextField fullWidth multiline minRows={3} label="Why would you like to volunteer? (optional)" value={introduction} onChange={(e) => setIntroduction(e.target.value)} sx={{ mb: 1.5 }} />
              <Button fullWidth type="submit" variant="contained" disabled={opportunity.status !== "open"}>Apply now</Button>
            </Box> : myApplication.status === "pending" ? <Button fullWidth variant="outlined" color="warning" onClick={() => action(`/api/applications/${myApplication._id}/withdraw`, "PATCH")}>Withdraw application</Button> : null}
          </>}
          {isOwner && <Stack spacing={1}>
            <Button component={Link} to={`/opportunities/${id}/edit`} variant="contained">Edit opportunity</Button>
            {opportunity.status === "draft" && <Button variant="outlined" onClick={() => action(`/api/opportunities/${id}/publish`)}>Publish draft</Button>}
            {opportunity.status === "open" && <Button variant="outlined" color="warning" onClick={() => action(`/api/opportunities/${id}/close`)}>Close applications</Button>}
            {!["cancelled"].includes(opportunity.status) && <Button variant="outlined" color="error" onClick={() => setCancelOpen(true)}>Cancel opportunity</Button>}
          </Stack>}
        </CardContent></Card>
      </Grid>
    </Grid>

    {isOwner && <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>Applicants ({applications.length})</Typography>
      {applications.length ? <Stack spacing={1.5}>{applications.map((application) => <Card key={application._id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box><Typography fontWeight={800}>{application.volunteer?.name || "Volunteer"}</Typography><Typography variant="body2" color="text.secondary">{application.volunteer?.email}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{application.introduction || "No introduction provided."}</Typography></Box>
        <Stack direction="row" spacing={1} alignItems="center"><Chip size="small" label={application.status} color={application.status === "accepted" ? "success" : application.status === "rejected" ? "error" : application.status === "pending" ? "warning" : "default"} />{application.status === "pending" && <><Button size="small" variant="contained" onClick={() => review(application._id, "accepted")}>Accept</Button><Button size="small" color="error" onClick={() => review(application._id, "rejected")}>Reject</Button></>}</Stack>
      </CardContent></Card>)}</Stack> : <Alert severity="info">No applications have been submitted yet.</Alert>}
    </Box>}

    <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Cancel opportunity</DialogTitle><DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Volunteers who applied will receive an in-app notification.</Typography><TextField autoFocus fullWidth multiline minRows={3} label="Cancellation reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></DialogContent><DialogActions><Button onClick={() => setCancelOpen(false)}>Go back</Button><Button color="error" variant="contained" onClick={cancelOpportunity}>Confirm cancellation</Button></DialogActions></Dialog>
  </Box></>;
};

export default OpportunityDetailPage;
