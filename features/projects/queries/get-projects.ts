'use server'

import { createClient } from '@/lib/supabase/server';
import { ProjectListItem } from '../components/projects-list';

const CHUNK_SIZE = 500;

export const getProjects = async () => {
  const supabase = await createClient()

  // Revalidate and ensure cookies are refreshed (with proxy in place)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { count: projectCount, error: projectCountError } = await supabase
    .from('Projects_Project')
    .select('*', { count: 'exact', head: true });

  if (projectCountError) throw projectCountError
  const total = projectCount ?? 0
  if (!total) return []

  const { data: clientData, error: clientError } = await supabase
    .from('Projects_ProjectClient')
    .select('*');

  if (clientError) throw clientError;

  const clientById = new Map<string, any>();
  for (const c of clientData ?? []) clientById.set(c.id, c);

  const { data: statusData, error: statusError } = await supabase
    .from('Projects_ProjectStatusUpdate')
    .select('*')
    .order('createdAt', { ascending: true });

  if (statusError) throw statusError

  const latestStatusByProjectId = new Map<string, any>()
  for (const s of statusData ?? []) {
    if (!latestStatusByProjectId.has(s.projectId)) {
      latestStatusByProjectId.set(s.projectId, s) // first one is latest due to DESC
    }
  }

  const projects: ProjectListItem[] = [];
  const chunks = Math.ceil(total / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const from = i * CHUNK_SIZE
    const to = from + CHUNK_SIZE - 1

    const { data: projectData, error: projectError } = await supabase
      .from('Projects_Project')
      .select('*')
      .order('nameLong', { ascending: true })
      .range(from, to);

    if (projectError) {
      console.error(projectError)
      throw projectError
    }

    for (const project of projectData) {
      const client = clientById.get(project.clientId);
      const lastStatus = latestStatusByProjectId.get(project.id);

      const projectItem: ProjectListItem = {
        jobName: project.nameLong,
        clientName: client?.name ?? "Unknown",
        createdAt: project.createdAt,
        updatedAt: lastStatus?.updatedAt ?? project.updatedAt,
      }
      projects.push(projectItem);
    }
  }

  return projects;
}