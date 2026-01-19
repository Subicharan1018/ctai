import React, { createContext, useContext, useState } from 'react';
import { procurementService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const ProcurementContext = createContext();

export const ProcurementProvider = ({ children }) => {
    const [procurementData, setProcurementData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const runAnalysis = async (query) => {
        setIsLoading(true);
        setError(null);
        try {
            // For smoother UX, navigate immediately to budget page which will show loading state
            // or wait for response. Let's wait for response to ensure data is ready.
            const data = await procurementService.analyzeProcurement(query);
            setProcurementData(data);
            navigate('/budget', { state: { query } });
        } catch (err) {
            console.error("Analysis failed:", err);
            setError(err.message || "Failed to analyze project");
            // Optional: Show error toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProcurementContext.Provider value={{ procurementData, isLoading, error, runAnalysis }}>
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
