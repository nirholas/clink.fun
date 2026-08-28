import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Launch from './pages/Launch';
import Token from './pages/Token';
import Portfolio from './pages/Portfolio';
import Docs from './pages/Docs';
import NotFound from './pages/NotFound';

export default function App() {
	return (
		<div className="flex min-h-full flex-col">
			<Header />
			<main className="flex-1">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/explore" element={<Explore />} />
					<Route path="/launch" element={<Launch />} />
					<Route path="/token/:address" element={<Token />} />
					<Route path="/portfolio" element={<Portfolio />} />
					<Route path="/docs" element={<Docs />} />
					<Route path="/docs/:section" element={<Docs />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</main>
			<Footer />
		</div>
	);
}
