import { useState } from 'react';

function Game() {
	const [phase] = useState('setup');
	const [players, setPlayerNames] = useState(['', '']);

	const [roundsPerPlayer, setRoundsPerPlayer] = useState(5);

	function updatePlayerName(idx: number, value: string) {
		setPlayerNames((prev) => prev.map((n, i) => (i === idx ? value : n)));
	}
	function addPlayerRow() {
		setPlayerNames((prev) => [...prev, '']);
	}
	function removePlayerRow(idx: number) {
		setPlayerNames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
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
					<button className="btn btn-primary mt-4" onClick={() => {}}>
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
	// 	return (
	// 		<section>
	// 			<div className="scoreboard">
	// 				{scores.map((p, idx) => (
	// 					<div className={'score-pill' + (idx === currentPlayerIdx ? ' active' : '')} key={idx}>
	// 						{p.name} <b>{p.score}</b>
	// 					</div>
	// 				))}
	// 			</div>

	// 			<div className="turn-indicator">
	// 				Round {roundNum} of {totalRounds} — <b>{scores[currentPlayerIdx]?.name}</b>'s turn
	// 			</div>

	// 			<div className="plate">
	// 				<div className="plate-row">
	// 					<span className="label">Manufacturer</span>
	// 					<span className="value">{currentEntry.manufacturer}</span>
	// 				</div>
	// 				<div className="plate-row">
	// 					<span className="label">Paint code</span>
	// 					<span className="value code">{currentEntry.code}</span>
	// 				</div>
	// 			</div>

	// 			<p className="helper-line">Tap the matching paint chip</p>

	// 			<div className="choices">
	// 				{choices.map((entry) => {
	// 					let cls = 'swatch';
	// 					if (answered) {
	// 						if (entry.hex.toLowerCase() === currentEntry.hex.toLowerCase()) cls += ' correct';
	// 						else if (entry.id === chosenId) cls += ' wrong';
	// 					}
	// 					return (
	// 						<button
	// 							key={entry.id}
	// 							className={cls}
	// 							style={{ '--c': entry.hex }}
	// 							disabled={answered}
	// 							onClick={() => handleAnswer(entry)}
	// 							aria-label="Paint chip option"
	// 						/>
	// 					);
	// 				})}
	// 			</div>

	// 			{answered && (
	// 				<div className={'feedback ' + (wasCorrect ? 'is-correct' : 'is-wrong')}>
	// 					{wasCorrect
	// 						? `Correct! ${currentEntry.manufacturer} ${currentEntry.code} is ${currentEntry.hex}.`
	// 						: `Not quite — ${currentEntry.manufacturer} ${currentEntry.code} is actually ${currentEntry.hex}.`}
	// 				</div>
	// 			)}

	// 			{answered && (
	// 				<button className="btn next-btn" onClick={handleNext}>
	// 					{roundNum >= totalRounds ? 'See final scores →' : 'Next round →'}
	// 				</button>
	// 			)}
	// 		</section>
	// 	);
	// }

	// // final
	// const ranked = [...scores].sort((a, b) => b.score - a.score);
	// return (
	// 	<section className="card">
	// 		<p className="eyebrow">Game over</p>
	// 		<h2>Final scores</h2>
	// 		<ol className="final-list">
	// 			{ranked.map((p, idx) => (
	// 				<li key={p.name + idx}>
	// 					<span>
	// 						{idx === 0 ? '🏆 ' : ''}
	// 						{p.name}
	// 					</span>
	// 					<span>
	// 						{p.score} / {roundsPerPlayer}
	// 					</span>
	// 				</li>
	// 			))}
	// 		</ol>
	// 		<button className="btn" onClick={resetToSetup}>
	// 			Play again
	// 		</button>
	// 	</section>
	// );
	return <></>;
}

export default Game;
