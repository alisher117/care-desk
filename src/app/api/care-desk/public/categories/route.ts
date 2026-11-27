import { categoryService } from "@/care-desk/core";
import '@/care-desk/host/init';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const categories = await categoryService.listRequesterCategories();
    return Response.json(categories.map((c) => ({ name: c.name })));
}