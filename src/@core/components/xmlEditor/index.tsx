'use client';

import { Box } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React, { useEffect, useState } from 'react';

type XMLEditorProps = {
    initialXml: string | Document; // Có thể nhận chuỗi hoặc Document
    onChange: (updatedXml: string) => void;
};

const XMLEditorComponent: React.FC<XMLEditorProps> = ({ initialXml, onChange }) => {
    const [treeData, setTreeData] = useState<any[]>([]);

    useEffect(() => {
        const parseXmlToTree = (xml: string | Document): any[] => {
            if (typeof xml === 'string') {
                const parser = new DOMParser();
                xml = parser.parseFromString(xml, 'text/xml');
            }

            const convertXmlToTree = (node: Element): any => {
                const children = Array.from(node.children).map(convertXmlToTree);
                return {
                    id: node.nodeName + Math.random(), 
                    name: node.nodeName,
                    content: node.textContent?.trim() || null,
                    attributes: Array.from(node.attributes).map((attr) => ({
                        name: attr.name,
                        value: attr.value,
                    })),
                    children,
                };
            };

            return [convertXmlToTree(xml.documentElement)];
        };

        if (initialXml) {
            setTreeData(parseXmlToTree(initialXml));
        }
    }, [initialXml]);

    const renderTree = (nodes: any) => (
        <TreeItem
            itemId={nodes.id}
            key={nodes.id}
            label={
                <Box>
                    <strong>{nodes.name}</strong>
                    {nodes.attributes?.length > 0 && (
                        <span>
                            {' '}
                            {nodes.attributes.map(
                                (attr: any) => `${attr.name}="${attr.value}" `
                            )}
                        </span>
                    )}
                    {nodes.content && <em>: {nodes.content}</em>}
                </Box>
            }
        >
            {nodes.children?.map((node: any) => renderTree(node))}
        </TreeItem>
    );

    return (
        <Box sx={{ width: '100%', height: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', backgroundColor: '#f9f9f9' }}>
            <SimpleTreeView
                sx={{ fontFamily: 'monospace' }}
            >
                {treeData.map((node) => renderTree(node))}
            </SimpleTreeView>
        </Box>
    );
};

export default XMLEditorComponent;
