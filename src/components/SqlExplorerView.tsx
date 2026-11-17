import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Code2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine, CANONICAL_QUERIES, PredefinedQuery } from '../db/dbEngine.ts';
import { SchemaDiagram } from './SchemaDiagram.tsx';
import { canAccessSqlStudio } from '../utils/access.ts';

interface SqlExplorerViewProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
}

export const SqlExplorerView: React.FC<SqlExplorerViewProps> = ({
  currentUser,
  dbEngine,
}) => {
  const [activeQuery, setActiveQuery] = useState<PredefinedQuery>(
    CANONICAL_QUERIES[0]
  );
  const [customSql, setCustomSql] = useState<string>(CANONICAL_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<any[]>(() => {
    return dbEngine.executeSQL(CANONICAL_QUERIES[0].sql).data;
  });
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'schema'>('console');
  const [copied, setCopied] = useState(false);

  if (!canAccessSqlStudio(currentUser)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#E5E0D8] p-8 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-[#C82333] mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#2C2927]">
            SQL Studio Access Restricted
          </h2>
          <p className="text-xs text-[#7A746E]">
            The live SQL Query Studio and relational schema explorer are restricted to faculty/proctor administrators and authorized coordinator accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleRunQuery = () => {
    setQueryError(null);
    const result = dbEngine.executeSQL(customSql);
    if (result.error) {
      setQueryError(result.error);
      setQueryResult([]);
    } else {
      setQueryResult(result.data);
    }
    setExecutionTime(result.executionTimeMs);
  };

  const handleRunTableQuery = (tableName: string) => {
    const sql = `SELECT * FROM ${tableName};`;
    setCustomSql(sql);
    setQueryError(null);
    const result = dbEngine.executeSQL(sql);
    if (result.error) {
      setQueryError(result.error);
      setQueryResult([]);
    } else {
      setQueryResult(result.data);
    }
    setExecutionTime(result.executionTimeMs);
    setActiveTab('console');
  };

  const handleSelectPredefined = (query: PredefinedQuery) => {
    setActiveQuery(query);
    setCustomSql(query.sql);
    setQueryError(null);
    const result = dbEngine.executeSQL(query.sql);
    if (result.error) {
      setQueryError(result.error);
      setQueryResult([]);
    } else {
      setQueryResult(result.data);
    }
    setExecutionTime(result.executionTimeMs);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(customSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!queryResult || queryResult.length === 0) return;
    const headers = Object.keys(queryResult[0]);
    const csvRows = [
      headers.join(','),
      ...queryResult.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
      ),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reusensut_query_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns =
    queryResult && queryResult.length > 0 ? Object.keys(queryResult[0]) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="bg-[#2C2927] p-6 sm:p-8 text-white space-y-3 border border-[#1E1C1A]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D96B27]">
          <Terminal className="w-4 h-4" />
          <span>Campus Data Intelligence &amp; Relational Analytics</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">
          SQL Query Studio &amp; Relational Explorer
        </h1>
        <p className="text-xs text-[#CFC9C2] max-w-3xl leading-relaxed">
          Run live SQL queries across the 15 normalized marketplace tables—from finding affordable semester textbooks to auditing overdue loans, trust scores, and security deposits.
        </p>

        <div className="pt-2 flex gap-3">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'console'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Live SQL Runner
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'schema'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Relational Schema &amp; Tables (15)
          </button>
        </div>
      </div>

      {activeTab === 'console' && (
        <div className="space-y-6">
          {/* Canonical Queries Selector */}
          <div className="bg-white border border-[#E5E0D8] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#2C2927] uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#D96B27]" />
                <span>Saved Analytical Queries (Click to Run)</span>
              </h3>
              <span className="text-[11px] text-[#7A746E]">
                Live AlaSQL engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CANONICAL_QUERIES.map((q) => {
                const isSelected = activeQuery.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSelectPredefined(q)}
                    className={`p-3.5 border text-left transition-all flex flex-col justify-between text-xs ${
                      isSelected
                        ? 'border-[#D96B27] bg-[#FAF8F5] text-[#2C2927] ring-1 ring-[#D96B27]'
                        : 'border-[#E5E0D8] hover:border-[#2C2927] text-[#524D48] bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[#2C2927]">{q.title}</div>
                      <div className="text-[11px] text-[#7A746E] mt-1 line-clamp-1">
                        {q.description}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#D96B27] mt-2 pt-1.5 border-t border-[#E5E0D8] truncate">
                      {q.sourceDocNote}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SQL Editor */}
          <div className="bg-[#1E1C1A] border border-[#2C2927] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#2C2927] border-b border-[#3D3936] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#D96B27] font-semibold">
                  sql&gt;
                </span>
                <span className="text-[#CFC9C2] hidden sm:inline text-[11px]">
                  SELECT, JOIN, WHERE, GROUP BY, ORDER BY against live state
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 text-[#CFC9C2] hover:text-white hover:bg-[#3D3936] text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#1E5B3E]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>

                <button
                  onClick={() => setCustomSql(activeQuery.sql)}
                  className="px-2.5 py-1 text-[#CFC9C2] hover:text-white hover:bg-[#3D3936] text-[11px] flex items-center gap-1 transition-colors"
                  title="Reset query"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleRunQuery}
                  className="px-4 py-1 bg-[#D96B27] hover:bg-[#C0581A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute SQL</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              <textarea
                value={customSql}
                onChange={(e) => setCustomSql(e.target.value)}
                rows={7}
                spellCheck={false}
                className="w-full bg-transparent text-[#F5EFE6] font-mono text-xs focus:outline-none resize-y leading-relaxed selection:bg-[#D96B27]/40"
                placeholder="SELECT * FROM Listings WHERE listing_status = 'active';"
              />
            </div>
          </div>

          {queryError && (
            <div className="p-4 bg-red-50 border border-[#C82333]/40 text-[#C82333] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">SQL Execution Error:</span>
                <p className="mt-1 font-mono text-[11px]">{queryError}</p>
              </div>
            </div>
          )}

          {/* Output Result Table */}
          <div className="bg-white border border-[#E5E0D8] overflow-hidden">
            <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#2C2927]">
                  Query Result Table
                </span>
                <span className="text-[#7A746E]">
                  {queryResult ? queryResult.length : 0} row(s) returned
                </span>
                <span className="text-[#CFC9C2]">·</span>
                <span className="text-[#1E5B3E] font-mono font-medium">
                  {executionTime} ms
                </span>
              </div>

              {queryResult && queryResult.length > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1 bg-white hover:bg-[#FAF8F5] border border-[#D5CFC7] text-[#2C2927] font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#7A746E]" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {queryResult && queryResult.length > 0 ? (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs text-[#524D48]">
                  <thead className="bg-[#FAF8F5] text-[#2C2927] uppercase font-semibold text-[10px] tracking-wider sticky top-0 border-b border-[#E5E0D8]">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2.5 font-mono whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {queryResult.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#FAF8F5] transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-[#2C2927]"
                          >
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-[#9E978E] italic">null</span>
                            ) : typeof row[col] === 'object' ? (
                              JSON.stringify(row[col])
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#7A746E]">
                No matching rows returned from this query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schema & Visual Relationship Diagram Tab */}
      {activeTab === 'schema' && (
        <SchemaDiagram
          dbState={dbEngine.getState()}
          onRunTableQuery={handleRunTableQuery}
        />
      )}
    </div>
  );
};
