import { google } from "googleapis";
import { HealthLog, ParameterType } from "../types/health";
import dotenv from "dotenv";

dotenv.config();

class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    const keyData = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || "";

    if (!keyData || !this.spreadsheetId) {
      console.warn(
        "[GoogleSheetsService]: Missing credentials or Spreadsheet ID in .env",
      );
      return;
    }

    try {
      // Parse the service account key from the environment variable
      const credentials = JSON.parse(keyData);

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error("[GoogleSheetsService]: Initialization Error:", error);
    }
  }

  /**
   * Appends a health log to the spreadsheet
   */
  async appendLog(log: HealthLog): Promise<void> {
    if (!this.sheets) {
      console.error("[GoogleSheetsService]: Sheets client not initialized");
      return;
    }

    try {
      // Map the log object to a row array
      // Columns: Timestamp, UserID, Type, Value1, Value2, Unit, Notes
      const values = this.mapLogToRow(log);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "Sheet1!A:F", // Adjusted for 6 columns now
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [values],
        },
      });

      console.log(
        `[GoogleSheetsService]: Successfully appended log for ${log.userId} (${log.type})`,
      );
    } catch (error) {
      console.error("[GoogleSheetsService]: Append Error:", error);
      throw new Error("Failed to save data to Google Sheets");
    }
  }

  private mapLogToRow(log: HealthLog): any[] {
    const { timestamp, userId, type, notes = "" } = log;
    let value: string | number = "";
    let unit: string = "";

    switch (log.type) {
      case ParameterType.WEIGHT:
        value = log.weight;
        unit = log.unit;
        break;
      case ParameterType.BLOOD_PRESSURE:
        value = `${log.systolic}/${log.diastolic}`;
        unit = "mmHg";
        break;
      case ParameterType.HEART_RATE:
        value = log.bpm;
        unit = "bpm";
        break;
    }

    // Timestamp | UserID | Type | Value | Unit | Notes
    return [timestamp, userId, type, value, unit, notes];
  }
}

export const googleSheetsService = new GoogleSheetsService();
