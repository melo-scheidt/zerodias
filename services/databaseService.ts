
import { Agente, Campanha, User, LibraryLink } from '../types';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const KEYS = {
  AGENTS: 'op_database_agents_v1',
  CAMPAIGN: 'op_database_campaign_v1',
  USERS: 'op_database_users_v1',
  LIBRARY: 'op_database_library_v1',
  CREDS: 'op_supabase_creds'
};

// Credenciais fornecidas
export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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
          try {
              const { url, key } = JSON.parse(creds);
              await this.connect(url, key);
          } catch (e) {
              console.error("Falha ao carregar credenciais salvas:", e);
          }
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
          
          // TESTE BÁSICO DE CONEXÃO (LEITURA)
          const { error } = await tempClient
              .from('documents')
              .select('id')
              .limit(1);

          if (error) {
              console.error("Erro de conexão Supabase:", error);
              
              // Extração segura da mensagem de erro
              const errorMsg = error.message || error.details || error.hint || JSON.stringify(error);

              if (error.code === 'PGRST301' || errorMsg.includes('does not exist')) {
                  return { success: false, error: "Tabela 'documents' não encontrada. Execute o SQL de configuração." };
              }
              if (error.code === '401' || errorMsg.includes('JWT')) {
                  return { success: false, error: "Chave de API inválida ou expirada." };
              }
              // Ignora erro específico de JSON vazio que as vezes ocorre em redes instáveis, mas alerta outros
              if (!errorMsg.includes('JSON object requested')) {
                 return { success: false, error: errorMsg };
              }
          }

          this.supabase = tempClient;
          localStorage.setItem(KEYS.CREDS, JSON.stringify({ url, key }));
          this.isOnline = true;
          
          // CRIA OS USUÁRIOS PADRÃO (Isadora/Thiago)
          await this.ensureDefaultUsers();

          return { success: true };

      } catch (e: any) {
          console.error("Exceção na conexão:", e);
          this.isOnline = false;
          const safeErrorMsg = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
          return { success: false, error: `Erro de rede ou configuração: ${safeErrorMsg}` };
      }
  }

  // Método de diagnóstico completo para garantir integridade dos dados
  public async testConnectivity(): Promise<{ success: boolean; log: string[] }> {
      if (!this.supabase) return { success: false, log: ["Cliente Supabase não inicializado."] };
      
      const log: string[] = [];
      log.push("Iniciando diagnóstico de integridade...");

      try {
          // 1. Teste de Leitura
          const { data, error: readError } = await this.supabase.from('documents').select('count').limit(1);
          if (readError) throw new Error(`Falha na Leitura: ${readError.message || JSON.stringify(readError)}`);
          log.push("✔ Leitura de dados: OK");

          // 2. Teste de Escrita (Ping)
          const pingId = `ping_${Date.now()}`;
          const { error: writeError } = await this.supabase.from('documents').insert({
              id: pingId,
              collection: 'system_health_check',
              data: { status: 'ok', timestamp: Date.now() }
          });
          if (writeError) throw new Error(`Falha na Escrita: ${writeError.message || JSON.stringify(writeError)} (Verifique RLS)`);
          log.push("✔ Escrita de dados: OK");

          // 3. Teste de Exclusão (Limpeza)
          const { error: deleteError } = await this.supabase.from('documents').delete().eq('id', pingId);
          if (deleteError) throw new Error(`Falha na Exclusão: ${deleteError.message || JSON.stringify(deleteError)}`);
          log.push("✔ Permissões de exclusão: OK");
          
          log.push("✔ DIAGNÓSTICO CONCLUÍDO: Conexão Estável.");
          return { success: true, log };

      } catch (e: any) {
          const safeErrorMsg = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
          log.push(`❌ ERRO CRÍTICO: ${safeErrorMsg}`);
          return { success: false, log };
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

      if (this.campaignSubscription) {
          this.supabase.removeChannel(this.campaignSubscription);
      }

      console.log(`[DB] Iniciando escuta Realtime para: ${campaignId}`);

      this.campaignSubscription = this.supabase
          .channel('campaign_updates')
          .on(
              'postgres_changes',
              {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'documents',
                  filter: `id=eq.${campaignId}` 
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

  // Método para garantir que contas essenciais existam
  private async ensureDefaultUsers() {
      const users = await this.listUsers();
      
      // 1. Garante a conta 'isadora'
      if (!users.find(u => u.username.toLowerCase() === 'isadora')) {
          const isadora: User = {
              id: 'user_isadora_01',
              username: 'isadora',
              password: '3040',
              role: 'player'
          };
          await this.saveUser(isadora);
          console.log("Conta 'isadora' criada com sucesso.");
      }

      // 2. Garante a conta 'Thiago' (Admin)
      if (!users.find(u => u.username === 'Thiago')) {
           const thiago: User = {
              id: 'user_thiago_admin',
              username: 'Thiago',
              password: '123', // Senha padrão caso precise logar manualmente
              role: 'admin'
           };
           await this.saveUser(thiago);
           console.log("Conta 'Thiago' (Admin) criada com sucesso.");
      }
  }

  async register(username: string, password: string, role: string): Promise<User> {
    const users = await this.listUsers();
    if (users.find(u => u.username === username)) {
      throw new Error("Usuário já existe.");
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      role: role as any,
      password 
    };

    await this.saveUser(newUser);
    return newUser;
  }

  async login(username: string, password: string): Promise<User> {
    const users = await this.listUsers();
    // Busca case-insensitive para o username
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
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

      // Preparar Library
      if (Array.isArray(data.library)) {
          data.library.forEach((link: LibraryLink) => {
              updates.push({
                  id: link.id,
                  collection: 'library',
                  data: link
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

  // --- LIBRARY (Links) ---
  
  async listLibraryLinks(): Promise<LibraryLink[]> {
      if (this.isOnline && this.supabase) {
          try {
              const { data, error } = await this.supabase
                  .from('documents')
                  .select('data')
                  .eq('collection', 'library');
              
              if (!error && data) {
                  return data.map((row: any) => row.data);
              }
          } catch(e) { console.warn("Erro Supabase Library, fallback local"); }
      }
      
      const data = localStorage.getItem(KEYS.LIBRARY);
      return data ? JSON.parse(data) : [];
  }

  async saveLibraryLink(link: LibraryLink): Promise<void> {
      // Local
      const localLinks = await this.listLibraryLinks();
      const index = localLinks.findIndex(l => l.id === link.id);
      if (index >= 0) localLinks[index] = link;
      else localLinks.push(link);
      localStorage.setItem(KEYS.LIBRARY, JSON.stringify(localLinks));

      // Cloud
      if (this.isOnline && this.supabase) {
          await this.supabase.from('documents').upsert({
              id: link.id,
              collection: 'library',
              data: link
          });
      }
  }

  async deleteLibraryLink(id: string): Promise<void> {
      let localLinks = await this.listLibraryLinks();
      localLinks = localLinks.filter(l => l.id !== id);
      localStorage.setItem(KEYS.LIBRARY, JSON.stringify(localLinks));

      if (this.isOnline && this.supabase) {
          await this.supabase.from('documents').delete().eq('id', id);
      }
  }

  async clearLibrary(): Promise<void> {
      // Limpa Local
      localStorage.setItem(KEYS.LIBRARY, JSON.stringify([]));

      // Limpa Nuvem
      if (this.isOnline && this.supabase) {
          await this.supabase
            .from('documents')
            .delete()
            .eq('collection', 'library');
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
    // 1. Tenta buscar no Supabase (Nuvem)
    if (this.isOnline && this.supabase) {
        try {
            const { data } = await this.supabase
                .from('documents')
                .select('data')
                .eq('id', 'current_campaign') 
                .single();
            if (data) return data.data;
        } catch (e) { }
    }
    
    // 2. Tenta buscar no LocalStorage, mas SÓ retorna se o ID for 'current_campaign'
    const data = localStorage.getItem(KEYS.CAMPAIGN);
    const parsed = data ? JSON.parse(data) : null;
    
    // FILTRO DE SEGURANÇA:
    // Se a campanha local não tiver o ID oficial, ignoramos (retorna null).
    // Isso evita carregar "Lixo" de testes anteriores ou outras missões.
    if (parsed && parsed.id === 'current_campaign') {
        return parsed;
    }

    return null;
  }

  async saveCampaign(campaign: Campanha): Promise<void> {
    // Força o ID para garantir consistência
    campaign.id = 'current_campaign';

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
            id: 'current_campaign',
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
