"use client";

import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";

interface CoverLetterSettingsSectionProps {
  settings: Record<string, string>;
  onChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CoverLetterSettingsSection({
  settings,
  onChange,
}: CoverLetterSettingsSectionProps) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Cover Letter Defaults
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Used by AI to generate properly formatted cover letters with your contact info.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Address Line 1"
            placeholder="123 Main St"
            value={settings.address_line1 || ""}
            onChange={onChange("address_line1")}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Address Line 2"
            placeholder="Austin, TX 78701"
            value={settings.address_line2 || ""}
            onChange={onChange("address_line2")}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Custom Closing Paragraph"
            placeholder="I look forward to discussing this opportunity with you..."
            value={settings.cover_letter_footer || ""}
            onChange={onChange("cover_letter_footer")}
            fullWidth
            multiline
            rows={3}
            helperText="Appears before the sign-off (e.g. 'Sincerely,'). Leave blank to let AI write the closing."
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
