import React, { useState } from 'react';

// 1. Properly Type the Tabs Structure
interface TabItem {
	id: string;
	label: string;
	// Store the component itself, not a rendered instance or random syntax
	component: React.ComponentType;
}

// 2. Define the Tabs Configuration
const TABS: Record<string, TabItem> = {
	manual: { id: 'manual', label: 'Manual', component: ManualTab },
	lookup: { id: 'lookup', label: 'Lookup', component: LookupTab },
	load: { id: 'load', label: 'Load', component: LoadTab },
};

interface FormState {
	manufacturer: string;
	code: string;
	name: string;
	hex: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

// --- Sub-components for Content ---
function LookupTab() {
	return <div className="text-zinc-300">Lookup Panel Content</div>;
}

function LoadTab() {
	return <div className="text-zinc-300">Load Panel Content</div>;
}

function ManualTab() {
	const [form, setForm] = useState<FormState>({
		manufacturer: '',
		code: '',
		name: '',
		hex: '',
	});

	const updateForm = (key: keyof FormState, value: string): void => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const handleAdd = (e: React.SubmitEvent<HTMLFormElement>): void => {
		e.preventDefault();
		console.log('Submitting form data:', form);
	};

	return (
		<section className="w-fullbg-zinc-800/50 backdrop-blur-sm">
			<p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Step 2</p>
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
	// 3. Single Source of Truth: Only track the string ID
	const [activeTab, setActiveTab] = useState<string>(TABS.manual.id);

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
								<TabContentComponent />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default Add;
