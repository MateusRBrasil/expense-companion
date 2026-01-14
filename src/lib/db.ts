import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Person {
  id: string;
  name: string;
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

interface ExpenseDB extends DBSchema {
  persons: {
    key: string;
    value: Person;
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
    indexes: { 'by-group': string; 'by-date': Date };
  };
  payments: {
    key: string;
    value: Payment;
    indexes: { 'by-transaction': string; 'by-person': string };
  };
}

let dbInstance: IDBPDatabase<ExpenseDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ExpenseDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ExpenseDB>('expense-manager', 1, {
    upgrade(db) {
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
