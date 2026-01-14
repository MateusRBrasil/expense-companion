import { useState, useEffect, useCallback } from 'react';
import {
  Group,
  Person,
  Card,
  Transaction,
  Payment,
  MonthlyCardStatus,
  getAllGroups,
  getAllPersons,
  getAllCards,
  getTransactionsByGroup,
  getAllTransactions,
  getAllPayments,
  getAllMonthlyCardStatuses,
  addGroup,
  updateGroup,
  deleteGroup,
  addPerson,
  updatePerson,
  deletePerson,
  addCard,
  updateCard,
  deleteCard,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addPayment,
  deletePayment,
  setMonthlyCardStatus,
} from '@/lib/db';

export function useExpenseData() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthlyCardStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsData, personsData, cardsData, paymentsData, statusesData] = await Promise.all([
        getAllGroups(),
        getAllPersons(),
        getAllCards(),
        getAllPayments(),
        getAllMonthlyCardStatuses(),
      ]);
      setGroups(groupsData);
      setPersons(personsData);
      setCards(cardsData);
      setPayments(paymentsData);
      setMonthlyStatuses(statusesData);
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

  // Card operations
  const createCard = async (card: Omit<Card, 'id' | 'createdAt'>) => {
    const newCard = await addCard(card);
    setCards((prev) => [...prev, newCard]);
    return newCard;
  };

  const editCard = async (card: Card) => {
    await updateCard(card);
    setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  };

  const removeCard = async (id: string) => {
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  // Transaction operations
  const getGroupTransactions = async (groupId: string): Promise<Transaction[]> => {
    return getTransactionsByGroup(groupId);
  };

  const fetchAllTransactions = async (): Promise<Transaction[]> => {
    return getAllTransactions();
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addTransaction(transaction);
  };

  const editTransaction = async (transaction: Transaction) => {
    await updateTransaction(transaction);
  };

  const removeTransaction = async (id: string) => {
    await deleteTransaction(id);
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

  // Monthly card status operations
  const toggleMonthlyCardStatus = async (cardId: string, year: number, month: number, isPaid: boolean) => {
    const status = await setMonthlyCardStatus(cardId, year, month, isPaid);
    setMonthlyStatuses((prev) => {
      const filtered = prev.filter((s) => s.id !== status.id);
      return [...filtered, status];
    });
    return status;
  };

  return {
    groups,
    persons,
    cards,
    payments,
    monthlyStatuses,
    loading,
    loadData,
    createGroup,
    editGroup,
    removeGroup,
    createPerson,
    editPerson,
    removePerson,
    createCard,
    editCard,
    removeCard,
    getGroupTransactions,
    fetchAllTransactions,
    createTransaction,
    editTransaction,
    removeTransaction,
    createPayment,
    removePayment,
    toggleMonthlyCardStatus,
  };
}
