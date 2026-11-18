import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import Navbar from "scenes/navbar";
import { apiRequest } from "api";
import { useSelector } from "react-redux";

const NotificationsPage = () => {
  const token = useSelector((state) => state.token);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(() => apiRequest("/api/notifications", token).then(setItems).catch((err) => setError(err.message)), [token]);
  useEffect(() => { load(); }, [load]);
  const markRead = async (id) => {
    try { await apiRequest(`/api/notifications/${id}/read`, token, { method: "PATCH" }); await load(); }
    catch (err) { setError(err.message); }
  };
  const markAll = async () => {
    try { await apiRequest("/api/notifications/read-all", token, { method: "PATCH" }); await load(); }
    catch (err) { setError(err.message); }
  };
  return <><Navbar /><Box className="page-wrap">
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}><Box><Typography variant="h4" fontWeight={800}>Notifications</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Updates about applications and opportunities.</Typography></Box><Button onClick={markAll} disabled={!items.some((item) => !item.isRead)}>Mark all read</Button></Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {items.length ? <Stack spacing={1}>{items.map((item) => <Card key={item._id} variant="outlined" sx={{ borderColor: item.isRead ? "#e5ece9" : "#b9d9d2", bgcolor: item.isRead ? "white" : "#f5fbf8" }}><CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Box><Stack direction="row" alignItems="center" spacing={1}><Typography fontWeight={item.isRead ? 500 : 800}>{item.message}</Typography>{!item.isRead && <Chip size="small" color="primary" label="New" />}</Stack><Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString()}</Typography></Box>
      <Stack direction="row" spacing={1} alignItems="center">{item.relatedOpportunity && <Button size="small" component={Link} to={`/opportunities/${item.relatedOpportunity}`}>Open</Button>}{!item.isRead && <Button size="small" onClick={() => markRead(item._id)}>Mark read</Button>}</Stack>
    </CardContent></Card>)}</Stack> : <Alert severity="info">You’re all caught up. New updates will appear here.</Alert>}
  </Box></>;
};

export default NotificationsPage;
