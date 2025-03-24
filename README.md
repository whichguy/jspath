# JSPath

[![npm version](https://img.shields.io/npm/v/jspath.svg)](https://www.npmjs.com/package/jspath)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful utility library for manipulating JavaScript objects using path-like syntax. JSPath provides easy access, modification, and traversal of complex data structures.

## Features

- **Path traversal**: Access nested values using dot notation and bracket syntax
- **Data manipulation**: Modify objects at specific paths
- **String templating**: Replace placeholders with data from objects
- **Expression evaluation**: Execute code against an object context
- **Caching**: Efficient data caching with validation and expiration
- **Formatting utilities**: Pretty printing and string manipulation
- **Type checking**: Verify and validate data types

## Installation

```bash
npm install jspath
```

## Basic Usage

```javascript
const jspath = require('jspath');

// Access nested values
const data = { user: { profile: { name: 'John', age: 30 } } };
const name = jspath.fetch(data, 'user.profile.name'); // 'John'

// Modify objects
jspath.apply(data, 'user.profile.location', 'New York');
// data now includes location: { user: { profile: { name: 'John', age: 30, location: 'New York' } } }

// Template substitution
const template = 'Hello {{user.profile.name}}, you are {{user.profile.age}} years old.';
const message = jspath.substitute(data, template); 
// 'Hello John, you are 30 years old.'

// Check for missing values
const missing = jspath.isMissing(data, 'user.profile.email'); // ['user.profile.email']
```

## API Reference

### Core Functions

- **fetch(namespace, path)**: Retrieve a value from a nested object using a path
- **apply(dict, path, value)**: Set a value at a specific path, creating intermediate objects as needed
- **parsePath(path)**: Convert a string path to an array of keys
- **eval(dictionary, expression, ...args)**: Evaluate a JavaScript expression within a dictionary context

### Template Functions

- **substitute(state, str, callback, keepFormattingIfMissing)**: Replace placeholders in a string with values from an object
- **substituteTree(state, input, callback, keepFormattingIfMissing)**: Apply substitution to all strings in an object tree
- **isMissing(namespace, arg)**: Identify missing paths in a namespace
- **isMissingSubstitute(namespace, substitute_string)**: Check for missing placeholders in a template

### Utility Functions

- **fmt(x, arraySep, dictSep, braceSep, dictIndent)**: Format a value as a string with customizable separators
- **snippet(input, N)**: Clip strings within a data structure to N characters
- **isProbablyBase64(str)**: Check if a string is likely base64-encoded
- **llmStringify(toFormat)**: Format an object as a JSON string for LLM prompts

### Caching API

- **cache.get(path, fetchFunction, cacheValidation, cacheLevel, options)**: Get or fetch data with caching
- **cache.isCacheValid(path, cacheValidation, cacheLevel, verifyConsistency)**: Verify cache validity
- **cache.forceRefresh(path, data, expectedContent, cacheLevel, options)**: Force cache refresh
- **cache.getSafe(path, expectedContent, cacheLevel)**: Safely retrieve cached data
- **cache.clearCacheForPath(path, cacheLevel)**: Clear a specific cache entry

## Advanced Usage

### Working with Complex Paths

```javascript
// Accessing array elements
const data = { users: [{ name: 'Alice' }, { name: 'Bob' }] };
jspath.fetch(data, 'users[1].name'); // 'Bob'

// Paths with special characters
const specialData = { 'user.name': 'Alice' };
jspath.fetch(specialData, '["user.name"]'); // 'Alice'
```

### Template Substitution with Custom Callbacks

```javascript
const data = { name: 'John', age: null };
const template = 'Name: {{name}}, Age: {{age}}';

// Custom callback for formatting
const callback = (state, match, value, path) => {
  if (value === null || value === undefined) return 'N/A';
  return String(value).toUpperCase();
};

jspath.substitute(data, template, callback);
// 'Name: JOHN, Age: N/A'
```

### Caching with Validation

```javascript
// Cache function that fetches data from API
const fetchFromApi = (path) => {
  // Simulate API call
  return { data: 'API response' };
};

// Get data with 30 minute cache
const options = { 
  expiration: '30m',
  bypassCache: false
};

const result = jspath.cache.get(
  'api/users', 
  fetchFromApi, 
  'validation-key',
  'USER',
  options
);
```

## License

MIT