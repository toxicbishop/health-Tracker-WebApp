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

    // Return a clean 6-column layout:
    // Timestamp | UserID | Type | Value | Unit | Notes
    return [timestamp, userId, type, value, unit, notes];
  }

  /**
   * Auth Methods
   */
  async getUserByUsername(username: string): Promise<any | null> {
    if (!this.sheets) return null;

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Users!A:C",
      });

      const rows = response.data.values || [];
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[1] === username) {
          return { userId: row[0], username: row[1], passwordHash: row[2] };
        }
      }
      return null;
    } catch (error: any) {
      // If the sheet "Users" doesn't exist, it throws a 400 error. Let's return null.
      if (error?.code === 400) {
        return null; // Sheet likely doesn't exist yet
      }
      throw error;
    }
  }

  async createUser(
    userId: string,
    username: string,
    passwordHash: string,
  ): Promise<void> {
    if (!this.sheets) return;

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "Users!A:C",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[userId, username, passwordHash]],
        },
      });
      console.log(
        `[GoogleSheetsService]: Successfully created user ${username}`,
      );
    } catch (error) {
      console.error("[GoogleSheetsService]: User Creation Error:", error);
      throw new Error("Failed to save user data to Google Sheets");
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
