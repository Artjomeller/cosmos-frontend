import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    // Existing states
    const [selectedFrom, setSelectedFrom] = useState('');
    const [selectedTo, setSelectedTo] = useState('');
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('price');
    const [bookings, setBookings] = useState([]);
    const [isBookingHistoryLoading, setIsBookingHistoryLoading] = useState(false);
    const [bookingHistoryError, setBookingHistoryError] = useState('');
    const [showBookingHistory, setShowBookingHistory] = useState(false);

    // Auth states (Only new addition)
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState('login');
    const [authError, setAuthError] = useState('');

    // Check auth on load
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    // Auth handlers
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');

        try {
            const response = await fetch(`http://localhost:3002/auth/${authMode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            if (authMode === 'register') {
                setAuthMode('login');
                setAuthError('Registration successful! Please login.');
                setUsername('');
                setPassword('');
                return;
            }

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                setIsAuthenticated(true);
                setShowAuthPopup(false);
                setUsername('');
                setPassword('');
            }
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
    };

    // Existing code starts here
    useEffect(() => {
        document.title = `Cosmos Odyssey ${selectedFrom && selectedTo
            ? `- ${selectedFrom} to ${selectedTo}`
            : ''}`;
    }, [selectedFrom, selectedTo]);

    const validRoutes = {
        'Mercury': ['Venus'],
        'Venus': ['Earth', 'Mercury'],
        'Earth': ['Jupiter', 'Uranus'],
        'Mars': ['Venus'],
        'Jupiter': ['Venus', 'Mars'],
        'Saturn': ['Earth', 'Neptune'],
        'Uranus': ['Saturn', 'Neptune'],
        'Neptune': ['Uranus', 'Mercury']
    };

    const sourcePlanets = Object.keys(validRoutes);

    const fetchTravelOffers = async () => {
        if (!selectedFrom || !selectedTo) return;

        try {
            setIsLoading(true);
            setError('');

            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams({
                from: selectedFrom,
                to: selectedTo
            });

            const response = await fetch(`http://localhost:3002/travel-offers?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch offers');
            }

            const data = await response.json();
            const offersWithPricelistId = data.offers.map(offer => ({
                ...offer,
                pricelistId: data.pricelistId
            }));

            const sortedOffers = offersWithPricelistId.sort((a, b) => {
                if (sortBy === 'price') return a.price - b.price;
                return a.travelTime - b.travelTime;
            });

            setOffers(sortedOffers || []);
        } catch (error) {
            console.error('Error fetching offers:', error);
            setError(error.message);
            setOffers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookingHistory = async () => {
        try {
            setIsBookingHistoryLoading(true);
            setBookingHistoryError('');

            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:3002/booking-history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch booking history');
            }

            const data = await response.json();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error('Error fetching booking history:', error);
            setBookingHistoryError(error.message);
            setBookings([]);
        } finally {
            setIsBookingHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedFrom && selectedTo && isAuthenticated) {
            fetchTravelOffers();
        }
    }, [selectedFrom, selectedTo, sortBy, isAuthenticated]);

    const formatDuration = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const handleBooking = async (event) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.target);
            const token = localStorage.getItem('authToken');

            const response = await fetch('http://localhost:3002/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    offer: selectedOffer,
                    pricelistId: selectedOffer.pricelistId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Booking failed');
            }

            alert('Booking confirmed successfully!');
            event.target.reset();
            setSelectedOffer(null);
            setSelectedFrom('');
            setSelectedTo('');
            setOffers([]);

            if (showBookingHistory) {
                fetchBookingHistory();
            }
        } catch (error) {
            alert('Failed to create booking: ' + error.message);
        }
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>Cosmos Odyssey</h1>
                <div className="auth-buttons">
                    {!isAuthenticated ? (
                        <button onClick={() => setShowAuthPopup(true)}>
                            Login / Register
                        </button>
                    ) : (
                        <button onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </div>

            {/* Auth Popup */}
            {showAuthPopup && (
                <div className="auth-popup">
                    <div className="auth-content">
                        <button className="close-auth" onClick={() => setShowAuthPopup(false)}>×</button>
                        <div className="auth-header">
                            <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
                        </div>
                        {authError && <div className="auth-error">{authError}</div>}
                        <form onSubmit={handleAuth} className="auth-form">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="submit">
                                {authMode === 'login' ? 'Login' : 'Register'}
                            </button>
                        </form>
                        <div className="auth-switch">
                            <button onClick={() => {
                                setAuthMode(authMode === 'login' ? 'register' : 'login');
                                setAuthError('');
                            }}>
                                {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Only show if authenticated */}
            {isAuthenticated ? (
                <>
                    <div className="booking-history-toggle">
                        <button onClick={() => {
                            setShowBookingHistory(!showBookingHistory);
                            if (!showBookingHistory) {
                                fetchBookingHistory();
                            }
                        }}>
                            {showBookingHistory ? 'Hide Booking History' : 'Show Booking History'}
                        </button>
                    </div>

                    {showBookingHistory && (
                        <div className="booking-history-container">
                            <h2>Booking History</h2>
                            {isBookingHistoryLoading ? (
                                <div className="loading">Loading booking history...</div>
                            ) : bookingHistoryError ? (
                                <div className="error-message">{bookingHistoryError}</div>
                            ) : bookings.length > 0 ? (
                                bookings.map((booking, index) => (
                                    <div
                                        key={booking.id || index}
                                        className="offer"
                                    >
                                        <h3>{booking.firstName} {booking.lastName}</h3>
                                        <div className="offer-details">
                                            <p>Route: {booking.route}</p>
                                            <p>Provider: {booking.provider}</p>
                                            <p>Price: ${booking.price.toFixed(2)}</p>
                                            <p>Departure: {new Date(booking.flightStart).toLocaleString()}</p>
                                            <p>Arrival: {new Date(booking.flightEnd).toLocaleString()}</p>
                                            <p>
                                                Travel Time: {formatDuration(
                                                new Date(booking.flightEnd) - new Date(booking.flightStart)
                                            )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div>No booking history found.</div>
                            )}
                        </div>
                    )}

                    <div className="route-selection">
                        <div className="select-group">
                            <label>Starting Point: </label>
                            <select
                                value={selectedFrom}
                                onChange={(e) => {
                                    setSelectedFrom(e.target.value);
                                    setSelectedTo('');
                                    setSelectedOffer(null);
                                    setOffers([]);
                                }}
                            >
                                <option value="">Select Planet</option>
                                {sourcePlanets.map(planet => (
                                    <option key={planet} value={planet}>{planet}</option>
                                ))}
                            </select>
                        </div>

                        <div className="select-group">
                            <label>Destination: </label>
                            <select
                                value={selectedTo}
                                onChange={(e) => {
                                    setSelectedTo(e.target.value);
                                    setSelectedOffer(null);
                                }}
                                disabled={!selectedFrom}
                            >
                                <option value="">Select Planet</option>
                                {validRoutes[selectedFrom]?.map(planet => (
                                    <option key={planet} value={planet}>{planet}</option>
                                ))}
                            </select>
                        </div>

                        {offers.length > 0 && (
                            <div className="sort-control">
                                <label>Sort by: </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="price">Price</option>
                                    <option value="time">Travel Time</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {isLoading ? (
                        <div className="loading">Loading travel offers...</div>
                    ) : (
                        <div className="content-container">
                            <div className="offers-list">
                                {offers.length > 0 ? (
                                    offers.map((offer, index) => (
                                        <div
                                            key={index}
                                            className={`offer ${selectedOffer === offer ? 'selected' : ''}`}
                                            onClick={() => setSelectedOffer(offer)}
                                        >
                                            <div className="offer-header">
                                                <h3>
                                                    {offer.routeInfo.from.name} → {offer.routeInfo.to.name}
                                                </h3>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOffer(offer);
                                                }}>
                                                    Select Route
                                                </button>
                                            </div>
                                            <div className="offer-details">
                                                <p>Provider: {offer.provider}</p>
                                                <p>Price: ${offer.price.toFixed(2)}</p>
                                                <p>Travel Time: {formatDuration(offer.travelTime)}</p>
                                                <p>Departure: {new Date(offer.flightStart).toLocaleString()}</p>
                                                <p>Arrival: {new Date(offer.flightEnd).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    selectedFrom && selectedTo && !isLoading &&
                                    <div>No offers available for this route</div>
                                )}
                            </div>

                            {selectedOffer && (
                                <div className="booking-form">
                                    <h2>Booking Form</h2>
                                    <form onSubmit={handleBooking}>
                                        <div className="form-group">
                                            <label>First Name:</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name:</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                required
                                            />
                                        </div>
                                        <div className="booking-summary">
                                            <h3>Selected Route Details:</h3>
                                            <p>From: {selectedOffer.routeInfo.from.name}</p>
                                            <p>To: {selectedOffer.routeInfo.to.name}</p>
                                            <p>Provider: {selectedOffer.provider}</p>
                                            <p>Price: ${selectedOffer.price.toFixed(2)}</p>
                                            <p>Travel Time: {formatDuration(selectedOffer.travelTime)}</p>
                                            <p>Departure: {new Date(selectedOffer.flightStart).toLocaleString()}</p>
                                            <p>Arrival: {new Date(selectedOffer.flightEnd).toLocaleString()}</p>
                                        </div>
                                        <button type="submit">
                                            Confirm Booking
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="login-message">
                    Please login to access the booking system
                </div>
            )}
        </div>
    );
}

export default App;