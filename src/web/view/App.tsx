import React, { useState } from 'react';
import './App.css';
import { StoryDataProvider, useStoryData } from './contexts/StoryDataContext';
import { UIStateProvider } from './contexts/UIStateContext';
import { MainLayout } from './components/MainLayout';
import { Sidebar } from './components/Sidebar';
import { SidebarContent } from './components/SidebarContent';
import { ResizableBox } from 'react-resizable';

const AppContent = () => {
    const { state, dispatch } = useStoryData();
    const { storyData, error } = state;
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
        <div className={`appContainer container-fluid mt-3 d-flex flex-column`}>
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>YAML Parse Error:</strong> {error}
                    <button type="button" className="btn-close" onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} aria-label="Close"></button>
                </div>
            )}
            <div className="contentWrapper">
                <MainLayout />
                <ResizableBox
                    width={sidebarWidth}
                    height={Infinity}
                    axis="x"
                    minConstraints={[300, Infinity]}
                    maxConstraints={[800, Infinity]}
                    onResize={(e, data) => setSidebarWidth(data.size.width)}
                    className="resizableBox"
                    resizeHandles={['w']}
                >
                    <Sidebar>
                        <SidebarContent />
                    </Sidebar>
                </ResizableBox>
            </div>
        </div>
    );
}

const App = () => {
    return (
        <StoryDataProvider>
            <UIStateProvider>
                <AppContent />
            </UIStateProvider>
        </StoryDataProvider>
    );
};

export default App;

