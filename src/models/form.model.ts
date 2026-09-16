export type FormFieldType =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "phone"
  | "url";

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  help_text?: string;
  default_value?: any;
}

export interface FormSettings {
  submit_button_text?: string;
  success_message?: string;
  redirect_url?: string;
  notification_email?: string;
  is_active?: boolean;
}

export interface FormSchema {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  slug: string;
  description?: string | null;
  fields: FormField[];
  settings?: FormSettings;
  created_at: string;
  updated_at: string;
}

export interface CreateFormPayload {
  project_id?: string;
  name: string;
  slug?: string;
  description?: string;
  fields?: FormField[];
  settings?: FormSettings;
}

export interface UpdateFormPayload {
  name?: string;
  slug?: string;
  description?: string;
  fields?: FormField[];
  settings?: FormSettings;
}

export interface FormRecord {
  id: string;
  tenant_id?: string;
  project_id?: string;
  form_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface FormRecordsPage {
  data: FormRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface FetchFormRecordsOptions {
  skip?: number;
  limit?: number;
  signal?: AbortSignal;
}

