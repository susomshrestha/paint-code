import { useCallback, useEffect, useState } from 'react';
import { getPaintEntries } from '../lib/firestoreStore';
import { loadViaFetch } from '../lib/dataStore';
import { colorDistance } from '../lib/colorDistance';
import type { PaintEntry } from '../interfaces';

interface PlayerScore {
	name: string;
	score: number;
}

interface RoundAnswer {
	playerIdx: number;
	chosenId: string;
	correct: boolean;
}

type Phase = 'setup' | 'round' | 'final';

const ROUND_OPTIONS = [3, 5, 10, 15];
const MIN_DISTRACTOR_DISTANCE = 10;

function shuffledCopy<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export default function Game() {
	const [entries, setEntries] = useState<PaintEntry[]>([]);
	const [loadError, setLoadError] = useState('');

	const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
	const [totalRounds, setTotalRounds] = useState(5);

	const [phase, setPhase] = useState<Phase>('setup');
	const [scores, setScores] = useState<PlayerScore[]>([]);
	const [roundNum, setRoundNum] = useState(0);
	const [questionQueue, setQuestionQueue] = useState<PaintEntry[]>([]);
	const [currentEntry, setCurrentEntry] = useState<PaintEntry | null>(null);
	const [choices, setChoices] = useState<PaintEntry[]>([]);

	const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
	const [roundAnswers, setRoundAnswers] = useState<RoundAnswer[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		async function loadEntries(): Promise<PaintEntry[]> {
			try {
				const data = await getPaintEntries();
				if (Array.isArray(data) && data.length >= 15) return data;
				console.warn('Firestore deck has fewer than 15 entries — falling back to data.json.');
			} catch (err) {
				console.warn(
					'Could not load from Firestore, falling back to data.json:',
					(err as Error).message,
				);
			}
			return loadViaFetch<PaintEntry[]>();
		}

		loadEntries()
			.then((data) => {
				if (!Array.isArray(data) || data.length < 2) {
					throw new Error(
						'Need at least 2 entries in the deck to play — add some on the Add page.',
					);
				}
				setEntries(data);
			})
			.catch((err: Error) => setLoadError(err.message));
	}, []);

	const drawQuestion = useCallback(
		(queue: PaintEntry[]): { entry: PaintEntry; rest: PaintEntry[] } => {
			const q = queue.length === 0 ? shuffledCopy(entries) : queue;
			return { entry: q[q.length - 1], rest: q.slice(0, -1) };
		},
		[entries],
	);

	function buildChoices(entry: PaintEntry): PaintEntry[] {
		const numChoices = Math.min(4, entries.length);

		const usedHex = new Set([entry.hex.toLowerCase()]);
		const farEnough: PaintEntry[] = [];
		const tooClose: PaintEntry[] = [];
		for (const e of entries) {
			if (e.id === entry.id) continue;
			if (usedHex.has(e.hex.toLowerCase())) continue;
			usedHex.add(e.hex.toLowerCase());
			if (colorDistance(entry.hex, e.hex) < MIN_DISTRACTOR_DISTANCE) {
				tooClose.push(e);
			} else {
				farEnough.push(e);
			}
		}

		let pool = shuffledCopy(farEnough);
		if (pool.length < numChoices - 1) {
			pool = pool.concat(shuffledCopy(tooClose));
		}

		const distractors = pool.slice(0, numChoices - 1);
		return shuffledCopy([entry, ...distractors]);
	}

	function startRound(queue: PaintEntry[], nextRoundNum: number) {
		const { entry, rest } = drawQuestion(queue);
		setCurrentEntry(entry);
		setChoices(buildChoices(entry));
		setQuestionQueue(rest);
		setRoundNum(nextRoundNum);
		setCurrentPlayerIdx(0);
		setRoundAnswers([]);
		setSelectedId(null);
		setPhase('round');
	}

	function startGame() {
		const names = playerNames.map((n) => n.trim()).filter(Boolean);
		if (names.length === 0) {
			alert('Add at least one player name.');
			return;
		}
		setScores(names.map((name) => ({ name, score: 0 })));
		startRound([], 1);
	}

	const isRoundComplete = currentPlayerIdx >= scores.length;

	function pickChoice(entry: PaintEntry) {
		if (isRoundComplete) return;
		setSelectedId(entry.id);
	}

	function confirmAndPass() {
		if (!selectedId || !currentEntry) return;
		const correct = selectedId === currentEntry.id;
		const answer: RoundAnswer = { playerIdx: currentPlayerIdx, chosenId: selectedId, correct };
		const updatedAnswers = [...roundAnswers, answer];
		setRoundAnswers(updatedAnswers);

		const isLastPlayer = currentPlayerIdx >= scores.length - 1;
		if (isLastPlayer) {
			setScores((prev) =>
				prev.map((p, idx) => {
					const ans = updatedAnswers.find((a) => a.playerIdx === idx);
					return ans?.correct ? { ...p, score: p.score + 1 } : p;
				}),
			);
		}

		setCurrentPlayerIdx((idx) => idx + 1);
		setSelectedId(null);
	}

	function nextRoundOrFinish() {
		if (roundNum >= totalRounds) {
			setPhase('final');
		} else {
			startRound(questionQueue, roundNum + 1);
		}
	}

	function resetToSetup() {
		setPhase('setup');
	}

	function updatePlayerName(idx: number, value: string) {
		setPlayerNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
	}
	function addPlayerRow() {
		setPlayerNames((prev) => [...prev, '']);
	}
	function removePlayerRow(idx: number) {
		setPlayerNames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
	}

	// ---------- Setup ----------
	if (phase === 'setup') {
		return (
			<section className="container-max py-12">
				<div className="card p-16">
					<p className="mb-1 font-mono text-xs uppercase tracking-widest text-amber-400">
						New game
					</p>
					<h2 className="mb-4 font-sans text-xl font-semibold uppercase tracking-wide text-neutral-100">
						Who&apos;s playing?
					</h2>

					{playerNames.map((name, idx) => (
						<div className="mb-2.5 flex gap-2" key={idx}>
							<input
								type="text"
								placeholder="Player name"
								value={name}
								onChange={(e) => updatePlayerName(idx, e.target.value)}
								className="flex-1 rounded-sm border border-neutral-700 bg-neutral-700/60 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
							/>
							<button
								type="button"
								onClick={() => removePlayerRow(idx)}
								title="Remove player"
								className="w-10 btn btn-ghost hover:border-red-500 hover:text-red-500">
								×
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={addPlayerRow}
						className="btn btn-ghost hover:bg-neutral-700">
						+ Add player
					</button>

					<div className="mt-6 mb-1">
						<label className="mb-1.5 block text-xs uppercase tracking-wide text-neutral-400">
							Number of rounds
						</label>
						<div className="mb-2 flex gap-2">
							{ROUND_OPTIONS.map((n) => (
								<button
									key={n}
									type="button"
									onClick={() => setTotalRounds(n)}
									className={`flex-1 rounded-sm border px-2.5 py-2.5 font-mono cursor-pointer ${
										totalRounds === n
											? 'border-amber-400 bg-amber-400/10 text-amber-400'
											: 'border-neutral-700 bg-neutral-700/60 text-neutral-400'
									}`}>
									{n}
								</button>
							))}
						</div>
						<p className="text-sm text-neutral-400">
							Every player answers the same question each round.
						</p>
					</div>

					<button
						onClick={startGame}
						disabled={!!loadError || entries.length === 0}
						className="mt-4 w-full btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
						Start game
					</button>

					{loadError && (
						<div className="mt-5 rounded-sm border border-red-500 bg-red-500/10 p-3.5 font-mono text-sm text-red-400">
							Could not load data.json — {loadError}
						</div>
					)}
				</div>
			</section>
		);
	}

	// ---------- Round (every player answers the same question in turn) ----------
	if (phase === 'round' && currentEntry) {
		const player = scores[currentPlayerIdx];
		return (
			<section className="container-max py-12 px-6">
				<div className="mb-4 flex flex-wrap gap-4">
					{scores.map((p, idx) => (
						<div
							key={idx}
							className={`border-b-2 pb-1 font-mono text-sm ${
								idx === currentPlayerIdx && !isRoundComplete
									? 'border-amber-400 text-amber-400'
									: 'border-transparent text-neutral-400'
							}`}>
							{p.name} <b className="text-neutral-100">{p.score}</b>
						</div>
					))}
				</div>

				<div className="mb-4 text-center font-mono text-sm text-neutral-400">
					{isRoundComplete ? (
						<>
							Round {roundNum} of {totalRounds} —{' '}
							<b className="text-neutral-100">everyone&apos;s answered</b>
						</>
					) : (
						<>
							Round {roundNum} of {totalRounds} —{' '}
							<b className="text-amber-400">{player.name}&apos;s</b> pick ({currentPlayerIdx + 1}/
							{scores.length})
						</>
					)}
				</div>

				<div className="relative card mb-5 p-6">
					<div className="pointer-events-none absolute inset-1.5 rounded-sm border border-neutral-700/60" />
					<div className="flex items-baseline justify-between border-b px-1 py-2">
						<span className="font-mono text-xs uppercase tracking-wide text-neutral-400">
							Manufacturer
						</span>
						<span className="text-2xl text-zinc-100">{currentEntry.manufacturer}</span>
					</div>
					<div className="flex items-baseline justify-between px-1 py-2">
						<span className="font-mono text-xs uppercase tracking-wide text-neutral-400">
							Paint code
						</span>
						<span className="font-mono text-2xl tracking-wide text-amber-400">
							{currentEntry.code}
						</span>
					</div>
				</div>

				{!isRoundComplete && (
					<p className="mb-4 text-center font-mono text-sm text-neutral-400">
						{player.name}, tap the matching paint chip — tap another to change your answer
					</p>
				)}

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{choices.map((entry) => {
						const isSelected = entry.id === selectedId;
						const isCorrectChip = isRoundComplete && entry.id === currentEntry.id;
						return (
							<button
								key={entry.id}
								onClick={() => pickChoice(entry)}
								disabled={isRoundComplete}
								aria-label="Paint chip option"
								style={{ backgroundColor: entry.hex }}
								className={`relative h-28 rounded-tr-xl rounded-bl-sm rounded-br-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25),0_6px_14px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-1 disabled:pointer-events-none disabled:cursor-default ${
									isCorrectChip
										? 'ring-4 ring-emerald-500 disabled:opacity-100'
										: isSelected
											? 'ring-4 ring-amber-400 disabled:opacity-60'
											: 'disabled:opacity-60'
								}`}>
								<span className="absolute left-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-neutral-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
								<span className="absolute right-0 top-0 h-5 w-5 rounded-tr-xl bg-linear-to-br from-transparent from-50% to-black/25 to-50%" />
							</button>
						);
					})}
				</div>

				{!isRoundComplete && selectedId && (
					<button onClick={confirmAndPass} className="mt-5 w-full btn btn-primary">
						{currentPlayerIdx >= scores.length - 1
							? 'Lock in answer →'
							: `Lock in — pass to ${scores[currentPlayerIdx + 1].name} →`}
					</button>
				)}

				{roundAnswers.length > 0 && !isRoundComplete && (
					<div className="mt-6">
						<p className="mb-2 font-mono text-xs uppercase tracking-widest text-neutral-400">
							Answered so far
						</p>
						<ul className="flex flex-wrap gap-2">
							{roundAnswers.map((ans) => (
								<li
									key={ans.playerIdx}
									className="rounded-sm border border-neutral-700 px-3 py-1.5 font-mono text-sm text-neutral-300">
									✓ {scores[ans.playerIdx].name}
								</li>
							))}
						</ul>
					</div>
				)}

				{isRoundComplete && (
					<div className="mt-6">
						<p className="mb-2 font-mono text-xs uppercase tracking-widest text-neutral-400">
							Answers this round
						</p>
						<ul className="space-y-2">
							{roundAnswers.map((ans) => {
								const p = scores[ans.playerIdx];
								const chosenEntry = choices.find((c) => c.id === ans.chosenId);
								return (
									<li
										key={ans.playerIdx}
										className={`flex items-center justify-between rounded-sm border px-3.5 py-2.5 font-mono text-sm ${
											ans.correct
												? 'border-emerald-600 text-emerald-500'
												: 'border-red-600 text-red-500'
										}`}>
										<span className="flex items-center gap-2 text-neutral-100">
											<span
												className="h-4 w-4 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]"
												style={{ backgroundColor: chosenEntry?.hex }}
											/>
											{p.name}
										</span>
										<span>{ans.correct ? 'Correct +1' : 'Wrong'}</span>
									</li>
								);
							})}
						</ul>

						<p className="mt-3 font-mono text-sm text-neutral-400">
							Answer: {currentEntry.manufacturer} {currentEntry.code}
							{currentEntry.name ? ` — ${currentEntry.name}` : ''} — {currentEntry.hex}
						</p>
					</div>
				)}

				{isRoundComplete && (
					<button onClick={nextRoundOrFinish} className="mt-5 w-full btn btn-primary">
						{roundNum >= totalRounds ? 'See final scores →' : 'Next round →'}
					</button>
				)}
			</section>
		);
	}

	// ---------- Final ----------
	const ranked = [...scores].sort((a, b) => b.score - a.score);
	return (
		<section className="container-max py-12">
			<div className="card p-16">
				<p className="mb-1 font-mono text-xs uppercase tracking-widest text-amber-400">Game over</p>
				<h2 className="mb-4 font-sans text-xl font-semibold uppercase tracking-wide text-neutral-100">
					Final scores
				</h2>
				<ol className="mb-6 space-y-2">
					{ranked.map((p, idx) => (
						<li
							key={p.name + idx}
							className={`flex justify-between rounded-sm border px-3.5 py-3 font-mono ${
								idx === 0
									? 'border-amber-400 text-amber-400'
									: 'border-neutral-700 text-neutral-100'
							}`}>
							<span>
								{idx === 0 ? '🏆 ' : ''}
								{p.name}
							</span>
							<span>
								{p.score} / {totalRounds}
							</span>
						</li>
					))}
				</ol>
				<button onClick={resetToSetup} className="w-full rounded-sm btn btn-primary">
					Play again
				</button>
			</div>
		</section>
	);
}
