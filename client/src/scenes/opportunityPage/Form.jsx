import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import { apiRequest } from "api";

const blank = { title: "", description: "", category: "", requiredSkills: "", volunteerCount: 1, date: "", startTime: "", endTime: "", duration: "", location: "", mode: "On-site", applicationDeadline: "" };
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";

const OpportunityFormPage = () => {
  const { id } = useParams();
  const token = useSelector((state) => state.token);
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiRequest(`/api/opportunities/${id}`, token).then((item) => setForm({
      title: item.title || "", description: item.description || "", category: item.category || "", requiredSkills: (item.requiredSkills || []).join(", "),
      volunteerCount: item.volunteerCount || 1, date: dateInput(item.date), startTime: item.startTime || "", endTime: item.endTime || "", duration: item.duration || "", location: item.location || "", mode: item.mode || "On-site", applicationDeadline: dateInput(item.applicationDeadline),
    })).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id, token]);

  const update = (field) => (event) => setForm((old) => ({ ...old, [field]: event.target.value }));
  const save = async (status) => {
    setError("");
    const payload = { ...form, requiredSkills: String(form.requiredSkills).split(",").map((item) => item.trim()).filter(Boolean), volunteerCount: Number(form.volunteerCount), status };
    try {
      const item = await apiRequest(id ? `/api/opportunities/${id}` : "/api/opportunities", token, { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      navigate(`/opportunities/${item._id}`);
    } catch (err) { setError(err.message); }
  };
  const submit = (event) => { event.preventDefault(); save("open"); };
  if (loading) return <><Navbar /><Box className="page-wrap">Loading opportunity…</Box></>;

  return <><Navbar /><Box className="page-wrap">
    <Typography variant="h4" fontWeight={800} sx={{ mb: .5 }}>{id ? "Edit opportunity" : "Create an opportunity"}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Add clear details so volunteers know how they can help.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Card variant="outlined"><CardContent sx={{ p: { xs: 2, md: 3 } }}>
      <form onSubmit={submit}><Grid container spacing={2}>
        <Grid item xs={12} md={8}><TextField fullWidth label="Opportunity title" value={form.title} onChange={update("title")} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Category" value={form.category} onChange={update("category")} /></Grid>
        <Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Description" value={form.description} onChange={update("description")} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Required skills (comma separated)" value={form.requiredSkills} onChange={update("requiredSkills")} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" inputProps={{ min: 1 }} label="Number of volunteers" value={form.volunteerCount} onChange={update("volunteerCount")} /></Grid>
        <Grid item xs={12} md={3}><TextField select fullWidth label="Participation mode" value={form.mode} onChange={update("mode")}><MenuItem value="On-site">On-site</MenuItem><MenuItem value="Remote">Remote</MenuItem><MenuItem value="Hybrid">Hybrid</MenuItem></TextField></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth type="date" label="Opportunity date" InputLabelProps={{ shrink: true }} value={form.date} onChange={update("date")} /></Grid>
        <Grid item xs={6} md={2}><TextField fullWidth type="time" label="Start time" InputLabelProps={{ shrink: true }} value={form.startTime} onChange={update("startTime")} /></Grid>
        <Grid item xs={6} md={2}><TextField fullWidth type="time" label="End time" InputLabelProps={{ shrink: true }} value={form.endTime} onChange={update("endTime")} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Duration (if no end time)" placeholder="e.g. 3 hours" value={form.duration} onChange={update("duration")} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Location / venue" value={form.location} onChange={update("location")} /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth type="date" label="Application deadline" InputLabelProps={{ shrink: true }} value={form.applicationDeadline} onChange={update("applicationDeadline")} /></Grid>
        <Grid item xs={12}><Alert severity="info">You can save an incomplete opportunity as a draft. Publishing requires the title, description, category, date, schedule, location, number of volunteers and a future application deadline.</Alert></Grid>
        <Grid item xs={12}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button type="submit" variant="contained">{id ? "Save and publish" : "Publish opportunity"}</Button>
          <Button variant="outlined" onClick={() => save("draft")}>Save as draft</Button>
          <Button color="inherit" onClick={() => navigate(-1)}>Cancel</Button>
        </Stack></Grid>
      </Grid></form>
    </CardContent></Card>
  </Box></>;
};

export default OpportunityFormPage;
