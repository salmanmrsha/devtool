import ToolLayout from "@/components/ToolLayout";
import LoremIpsumGenerator from "@/components/tools/LoremIpsumGenerator";

export default function LoremIpsumGeneratorPage() {
  return (
    <ToolLayout slug="lorem-ipsum-generator">
      <LoremIpsumGenerator />
    </ToolLayout>
  );
}
