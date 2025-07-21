import React from 'react';
import './App.css';
import { StoryDataProvider, useStoryData } from './contexts/StoryDataContext';
import { MainLayout } from './components/MainLayout';
import { Sidebar } from './components/Sidebar';

const AppContent = () => {
    const { storyData, error, setError } = useStoryData();

    if (!storyData) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-3">
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>YAML Parse Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}
            <div className="row">
                <MainLayout />
                <Sidebar />
            </div>
        </div>
    );
}

const App = () => {
    return (
        <StoryDataProvider>
            <AppContent />
        </StoryDataProvider>
    );
};

export default App;

