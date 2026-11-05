import CruiseDancePage, { cruiseMetadata } from "../cruise-dance-page";

export const metadata = cruiseMetadata(4);

export default function Page() {
  return <CruiseDancePage version={4} />;
}
