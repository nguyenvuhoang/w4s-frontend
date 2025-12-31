'use client';

import { controlGroups } from '@/@core/components/formcontrol/controlslist';
import { JSX, useState } from 'react';
import { useDrag } from 'react-dnd';

const ControlItem = ({ id, icon, label }: { id: string; icon: JSX.Element; label: string }) => {
    const [, drag] = useDrag(() => ({
        type: 'CONTROL',
        item: { id, label },
    }));

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f1f1f1',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'grab',
                textAlign: 'left',
                justifyContent: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#139556')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#ccc')}
        >
            {icon}
            <span>{label}</span>
        </div>
    );
};

const SidebarControls = () => {
    // Initialize all panels as expanded
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPanels, setExpandedPanels] = useState<string[]>(
        controlGroups.map((group) => group.title) // Expand all panels by default
    );

    const togglePanel = (title: string) => {
        setExpandedPanels((prev) =>
            prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
        );
    };

    const filteredGroups = controlGroups.map((group) => ({
        ...group,
        controls: group.controls.filter((control) =>
            control.label.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    }));

    return (
        <aside
            style={{
                width: '400px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '16px',
                backgroundColor: '#f9f9f9',
                overflowY: 'auto',
            }}
        >
            <h3 style={{ color: '#139556', marginBottom: '16px' }}>Fields</h3>

            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="Search fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        fontFamily: 'Quicksand'
                    }}
                />
            </div>

            {/* Expandable Panels */}
            {filteredGroups.map((group, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '16px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            backgroundColor: '#139556',
                            color: '#fff',
                            cursor: 'pointer',
                            borderRadius: '5px 5px 0 0',
                        }}
                        onClick={() => togglePanel(group.title)}
                    >
                        <h4 style={{ margin: 0 }}>{group.title}</h4>
                        <span>{expandedPanels.includes(group.title) ? '−' : '+'}</span>
                    </div>
                    {expandedPanels.includes(group.title) && (
                        <div
                            style={{
                                padding: '8px',
                                backgroundColor: '#fff',
                                borderRadius: '0 0 5px 5px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                            }}
                        >
                            {group.controls.map((control) => (
                                <ControlItem
                                    key={control.id}
                                    id={control.id}
                                    icon={control.icon}
                                    label={control.label}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </aside>
    );
};

export default SidebarControls;
