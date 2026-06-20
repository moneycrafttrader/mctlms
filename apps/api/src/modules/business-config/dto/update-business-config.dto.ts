/*
 * DTO for updating the single-row business configuration
 *
 * Why this DTO exists:
 *   - All fields map 1:1 to the business_config table columns.
 *   - Every field is optional so the admin can send only the fields they want to change.
 *   - Strings have sensible minimum lengths to avoid empty values.
 *
 * A junior should know:
 *   - This is for PATCH (partial update), not a full replacement.
 *   - The business_config table has a UNIQUE index on TRUE to enforce single-row.
 *   - See shared-types BusinessConfig interface for the full shape.
 */
import { IsOptional, IsString, MinLength, IsEmail } from 'class-validator';

export class UpdateBusinessConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Business name cannot be empty' })
  businessName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Address line 1 cannot be empty' })
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'City cannot be empty' })
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'State cannot be empty' })
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Pincode cannot be empty' })
  pincode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid business email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  phone?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @IsOptional()
  @IsString()
  receiptPrefix?: string;

  @IsOptional()
  @IsString()
  currentFinancialYear?: string;
}
