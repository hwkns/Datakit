import { ColumnType } from "@/types/csv";

const convertDuckDBColumnTypes = (schemaResult: any): ColumnType[] => {
  return schemaResult.toArray().map((col: any) => {
    const type = col.type.toLowerCase();

    if (
      type.includes("int") ||
      type.includes("float") ||
      type.includes("double") ||
      type.includes("decimal") ||
      type.includes("number")
    ) {
      return ColumnType.Number;
    } else if (type.includes("bool")) {
      return ColumnType.Boolean;
    } else if (
      type.includes("date") ||
      type.includes("time") ||
      type.includes("timestamp")
    ) {
      return ColumnType.Date;
    } else if (
      type.includes("json") ||
      type.includes("object") ||
      type.includes("map")
    ) {
      return ColumnType.Object;
    } else if (type.includes("array") || type.includes("list")) {
      return ColumnType.Array;
    } else {
      return ColumnType.Text;
    }
  });
};

export { convertDuckDBColumnTypes };
