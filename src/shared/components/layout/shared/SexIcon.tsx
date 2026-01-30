import { getDictionary } from "@utils/getDictionary";
import { Box, Typography } from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";

export const SexIcon = ({
  sex,
  dictionary,
}: {
  sex: string | undefined;
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
}) => {
  switch (sex) {
    case "M":
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <MaleIcon sx={{ color: "#1976d2", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#1976d2" }}>
            {dictionary["common"].male}
          </Typography>
        </Box>
      );
    case "F":
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FemaleIcon sx={{ color: "#d81b60", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#d81b60" }}>
            {dictionary["common"].female}
          </Typography>
        </Box>
      );
    case "1":
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <MaleIcon sx={{ color: "#1976d2", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#1976d2" }}>
            {dictionary["common"].male}
          </Typography>
        </Box>
      );
    case "0":
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FemaleIcon sx={{ color: "#d81b60", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#d81b60" }}>
            {dictionary["common"].female}
          </Typography>
        </Box>
      );
    default:
      return null;
  }
};

