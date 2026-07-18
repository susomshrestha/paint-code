import { Link, NavLink } from 'react-router';

function NavBar() {
	return (
		<header className="bg-zinc-900">
			<div className="max-w-7xl flex justify-between items-center p-5 mx-auto">
				<Link to="/" className="text-white text-3xl font-bold sm:flex sm:justify-center sm:items-end">
					<div>
						Paint<span className="text-amber-400 pl-2">Code</span>
					</div>
					<div className="text-sm text-zinc-400 pt-2 sm:pt-0 sm:pl-4 font-normal mb-1">Guess the colour</div>
				</Link>
				<nav className="nav-tabs text-zinc-400 text-base flex font-semibold">
					<NavLink
						className={({ isActive }) =>
							`py-2 px-4 ${isActive ? 'bg-zinc-800 text-amber-400' : 'hover:text-amber-400'}`
						}
						to="/">
						Play
					</NavLink>
					{/* <NavLink
						to="/add"
						className={({ isActive }) =>
							`py-2 px-4 ${isActive ? 'bg-zinc-800 text-amber-400' : 'hover:text-amber-400'}`
						}>
						Add codes
					</NavLink> */}
				</nav>
			</div>
		</header>
	);
}

export default NavBar;
