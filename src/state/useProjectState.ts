"use client";

import { useState, useEffect } from "react";
import { Project, NewProjectForm } from "@/models/project.model";
import {
  fetchProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from "@/api/project.api";
import { logger } from "@/utils/logger";

export function useProjectState(showToast?: (msg: string, type?: "success" | "error" | "info") => void) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProjects = async () => {
    setIsLoading(true);
    const data = await fetchProjectsApi();
    setProjects(data);
    if (data && data.length > 0) {
      const savedId = typeof window !== "undefined" ? localStorage.getItem("selected_project_id") : null;
      const matched = data.find((p) => p.id === savedId) || data[0];
      setSelectedProject(matched);
      logger.info(`Active project loaded: "${matched.name}" (id: ${matched.id})`);
    } else {
      setSelectedProject(null);
      logger.info("No projects found in database.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const selectProject = (project: Project) => {
    logger.info(`User switched active project to: "${project.name}" (id: ${project.id})`);
    setSelectedProject(project);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", project.id);
    }
    if (showToast) {
      showToast(`Switched project to: ${project.name}`, "info");
    }
  };

  const addProject = async (form: NewProjectForm) => {
    logger.info(`User requested creating project: "${form.name}"`);
    setIsLoading(true);
    const { project, error } = await createProjectApi(form);
    setProjects((prev) => [...prev, project]);
    selectProject(project);
    setIsLoading(false);

    if (showToast) {
      if (error) {
        showToast(`Project "${project.name}" added (${error})`, "info");
      } else {
        showToast(`Project "${project.name}" created successfully via API!`, "success");
      }
    }
    return project;
  };

  const updateProject = async (
    id: string,
    data: { name?: string; domain?: string; defaultDomain?: string }
  ) => {
    logger.info(`Updating project ${id}`);
    setIsLoading(true);
    const res = await updateProjectApi(id, data);
    if (res.project) {
      const updatedProj = res.project;
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProj : p)));
      if (selectedProject?.id === id) {
        setSelectedProject(updatedProj);
      }
      if (showToast) showToast(`Project "${updatedProj.name}" updated successfully!`, "success");
    } else if (res.error && showToast) {
      showToast(res.error, "error");
    }
    setIsLoading(false);
    return res;
  };

  const deleteProject = async (id: string) => {
    logger.info(`Deleting project ${id}`);
    setIsLoading(true);
    const res = await deleteProjectApi(id);
    if (res.success) {
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        if (selectedProject?.id === id) {
          const nextSelected = remaining[0] || null;
          setSelectedProject(nextSelected);
          if (nextSelected && typeof window !== "undefined") {
            localStorage.setItem("selected_project_id", nextSelected.id);
          }
        }
        return remaining;
      });
      if (showToast) showToast("Project deleted successfully!", "success");
    } else if (res.error && showToast) {
      showToast(res.error, "error");
    }
    setIsLoading(false);
    return res;
  };

  return {
    projects,
    selectedProject,
    selectProject,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
    isLoading,
  };
}
