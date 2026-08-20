export interface Project {
  id: string;
  name: string;
  domain?: string;
  defaultDomain?: string;
  code: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface NewProjectForm {
  name: string;
  domain?: string;
  defaultDomain?: string;
}
