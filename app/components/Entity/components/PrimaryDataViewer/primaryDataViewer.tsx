"use client"; // Ensure client-side rendering

import React, { useEffect, useState } from 'react';


import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";

import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

import {BlinkingDots, StyledSection} from "./primaryDataViewer.style";


interface PrimaryDataTableProps {
    data: any[];
    columns: any[];
  }
  
const PrimaryDataTable: React.FC<PrimaryDataTableProps> = ({ data, columns }) => {
   return (
     <Table data={data} columns={columns} />
    );
  };

interface PrimaryDataViewerProps {
    accessions: string[];
}

const columns = [
    { Header: "SRR", accessor: "accession" },
    { Header: "Layout", accessor: "library_layout" },
    { Header: "Platform", accessor: "instrument_platform" },
    { Header: "Model", accessor: "instrument_model" },
  ];


const renderPrimaryData = (data: Object[] | { count: number}, columns: { Header: string }[]): JSX.Element => {
    const renderRows = (data: Object[] | { count: number}, columns: { Header: string }[]): JSX.Element => {
        if ('count' in data && data.count > 0) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center', animation: 'flash 1s infinite' }}>
                            Too many entries: {data.count}
                        </td>
                    </tr>
                    <style jsx>{`
                        @keyframes flash {
                            0% { opacity: 1; }
                            50% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                    `}</style>
                </tbody>
            );
        }
        return (
            <tbody>
                {data.map((row: any, index: number) => (
                    <tr key={index}>
                        {columns.map((column, index) => (
                            <td key={index}>{row[column.accessor]}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        );
    };

    return (
        <table>
            <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th key={index}>{column.Header}</th>
                    ))}
                </tr>
            </thead>
            {renderRows(data, columns)}
        </table>
    );
};
export const PrimaryDataViewer = ({ accessions }: PrimaryDataViewerProps): JSX.Element => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const script = document.createElement("script");
                const response = await fetch(`http://127.0.0.1:3000/api/ena?accession=${accessions.join(',')}`);
                
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [accessions]);

    return (
        <FluidPaper>
            <GridPaper>
                <GridPaperSection> Primary Data</GridPaperSection>
                <StyledSection>
                    
                    <h2>Primary Data Viewer {accessions}</h2>
                    {data ? (
                        renderPrimaryData(data, columns)
                    ) : (
                        <p style={{ textAlign: 'center' }}>
                            <BlinkingDots>
                                Loading
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                            </BlinkingDots>
                        </p>
                    )}
                </StyledSection>
            </GridPaper>
        </FluidPaper>
    );
};

