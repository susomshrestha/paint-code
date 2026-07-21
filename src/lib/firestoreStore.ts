import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	setDoc,
	writeBatch,
	type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PaintEntry } from '../interfaces';

const paintCodesRef = collection(db, 'paintCodes');

// ---- READ ----
export async function getPaintEntries(): Promise<PaintEntry[]> {
	const snapshot = await getDocs(paintCodesRef);
	return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PaintEntry);
}

// ---- READ (live) ----
export function subscribeToPaintEntries(
	onChange: (entries: PaintEntry[]) => void,
	onError?: (error: Error) => void,
): Unsubscribe {
	return onSnapshot(
		paintCodesRef,
		(snapshot) => {
			const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PaintEntry);
			onChange(entries);
		},
		(error) => onError?.(error),
	);
}

// ---- WRITE (add or overwrite one entry) ----
export async function savePaintEntry(entry: PaintEntry): Promise<void> {
	const { id, ...data } = entry;
	await setDoc(doc(db, 'paintCodes', id), data);
}

// ---- WRITE (remove one entry) ----
export async function deletePaintEntry(id: string): Promise<void> {
	await deleteDoc(doc(db, 'paintCodes', id));
}

export async function savePaintEntriesBatch(entries: PaintEntry[]): Promise<void> {
	const BATCH_SIZE = 500;

	for (let i = 0; i < entries.length; i += BATCH_SIZE) {
		const batch = writeBatch(db);
		const chunk = entries.slice(i, i + BATCH_SIZE);

		for (const entry of chunk) {
			const { id, ...data } = entry;
			batch.set(doc(db, 'paintCodes', id), data);
		}

		await batch.commit();
	}
}
