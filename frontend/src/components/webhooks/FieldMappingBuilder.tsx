/**
 * FieldMappingBuilder
 * 
 * Interactive field mapping component for incoming webhooks.
 * Allows users to map external JSON fields to table columns visually.
 * 
 * Features:
 * - Extract fields from sample JSON
 * - Dropdown selection for target columns
 * - Visual field mapping rows
 * - Validation for required columns
 * 
 * @example
 * <FieldMappingBuilder
 *   availableFields={['email', 'firstName', 'lastName']}
 *   tableColumns={columns}
 *   mapping={mapping}
 *   onChange={setMapping}
 * />
 */

'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TableColumn } from './types';

interface FieldMappingBuilderProps {
  availableFields: string[];
  tableColumns: TableColumn[];
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

export const FieldMappingBuilder: React.FC<FieldMappingBuilderProps> = ({
  availableFields,
  tableColumns,
  mapping,
  onChange,
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  // Handle mapping change for a specific field
  const handleMappingChange = (sourceField: string, targetColumnId: string) => {
    const newMapping = { ...mapping };
    
    if (targetColumnId === '__remove__') {
      delete newMapping[sourceField];
    } else {
      newMapping[sourceField] = targetColumnId;
    }
    
    onChange(newMapping);
    validateMapping(newMapping);
  };

  // Validate that all required columns are mapped
  const validateMapping = (currentMapping: Record<string, string>) => {
    const validationErrors: string[] = [];
    
    // Get all required columns
    const requiredColumns = tableColumns.filter(col => col.isRequired);
    const mappedColumnIds = Object.values(currentMapping);
    
    // Check if required columns are mapped
    requiredColumns.forEach(col => {
      if (!mappedColumnIds.includes(col.id)) {
        validationErrors.push(`Required column "${col.name}" must be mapped`);
      }
    });
    
    setErrors(validationErrors);
  };

  // Get the column name for a column ID
  const getColumnName = (columnId: string): string => {
    const column = tableColumns.find(col => col.id === columnId);
    return column ? column.name : columnId;
  };

  // Check if a column is already mapped
  const isColumnMapped = (columnId: string, currentField: string): boolean => {
    return Object.entries(mapping).some(
      ([field, id]) => id === columnId && field !== currentField
    );
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Map the fields from your incoming webhook payload to table columns.
          Required columns must be mapped.
        </AlertDescription>
      </Alert>

      {/* Field Mapping Rows */}
      <div className="space-y-3">
        {availableFields.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No fields available. Add a sample JSON to see fields.
          </div>
        ) : (
          availableFields.map((field) => (
            <div key={field} className="flex items-center gap-3">
              {/* Source Field */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1">
                  Webhook Field
                </Label>
                <div className="px-3 py-2 bg-muted rounded text-sm font-mono">
                  {field}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-muted-foreground pt-5">→</div>

              {/* Target Column */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1">
                  Table Column
                </Label>
                <Select
                  value={mapping[field] || ''}
                  onValueChange={(value) => handleMappingChange(field, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__remove__">
                      <span className="text-muted-foreground">-- Not mapped --</span>
                    </SelectItem>
                    {tableColumns.map((column) => {
                      const isMapped = isColumnMapped(column.id, field);
                      return (
                        <SelectItem
                          key={column.id}
                          value={column.id}
                          disabled={isMapped}
                        >
                          <span className="flex items-center gap-2">
                            {column.name}
                            {column.isRequired && (
                              <span className="text-red-500">*</span>
                            )}
                            {isMapped && (
                              <span className="text-xs text-muted-foreground">(mapped)</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Remove Button */}
              {mapping[field] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMappingChange(field, '__remove__')}
                  className="mt-5"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Summary */}
      {Object.keys(mapping).length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Current Mapping:</p>
          <div className="space-y-1">
            {Object.entries(mapping).map(([field, columnId]) => (
              <div key={field} className="text-xs text-muted-foreground">
                <code className="bg-muted px-1 rounded">{field}</code>
                {' → '}
                <span>{getColumnName(columnId)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


