import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import "./App.css";
import Header from "./components/Header/Header";
import Navigation from "./components/Navigation/Navigation";

import HomePage from "./pages/HomePage";
import StatisticsPage from "./pages/StatisticsPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
	return (
		<Router>
			<div className="relative">
				<Header className="container" />
				<main className="container">
					<Routes>
						<Route path="/" element={<Navigate to="/home" replace />} />
						<Route path="/home" element={<HomePage />} />
						<Route path="/statistics" element={<StatisticsPage />} />
						<Route path="/settings" element={<SettingsPage />} />
					</Routes>
					<Navigation className="fixed bottom-10 left-1/2 -translate-x-1/2 inline-flex z-10" />
				</main>
			</div>
		</Router>
	);
}

export default App;
