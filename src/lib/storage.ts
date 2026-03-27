import { Client, Budget } from '../types';

const CLIENTS_KEY = 'sacolapro_clientes';
const BUDGETS_KEY = 'sacolapro_orcamentos';

export const storage = {
  // Clients
  getClients: (): Client[] => {
    const data = localStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveClient: (client: Client): void => {
    const clients = storage.getClients();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  deleteClient: (id: string): void => {
    const clients = storage.getClients().filter((c) => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  // Budgets
  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(BUDGETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBudget: (budget: Budget): void => {
    const budgets = storage.getBudgets();
    const index = budgets.findIndex((b) => b.id === budget.id);
    const updatedBudget = { ...budget, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      budgets[index] = updatedBudget;
    } else {
      budgets.push(updatedBudget);
    }
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  },

  deleteBudget: (id: string): void => {
    const budgets = storage.getBudgets().filter((b) => b.id !== id);
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  },

  duplicateBudget: (id: string): Budget | null => {
    const budgets = storage.getBudgets();
    const original = budgets.find((b) => b.id === id);
    if (!original) return null;

    const newBudget: Budget = {
      ...original,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };
    storage.saveBudget(newBudget);
    return newBudget;
  }
};
