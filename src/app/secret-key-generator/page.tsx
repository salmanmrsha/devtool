import ToolLayout from "@/components/ToolLayout";
import SecretKeyGenerator from "@/components/tools/SecretKeyGenerator";

export default function SecretKeyGeneratorPage() {
  return (
    <ToolLayout slug="secret-key-generator">
      <SecretKeyGenerator />
    </ToolLayout>
  );
}
