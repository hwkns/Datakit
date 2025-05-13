interface QueryResultsProps {
  results: any[] | null;
  columns: string[] | null;
  isLoading: boolean;
  error: string | null;
}

export function QueryResults({ results, columns, isLoading, error }: QueryResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-sm">
        <p className="font-medium mb-1">Error:</p>
        <pre className="whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!results || !columns) {
    return (
      <div className="p-4 text-white text-opacity-50 text-sm">
        Execute a query to see results.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-white text-opacity-70 text-sm">
        Query executed successfully. No results returned.
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-darkNav">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-3 py-2 text-left font-medium text-white border-b border-white border-opacity-20"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-white hover:bg-opacity-5 transition-colors"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-3 py-2 border-b border-white border-opacity-10"
                >
                  {row[column] !== null && row[column] !== undefined
                    ? String(row[column])
                    : <span className="text-white text-opacity-30">NULL</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}