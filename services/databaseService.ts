
import { Agente, Campanha, User } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const KEYS = {
  AGENTS: 'op_database_agents_v1',
  CAMPAIGN: 'op_database_campaign_v1',
  USERS: 'op_database_users_v1',
  CREDS: 'op_supabase_creds'
};

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  public isOnline: boolean = false;

  constructor() {
      this.initConnection();
  }

  // --- CONNECTION MANAGEMENT ---

  private initConnection() {
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (envUrl && envKey) {
          this.connect(envUrl, envKey);
          return;
      }

      const creds = localStorage.getItem(KEYS.CREDS);
      if (creds) {
          const { url, key } = JSON.parse(creds);
          this.connect(url, key);
      }
  }

  public connect(url: string, key: string) {
      try {
          this.supabase = createClient(url, key);
          localStorage.setItem(KEYS.CREDS, JSON.stringify({ url, key }));
          this.isOnline = true;
      } catch (e) {
          console.error("Falha na conexão Supabase:", e);
          this.isOnline = false;
      }
  }

  public disconnect() {
      this.supabase = null;
      localStorage.removeItem(KEYS.CREDS);
      this.isOnline = false;
  }

  public getStatus(): boolean {
      return this.isOnline;
  }

  // --- AUTH ---

  async register(username: string, password: string, role: string): Promise<User> {
    const users = await this.listUsers();
    if (users.find(u => u.username === username)) {
      throw new Error("Usuário já existe.");
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      role: role as any,
      password // In a real app, this should be hashed
    };

    await this.saveUser(newUser);
    return newUser;
  }

  async login(username: string, password: string): Promise<User> {
    const users = await this.listUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error("Credenciais inválidas.");
    }
    return user;
  }

  async listUsers(): Promise<User[]> {
      if (this.isOnline && this.supabase) {
          try {
              const { data } = await this.supabase
                  .from('documents')
                  .select('data')
                  .eq('collection', 'users');
              if (data && data.length > 0) {
                  return data.map((row: any) => row.data);
              }
          } catch(e) { console.warn("Erro Supabase Auth, fallback local"); }
      }
      return this.listUsersLocal();
  }

  private listUsersLocal(): User[] {
      const data = localStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : [];
  }

  async saveUser(user: User): Promise<void> {
    // Local
    const localUsers = this.listUsersLocal();
    const index = localUsers.findIndex(u => u.id === user.id);
    if (index >= 0) localUsers[index] = user;
    else localUsers.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(localUsers));

    // Cloud
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: user.id,
            collection: 'users',
            data: user
        });
    }
  }

  // --- BACKUP ---

  async importDatabase(jsonContent: string): Promise<void> {
      try {
          const data = JSON.parse(jsonContent);
          
          if (!data || typeof data !== 'object') throw new Error("Formato inválido");

          // Clear current
          localStorage.removeItem(KEYS.AGENTS);
          localStorage.removeItem(KEYS.CAMPAIGN);
          localStorage.removeItem(KEYS.USERS);

          // Restore
          if (data.agents) localStorage.setItem(KEYS.AGENTS, JSON.stringify(data.agents));
          if (data.campaign) localStorage.setItem(KEYS.CAMPAIGN, JSON.stringify(data.campaign));
          if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
          
      } catch (e) {
          throw new Error("Arquivo de backup inválido.");
      }
  }

  // --- AGENTES ---

  async listAgents(): Promise<Agente[]> {
    if (this.isOnline && this.supabase) {
        try {
            const { data, error } = await this.supabase
                .from('documents')
                .select('data')
                .eq('collection', 'agents');
            
            if (!error && data) {
                return data.map((row: any) => row.data);
            }
        } catch(e) { console.warn("Erro Supabase, fallback local"); }
    }

    // Fallback LocalStorage
    const data = localStorage.getItem(KEYS.AGENTS);
    return data ? JSON.parse(data) : [];
  }

  async saveAgent(agent: Agente): Promise<void> {
    // Save Local First (Always have a local copy)
    const localAgents = await this.listAgentsLocal();
    const index = localAgents.findIndex(a => a.id === agent.id);
    if (index >= 0) localAgents[index] = agent;
    else localAgents.push(agent);
    localStorage.setItem(KEYS.AGENTS, JSON.stringify(localAgents));

    // Save Cloud if connected
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: agent.id,
            collection: 'agents',
            data: agent
        });
    }
  }

  async deleteAgent(id: string): Promise<void> {
    // Delete Local
    let localAgents = await this.listAgentsLocal();
    localAgents = localAgents.filter(a => a.id !== id);
    localStorage.setItem(KEYS.AGENTS, JSON.stringify(localAgents));

    // Delete Cloud
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').delete().eq('id', id);
    }
  }

  // Helper private para pegar do localStorage explicitamente
  private async listAgentsLocal(): Promise<Agente[]> {
      const data = localStorage.getItem(KEYS.AGENTS);
      return data ? JSON.parse(data) : [];
  }

  // --- CAMPANHA ---

  async getCampaign(): Promise<Campanha | null> {
    if (this.isOnline && this.supabase) {
        try {
            const { data } = await this.supabase
                .from('documents')
                .select('data')
                .eq('collection', 'campaign_active')
                .single();
            if (data) return data.data;
        } catch (e) { }
    }
    const data = localStorage.getItem(KEYS.CAMPAIGN);
    return data ? JSON.parse(data) : null;
  }

  async saveCampaign(campaign: Campanha): Promise<void> {
    localStorage.setItem(KEYS.CAMPAIGN, JSON.stringify(campaign));
    
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: 'current_campaign', // Singleton per user context in this simple app
            collection: 'campaign_active',
            data: campaign
        });
    }
  }

  async deleteCampaign(): Promise<void> {
    localStorage.removeItem(KEYS.CAMPAIGN);
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').delete().eq('id', 'current_campaign');
    }
  }
}

export const db = new DatabaseService();