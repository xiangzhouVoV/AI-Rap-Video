import { terms } from "@/content/legal/terms";
import PolicyContent, { policyMetadata } from "../policy-content";

export const metadata = policyMetadata(terms);

export default function Page() {
  return <PolicyContent policy={terms} />;
}
