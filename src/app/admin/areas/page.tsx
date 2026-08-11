import { listAreas } from "./actions";
import { AreasManager } from "./areas-manager";

export default async function AdminAreasPage() {
	const result = await listAreas();
	const areas = result.ok ? result.data : [];
	return <AreasManager initialAreas={areas} />;
}
