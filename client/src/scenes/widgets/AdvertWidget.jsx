import { Typography, useTheme } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import API_URL from "api";

const AdvertWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;

  return (
    <WidgetWrapper>
      <FlexBetween>
        <Typography color={dark} variant="h5" fontWeight="500">
          Did you know ?
        </Typography>
      </FlexBetween>
      <img
        width="100%"
        height="auto"
        alt="advert"
        src={`${API_URL}/assets/world_ngo_day.jpg`}
        style={{ borderRadius: "0.75rem", margin: "0.75rem 0" }}
      />
      <FlexBetween>
      </FlexBetween>
      <Typography color={medium} m="0.5rem 0">
        World NGO day serves as a global platform to acknowledge the tireless efforts of NGOs in shaping our world
      </Typography>
    </WidgetWrapper>
  );
};

export default AdvertWidget;
