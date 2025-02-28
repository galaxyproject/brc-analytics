"use client"; // Ensure client-side rendering

import React, { useEffect, useState } from 'react';

import runReadFields from "../../../../../catalog/output/runReadFields.json";

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

import { RunReadsFields } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

const expression_bullder = /(\(|\)|\s*AND\s|\s*OR\s)/

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

function splitUnqouatedSpace(s: string): string[] {
    const parts = []
    if (!/\s/.test(s)) {
        return [s];
    } else {
        let quouted = false;
        let qouteChar = ''
        let newPart = "";        
        for (const p of s.split(/(\(|\)|\s+)/).filter(part => part.trim() !== '')){
            if (quouted) {
                newPart += ` ${p}`;
                if (p.endsWith(qouteChar)) {
                    parts.push(newPart);
                    newPart = "";
                    quouted = false;
                }
            } else {
                const firstQuoteIndex = p.search(/['"]/);
                if (firstQuoteIndex === -1) {
                    parts.push(p);
                } else {
                    qouteChar = p[firstQuoteIndex];
                    if (p.endsWith(qouteChar)) {
                        parts.push(p);
                    } else {
                        newPart = p;
                        quouted = true;
                    }
                }
            }
            
        }
    }
    return parts;
}


function validateExpression(expression: string,
                            setSearchSyntaxError: React.Dispatch<React.SetStateAction<string[] | undefined>>,
                            setFilterString: React.Dispatch<React.SetStateAction<string | undefined>>,
                            setData: React.Dispatch<React.SetStateAction<string | undefined>>): boolean {
    // Check if parentheses are balanced

    expression = expression.replace(/\s[Aa][Nn][Dd]\s/, ' AND ').replace(/\s[Oo][Rr]\s/, ' OR ');
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
        const conditionPattern = /^\s*([a-z_]+)\s*!?=\s*([A-Za-z0-9._-]+)\s*$/;
        const conditionPatternWithSpace = /^\s*([a-z_]+)\s*!?=\s*(["'][A-Za-z0-9._ -]+["'])\s*$/;
        const emptyParentheses = /\s*\(\s*\)/;
        const operatorPattern = /^\s*(AND|OR)\s*$/;

        if (emptyParentheses.test(expression_lowercase)) {
            expression_status.push("Error: Parentheses wihtout content.");
        }
        // Tokenize the expression
        
        const tokens = expression.split(expression_bullder).map(t => t.trim()).filter(t => t.length > 0);

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
        console.log('Fetching data:', filterString);
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

function renderBuild(tokens: string, validateQueryExpression: (expression: string) => boolean): JSX.Element {
    const split_on_first_equals = (s: string): string[] => {
        const index = s.indexOf("=");
        return index !== -1 ? [s.slice(0, index), s.slice(index + 1)] : [s];
    }
    // const token_parts = tokens.split(expression_bullder).flatMap((item) => /[a-c_]+="[A-Za-z0-9-_. ]*"/.test(item) ? [item] : item.split('\s*')).map((item) => split_on_first_equals(item));
    const token_parts = splitUnqouatedSpace(tokens).map((item) => split_on_first_equals(item));
    console.log('Token parts:', token_parts);
    return (
        <>
            <p style={{ fontWeight: 'bold' }}>Query builder</p>
            <table>
                {token_parts.length ? token_parts.map((token, index) => (
                    <tr key={index}>
                        <td style={{ width: '100px' }}></td>
                        <td style={{ width: '150px' }}>
                            <select value={token[0].trim()} style={{ width: '150px' }}
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    token_parts[index][0] = selectedValue;
                                    validateQueryExpression(combineTokens(token_parts));
                                    const selectedField = runReadFields.find(field => field.name === selectedValue);
                                    const inputElement = e.target.closest('tr')?.querySelector('input');
                                    if (inputElement && selectedField) {
                                        inputElement.placeholder = selectedField.description;
                                    }
                                }}
                            >
                                <option></option>
                                {runReadFields && runReadFields.map((field, index) => (
                                    <option key={index} value={field.name} >{field.name}</option>
                                ))}
                            </select>
                        </td>
                        <td style={{ width: 'calc(100% - 250px)' }}>
                            <input 
                                hidden={ ['AND', 'OR', '(', ')', ''].includes(token[0].trim())}
                                type="text" 
                                placeholder="Enter value" 
                                value={token.slice(1).join('=')}
                                style={{ width: '100%' }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const tokenIndex = index;
                                    token_parts[index][1] = value;
                                    validateQueryExpression(combineTokens(token_parts));
                                }} 
                            />
                        </td>
                        <td>
                            <button
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => {
                                    const newTokenParts = [...token_parts];
                                    newTokenParts.splice(index, 1);
                                    validateQueryExpression(combineTokens(newTokenParts));
                                }}
                            >
                                &#10006;
                            </button>
                            <button
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => {
                                    const newTokenParts = [...token_parts];
                                    newTokenParts.splice(index + 1, 0, [" AND "]);
                                    validateQueryExpression(combineTokens(newTokenParts));
                                }}
                            >
                                &#43;
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td style={{ width: '100px' }}></td>
                        <td style={{ width: '150px' }}>
                            <select 
                                style={{ width: '150px' }} 
                                onChange={(e) => {
                                    const selectedField = runReadFields.find(field => field.name === e.target.value);
                                    const inputElement = e.target.closest('tr')?.querySelector('input');
                                    if (inputElement && selectedField) {
                                        inputElement.placeholder = selectedField.description;
                                    }
                                }}
                            >
                                {runReadFields && runReadFields.map((field, index) => (
                                    <option key={index} value={field.name}>{field.name}</option>
                                ))}
                            </select>
                        </td>
                        <td style={{ width: 'calc(100% - 250px)' }}>
                            <input type="text" placeholder={runReadFields[0]?.description || "Enter value"} style={{ width: '100%' }} />
                        </td>
                        <td>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                &#10006;
                            </button>
                        </td>
                    </tr>
                )}
            </table>
        </>
    );
}

const combineTokens = (tokens: string[][]): string => {
    console.log('Combining tokens:', tokens);
    console.log(tokens.map((item) => item.join('=')).join(' '));
    return tokens.map((item) => item.join('=')).join(' ').replace(/\s+/g, ' ');
}


export const PrimaryDataViewer = ({ accessions }: PrimaryDataViewerProps): JSX.Element => {
    const [data, setData] = useState<any>(null);
    const [filterString, setFilterString] = useState<string>(accessions.map((item) => `accession=${item}`).join(' OR '));
    const [searchSyntaxError, setSearchSyntaxError] = useState<string[]>();
    const [tokens, setTokens] = useState<string>(filterString);

    const validateQueryExpression = (expression: string): boolean => {
        return validateExpression(expression, setSearchSyntaxError, setFilterString, setData);
    }

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
                            onChange={(e) => validateQueryExpression(e.target.value)} 
                        />
                        {renderBuild(filterString, validateQueryExpression)}
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

