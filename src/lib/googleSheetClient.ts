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

export const MASTER_SHEET_NAME = 'Masterliste';
export const MASTER_RANGE = `${MASTER_SHEET_NAME}!A:W`;
export const MASTER_DATA_RANGE = `${MASTER_SHEET_NAME}!A2:W`;
export const MASTER_ID_RANGE = `${MASTER_SHEET_NAME}!A:A`;

const toSheetBoolean = (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toUpperCase() === 'TRUE';
    return Boolean(value);
};

const tagsToArray = (tags: unknown): string[] => {
    if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
    if (typeof tags === 'string') {
        return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
};

const tagsToCell = (tags: unknown) => tagsToArray(tags).join(',');

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
    is_member: toSheetBoolean(row[4]),
    tags: tagsToArray(row[5]),
    greeting: row[6] || '',
    closing: row[7] || ''
});

export const masterRowToMember = (row: any[]) => ({
    id: row[0] || '',
    first_name: row[1] || '',
    last_name: row[2] || '',
    email: row[3] || undefined,
    is_member: toSheetBoolean(row[4]),
    tags: tagsToArray(row[5]),
    greeting: row[6] || '',
    closing: row[7] || ''
});

export const shouldShowInMailservice = (row: any[]) => {
    const id = row[0];
    const email = row[3];
    const receivesMail = toSheetBoolean(row[8]);
    const status = String(row[9] || '').trim().toLowerCase();
    return Boolean(id && email && receivesMail && status === 'aktiv');
};

export const memberToMasterRow = (member: any) => [
    member.id,
    member.first_name,
    member.last_name,
    member.email || '',
    member.is_member ?? true,
    tagsToCell(member.tags),
    member.greeting || '',
    member.closing || '',
    Boolean(member.email),
    'Aktiv',
    '',
    '',
    '',
    true,
    false,
    tagsToCell(member.tags),
    '',
    '',
    false,
    'Über Mailservice hinzugefügt.',
    '',
    new Date().toISOString().slice(0, 10),
    ''
];
