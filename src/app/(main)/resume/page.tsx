"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ResumeLibrary from "@/components/resume/ResumeLibrary";

export default function ResumePage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Resume
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your resume library, create new versions, and open a specific resume builder by UUID.
      </Typography>
      <ResumeLibrary />
    </Box>
  );
}
