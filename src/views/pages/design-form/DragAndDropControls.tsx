'use client';

import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const Control = ({ id, label }: { id: string; label: string }) => {
    const [, drag] = useDrag(() => ({
        type: 'CONTROL',
        item: { id, label },
    })) as unknown as [unknown, React.Ref<HTMLDivElement>];

    return (
        <div
            ref={drag}
            style={{
                padding: '8px 16px',
                margin: '4px 0',
                background: '#139556',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'grab',
            }}
        >
            {label}
        </div>
    );
};

const ViewDropZone = ({ id, onDrop }: { id: string; onDrop: (control: any) => void }) => {
    const [, drop] = useDrop({
        accept: 'CONTROL',
        drop: (item) => onDrop(item),
    }) as unknown as [unknown, React.Ref<HTMLDivElement>];

    return (
        <div
            ref={drop}
            style={{
                height: '100%',
                border: '2px dashed #ccc',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}
        >
            Drop controls here in {id}
        </div>
    );
};

const DragAndDropControls = ({ views }: { views: any[] }) => {
    const [controls, setControls] = useState<{ id: string; label: string }[]>([]);

    const handleDrop = (viewId: string, control: any) => {
        setControls((prev) => [...prev, { ...control, viewId }]);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Sidebar Controls */}
                <div>
                    <h3>Controls</h3>
                    <Control id="textInput" label="Text Input" />
                    <Control id="button" label="Button" />
                    <Control id="checkbox" label="Checkbox" />
                </div>

                {/* Views */}
                <div style={{ flex: 1 }}>
                    {views.map((view) => (
                        <div
                            key={view.i}
                            style={{
                                marginBottom: '16px',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                            }}
                        >
                            <ViewDropZone id={view.i} onDrop={(control) => handleDrop(view.i, control)} />
                        </div>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

export default DragAndDropControls;
