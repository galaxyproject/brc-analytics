"use client"; // Ensure client-side rendering

import React, { useEffect, useState } from "react";

import runReadFields from "../../../../../catalog/output/runReadFields.json";
import {
  ENAReadRuns,
  PrimaryDataApiResult,
  ReadRunStatistics,
} from "app/apis/catalog/brc-analytics-catalog/common/entities";

import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";

import {
  BlinkingDots,
  ReactPageNation,
  StyledSection,
} from "./primaryDataViewer.style";
import ReactPaginate from "react-paginate";

import {
  combineExpressionParts,
  formatExpression,
  formatLargeNumber,
  splitUnqouatedSpace,
  validateExpression,
} from "./utils";

interface PrimaryDataViewerProps {
  initialQuery: string;
}

interface TableColumns {
  accessor: string;
  header: string;
}

const columns: TableColumns[] = [
  { accessor: "library_layout", header: "Layout" },
  { accessor: "instrument_model", header: "Model" },
  { accessor: "instrument_platform", header: "Platform" },
  { accessor: "accession", header: "SRR" },
];

const fetchData = async (
  filterString: string,
  setData: React.Dispatch<React.SetStateAction<PrimaryDataApiResult>>,
  setStatistics: React.Dispatch<React.SetStateAction<ReadRunStatistics>>
): Promise<{ status: number }> => {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/ena`, {
      body: JSON.stringify({ filter: filterString }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const result = await response.json();
    const stats = {
      bases: 0,
      biosamples: new Set(),
      read_runs: new Set(),
      studies: new Set(),
    };
    result.data.forEach((item: ENAReadRuns) => {
      stats.bases += parseInt(item.base_count, 10);
      stats.biosamples.add(item.sample_accession);
      stats.read_runs.add(item.accession);
      stats.studies.add(item.studies_accession);
    });
    setStatistics({
      bases: stats.bases,
      biosamples: stats.biosamples.size,
      read_runs: stats.read_runs.size,
      studies: stats.studies.size,
    });
    setData(result);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return { status: 200 };
};

function renderQueryBuilder(
  filterString: string,
  validateQueryExpression: (expression: string) => boolean
): JSX.Element {
  const split_on_first_equals = (s: string): string[] => {
    const index = s.indexOf("=");
    return index !== -1 ? [s.slice(0, index), s.slice(index + 1)] : [s];
  };
  const filterStringParts = splitUnqouatedSpace(filterString).map((item) =>
    split_on_first_equals(item)
  );
  return (
    <>
      <p
        style={{
          fontSize: "0.8rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Query builder
      </p>
      <table>
        <tbody>
          {filterStringParts.length ? (
            filterStringParts.map((token, index) => (
              <tr key={index}>
                <td style={{ width: "100px" }}></td>
                <td style={{ width: "150px" }}>
                  <select
                    value={token[0].trim()}
                    style={{ width: "150px" }}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      filterStringParts[index][0] = selectedValue;
                      validateQueryExpression(
                        combineExpressionParts(filterStringParts)
                      );
                      const selectedField = runReadFields.find(
                        (field) => field.name === selectedValue
                      );
                      const inputElement = e.target
                        .closest("tr")
                        ?.querySelector("input");
                      if (inputElement && selectedField) {
                        inputElement.placeholder = selectedField.description;
                      }
                    }}
                  >
                    <option></option>
                    {runReadFields &&
                      runReadFields.map((field, index) => (
                        <option key={index} value={field.name}>
                          {field.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td style={{ width: "calc(100% - 250px)" }}>
                  <input
                    hidden={["AND", "OR", "(", ")", ""].includes(
                      token[0].trim()
                    )}
                    type="text"
                    placeholder="Enter value"
                    value={token.slice(1).join("=")}
                    style={{ width: "100%" }}
                    onChange={(e) => {
                      filterStringParts[index][1] = e.target.value;
                      validateQueryExpression(
                        combineExpressionParts(filterStringParts)
                      );
                    }}
                  />
                </td>
                <td>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const newTokenParts = [...filterStringParts];
                      newTokenParts.splice(index, 1);
                      validateQueryExpression(
                        combineExpressionParts(newTokenParts)
                      );
                    }}
                  >
                    &#10006;
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const newTokenParts = [...filterStringParts];
                      newTokenParts.splice(index + 1, 0, [" AND "]);
                      validateQueryExpression(
                        combineExpressionParts(newTokenParts)
                      );
                    }}
                  >
                    &#43;
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ width: "100px" }}></td>
              <td style={{ width: "150px" }}>
                <select
                  style={{ width: "150px" }}
                  onChange={(e) => {
                    const selectedField = runReadFields.find(
                      (field) => field.name === e.target.value
                    );
                    const inputElement = e.target
                      .closest("tr")
                      ?.querySelector("input");
                    if (inputElement && selectedField) {
                      inputElement.placeholder = selectedField.description;
                    }
                  }}
                >
                  {runReadFields &&
                    runReadFields.map((field, index) => (
                      <option key={index} value={field.name}>
                        {field.name}
                      </option>
                    ))}
                </select>
              </td>
              <td style={{ width: "calc(100% - 250px)" }}>
                <input
                  type="text"
                  placeholder={runReadFields[0]?.description || "Enter value"}
                  style={{ width: "100%" }}
                />
              </td>
              <td>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  &#10006;
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

const renderInputSearchField = (
  filterString: string,
  validateQueryExpression: (expression: string) => boolean,
  searchSyntaxError: string[]
): JSX.Element => {
  return (
    <>
      <input
        type="text"
        placeholder="Enter filter criteria"
        value={filterString}
        onChange={(e) => validateQueryExpression(e.target.value)}
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          boxSizing: "border-box",
          fontSize: "1rem",
          margin: "10px 0",
          padding: "10px",
          width: "100%",
        }}
      />
      {searchSyntaxError &&
        searchSyntaxError.map((error, index) => (
          <p key={index} style={{ color: "red" }}>
            {error}
          </p>
        ))}
    </>
  );
};

const renderLoadingText = (): JSX.Element => {
  return (
    <p style={{ textAlign: "center" }}>
      <BlinkingDots>
        Loading
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </BlinkingDots>
    </p>
  );
};

const renderPrimaryDataTable = (
  data: PrimaryDataApiResult,
  columns: TableColumns[],
  itemsPerPage: number,
  currentPage: number
): JSX.Element => {
  const renderRows = (
    data: PrimaryDataApiResult,
    columns: TableColumns[]
  ): JSX.Element => {
    if (!data) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              style={{ animation: "flash 1s infinite", textAlign: "center" }}
            >
              <p style={{ color: "red", fontWeight: "bold" }}>
                Unknown error!!!
              </p>
            </td>
          </tr>
        </tbody>
      );
    }
    if (data.error) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              style={{ animation: "flash 1s infinite", textAlign: "center" }}
            >
              <p style={{ color: "red", fontWeight: "bold" }}>{data.error}</p>
            </td>
          </tr>
        </tbody>
      );
    }
    if (data.count === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center" }}>
              <p>No data found</p>
            </td>
          </tr>
        </tbody>
      );
    }
    const offset = currentPage * itemsPerPage;
    const currentData = data.data.slice(offset, offset + itemsPerPage);
    return (
      <tbody>
        {currentData.map((row: { [key: string]: string }, index: number) => (
          <tr key={index}>
            {columns.map((column: TableColumns, colIndex: number) => (
              <td key={colIndex}>{row[column.accessor]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };
  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        {renderRows(data, columns)}
      </table>
    </>
  );
};

const renderPagenation = (
  itemsPerPage: number,
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>,
  currentPage: number,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  data: PrimaryDataApiResult,
  handlePageClick: (data: { selected: number }) => void
): JSX.Element => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        marginRight: "-10px",
        marginTop: "-30px",
      }}
    >
      <span style={{ fontSize: "0.8rem" }}>
        items per page:
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setCurrentPage(0);
            setItemsPerPage(Number(e.target.value));
          }}
          style={{
            backgroundColor: "white",
            border: "none",
            borderRadius: "0",
            boxShadow: "none",
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </span>
      <span>
        <div style={{ alignItems: "center", display: "flex" }}>
          <ReactPageNation>
            <ReactPaginate
              previousLabel={"<"}
              nextLabel={">"}
              breakLabel={"..."}
              breakClassName={"break-me"}
              forcePage={currentPage}
              pageCount={Math.ceil(data.count / itemsPerPage)}
              marginPagesDisplayed={1}
              pageRangeDisplayed={1}
              onPageChange={handlePageClick}
              containerClassName={"pagination"}
              activeClassName={"active"}
            />
          </ReactPageNation>
          <input
            placeholder="Go to page"
            onChange={(e) => {
              const page = Number(e.target.value) - 1;
              if (page >= 0 && page < Math.ceil(data.count / itemsPerPage)) {
                setCurrentPage(page);
              }
            }}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              boxSizing: "border-box",
              fontSize: "0.7rem",
              margin: "0 10px",
              padding: "5px",
              width: "60px",
            }}
          />
        </div>
      </span>
    </div>
  );
};

export const PrimaryDataViewer = ({
  initialQuery,
}: PrimaryDataViewerProps): JSX.Element => {
  const [data, setData] = useState<PrimaryDataApiResult>({
    count: 0,
    data: [],
    error: "",
    status: 200,
  });
  const [statistics, setStatistics] = useState<ReadRunStatistics>({
    bases: 0,
    biosamples: 0,
    read_runs: 0,
    studies: 0,
  });
  const [filterString, setFilterString] = useState<string>(
    initialQuery ? initialQuery : ""
  );
  const [searchSyntaxError, setSearchSyntaxError] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [validExpression, setValidExpression] = useState<boolean>(true);

  const validateQueryExpression = (expression: string): boolean => {
    setValidExpression(false);
    expression = formatExpression(expression);
    const expressionValidated = validateExpression(expression);
    const valid = expressionValidated.length === 0;
    setValidExpression(valid);
    if (!valid) {
      setSearchSyntaxError(expressionValidated);
    } else {
      setSearchSyntaxError([]);
    }

    setFilterString(expression);
    return valid;
  };

  useEffect(() => {
    if (validExpression) {
      fetchData(filterString, setData, setStatistics);
    } else {
      setData({ count: 0, data: [], error: "", status: 200 });
    }
  }, [filterString, validExpression]);

  const handlePageClick = (data: { selected: number }): void => {
    setCurrentPage(data.selected);
  };

  return (
    <FluidPaper>
      <GridPaper>
        <StyledSection>
          {renderPagenation(
            itemsPerPage,
            setItemsPerPage,
            currentPage,
            setCurrentPage,
            data,
            handlePageClick
          )}
          <span style={{ fontSize: "0.8rem", marginTop: "-30px" }}>
            <b>Statistics:</b> Read runs: {statistics.read_runs}, Biosamples:{" "}
            {statistics.biosamples}, Studies: {statistics.studies}, Bases:{" "}
            {formatLargeNumber(statistics.bases)}
          </span>

          {renderQueryBuilder(filterString, validateQueryExpression)}

          {renderInputSearchField(
            filterString,
            validateQueryExpression,
            searchSyntaxError
          )}

          {data && data.data
            ? renderPrimaryDataTable(data, columns, itemsPerPage, currentPage)
            : renderLoadingText()}

          {renderPagenation(
            itemsPerPage,
            setItemsPerPage,
            currentPage,
            setCurrentPage,
            data,
            handlePageClick
          )}
        </StyledSection>
      </GridPaper>
    </FluidPaper>
  );
};
