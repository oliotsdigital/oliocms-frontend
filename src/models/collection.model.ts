export type FieldType = "string" | "number" | "boolean" | "relation";

export interface FieldValidation {
  required?: boolean;
  unique?: boolean;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  target_collection_id?: string;
}

export interface FieldDefinition {
  name: string;
  label?: string;
  type: FieldType;
  validation?: FieldValidation;
}

export interface CollectionSchema {
  id: string;
  tenant_id: string;
  project_id?: string;
  name: string;
  slug: string;
  schema_definition: FieldDefinition[];
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionRecord {
  id: string;
  tenant_id: string;
  project_id?: string;
  collection_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionPayload {
  project_id?: string;
  name: string;
  slug?: string;
  schema_definition: FieldDefinition[];
}


export interface CreateRecordPayload {
  data: Record<string, any>;
}
