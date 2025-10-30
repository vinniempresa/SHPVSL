import { 
  users, type User, type InsertUser,
  candidates, type Candidate, type InsertCandidate,
  states, type State, type InsertState,
  benefits, type Benefit, type InsertBenefit,
  bannedIps, type BannedIp, type InsertBannedIp,
  allowedDomains, type AllowedDomain, type InsertAllowedDomain,
  bannedDevices, type BannedDevice, type InsertBannedDevice,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  notificationHistory, type NotificationHistory, type InsertNotificationHistory,
  appUsers, type AppUser, type InsertAppUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Candidate operations
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getAllCandidates(): Promise<Candidate[]>;
  
  // State operations
  getState(code: string): Promise<State | undefined>;
  getAllStates(): Promise<State[]>;
  getStatesWithVacancies(): Promise<State[]>;
  createState(state: InsertState): Promise<State>;
  
  // Benefit operations
  getBenefit(id: number): Promise<Benefit | undefined>;
  getAllBenefits(): Promise<Benefit[]>;
  createBenefit(benefit: InsertBenefit): Promise<Benefit>;
  
  // Banned IP operations
  getBannedIp(ip: string): Promise<BannedIp | undefined>;
  getAllBannedIps(): Promise<BannedIp[]>;
  createBannedIp(bannedIp: InsertBannedIp): Promise<BannedIp>;
  updateBannedIpStatus(ip: string, isBanned: boolean): Promise<BannedIp | undefined>;
  updateLastAccess(ip: string): Promise<void>;
  
  // Banned Device operations
  getBannedDevice(deviceId: string): Promise<BannedDevice | undefined>;
  getAllBannedDevices(): Promise<BannedDevice[]>;
  createBannedDevice(device: InsertBannedDevice): Promise<BannedDevice>;
  isBannedByDeviceId(deviceId: string): Promise<boolean>;
  
  // Allowed Domain operations
  getAllowedDomain(domain: string): Promise<AllowedDomain | undefined>;
  getAllAllowedDomains(): Promise<AllowedDomain[]>;
  createAllowedDomain(allowedDomain: InsertAllowedDomain): Promise<AllowedDomain>;
  updateAllowedDomainStatus(domain: string, isActive: boolean): Promise<AllowedDomain | undefined>;
  
  // App User operations
  getAppUserByCpf(cpf: string): Promise<AppUser | undefined>;
  createAppUser(appUser: InsertAppUser): Promise<AppUser>;
  updateAppUser(cpf: string, updates: Partial<InsertAppUser>): Promise<AppUser | undefined>;
  upsertAppUser(appUser: InsertAppUser): Promise<AppUser>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate || undefined;
  }
  
  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
    return candidate || undefined;
  }
  
  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db
      .insert(candidates)
      .values(insertCandidate)
      .returning();
    return candidate;
  }
  
  async getAllCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }
  
  // State operations
  async getState(code: string): Promise<State | undefined> {
    const [state] = await db.select().from(states).where(eq(states.code, code));
    return state || undefined;
  }
  
  async getAllStates(): Promise<State[]> {
    return await db.select().from(states);
  }
  
  async getStatesWithVacancies(): Promise<State[]> {
    return await db.select().from(states).where(eq(states.hasVacancies, true));
  }
  
  async createState(insertState: InsertState): Promise<State> {
    const [state] = await db
      .insert(states)
      .values(insertState)
      .returning();
    return state;
  }
  
  // Benefit operations
  async getBenefit(id: number): Promise<Benefit | undefined> {
    const [benefit] = await db.select().from(benefits).where(eq(benefits.id, id));
    return benefit || undefined;
  }
  
  async getAllBenefits(): Promise<Benefit[]> {
    return await db.select().from(benefits);
  }
  
  async createBenefit(insertBenefit: InsertBenefit): Promise<Benefit> {
    const [benefit] = await db
      .insert(benefits)
      .values(insertBenefit)
      .returning();
    return benefit;
  }
  
  // Banned IP operations
  async getBannedIp(ip: string): Promise<BannedIp | undefined> {
    const [bannedIp] = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip));
    return bannedIp || undefined;
  }
  
  async getAllBannedIps(): Promise<BannedIp[]> {
    return await db.select().from(bannedIps);
  }
  
  async createBannedIp(insertBannedIp: InsertBannedIp): Promise<BannedIp> {
    const [bannedIp] = await db
      .insert(bannedIps)
      .values(insertBannedIp)
      .returning();
    return bannedIp;
  }
  
  async updateBannedIpStatus(ip: string, isBanned: boolean): Promise<BannedIp | undefined> {
    try {
      const [updatedIp] = await db
        .update(bannedIps)
        .set({ 
          isBanned, 
          updatedAt: new Date() 
        })
        .where(eq(bannedIps.ip, ip))
        .returning();
      return updatedIp || undefined;
    } catch (error) {
      console.error('Erro ao atualizar status do IP banido:', error);
      return undefined;
    }
  }
  
  async updateLastAccess(ip: string): Promise<void> {
    try {
      await db
        .update(bannedIps)
        .set({
          lastAccessAttempt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(bannedIps.ip, ip));
    } catch (error) {
      console.error('Erro ao atualizar último acesso do IP:', error);
    }
  }
  
  // Banned Device operations
  async getBannedDevice(deviceId: string): Promise<BannedDevice | undefined> {
    const [bannedDevice] = await db.select().from(bannedDevices).where(eq(bannedDevices.deviceId, deviceId));
    return bannedDevice || undefined;
  }
  
  async getAllBannedDevices(): Promise<BannedDevice[]> {
    return await db.select().from(bannedDevices);
  }
  
  async createBannedDevice(insertBannedDevice: InsertBannedDevice): Promise<BannedDevice> {
    const [bannedDevice] = await db
      .insert(bannedDevices)
      .values(insertBannedDevice)
      .returning();
    return bannedDevice;
  }
  
  async isBannedByDeviceId(deviceId: string): Promise<boolean> {
    const device = await this.getBannedDevice(deviceId);
    return !!device && device.isBanned;
  }
  
  // Allowed Domain operations
  async getAllowedDomain(domain: string): Promise<AllowedDomain | undefined> {
    const [allowedDomain] = await db.select().from(allowedDomains).where(eq(allowedDomains.domain, domain));
    return allowedDomain || undefined;
  }
  
  async getAllAllowedDomains(): Promise<AllowedDomain[]> {
    return await db.select().from(allowedDomains);
  }
  
  async createAllowedDomain(insertAllowedDomain: InsertAllowedDomain): Promise<AllowedDomain> {
    const [allowedDomain] = await db
      .insert(allowedDomains)
      .values(insertAllowedDomain)
      .returning();
    return allowedDomain;
  }
  
  async updateAllowedDomainStatus(domain: string, isActive: boolean): Promise<AllowedDomain | undefined> {
    try {
      const [updatedDomain] = await db
        .update(allowedDomains)
        .set({ 
          isActive, 
          updatedAt: new Date() 
        })
        .where(eq(allowedDomains.domain, domain))
        .returning();
      return updatedDomain || undefined;
    } catch (error) {
      console.error('Erro ao atualizar status do domínio permitido:', error);
      return undefined;
    }
  }
  
  // App User operations
  async getAppUserByCpf(cpf: string): Promise<AppUser | undefined> {
    const [appUser] = await db.select().from(appUsers).where(eq(appUsers.cpf, cpf));
    return appUser || undefined;
  }
  
  async createAppUser(insertAppUser: InsertAppUser): Promise<AppUser> {
    const [appUser] = await db
      .insert(appUsers)
      .values(insertAppUser)
      .returning();
    return appUser;
  }
  
  async updateAppUser(cpf: string, updates: Partial<InsertAppUser>): Promise<AppUser | undefined> {
    try {
      const [updatedUser] = await db
        .update(appUsers)
        .set({ 
          ...updates, 
          updatedAt: new Date() 
        })
        .where(eq(appUsers.cpf, cpf))
        .returning();
      return updatedUser || undefined;
    } catch (error) {
      console.error('Erro ao atualizar usuário do app:', error);
      return undefined;
    }
  }
  
  async upsertAppUser(insertAppUser: InsertAppUser): Promise<AppUser> {
    const existingUser = await this.getAppUserByCpf(insertAppUser.cpf);
    
    if (existingUser) {
      // Se o usuário já existe, atualizar os dados
      const updatedUser = await this.updateAppUser(insertAppUser.cpf, insertAppUser);
      return updatedUser || existingUser;
    } else {
      // Se não existe, criar novo
      return await this.createAppUser(insertAppUser);
    }
  }
}

// Implementação de storage em memória (fallback quando banco não está disponível)
class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private candidates: Map<number, Candidate> = new Map();
  private states: Map<string, State> = new Map();
  private benefits: Map<number, Benefit> = new Map();
  private bannedIps: Map<string, BannedIp> = new Map();
  private bannedDevices: Map<string, BannedDevice> = new Map();
  private allowedDomains: Map<string, AllowedDomain> = new Map();
  private appUsers: Map<string, AppUser> = new Map();
  
  private nextUserId = 1;
  private nextCandidateId = 1;
  private nextBenefitId = 1;
  private nextAppUserId = 1;
  
  constructor() {
    // Adicionar usuários de exemplo para testes
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    const now = new Date();
    
    // Usuário de exemplo 1
    const user1: AppUser = {
      id: this.nextAppUserId++,
      cpf: '123.456.789-00',
      name: 'João da Silva',
      city: 'São Paulo',
      state: 'SP',
      selectedCities: null,
      reachedDeliveryPage: false,
      createdAt: now,
      updatedAt: now
    };
    this.appUsers.set(user1.cpf, user1);
    
    // Usuário de exemplo 2
    const user2: AppUser = {
      id: this.nextAppUserId++,
      cpf: '706.128.541-91',
      name: 'Maria Santos',
      city: 'Rio de Janeiro',
      state: 'RJ',
      selectedCities: null,
      reachedDeliveryPage: false,
      createdAt: now,
      updatedAt: now
    };
    this.appUsers.set(user2.cpf, user2);
    
    // Usuário de exemplo 3 (CPF sem formatação para testes)
    const user3: AppUser = {
      id: this.nextAppUserId++,
      cpf: '98765432100',
      name: 'Pedro Oliveira',
      city: 'Belo Horizonte',
      state: 'MG',
      selectedCities: null,
      reachedDeliveryPage: false,
      createdAt: now,
      updatedAt: now
    };
    this.appUsers.set(user3.cpf, user3);
    
    // Usuário de exemplo 4 (CPF específico do usuário)
    const user4: AppUser = {
      id: this.nextAppUserId++,
      cpf: '063.153.631-05',
      name: 'Carlos Eduardo',
      city: 'Fortaleza',
      state: 'CE',
      selectedCities: null,
      reachedDeliveryPage: false,
      createdAt: now,
      updatedAt: now
    };
    this.appUsers.set(user4.cpf, user4);
    
    console.log('[MemStorage] Dados de exemplo inicializados: 4 usuários criados');
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { ...user, id: this.nextUserId++ } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(c => c.email === email);
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const newCandidate: Candidate = { ...candidate, id: this.nextCandidateId++ } as Candidate;
    this.candidates.set(newCandidate.id, newCandidate);
    return newCandidate;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getState(code: string): Promise<State | undefined> {
    return this.states.get(code);
  }

  async getAllStates(): Promise<State[]> {
    return Array.from(this.states.values());
  }

  async getStatesWithVacancies(): Promise<State[]> {
    return Array.from(this.states.values()).filter(s => s.hasVacancies);
  }

  async createState(state: InsertState): Promise<State> {
    const newState = state as State;
    this.states.set(newState.code, newState);
    return newState;
  }

  async getBenefit(id: number): Promise<Benefit | undefined> {
    return this.benefits.get(id);
  }

  async getAllBenefits(): Promise<Benefit[]> {
    return Array.from(this.benefits.values());
  }

  async createBenefit(benefit: InsertBenefit): Promise<Benefit> {
    const newBenefit: Benefit = { ...benefit, id: this.nextBenefitId++ } as Benefit;
    this.benefits.set(newBenefit.id, newBenefit);
    return newBenefit;
  }

  async getBannedIp(ip: string): Promise<BannedIp | undefined> {
    return this.bannedIps.get(ip);
  }

  async getAllBannedIps(): Promise<BannedIp[]> {
    return Array.from(this.bannedIps.values());
  }

  async createBannedIp(bannedIp: InsertBannedIp): Promise<BannedIp> {
    const newBannedIp = bannedIp as BannedIp;
    this.bannedIps.set(newBannedIp.ip, newBannedIp);
    return newBannedIp;
  }

  async updateBannedIpStatus(ip: string, isBanned: boolean): Promise<BannedIp | undefined> {
    const bannedIp = this.bannedIps.get(ip);
    if (bannedIp) {
      bannedIp.isBanned = isBanned;
      this.bannedIps.set(ip, bannedIp);
      return bannedIp;
    }
    return undefined;
  }

  async updateLastAccess(ip: string): Promise<void> {
    const bannedIp = this.bannedIps.get(ip);
    if (bannedIp) {
      bannedIp.lastAccessAttempt = new Date();
      this.bannedIps.set(ip, bannedIp);
    }
  }

  async getBannedDevice(deviceId: string): Promise<BannedDevice | undefined> {
    return this.bannedDevices.get(deviceId);
  }

  async getAllBannedDevices(): Promise<BannedDevice[]> {
    return Array.from(this.bannedDevices.values());
  }

  async createBannedDevice(device: InsertBannedDevice): Promise<BannedDevice> {
    const newDevice = device as BannedDevice;
    this.bannedDevices.set(newDevice.deviceId, newDevice);
    return newDevice;
  }

  async isBannedByDeviceId(deviceId: string): Promise<boolean> {
    const device = this.bannedDevices.get(deviceId);
    return !!device?.isBanned;
  }

  async getAllowedDomain(domain: string): Promise<AllowedDomain | undefined> {
    return this.allowedDomains.get(domain);
  }

  async getAllAllowedDomains(): Promise<AllowedDomain[]> {
    return Array.from(this.allowedDomains.values());
  }

  async createAllowedDomain(allowedDomain: InsertAllowedDomain): Promise<AllowedDomain> {
    const newDomain = allowedDomain as AllowedDomain;
    this.allowedDomains.set(newDomain.domain, newDomain);
    return newDomain;
  }

  async updateAllowedDomainStatus(domain: string, isActive: boolean): Promise<AllowedDomain | undefined> {
    const allowedDomain = this.allowedDomains.get(domain);
    if (allowedDomain) {
      allowedDomain.isActive = isActive;
      this.allowedDomains.set(domain, allowedDomain);
      return allowedDomain;
    }
    return undefined;
  }

  async getAppUserByCpf(cpf: string): Promise<AppUser | undefined> {
    return this.appUsers.get(cpf);
  }

  async createAppUser(appUser: InsertAppUser): Promise<AppUser> {
    const newAppUser: AppUser = { 
      ...appUser, 
      id: this.nextAppUserId++,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AppUser;
    this.appUsers.set(newAppUser.cpf, newAppUser);
    return newAppUser;
  }

  async updateAppUser(cpf: string, updates: Partial<InsertAppUser>): Promise<AppUser | undefined> {
    const appUser = this.appUsers.get(cpf);
    if (appUser) {
      Object.assign(appUser, { ...updates, updatedAt: new Date() });
      this.appUsers.set(cpf, appUser);
      return appUser;
    }
    return undefined;
  }

  async upsertAppUser(appUser: InsertAppUser): Promise<AppUser> {
    const existingUser = await this.getAppUserByCpf(appUser.cpf);
    
    if (existingUser) {
      const updatedUser = await this.updateAppUser(appUser.cpf, appUser);
      return updatedUser || existingUser;
    } else {
      return await this.createAppUser(appUser);
    }
  }
}

// Importar isDatabaseAvailable do db.ts
import { isDatabaseAvailable } from './db';

// Usar MemStorage se o banco não estiver disponível
export const storage: IStorage = isDatabaseAvailable 
  ? new DatabaseStorage() 
  : new MemStorage();
