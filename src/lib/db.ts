import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Person {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Card {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'account';
  color: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  personIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonSplit {
  personId: string;
  fixedAmount?: number;
  isIncluded: boolean;
  calculatedAmount: number;
}

export interface Transaction {
  id: string;
  groupId: string;
  cardId?: string;
  description: string;
  totalAmount: number;
  date: Date;
  paidByPersonId: string;
  splits: PersonSplit[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  transactionId: string;
  personId: string;
  amount: number;
  paidAt: Date;
}

export interface MonthlyCardStatus {
  id: string;
  cardId: string;
  year: number;
  month: number;
  isPaid: boolean;
  paidAt?: Date;
}

interface ExpenseDB extends DBSchema {
  persons: {
    key: string;
    value: Person;
    indexes: { 'by-name': string };
  };
  cards: {
    key: string;
    value: Card;
    indexes: { 'by-name': string };
  };
  groups: {
    key: string;
    value: Group;
    indexes: { 'by-name': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-group': string; 'by-date': Date; 'by-card': string };
  };
  payments: {
    key: string;
    value: Payment;
    indexes: { 'by-transaction': string; 'by-person': string };
  };
  monthlyCardStatus: {
    key: string;
    value: MonthlyCardStatus;
    indexes: { 'by-card': string; 'by-year': number };
  };
}

let dbInstance: IDBPDatabase<ExpenseDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ExpenseDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ExpenseDB>('expense-manager', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // Persons store
        const personStore = db.createObjectStore('persons', { keyPath: 'id' });
        personStore.createIndex('by-name', 'name');

        // Groups store
        const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
        groupStore.createIndex('by-name', 'name');

        // Transactions store
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
        transactionStore.createIndex('by-group', 'groupId');
        transactionStore.createIndex('by-date', 'date');

        // Payments store
        const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
        paymentStore.createIndex('by-transaction', 'transactionId');
        paymentStore.createIndex('by-person', 'personId');
      }

      if (oldVersion < 2) {
        // Cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-name', 'name');
        }

        // Monthly card status store
        if (!db.objectStoreNames.contains('monthlyCardStatus')) {
          const monthlyStatusStore = db.createObjectStore('monthlyCardStatus', { keyPath: 'id' });
          monthlyStatusStore.createIndex('by-card', 'cardId');
          monthlyStatusStore.createIndex('by-year', 'year');
        }

        // Add by-card index to transactions if not exists
        const txStore = db.objectStoreNames.contains('transactions') 
          ? (db as any).transaction.objectStore('transactions')
          : null;
        if (txStore && !txStore.indexNames.contains('by-card')) {
          txStore.createIndex('by-card', 'cardId');
        }
      }
    },
  });

  return dbInstance;
}

// Person operations
export async function getAllPersons(): Promise<Person[]> {
  const db = await getDB();
  return db.getAll('persons');
}

export async function addPerson(person: Omit<Person, 'id' | 'createdAt'>): Promise<Person> {
  const db = await getDB();
  const newPerson: Person = {
    ...person,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  await db.add('persons', newPerson);
  return newPerson;
}

export async function updatePerson(person: Person): Promise<void> {
  const db = await getDB();
  await db.put('persons', person);
}

export async function deletePerson(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('persons', id);
}

// Group operations
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDB();
  return db.getAll('groups');
}

export async function getGroup(id: string): Promise<Group | undefined> {
  const db = await getDB();
  return db.get('groups', id);
}

export async function addGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
  const db = await getDB();
  const now = new Date();
  const newGroup: Group = {
    ...group,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('groups', newGroup);
  return newGroup;
}

export async function updateGroup(group: Group): Promise<void> {
  const db = await getDB();
  await db.put('groups', { ...group, updatedAt: new Date() });
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB();
  // Delete all transactions and payments for this group
  const transactions = await db.getAllFromIndex('transactions', 'by-group', id);
  for (const tx of transactions) {
    const payments = await db.getAllFromIndex('payments', 'by-transaction', tx.id);
    for (const payment of payments) {
      await db.delete('payments', payment.id);
    }
    await db.delete('transactions', tx.id);
  }
  await db.delete('groups', id);
}

// Transaction operations
export async function getTransactionsByGroup(groupId: string): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-group', groupId);
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const db = await getDB();
  return db.get('transactions', id);
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
  const db = await getDB();
  const now = new Date();
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await db.add('transactions', newTransaction);
  return newTransaction;
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', { ...transaction, updatedAt: new Date() });
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  // Delete all payments for this transaction
  const payments = await db.getAllFromIndex('payments', 'by-transaction', id);
  for (const payment of payments) {
    await db.delete('payments', payment.id);
  }
  await db.delete('transactions', id);
}

// Payment operations
export async function getPaymentsByTransaction(transactionId: string): Promise<Payment[]> {
  const db = await getDB();
  return db.getAllFromIndex('payments', 'by-transaction', transactionId);
}

export async function getPaymentsByPerson(personId: string): Promise<Payment[]> {
  const db = await getDB();
  return db.getAllFromIndex('payments', 'by-person', personId);
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
  const db = await getDB();
  const newPayment: Payment = {
    ...payment,
    id: crypto.randomUUID(),
  };
  await db.add('payments', newPayment);
  return newPayment;
}

export async function deletePayment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('payments', id);
}

export async function getAllPayments(): Promise<Payment[]> {
  const db = await getDB();
  return db.getAll('payments');
}

// Card operations
export async function getAllCards(): Promise<Card[]> {
  const db = await getDB();
  return db.getAll('cards');
}

export async function addCard(card: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  const db = await getDB();
  const newCard: Card = {
    ...card,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  await db.add('cards', newCard);
  return newCard;
}

export async function updateCard(card: Card): Promise<void> {
  const db = await getDB();
  await db.put('cards', card);
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cards', id);
}

// All transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

// Monthly card status operations
export async function getMonthlyCardStatuses(year: number): Promise<MonthlyCardStatus[]> {
  const db = await getDB();
  return db.getAllFromIndex('monthlyCardStatus', 'by-year', year);
}

export async function setMonthlyCardStatus(
  cardId: string,
  year: number,
  month: number,
  isPaid: boolean
): Promise<MonthlyCardStatus> {
  const db = await getDB();
  const id = `${cardId}-${year}-${month}`;
  
  const existing = await db.get('monthlyCardStatus', id);
  
  const status: MonthlyCardStatus = {
    id,
    cardId,
    year,
    month,
    isPaid,
    paidAt: isPaid ? new Date() : undefined,
  };

  if (existing) {
    await db.put('monthlyCardStatus', status);
  } else {
    await db.add('monthlyCardStatus', status);
  }

  return status;
}

export async function getAllMonthlyCardStatuses(): Promise<MonthlyCardStatus[]> {
  const db = await getDB();
  return db.getAll('monthlyCardStatus');
}
