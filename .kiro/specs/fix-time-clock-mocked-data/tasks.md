# Implementation Plan

- [x] 1. Remove mock data endpoints and controllers
  - Delete SimpleTimeClockController entirely as it only returns mock data
  - Remove mock registration endpoint from AppController
  - Clean up unused imports and dependencies
  - _Requirements: 1.4, 1.5_

- [x] 2. Enhance TimeClockController with missing endpoints
- [x] 2.1 Add unified registration endpoint
  - Create POST /time-clock/register endpoint that uses real TimeClockService.clockIn()
  - Implement proper request validation and error handling
  - Return consistent response format with real database data
  - _Requirements: 1.1, 2.1, 2.5_

- [x] 2.2 Move history endpoint to TimeClockController
  - Move GET /time-clock/history/:employeeId from AppController to TimeClockController
  - Ensure it uses existing TimeClockService.getEmployeeTimeClock() method
  - Maintain existing functionality and response format
  - _Requirements: 3.1, 3.2_

- [ ] 2.3 Add clock-out endpoint integration
  - Ensure TimeClockController has proper clock-out endpoint
  - Integrate with TimeClockService.clockOut() method
  - Handle time calculations and validation
  - _Requirements: 2.2, 2.4_

- [ ] 3. Update frontend API integration
- [-] 3.1 Fix AutoTimeClockModal API calls
  - Update handleTimeClock function to use /time-clock/register endpoint
  - Remove hardcoded localhost:3001 and use proper API configuration
  - Handle response format changes from real data
  - _Requirements: 2.1, 2.5_

- [ ] 3.2 Fix TimeClockHistoryModal API calls
  - Update fetchHistory to use /time-clock/history/:employeeId endpoint
  - Ensure proper error handling for real database responses
  - Handle empty results and loading states correctly
  - _Requirements: 3.1, 3.3_

- [ ] 4. Update app module configuration
- [ ] 4.1 Remove SimpleTimeClockController from app module
  - Remove SimpleTimeClockController from imports and providers
  - Clean up module dependencies
  - _Requirements: 1.4_

- [ ] 4.2 Ensure TimeClockService is properly injected
  - Verify TimeClockService is available in TimeClockController
  - Check all required dependencies are imported in TimeClockModule
  - _Requirements: 1.1, 1.2_

- [ ] 5. Validate data consistency and test endpoints
- [ ] 5.1 Test registration flow end-to-end
  - Verify clock-in creates real database records
  - Test clock-out updates existing records correctly
  - Validate time calculations and status assignments
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 5.2 Test history retrieval with real data
  - Verify history endpoint returns actual database records
  - Test date filtering functionality
  - Confirm statistics calculations are accurate
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 5.3 Write integration tests for time clock endpoints
  - Create tests for registration endpoints with real database
  - Test history retrieval with various filter combinations
  - Verify error handling for invalid employee IDs
  - _Requirements: 1.3, 2.3, 3.5_