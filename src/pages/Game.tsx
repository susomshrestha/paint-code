/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';

const INITIAL_ENTRIES = [
	{ id: 'p001', manufacturer: 'Toyota', code: '040', name: 'Super White', hex: '#F0F1ED' },
	{
		id: 'p002',
		manufacturer: 'Honda',
		code: 'NH731P',
		name: 'Crystal Black Pearl',
		hex: '#0B0B0C',
	},
	{ id: 'p003', manufacturer: 'Ford', code: 'UA', name: 'Oxford White', hex: '#F2F1E8' },
	{ id: 'p004', manufacturer: 'Chevrolet', code: 'GBA', name: 'Summit White', hex: '#EFEEE7' },
	{ id: 'p005', manufacturer: 'BMW', code: '300', name: 'Alpine White', hex: '#E9EBED' },
	{
		id: 'p006',
		manufacturer: 'Mercedes-Benz',
		code: '040',
		name: 'Obsidian Black',
		hex: '#111213',
	},
	{ id: 'p007', manufacturer: 'Nissan', code: 'K23', name: 'Gun Metallic', hex: '#5B5E62' },
	{ id: 'p008', manufacturer: 'Mazda', code: '46V', name: 'Soul Red Crystal', hex: '#8C1D22' },
	{ id: 'p009', manufacturer: 'Volkswagen', code: 'LC9X', name: 'Pure White', hex: '#EDEEEA' },
	{ id: 'p010', manufacturer: 'Audi', code: 'LY7W', name: 'Ibis White', hex: '#EAEAE4' },
	{ id: 'p011', manufacturer: 'Kia', code: 'ABP', name: 'Aurora Black Pearl', hex: '#161616' },
	{ id: 'p012', manufacturer: 'Hyundai', code: 'S3U', name: 'Shimmering Silver', hex: '#A9ACAE' },
	{ id: 'p013', manufacturer: 'Subaru', code: 'K1X', name: 'WR Blue Pearl', hex: '#1C3D7C' },
	{ id: 'p014', manufacturer: 'Tesla', code: 'PPMR', name: 'Multi-Coat Red', hex: '#A6120D' },
];

interface Score {
	name: string;
	score: number;
}

interface Entry {
	id: string;
	manufacturer: string;
	code: string;
	hex: string;
}

function shuffledCopy(arr: any) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function Game() {
	const [entries] = useState(INITIAL_ENTRIES);
	const [phase, setPhase] = useState('setup');
	const [players, setPlayerNames] = useState(['Player 1', 'Player 2']);

	const [roundsPerPlayer, setRoundsPerPlayer] = useState(5);

	const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
	const [scores, setScores] = useState<Score[]>([]);
	const [totalRounds, setTotalRounds] = useState(0);
	const [roundNum, setRoundNum] = useState(0);
	const [currentEntry, setCurrentEntry] = useState<Entry>({
		id: '',
		manufacturer: '',
		code: '',
		hex: '',
	});
	const [choices, setChoices] = useState<any>([]);
	const [answered, setAnswered] = useState(false);
	const [chosenId, setChosenId] = useState<string | null>(null);
	const [questionQueue, setQuestionQueue] = useState<[]>([]);

	// useEffect(() => {
	// 	loadViaFetch()
	// 		.then((data) => {
	// 			if (!Array.isArray(data) || data.length < 2) {
	// 				throw new Error('data.json needs at least 2 entries to play.');
	// 			}
	// 			setEntries(data);
	// 		})
	// 		.catch((err) => setLoadError(err.message));
	// }, []);

	const drawQuestion = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(queue: any) => {
			let q = queue;
			if (q.length === 0) q = shuffledCopy(entries);
			const entry = q[q.length - 1];
			return { entry, rest: q.slice(0, -1) };
		},
		[entries],
	);

	function updatePlayerName(idx: number, value: string) {
		setPlayerNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
	}
	function addPlayerRow() {
		setPlayerNames((prev) => [...prev, '']);
	}
	function removePlayerRow(idx: number) {
		setPlayerNames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
	}

	function buildChoices(entry: Entry) {
		const numChoices = Math.min(4, entries.length);
		const pool = shuffledCopy(entries.filter((e: Entry) => e.id !== entry.id));
		const distractors = [];
		const usedHex = new Set([entry.hex.toLowerCase()]);
		for (const e of pool) {
			if (distractors.length >= numChoices - 1) break;
			if (usedHex.has(e.hex.toLowerCase())) continue;
			usedHex.add(e.hex.toLowerCase());
			distractors.push(e);
		}
		return shuffledCopy([entry, ...distractors]);
	}

	function handleAnswer(entry: Entry) {
		if (answered) return;
		setAnswered(true);
		setChosenId(entry.id);
		const correct = entry.id === currentEntry.id;
		if (correct) {
			setScores((prev) =>
				prev.map((p, idx) => (idx === currentPlayerIdx ? { ...p, score: p.score + 1 } : p)),
			);
		}
	}

	function handleNext() {
		const nextPlayerIdx = (currentPlayerIdx + 1) % scores.length;
		setCurrentPlayerIdx(nextPlayerIdx);
		if (roundNum >= totalRounds) {
			setPhase('final');
			return;
		}
		startRound(questionQueue, roundNum + 1);
	}

	function startRound(queue: [], nextRoundNum: number) {
		const { entry, rest } = drawQuestion(queue);
		setCurrentEntry(entry);
		setChoices(buildChoices(entry));
		setQuestionQueue(rest);
		setRoundNum(nextRoundNum);
		setAnswered(false);
		setChosenId(null);
	}

	function startGame() {
		const names = players.map((n) => n.trim()).filter(Boolean);
		if (names.length === 0) {
			alert('Add at least one player name.');
			return;
		}
		setScores(names.map((name) => ({ name, score: 0 })));
		setTotalRounds(names.length * roundsPerPlayer);
		setPhase('round');
		startRound([], 1);
	}

	function resetToSetup() {
		setPhase('setup');
	}

	if (phase === 'setup') {
		return (
			<div className="container-max py-12">
				<section className="card p-16">
					<p className="text-amber-400 text-xl font-semibold">New game</p>
					<h2 className="text-zinc-200 text-4xl font-bold my-4">Who's playing?</h2>

					{players.map((name, idx) => (
						<div className="player-row py-2 flex" key={idx}>
							<input
								type="text"
								placeholder="Player name"
								value={name}
								className="input w-full mr-2"
								onChange={(e) => updatePlayerName(idx, e.target.value)}
							/>
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => removePlayerRow(idx)}
								title="Remove player">
								×
							</button>
						</div>
					))}
					<button type="button" className="btn btn-ghost mt-4" onClick={addPlayerRow}>
						+ Add player
					</button>

					<div className="text-zinc-200 text-xl my-4">
						<div>Rounds per player</div>
						<div className="flex justify-between gap-2 mt-4">
							{[3, 5, 10].map((n) => (
								<button
									key={n}
									type="button"
									className={`btn btn-ghost bg-zinc-800 w-full ${roundsPerPlayer === n ? 'border-amber-400 text-amber-400' : ''}`}
									onClick={() => setRoundsPerPlayer(n)}>
									{n}
								</button>
							))}
						</div>
					</div>

					{/* <button className="btn" onClick={startGame} disabled={!!loadError || entries.length === 0}> */}
					<button className="btn btn-primary mt-4" onClick={startGame}>
						Start game
					</button>

					{/* {loadError && (
					<div className="error-box">
						Could not load data.json — {loadError}. If you're running this locally, make sure the
						dev server is up (<code>npm run dev</code>); on a fresh clone, check that
						<code> public/data.json</code> exists.
					</div>
				)} */}
				</section>
			</div>
		);
	}

	// if (phase === 'round' && currentEntry) {
	if (phase === 'round' && currentEntry) {
		return (
			<section className="container-max py-12 px-6 text-zinc-400">
				<div className="flex flex-wrap gap-6 mb-4">
					{scores.map((p, idx) => (
						<div
							key={idx}
							className={`text-lg font-semibold border-b-2 border-solid pb-1 ${
								idx === currentPlayerIdx ? 'text-amber-400 border-amber-400' : 'border-transparent'
							}`}>
							{p.name} : <b>{p.score}</b>
						</div>
					))}
				</div>

				<div className="text-center mb-4">
					Round {roundNum} of {totalRounds} —{' '}
					<b className="text-zinc-100">{scores[currentPlayerIdx]?.name}</b>'s turn
				</div>

				<div className="card p-8">
					<div className="flex justify-between items-baseline pb-4 mb-4 border-b-2 border-dashed border-b-zinc-400">
						<span className="">Manufacturer</span>
						<span className="text-zinc-100 text-2xl">{currentEntry.manufacturer}</span>
					</div>
					<div className="flex justify-between items-baseline mb-8">
						<span className="">Paint code</span>
						<span className="text-amber-400 text-2xl min-h-">{currentEntry.code}</span>
					</div>
				</div>

				<p className="my-4 text-center">Tap the matching paint chip</p>

				<div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
					{choices.map((entry: any) => {
						let cls =
							'relative min-h-32 rounded-[2px_10px_2px_2px] border-none cursor-pointer bg-[var(--c)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25),0_6px_14px_rgba(0,0,0,0.35)] transition-transform duration-100 ease-out';
						if (answered) {
							if (entry.hex.toLowerCase() === currentEntry.hex.toLowerCase())
								cls += ' shadow-[0_0_0_3px_rgba(0,0,0,0.35)] ring-3 ring-green-400';
							else if (entry.id === chosenId)
								cls += ' shadow-[0_0_0_3px_rgba(0,0,0,0.35)] ring-3 ring-red-400';
						}
						return (
							<button
								key={entry.id}
								style={{ backgroundColor: entry.hex }}
								className={cls}
								disabled={answered}
								onClick={() => handleAnswer(entry)}
								aria-label="Paint chip option"
							/>
						);
					})}
				</div>

				{/* {answered && (
					<div className={'feedback ' + (wasCorrect ? 'is-correct' : 'is-wrong')}>
						{wasCorrect
							? `Correct! ${currentEntry.manufacturer} ${currentEntry.code} is ${currentEntry.hex}.`
							: `Not quite — ${currentEntry.manufacturer} ${currentEntry.code} is actually ${currentEntry.hex}.`}
					</div>
				)} */}

				{answered && (
					<button className="btn btn-primary mt-8" onClick={handleNext}>
						{roundNum >= totalRounds ? 'See final scores →' : 'Next round →'}
					</button>
				)}
			</section>
		);
	}

	// // final
	const ranked = [...scores].sort((a, b) => b.score - a.score);
	return (
		<section className="container-max py-12 px-5">
			<div className='card text-zinc-400 p-8'>
				<p className="text-amber-400">Game over</p>
				<p className='text-2xl text-zinc-200'>Final scores</p>
				<ol className="list-none mt-4">
					{ranked.map((p, idx) => (
						<li className='flex justify-between p-4 border-2 border-solid border-zinc-400 mb-4 first:border-amber-400 first:text-amber-400' key={p.name + idx}>
							<span>
								{idx === 0 ? '🏆 ' : ''}
								{p.name}
							</span>
							<span>
								{p.score} / {roundsPerPlayer}
							</span>
						</li>
					))}
				</ol>
				<button className="btn btn-primary mt-4" onClick={resetToSetup}>
					Play again
				</button>
			</div>
		</section>
	);
	return <></>;
}

export default Game;
