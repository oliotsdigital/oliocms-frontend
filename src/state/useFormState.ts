"use client";

import { useState, useEffect, useCallback } from "react";
import { FormSchema, FormField, FormSettings } from "@/models/form.model";
import {
  fetchFormsApi,
  createFormApi,
  updateFormApi,
  deleteFormApi,
} from "@/api/form.api";

export function useFormState(
  projectId?: string,
  showToast?: (msg: string, type?: "success" | "error" | "info") => void
) {
  const notify = useCallback(
    (type: "success" | "error" | "info", msg: string) => {
      if (showToast) showToast(msg, type);
    },
    [showToast]
  );
  const storageKey = `oliocms_forms_${projectId || "default"}`;
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [activeFormId, setActiveFormId] = useState<string>("");
  const [activeForm, setActiveForm] = useState<FormSchema | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load forms from backend API with localStorage backup
  const loadForms = useCallback(async () => {
    setIsLoading(true);
    try {
      let apiForms: FormSchema[] = [];
      if (projectId) {
        apiForms = await fetchFormsApi(projectId);
      }

      if (apiForms && apiForms.length > 0) {
        setForms(apiForms);
        setActiveFormId(apiForms[0].id);
        setActiveForm(JSON.parse(JSON.stringify(apiForms[0])));
        try {
          localStorage.setItem(storageKey, JSON.stringify(apiForms));
        } catch (_) {}
      } else {
        // Check local storage fallback if empty or offline
        const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
        if (stored) {
          try {
            const parsed: FormSchema[] = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setForms(parsed);
              setActiveFormId(parsed[0].id);
              setActiveForm(JSON.parse(JSON.stringify(parsed[0])));
            } else {
              setForms([]);
              setActiveForm(null);
            }
          } catch (_) {
            setForms([]);
            setActiveForm(null);
          }
        } else {
          setForms([]);
          setActiveForm(null);
        }
      }
    } catch (err) {
      console.error("Error loading forms:", err);
      notify("error", "Failed to load forms from backend");
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
      setIsDirty(false);
    }
  }, [projectId, storageKey, notify]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Select a form
  const selectForm = useCallback(
    (id: string) => {
      const found = forms.find((f) => f.id === id);
      if (found) {
        setActiveFormId(found.id);
        setActiveForm(JSON.parse(JSON.stringify(found)));
        setIsDirty(false);
      }
    },
    [forms]
  );

  // Create new form
  const createForm = async (name: string, description?: string) => {
    try {
      const created = await createFormApi({
        name,
        description,
        project_id: projectId,
        fields: [
          {
            id: `field_${Date.now()}_1`,
            name: "full_name",
            label: "Full Name",
            type: "text",
            placeholder: "e.g. Jane Doe",
            required: true,
          },
          {
            id: `field_${Date.now()}_2`,
            name: "email",
            label: "Email Address",
            type: "email",
            placeholder: "e.g. jane@example.com",
            required: true,
          },
          {
            id: `field_${Date.now()}_3`,
            name: "message",
            label: "Message",
            type: "textarea",
            placeholder: "Type your message here...",
            required: false,
          },
        ],
        settings: {
          submit_button_text: "Submit",
          success_message: "Thank you! Your response has been recorded.",
          is_active: true,
        },
      });

      const updatedForms = [created, ...forms];
      setForms(updatedForms);
      setActiveFormId(created.id);
      setActiveForm(JSON.parse(JSON.stringify(created)));
      setIsDirty(false);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedForms));
      } catch (_) {}
      notify("success", `Form "${created.name}" created successfully.`);
      return created;
    } catch (err: any) {
      notify("error", err.message || "Failed to create form.");
      throw err;
    }
  };

  // Update form metadata (name, description, settings)
  const updateActiveFormMeta = (updates: {
    name?: string;
    description?: string;
    settings?: Partial<FormSettings>;
  }) => {
    if (!activeForm) return;
    setActiveForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name: updates.name !== undefined ? updates.name : prev.name,
        description: updates.description !== undefined ? updates.description : prev.description,
        settings: {
          ...prev.settings,
          ...(updates.settings || {}),
        },
      };
    });
    setIsDirty(true);
  };

  // Add field to active form
  const addField = (fieldData: Omit<FormField, "id">) => {
    if (!activeForm) return;
    const newField: FormField = {
      ...fieldData,
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setActiveForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: [...prev.fields, newField],
      };
    });
    setIsDirty(true);
    notify("info", `Field "${newField.label}" added.`);
  };

  // Update existing field
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!activeForm) return;
    setActiveForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
      };
    });
    setIsDirty(true);
  };

  // Remove field
  const removeField = (fieldId: string) => {
    if (!activeForm) return;
    setActiveForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.filter((f) => f.id !== fieldId),
      };
    });
    setIsDirty(true);
  };

  // Move field order (up or down)
  const moveField = (fromIndex: number, toIndex: number) => {
    if (!activeForm) return;
    if (fromIndex < 0 || fromIndex >= activeForm.fields.length) return;
    if (toIndex < 0 || toIndex >= activeForm.fields.length) return;

    setActiveForm((prev) => {
      if (!prev) return prev;
      const reordered = [...prev.fields];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return {
        ...prev,
        fields: reordered,
      };
    });
    setIsDirty(true);
  };

  // Save changes to backend
  const saveForm = async () => {
    if (!activeForm) return;
    try {
      const updated = await updateFormApi(
        activeForm.id,
        {
          name: activeForm.name,
          slug: activeForm.slug,
          description: activeForm.description || undefined,
          fields: activeForm.fields,
          settings: activeForm.settings,
        },
        projectId
      );

      const nextForms = forms.map((f) => (f.id === updated.id ? updated : f));
      setForms(nextForms);
      setActiveForm(JSON.parse(JSON.stringify(updated)));
      setIsDirty(false);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextForms));
      } catch (_) {}
      notify("success", "Form saved successfully!");
    } catch (err: any) {
      notify("error", err.message || "Failed to save form.");
    }
  };

  // Delete active or specified form
  const deleteForm = async (formId: string) => {
    try {
      await deleteFormApi(formId, projectId);
      const remaining = forms.filter((f) => f.id !== formId);
      setForms(remaining);
      if (activeFormId === formId) {
        if (remaining.length > 0) {
          setActiveFormId(remaining[0].id);
          setActiveForm(JSON.parse(JSON.stringify(remaining[0])));
        } else {
          setActiveFormId("");
          setActiveForm(null);
        }
      }
      setIsDirty(false);
      try {
        localStorage.setItem(storageKey, JSON.stringify(remaining));
      } catch (_) {}
      notify("success", "Form deleted successfully.");
    } catch (err: any) {
      notify("error", err.message || "Failed to delete form.");
    }
  };

  return {
    forms,
    activeForm,
    activeFormId,
    isDirty,
    isLoading,
    isLoaded,
    selectForm,
    createForm,
    updateActiveFormMeta,
    addField,
    updateField,
    removeField,
    moveField,
    saveForm,
    deleteForm,
    refreshForms: loadForms,
  };
}
