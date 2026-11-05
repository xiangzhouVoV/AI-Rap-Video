import { refunds } from "@/content/legal/refunds";
import PolicyContent, { policyMetadata } from "../policy-content";

export const metadata = policyMetadata(refunds);

export default function Page() {
  return <PolicyContent policy={refunds} />;
}
