import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import ResumeVersionEditor from "@/components/resume/ResumeVersionEditor";

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ResumeBuilderPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id) {
    return <Alert severity="error">Missing resume id.</Alert>;
  }

  return (
    <Box>
      <ResumeVersionEditor versionId={id} />
    </Box>
  );
}
