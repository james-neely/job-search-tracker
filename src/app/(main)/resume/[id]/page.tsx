import Box from "@mui/material/Box";
import ResumeVersionEditor from "@/components/resume/ResumeVersionEditor";

type PageProps = {
  params: { id: string };
};

export default function ResumeVersionPage({ params }: PageProps) {
  return (
    <Box>
      <ResumeVersionEditor versionId={params.id} />
    </Box>
  );
}
