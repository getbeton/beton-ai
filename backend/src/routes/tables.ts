import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  AuthenticatedRequest, 
  ApiResponse 
} from '../types';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// Column type definitions
export const COLUMN_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  CURRENCY: 'currency',
  DATE: 'date',
  URL: 'url',
  EMAIL: 'email',
  CHECKBOX: 'checkbox'
} as const;

export type ColumnType = typeof COLUMN_TYPES[keyof typeof COLUMN_TYPES];

// Table interfaces
interface CreateTableRequest {
  name: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
  columns?: {
    name: string;
    type: ColumnType;
    isRequired?: boolean;
    isEditable?: boolean;
    defaultValue?: string;
    settings?: Record<string, any>;
  }[];
}

interface UpdateTableRequest {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

interface CreateColumnRequest {
  name: string;
  type: ColumnType;
  isRequired?: boolean;
  isEditable?: boolean;
  defaultValue?: string;
  settings?: Record<string, any>;
}

interface CreateRowRequest {
  data: Record<string, any>; // Column name -> value mapping
}

interface BulkRowRequest {
  rows: Record<string, any>[]; // Array of column name -> value mappings
}

interface TableFilter {
  columnId: string;
  condition: string;
  value: string;
  value2?: string; // For between conditions
}

interface GetTableQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: string; // JSON string of TableFilter[]
}

// Helper function to validate column type
const validateColumnType = (type: string): type is ColumnType => {
  return Object.values(COLUMN_TYPES).includes(type as ColumnType);
};

// Helper function to format cell value based on column type
const formatCellValue = (value: any, columnType: ColumnType): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (columnType) {
    case COLUMN_TYPES.TEXT:
    case COLUMN_TYPES.EMAIL:
    case COLUMN_TYPES.URL:
      return String(value);
    case COLUMN_TYPES.NUMBER:
    case COLUMN_TYPES.CURRENCY:
      return String(Number(value));
    case COLUMN_TYPES.DATE:
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return String(value); // Return original value if invalid date
      }
      return dateValue.toISOString();
    case COLUMN_TYPES.CHECKBOX:
      return Boolean(value).toString();
    default:
      return String(value);
  }
};

// Helper function to build cell condition for filtering
const buildCellCondition = (column: any, filter: TableFilter): any => {
  const { condition, value, value2 } = filter;

  // Handle empty/not empty conditions
  if (condition === 'isEmpty') {
    return {
      OR: [
        { value: null },
        { value: '' }
      ]
    };
  }
  if (condition === 'isNotEmpty') {
    return {
      AND: [
        { value: { not: null } },
        { value: { not: '' } }
      ]
    };
  }

  // Handle checkbox conditions
  if (column.type === 'checkbox') {
    if (condition === 'isTrue') {
      return { value: 'true' };
    }
    if (condition === 'isFalse') {
      return { value: { not: 'true' } };
    }
  }

  // Handle text conditions
  if (['text', 'email', 'url'].includes(column.type)) {
    switch (condition) {
      case 'contains':
        return {
          value: {
            contains: value,
            mode: 'insensitive'
          }
        };
      case 'equals':
        return {
          value: {
            equals: value,
            mode: 'insensitive'
          }
        };
      case 'startsWith':
        return {
          value: {
            startsWith: value,
            mode: 'insensitive'
          }
        };
      case 'endsWith':
        return {
          value: {
            endsWith: value,
            mode: 'insensitive'
          }
        };
    }
  }

  // Handle number and currency conditions
  if (['number', 'currency'].includes(column.type)) {
    const numValue = parseFloat(value);
    const numValue2 = value2 ? parseFloat(value2) : 0;

    if (isNaN(numValue)) return null;

    switch (condition) {
      case 'equals':
        return { value: numValue.toString() };
      case 'greaterThan':
        return { value: { gt: numValue.toString() } };
      case 'lessThan':
        return { value: { lt: numValue.toString() } };
      case 'greaterThanOrEqual':
        return { value: { gte: numValue.toString() } };
      case 'lessThanOrEqual':
        return { value: { lte: numValue.toString() } };
      case 'between':
        if (value2 && !isNaN(numValue2)) {
          return {
            AND: [
              { value: { gte: numValue.toString() } },
              { value: { lte: numValue2.toString() } }
            ]
          };
        }
        break;
    }
  }

  // Handle date conditions
  if (column.type === 'date') {
    const dateValue = new Date(value);
    const dateValue2 = value2 ? new Date(value2) : null;

    if (isNaN(dateValue.getTime())) return null;

    switch (condition) {
      case 'equals':
        return {
          value: {
            gte: dateValue.toISOString().split('T')[0],
            lt: new Date(dateValue.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        };
      case 'before':
        return { value: { lt: dateValue.toISOString() } };
      case 'after':
        return { value: { gt: dateValue.toISOString() } };
      case 'between':
        if (dateValue2 && !isNaN(dateValue2.getTime())) {
          return {
            AND: [
              { value: { gte: dateValue.toISOString() } },
              { value: { lte: dateValue2.toISOString() } }
            ]
          };
        }
        break;
    }
  }

  return null;
};

// Get all tables for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { archived } = req.query;
    const isArchived = archived === 'true';

    const tables = await prisma.userTable.findMany({
      where: { 
        userId,
        isArchived
      },
      include: {
        _count: {
          select: {
            columns: true,
            rows: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: tables
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tables' 
    });
  }
});

// Get a specific table with its data
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      sortBy, 
      sortOrder = 'asc',
      search,
      filters: filtersParam
    }: GetTableQuery = req.query;

    // Parse filters from JSON string
    let filters: TableFilter[] = [];
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid filters format' 
        });
      }
    }

    // Get table with columns first
    const table = await prisma.userTable.findFirst({
      where: { 
        id, 
        userId 
      },
      include: {
        columns: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Build where clause for filtering
    const whereClause: any = {
      tableId: id
    };

    // Add search and filter conditions
    if (search || filters.length > 0) {
      const searchConditions: any[] = [];

      // Search condition - search across all text columns
      if (search) {
        const textColumns = table.columns.filter(col => 
          ['text', 'email', 'url'].includes(col.type)
        );
        
        if (textColumns.length > 0) {
          searchConditions.push({
            OR: textColumns.map(column => ({
              cells: {
                some: {
                  columnId: column.id,
                  value: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              }
            }))
          });
        }
      }

      // Filter conditions
      for (const filter of filters) {
        const column = table.columns.find(col => col.id === filter.columnId);
        if (!column) continue;

        const cellCondition = buildCellCondition(column, filter);
        if (cellCondition) {
          searchConditions.push({
            cells: {
              some: {
                columnId: filter.columnId,
                ...cellCondition
              }
            }
          });
        }
      }

      if (searchConditions.length > 0) {
        whereClause.AND = searchConditions;
      }
    }

    // Get total count for pagination (with filters applied)
    const totalRows = await prisma.tableRow.count({
      where: whereClause
    });

    // Build orderBy clause
    let orderBy: any = { order: 'asc' };
    if (sortBy) {
      const sortColumn = table.columns.find(col => col.name === sortBy);
      if (sortColumn) {
        orderBy = {
          cells: {
            _count: sortOrder === 'desc' ? 'desc' : 'asc'
          }
        };
      }
    }

    // Get filtered and paginated rows
    const rows = await prisma.tableRow.findMany({
      where: whereClause,
      include: {
        cells: {
          include: {
            column: true
          }
        }
      },
      orderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    // Transform data for easier frontend consumption
    const formattedRows = rows.map(row => {
      const rowData: Record<string, any> = {
        id: row.id,
        isSelected: row.isSelected,
        order: row.order,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };

      row.cells.forEach(cell => {
        rowData[cell.column.name] = cell.value;
      });

      return rowData;
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...table,
        rows: formattedRows, // Keep the same structure
        formattedRows,
        totalRows,
        filteredRows: totalRows, // Add this to distinguish from total table rows
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalRows / Number(limit))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch table' 
    });
  }
});

// Create a new table
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, description, sourceType, sourceId, columns = [] }: CreateTableRequest = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Table name is required' 
      });
    }

    // Check if table name already exists for this user
    const existingTable = await prisma.userTable.findUnique({
      where: {
        userId_name: {
          userId,
          name: name.trim()
        }
      }
    });

    if (existingTable) {
      return res.status(409).json({ 
        success: false, 
        error: 'Table with this name already exists' 
      });
    }

    // Validate column types
    for (const column of columns) {
      if (!validateColumnType(column.type)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid column type: ${column.type}` 
        });
      }
    }

    const table = await prisma.userTable.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim(),
        sourceType: sourceType || 'manual',
        sourceId,
        columns: {
          create: columns.map((column, index) => ({
            name: column.name,
            type: column.type,
            isRequired: column.isRequired || false,
            isEditable: column.isEditable !== false,
            defaultValue: column.defaultValue,
            order: index,
            settings: column.settings || {}
          }))
        }
      },
      include: {
        columns: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            rows: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: table,
      message: 'Table created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create table' 
    });
  }
});

// Update table metadata
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, description, isArchived }: UpdateTableRequest = req.body;

    // Check if table exists and belongs to user
    const existingTable = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!existingTable) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // If updating name, check for conflicts
    if (name && name !== existingTable.name) {
      const nameConflict = await prisma.userTable.findUnique({
        where: {
          userId_name: {
            userId,
            name: name.trim()
          }
        }
      });

      if (nameConflict) {
        return res.status(409).json({ 
          success: false, 
          error: 'Table with this name already exists' 
        });
      }
    }

    const table = await prisma.userTable.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(isArchived !== undefined && { isArchived })
      },
      include: {
        columns: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            rows: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: table,
      message: 'Table updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update table' 
    });
  }
});

// Delete table
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if table exists and belongs to user
    const existingTable = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!existingTable) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    await prisma.userTable.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Table deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete table' 
    });
  }
});

// Add column to table
router.post('/:id/columns', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, type, isRequired, isEditable, defaultValue, settings }: CreateColumnRequest = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Column name is required' 
      });
    }

    if (!validateColumnType(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid column type: ${type}` 
      });
    }

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId },
      include: {
        columns: true
      }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Check if column name already exists
    const existingColumn = table.columns.find(col => col.name === name.trim());
    if (existingColumn) {
      return res.status(409).json({ 
        success: false, 
        error: 'Column with this name already exists' 
      });
    }

    const nextOrder = Math.max(...table.columns.map(col => col.order), -1) + 1;

    const column = await prisma.tableColumn.create({
      data: {
        tableId: id,
        name: name.trim(),
        type,
        isRequired: isRequired || false,
        isEditable: isEditable !== false,
        defaultValue,
        order: nextOrder,
        settings: settings || {}
      }
    });

    // Add default values to existing rows
    if (defaultValue) {
      const rows = await prisma.tableRow.findMany({
        where: { tableId: id }
      });

      await Promise.all(
        rows.map(row =>
          prisma.tableCell.create({
            data: {
              rowId: row.id,
              columnId: column.id,
              value: formatCellValue(defaultValue, type)
            }
          })
        )
      );
    }

    const response: ApiResponse = {
      success: true,
      data: column,
      message: 'Column added successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add column' 
    });
  }
});

// Update column
router.put('/:id/columns/:columnId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id, columnId } = req.params;
    const updateData = req.body;

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Check if column exists
    const existingColumn = await prisma.tableColumn.findFirst({
      where: { id: columnId, tableId: id }
    });

    if (!existingColumn) {
      return res.status(404).json({ 
        success: false, 
        error: 'Column not found' 
      });
    }

    const column = await prisma.tableColumn.update({
      where: { id: columnId },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: column,
      message: 'Column updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update column' 
    });
  }
});

// Delete column
router.delete('/:id/columns/:columnId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id, columnId } = req.params;

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Check if column exists
    const existingColumn = await prisma.tableColumn.findFirst({
      where: { id: columnId, tableId: id }
    });

    if (!existingColumn) {
      return res.status(404).json({ 
        success: false, 
        error: 'Column not found' 
      });
    }

    await prisma.tableColumn.delete({
      where: { id: columnId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Column deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete column' 
    });
  }
});

// Add row to table
router.post('/:id/rows', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { data }: CreateRowRequest = req.body;

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId },
      include: {
        columns: true,
        rows: {
          select: { order: true },
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    const nextOrder = (table.rows[0]?.order || 0) + 1;

    // Create row
    const row = await prisma.tableRow.create({
      data: {
        tableId: id,
        order: nextOrder
      }
    });

    // Create cells for each column
    const cellPromises = table.columns.map(column => {
      const value = data[column.name] !== undefined ? 
        formatCellValue(data[column.name], column.type as ColumnType) : 
        (column.defaultValue ? formatCellValue(column.defaultValue, column.type as ColumnType) : null);

      return prisma.tableCell.create({
        data: {
          rowId: row.id,
          columnId: column.id,
          value
        }
      });
    });

    await Promise.all(cellPromises);

    // Fetch the created row with cells
    const createdRow = await prisma.tableRow.findUnique({
      where: { id: row.id },
      include: {
        cells: {
          include: {
            column: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: createdRow,
      message: 'Row added successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add row' 
    });
  }
});

// Bulk add rows
router.post('/:id/rows/bulk', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { rows }: BulkRowRequest = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rows array is required' 
      });
    }

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId },
      include: {
        columns: true,
        rows: {
          select: { order: true },
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    let nextOrder = (table.rows[0]?.order || 0) + 1;
    const createdRows = [];

    // Process rows in batches to avoid overwhelming the database
    for (const rowData of rows) {
      const row = await prisma.tableRow.create({
        data: {
          tableId: id,
          order: nextOrder++
        }
      });

      const cellPromises = table.columns.map(column => {
        const value = rowData[column.name] !== undefined ? 
          formatCellValue(rowData[column.name], column.type as ColumnType) : 
          (column.defaultValue ? formatCellValue(column.defaultValue, column.type as ColumnType) : null);

        return prisma.tableCell.create({
          data: {
            rowId: row.id,
            columnId: column.id,
            value
          }
        });
      });

      await Promise.all(cellPromises);
      createdRows.push(row);
    }

    const response: ApiResponse = {
      success: true,
      data: createdRows,
      message: `${createdRows.length} rows added successfully`
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error bulk adding rows:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add rows' 
    });
  }
});

// Update cell value
router.put('/:id/rows/:rowId/cells/:columnId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id, rowId, columnId } = req.params;
    const { value } = req.body;

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Get column to determine type
    const column = await prisma.tableColumn.findFirst({
      where: { id: columnId, tableId: id }
    });

    if (!column) {
      return res.status(404).json({ 
        success: false, 
        error: 'Column not found' 
      });
    }

    const formattedValue = formatCellValue(value, column.type as ColumnType);

    // Update or create cell
    const cell = await prisma.tableCell.upsert({
      where: {
        rowId_columnId: {
          rowId,
          columnId
        }
      },
      update: {
        value: formattedValue
      },
      create: {
        rowId,
        columnId,
        value: formattedValue
      }
    });

    const response: ApiResponse = {
      success: true,
      data: cell,
      message: 'Cell updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update cell' 
    });
  }
});

// Delete row
router.delete('/:id/rows/:rowId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id, rowId } = req.params;

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    // Check if row exists
    const existingRow = await prisma.tableRow.findFirst({
      where: { id: rowId, tableId: id }
    });

    if (!existingRow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Row not found' 
      });
    }

    await prisma.tableRow.delete({
      where: { id: rowId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Row deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete row' 
    });
  }
});

// Save Apollo search results to table
router.post('/:id/import/apollo', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { searchResults } = req.body;

    if (!searchResults?.people || !Array.isArray(searchResults.people)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid search results data' 
      });
    }

    // Check if table exists and belongs to user
    const table = await prisma.userTable.findFirst({
      where: { id, userId },
      include: {
        columns: true,
        rows: {
          select: { order: true },
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    });

    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table not found' 
      });
    }

    let nextOrder = (table.rows[0]?.order || 0) + 1;
    const importedRows = [];

    // Process each person from search results
    for (const person of searchResults.people) {
      const row = await prisma.tableRow.create({
        data: {
          tableId: id,
          sourceRowId: person.id,
          order: nextOrder++
        }
      });

      // Map Apollo data to table columns
      const cellPromises = table.columns.map(column => {
        let value = null;

        // Map common Apollo fields
        switch (column.name.toLowerCase()) {
          case 'name':
            value = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
            break;
          case 'first_name':
            value = person.first_name;
            break;
          case 'last_name':
            value = person.last_name;
            break;
          case 'title':
            value = person.title;
            break;
          case 'email':
            value = person.email;
            break;
          case 'phone':
            value = person.phone;
            break;
          case 'company':
            value = person.organization?.name;
            break;
          case 'linkedin':
          case 'linkedin_url':
            value = person.linkedin_url;
            break;
          case 'seniority':
            value = person.seniority;
            break;
          case 'departments':
            value = person.departments?.join(', ');
            break;
          case 'email_status':
            value = person.email_status;
            break;
          case 'phone_status':
            value = person.phone_status;
            break;
          case 'company_website':
            value = person.organization?.website_url;
            break;
          default:
            // Try to find nested values
            if (person[column.name]) {
              value = person[column.name];
            }
            break;
        }

        const formattedValue = value ? formatCellValue(value, column.type as ColumnType) : null;

        return prisma.tableCell.create({
          data: {
            rowId: row.id,
            columnId: column.id,
            value: formattedValue
          }
        });
      });

      await Promise.all(cellPromises);
      importedRows.push(row);
    }

    const response: ApiResponse = {
      success: true,
      data: importedRows,
      message: `Imported ${importedRows.length} records from Apollo search`
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error importing Apollo data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import Apollo data' 
    });
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/', // temporary directory for uploaded files
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// CSV Upload endpoint
router.post('/upload-csv', upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No CSV file provided' 
      });
    }

    const { tableName } = req.body;
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Generate unique table name if not provided
    const finalTableName = tableName || originalName.replace('.csv', '') || `Table_${new Date().toISOString().split('T')[0]}`;

    // Parse CSV headers to determine column structure
    const csvHeaders: string[] = [];
    const sampleRows: Record<string, any>[] = [];
    
    try {
      // Read first few rows to analyze structure
      await new Promise<void>((resolve, reject) => {
        let rowCount = 0;
        const maxSampleRows = 5;
        
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headers: string[]) => {
            csvHeaders.push(...headers);
          })
          .on('data', (row: Record<string, any>) => {
            if (rowCount < maxSampleRows) {
              sampleRows.push(row);
              rowCount++;
            } else {
              // We have enough samples, stop reading
              resolve();
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      if (csvHeaders.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          success: false, 
          error: 'CSV file appears to be empty or invalid' 
        });
      }

      // Determine column types based on sample data
      const columns = csvHeaders.map((header, index) => {
        // Clean header name
        const cleanHeader = header.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        
        // Analyze sample data to determine type
        let columnType: ColumnType = COLUMN_TYPES.TEXT;
        
        for (const row of sampleRows) {
          const value = row[header];
          if (value && value.toString().trim() !== '') {
            // Check for email
            if (/@/.test(value) && /\.[a-z]{2,}$/i.test(value)) {
              columnType = COLUMN_TYPES.EMAIL;
              break;
            }
            // Check for URL
            if (/^https?:\/\//.test(value)) {
              columnType = COLUMN_TYPES.URL;
              break;
            }
            // Check for number
            if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
              columnType = COLUMN_TYPES.NUMBER;
            }
            // Check for currency
            if (/^\$[\d,]+\.?\d*$/.test(value)) {
              columnType = COLUMN_TYPES.CURRENCY;
            }
            // Check for date (be more strict about date detection)
            if (!isNaN(Date.parse(value)) && 
                (value.includes('/') || value.includes('-') || value.match(/\d{4}/))) {
              const parsedDate = new Date(value);
              if (parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
                columnType = COLUMN_TYPES.DATE;
              }
            }
            // Check for boolean
            if (['true', 'false', 'yes', 'no', '1', '0'].includes(value.toString().toLowerCase())) {
              columnType = COLUMN_TYPES.CHECKBOX;
            }
          }
        }

        return {
          name: cleanHeader || `Column_${index + 1}`,
          type: columnType,
          isRequired: false,
          isEditable: true,
          defaultValue: null,
          settings: {}
        };
      });

      // Check if table name already exists
      const existingTable = await prisma.userTable.findUnique({
        where: {
          userId_name: {
            userId,
            name: finalTableName
          }
        }
      });

      if (existingTable) {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(409).json({ 
          success: false, 
          error: `Table with name "${finalTableName}" already exists` 
        });
      }

      // Create the table
      const table = await prisma.userTable.create({
        data: {
          userId,
          name: finalTableName,
          description: `Imported from ${originalName}`,
          sourceType: 'csv_upload',
          sourceId: req.file.filename,
        },
        include: {
          columns: true
        }
      });

      // Create columns
      const createdColumns = await Promise.all(
        columns.map((column, index) => 
          prisma.tableColumn.create({
            data: {
              tableId: table.id,
              name: column.name,
              type: column.type,
              isRequired: column.isRequired || false,
              isEditable: column.isEditable !== false,
              defaultValue: column.defaultValue,
              order: index,
              settings: column.settings || {}
            }
          })
        )
      );

      // Generate job ID for processing
      const jobId = uuidv4();

      // Store job info in database or Redis for tracking
      // For now, we'll process the CSV directly since we don't have a CSV queue set up
      // In a production environment, you'd want to use a job queue for large files
      
      // Process CSV rows in batches
      const rows: Record<string, any>[] = [];
      
      // Re-read the entire file to get all data
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row: Record<string, any>) => {
            rows.push(row);
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // Process rows in batches to avoid overwhelming the database
      const batchSize = 100;
      let processedCount = 0;
      
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        const rowPromises = batch.map(async (csvRow, batchIndex) => {
          const rowOrder = processedCount + batchIndex + 1;
          
          const tableRow = await prisma.tableRow.create({
            data: {
              tableId: table.id,
              order: rowOrder
            }
          });

          // Create cells for this row
          const cellPromises = createdColumns.map(column => {
            const originalHeader = csvHeaders.find(h => h.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') === column.name);
            const value = originalHeader ? csvRow[originalHeader] : null;
            const formattedValue = value ? formatCellValue(value, column.type as ColumnType) : null;

            return prisma.tableCell.create({
              data: {
                rowId: tableRow.id,
                columnId: column.id,
                value: formattedValue
              }
            });
          });

          await Promise.all(cellPromises);
          return tableRow;
        });

        await Promise.all(rowPromises);
        processedCount += batch.length;
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      const response: ApiResponse = {
        success: true,
        data: {
          jobId,
          tableId: table.id,
          tableName: table.name,
          rowsProcessed: processedCount,
          columnsCreated: createdColumns.length
        },
        message: `CSV uploaded successfully. Created table "${table.name}" with ${processedCount} rows and ${createdColumns.length} columns.`
      };

      res.status(201).json(response);

    } catch (csvError) {
      // Clean up uploaded file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('Error processing CSV:', csvError);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid CSV format or processing error' 
      });
    }

  } catch (error) {
    console.error('Error uploading CSV:', error);
    
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload CSV file' 
    });
  }
});

export default router; 