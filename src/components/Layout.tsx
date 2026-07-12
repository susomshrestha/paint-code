import { Outlet } from 'react-router';
import NavBar from './Navbar';

function Layout() {
	return (
		<div className="mx-auto bg-zinc-900">
			<NavBar />
			<div>
				<Outlet />
			</div>
		</div>
	);
}

export default Layout;
