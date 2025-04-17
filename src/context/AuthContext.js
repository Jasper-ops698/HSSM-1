import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Use the library for decoding

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Combined Effect for Initial Load and Token Check
  useEffect(() => {
    console.log('AuthProvider Mounted - Checking Auth Status...');
    const storedToken = localStorage.getItem('token');
    const storedUserData = localStorage.getItem('userData');

    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        const currentTimeMs = Date.now();

        // Check if token is expired (exp is in seconds, currentTimeMs is in milliseconds)
        if (decodedToken.exp * 1000 < currentTimeMs) {
          console.warn("Stored token has expired.");
          logout(); // Clear expired token and user data
        } else {
          // Token is valid and not expired, try to load user data
          if (storedUserData) {
            try {
              const parsedUserData = JSON.parse(storedUserData);
              setUser(parsedUserData); // Set user state from localStorage
              console.log('User restored from localStorage:', parsedUserData);
            } catch (parseError) {
              console.error("Failed to parse stored user data:", parseError);
              logout(); // Clear data if user data is corrupted
            }
          } else {
            console.warn("Token found, but no user data found in localStorage. Logging out.");
            logout(); // Treat missing userData alongside a valid token as an inconsistent state
          }
        }
      } catch (error) {
        console.error("Error decoding stored token:", error);
        logout(); // Clear invalid token
      }
    } else {
      // No token found is the normal initial state for a logged-out user
      console.log("No token found in localStorage.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const login = (userData) => {
    const { token, user } = userData;

    // Debugging log for login data
    console.log('AuthProvider: login:', { token, user });

    // Save token and user data in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));

    // Update user state
    setUser(user);
  };

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;