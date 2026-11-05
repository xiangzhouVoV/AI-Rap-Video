import { privacy } from "@/content/legal/privacy";
import PolicyContent, { policyMetadata } from "../policy-content";

export const metadata = policyMetadata(privacy);

export default function Page() {
  return <PolicyContent policy={privacy} />;
}
