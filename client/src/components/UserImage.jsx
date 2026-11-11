import { Box } from "@mui/material";
import API_URL from "../api";

const UserImage = ({ image, size = "60px" }) => {
  return (
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
        src={image ? `${API_URL}/assets/${image}` : undefined}
      />
    </Box>
  );
};

export default UserImage;
