# Design Document

## Overview

This design document outlines the technical approach to fix the mocked data issue in the time clock system. The solution involves removing mock data endpoints, properly integrating with the existing TimeClockService, and ensuring all endpoints return real database data.

## Architecture

### Current State Analysis

The system currently has multiple time clock endpoints with inconsistent behavior:

1. **TimeClockController** (`/time-clock/*`) - Uses real TimeClockService but has limited endpoints
2. **SimpleTimeClockController** (`/simple-time-clock/register`) - Returns mock data
3. **AppController** (`/time-clock` and `/time-clock/history/:employeeId`) - Mixed behavior (mock for registration, real for history)

### Target Architecture

```
Frontend (TimeClockHistoryModal, AutoTimeClockModal)
    ↓
API Gateway (Consistent endpoints)
    ↓
TimeClockController (Unified controller)
    ↓
TimeClockService (Real database operations)
    ↓
PrismaService (Database layer)
    ↓
PostgreSQL Database
```

## Components and Interfaces

### 1. TimeClockController Enhancement

**Current Issues:**
- Missing unified registration endpoint
- Inconsistent response formats
- No integration with frontend modals

**Design Solution:**
- Consolidate all time clock operations into TimeClockController
- Add missing endpoints for frontend integration
- Standardize response formats

### 2. Endpoint Consolidation

**Remove Mock Endpoints:**
- `SimpleTimeClockController.register()` - Delete entirely
- `AppController.registerTimeClock()` - Remove or redirect to real service

**Enhance Real Endpoints:**
- `POST /time-clock/register` - New unified registration endpoint
- `GET /time-clock/history/:employeeId` - Move from AppController to TimeClockController
- Maintain existing endpoints with real data

### 3. Frontend Integration

**Update API Calls:**
- Change frontend to use consistent `/time-clock/*` endpoints
- Update TimeClockHistoryModal to use proper endpoint
- Ensure AutoTimeClockModal uses real registration endpoint

## Data Models

### TimeClockRecord (Existing Prisma Model)

```typescript
model TimeClock {
  id                String   @id @default(cuid())
  employeeId        String
  date              String   // YYYY-MM-DD format
  clockIn           String   // HH:MM format
  clockOut          String?  // HH:MM format
  photo             String?
  latitude          Float?
  longitude         Float?
  address           String?
  clockOutPhoto     String?
  clockOutLatitude  Float?
  clockOutLongitude Float?
  clockOutAddress   String?
  status            String   // PRESENT, LATE, ABSENT
  minutesLate       Int?
  totalHours        Float?
  regularHours      Float?
  overtimeHours     Float?
  lunchBreakMinutes Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  employee          User     @relation(fields: [employeeId], references: [id])
}
```

### API Response Formats

**Registration Response:**
```typescript
interface TimeClockRegistrationResponse {
  message: string;
  timeClock: TimeClockRecord;
  isLate?: boolean;
  minutesLate?: number;
  totalHours?: number;
  regularHours?: number;
  overtimeHours?: number;
}
```

**History Response:**
```typescript
interface TimeClockHistoryResponse {
  employeeId: string;
  records: TimeClockRecord[];
  totalRecords: number;
  period: {
    startDate: string;
    endDate: string;
  };
  statistics?: {
    totalDays: number;
    totalHours: number;
    totalOvertime: number;
    totalLateMinutes: number;
    averageHours: number;
  };
}
```

## Error Handling

### Validation Rules

1. **Employee Validation:**
   - Verify employee exists before registration
   - Check if employee belongs to correct store
   - Validate employee is active

2. **Time Validation:**
   - Prevent duplicate clock-in for same day
   - Ensure clock-out has corresponding clock-in
   - Validate reasonable time ranges

3. **Data Validation:**
   - Required fields: employeeId, timestamp
   - Optional fields: photo, location data
   - Proper date/time formats

### Error Responses

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
```

## Testing Strategy

### Unit Tests
- TimeClockService methods (clockIn, clockOut, getEmployeeTimeClock)
- Data validation functions
- Time calculation logic

### Integration Tests
- End-to-end registration flow
- History retrieval with filters
- Error handling scenarios

### API Tests
- All endpoint responses return real data
- No mock data in any response
- Consistent response formats

## Migration Strategy

### Phase 1: Backend Cleanup
1. Remove SimpleTimeClockController
2. Remove mock endpoints from AppController
3. Add missing endpoints to TimeClockController

### Phase 2: Frontend Updates
1. Update API calls to use consistent endpoints
2. Test all time clock modals
3. Verify data consistency

### Phase 3: Validation
1. Test complete registration flow
2. Verify history displays real data
3. Confirm no mock data remains

## Security Considerations

### Authentication
- All endpoints require JWT authentication
- Role-based access control (ADMIN, STORE_MANAGER, CASHIER)
- Employee can only access own records

### Data Protection
- Validate employee permissions
- Sanitize location data
- Secure photo upload handling

## Performance Considerations

### Database Optimization
- Index on employeeId and date fields
- Efficient date range queries
- Pagination for large history requests

### Caching Strategy
- Cache employee validation results
- Consider caching recent time clock records
- Invalidate cache on new registrations