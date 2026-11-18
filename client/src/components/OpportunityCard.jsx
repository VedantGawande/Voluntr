import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { Link } from "react-router-dom";

export const formatDate = (value) => {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date to be announced" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const OpportunityCard = ({ opportunity, organizationView = false, onDelete }) => (
  <Card variant="outlined" sx={{ height: "100%", borderColor: "#e4ebe8", transition: "all .15s", "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(30,70,60,.07)" } }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Chip size="small" label={opportunity.category || "General"} sx={{ bgcolor: "#edf5f2", color: "#236b67", fontWeight: 700 }} />
        <Chip size="small" label={opportunity.status || "open"} color={opportunity.status === "open" ? "success" : opportunity.status === "cancelled" ? "error" : "default"} variant="outlined" />
      </Stack>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 2, mb: .5 }}>{opportunity.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{opportunity.organizationName || "Organization"}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42, mb: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{opportunity.description || "No description added yet."}</Typography>
      <Stack spacing={.8} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}><CalendarMonthOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{formatDate(opportunity.date)}</Typography></Stack>
        <Stack direction="row" alignItems="center" gap={1}><LocationOnOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{opportunity.location || "Location to be announced"} · {opportunity.mode || "On-site"}</Typography></Stack>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">{opportunity.availableSlots ?? opportunity.volunteerCount ?? 1} places available</Typography>
        <Stack direction="row" spacing={1}>
          {organizationView && onDelete && <Button size="small" color="error" onClick={() => onDelete(opportunity)}>Remove</Button>}
          <Button component={Link} to={`/opportunities/${opportunity._id}`} size="small" variant="contained">View details</Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

export default OpportunityCard;
