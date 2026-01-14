import { useState, useEffect, useCallback } from 'react';
import {
  Group,
  Person,
  Transaction,
  Payment,
  getAllGroups,
  getAllPersons,
  getTransactionsByGroup,
  getAllPayments,
  addGroup,
  updateGroup,
  deleteGroup,
  addPerson,
  updatePerson,
  deletePerson,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addPayment,
  deletePayment,
} from '@/lib/db';

export function useExpenseData() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsData, personsData, paymentsData] = await Promise.all([
        getAllGroups(),
        getAllPersons(),
        getAllPayments(),
      ]);
      setGroups(groupsData);
      setPersons(personsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group operations
  const createGroup = async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGroup = await addGroup(group);
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const editGroup = async (group: Group) => {
    await updateGroup(group);
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
  };

  const removeGroup = async (id: string) => {
    await deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  // Person operations
  const createPerson = async (person: Omit<Person, 'id' | 'createdAt'>) => {
    const newPerson = await addPerson(person);
    setPersons((prev) => [...prev, newPerson]);
    return newPerson;
  };

  const editPerson = async (person: Person) => {
    await updatePerson(person);
    setPersons((prev) => prev.map((p) => (p.id === person.id ? person : p)));
  };

  const removePerson = async (id: string) => {
    await deletePerson(id);
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  // Transaction operations
  const getGroupTransactions = async (groupId: string): Promise<Transaction[]> => {
    return getTransactionsByGroup(groupId);
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addTransaction(transaction);
  };

  const editTransaction = async (transaction: Transaction) => {
    await updateTransaction(transaction);
  };

  const removeTransaction = async (id: string) => {
    await deleteTransaction(id);
    // Reload payments after deleting transaction
    const updatedPayments = await getAllPayments();
    setPayments(updatedPayments);
  };

  // Payment operations
  const createPayment = async (payment: Omit<Payment, 'id'>) => {
    const newPayment = await addPayment(payment);
    setPayments((prev) => [...prev, newPayment]);
    return newPayment;
  };

  const removePayment = async (id: string) => {
    await deletePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    groups,
    persons,
    payments,
    loading,
    loadData,
    createGroup,
    editGroup,
    removeGroup,
    createPerson,
    editPerson,
    removePerson,
    getGroupTransactions,
    createTransaction,
    editTransaction,
    removeTransaction,
    createPayment,
    removePayment,
  };
}
