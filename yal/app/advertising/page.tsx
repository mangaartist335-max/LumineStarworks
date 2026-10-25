import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Advertising" };

export default function AdvertisingPage() {
  return (
    <InfoPage title="Advertising">
      <p className="mt-0">YAL keeps advertising light so pages stay fast and readable. Banner placements are limited to the sidebar.</p>
      <p>Advertising enquiries are not being accepted in this archived copy of the site.</p>
    </InfoPage>
  );
}
