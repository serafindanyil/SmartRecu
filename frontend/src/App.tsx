import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import "./App.css";
import HomePage from "./pages/HomePage";
import Header from "./components/Header/Header";
import Navigation from "./components/Navigation/Navigation";

function App() {
	return (
		<Router>
			<div className="relative">
				<Header className="container mt-2 mb-8" />
				<Routes>
					<Route path="/" element={<Navigate to="/home" replace />} />
					<Route path="/home" element={<HomePage />} />
				</Routes>
				<Navigation className="fixed bottom-10 left-1/2 -translate-x-1/2 inline-flex z-10" />
			</div>
		</Router>
	);
}

export default App;
