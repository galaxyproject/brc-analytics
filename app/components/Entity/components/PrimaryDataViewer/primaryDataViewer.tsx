"use client"; // Ensure client-side rendering

import React, { useEffect, useState } from 'react';


import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";

import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";

import {BlinkingDots, StyledSection} from "./primaryDataViewer.style";
import { Fragment } from 'react';
import { RUN_FILTER_CATEGORIES } from "../../../../../site-config/brc-analytics/runFilterCategories";
import { config } from 'process';
import { validate } from 'validate.js';


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


// const renderFilterSection = (accessions: String[]): JSX.Element => {
//     const accessionsString = accessions.map((item) => `accesions=${item}`).join(' OR ');
//     return (
//         <input type="text" placeholder="Enter filter criteria" value={accessionsString} />
//     );
// };

const renderPrimaryData = (data: Object[] | { count: number}, columns: { Header: string }[]): JSX.Element => {
    const renderRows = (data: Object[] | { count: number}, columns: { Header: string }[]): JSX.Element => {
        if(!data) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center', animation: 'flash 1s infinite' }}>
                            <p style={{ color: 'red', fontWeight: 'bold' }}>Unknown error!!!</p>
                        </td>
                    </tr>
                </tbody>
            );
        }
        if (data.error) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center', animation: 'flash 1s infinite' }}>
                            <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {data.error}</p>
                        </td>
                    </tr>
                </tbody>
            );
        }
        if (data.count === '0') {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                            <p>No data found</p>
                        </td>
                    </tr>
                </tbody>
            );
        }
        return (
            <tbody>
                {data.data && data.data.map((row: any, index: number) => (
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
        <>
        <p>Entries: {data ? data.count : 0} </p>
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
        </>
    );
};

function validateExpression(expression: string, setSearchSyntaxError: React.Dispatch<React.SetStateAction<string[] | undefined>>, setFilterString: React.Dispatch<React.SetStateAction<string | undefined>>, setData: React.Dispatch<React.SetStateAction<string | undefined>>): boolean {
    // Check if parentheses are balanced
    const areParenthesesBalanced = (s: string): boolean => {
        let count = 0;
        for (const char of s) {
            if (char === "(") count++;
            else if (char === ")") count--;
            if (count < 0) return false;
        }
        return count === 0;
    };
    const expression_lowercase = expression.toLowerCase();
    const expression_status = []
    if (expression !== "") {
        
        if (!areParenthesesBalanced(expression)) {
            expression_status.push("Error: Unbalanced parentheses.");
        }

        // Regular expressions for validation
        const conditionPattern = /^\s*([a-z_]+)\s*!?=\s*([a-z0-9._-]+)\s*$/;
        const conditionPatternWithSpace = /^\s*([a-z_]+)\s*!?=\s*(["'][a-z0-9._ -]+["'])\s*$/;
        const emptyParentheses = /\s*\(\s*\)/;
        const operatorPattern = /^\s*(and|or)\s*$/;

        if (emptyParentheses.test(expression_lowercase)) {
            expression_status.push("Error: Parentheses wihtout content.");
        }
        // Tokenize the expression
        const tokens = expression_lowercase.split(/(\(|\)|\s+and\s+|\s+or\s+)/).map(t => t.trim()).filter(t => t.length > 0);

        let prevWasCondition = false;
        const parenStack: string[] = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token === "(") {
                parenStack.push(token);
                prevWasCondition = false;
            } else if (token === ")") {
                if (parenStack.length === 0) {
                    expression_status.push("Error: Mismatched closing parenthesis.");
                }
                parenStack.pop();
                prevWasCondition = true;
            } else if (conditionPattern.test(token) || conditionPatternWithSpace.test(token)) {
                if (prevWasCondition) {
                    expression_status.push(`Error: Missing operator before '${token}'.`);
                }
                prevWasCondition = true;
            } else if (operatorPattern.test(token)) {
                if (!prevWasCondition) {
                    expression_status.push(`Error: Operator '${token}' must be between conditions.`);
                }
                console.log("Operator: ", token);
                prevWasCondition = false;
            } else {
                expression_status.push(`Error: Invalid token '${token}'.`);
            }
        }

        if (!prevWasCondition) {
            expression_status.push("Error: Expression must end with a valid condition.");
        }

        if (parenStack.length > 0) {
            expression_status.push("Error: Unclosed parenthesis detected.");
        }

        if (expression_status.length === 0) {
            fetchData(expression, setData);
        }
    }
    setSearchSyntaxError(expression_status);
    setFilterString(expression);
    
    return expression_status.length === 0;
}

const fetchData = async (filterString: String, setData: React.Dispatch<React.SetStateAction<string | undefined>>) => {
    try {
        const script = document.createElement("script");
        const response = await fetch(`http://127.0.0.1:3000/api/ena`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filter: filterString }),
        });
        
        const result = await response.json();
        setData(result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

export const PrimaryDataViewer = ({ accessions }: PrimaryDataViewerProps): JSX.Element => {
    const [data, setData] = useState<any>(null);
    const [filterString, setFilterString] = useState<string>(accessions.map((item) => `accession=${item}`).join(' OR '));
    const [searchSyntaxError, setSearchSyntaxError] = useState<string[]>();

    useEffect(() => {
        fetchData(filterString, setData);
    }, [accessions]);

    return (
        <FluidPaper>
            <GridPaper>
                <GridPaperSection> Primary Data</GridPaperSection>
                <StyledSection>
                    <Fragment>
                        <h2>Primary Data Viewer {accessions}</h2>
                        <input 
                            type="text" 
                            placeholder="Enter filter criteria" 
                            value={filterString} 
                            onChange={(e) => validateExpression(e.target.value, setSearchSyntaxError, setFilterString, setData)} 
                        />
                        {searchSyntaxError && searchSyntaxError.map((error, index) => (
                            <p key={index} style={{ color: 'red' }}>{error}</p>
                        ))}
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
                    </Fragment>
                </StyledSection>
            </GridPaper>
        </FluidPaper>
    );
};

