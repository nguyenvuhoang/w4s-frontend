import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { ApiSpecDraft } from '@/server/api-manager/store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Simulating file storage
        const draftId = uuidv4();
        const newDraft: ApiSpecDraft = {
            id: draftId,
            title: file.name.replace('.pdf', ''),
            status: 'PENDING',
            sourceType: 'PDF',
            fileName: file.name,
            createdAt: new Date(),
            // Mock file URL, in real world we'd save to disk/cloud
            fileUrl: `/uploads/${draftId}/${file.name}`
        };

        store.drafts.push(newDraft);

        return NextResponse.json(newDraft);
    } catch (error) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
