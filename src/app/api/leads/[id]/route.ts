import { NextRequest, NextResponse } from 'next/server';
import { getSheets } from '@/lib/google-sheets';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const leadId = params.id;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
    }

    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Leads!A:E', // Lead ID, Timestamp, Persona, Name, Email
        });

        const rows = response.data.values || [];
        const leadRow = rows.find(row => row[0] === leadId);

        if (!leadRow) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: leadRow[0],
            persona_id: leadRow[2],
            name: leadRow[3],
            email: leadRow[4]
        });
    } catch (error: any) {
        console.error('Lead lookup failed:', error);
        return NextResponse.json({ error: 'Failed to look up lead' }, { status: 500 });
    }
}
