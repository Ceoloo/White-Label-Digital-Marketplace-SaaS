import { notFound } from "next/navigation";
import marketplaceConfig from "@/config/marketplace.config";
import { getServiceRequests } from "@/lib/data/store";
import { aiStatus } from "@/lib/ai";
import { AdminServiceRequests } from "@/components/admin-service-requests";

// Service requests are mutated at runtime; always render the latest.
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  if (!marketplaceConfig.features.aiServices) notFound();
  const requests = await getServiceRequests();
  return <AdminServiceRequests requests={requests} ai={aiStatus()} />;
}
