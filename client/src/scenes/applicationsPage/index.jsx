import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import Navbar from "scenes/navbar";
import { apiRequest } from "api";
import { formatDate } from "components/OpportunityCard";
import { useSelector } from "react-redux";

const ApplicationsPage = () => {
  const token = useSelector((state) => state.token);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(() => apiRequest("/api/applications/mine", token).then(setApplications).catch((err) => setError(err.message)), [token]);
  useEffect(() => { load(); }, [load]);
  const withdraw = async (id) => {
    try { await apiRequest(`/api/applications/${id}/withdraw`, token, { method: "PATCH" }); await load(); }
    catch (err) { setError(err.message); }
  };
  return <><Navbar /><Box className="page-wrap">
    <Typography variant="h4" fontWeight={800}>My applications</Typography><Typography color="text.secondary" sx={{ mt: .5, mb: 3 }}>Track your submitted applications and their status.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {applications.length ? <Stack spacing={1.5}>{applications.map((application) => <Card key={application._id} variant="outlined"><CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
      <Box><Typography fontWeight={800}>{application.opportunity?.title || "Opportunity no longer available"}</Typography><Typography variant="body2" color="text.secondary">{application.opportunity?.organizationName || "Organization"} · {application.opportunity?.location || ""}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{formatDate(application.opportunity?.date)} · Applied {formatDate(application.createdAt)}</Typography></Box>
      <Stack direction="row" alignItems="center" spacing={1}><Chip label={application.status} color={application.status === "accepted" ? "success" : application.status === "rejected" ? "error" : application.status === "pending" ? "warning" : "default"} />{application.opportunity?.status && <Chip label={`Opportunity: ${application.opportunity.status}`} variant="outlined" size="small" />}<>{application.status === "pending" && <Button color="warning" onClick={() => withdraw(application._id)}>Withdraw</Button>}{application.opportunity?._id && application.opportunity.status === "open" && <Button component={Link} to={`/opportunities/${application.opportunity._id}`}>View</Button>}</></Stack>
    </CardContent></Card>)}</Stack> : <Alert severity="info">You have not submitted any applications yet. <Button component={Link} to="/home" size="small">Browse opportunities</Button></Alert>}
  </Box></>;
};

export default ApplicationsPage;
