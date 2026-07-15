import { Route, Routes } from 'react-router';
import './App.css';
import Game from './pages/Game';
import Add from './pages/Add';
import Layout from './components/Layout';

function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route index element={<Game />} />
				<Route path="add" element={<Add />} />
			</Route>
		</Routes>
	);
}

export default App;
