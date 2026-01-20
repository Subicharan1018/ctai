import React, { createContext, useContext, useState, useEffect } from 'react';
import { procurementService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const ProcurementContext = createContext();

export const ProcurementProvider = ({ children }) => {
    const [procurementData, setProcurementData] = useState(JSON.parse(localStorage.getItem('procurementData')) || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Auth State
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    // Chat State
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);

    // Persist procurementData whenever it changes (optional, but good for safety)
    useEffect(() => {
        if (procurementData) {
            localStorage.setItem('procurementData', JSON.stringify(procurementData));
        }
    }, [procurementData]);

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('http://localhost:5001/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Clear procurement data on logout? Often desired.
        setProcurementData(null);
        localStorage.removeItem('procurementData');

        setConversations([]);
        setCurrentConversationId(null);
        navigate('/');
    };

    const runAnalysis = async (query) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await procurementService.analyzeProcurement(query);
            setProcurementData(data);
            localStorage.setItem('procurementData', JSON.stringify(data));
            navigate('/budget', { state: { query } });
        } catch (err) {
            console.error("Analysis failed:", err);
            setError(err.message || "Failed to analyze project");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProcurementContext.Provider value={{
            procurementData,
            isLoading,
            error,
            runAnalysis,
            user,
            login,
            register,
            logout,
            conversations,
            setConversations,
            currentConversationId,
            setCurrentConversationId
        }}>
            {children}
        </ProcurementContext.Provider>
    );
};

export const useProcurement = () => {
    const context = useContext(ProcurementContext);
    if (!context) {
        throw new Error('useProcurement must be used within a ProcurementProvider');
    }
    return context;
};
