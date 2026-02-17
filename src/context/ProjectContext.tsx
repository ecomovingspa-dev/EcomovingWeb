'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Project {
    id: string;
    name: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    updatedAt: string;
}

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    supabase: SupabaseClient;
    addProject: (project: Omit<Project, 'id' | 'updatedAt'>) => void;
    deleteProject: (id: string) => void;
    setActiveProjectId: (id: string) => void;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Cliente por defecto (Ecomoving Original)
    const [supabase, setSupabase] = useState<SupabaseClient>(() => {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    });

    useEffect(() => {
        // Cargar proyectos guardados
        const savedProjects = localStorage.getItem('ecomoving_master_projects');
        const lastActiveId = localStorage.getItem('ecomoving_active_project_id');

        if (savedProjects) {
            const parsed = JSON.parse(savedProjects);
            setProjects(parsed);

            if (lastActiveId) {
                const found = parsed.find((p: Project) => p.id === lastActiveId);
                if (found) {
                    setActiveProject(found);
                    setSupabase(createClient(found.supabaseUrl, found.supabaseAnonKey));
                }
            }
        }
        setIsLoading(false);
    }, []);

    const addProject = (projectData: Omit<Project, 'id' | 'updatedAt'>) => {
        const newProject: Project = {
            ...projectData,
            id: `proj_${Date.now()}`,
            updatedAt: new Date().toISOString()
        };
        const newList = [...projects, newProject];
        setProjects(newList);
        localStorage.setItem('ecomoving_master_projects', JSON.stringify(newList));
    };

    const deleteProject = (id: string) => {
        const newList = projects.filter(p => p.id !== id);
        setProjects(newList);
        localStorage.setItem('ecomoving_master_projects', JSON.stringify(newList));
        if (activeProject?.id === id) {
            setActiveProject(null);
            // Revertir a default env
            setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
        }
    };

    const setActiveProjectId = (id: string) => {
        const project = projects.find(p => p.id === id);
        if (project) {
            setActiveProject(project);
            setSupabase(createClient(project.supabaseUrl, project.supabaseAnonKey));
            localStorage.setItem('ecomoving_active_project_id', id);
        } else if (id === 'default') {
            setActiveProject(null);
            setSupabase(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
            localStorage.removeItem('ecomoving_active_project_id');
        }
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProject,
            supabase,
            addProject,
            deleteProject,
            setActiveProjectId,
            isLoading
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
