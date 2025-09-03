export interface MCPConfig {
  name: string;
  version: string;
  description: string;
  workspaceId: string;
  baseUrl: string;
  supabaseAnonKey: string;
}

export const createMCPConfig = (workspaceId: string): MCPConfig => {
  // Construire l'URL de base de l'application Next.js
  const baseUrl = process.env.NEXTAUTH_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000';
  
  return {
    name: "Documentation MCP Server",
    version: "1.0.0",
    description: "Serveur MCP pour la gestion de la documentation des workspaces",
    workspaceId,
    baseUrl,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
};

export const MCP_TOOLS = {
  CREATE_DOCUMENTATION_FILE: "create_documentation_file",
  FIND_DOCUMENTATION_FOLDER: "find_documentation_folder",
} as const;

export type MCPToolName = typeof MCP_TOOLS[keyof typeof MCP_TOOLS];
