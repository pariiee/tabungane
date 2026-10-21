import ErrorTemplate from "@/components/ErrorTemplate";

export default async function DynamicErrorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ErrorTemplate code={code} />;
}
