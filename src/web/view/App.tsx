import React, { useState } from 'react';
import './App.css';
import { StoryDataProvider, useStoryData } from './contexts/StoryDataContext';
import { MainLayout } from './components/MainLayout';
import { Sidebar } from './components/Sidebar';
import { ResizableBox } from 'react-resizable';

const AppContent = () => {
    const { storyData, error, setError } = useStoryData();
    const [sidebarWidth, setSidebarWidth] = useState(500);

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
        <div className="container-fluid mt-3 d-flex flex-column" style={{ height: 'calc(100vh - 1rem)' }}>
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>YAML Parse Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}
            <div className="d-flex" style={{ overflowY: 'hidden', flexWrap: 'nowrap' }}>
                <MainLayout />
                <ResizableBox
                    width={sidebarWidth}
                    height={Infinity}
                    axis="x"
                    minConstraints={[300, Infinity]}
                    maxConstraints={[800, Infinity]}
                    onResize={(e, data) => setSidebarWidth(data.size.width)}
                    className="resizable-box"
                    resizeHandles={['w']}
                >
                    <Sidebar />
                </ResizableBox>
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

