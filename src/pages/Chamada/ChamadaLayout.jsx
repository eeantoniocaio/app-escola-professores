import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChamadaProvider } from './context/ChamadaContext';

export default function ChamadaLayout() {
    return (
        <ChamadaProvider>
            <Outlet />
        </ChamadaProvider>
    );
}
