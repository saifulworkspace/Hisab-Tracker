import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firestore } from "./firebase";

export type Currency = "BDT" | "SR";
export type PersonEntry = { id: string; amount: number; date: string; notes?: string; createdAt: number };
export type PersonRow = { id: string; personName: string; amount: number; currency: Currency; notes?: string; entries?: PersonEntry[]; updatedAt?: number };
export type PropertyPayment = { id: string; amount: number; paymentDate: string; currency: Currency; notes?: string };
export type PropertyRow = { id: string; name: string; budget: number; currency: Currency; notes?: string; startDate?: string; payments: PropertyPayment[]; updatedAt?: number };
export type FinanceTransaction = { id: string; personName: string; kind: "receivable_received" | "payable_paid"; amount: number; currency: Currency; transactionDate: string; notes?: string; createdAt: number };
export type WalletEntry = { id: string; type: "salary" | "cost"; amount: number; currency: Currency; date: string; notes?: string; createdAt: number };
export type FinanceData = { receivables: PersonRow[]; payables: PersonRow[]; properties: PropertyRow[]; transactions: FinanceTransaction[]; wallet: WalletEntry[] };

export const emptyFinanceData: FinanceData = { receivables: [], payables: [], properties: [], transactions: [], wallet: [] };
export const getUserCollectionPath = (uid: string, collectionName: string) => `users/${uid}/${collectionName}`;
const path = (uid: string, name: string) => collection(firestore!, "users", uid, name);
const now = () => Date.now();

export function useFirebaseFinance(user: User | null) {
  const [data, setData] = useState<FinanceData>(emptyFinanceData);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !firestore) { setData(emptyFinanceData); setLoading(false); return; }
    setLoading(true); setError(null);
    const unsubReceivables = onSnapshot(path(user.uid, "receivables"), (snapshot) => {
      setData((current) => ({ ...current, receivables: snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PersonRow)) })); setLoading(false);
    }, (reason) => { setError(reason.message); setLoading(false); });
    const unsubPayables = onSnapshot(path(user.uid, "payables"), (snapshot) => {
      setData((current) => ({ ...current, payables: snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PersonRow)) }));
    }, (reason) => setError(reason.message));
    const unsubProperties = onSnapshot(path(user.uid, "properties"), (snapshot) => {
      setData((current) => ({ ...current, properties: snapshot.docs.map((item) => ({ id: item.id, ...item.data(), payments: (item.data().payments ?? []) as PropertyPayment[] } as PropertyRow)) }));
    }, (reason) => setError(reason.message));
    const unsubTransactions = onSnapshot(path(user.uid, "transactions"), (snapshot) => {
      setData((current) => ({ ...current, transactions: snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as FinanceTransaction)).sort((a, b) => b.createdAt - a.createdAt) }));
    }, (reason) => setError(reason.message));
    const unsubWallet = onSnapshot(path(user.uid, "wallet"), (snapshot) => {
      setData((current) => ({ ...current, wallet: snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as WalletEntry)).sort((a, b) => b.createdAt - a.createdAt) }));
    }, (reason) => setError(reason.message));
    return () => { unsubReceivables(); unsubPayables(); unsubProperties(); unsubTransactions(); unsubWallet(); };
  }, [user]);

  const summary = useMemo(() => {
    const totals = (rows: PersonRow[]) => rows.reduce((result, row) => ({ ...result, [row.currency]: (result[row.currency] ?? 0) + Number(row.amount) }), { BDT: 0, SR: 0 } as Record<Currency, number>);
    const propertyStatus = data.properties.reduce((result, property) => {
      const paid = property.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      result[property.currency] = { budget: (result[property.currency]?.budget ?? 0) + Number(property.budget), paid: (result[property.currency]?.paid ?? 0) + paid };
      return result;
    }, {} as Record<Currency, { budget: number; paid: number }>);
    const walletBalance = data.wallet.reduce((result, entry) => { const delta = entry.type === "salary" ? Number(entry.amount) : -Number(entry.amount); return { ...result, [entry.currency]: (result[entry.currency] ?? 0) + delta }; }, { BDT: 0, SR: 0 } as Record<Currency, number>);
    return { receivablesByCurrency: totals(data.receivables), payablesByCurrency: totals(data.payables), propertyStatus, walletBalance };
  }, [data]);

  return { data, summary, loading, error };
}

function requireDb() { if (!firestore) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* variables."); return firestore; }
function clean(value: string) { return value.trim().replace(/\s+/g, " "); }

export async function savePerson(userId: string, kind: "receivables" | "payables", input: { id?: string; personName: string; amount: number; currency: Currency; notes?: string }) {
  const db = requireDb(); const id = input.id ?? crypto.randomUUID();
  await setDoc(doc(db, "users", userId, kind, id), { personName: clean(input.personName), amount: Number(input.amount), currency: input.currency, notes: input.notes?.trim() ?? "", updatedAt: now() }, { merge: true });
}
export async function addPersonEntry(userId: string, kind: "receivables" | "payables", matched: PersonRow | undefined, input: { personName: string; amount: number; currency: Currency; date?: string; notes?: string }) {
  const db = requireDb();
  const amount = Number(input.amount);
  const entryDate = input.date || new Date().toISOString().slice(0, 10);
  const entry: PersonEntry = { id: crypto.randomUUID(), amount, date: entryDate, notes: input.notes?.trim() || "", createdAt: now() };
  if (matched) {
    const nextEntries = [...(matched.entries ?? []), entry];
    const nextAmount = Number(matched.amount) + amount;
    await setDoc(doc(db, "users", userId, kind, matched.id), { amount: nextAmount, entries: nextEntries, updatedAt: now() }, { merge: true });
  } else {
    const id = crypto.randomUUID();
    await setDoc(doc(db, "users", userId, kind, id), { personName: clean(input.personName), amount, currency: input.currency, notes: input.notes?.trim() ?? "", entries: [entry], updatedAt: now() }, { merge: true });
  }
}
export async function updatePersonEntry(userId: string, kind: "receivables" | "payables", row: PersonRow, entryId: string, input: { amount: number; date: string; notes?: string }) {
  const db = requireDb();
  const entries = row.entries ?? [];
  const target = entries.find((entry) => entry.id === entryId);
  if (!target) throw new Error("This entry could not be found.");
  const nextAmountValue = Number(input.amount);
  const delta = nextAmountValue - Number(target.amount);
  const nextEntries = entries.map((entry) => (entry.id === entryId ? { ...entry, amount: nextAmountValue, date: input.date, notes: input.notes?.trim() || "" } : entry));
  const nextRowAmount = Number(row.amount) + delta;
  if (nextRowAmount < 0) throw new Error("This edit would make the balance negative — check the amount.");
  const ref = doc(db, "users", userId, kind, row.id);
  if (nextRowAmount === 0) await deleteDoc(ref);
  else await setDoc(ref, { amount: nextRowAmount, entries: nextEntries, updatedAt: now() }, { merge: true });
}
export async function removePersonEntry(userId: string, kind: "receivables" | "payables", row: PersonRow, entryId: string) {
  const db = requireDb();
  const entries = row.entries ?? [];
  const target = entries.find((entry) => entry.id === entryId);
  if (!target) throw new Error("This entry could not be found.");
  const nextEntries = entries.filter((entry) => entry.id !== entryId);
  const nextRowAmount = Number(row.amount) - Number(target.amount);
  if (nextRowAmount < 0) throw new Error("Can't delete this entry — the outstanding balance is already smaller than this entry (it was probably already partly settled). Edit the amount instead.");
  const ref = doc(db, "users", userId, kind, row.id);
  if (nextRowAmount === 0) await deleteDoc(ref);
  else await setDoc(ref, { amount: nextRowAmount, entries: nextEntries, updatedAt: now() }, { merge: true });
}
export async function removePerson(userId: string, kind: "receivables" | "payables", id: string) { await deleteDoc(doc(requireDb(), "users", userId, kind, id)); }
export async function settlePerson(userId: string, kind: "receivables" | "payables", row: PersonRow, amount: number, transactionDate = new Date().toISOString().slice(0, 10), notes = "") {
  const next = Number(row.amount) - Number(amount);
  if (amount <= 0 || next < 0) throw new Error("Settlement amount is larger than the outstanding balance.");
  const db = requireDb();
  const ref = doc(db, "users", userId, kind, row.id);
  if (next === 0) await deleteDoc(ref);
  else await updateDoc(ref, { amount: next, updatedAt: now() });
  await addDoc(collection(db, "users", userId, "transactions"), { personName: row.personName, kind: kind === "receivables" ? "receivable_received" : "payable_paid", amount: Number(amount), currency: row.currency, transactionDate, notes, createdAt: now() });
}
export async function saveProperty(userId: string, input: { id?: string; name: string; budget: number; currency: Currency; notes?: string; startDate?: string }) {
  const db = requireDb(); const id = input.id ?? crypto.randomUUID();
  const base: Record<string, unknown> = { name: clean(input.name), budget: Number(input.budget), currency: input.currency, notes: input.notes?.trim() ?? "", startDate: input.startDate ?? "", updatedAt: now() };
  if (!input.id) base.payments = [];
  await setDoc(doc(db, "users", userId, "properties", id), base, { merge: true });
}
export async function addPropertyPayment(userId: string, property: PropertyRow, payment: Omit<PropertyPayment, "id">) { const next = { ...property, payments: [...property.payments, { ...payment, id: crypto.randomUUID(), amount: Number(payment.amount) }], updatedAt: now() }; await setDoc(doc(requireDb(), "users", userId, "properties", property.id), next); }
export async function removeProperty(userId: string, id: string) { await deleteDoc(doc(requireDb(), "users", userId, "properties", id)); }
export async function addWalletEntry(userId: string, input: { type: "salary" | "cost"; amount: number; currency: Currency; date?: string; notes?: string }) {
  const db = requireDb();
  await addDoc(collection(db, "users", userId, "wallet"), { type: input.type, amount: Number(input.amount), currency: input.currency, date: input.date || new Date().toISOString().slice(0, 10), notes: input.notes?.trim() ?? "", createdAt: now() });
}
export async function updateWalletEntry(userId: string, id: string, input: { type: "salary" | "cost"; amount: number; currency: Currency; date: string; notes?: string }) {
  const db = requireDb();
  await setDoc(doc(db, "users", userId, "wallet", id), { type: input.type, amount: Number(input.amount), currency: input.currency, date: input.date, notes: input.notes?.trim() ?? "", updatedAt: now() }, { merge: true });
}
export async function removeWalletEntry(userId: string, id: string) { await deleteDoc(doc(requireDb(), "users", userId, "wallet", id)); }
