import { BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedUser {
  name: string;
  email: string;
  phone?: string;
  courseName?: string;
  batchName?: string;
}

function normalizeRow(row: Record<string, any>): ParsedUser | null {
  const nameKey = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, '') === 'fullname' || k.toLowerCase().trim() === 'name',
  );
  const emailKey = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, '') === 'email' || k.toLowerCase().replace(/[\s_-]/g, '') === 'emailaddress',
  );
  const phoneKey = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, '') === 'phone' || k.toLowerCase().replace(/[\s_-]/g, '') === 'phonenumber' || k.toLowerCase().replace(/[\s_-]/g, '') === 'mobile',
  );
  const courseKey = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, '') === 'coursename' || k.toLowerCase().replace(/[\s_-]/g, '') === 'course',
  );
  const batchKey = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[\s_-]/g, '') === 'batchname' || k.toLowerCase().replace(/[\s_-]/g, '') === 'batch',
  );

  if (!nameKey || !emailKey) {
    return null;
  }

  const name = String(row[nameKey] ?? '').trim();
  const email = String(row[emailKey] ?? '').trim();
  const phone = phoneKey ? String(row[phoneKey] ?? '').trim() : undefined;
  const courseName = courseKey ? String(row[courseKey] ?? '').trim() : undefined;
  const batchName = batchKey ? String(row[batchKey] ?? '').trim() : undefined;

  if (!name || !email) {
    return null;
  }

  return {
    name,
    email,
    phone: phone || undefined,
    courseName: courseName || undefined,
    batchName: batchName || undefined,
  };
}

export function parseUsersFile(
  buffer: Buffer,
  mimetype: string,
): ParsedUser[] {
  let rows: Record<string, any>[] = [];

  if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
    const csvString = buffer.toString('utf-8');
    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    rows = result.data as Record<string, any>[];
  } else if (
    mimetype ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  } else {
    throw new BadRequestException(
      `Unsupported file type: ${mimetype}. Please upload a CSV or .xlsx file.`,
    );
  }

  const users: ParsedUser[] = [];

  for (const row of rows) {
    const normalized = normalizeRow(row);
    if (normalized) {
      users.push(normalized);
    }
  }

  if (users.length === 0) {
    throw new BadRequestException(
      'No valid rows found. Ensure the file has "Name" and "Email" columns.',
    );
  }

  return users;
}
