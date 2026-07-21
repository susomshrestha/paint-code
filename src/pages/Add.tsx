import React, { useEffect, useState } from 'react';
import { subscribeToPaintEntries, savePaintEntry, deletePaintEntry } from '../lib/firestoreStore';
import type { PaintEntry } from '../interfaces';

// Props every tab receives — a tab only has to use the ones it needs
interface TabProps {
	onAdd: (entry: PaintEntry) => void;
}

// 1. Properly Type the Tabs Structure
interface TabItem {
	id: string;
	label: string;
	// Store the component itself, not a rendered instance or random syntax
	component: React.ComponentType<TabProps>;
}

// 2. Define the Tabs Configuration
const TABS: Record<string, TabItem> = {
	manual: { id: 'manual', label: 'Manual', component: ManualTab },
	lookup: { id: 'lookup', label: 'Lookup', component: LookupTab },
};

interface FormState {
	manufacturer: string;
	code: string;
	name: string;
	hex: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LookupTab(_props: TabProps) {
	return <div className="text-zinc-300">Lookup Panel Content</div>;
}

function ManualTab({ onAdd }: TabProps) {
	const [form, setForm] = useState<FormState>({
		manufacturer: '',
		code: '',
		name: '',
		hex: '',
	});

	const updateForm = (key: keyof FormState, value: string): void => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleAdd = (e: React.FormEvent<HTMLFormElement>): void => {
		e.preventDefault();
		const manufacturer = form.manufacturer.trim();
		const code = form.code.trim();
		if (!manufacturer || !code || !HEX_RE.test(form.hex)) return;

		onAdd({
			id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
			manufacturer,
			code,
			name: form.name.trim() || null,
			hex: form.hex.toUpperCase(),
		});

		setForm({ manufacturer: '', code: '', name: '', hex: '' });
	};

	return (
		<section className="w-full">
			<p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Step 1</p>
			<h2 className="text-xl font-bold text-zinc-100 mb-6">Add a paint code</h2>

			<form onSubmit={handleAdd} className="space-y-5">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="mfrInput" className="text-sm font-medium text-zinc-400">
						Manufacturer
					</label>
					<input
						type="text"
						id="mfrInput"
						placeholder="e.g. Toyota"
						value={form.manufacturer}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateForm('manufacturer', e.target.value)
						}
						className="w-full input"
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="codeInput" className="text-sm font-medium text-zinc-400">
						Paint code
					</label>
					<input
						type="text"
						id="codeInput"
						placeholder="e.g. 040"
						value={form.code}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateForm('code', e.target.value)
						}
						className="w-full input"
						required
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="nameInput" className="text-sm font-medium text-zinc-400">
						Colour name (optional)
					</label>
					<input
						type="text"
						id="nameInput"
						placeholder="e.g. Super White"
						value={form.name}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateForm('name', e.target.value)
						}
						className="w-full input"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="hexInput" className="text-sm font-medium text-zinc-400">
						Hex colour
					</label>
					<div className="flex gap-2">
						<div className="relative w-10 h-10 overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900">
							<input
								type="color"
								value={HEX_RE.test(form.hex) ? form.hex : '#888888'}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateForm('hex', e.target.value)
								}
								className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
							/>
						</div>
						<input
							type="text"
							id="hexInput"
							placeholder="#RRGGBB"
							value={form.hex}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateForm('hex', e.target.value)
							}
							className="w-full input font-mono"
							required
						/>
					</div>
				</div>

				<div className="pt-2">
					<button type="submit" className="btn btn-primary">
						Add to deck
					</button>
				</div>
			</form>
		</section>
	);
}

// --- Main Layout ---
function Add() {
	const [activeTab, setActiveTab] = useState<string>(TABS.manual.id);
	const [entries, setEntries] = useState<PaintEntry[]>([]);
	const [syncStatus, setSyncStatus] = useState<{ text: string; isError: boolean } | null>({
		text: 'Connecting…',
		isError: false,
	});
	const [actionStatus, setActionStatus] = useState<{ text: string; isError: boolean } | null>(null);

	useEffect(() => {
		const unsubscribe = subscribeToPaintEntries(
			(data) => {
				setEntries(data);
				setSyncStatus({ text: `Synced live — ${data.length} entries.`, isError: false });
			},
			(err) => setSyncStatus({ text: `Sync error: ${err.message}`, isError: true }),
		);
		return unsubscribe;
	}, []);

	// ---- WRITE (add) ----
	const handleAdd = async (entry: PaintEntry): Promise<void> => {
		try {
			await savePaintEntry(entry);
			setActionStatus({ text: `Added ${entry.manufacturer} ${entry.code}.`, isError: false });
		} catch (err) {
			setActionStatus({
				text: err instanceof Error ? err.message : 'Could not add entry.',
				isError: true,
			});
		}
	};

	// ---- WRITE (remove) ----
	const handleRemove = async (id: string): Promise<void> => {
		try {
			await deletePaintEntry(id);
		} catch (err) {
			setActionStatus({
				text: err instanceof Error ? err.message : 'Could not remove entry.',
				isError: true,
			});
		}
	};

	const tabProps: TabProps = { onAdd: handleAdd };

	return (
		<div className="container-max py-12">
			<div className="overflow-hidden card">
				{/* Navigation Bar */}
				<div className="flex justify-evenly text-zinc-400 font-semibold overflow-x-auto">
					{Object.values(TABS).map((tab) => {
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								className={`w-full text-center cursor-pointer duration-300 transition p-4 min-w-32 ${
									isActive ? 'bg-zinc-700 text-amber-400' : 'hover:text-amber-400'
								}`}
								// Updating the activeTab ID handles everything
								onClick={() => setActiveTab(tab.id)}>
								{tab.label}
							</button>
						);
					})}
				</div>

				{/* Tab Content Window */}
				<div className="bg-zinc-800/50 backdrop-blur-sm p-16">
					{Object.values(TABS).map((tab) => {
						const isActive = activeTab === tab.id;

						// 1. Return null immediately if not active to avoid vertical layout bloating
						if (!isActive) return null;

						const TabContentComponent = tab.component;

						return (
							<div
								key={tab.id}
								// 2. Kept relative so the parent can naturally calculate height
								className="w-full transition-all duration-300 ease-in-out opacity-100 translate-x-0">
								<TabContentComponent {...tabProps} />
							</div>
						);
					})}
				</div>
			</div>

			{/* ---- Deck list — reflects the live subscription, updates as anyone adds/removes ---- */}
			<div className="mt-8 card p-16">
				<div className="flex items-center justify-between mb-6">
					<div>
						<p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Step 2</p>
						<h2 className="text-xl font-bold text-zinc-100">Deck ({entries.length} entries)</h2>
					</div>
					{syncStatus && (
						<p className={`text-sm ${syncStatus.isError ? 'text-red-400' : 'text-zinc-500'}`}>
							{syncStatus.text}
						</p>
					)}
				</div>

				{entries.length === 0 ? (
					<p className="text-zinc-500 text-sm">No entries yet — add one above.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-700">
									<th className="py-2 pr-3 font-semibold"></th>
									<th className="py-2 pr-3 font-semibold">Manufacturer</th>
									<th className="py-2 pr-3 font-semibold">Code</th>
									<th className="py-2 pr-3 font-semibold">Name</th>
									<th className="py-2 pr-3 font-semibold">Hex</th>
									<th className="py-2 font-semibold"></th>
								</tr>
							</thead>
							<tbody>
								{entries.map((entry) => (
									<tr key={entry.id} className="border-b border-zinc-800">
										<td className="py-2.5 pr-3">
											<span
												className="inline-block w-4.5 h-4.5 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]"
												style={{ backgroundColor: entry.hex }}
											/>
										</td>
										<td className="py-2.5 pr-3 text-zinc-200">{entry.manufacturer}</td>
										<td className="py-2.5 pr-3 font-mono text-amber-400">{entry.code}</td>
										<td className="py-2.5 pr-3 text-zinc-400">{entry.name ?? '—'}</td>
										<td className="py-2.5 pr-3 font-mono text-zinc-400">{entry.hex}</td>
										<td className="py-2.5 text-right">
											<button
												type="button"
												onClick={() => handleRemove(entry.id)}
												title="Remove"
												className="text-zinc-500 hover:text-red-400">
												✕
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{actionStatus && (
					<p
						className={`text-sm mt-4 ${actionStatus.isError ? 'text-red-400' : 'text-emerald-400'}`}>
						{actionStatus.text}
					</p>
				)}
			</div>
		</div>
	);
}

export default Add;
