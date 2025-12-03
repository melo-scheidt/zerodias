
import { Agente, Campanha, User, LibraryDocument } from '../types';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const KEYS = {
  AGENTS: 'op_database_agents_v1',
  CAMPAIGN: 'op_database_campaign_v1',
  USERS: 'op_database_users_v1',
  CREDS: 'op_supabase_creds',
  LIBRARY: 'op_database_library_v1'
};

// Credenciais fornecidas
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  public isOnline: boolean = false;
  private campaignSubscription: RealtimeChannel | null = null;

  constructor() {
      this.initConnection();
  }

  // --- CONNECTION MANAGEMENT ---

  private async initConnection() {
      // 1. Tenta carregar do LocalStorage
      const creds = localStorage.getItem(KEYS.CREDS);
      
      if (creds) {
          const { url, key } = JSON.parse(creds);
          await this.connect(url, key);
      } else {
          // 2. Conexão automática com as chaves padrão (se existirem)
          if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_KEY) {
              console.log("Inicializando conexão padrão com Supabase...");
              await this.connect(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
          }
      }
  }

  public async connectDefault(): Promise<{ success: boolean; error?: string }> {
      if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_KEY) {
          return this.connect(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
      }
      return { success: false, error: "Credenciais Supabase não configuradas." };
  }

  public async connect(url: string, key: string): Promise<{ success: boolean; error?: string }> {
      try {
          if (!url.startsWith('http')) return { success: false, error: "URL inválida." };
          
          const tempClient = createClient(url, key, {
              realtime: {
                  params: {
                      eventsPerSecond: 10,
                  },
              },
          });
          
          // TESTE REAL DE CONEXÃO
          const { error } = await tempClient
              .from('documents')
              .select('id')
              .limit(1);

          if (error) {
              console.error("Erro de conexão Supabase:", error);
              if (error.code === 'PGRST301' || error.message?.includes('does not exist')) {
                  return { success: false, error: "Tabela 'documents' não encontrada." };
              }
              if (error.code === '401' || error.message?.includes('JWT')) {
                  return { success: false, error: "Chave de API inválida." };
              }
              // Tenta prosseguir mesmo com erro, assumindo que pode ser RLS ou tabela vazia
          }

          this.supabase = tempClient;
          localStorage.setItem(KEYS.CREDS, JSON.stringify({ url, key }));
          this.isOnline = true;
          return { success: true };

      } catch (e: any) {
          console.error("Exceção na conexão:", e);
          this.isOnline = false;
          return { success: false, error: "Erro de rede." };
      }
  }

  public disconnect() {
      if (this.campaignSubscription) this.campaignSubscription.unsubscribe();
      this.supabase = null;
      localStorage.removeItem(KEYS.CREDS);
      this.isOnline = false;
  }

  public getStatus(): boolean {
      return this.isOnline;
  }

  // --- REALTIME SUBSCRIPTION ---

  public subscribeToCampaign(campaignId: string, onUpdate: (data: Campanha) => void) {
      if (!this.supabase || !this.isOnline) return;

      // Remove assinatura anterior se existir
      if (this.campaignSubscription) {
          this.supabase.removeChannel(this.campaignSubscription);
      }

      console.log(`[DB] Iniciando escuta Realtime...`);

      // Cria o canal de escuta para UPDATE na tabela documents
      // O filtro id=eq.current_campaign garante que só escutamos a campanha ativa
      this.campaignSubscription = this.supabase
          .channel('campaign_updates')
          .on(
              'postgres_changes',
              {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'documents',
                  filter: 'id=eq.current_campaign' 
              },
              (payload) => {
                  console.log("[DB] Realtime Update Recebido!", payload);
                  if (payload.new && payload.new.data) {
                      onUpdate(payload.new.data as Campanha);
                  }
              }
          )
          .subscribe((status) => {
              console.log("[DB] Status da Conexão Realtime:", status);
          });
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
    
    try {
        localStorage.setItem(KEYS.USERS, JSON.stringify(localUsers));
    } catch (e) {
        console.error("Erro ao salvar usuários localmente (Quota)", e);
    }

    // Cloud
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: user.id,
            collection: 'users',
            data: user
        });
    }
  }

  // --- BACKUP & SYNC ---

  async importDatabase(jsonContent: string): Promise<void> {
      try {
          const data = JSON.parse(jsonContent);
          if (!data || typeof data !== 'object') throw new Error("Formato inválido");

          // 1. Salvar Localmente (Cache)
          localStorage.removeItem(KEYS.AGENTS);
          localStorage.removeItem(KEYS.CAMPAIGN);
          localStorage.removeItem(KEYS.USERS);
          localStorage.removeItem(KEYS.LIBRARY);

          if (data.agents) localStorage.setItem(KEYS.AGENTS, JSON.stringify(data.agents));
          if (data.campaign) localStorage.setItem(KEYS.CAMPAIGN, JSON.stringify(data.campaign));
          if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
          if (data.library) localStorage.setItem(KEYS.LIBRARY, JSON.stringify(data.library));

          // 2. Sincronizar com a Nuvem (Supabase)
          if (this.isOnline && this.supabase) {
              console.log("Iniciando sincronização de backup para a nuvem...");
              await this.syncLocalToCloud(data);
          }
          
      } catch (e) {
          console.error(e);
          throw new Error("Falha ao processar backup.");
      }
  }

  private async syncLocalToCloud(data: any) {
      if (!this.supabase) return;

      const updates = [];

      // Preparar Agentes
      if (Array.isArray(data.agents)) {
          data.agents.forEach((agent: Agente) => {
              updates.push({
                  id: agent.id,
                  collection: 'agents',
                  data: agent
              });
          });
      }

      // Preparar Usuários
      if (Array.isArray(data.users)) {
          data.users.forEach((user: User) => {
              updates.push({
                  id: user.id,
                  collection: 'users',
                  data: user
              });
          });
      }

      // Preparar Biblioteca
      if (Array.isArray(data.library)) {
          data.library.forEach((doc: LibraryDocument) => {
              updates.push({
                  id: doc.id,
                  collection: 'library',
                  data: doc
              });
          });
      }

      // Preparar Campanha
      if (data.campaign) {
          updates.push({
              id: 'current_campaign',
              collection: 'campaign_active',
              data: data.campaign
          });
      }

      // Enviar em Lote (Upsert)
      if (updates.length > 0) {
          const { error } = await this.supabase
              .from('documents')
              .upsert(updates);
          
          if (error) console.error("Erro ao sincronizar backup com Supabase:", error);
          else console.log("Backup sincronizado com sucesso para a nuvem.");
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
    const localAgents = await this.listAgentsLocal();
    const index = localAgents.findIndex(a => a.id === agent.id);
    if (index >= 0) localAgents[index] = agent;
    else localAgents.push(agent);
    
    try {
        localStorage.setItem(KEYS.AGENTS, JSON.stringify(localAgents));
    } catch (e: any) {
        console.warn("Storage Quota Exceeded saving Agents. Attempting to strip heavy images locally.");
        const slimAgents = localAgents.map(a => ({
            ...a,
            imagem: a.imagem && a.imagem.length > 5000 ? '' : a.imagem
        }));
        try {
            localStorage.setItem(KEYS.AGENTS, JSON.stringify(slimAgents));
        } catch (e2) {
            console.error("Critical Storage Error: Failed to save agents locally.", e2);
        }
    }

    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: agent.id,
            collection: 'agents',
            data: agent
        });
    }
  }

  async deleteAgent(id: string): Promise<void> {
    let localAgents = await this.listAgentsLocal();
    localAgents = localAgents.filter(a => a.id !== id);
    localStorage.setItem(KEYS.AGENTS, JSON.stringify(localAgents));

    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').delete().eq('id', id);
    }
  }

  private async listAgentsLocal(): Promise<Agente[]> {
      const data = localStorage.getItem(KEYS.AGENTS);
      return data ? JSON.parse(data) : [];
  }

  // --- CAMPANHA ---

  async getCampaign(): Promise<Campanha | null> {
    if (this.isOnline && this.supabase) {
        try {
            // Importante: No modo single-campaign, usamos ID fixo 'current_campaign' no banco
            const { data } = await this.supabase
                .from('documents')
                .select('data')
                .eq('id', 'current_campaign') 
                .single();
            if (data) return data.data;
        } catch (e) { }
    }
    const data = localStorage.getItem(KEYS.CAMPAIGN);
    return data ? JSON.parse(data) : null;
  }

  async saveCampaign(campaign: Campanha): Promise<void> {
    // Salva Local
    try {
        localStorage.setItem(KEYS.CAMPAIGN, JSON.stringify(campaign));
    } catch (e: any) {
        console.warn("Storage Quota Exceeded for Campaign. Removing heavy map data locally.");
        const slimCampaign = { ...campaign };
        if (slimCampaign.mapState && slimCampaign.mapState.bgImage) {
            slimCampaign.mapState = { ...slimCampaign.mapState, bgImage: null };
        }
        try {
             localStorage.setItem(KEYS.CAMPAIGN, JSON.stringify(slimCampaign));
        } catch (e2) {
             console.error("Critical Storage Error: Failed to save campaign locally.", e2);
        }
    }
    
    // Salva Nuvem (Isso dispara o Realtime para outros)
    if (this.isOnline && this.supabase) {
        await this.supabase.from('documents').upsert({
            id: 'current_campaign', // Forçamos o ID fixo para garantir que todos estejam na mesma "sala"
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

  // --- BIBLIOTECA DE PDFS ---

  async listDocuments(): Promise<LibraryDocument[]> {
    if (this.isOnline && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('documents')
          .select('data')
          .eq('collection', 'library');
        if (!error && data) return data.map((row: any) => row.data);
      } catch (e) {}
    }
    const data = localStorage.getItem(KEYS.LIBRARY);
    return data ? JSON.parse(data) : [];
  }

  async saveDocument(doc: LibraryDocument): Promise<void> {
    const localDocs = await this.listDocumentsLocal();
    localDocs.push(doc);
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(localDocs));

    if (this.isOnline && this.supabase) {
      await this.supabase.from('documents').upsert({
        id: doc.id,
        collection: 'library',
        data: doc
      });
    }
  }

  async deleteDocument(id: string): Promise<void> {
    let localDocs = await this.listDocumentsLocal();
    localDocs = localDocs.filter(d => d.id !== id);
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(localDocs));

    if (this.isOnline && this.supabase) {
      await this.supabase.from('documents').delete().eq('id', id);
    }
  }

  private async listDocumentsLocal(): Promise<LibraryDocument[]> {
    const data = localStorage.getItem(KEYS.LIBRARY);
    return data ? JSON.parse(data) : [];
  }
}

export const db = new DatabaseService();
