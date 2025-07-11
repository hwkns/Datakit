/**
 * Sanitize SQL to ensure proper quoting of identifiers
 */
export function sanitizeSQL(sql: string, knownColumns: string[]): string {
  let sanitized = sql;
  
  // Find all column names that need quoting
  const needsQuoting = (identifier: string): boolean => {
    // Check if identifier contains special characters, starts with number, or is a reserved word
    return /[^a-zA-Z0-9_]/.test(identifier) || 
           /^\d/.test(identifier) ||
           identifier.toUpperCase() !== identifier.toLowerCase();
  };
  
  // Sort columns by length (longest first) to avoid partial replacements
  const sortedColumns = [...knownColumns].sort((a, b) => b.length - a.length);
  
  for (const column of sortedColumns) {
    if (needsQuoting(column)) {
      // Create a regex that matches the column name when it's not already quoted
      // This regex ensures we don't match within existing quotes
      const regex = new RegExp(
        `\\b${escapeRegExp(column)}\\b(?=(?:[^"]*"[^"]*")*[^"]*$)(?=(?:[^']*'[^']*')*[^']*$)`,
        'g'
      );
      
      sanitized = sanitized.replace(regex, `"${column}"`);
    }
  }
  
  return sanitized;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract column names from a SELECT statement result
 */
export function extractColumnsFromResult(result: any): string[] {
  if (result?.schema?.fields) {
    return result.schema.fields.map((field: any) => field.name);
  }
  return [];
}

/**
 * Fix common SQL issues in AI-generated queries
 */
export function fixCommonSQLIssues(sql: string): string {
  // Fix UNION ALL queries that might have unquoted columns
  let fixed = sql;
  
  // Pattern to find column references in COUNT(DISTINCT ...) that aren't quoted
  const countDistinctPattern = /COUNT\s*\(\s*DISTINCT\s+([A-Za-z0-9_]+)\s*\)/gi;
  
  fixed = fixed.replace(countDistinctPattern, (match, columnName) => {
    // If column name contains numbers or special chars, quote it
    if (/[^a-zA-Z_]/.test(columnName) || /^\d/.test(columnName)) {
      return `COUNT(DISTINCT "${columnName}")`;
    }
    return match;
  });
  
  // Pattern to find column references in SELECT that aren't quoted
  const selectPattern = /SELECT\s+([^,\s]+)\s+(?:as|AS)/g;
  
  fixed = fixed.replace(selectPattern, (match, columnRef) => {
    // Skip if it's already quoted or is a literal string
    if (columnRef.startsWith('"') || columnRef.startsWith("'")) {
      return match;
    }
    
    // If it looks like a column name with special chars, quote it
    if (/[^a-zA-Z_]/.test(columnRef) && !columnRef.includes('(')) {
      return match.replace(columnRef, `"${columnRef}"`);
    }
    
    return match;
  });
  
  return fixed;
}

/**
 * Fix UNION queries with missing FROM clauses
 */
export function fixUnionQueries(sql: string, tableName: string): string {
  // Check if this is a UNION query
  if (!sql.includes('UNION')) {
    return sql;
  }
  
  // Split by UNION ALL or UNION
  const parts = sql.split(/\s+UNION\s+(?:ALL\s+)?/i);
  
  // Check each part for a FROM clause
  const fixedParts = parts.map((part, index) => {
    // Skip if already has FROM
    if (/\bFROM\b/i.test(part)) {
      return part;
    }
    
    // If it's a SELECT without FROM, try to add the table name
    if (/\bSELECT\b/i.test(part) && /\bCOUNT\b|\bSUM\b|\bAVG\b|\bMAX\b|\bMIN\b/i.test(part)) {
      // Add FROM clause before any ORDER BY, GROUP BY, or at the end
      if (/\b(?:ORDER|GROUP)\s+BY\b/i.test(part)) {
        return part.replace(/(\b(?:ORDER|GROUP)\s+BY\b)/i, ` FROM "${tableName}" $1`);
      } else {
        return part.trim() + ` FROM "${tableName}"`;
      }
    }
    
    return part;
  });
  
  // Rejoin with UNION ALL
  return fixedParts.join(' UNION ALL ');
}