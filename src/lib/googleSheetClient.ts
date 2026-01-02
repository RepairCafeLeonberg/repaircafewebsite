import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const getAuth = () => {
    const email = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Handle private key: it might differ in format (one line vs newlines) depending on how it's pasted in .env
    // Google keys need real newlines. If they are escaped as \n in .env, we fix them.
    const privateKey = import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
        return null;
    }

    return new google.auth.JWT({
        email,
        key: privateKey,
        scopes: SCOPES,
    });
};

export const getSheetClient = async () => {
    const auth = getAuth();
    if (!auth) return null;

    try {
        await auth.authorize();
        const sheets = google.sheets({ version: 'v4', auth });
        return sheets;
    } catch (error) {
        console.error('Google Sheets Auth Error:', error);
        return null;
    }
};

export const SPREADSHEET_ID = import.meta.env.GOOGLE_SHEET_ID;

// Helper to map our Member object to a row array (order matters!)
// Order: id, first_name, last_name, email, is_member, tags, greeting, closing
export const memberToRow = (member: any) => [
    member.id,
    member.first_name,
    member.last_name,
    member.email || '',
    member.is_member,
    Array.isArray(member.tags) ? member.tags.join(',') : member.tags || '',
    member.greeting || '',
    member.closing || ''
];

// Helper to map a row array to our Member object
export const rowToMember = (row: any[]) => ({
    id: row[0] || '',
    first_name: row[1] || '',
    last_name: row[2] || '',
    email: row[3] || undefined,
    is_member: row[4] === 'TRUE' || row[4] === true || row[4] === 'true', // Sheets might return string "TRUE"
    tags: row[5] ? row[5].split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    greeting: row[6] || '',
    closing: row[7] || ''
});
