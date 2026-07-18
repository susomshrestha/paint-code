import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	setDoc,
	type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaintEntry {
	id: string;
	manufacturer: string;
	code: string;
	name: string | null;
	hex: string;
}

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
