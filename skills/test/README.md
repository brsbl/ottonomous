# Test

Run automated tests and visual verification with dev-browser.

## Usage

```bash
/test              # Run all tests + visual verification
/test --unit       # Run only unit/automated tests
/test --visual     # Run only visual verification with dev-browser
```

## What It Does

- Detects test runner (npm test, pytest, go test, etc.)
- Runs automated tests and captures results
- Walks through UI flows with dev-browser
- Captures screenshots at each step
- Generates test report

## Integration

Called automatically by `/otto` for consistent verification across manual and autonomous modes.

## Example

```bash
/test

# Detecting test environment...
# Found: npm test (Jest)
# Running unit tests... 23 passed
#
# Testing flow: login... passed
# Testing flow: dashboard... passed
#
# All tests passed!
# Screenshots: ./test-screenshots/
```

Use for comprehensive testing of both code and UI
