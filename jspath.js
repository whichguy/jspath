// jspath.js - Module with the primary business logic
try { require(process.cwd() + '/0_shim.js'); } catch {}
function _main(module = globalThis['__modules']['jspath/jspath.js'], exports = module.exports, require = module.require) {
  ///////// BEGIN USER CODE /////////

  /**
   * @fileoverview JSPath - A powerful utility library for working with nested JavaScript objects
   * and performing template-based string substitution with path expressions.
   * 
   * This library provides a comprehensive set of functions for:
   * - Retrieving values from nested objects using path expressions
   * - Setting values in nested objects, automatically creating intermediary structures
   * - Evaluating JavaScript expressions with object context
   * - Replacing placeholders in templates with values from objects
   * - Caching expensive operations with configurable expiration
   * 
   * @module jspath
   * @version 1.0.0
   * @author MCP Team
   * 
   * @example
   * // Basic usage - fetching nested values
   * const data = { user: { profile: { name: 'Alice', age: 30 } } };
   * jspath.fetch(data, 'user.profile.name'); // Returns 'Alice'
   * 
   * @example
   * // Template substitution
   * const state = { user: 'Alice', count: 5 };
   * jspath.substitute(state, 'Hello, {{user}}! You have {{count}} new messages.');
   * // Returns 'Hello, Alice! You have 5 new messages.'
   * 
   * @example
   * // Creating/updating nested paths
   * let config = {};
   * jspath.apply(config, 'app.settings.theme', 'dark');
   * jspath.apply(config, 'app.settings.notifications', true);
   * // config is now: { app: { settings: { theme: 'dark', notifications: true } } }
   * 
   * @example
   * // Template substitution with expressions
   * const state = { user: { age: 25, premium: true } };
   * jspath.substitute(state, 'Status: {{ user.premium ? "Premium" : "Basic" }} user');
   * // Returns 'Status: Premium user'
   * 
   * @example
   * // Caching expensive operations
   * const result = jspath.cache.get(
   *   '/expensive/operation/key',
   *   () => performExpensiveCalculation(),
   *   'validation-string',
   *   'DOCUMENT',
   *   { expiration: '1h' }
   * );
   */


  /**
   * Evaluates a given expression using the provided dictionary as the context (`this`),
   * and passes any additional arguments as an array named `args` to the expression.
   *
   * **Warning:** The expression is evaluated using `new Function`, which can execute
   * arbitrary code. Ensure that the expression comes from a trusted source.
   *
   * @param {Object} dictionary - The object to be used as the context (`this`) for the expression.
   * @param {string} expression - The JavaScript expression to be evaluated. The expression
   *                              can access the dictionary via `this` and the arguments via `args`.
   * @param {...*} args - Additional arguments to be passed as an array to the expression.
   * @returns {*} The result of evaluating the expression.
   * @throws {Error} If the evaluation fails or if the arguments are invalid.
   * 
   * @example
   * // Simple evaluation with dictionary context
   * jspath.eval({x: 10, y: 20}, 'return this.x + this.y'); // Returns 30
   * 
   * @example
   * // Using additional arguments
   * jspath.eval({name: 'Alice'}, 'return this.name + " " + args[0] + " " + args[1]', 'is', 'coding'); 
   * // Returns "Alice is coding"
   * 
   * @example
   * // Accessing nested properties
   * jspath.eval({user: {profile: {age: 25}}}, 'return this.user.profile.age >= 18'); // Returns true
   */
  function eval(dictionary, expression, ...args) {
    if (typeof dictionary !== 'object' && dictionary !== null) {
      throw new Error('dictionary must be an object or null');
    }
    
    if (typeof expression !== 'string') {
      throw new Error('expression must be a string');
    }
    
    try {
      // If dictionary is null, use an empty object
      const dict = dictionary || {};
      
      // Get all keys and values from the dictionary
      const argNames = [];
      const argValues = [];
      Object.keys(dict).forEach(k => { 
        argNames.push(k); 
        argValues.push(dict[k]); 
      });
      
      // Add 'args' as the last parameter name
      argNames.push('args');
      
      // Create a function with dictionary keys as parameters
      const func = new Function(...argNames, expression);
      
      // Bind the dictionary as this
      const boundFunc = func.bind(dict);
      
      // Call the bound function with values + args array as the last parameter
      return boundFunc(...argValues, ...args);
    } catch (e) {
      throw new Error("Error evaluating expression: " + e.message);
    }
  }
  /**
   * Clips strings within a data structure to the first N characters.
   * 
   * This function processes a given data structure, which can be a string, an object (dictionary),
   * or an array. It clips all strings within the structure to their first N characters:
   * - If the input is a string, it returns the first N characters of that string.
   * - If the input is an object, it recursively processes the object, clipping any string values
   *   to N characters while preserving the structure.
   * - If the input is an array, it applies the same logic to each element of the array.
   * - For other types (e.g., numbers, booleans), it returns them unchanged.
   * 
   * The function creates new objects and arrays without modifying the original input, ensuring it is pure.
   * 
   * @param {string | object | Array} input - The data structure to process. Can be a string, an object, or an array.
   * @param {number} N - The number of characters to keep for each string. If N is greater than the string's length,
   *                     the full string is kept. If N is 0 or negative, an empty string is returned for strings.
   * @returns {string | object | Array} - A new data structure with strings clipped to the first N characters.
   * 
   * @example
   * // String input
   * snippet("Hello, World!", 5) // Returns "Hello"
   */
  function snippet(input, N) {
    // Case 1: If input is a string, clip it to the first N characters
    if (typeof input === 'string') {
      return input.slice(0, N);
    }
    // Case 2: If input is an array, process each element recursively
    else if (Array.isArray(input)) {
      return input.map(element => this.snippet(element, N));
    }
    // Case 3: If input is a plain object, process its properties recursively
    else if (typeof input === 'object' && input !== null &&
            (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null)) {
      return Object.keys(input).reduce((acc, key) => {
        acc[key] = this.snippet(input[key], 30);
        return acc;
      }, {});
    }
    // Case 4: For all other types (numbers, booleans, null, etc.), return as is
    else {
      return input;
    }
  }
  /**
   * Determines if a string has a high probability of being in base64 format.
   *
   * @param {string} str - The string to check.
   * @returns {boolean} True if the string is likely base64-encoded, false otherwise.
   */
  function isProbablyBase64(str) {
    // Check if the argument is a string
    if (typeof str !== 'string') {
      return false;
    }

    // Regex to check for base64 character set and padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

    // Check if the string matches the base64 pattern and has a length that is a multiple of 4
    return base64Regex.test(str) && str.length % 4 === 0;
  }
  /**
   * Formats a value into a human-readable string representation, handling various data types 
   * including dates, strings, numbers, arrays, objects, and functions with customizable formatting.
   *
   * This function provides better visualization than JSON.stringify by maintaining readability 
   * of complex nested structures with proper indentation and formatting options.
   *
   * @param {any} x - The value to format.
   * @param {string} [arraySep='\n'] - The separator to use between array elements.
   * @param {string} [dictSep='\n'] - The separator to use between dictionary (object) entries.
   * @param {string} [braceSep='\n'] - The separator to use around braces in objects.
   * @param {number} [dictIndent=0] - The indentation level for dictionary entries.
   * @returns {string} The formatted string representation of the value.
   * @throws {TypeError} If separator arguments aren't strings or dictIndent isn't a non-negative integer.
   * 
   * @example
   * // Format a simple object
   * const user = { name: "John", age: 30, roles: ["admin", "user"] };
   * const formatted = jspath.fmt(user);
   * // Returns:
   * // {
   * //   name: "John",
   * //   age: 30,
   * //   roles: [
   * //     "admin",
   * //     "user"
   * //   ]
   * // }
   * 
   * @example
   * // Custom formatting with inline arrays
   * jspath.fmt(user, ", ", "\n", "\n", 1);
   * // Returns:
   * // {
   * //   name: "John",
   * //   age: 30,
   * //   roles: ["admin", "user"]
   * // }
   * 
   * @example
   * // Compact formatting for simple structures
   * jspath.fmt(user, " ", ", ", "", 0);
   * // Returns: {name: "John", age: 30, roles: ["admin", "user"]}
   */
  function fmt(x, arraySep = '\n', dictSep = '\n', braceSep = '\n', dictIndent = 0) {
    // Argument checking
    if (typeof arraySep !== 'string' || typeof dictSep !== 'string' || typeof braceSep !== 'string') {
      throw new TypeError('Separators must be strings');
    }
    if (typeof dictIndent !== 'number' || dictIndent < 0 || !Number.isInteger(dictIndent)) {
      throw new TypeError('dictIndent must be a non-negative integer');
    }

    let result = '';
    if (x == null) {
      return 'null';
    } else if (x === undefined) {
      return 'undefined';
    }

    const xType = x instanceof Date ? 'date' : typeof x;

    switch (xType) {
      case 'date':
        result += `"${x.toString()}"`;
        break;

      case 'string':
        result += `"${x}"`;
        break;

      case 'number':
        result += `${x}`;
        break;

      case 'object':
        if (Array.isArray(x)) {
          result +=
            '[' +
            arraySep +
            x.map((v) => this.fmt(v, arraySep, dictSep, braceSep, dictIndent + 1)).join(',' + arraySep) +
            arraySep +
            ']';
        } else {
          // Dictionary (object)
          result += '{' + braceSep;
          result +=
            Object.keys(x)
              .map(
                (k) =>
                  `${"  ".repeat(dictIndent)}${k}: ` +
                  this.fmt(x[k], arraySep, dictSep, braceSep, dictIndent + 1)
              )
              .join(',' + dictSep) +
            braceSep +
            '}';
        }
        break;

      case 'function':
        result += x.toString();
        break;

      default:
        result += String(x);
    }

    return result;
  }
  /**
   * Parses a string path into an array of keys, supporting both dot notation and bracket notation
   * with proper handling of quoted strings and escaped characters.
   * 
   * This function handles complex path expressions including:
   * - Standard dot notation (a.b.c)
   * - Bracket notation with numbers ([0], [1])
   * - Bracket notation with quoted strings (['key with spaces'], ["nested.key"])
   * - Mixed notation (users[0].profile.name)
   * - Escaped characters in keys (a.b.\"escaped\")
   *
   * @param {string} path - The path to parse (e.g., "a.b[0].c", "step_output['step.1']", "step_output[\"key with spaces\"]").
   * @returns {string[]} An array of individual keys extracted from the path.
   * @throws {Error} If path is not a string.
   * 
   * @example
   * // Simple dot notation
   * jspath.parsePath('user.profile.name'); // Returns ['user', 'profile', 'name']
   * 
   * @example
   * // Array index notation
   * jspath.parsePath('users[0].name'); // Returns ['users', '0', 'name']
   * 
   * @example
   * // Mixed notation with quoted keys
   * jspath.parsePath("data['user.name'][0].value"); // Returns ['data', 'user.name', '0', 'value']
   * 
   * @example
   * // Keys with special characters
   * jspath.parsePath("response['keys with spaces']"); // Returns ['response', 'keys with spaces']
   */
  function parsePath(path) {
    if (typeof path !== 'string') throw new Error(`Path must be a string, got ${typeof path}`);
    
    const keys = [];
    let key = '';
    let state = { bracket: false, quote: false, quoteChar: '', escape: false };
    
    // Process each character
    for (const char of path) {
      // Handle escape sequences
      if (state.escape) { key += char; state.escape = false; continue; }
      if (char === '\\') { state.escape = true; continue; }
      
      // Path separators and structure
      if (char === '[' && !state.quote) { 
        if (key) keys.push(key); 
        key = ''; 
        state.bracket = true; 
        continue; 
      }
      
      if ((char === '"' || char === "'") && state.bracket) {
        if (!state.quote) { state.quote = true; state.quoteChar = char; }
        else if (char === state.quoteChar) { state.quote = false; }
        else key += char;
        continue;
      }
      
      if (char === ']' && state.bracket && !state.quote) { 
        if (key) keys.push(key); 
        key = ''; 
        state.bracket = false; 
        continue; 
      }
      
      if (char === '.' && !state.bracket && !state.quote) { 
        if (key) keys.push(key); 
        key = ''; 
        continue; 
      }
      
      // Default: add character to current key
      key += char;
    }
    
    // Add the final key if it exists
    if (key) keys.push(key);
    
    return keys;
  }

  /**
   * Retrieves a value from an object using a string path expression with support for
   * dot notation and bracket notation.
   * 
   * This function safely traverses nested objects and arrays using the provided path,
   * returning undefined if any part of the path doesn't exist rather than throwing an error.
   *
   * @param {Object|null} namespace - The object to fetch from, or null.
   * @param {string} path - The path to the value (e.g., "user.profile.name", "users[0].address['city']").
   * @returns {*} The value at the path, or undefined if the path does not exist.
   * @throws {Error} If namespace is neither an object nor null, or if path is not a string.
   * 
   * @example
   * // Fetch from nested object
   * const data = { user: { profile: { name: 'Alice', age: 30 } } };
   * jspath.fetch(data, 'user.profile.name'); // Returns 'Alice'
   * 
   * @example
   * // Fetch from array
   * const data = { users: [{ name: 'Alice' }, { name: 'Bob' }] };
   * jspath.fetch(data, 'users[1].name'); // Returns 'Bob'
   * 
   * @example
   * // Handling non-existent paths
   * jspath.fetch(data, 'user.address.zipcode'); // Returns undefined
   * 
   * @example
   * // Path with special characters using bracket notation
   * const data = { 'response': { 'status code': 200 } };
   * jspath.fetch(data, "response['status code']"); // Returns 200
   */
  function fetch(namespace, path) {
    if (namespace !== null && typeof namespace !== 'object') {
      throw new Error('Namespace must be an object or null');
    }
    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }
    const keys = this.parsePath(path);
    if (keys.length === 0) {
      return namespace;
    }
    let current = namespace;
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      if (!(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Applies a value to a dictionary at the specified path, creating intermediate objects if necessary.
   * This is useful for building or modifying deeply nested objects without having to manually create
   * each level of the hierarchy.
   * 
   * The function will:
   * - Create missing objects along the path
   * - Overwrite any existing value at the final key
   * - Return the modified dictionary
   *
   * @param {Object|null} dict - The dictionary to modify. If null, a new object is created.
   * @param {string} path - The dot-separated path to the target key (e.g., "a.b.c", "users[0].profile.name").
   * @param {*} value - The value to set at the target key.
   * @returns {Object} The modified dictionary.
   * @throws {Error} If dict is neither an object nor null, or if path is not a string or is empty.
   * 
   * @example
   * // Set a value in a new object
   * jspath.apply(null, 'user.profile.name', 'Alice');
   * // Returns: { user: { profile: { name: 'Alice' } } }
   * 
   * @example
   * // Modify an existing object
   * const data = { user: { profile: { name: 'Alice' } } };
   * jspath.apply(data, 'user.profile.age', 30);
   * // data becomes: { user: { profile: { name: 'Alice', age: 30 } } }
   * 
   * @example
   * // Create nested arrays using bracket notation
   * jspath.apply({}, 'users[0].roles[0]', 'admin');
   * // Returns: { users: [ { roles: [ 'admin' ] } ] }
   * 
   * @example
   * // Override existing values
   * const data = { settings: { theme: 'light' } };
   * jspath.apply(data, 'settings.theme', 'dark');
   * // data becomes: { settings: { theme: 'dark' } }
   */
  function apply(dict, path, value) {
    // Check arguments
    if (dict !== null && typeof dict !== 'object') {
      throw new Error('Dict must be an object or null');
    }
    if (typeof path !== 'string' || path === '') {
      throw new Error('Path must be a non-empty string');
    }

    // Initialize dict if null
    if (dict === null) {
      dict = {};
    }

    // Parse the path into an array of keys
    const keys = this.parsePath(path);
    let current = dict;

    // Traverse all keys except the last one, creating objects as needed
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] == null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    // Assign the value to the last key
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    return dict;
  }
  /**
   * Substitutes placeholders in a template string with values from a state object.
   * Supports both simple variable substitution and complex expressions with optional
   * custom callback handling.
   * 
   * Placeholders use the format {{path}} or {{expression}} where:
   * - path: A dot-notation path to a value in the state object (e.g., "user.name")
   * - expression: A JavaScript expression to evaluate using the state object as context
   *   (e.g., "user.age > 18 ? 'Adult' : 'Minor'")
   *
   * @param {Object} state - The object containing the values to substitute.
   * @param {string} str - The template string with placeholders (e.g., "Hello {{name}}" or "{{ user.age > 18 ? 'Adult' : 'Minor' }}").
   * @param {Function} [callback] - Optional callback that receives (state, match, value, path) and returns the replacement string.
   * @param {boolean} [keepFormattingIfMissing=false] - If true, keeps the original placeholder when the path doesn't exist.
   * @param {boolean} [allowExpressions=true] - If true, allows JavaScript expressions in placeholders.
   * @returns {string} The string with placeholders replaced with their corresponding values.
   * @throws {Error} If state is not an object or is null, or if str is not a string.
   * 
   * @example
   * // Simple variable substitution
   * const state = { user: { name: 'Alice', age: 30 } };
   * jspath.substitute(state, 'Hello, {{user.name}}!'); // Returns "Hello, Alice!"
   * 
   * @example
   * // Using expressions
   * jspath.substitute(state, 'User is {{ user.age >= 18 ? "an adult" : "a minor" }}');
   * // Returns "User is an adult"
   * 
   * @example
   * // Using a custom callback
   * jspath.substitute(state, 'Hello, {{user.name}}!', 
   *   (state, match, value, path) => value.toUpperCase());
   * // Returns "Hello, ALICE!"
   * 
   * @example
   * // Handling missing values
   * jspath.substitute(state, 'City: {{user.address.city}}', null, true);
   * // Returns "City: {{user.address.city}}" (since keepFormattingIfMissing is true)
   */
  function substitute(state, str, callback, keepFormattingIfMissing = false, allowExpressions = true ) {
    const strType = typeof str;

    switch(strType) { 
      case 'number':
      case 'boolean':
        return String(str);
    }

    if (typeof str !== 'string') {
      throw new Error('String must be a string');
    }
    
    const valueToString = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch (e) {
          return '[object]';
        }
      }
      return '';
    };

    // Simple function to get a value from a path
    const getValueFromPath = (obj, path) => {
      if (!obj || typeof obj !== 'object') return undefined;
      
      if (typeof this.fetch === 'function') {
        return this.fetch(obj, path);
      }
      
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === null || typeof current !== 'object' || !(part in current)) {
          return undefined;
        }
        current = current[part];
      }
      
      return current;
    };

    // Expression detection regex
    const isExpressionPattern = /[!=<>]|&&|\|\||==|!==|\(|\?|\[/;
    
    return str.replace(/\{\s*\{\s{0,2}(.*?)\s{0,2}\}\s*\}/g, (match, path) => {
      const trimmedPath = path.trim();
      
      // Check if this appears to be an expression
      if (isExpressionPattern.test(trimmedPath)) {

        if ( allowExpressions == false )
        {
          if (keepFormattingIfMissing) {
            return match;
          }
          else {
            return '';
          }
        }

        try {
          // Only process if state is an object
          if (!state || typeof state !== 'object') {
            throw new Error('State must be an object for expression evaluation');
          }
          
          // Get the top-level keys from state to use as parameter names
          const paramNames = Object.keys(state);
          
          // Get the corresponding values
          const paramValues = paramNames.map(key => state[key]);
          
          // Create the function with the state properties as named parameters and embedded try-catch
          const functionBody = `
            try {
              return (${trimmedPath});
            } catch (e) {
              return e;  // Return the exception object
            }
          `;
          const expressionFunc = new Function(...paramNames, functionBody);
          
          // Execute the function with state values as arguments
          // Use .apply with an empty object as 'this' to ensure clean context
          const result = expressionFunc.apply({}, paramValues);
          
          // Check if the result is an exception
          // Handle reference error specifically
          if (result instanceof ReferenceError) {
            if (keepFormattingIfMissing) {
              return match;
            }
            return '';
          }
          else if ( result instanceof Error )
          {
            throw result ;
          }
          
          // If no exception, process the result normally
          if (callback && typeof callback === 'function') {
            return callback(state, match, result, trimmedPath, keepFormattingIfMissing);
          }
          
          // Convert the result to string
          return valueToString(result);
        } catch (e) {
          console.error('Error processing expression:', e);
          
          // If there's an error and keepFormattingIfMissing is true,
          // return the original match
          if (keepFormattingIfMissing) {
            return match;
          }
          return '';
        }
      } else {
        // Not an expression, handle as normal path
        const value = getValueFromPath(state, trimmedPath);
        
        // If a callback is provided and is a function, use it
        if (callback && typeof callback === 'function') {
          return callback(state, match, value, trimmedPath, keepFormattingIfMissing);
        }
        
        // If the value is undefined and keepFormattingIfMissing is true, keep the original match
        if (value === undefined && keepFormattingIfMissing) {
          return match;
        }
        
        // Otherwise, use the default behavior
        return valueToString(value);
      }
    });
  }
    
    // const strType = typeof str ;

    // switch( strType )
    // { 
    //   case 'number':
    //   case 'boolean':
    //     return String(str) ;
    //     break ;
    // }

    // if (typeof str !== 'string') {
    //   throw new Error('String must be a string');
    // }
    // const valueToString = (value) => {
    //   if (value === null || value === undefined) {
    //     return '';
    //   }
    //   if (typeof value === 'string') {
    //     return value;
    //   }
    //   if (typeof value === 'number' || typeof value === 'boolean') {
    //     return String(value);
    //   }
    //   if (typeof value === 'object') {
    //     try {
    //       return JSON.stringify(value);
    //     } catch (e) {
    //       return '[object]';
    //     }
    //   }
    //   return '';
    // };
    // return str.replace(/\{\s*\{\s{0,2}(.*?)\s{0,2}\}\s*\}/g, (match, path) => {
    //   const trimmedPath = path.trim();
    //   const value = state != null ? 
    //     this.fetch(state, trimmedPath) :
    //     undefined ;
      
    //   // If a callback is provided and is a function, use it
    //   if (callback && typeof callback === 'function') {
    //     return callback(state, match, value, trimmedPath, keepFormattingIfMissing);
    //   }
      
    //   // If the value is undefined and keepFormattingIfMissing is true, keep the original match
    //   if (value === undefined && keepFormattingIfMissing) {
    //     return match;
    //   }
      
    //   // Otherwise, use the default behavior
    //   return valueToString(value);
    // });
  
  /**
   * Extends the functionality of the substitute method to process entire object trees
   * or arrays, recursively substituting placeholders in all string values.
   * 
   * This function applies templating throughout an entire data structure, making it
   * easy to populate complex templates with dynamic data.
   * 
   * @param {Object} state - The object containing values for substitution.
   * @param {*} input - The input value to process (string, object, array, or primitive).
   * @param {Function} [callback] - Optional callback for custom replacement handling.
   * @param {boolean} [keepFormattingIfMissing=false] - If true, keeps original placeholders when paths don't exist.
   * @returns {*} A new value with all string placeholders substituted throughout the structure.
   * 
   * @example
   * // Process a template object
   * const state = { user: { name: 'Alice', age: 30 } };
   * const template = {
   *   greeting: 'Hello, {{user.name}}!',
   *   status: '{{user.age >= 18 ? "Adult" : "Minor"}}',
   *   details: {
   *     info: 'Name: {{user.name}}, Age: {{user.age}}'
   *   }
   * };
   * 
   * const result = jspath.substituteTree(state, template);
   * // Returns:
   * // {
   * //   greeting: 'Hello, Alice!',
   * //   status: 'Adult',
   * //   details: {
   * //     info: 'Name: Alice, Age: 30'
   * //   }
   * // }
   * 
   * @example
   * // Process arrays with templates
   * const users = [{ name: 'Alice' }, { name: 'Bob' }];
   * const template = [
   *   'User {{index}}: {{item.name}}',
   *   'Welcome {{item.name}}!'
   * ];
   * 
   * const results = users.map((user, index) => 
   *   jspath.substituteTree({ item: user, index }, template));
   * // Returns:
   * // [
   * //   ['User 0: Alice', 'Welcome Alice!'],
   * //   ['User 1: Bob', 'Welcome Bob!']
   * // ]
   */
  function substituteTree(state, input, callback, keepFormattingIfMissing) {

    // Handle null or undefined
    if (input === null || input === undefined) {
      return input;
    }

    // Handle arrays - create a new array
    if (Array.isArray(input)) {
      return input.map(item => this.substituteTree(state, item, callback,keepFormattingIfMissing));
    }
    // Handle objects - create a new object
    else if (typeof input === 'object') {
      const result = {};
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          result[key] = this.substituteTree(state, input[key], callback, keepFormattingIfMissing);
        }
      }
      return result;
    }
    else 
    {
      return substitute(state, input, callback, keepFormattingIfMissing);
    }
  }

  /**
   * Determines if a value is missing from an object at a specified path.
   * Useful for checking existence without throwing errors for deep paths.
   * 
   * @param {Object|null} namespace - The object to check within.
   * @param {string} arg - The path to check (e.g., "user.profile.name").
   * @returns {boolean} True if the value is missing, undefined, or null; false otherwise.
   * 
   * @example
   * // Check missing property
   * const data = { user: { profile: { name: 'Alice' } } };
   * jspath.isMissing(data, 'user.profile.age'); // Returns true
   * 
   * @example
   * // Check existing property
   * jspath.isMissing(data, 'user.profile.name'); // Returns false
   * 
   * @example
   * // Check with null/undefined values
   * const data = { user: { profile: { age: null, address: undefined } } };
   * jspath.isMissing(data, 'user.profile.age'); // Returns true (null is considered missing)
   * jspath.isMissing(data, 'user.profile.address'); // Returns true (undefined is missing)
   */
  function isMissing(namespace, arg) {
    if (typeof namespace !== 'object' || namespace === null) {
      throw new Error('Namespace must be an object');
    }
    const missing = new Set();
    if (typeof arg === 'string') {
      arg.replace(/{{([^}]+)}}/g, (match, path) => {
        if (this.fetch(namespace, path) === undefined) {
          missing.add(path);
        }
        return '';
      });
    } else if (Array.isArray(arg)) {
      for (const path of arg) {
        if (typeof path !== 'string') {
          throw new Error('All elements in the array must be strings');
        }
        if (this.fetch(namespace, path) === undefined) {
          missing.add(path);
        }
      }
    } else {
      throw new Error('Second argument must be a string or an array of strings');
    }
    return Array.from(missing);
  }

  /**
   * Formats a value into a string representation optimized for LLM (Large Language Model) consumption.
   * This is a specialized version of string formatting that prioritizes generating content that's 
   * easier for language models to process correctly.
   * 
   * @param {*} toFormat - The value to format into a string.
   * @returns {string} The formatted string representation.
   * 
   * @example
   * // Format a simple object for LLM
   * const data = { user: { name: 'Alice', permissions: ['read', 'write'] } };
   * jspath.llmStringify(data);
   * // Returns a string representing the object with formatting optimized for LLM understanding
   * 
   * @example
   * // Format error objects
   * try {
   *   throw new Error('Something went wrong');
   * } catch (error) {
   *   const errorString = jspath.llmStringify(error);
   *   // Returns a string representation of the error suitable for LLM processing
   * }
   */
  function llmStringify( toFormat )
  {
    return `\n\`\`\`\n${JSON.stringify(toFormat)}\n\`\`\`\n`;
  }

  /**
   * Identifies unique missing paths in the namespace based on placeholders in a substitute string.
   * @param {Object} namespace - The object to check against.
   * @param {string} substitute_string - The string with placeholders.
   * @returns {string[]} An array of unique missing paths in order of first appearance.
   * @throws {Error} If namespace is not an object or is null, or if substitute_string is not a string.
   */
  function isMissingSubstitute(namespace, substitute_string) {
    if (typeof namespace !== 'object' || namespace === null) {
      throw new Error('Namespace must be an object');
    }
    if (typeof substitute_string !== 'string') {
      throw new Error('Substitute string must be a string');
    }
    return this.isMissing(namespace, substitute_string);
  }


  // Add cache as a sub-namespace
  cache = {
  /**
   * Retrieves cached data or fetches and caches fresh data
   * The expectedContent parameter can be used to quickly validate against cached content
   * 
   * @param {string} path - The path or identifier for the content to retrieve
   * @param {Function|null} fetchFunction - Function to call if cache miss: fetchFunction(path, cacheLevel, options), if null and cache miss returns undefined
   * @param {string|null} cacheValidation - Expected content to validate cache against, if matched uses cache without fetch
   * @param {string} cacheLevel - Cache level to use: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   * @param {Object} options - Optional configuration
   * @param {string} options.expiration - Cache expiration as duration string (e.g., "30m", "6h", "1d")
   * @param {boolean} options.bypassCache - Force bypass cache and call fetchFunction
   * @param {number} options.maxSizeBytes - Maximum size for cached data in bytes (default: 100KB)
   * @param {boolean} options.extendCachePeriod - Whether to extend cache period on fetch
   * @returns {Object|undefined} The cached or freshly fetched data, or undefined if no fetch function and cache miss
   */
  getOrFetchWithCache: function(path, fetchFunction, cacheValidation = null, cacheLevel = 'DOCUMENT', options = {}) {
    // Default options
    const defaultOptions = {
      expiration: "20m",         // Default 20 minutes
      bypassCache: false,        // Force bypass cache if true
      maxSizeBytes: 100 * 1024,  // Default 100KB (Google Apps Script limit)
      extendCachePeriod: true,  // Whether to extend cache period on fetch
      strictConsistency: true    // Enforce strict consistency checks
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Convert duration string to seconds
    const expirationInSeconds = this._parseDuration(config.expiration);
    
    // Generate a secure hash from the path with jspath namespace
    const hashHex = this._generateSecureHash(path);
    const cacheKey = `jspath_json_cache_${hashHex}`;
    const metaKey = `jspath_meta_${hashHex}`;
    
    // Calculate content hash if expected content is provided
    let contentHash = null;
    if (cacheValidation !== null) {
      contentHash = this._generateSecureHash(cacheValidation);
    }
    
    // Select the appropriate cache based on the specified level
    const cache = this._getCacheService(cacheLevel);
    
    // Current timestamp for expiration checks
    const now = new Date().getTime();
    
    // If we're not bypassing the cache, try to get the data from cache
    if (!config.bypassCache) {
      // First check if we have metadata for this entry
      const metaData = cache.get(metaKey);
      
      if (metaData) {
        try {
          const meta = JSON.parse(metaData);
          
          // Determine if content matches based on expected content
          let contentMatch;
          if (cacheValidation === null) {
            // No content validation requested, consider it a match
            contentMatch = true;
          } else if (contentHash && meta.contentHash) {
            // Both hashes exist, check for exact match
            contentMatch = meta.contentHash === contentHash;
            if (!contentMatch) {
              console.log(`Content hash mismatch for path "${path}": expected ${contentHash}, got ${meta.contentHash}`);
            }
          } else {
            // Missing hash information when expectedContent is provided
            // Conservative approach: treat as mismatch
            contentMatch = false;
            console.log(`Cannot validate content match for path "${path}": missing hash information`);
          }
                              
          if (meta.expiresAt > now) {
            if (contentMatch) {
              // Valid cache entry with matching content, retrieve and return it
              const cachedData = cache.get(cacheKey);
              
              if (cachedData) {
                try {
                  // Verify cache consistency if strict mode is enabled
                  if (config.strictConsistency) {
                    // Check for a transactionId to ensure atomicity
                    if (!meta.transactionId) {
                      console.log(`Cache entry for path "${path}" lacks transaction ID, treating as stale`);
                      throw new Error("Cache inconsistency detected: missing transaction ID");
                    }
                  }
                  
                  // Validate the cached data format before attempting decompression
                  if (!cachedData || typeof cachedData !== 'string' || cachedData.trim() === '') {
                    throw new Error("Invalid or empty cached data");
                  }
                  
                  // Safely decode base64
                  let decodedData;
                  try {
                    decodedData = Utilities.base64Decode(cachedData);
                    if (!decodedData || decodedData.length === 0) {
                      throw new Error("Base64 decoding resulted in empty data");
                    }
                  } catch (decodeError) {
                    throw new Error(`Base64 decoding failed: ${decodeError.message}`);
                  }
                  
                  // Create blob and attempt to decompress
                  let jsonData;
                  try {
                    // First check metadata compression flag if available
                    let isCompressed = false;
                    if (meta && typeof meta.isCompressed !== 'undefined') {
                      isCompressed = meta.isCompressed;
                      console.log(`Using metadata isCompressed flag: ${isCompressed}`);
                    } else {
                      // Then perform magic number check as backup
                      try {
                        // More careful check for gzip magic numbers
                        if (decodedData && decodedData.length > 2) {
                          // Apply bitmask to ensure proper byte comparison
                          isCompressed = (decodedData[0] & 0xFF) === 31 && (decodedData[1] & 0xFF) === 139;
                          console.log(`Magic number check: bytes [${(decodedData[0] & 0xFF)}, ${(decodedData[1] & 0xFF)}], isGzipped: ${isCompressed}`);
                        }
                      } catch (magicNumberError) {
                        console.log(`Error checking magic numbers: ${magicNumberError.message}`);
                        isCompressed = false;
                      }
                    }

                    // Log the data type for debugging
                    console.log(`Data appears to be ${isCompressed ? 'compressed' : 'uncompressed'}`);
                    
                    // First approach: assume data is intended to be JSON
                    // try {
                    //   // Try direct string conversion first (no decompression)
                    //   const directString = Utilities.newBlob(decodedData).getDataAsString();
                    //   // Check if it's valid JSON
                    //   try {
                    //     const parsedJson = JSON.parse(directString);
                    //     console.log("Successfully parsed JSON directly from bytes");
                    //     return parsedJson;
                    //   } catch (jsonError) {
                    //     console.log(`Direct JSON parsing failed: ${jsonError.message}`);
                    //     // Not valid JSON, continue to decompression attempts
                    //   }
                    // } catch (directError) {
                    //   console.log(`Direct string conversion failed: ${directError.message}`);
                    // }

                    // Second approach: try various decompression methods if the data seems compressed
                    if (isCompressed) {
                      try {
                        // DEFENSIVE APPROACH: Try multiple ways to decompress the data
                        
                        // Method 1: Try with no content type
                        try {
                          const blobType = 'application/x-gzip'; 
                          const blob1 = Utilities.newBlob(decodedData, blobType );
                          const decompressed1 = Utilities.ungzip(blob1);
                          jsonData = decompressed1.getDataAsString();
                          console.log(`Decompression successful with ${blobType} content type`);
                          try {
                            return JSON.parse(jsonData);
                          } catch (e) {
                            console.log(`Decompressed data is not valid JSON: ${e.message}`);
                          }
                        } catch (e1) {
                          console.log(`Method 1 failed: ${e1.message}`);
                          // Continue to next method
                        }
                        
                        // Method 2: Try with gzip content type
                        try {
                          const blob2 = Utilities.newBlob(decodedData, 'application/gzip');
                          const decompressed2 = Utilities.ungzip(blob2);
                          jsonData = decompressed2.getDataAsString();
                          console.log("Decompression successful with gzip content type");
                          try {
                            return JSON.parse(jsonData);
                          } catch (e) {
                            console.log(`Decompressed data is not valid JSON: ${e.message}`);
                          }
                        } catch (e2) {
                          console.log(`Method 2 failed: ${e2.message}`);
                          // Continue to next method
                        }
                        
                        // Method 3: Try with octet-stream content type
                        try {
                          const blob3 = Utilities.newBlob(decodedData, 'application/octet-stream');
                          const decompressed3 = Utilities.ungzip(blob3);
                          jsonData = decompressed3.getDataAsString();
                          console.log("Decompression successful with octet-stream content type");
                          try {
                            return JSON.parse(jsonData);
                          } catch (e) {
                            console.log(`Decompressed data is not valid JSON: ${e.message}`);
                          }
                        } catch (e3) {
                          console.log(`Method 3 failed: ${e3.message}`);
                        }
                        
                        // Method 4: Try re-encoding to base64 then decoding again (sometimes fixes corrupt base64)
                        try {
                          const reEncoded = Utilities.base64Encode(decodedData);
                          const reDecoded = Utilities.base64Decode(reEncoded);
                          const blob4 = Utilities.newBlob(reDecoded);
                          const decompressed4 = Utilities.ungzip(blob4);
                          jsonData = decompressed4.getDataAsString();
                          console.log("Decompression successful with re-encoded data");
                          try {
                            return JSON.parse(jsonData);
                          } catch (e) {
                            console.log(`Decompressed data is not valid JSON: ${e.message}`);
                          }
                        } catch (e4) {
                          console.log(`Method 4 failed: ${e4.message}`);
                        }
                      } catch (gzipError) {
                        console.log(`All decompression approaches failed: ${gzipError.message}`);
                      }
                    }
                    
                    // Final fallback: try parsing the original cached string directly (maybe it wasn't base64)
                    try {
                      console.log("Trying to parse original cached string directly as JSON");
                      const originalParsed = JSON.parse(cachedData);
                      console.log("Original string was valid JSON");
                      return originalParsed;
                    } catch (e) {
                      console.log(`Original string is not valid JSON: ${e.message}`);
                    }
                    
                    // Last resort: try to convert bytes to string and parse
                    try {
                      jsonData = Utilities.newBlob(decodedData).getDataAsString();
                      console.log("Converted bytes to string as fallback");
                      return JSON.parse(jsonData);
                    } catch (finalError) {
                      console.log(`Final fallback failed: ${finalError.message}`);
                      throw new Error("All data recovery methods failed");
                    }

                    // Validate we have actual data
                    if (!jsonData || jsonData.trim() === '') {
                      throw new Error("Retrieved empty data");
                    }

                    // Verify it's valid JSON
                    return JSON.parse(jsonData);
                  } catch (gzipError) {
                    throw new Error(`Data processing failed: ${gzipError.message || gzipError.toString()}`);
                  }
                } catch (e) {
                  console.log(`Error retrieving from cache or consistency check failed: ${e.message || e.toString()}`);
                  // If there's an error decompressing or parsing, or consistency check failed
                  // Invalidate the cache explicitly to prevent stale data
                  cache.remove(cacheKey);
                  cache.remove(metaKey);
                  // Fall through to fetching
                }
              } else {
                // We have metadata but no data - this is a stale/inconsistent state
                console.log(`Cache inconsistency detected for path "${path}": metadata exists but data missing`);
                cache.remove(metaKey); // Clean up orphaned metadata
              }
            } else {
              // Content hash mismatch, invalidate this cache entry
              console.log(`Cache entry for path "${path}" invalidated due to content mismatch`);
              cache.remove(cacheKey);
              cache.remove(metaKey);
            }
          } else {
            // Entry has expired, remove it
            console.log(`Cache entry for path "${path}" invalidated due to expiration`);
            cache.remove(cacheKey);
            cache.remove(metaKey);
          }
        } catch (e) {
          console.error(`Error parsing cache metadata: ${e.message}`);
          // Invalid metadata format, clean up
          cache.remove(metaKey);
          cache.remove(cacheKey);
        }
      }
    }
    
    // Extend the expiry even if not fetching but we have a valid cache hit
    if (config.extendCachePeriod && !config.bypassCache) {
      const metaData = cache.get(metaKey);
      if (metaData) {
        try {
          const meta = JSON.parse(metaData);
          
          // Determine if content matches based on expected content
          let contentMatch;
          if (cacheValidation === null) {
            // No content validation requested, consider it a match
            contentMatch = true;
          } else if (contentHash && meta.contentHash) {
            // Both hashes exist, check for exact match
            contentMatch = meta.contentHash === contentHash;
            if (!contentMatch) {
              console.log(`Content hash mismatch during expiry extension for path "${path}"`);
            }
          } else {
            // Missing hash information when expectedContent is provided
            contentMatch = false;
          }
          
          if (meta.expiresAt > now && contentMatch) {
            // Calculate new expiration
            const expiresAt = Math.max(meta.expiresAt, now + (expirationInSeconds * 1000));
            const actualExpirationSeconds = Math.ceil((expiresAt - now) / 1000);
            
            // Just update the metadata with the new expiry
            meta.expiresAt = expiresAt;
            meta.lastModified = now;
            
            // Store updated metadata
            cache.put(metaKey, JSON.stringify(meta), actualExpirationSeconds);
            
            // Also update the data with the new expiry
            const cachedData = cache.get(cacheKey);
            if (cachedData) {
              cache.put(cacheKey, cachedData, actualExpirationSeconds);
            }
            
            console.log(`Extended cache expiry for path "${path}" to ${new Date(expiresAt).toISOString()}`);
          }
        } catch (e) {
          console.error(`Error extending cache expiry: ${e.message}`);
        }
      }
    }
    
    // If we're here, either cache miss, bypass was set, content mismatch, or decompression failed
    // If no fetch function was provided, return undefined
    if (!fetchFunction) {
      return undefined;
    }
    
    try {
      // Call the provided function to get fresh data, passing the path, scope and options
      const fetchOptions = { 
        expectedContent: cacheValidation,
        extendCachePeriod: config.extendCachePeriod,
        existingMeta: null,  // Will be populated with existing metadata if extending
        cacheLevel: cacheLevel  // Pass the cache level (scope)
      };
      
      // Check for existing metadata for extension
      if (config.extendCachePeriod) {
        const metaData = cache.get(metaKey);
        if (metaData) {
          try {
            fetchOptions.existingMeta = JSON.parse(metaData);
          } catch (e) {
            console.log('Error parsing existing metadata:', e);
          }
        }
      }
      
      const fetchResult = fetchFunction(path, cacheLevel, fetchOptions);
      
      // Handle both direct return and object with data/content properties
      let freshData, updatedExpectedContent = cacheValidation, customExpiration = null;
      
      if (fetchResult && typeof fetchResult === 'object') {
        if ('data' in fetchResult) {
          // If the fetch function returns an object with data, use that
          freshData = fetchResult.data;
          
          // If content was returned, use it instead of the input content
          if ('content' in fetchResult) {
            updatedExpectedContent = fetchResult.content;
            if (updatedExpectedContent !== null) {
              contentHash = this._generateSecureHash(updatedExpectedContent);
            }
          }
          
          // Allow fetch function to specify a custom expiration
          if ('expiration' in fetchResult) {
            customExpiration = fetchResult.expiration;
          }
        } else {
          // Object without data property - treat as the data itself
          freshData = fetchResult;
        }
      } else {
        // Direct return value - just the data
        freshData = fetchResult;
      }
      
      // Convert to JSON string
      const jsonString = JSON.stringify(freshData);
      
      // Compress the data - with safer compression
      let compressedData, base64Data;
      let isCompressed = true; // Default to true unless compression fails
      
      try {
        // Create a blob with the JSON data
        const jsonBlob = Utilities.newBlob(jsonString, 'application/json');
        
        // Attempt to compress
        try {
          compressedData = Utilities.gzip(jsonBlob);
          base64Data = Utilities.base64Encode(compressedData.getBytes());
        } catch (compressionError) {
          // If compression fails, store uncompressed but mark it
          console.log(`Compression failed, storing uncompressed: ${compressionError.message || compressionError.toString()}`);
          compressedData = jsonBlob;
          base64Data = Utilities.base64Encode(jsonString.getBytes ? jsonString.getBytes() : 
                                            Utilities.newBlob(jsonString).getBytes());
          
          // Flag that this is not compressed
          isCompressed = false;
        }
      } catch (e) {
        console.error(`Error during compression: ${e.message || e.toString()}`);
        throw e;
      }
      
      // Check if we need to extend an existing cache entry
      let existingMeta = null;
      if (config.extendCachePeriod) {
        const metaData = cache.get(metaKey);
        if (metaData) {
          try {
            existingMeta = JSON.parse(metaData);
          } catch (e) {
            console.log('Error parsing existing metadata, will create new entry:', e);
          }
        }
      }
      
      // Check if the compressed data exceeds the max size limit
      if (base64Data.length <= config.maxSizeBytes) {
        // Calculate expiration timestamp
        let expiresAt;
        
        // Check for custom expiration from fetch function
        let finalExpirationInSeconds = expirationInSeconds;
        if (customExpiration !== null) {
          finalExpirationInSeconds = this._parseDuration(customExpiration);
          console.log(`Using custom expiration from fetch function: ${customExpiration} (${finalExpirationInSeconds} seconds)`);
        }
        
        if (existingMeta && config.extendCachePeriod) {
          // Extend existing cache period
          expiresAt = existingMeta.expiresAt;
          if (finalExpirationInSeconds > 0) {
            // Add new expiration time to current time (not to old expiration)
            const newExpiresAt = now + (finalExpirationInSeconds * 1000);
            // Take the later of the two expiration times
            expiresAt = Math.max(expiresAt, newExpiresAt);
          }
        } else {
          // Standard expiration calculation
          expiresAt = now + (finalExpirationInSeconds * 1000);
        }
        
        // Store metadata with content hash if provided
        const transactionId = Utilities.getUuid(); // Generate unique transaction ID
        const timestamp = now;
        
        const meta = {
          path: path,
          createdAt: timestamp,
          expiresAt: expiresAt,
          size: base64Data.length,
          contentHash: contentHash,
          transactionId: transactionId,
          lastModified: timestamp,
          isCompressed: isCompressed  // Store compression state
        };
        
        // Actual cache put with calculated expiration
        const actualExpirationSeconds = Math.ceil((expiresAt - now) / 1000);
        
        // Atomic write pattern - use a transaction approach
        try {
          // First, write the data
          cache.put(cacheKey, base64Data, actualExpirationSeconds);
          
          // Then, write the metadata (which includes the transaction ID)
          cache.put(metaKey, JSON.stringify(meta), actualExpirationSeconds);
          
          // Verify the write if strict consistency is enabled
          if (config.strictConsistency) {
            // Read back metadata to verify
            const verifyMeta = cache.get(metaKey);
            if (!verifyMeta) {
              throw new Error("Failed to verify metadata write");
            }
            
            // Read back data to verify (just the presence, not the full content)
            const verifyData = cache.get(cacheKey);
            if (!verifyData) {
              throw new Error("Failed to verify data write");
            }
            
            // Parse metadata to verify transaction ID
            const parsedMeta = JSON.parse(verifyMeta);
            if (parsedMeta.transactionId !== transactionId) {
              throw new Error("Transaction ID mismatch in verification");
            }
          }
        } catch (cacheError) {
          // If any part of the write or verification fails, clean up to prevent inconsistency
          console.error(`Cache write or verification failed: ${cacheError.message}`);
          cache.remove(cacheKey);
          cache.remove(metaKey);
        }
      } else {
        console.log(`Data for path "${path}" exceeds max size limit (${base64Data.length} bytes) and was not cached`);
      }
      
      return freshData;
    } catch (e) {
      console.error(`Error fetching or caching data for path "${path}":`, e);
      throw e; // Rethrow to let the caller handle it
    }
  },
  
  /**
   * Shorthand alias for getOrFetchWithCache
   */
  get: function(path, fetchFunction, cacheValidation = null, cacheLevel = 'DOCUMENT', options = {}) {
    return this.getOrFetchWithCache(path, fetchFunction, cacheValidation, cacheLevel, options);
  },
  
  /**
   * Verifies if the cache for a given path is valid based on its content
   * 
   * @param {string} path - The path to check
   * @param {string} cacheValidation - The expected content to validate against (can be null)
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   * @param {boolean} verifyConsistency - Whether to do deeper consistency checks (default: true)
   * @returns {boolean} True if valid, false if invalid or not found
   */
  isCacheValid: function(path, cacheValidation, cacheLevel = 'DOCUMENT', verifyConsistency = true) {
    const hashHex = this._generateSecureHash(path);
    const cacheKey = `jspath_json_cache_${hashHex}`;
    const metaKey = `jspath_meta_${hashHex}`;
    const cache = this._getCacheService(cacheLevel);
    
    const metaData = cache.get(metaKey);
    if (!metaData) {
      return false;
    }
    
    try {
      const meta = JSON.parse(metaData);
      const now = new Date().getTime();
      
      // Always check if entry has expired
      const validExpiration = meta.expiresAt > now;
      
      // Check content hash only if expectedContent is provided
      let validContent = true;
      if (cacheValidation !== null) {
        const contentHash = this._generateSecureHash(cacheValidation);
        validContent = meta.contentHash === contentHash;
      }
      
      // For deeper consistency checks
      let consistencyValid = true;
      if (verifyConsistency) {
        // Check for transaction ID
        if (!meta.transactionId) {
          consistencyValid = false;
        } else {
          // Verify data exists
          const dataExists = cache.get(cacheKey) !== null;
          consistencyValid = dataExists;
        }
      }
      
      return validExpiration && validContent && consistencyValid;
    } catch (e) {
      console.error("Error checking cache validity:", e);
      return false;
    }
  },
  
  /**
   * Force refreshes the cache for a path with new data, regardless of current state
   * Ensures atomicity and consistency
   * 
   * @param {string} path - The path to refresh
   * @param {Object|Function} data - The new data or function that returns the data
   * @param {string} expectedContent - Expected content for the data
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   * @param {Object} options - Cache options (same as getOrFetchWithCache)
   * @returns {Object} The data that was cached
   */
  forceRefresh: function(path, data, expectedContent = null, cacheLevel = 'DOCUMENT', options = {}) {
    // Clear existing cache first
    this.clearCacheForPath(path, cacheLevel);
    
    // If data is a function, call it to get the actual data
    const actualData = typeof data === 'function' ? data(path) : data;
    
    // Create a simple fetch function that returns the provided data
    const fetchFn = () => actualData;
    
    // Force bypass cache and store new data
    const refreshOptions = {
      ...options,
      bypassCache: false,  // Force fetch
      strictConsistency: true  // Ensure consistency
    };
    
    // Store and return the data
    return this.getOrFetchWithCache(path, fetchFn, expectedContent, cacheLevel, refreshOptions);
  },
  
  /**
   * Gets cached data safely, guaranteeing fresh data
   * If data exists in cache and is valid, returns it
   * Otherwise returns null (allowing caller to decide what to do)
   * 
   * @param {string} path - The path to get
   * @param {string} expectedContent - Expected content for validation
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   * @returns {Object|null} The cached data or null if not found/invalid
   */
  getSafe: function(path, expectedContent = null, cacheLevel = 'DOCUMENT') {
    const hashHex = this._generateSecureHash(path);
    const cacheKey = `jspath_json_cache_${hashHex}`;
    const metaKey = `jspath_meta_${hashHex}`;
    const cache = this._getCacheService(cacheLevel);
    
    // First validate the cache entry
    if (!this.isCacheValid(path, expectedContent, cacheLevel, true)) {
      return null;
    }
    
    // Get the data from cache
    const cachedData = cache.get(cacheKey);
    if (!cachedData) {
      return null;
    }
    
    try {
      // Validate the cached data format before attempting decompression
      if (!cachedData || typeof cachedData !== 'string' || cachedData.trim() === '') {
        return null;
      }
      
      // Get metadata
      const metaData = cache.get(metaKey);
      let meta = null;
      if (metaData) {
        try {
          meta = JSON.parse(metaData);
        } catch (e) {
          console.error("Error parsing metadata in getSafe:", e);
        }
      }
      
      // Safely decode base64
      let decodedData;
      try {
        decodedData = Utilities.base64Decode(cachedData);
        if (!decodedData || decodedData.length === 0) {
          throw new Error("Base64 decoding resulted in empty data");
        }
      } catch (decodeError) {
        console.error(`Base64 decoding failed: ${decodeError.message}`);
        cache.remove(cacheKey);
        cache.remove(metaKey);
        return null;
      }
      
      // Create blob and attempt to decompress with fallback
      let jsonData;
      try {
        // First check metadata compression flag if available
        let isCompressed = false;
        if (meta && typeof meta.isCompressed !== 'undefined') {
          isCompressed = meta.isCompressed;
          console.log(`getSafe: Using metadata isCompressed flag: ${isCompressed}`);
        } else {
          // Then perform magic number check as backup
          try {
            // More careful check for gzip magic numbers
            if (decodedData && decodedData.length > 2) {
              // Apply bitmask to ensure proper byte comparison
              isCompressed = (decodedData[0] & 0xFF) === 31 && (decodedData[1] & 0xFF) === 139;
              console.log(`getSafe: Magic number check: bytes [${(decodedData[0] & 0xFF)}, ${(decodedData[1] & 0xFF)}], isGzipped: ${isCompressed}`);
            }
          } catch (magicNumberError) {
            console.log(`getSafe: Error checking magic numbers: ${magicNumberError.message}`);
            isCompressed = false;
          }
        }

        // Log the data type for debugging
        console.log(`getSafe: Data appears to be ${isCompressed ? 'compressed' : 'uncompressed'}`);
        
        // First approach: assume data is intended to be JSON
        try {
          // Try direct string conversion first (no decompression)
          const directString = Utilities.newBlob(decodedData).getDataAsString();
          // Check if it's valid JSON
          try {
            const parsedJson = JSON.parse(directString);
            console.log("getSafe: Successfully parsed JSON directly from bytes");
            return parsedJson;
          } catch (jsonError) {
            console.log(`getSafe: Direct JSON parsing failed: ${jsonError.message}`);
            // Not valid JSON, continue to decompression attempts
          }
        } catch (directError) {
          console.log(`getSafe: Direct string conversion failed: ${directError.message}`);
        }

        // Second approach: try various decompression methods if the data seems compressed
        if (isCompressed) {
          try {
            // DEFENSIVE APPROACH: Try multiple ways to decompress the data
            
            // Method 1: Try with no content type
            try {
              const blob1 = Utilities.newBlob(decodedData);
              const decompressed1 = Utilities.ungzip(blob1);
              jsonData = decompressed1.getDataAsString();
              console.log("getSafe: Decompression successful with no content type");
              try {
                return JSON.parse(jsonData);
              } catch (e) {
                console.log(`getSafe: Decompressed data is not valid JSON: ${e.message}`);
              }
            } catch (e1) {
              console.log(`getSafe: Method 1 failed: ${e1.message}`);
              // Continue to next method
            }
            
            // Method 2: Try with gzip content type
            try {
              const blob2 = Utilities.newBlob(decodedData, 'application/gzip');
              const decompressed2 = Utilities.ungzip(blob2);
              jsonData = decompressed2.getDataAsString();
              console.log("getSafe: Decompression successful with gzip content type");
              try {
                return JSON.parse(jsonData);
              } catch (e) {
                console.log(`getSafe: Decompressed data is not valid JSON: ${e.message}`);
              }
            } catch (e2) {
              console.log(`getSafe: Method 2 failed: ${e2.message}`);
              // Continue to next method
            }
            
            // Method 3: Try with octet-stream content type
            try {
              const blob3 = Utilities.newBlob(decodedData, 'application/octet-stream');
              const decompressed3 = Utilities.ungzip(blob3);
              jsonData = decompressed3.getDataAsString();
              console.log("getSafe: Decompression successful with octet-stream content type");
              try {
                return JSON.parse(jsonData);
              } catch (e) {
                console.log(`getSafe: Decompressed data is not valid JSON: ${e.message}`);
              }
            } catch (e3) {
              console.log(`getSafe: Method 3 failed: ${e3.message}`);
            }
            
            // Method 4: Try re-encoding to base64 then decoding again (sometimes fixes corrupt base64)
            try {
              const reEncoded = Utilities.base64Encode(decodedData);
              const reDecoded = Utilities.base64Decode(reEncoded);
              const blob4 = Utilities.newBlob(reDecoded);
              const decompressed4 = Utilities.ungzip(blob4);
              jsonData = decompressed4.getDataAsString();
              console.log("getSafe: Decompression successful with re-encoded data");
              try {
                return JSON.parse(jsonData);
              } catch (e) {
                console.log(`getSafe: Decompressed data is not valid JSON: ${e.message}`);
              }
            } catch (e4) {
              console.log(`getSafe: Method 4 failed: ${e4.message}`);
            }
          } catch (gzipError) {
            console.log(`getSafe: All decompression approaches failed: ${gzipError.message}`);
          }
        }
        
        // Final fallback: try parsing the original cached string directly (maybe it wasn't base64)
        try {
          console.log("getSafe: Trying to parse original cached string directly as JSON");
          const originalParsed = JSON.parse(cachedData);
          console.log("getSafe: Original string was valid JSON");
          return originalParsed;
        } catch (e) {
          console.log(`getSafe: Original string is not valid JSON: ${e.message}`);
        }
        
        // Last resort: try to convert bytes to string and parse
        try {
          jsonData = Utilities.newBlob(decodedData).getDataAsString();
          console.log("getSafe: Converted bytes to string as fallback");
          return JSON.parse(jsonData);
        } catch (finalError) {
          console.log(`getSafe: Final fallback failed: ${finalError.message}`);
          throw new Error("All data recovery methods failed");
        }

        // Validate we have actual data
        if (!jsonData || jsonData.trim() === '') {
          throw new Error("Retrieved empty data");
        }

        // Verify it's valid JSON and return
        return JSON.parse(jsonData);
      } catch (gzipError) {
        console.error(`Data processing failed in getSafe: ${gzipError.message || gzipError.toString()}`);
        cache.remove(cacheKey);
        cache.remove(metaKey);
        return null;
      }
    } catch (e) {
      // Clean up invalid cache entries
      console.error(`Error retrieving from cache: ${e.message || e.toString()}`);
      cache.remove(cacheKey);
      cache.remove(metaKey);
      return null;
    }
  },
  
  /**
   * Clears a specific cached item by path
   * 
   * @param {string} path - The path to clear from cache
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   */
  clearCacheForPath: function(path, cacheLevel = 'DOCUMENT') {
    const hashHex = this._generateSecureHash(path);
    const cacheKey = `jspath_json_cache_${hashHex}`;
    const metaKey = `jspath_meta_${hashHex}`;
    
    const cache = this._getCacheService(cacheLevel);
    cache.remove(cacheKey);
    cache.remove(metaKey);
  },
  
  /**
   * Removes all expired cache entries (for maintenance purposes)
   * This removes any entries whose metadata indicates they have expired
   * 
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT' (default: 'DOCUMENT')
   * @param {Object} options - Optional parameters
   * @param {Array<string>} options.pathList - List of paths to check (if you maintain this externally)
   */
  cleanExpiredEntries: function(cacheLevel = 'DOCUMENT', options = {}) {
    const cache = this._getCacheService(cacheLevel);
    const now = new Date().getTime();
    
    // If a list of paths is provided, check those specifically
    if (options.pathList && Array.isArray(options.pathList)) {
      options.pathList.forEach(path => {
        const hashHex = this._generateSecureHash(path);
        const cacheKey = `jspath_json_cache_${hashHex}`;
        const metaKey = `jspath_meta_${hashHex}`;
        
        const metaData = cache.get(metaKey);
        if (metaData) {
          try {
            const meta = JSON.parse(metaData);
            if (meta.expiresAt <= now) {
              cache.remove(cacheKey);
              cache.remove(metaKey);
              console.log(`Removed expired cache entry for path: ${path}`);
            }
          } catch (e) {
            console.error(`Error parsing metadata for path ${path}:`, e);
            // Clean up invalid metadata
            cache.remove(metaKey);
            cache.remove(cacheKey);
          }
        }
      });
    } else {
      console.log('No path list provided for cleaning expired entries');
      // Note: Unfortunately, Google Apps Script's CacheService doesn't provide a way to 
      // list all keys, so we can't automatically clean all expired entries.
      // You would need to maintain a separate list of all cache keys you've created.
    }
  },
  
  // ===== INTERNAL METHODS (prefixed with _) =====
  
  /**
   * Parses a duration string into seconds
   * Supports formats like: "30s", "5m", "2h", "1d", "1w"
   * Also accepts floating point values like "1.5h"
   * 
   * @private
   * @param {string|number} duration - Duration string (e.g., "30m", "6h", "1d") or seconds
   * @returns {number} Duration in seconds (rounded to nearest second)
   */
  _parseDuration: function(duration) {
    if (typeof duration === 'number') {
      return Math.round(duration); // Round to nearest second
    }
    
    const regex = /^(\d*\.?\d+)([smhdw])$/;
    const match = duration.match(regex);
    
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}. Use formats like "30s", "5m", "2h", "1d", "1w"`);
    }
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    let seconds;
    switch (unit) {
      case 's': seconds = value; break;                             // Seconds
      case 'm': seconds = value * 60; break;                        // Minutes
      case 'h': seconds = value * 60 * 60; break;                   // Hours
      case 'd': seconds = value * 24 * 60 * 60; break;              // Days
      case 'w': seconds = value * 7 * 24 * 60 * 60; break;          // Weeks
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
    
    return Math.round(seconds); // Round to nearest second
  },
  
  /**
   * Generates a secure SHA-256 hash from a string
   * 
   * @private
   * @param {string} input - The string to hash
   * @returns {string} The hex string representation of the hash
   */
  _generateSecureHash: function(input) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      input,
      Utilities.Charset.UTF_8
    );
    
    return bytes.map(function(byte) {
      // Convert to hexadecimal and ensure two digits
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  },
  
  /**
   * Gets the appropriate cache service based on the specified level
   * 
   * @private
   * @param {string} cacheLevel - Cache level: 'USER', 'SCRIPT', 'DOCUMENT'
   * @returns {Cache} The cache service instance
   */
  _getCacheService: function(cacheLevel) {
    switch (cacheLevel) {
      case 'USER':
        return CacheService.getUserCache();
      case 'SCRIPT':
        return CacheService.getScriptCache();
      case 'DOCUMENT':
      default:
        return CacheService.getDocumentCache();
    }
  }
}


module.exports = { 
  cache, 
  isMissing,
  substituteTree,
  substitute,
  eval,
  llmStringify,
  isMissingSubstitute,
  apply,
  fetch,
  parsePath,
  fmt,
  snippet,
} ;


  ///////// END USER CODE /////////
}


// Initialize this module using the shim
initModule('jspath/jspath.js', _main, (() => { try { return module } catch { return null } })(), false);