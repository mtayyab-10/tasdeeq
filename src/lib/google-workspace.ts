import { google } from "googleapis";

const DEFAULT_SHEET_ID =
  process.env.TASDEEQ_SHEET_ID || "1R_dlhlksGfnb3jKu_c1AdgC_8CljR6VfGlWA7cEYF5Q";
const DEFAULT_DRIVE_FOLDER_ID =
  process.env.TASDEEQ_DRIVE_FOLDER_ID || "1zf2Uh0AdnPgRb-G7hxAkQpn_Qwhuk5AV";

function getGoogleAuth(scopes: string[]) {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) return null;

  return new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes,
  });
}

export async function appendAuditRowToSheet(row: string[]): Promise<{ synced: boolean; mode: "live_sheets" | "simulated" }> {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  if (!auth) return { synced: false, mode: "simulated" };

  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: DEFAULT_SHEET_ID,
    range: "Audit Ledger!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return { synced: true, mode: "live_sheets" };
}

export async function listDriveBillPhotos(): Promise<{
  synced: boolean;
  mode: "live_drive" | "simulated";
  files: Array<{ id: string; name: string; mimeType: string; webViewLink?: string | null }>;
}> {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/drive.readonly"]);
  if (!auth) return { synced: false, mode: "simulated", files: [] };

  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.list({
    q: `'${DEFAULT_DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink)",
    pageSize: 20,
  });

  return {
    synced: true,
    mode: "live_drive",
    files: (res.data.files || []).map((f) => ({
      id: f.id || "",
      name: f.name || "Untitled",
      mimeType: f.mimeType || "application/octet-stream",
      webViewLink: f.webViewLink,
    })),
  };
}
