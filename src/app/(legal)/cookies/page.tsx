import { cookies } from "@/content/legal/cookies";
import PolicyContent, { policyMetadata } from "../policy-content";

export const metadata = policyMetadata(cookies);

export default function Page() {
  return <PolicyContent policy={cookies} />;
}
